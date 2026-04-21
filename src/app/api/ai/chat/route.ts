import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { anthropic } from "@/lib/ai";
import { AI_TOOLS, executeAITool } from "@/lib/ai-tools";
import { hasPermission } from "@/lib/permissions";
import { rateLimit, RATE_LIMITS, rateLimitHeaders } from "@/lib/rate-limit";
import { db } from "@/lib/db";
import type { Role } from "@/generated/prisma/client";

// Human-readable status messages for each tool call
function getToolStatus(toolName: string, input: Record<string, unknown>): string {
  const q = (input.query as string) || (input.item_name as string) || "";
  const label = q ? ` for "${q}"` : "";
  switch (toolName) {
    case "search_assets":          return `Searching assets${label}…`;
    case "search_consumables":     return `Checking stock${label}…`;
    case "search_users":           return `Looking up staff${label}…`;
    case "get_inventory_insights": return "Analyzing inventory…";
    case "list_regions":           return "Loading regions…";
    case "compare_regions":        return "Comparing regions…";
    case "view_purchase_orders":   return "Loading purchase orders…";
    case "view_activity_log":      return "Loading activity log…";
    case "check_staff_equipment":  return "Checking staff equipment…";
    case "get_overdue_inspections":return "Checking inspections…";
    case "create_asset":           return `Creating asset${input.name ? ` "${input.name}"` : ""}…`;
    case "create_consumable":      return `Adding consumable${input.name ? ` "${input.name}"` : ""}…`;
    case "create_purchase_order":  return `Creating PO${input.consumable_name ? ` for ${input.consumable_name}` : ""}…`;
    case "update_asset":           return "Updating asset…";
    case "update_consumable":      return "Updating supply…";
    case "bulk_update_assets":     return "Bulk-updating assets…";
    case "adjust_stock":           return "Adjusting stock levels…";
    case "approve_purchase_order": return "Approving purchase order…";
    case "mark_po_received":       return "Marking PO received…";
    case "verify_return":          return "Verifying return…";
    case "create_damage_report":   return "Filing damage report…";
    case "resolve_damage_report":  return "Resolving damage report…";
    case "deactivate_user":        return "Deactivating user…";
    case "create_user":            return "Creating user account…";
    case "reset_user_password":    return "Resetting password…";
    case "assign_starter_kit":     return "Assigning starter kit…";
    case "schedule_inspection":    return "Scheduling inspection…";
    case "manage_category":        return "Managing category…";
    case "bulk_assign_consumables":return "Bulk-assigning consumables…";
    case "move_asset_to_region":   return "Moving asset…";
    case "move_consumable_to_region": return "Moving consumable…";
    case "copy_photo":             return "Copying photos…";
    case "delete_asset":           return "Deleting asset…";
    case "create_region":          return "Creating region…";
    case "create_state":           return "Creating state…";
    case "update_region":          return "Updating region…";
    default:                       return "Working on it…";
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limit AI chat — 10 requests per minute per user
  const rl = await rateLimit(`ai-chat:${session.user.id}`, RATE_LIMITS.aiChat);
  if (!rl.success) {
    return Response.json(
      { error: "Too many requests. Please wait a moment." },
      { status: 429, headers: rateLimitHeaders(rl) }
    );
  }

  // Check per-org AI usage limit
  const organizationId = session.user.organizationId;
  if (organizationId) {
    const org = await db.organization.findUnique({
      where: { id: organizationId },
      select: { aiRequestsUsed: true, aiRequestsLimit: true, aiResetDate: true },
    });
    if (org) {
      const now = new Date();
      const resetDate = org.aiResetDate ? new Date(org.aiResetDate) : null;
      if (
        !resetDate ||
        now.getMonth() !== resetDate.getMonth() ||
        now.getFullYear() !== resetDate.getFullYear()
      ) {
        await db.organization.update({
          where: { id: organizationId },
          data: { aiRequestsUsed: 0, aiResetDate: now },
        });
      } else if (org.aiRequestsUsed >= org.aiRequestsLimit) {
        return Response.json(
          {
            error: `Your organisation has reached its monthly AI limit (${org.aiRequestsLimit} requests). Contact your administrator to upgrade.`,
          },
          { status: 429 }
        );
      }
    }
  }

  const { messages } = (await request.json()) as {
    messages: { role: "user" | "assistant"; content: string }[];
  };

  const userRole = session.user.role as Role;

  const AI_MANAGEMENT_TOOLS = [
    "create_asset", "create_consumable", "create_purchase_order", "suggest_category",
    "update_asset", "update_consumable", "adjust_stock", "delete_asset", "assign_asset",
    "move_asset_to_region", "move_consumable_to_region", "copy_photo",
    "create_user", "deactivate_user", "reset_user_password",
    "approve_purchase_order", "mark_po_received", "verify_return",
    "schedule_inspection", "create_damage_report",
    "bulk_update_assets", "bulk_assign_consumables", "bulk_apply_items",
    "toggle_permission", "manage_category", "update_region", "assign_starter_kit",
    "create_region", "create_state",
    "approve_consumable_request", "create_maintenance_schedule", "create_starter_kit", "resolve_damage_report",
  ];
  let canUseAIManagement = false;

  if (userRole === "SUPER_ADMIN") {
    canUseAIManagement = true;
  } else if (userRole === "BRANCH_MANAGER") {
    canUseAIManagement = await hasPermission(session.user.id, userRole, "aiAssetCreate");
  }

  const availableTools = canUseAIManagement
    ? AI_TOOLS
    : AI_TOOLS.filter((t) => !AI_MANAGEMENT_TOOLS.includes(t.name));

  const isSuperAdminUser = userRole === "SUPER_ADMIN";

  const managementNote = canUseAIManagement
    ? `${isSuperAdminUser ? "You are serving a SUPER ADMIN with full access. Always confirm before deleting or bulk-modifying data. For destructive actions (delete, bulk update, reset), ask 'Are you sure?' before proceeding.\n\n" : ""}You have FULL management capabilities — 37 tools available:
- SEARCH: Find assets, consumables, users. Results include cost, supplier, description, photos. Filter by region.
- REGIONS: list_regions, compare_regions, update_region, create_region, create_state. Create new locations and states.
- CREATE: Assets (single/bulk), consumables, POs, users, damage reports, categories. Use suggest_category first.
- UPDATE: Asset/consumable details, move items between regions, copy photos between ALL matching items, rename categories.
- STOCK: Add/deduct consumable stock. Bulk assign consumables to all staff in a region.
- USERS: Create accounts, deactivate, reset passwords, check staff equipment, assign starter kits.
- PURCHASE ORDERS: Approve/reject pending POs, mark as received (auto-restocks).
- RETURNS: Verify returned items (auto-restocks).
- INSPECTIONS: Schedule inspections with due dates, check who is overdue.
- BULK OPS: Update multiple assets by filter, apply standard items to empty regions, copy photos to all matching items.
- PERMISSIONS: Toggle any branch manager permission on/off.
- AUDIT: View activity log, search audit trail.

IMPORTANT RULES:
- ALWAYS confirm before acting. For ANY action (create, update, delete, approve, adjust stock, assign, schedule, etc.), first describe exactly what you are about to do and ask "Would you like me to proceed?" — wait for the user to say yes/confirm/proceed before using any tool that modifies data.
- Read-only tools (search, list, view, compare, check, inspect) can be used freely without confirmation.
- For multi-step tasks, summarise ALL planned steps upfront in one confirmation message, then execute them all once the user confirms.
- copy_photo updates ALL items with that name (not just one). State this clearly in your confirmation.
- Always search first so you can name the exact record(s) you will change in your confirmation message.
- Use region filters when the user mentions a specific location.
- If the user says "undo" or "revert", describe the reversal and ask for confirmation before executing.`
    : "You can READ data and provide insights. Use list_regions to see all locations, compare_regions to compare them, and add a region filter to any search to narrow by location. For creating or modifying assets, direct users to the appropriate page in the app.";

  const systemPrompt = `You are the AI assistant for "trackio", an internal asset and consumable tracking system. You help staff find assets, check inventory status, get insights, manage inventory, and answer questions.

Current user: ${(session.user.name || session.user.email || "").replace(/["\`'\\\n\r]/g, "")}
Role: ${session.user.role}
${session.user.regionId ? "Region: restricted to their assigned region only" : "Region: all regions (Super Admin)"}

Capabilities:
${managementNote}

Guidelines:
- Be concise and helpful. Use plain language.
- Format search results clearly with key details.
- Highlight actionable items (low stock, overdue returns).
- If you can't find something, say so clearly.
- Before executing ANY action that modifies data, search for the relevant record(s) first, then tell the user exactly what will happen (what record, what change) and ask "Would you like me to proceed?" — only execute after they confirm with yes/proceed/confirm.
- Read-only queries (searching, listing, viewing insights) do not need confirmation — respond immediately.
- If the user says "undo" or "revert", describe exactly what the reversal will do and ask to confirm before executing.
- Respect the user's role permissions — some actions are Super Admin only.
- All changes are logged in the audit trail.

COMMON TROUBLESHOOTING (answer these if asked):
- Starter kit only assigned some items? Category names in the kit must EXACTLY match asset categories in the system. Also, consumables are matched by name in the staff's region — if the region doesn't have that consumable, it's skipped. Use "Apply Standard Items" on empty locations first.
- Items showing as "Pending"? Assets stay Available until staff confirms receipt on their dashboard. Only then does status change to Assigned.
- Need consumables in every location? Yes — kits find consumables by name in the staff's specific region. Use "Apply Standard Items" in Inventory for new locations.
- Health Score low? Hover over it to see the breakdown. Points deducted for: low stock (-5 each), overdue returns (-4 each), unresolved damage (-5 each), overdue inspections (-5 each), pending requests (-2 each).
- Can't find an item? Try searching by name, code, or category. Check if the correct region is selected. The item might be in a different location.
- Voice input not working? Check browser microphone permissions. Works on Chrome, Edge, Safari. Not supported on Firefox.
- Condition check frequency? Super Admins can set per-staff schedules: Fortnightly, Monthly (default), Quarterly, or 6-Monthly. Go to Condition Checks → Staff Schedules. After a staff member completes all checks, the next due date auto-advances based on frequency.
- Staff not seeing condition checks? They only appear when a) the staff has items in inspection-enabled categories, and b) if on a custom schedule, they're within their active period. Check Condition Checks → Staff Schedules.
- How to delete assets/consumables? Only AVAILABLE (unassigned) items can be deleted. Select items with checkboxes → click "Delete Selected" → confirm in the dialog. This cannot be undone.
- How to archive a location? In Inventory, click the archive icon (↓) on a region card → confirm. All assets/consumables/staff are preserved but hidden. Restore anytime from "Archived Locations" at the bottom of the Inventory page.
- How to download a backup? Go to Admin → Backup → click "Download All". You get 4 CSV files (assets, consumables, staff, regions) that can be re-imported via Admin → Import Data.
- What plans are available? Free (3 users, 50 assets), Admin $47/mo (15 users, 500 assets), Professional $79/mo (75 users, 2000 assets), Enterprise (custom, unlimited). View at Admin → Billing.
- How to customise the dashboard? Click the settings gear icon → toggle any widget on/off (stat cards, operations overview, portfolio, charts, regional breakdown, map, quick links). Drag sections to reorder.
- Purchase orders showing wrong priority? PO page defaults to Pending tab with regions sorted by most outstanding orders first. Each tab shows a count badge. On mobile, tabs appear as a dropdown.
- How does pull-to-refresh work? On the staff dashboard (mobile), pull down from the top to refresh data.
- Bottom navigation on mobile? Staff users see a bottom tab bar (Home, Assets, Request, Help) for quick access on mobile/tablet.`;

  // ── SSE streaming response ───────────────────────────────────────────────
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: Record<string, unknown>) =>
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
        );

      try {
        let currentMessages = messages.map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        }));

        let toolsUsed = false;
        const READ_ONLY_TOOLS = new Set([
          "search_assets", "search_consumables", "search_users",
          "get_inventory_insights", "suggest_category", "view_purchase_orders",
          "list_regions", "compare_regions", "check_staff_equipment",
          "get_overdue_inspections", "view_activity_log",
        ]);

        // Tool-use loop (max 10 iterations)
        for (let i = 0; i < 10; i++) {
          const response = await anthropic.messages.create({
            model: "claude-sonnet-4-20250514",
            max_tokens: 2048,
            system: systemPrompt,
            messages: currentMessages,
            tools: availableTools,
          });

          const hasToolUse = response.content.some((b) => b.type === "tool_use");

          if (!hasToolUse) {
            // Final response — extract text and send
            let finalText = "";
            for (const block of response.content) {
              if (block.type === "text") finalText += block.text;
            }

            // Increment AI usage counter
            if (organizationId) {
              await db.organization
                .update({
                  where: { id: organizationId },
                  data: { aiRequestsUsed: { increment: 1 } },
                })
                .catch(() => {});
            }

            send({ text: finalText.trim(), done: true, dataChanged: toolsUsed });
            break;
          }

          // Execute each tool call and emit status events
          currentMessages.push({
            role: "assistant",
            content: response.content as never,
          });

          const toolResults: {
            type: "tool_result";
            tool_use_id: string;
            content: string;
          }[] = [];

          for (const block of response.content) {
            if (block.type !== "tool_use") continue;

            if (!READ_ONLY_TOOLS.has(block.name)) toolsUsed = true;

            // Send a human-readable status to the client
            send({ status: getToolStatus(block.name, block.input as Record<string, unknown>) });

            const result = await executeAITool(
              block.name,
              block.input as Record<string, unknown>,
              session.user.role as "SUPER_ADMIN" | "BRANCH_MANAGER" | "STAFF",
              session.user.regionId ?? null,
              session.user.id,
              session.user.organizationId ?? undefined
            );

            toolResults.push({
              type: "tool_result",
              tool_use_id: block.id,
              content: result,
            });
          }

          currentMessages.push({ role: "user", content: toolResults as never });
        }
      } catch (error) {
        console.error("AI chat error:", error);
        send({ error: "Failed to process request. Please try again." });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

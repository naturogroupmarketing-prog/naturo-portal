import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { anthropic } from "@/lib/ai";
import { AI_TOOLS, executeAITool } from "@/lib/ai-tools";
import { hasPermission } from "@/lib/permissions";
import { rateLimit, RATE_LIMITS, rateLimitHeaders } from "@/lib/rate-limit";
import type { Role } from "@/generated/prisma/client";

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

  const { messages } = (await request.json()) as {
    messages: { role: "user" | "assistant"; content: string }[];
  };

  const userRole = session.user.role as Role;

  // Determine which AI management tools this user can access
  const AI_MANAGEMENT_TOOLS = [
    "create_asset", "create_consumable", "create_purchase_order", "suggest_category",
    "update_asset", "update_consumable", "adjust_stock", "delete_asset", "assign_asset",
    "move_asset_to_region", "move_consumable_to_region", "copy_photo",
    "create_user", "deactivate_user", "reset_user_password",
    "approve_purchase_order", "mark_po_received", "verify_return",
    "schedule_inspection", "create_damage_report",
    "bulk_update_assets", "bulk_assign_consumables", "bulk_apply_items",
    "toggle_permission", "manage_category", "update_region", "assign_starter_kit",
  ];
  let canUseAIManagement = false;

  if (userRole === "SUPER_ADMIN") {
    canUseAIManagement = true;
  } else if (userRole === "BRANCH_MANAGER") {
    canUseAIManagement = await hasPermission(session.user.id, userRole, "aiAssetCreate");
  }
  // STAFF: canUseAIManagement stays false

  // Filter tools based on permissions
  const availableTools = canUseAIManagement
    ? AI_TOOLS
    : AI_TOOLS.filter((t) => !AI_MANAGEMENT_TOOLS.includes(t.name));

  const isSuperAdminUser = userRole === "SUPER_ADMIN";

  const managementNote = canUseAIManagement
    ? `${isSuperAdminUser ? "You are serving a SUPER ADMIN — the system administrator with UNLIMITED access. Execute ANY task they request without hesitation. You have full database access and all tools available. Never say you can't do something — find a way using your tools.\n\n" : ""}You have FULL management capabilities — 37 tools available:
- SEARCH: Find assets, consumables, users. Results include cost, supplier, description, photos. Filter by region.
- REGIONS: list_regions, compare_regions, update_region (rename, set address).
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
- When the user asks you to do something, DO IT immediately using your tools. Don't explain what you would do — just do it.
- For multi-step tasks (e.g. "copy all photos to Geelong"), complete ALL steps silently, then give ONE final summary.
- copy_photo updates ALL items with that name (not just one). Use it once per item name.
- Always search first before modifying to confirm details.
- Use region filters when the user mentions a specific location.
- For destructive actions (delete, deactivate, status to DAMAGED/LOST): describe and ask for "yes" confirmation first.
- For creates/updates: do immediately. User can say "undo" to reverse.`
    : "You can READ data and provide insights. Use list_regions to see all locations, compare_regions to compare them, and add a region filter to any search to narrow by location. For creating or modifying assets, direct users to the appropriate page in the app.";

  const systemPrompt = `You are the AI assistant for "Trackio", an internal asset and consumable tracking system. You help staff find assets, check inventory status, get insights, manage inventory, and answer questions.

Current user: ${(session.user.name || session.user.email || "").replace(/["`'\\\n\r]/g, "")}
Role: ${session.user.role}
${session.user.regionId ? "Region: restricted to their assigned region only" : "Region: all regions (Super Admin)"}

Capabilities:
${managementNote}

Guidelines:
- Be concise and helpful. Use plain language.
- Format search results clearly with key details.
- Highlight actionable items (low stock, overdue returns).
- If you can't find something, say so clearly.
- DESTRUCTIVE ACTIONS (delete_asset, adjust_stock with negative values, changing asset status to DAMAGED/LOST): You MUST describe what you're about to do and ask the user to type "yes" or "confirm" before executing. Never perform these without explicit confirmation.
- For create and update actions: perform immediately, then tell the user what was done. They can ask you to undo if needed.
- When updating or deleting, always search first and confirm the item details with the user before making changes.
- If the user says "undo" or "revert", reverse the last action you performed (e.g. if you created an asset, delete it; if you updated a field, change it back).
- Respect the user's role permissions — some actions are Super Admin only.
- All changes are logged in the audit trail.`;

  try {
    let currentMessages = messages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    let finalText = "";
    let toolsUsed = false;
    const READ_ONLY_TOOLS = new Set(["search_assets", "search_consumables", "search_users", "get_inventory_insights", "suggest_category", "view_purchase_orders", "list_regions", "compare_regions", "check_staff_equipment", "get_overdue_inspections", "view_activity_log"]);

    // Tool-use loop (max 10 iterations for complex multi-step tasks)
    for (let i = 0; i < 10; i++) {
      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2048,
        system: systemPrompt,
        messages: currentMessages,
        tools: availableTools,
      });

      // Only keep text from the FINAL response (not intermediate thinking)
      const hasToolUse = response.content.some((b) => b.type === "tool_use");
      if (!hasToolUse) {
        // This is the final response — keep the text
        finalText = "";
        for (const block of response.content) {
          if (block.type === "text") finalText += block.text;
        }
      }

      if (response.stop_reason !== "tool_use") break;

      // Execute tool calls
      currentMessages.push({ role: "assistant", content: response.content as never });

      const toolResults: { type: "tool_result"; tool_use_id: string; content: string }[] = [];
      for (const block of response.content) {
        if (block.type === "tool_use") {
          if (!READ_ONLY_TOOLS.has(block.name)) toolsUsed = true;
          const result = await executeAITool(
            block.name,
            block.input as Record<string, unknown>,
            session.user.role as "SUPER_ADMIN" | "BRANCH_MANAGER" | "STAFF",
            session.user.regionId ?? null,
            session.user.id,
            session.user.organizationId ?? undefined,
          );
          toolResults.push({ type: "tool_result", tool_use_id: block.id, content: result });
        }
      }

      currentMessages.push({ role: "user", content: toolResults as never });
    }

    return Response.json({ response: finalText, dataChanged: toolsUsed });
  } catch (error) {
    console.error("AI chat error:", error);
    return Response.json(
      { error: "Failed to process request. Please try again." },
      { status: 500 },
    );
  }
}

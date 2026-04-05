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

  const managementNote = canUseAIManagement
    ? `You have FULL management capabilities:
- SEARCH: Find assets, consumables, users. Search results include cost, supplier, description, photos. Filter by region.
- REGIONS: list_regions, compare_regions for side-by-side differences.
- CREATE: Assets (single/bulk), consumables, purchase orders, users, damage reports. Use suggest_category first.
- UPDATE: Asset/consumable details, move items between regions, copy photos between items, rename categories.
- STOCK: Add/deduct consumable stock. Bulk assign consumables to all staff in a region.
- USERS: Create accounts, deactivate, reset passwords, check staff equipment, assign starter kits.
- PURCHASE ORDERS: Approve/reject pending POs, mark as received (auto-restocks).
- RETURNS: Verify returned items (auto-restocks).
- INSPECTIONS: Schedule inspections, check overdue/incomplete inspections.
- BULK: Update multiple assets by filter (supplier, category), apply standard items to empty regions.
- PERMISSIONS: Toggle branch manager permissions.
- ADMIN: View activity log, update region names/addresses, manage categories.
Always search first before modifying. Use region filters when asked about specific locations.`
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

    // Tool-use loop (max 5 iterations)
    for (let i = 0; i < 5; i++) {
      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        system: systemPrompt,
        messages: currentMessages,
        tools: availableTools,
      });

      // Extract text blocks
      for (const block of response.content) {
        if (block.type === "text") finalText += block.text;
      }

      if (response.stop_reason !== "tool_use") break;

      // Execute tool calls
      currentMessages.push({ role: "assistant", content: response.content as never });

      const toolResults: { type: "tool_result"; tool_use_id: string; content: string }[] = [];
      for (const block of response.content) {
        if (block.type === "tool_use") {
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

    return Response.json({ response: finalText });
  } catch (error) {
    console.error("AI chat error:", error);
    return Response.json(
      { error: "Failed to process request. Please try again." },
      { status: 500 },
    );
  }
}

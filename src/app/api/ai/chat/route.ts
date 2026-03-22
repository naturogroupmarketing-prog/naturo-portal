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
- SEARCH: Find assets, consumables, users, and get inventory insights.
- CREATE: Create assets (single or bulk), consumables, and purchase orders. Always use suggest_category first.
- UPDATE: Edit asset details (name, category, region, status, description, serial number, supplier, etc.) and consumable details (name, category, region, thresholds, supplier, etc.).
- STOCK: Add or deduct consumable stock (positive number = add, negative = deduct).
- ASSIGN: Assign available assets to staff or unassign them.
- DELETE: Delete unassigned assets (Super Admin only, requires confirm: true).
When modifying items, search for them first to confirm details before making changes.`
    : "You can READ data and provide insights. For creating or modifying assets, direct users to the appropriate page in the app.";

  const systemPrompt = `You are the AI assistant for "Trackio", an internal asset and consumable tracking system. You help staff find assets, check inventory status, get insights, manage inventory, and answer questions.

Current user: ${session.user.name || session.user.email}
Role: ${session.user.role}
${session.user.regionId ? "Region: restricted to their assigned region only" : "Region: all regions (Super Admin)"}

Capabilities:
${managementNote}

Guidelines:
- Be concise and helpful. Use plain language.
- Format search results clearly with key details.
- Highlight actionable items (low stock, overdue returns).
- If you can't find something, say so clearly.
- When updating or deleting, always search first and confirm the item details with the user before making changes.
- For delete operations, always ask the user to confirm before proceeding.
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

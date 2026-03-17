import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { anthropic } from "@/lib/ai";
import { AI_TOOLS, executeAITool } from "@/lib/ai-tools";
import { rateLimit, RATE_LIMITS, rateLimitHeaders } from "@/lib/rate-limit";

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

  const systemPrompt = `You are the AI assistant for "Trackio", an internal asset and consumable tracking system. You help staff find assets, check inventory status, get insights, and answer questions.

Current user: ${session.user.name || session.user.email}
Role: ${session.user.role}
${session.user.regionId ? "Region: restricted to their assigned region only" : "Region: all regions (Super Admin)"}

Guidelines:
- Be concise and helpful. Use plain language.
- Format search results clearly with key details.
- Highlight actionable items (low stock, overdue returns).
- If you can't find something, say so clearly.
- You can READ data, CREATE assets (single or bulk), and CREATE purchase orders. When creating assets, always use suggest_category first to find valid categories, then use create_asset.
- For other modifications (editing, deleting, assigning), direct users to the appropriate page.
- Respect the user's role permissions.`;

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
        tools: AI_TOOLS,
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

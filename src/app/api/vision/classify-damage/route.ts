import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { auth } from "@/lib/auth";

export const runtime = "nodejs";

export interface DamageClassification {
  severity: "minor" | "moderate" | "severe" | "totalled";
  category: "physical" | "water" | "electrical" | "mechanical" | "cosmetic" | "unknown";
  description: string;
  repairRecommendation: "repair" | "replace" | "monitor" | "decommission";
  estimatedRepairComplexity: "low" | "medium" | "high";
  confidence: number; // 0-1
  details: string[]; // specific observations
}

export async function POST(request: Request): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { imageBase64, assetName, assetCategory } = await request.json();

    if (!imageBase64) return NextResponse.json({ error: "No image provided" }, { status: 400 });

    // Strip data URL prefix if present
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    const mediaType = imageBase64.startsWith("data:image/png") ? "image/png" : "image/jpeg";

    const anthropic = new Anthropic();

    const response = await anthropic.messages.create({
      model: "claude-3-5-haiku-20241022",
      max_tokens: 400,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mediaType, data: base64Data },
            },
            {
              type: "text",
              text: `You are an asset damage assessment AI for an operations management system.

Asset: ${assetName || "Unknown"}
Category: ${assetCategory || "Unknown"}

Analyse this image and respond ONLY with a valid JSON object in this exact format:
{
  "severity": "minor|moderate|severe|totalled",
  "category": "physical|water|electrical|mechanical|cosmetic|unknown",
  "description": "One sentence summary of the damage",
  "repairRecommendation": "repair|replace|monitor|decommission",
  "estimatedRepairComplexity": "low|medium|high",
  "confidence": 0.0-1.0,
  "details": ["specific observation 1", "specific observation 2"]
}

If no damage is visible, set severity to "minor" and describe what you see. Be precise and professional.`,
            },
          ],
        },
      ],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";

    // Parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Invalid AI response format");

    const classification: DamageClassification = JSON.parse(jsonMatch[0]);

    return NextResponse.json({ success: true, classification });
  } catch (error) {
    console.error("Vision classify error:", error);
    return NextResponse.json({ error: "Classification failed" }, { status: 500 });
  }
}

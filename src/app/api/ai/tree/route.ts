import { type NextRequest, NextResponse } from "next/server";
import { GeminiTreeService } from "../../../../lib/ai-service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      action,
      projectDescription,
      nodeTitle,
      nodeDescription,
      projectContext,
      customPrompt,
    } = body;

    const apiKey =
      process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing Gemini API key." },
        { status: 500 },
      );
    }

    const service = new GeminiTreeService(apiKey);
    let result;

    if (action === "generate") {
      result = await service.generateProjectTree(projectDescription);
    } else if (action === "expand") {
      if (customPrompt) {
        result = await service.expandNodeWithPrompt(
          nodeTitle,
          nodeDescription,
          customPrompt,
          projectContext,
        );
      } else {
        result = await service.expandNode(
          nodeTitle,
          nodeDescription,
          projectContext,
        );
      }
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("[/api/ai/tree] error:", err?.message || err);
    return NextResponse.json(
      { error: "Failed to generate AI tree response." },
      { status: 500 },
    );
  }
}

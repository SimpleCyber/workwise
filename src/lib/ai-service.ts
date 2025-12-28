export interface TreeNodeData {
  title: string;
  description: string;
  children?: TreeNodeData[];
}

export interface AITreeResponse {
  nodes: TreeNodeData[];
}

/**
 * Server-side service that calls Gemini directly.
 * Should only be used in API routes or server actions.
 */
export class GeminiTreeService {
  private apiKey: string;
  private baseUrl =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateProjectTree(
    projectDescription: string,
  ): Promise<TreeNodeData[]> {
    const prompt = `
You are a project management expert. Break down the following project into a hierarchical tree structure.

Project Description: "${projectDescription}"

Rules:
1. Each node must have a clear, specific title (max 50 characters)
2. Each node must have a detailed description (2-3 sentences explaining purpose, scope, or functionality)
3. Create 1-2 main branches representing major project areas
4. Each main branch should have 2-5 child nodes with specific tasks/components
5. If needed, add grandchild nodes for complex modules
6. Maintain clarity, precision, and completeness

Return ONLY a valid JSON object in this exact format:
{
  "nodes": [
    {
      "title": "Main Area 1",
      "description": "...",
      "children": [...]
    }
  ]
}
`;

    const res = await this.callGemini(prompt);
    const jsonMatch = res.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Invalid JSON from AI");
    const parsed: AITreeResponse = JSON.parse(jsonMatch[0]);
    return parsed.nodes;
  }

  async expandNode(
    nodeTitle: string,
    nodeDescription: string,
    projectContext: string,
  ): Promise<TreeNodeData[]> {
    const prompt = `Expand node "${nodeTitle}" (${nodeDescription}) in project "${projectContext}". Return JSON array of child nodes.`;
    const res = await this.callGemini(prompt);
    const jsonMatch = res.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error("Invalid JSON from AI");
    return JSON.parse(jsonMatch[0]);
  }

  async expandNodeWithPrompt(
    nodeTitle: string,
    nodeDescription: string,
    customPrompt: string,
    projectContext: string,
  ): Promise<TreeNodeData[]> {
    const prompt = `Expand node "${nodeTitle}" based on "${customPrompt}" in project "${projectContext}". Return JSON array of child nodes.`;
    const res = await this.callGemini(prompt);
    const jsonMatch = res.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error("Invalid JSON from AI");
    return JSON.parse(jsonMatch[0]);
  }

  private async callGemini(prompt: string): Promise<string> {
    const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    if (!response.ok) throw new Error(`Gemini API error: ${response.status}`);
    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("No response from AI");
    return text;
  }
}

/**
 * Client-side proxy service that calls our own /api/ai/tree endpoint.
 */
export class AITreeService {
  async generateProjectTree(
    projectDescription: string,
  ): Promise<TreeNodeData[]> {
    return this.callProxy("generate", { projectDescription });
  }

  async expandNode(
    nodeTitle: string,
    nodeDescription: string,
    projectContext: string,
  ): Promise<TreeNodeData[]> {
    return this.callProxy("expand", {
      nodeTitle,
      nodeDescription,
      projectContext,
    });
  }

  async expandNodeWithPrompt(
    nodeTitle: string,
    nodeDescription: string,
    customPrompt: string,
    projectContext: string,
  ): Promise<TreeNodeData[]> {
    return this.callProxy("expand", {
      nodeTitle,
      nodeDescription,
      customPrompt,
      projectContext,
    });
  }

  private async callProxy(action: string, payload: any): Promise<any> {
    const res = await fetch("/api/ai/tree", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...payload }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Server error: ${res.status}`);
    }
    return res.json();
  }
}

export const aiTreeService = new AITreeService();

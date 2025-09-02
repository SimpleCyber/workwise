interface TreeNodeData {
  title: string;
  description: string;
  children?: TreeNodeData[];
}

interface AITreeResponse {
  nodes: TreeNodeData[];
}

export class AITreeService {
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
7. Avoid vague labels like "Setup", "Testing", "Polish"

Return ONLY a valid JSON object in this exact format:
{
  "nodes": [
    {
      "title": "Main Area 1",
      "description": "Detailed description of this area and its purpose in the project.",
      "children": [
        {
          "title": "Specific Task 1.1",
          "description": "Clear description of what this task involves and its deliverables."
        },
        {
          "title": "Specific Task 1.2", 
          "description": "Clear description of what this task involves and its deliverables.",
          "children": [
            {
              "title": "Subtask 1.2.1",
              "description": "Detailed breakdown of this specific subtask."
            }
          ]
        }
      ]
    }
  ]
}
`;

    try {
      const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!generatedText) {
        throw new Error("No response from Gemini API");
      }

      // Extract JSON from the response
      const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("Invalid JSON response from AI");
      }

      const parsedResponse: AITreeResponse = JSON.parse(jsonMatch[0]);
      return parsedResponse.nodes;
    } catch (error) {
      console.error("AI Tree Generation Error:", error);
      throw new Error("Failed to generate project tree. Please try again.");
    }
  }

  async expandNode(
    nodeTitle: string,
    nodeDescription: string,
    projectContext: string,
  ): Promise<TreeNodeData[]> {
    const prompt = `
You are a project management expert. Expand the following node with detailed child nodes.

Node to Expand:
- Title: "${nodeTitle}"
- Description: "${nodeDescription}"
- Project Context: "${projectContext}"

Rules:
1. Generate 1-2 child nodes that break down this parent node
2. Each child must have a clear, specific title (max 50 characters)
3. Each child must have a detailed description (2-3 sentences)
4. Focus on actionable, specific tasks or components
5. If the node is complex, add grandchild nodes for further breakdown
6. Maintain logical hierarchy and clear relationships

Return ONLY a valid JSON array in this exact format:
[
  {
    "title": "Specific Child Task 1",
    "description": "Detailed description of what this child task involves and its deliverables.",
    "children": [
      {
        "title": "Subtask 1.1",
        "description": "Specific breakdown of this subtask."
      }
    ]
  },
  {
    "title": "Specific Child Task 2", 
    "description": "Detailed description of what this child task involves and its deliverables."
  }
]
`;

    try {
      const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!generatedText) {
        throw new Error("No response from Gemini API");
      }

      // Extract JSON from the response
      const jsonMatch = generatedText.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error("Invalid JSON response from AI");
      }

      const parsedResponse: TreeNodeData[] = JSON.parse(jsonMatch[0]);
      return parsedResponse;
    } catch (error) {
      console.error("AI Node Expansion Error:", error);
      throw new Error("Failed to expand node. Please try again.");
    }
  }

  async expandNodeWithPrompt(
    nodeTitle: string,
    nodeDescription: string,
    customPrompt: string,
    projectContext: string,
  ): Promise<TreeNodeData[]> {
    const prompt = `
You are a project management expert. Expand the following node based on the user's specific requirements.

Node to Expand:
- Title: "${nodeTitle}"
- Description: "${nodeDescription}"
- Project Context: "${projectContext}"

User's Custom Requirements: "${customPrompt}"

Rules:
1. Generate child nodes based on the user's specific requirements
2. Each child must have a clear, specific title (max 50 characters)
3. Each child must have a detailed description (2-3 sentences)
4. Focus on what the user specifically asked for
5. If needed, add grandchild nodes for complex requirements
6. Maintain logical hierarchy and clear relationships
7. Ensure all generated nodes align with the user's custom prompt

Return ONLY a valid JSON array in this exact format:
[
  {
    "title": "Specific Child Task 1",
    "description": "Detailed description of what this child task involves and its deliverables.",
    "children": [
      {
        "title": "Subtask 1.1",
        "description": "Specific breakdown of this subtask."
      }
    ]
  },
  {
    "title": "Specific Child Task 2", 
    "description": "Detailed description of what this child task involves and its deliverables."
  }
]
`;

    try {
      const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!generatedText) {
        throw new Error("No response from Gemini API");
      }

      // Extract JSON from the response
      const jsonMatch = generatedText.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error("Invalid JSON response from AI");
      }

      const parsedResponse: TreeNodeData[] = JSON.parse(jsonMatch[0]);
      return parsedResponse;
    } catch (error) {
      console.error("AI Custom Expansion Error:", error);
      throw new Error(
        "Failed to expand node with custom prompt. Please try again.",
      );
    }
  }
}

// Singleton instance
export const aiTreeService = new AITreeService(
  `${process.env.NEXT_PUBLIC_GEMINI_API_KEY}`,
);

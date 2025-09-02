export type ChatRole = "user" | "assistant" | "system";

export interface ChatMessageInput {
  role: ChatRole;
  content: string;
}

export class ChatService {
  private apiKey: string;
  private baseUrl =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Generates a single assistant reply for a chat conversation.
   * - Accepts prior messages (user/assistant/system)
   * - Returns plain text content
   */
  async generateReply(messages: ChatMessageInput[]): Promise<string> {
    const systemPreamble = `You are a concise, helpful project assistant. 
- Provide practical, accurate answers grounded in the conversation.
- When offering steps, keep them actionable and sequential.
- If you lack context, ask a brief clarifying question.
- Output plain text only.`;

    // Convert messages into a readable transcript for a single prompt text input
    const transcript = messages
      .map((m) => {
        const role =
          m.role === "assistant"
            ? "Assistant"
            : m.role === "system"
              ? "System"
              : "User";
        return `${role}: ${m.content}`;
      })
      .join("\n");

    const prompt = `${systemPreamble}\n\nConversation so far:\n${transcript}\n\nAssistant:`;

    try {
      const res = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
        }),
      });

      if (!res.ok) {
        throw new Error(`Gemini API error: ${res.status}`);
      }

      const data = await res.json();
      const generatedText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!generatedText) {
        throw new Error("No response from Gemini API");
      }

      return generatedText;
    } catch (err) {
      console.error("ChatService generateReply error:", err);
      throw new Error("Failed to generate assistant reply. Please try again.");
    }
  }
}

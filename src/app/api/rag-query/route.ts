// /app/api/rag-query/route.ts
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();
  const uploadRes = await fetch(
    "https://rag-api-auui.onrender.com/api/upload",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: body.detailsText }),
    },
  );

  const askRes = await fetch("https://rag-api-auui.onrender.com/api/ask", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question: body.currentMessage }),
  });

  const data = await askRes.json();
  return NextResponse.json({ answer: data?.answer || "No answer" });
}

import { google } from "@ai-sdk/google";
import { streamText, UIMessage } from "ai";

export const runtime = "edge";

export async function POST(req: Request) {
  const body = await req.json();

  const {
    messages,
    asset,
    timeframe,
    conversation_id,
    language = "en-US",
  }: {
    messages: UIMessage[];
    asset?: string;
    timeframe?: string;
    conversation_id?: string;
    language?: string;
  } = body;

  if (
    !Array.isArray(messages) ||
    messages.length === 0 ||
    !messages[messages.length - 1] ||
    !Array.isArray(messages[messages.length - 1].parts)
  ) {
    return new Response("Invalid or empty messages array", { status: 400 });
  }

  const lastMessage = messages[messages.length - 1].parts.find(
    (part) => part.type === "text"
  );

  if (!lastMessage || !lastMessage.text) {
    return new Response("Message must contain text content", { status: 400 });
  }

  // Validate required parameters
  if (!asset || !timeframe) {
    return new Response("Asset and timeframe are required", { status: 400 });
  }

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/analyze`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: lastMessage.text,
          asset,
          timeframe,
          conversation_id,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return new Response(
        JSON.stringify({
          error: errorData.error || errorData.message || "Error from backend",
        }),
        { status: response.status }
      );
    }

    const analysisData = await response.json();

    const result = streamText({
      model: google("gemini-2.5-flash"),
      system: `You are MarketSenseAI, a professional financial analyst assistant. 
Format your responses in clear, structured sections using markdown. 
First give a summary of the analysis to the user and then present the details in an easy-to-understand format. 
Be concise but comprehensive.

IMPORTANT: The user speaks language code '${language}'. 
You MUST provide your entire response in this language. 
Translate all financial terms appropriately where possible, or keep them in English if they are standard terminology but explain them.`,
      messages: [
        {
          role: "user",
          content: `Based on this comprehensive market analysis for ${asset} (${timeframe} timeframe), provide a clear investment recommendation:

${JSON.stringify(analysisData, null, 2)}

Format your response with clear sections and actionable insights.

CRITICAL INSTRUCTION: Your ENTIRE response MUST be in the language: ${language}. Do not respond in English unless the requested language is English.`,
        },
      ],
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("Error processing request:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to process the request.",
      }),
      { status: 500 }
    );
  }
}

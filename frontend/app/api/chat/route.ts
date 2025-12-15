// @ts-nocheck
import { google } from "@ai-sdk/google";
import { streamText, UIMessage, convertToCoreMessages } from "ai";



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

  const result = await streamText({
    model: google("gemini-2.5-flash"),
    system: `You are MarketSenseAI, a professional financial analyst assistant.
    
    IMPORTANT: The user speaks language code '${language}'. 
    You MUST provide your entire response in this language.
    
    When asked to analyze a market, FIRST say 'Starting analysis for [Asset]...' to user, and THEN use the 'getMarketAnalysis' tool.
    Do NOT call the tool silently. Speak first.
    `,
    messages: convertToCoreMessages(messages),
    tools: {
      getMarketAnalysis: {
        description: "Get comprehensive market analysis for a crypto asset",
        parameters: {
          type: "object",
          properties: {},
        },
        execute: async () => {
          try {
            const response = await fetch(
              `${process.env.NEXT_PUBLIC_API_URL}/analyze/${asset || "BTC"}`,
              {
                method: "GET",
                headers: { "Content-Type": "application/json" },
              }
            );

            if (!response.ok) throw new Error("Backend analysis failed");
            return await response.json();
          } catch (error) {
            console.error(error);
            return { error: "Failed to fetch analysis" };
          }
        },
      },
    },
    maxSteps: 2, // Allow it to call tool then answer
  });

  return result.toTextStreamResponse();
}

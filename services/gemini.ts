
import { GoogleGenAI, Type } from "@google/genai";
import { FestivalEvent } from "../types";

/**
 * Summarizes the event description using Gemini.
 */
export const getEventSummary = async (event: FestivalEvent): Promise<string> => {
  // Use the API key exclusively from process.env.API_KEY
  if (!process.env.API_KEY) return event.description;
  
  try {
    // Correct initialization with named parameter and process.env.API_KEY
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Summarize this festival workshop in 2 punchy sentences for a mobile app: ${event.title} - ${event.description}`,
      config: {
        thinkingConfig: { thinkingBudget: 0 }
      }
    });
    // Access extracted text via the .text property (not a method)
    return response.text || event.description;
  } catch (error) {
    console.error("Gemini error:", error);
    return event.description;
  }
};

/**
 * Gets smart recommendations based on user interests using Gemini.
 */
export const getSmartRecommendations = async (userInterests: string[], allEvents: FestivalEvent[]): Promise<string[]> => {
  // Use the API key exclusively from process.env.API_KEY
  if (!process.env.API_KEY) return [];

  try {
    // Correct initialization with named parameter and process.env.API_KEY
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Based on user interests [${userInterests.join(', ')}], return a JSON array of event IDs that they would likely enjoy from this list: ${JSON.stringify(allEvents.map(e => ({id: e.id, title: e.title, tags: e.tags})))}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });
    // Access extracted text via the .text property
    const jsonStr = response.text || '[]';
    return JSON.parse(jsonStr.trim());
  } catch (error) {
    console.error("Gemini recommendations error:", error);
    return [];
  }
};

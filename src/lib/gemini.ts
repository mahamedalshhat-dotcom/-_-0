import { GoogleGenAI } from "@google/genai";

const getAIClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "undefined") {
    console.error("Gemini API Key is missing or invalid in process.env. Please configure it in Settings.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const ai = getAIClient();
const MODEL_NAME = "gemini-3-flash-preview";

/**
 * Helper to extract and parse JSON from a string that might contain markdown blocks
 */
function parseJsonFromResponse(text: string | undefined) {
  if (!text) return {};
  try {
    // Try direct parse first
    return JSON.parse(text);
  } catch (e) {
    // Try to extract from markdown code blocks
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/```\s*([\s\S]*?)\s*```/);
    if (jsonMatch && jsonMatch[1]) {
      try {
        return JSON.parse(jsonMatch[1].trim());
      } catch (innerE) {
        console.error("Failed to parse extracted JSON:", innerE);
      }
    }
    
    // Last resort: find the first { and last }
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      try {
        return JSON.parse(text.substring(firstBrace, lastBrace + 1));
      } catch (innerE) {
        console.error("Failed to parse braced JSON:", innerE);
      }
    }
    
    throw e;
  }
}

export async function checkRecitation(audioBase64: string, expectedText: string) {
  if (!ai) return { isCorrect: false, feedback: "API Key missing", mistakes: [] };
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "audio/webm",
              data: audioBase64,
            },
          },
          {
            text: `You are a world-class Tajweed and Quran memorization expert (Sheikh). 
            The user is reciting the following text: "${expectedText}".
            
            Task:
            1. Compare their recitation to the provided text word-for-word.
            2. Identify any pronunciation (Makharij) mistakes.
            3. CRITICAL: Identify Tajweed mistakes (Ghunna, Madd, Qalqala, Ikhfa, etc.). The user expects "perfect Tajweed" (تجويد متقن).
            4. If the user missed any words or changed word order, mark it as incorrect.
            
            Criteria for isCorrect:
            - Set "isCorrect" to true ONLY if the recitation is perfect in both wording and basic Tajweed.
            - If there are minor Tajweed slips, set "isCorrect" to false and provide guidance.
            
            Feedback (Arabic):
            - Be extremely precise and scholarly yet encouraging. 
            - Mention specific rules of Tajweed they missed (e.g., "أحكام النون الساكنة", "المد اللازم").
            - If it's a full page/section, summarize the quality and list specific errors by word or verse if possible.
            
            Return format:
            {
              "isCorrect": boolean,
              "feedback": "Detailed encouraging feedback in Arabic including Tajweed advice",
              "mistakes": ["List of specific mistakes in Arabic"]
            }
            Return ONLY JSON.`,
          },
        ]
      },
      config: {
        responseMimeType: "application/json",
      }
    });

    return parseJsonFromResponse(response.text);
  } catch (error) {
    console.error("AI Recitation Check Error:", error);
    return {
      isCorrect: false,
      feedback: "عذراً، حدث خطأ أثناء تحليل التلاوة. يرجى المحاولة مرة أخرى.",
      mistakes: []
    };
  }
}

export async function getDailyWisdom() {
  if (!ai) return null;
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `You are an Islamic scholar and wisdom expert. 
          Provide a daily inspirational message in Arabic. 
          It should include:
          1. A Quranic Ayah or a Hadith (with reference).
          2. A short, practical reflection on how to apply this in modern life.
          3. A "Challenge of the Day" (a small good deed).
          
          Return the response in a structured JSON format:
          {
            "title": "string",
            "source": "string",
            "content": "string",
            "reflection": "string",
            "challenge": "string"
          }
          Return ONLY JSON.`,
      config: {
        responseMimeType: "application/json",
      }
    });

    return parseJsonFromResponse(response.text);
  } catch (error) {
    console.error("AI Daily Wisdom Error:", error);
    return null;
  }
}

export async function getAyahExplanation(ayahText: string, surahName: string, ayahNumber: number) {
  if (!ai) return null;
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Provide a concise and deep explanation (Tafsir) for the following Ayah in Arabic:
          Surah: ${surahName}, Ayah: ${ayahNumber}
          Text: "${ayahText}"
          
          The explanation should be easy to understand but spiritually profound. 
          Also provide a clear English translation of the Ayah.
          Include:
          1. English translation.
          2. General meaning in Arabic.
          3. Key spiritual lesson in Arabic.
          4. Practical application in Arabic.
          
          Return the response in a structured JSON format:
          {
            "translation": "string",
            "meaning": "string",
            "lesson": "string",
            "application": "string"
          }
          Return ONLY JSON.`,
      config: {
        responseMimeType: "application/json",
      }
    });

    return parseJsonFromResponse(response.text);
  } catch (error) {
    console.error("AI Ayah Explanation Error:", error);
    return null;
  }
}

export async function askNoorAIStream(userMessage: string, chatHistory: any[]) {
  if (!ai) throw new Error("API Key missing");
  try {
    return ai.models.generateContentStream({
      model: MODEL_NAME,
      contents: [
        ...chatHistory,
        { role: 'user', parts: [{ text: userMessage }] }
      ],
      config: {
        systemInstruction: `You are "Noor AI", a highly knowledgeable, compassionate, and wise Islamic assistant. 
        Your goal is to help users with questions about Islam, Quran, Hadith, Fiqh (according to mainstream moderate views), and spiritual growth.
        - Always respond in Arabic.
        - Be respectful and use an encouraging tone.
        - If a question is outside Islamic knowledge, politely redirect the user.
        - Provide references from the Quran or Hadith whenever possible.
        - Keep responses concise but deep.`
      }
    });
  } catch (error) {
    console.error("Gemini Stream Error:", error);
    throw error;
  }
}

export async function askNoorAI(userMessage: string, chatHistory: any[]) {
  if (!ai) return "API Key missing";
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: [
        ...chatHistory,
        { role: 'user', parts: [{ text: userMessage }] }
      ],
      config: {
        systemInstruction: `You are "Noor AI", a highly knowledgeable, compassionate, and wise Islamic assistant. 
        Your goal is to help users with questions about Islam, Quran, Hadith, Fiqh (according to mainstream moderate views), and spiritual growth.
        - Always respond in Arabic.
        - Be respectful and use an encouraging tone.
        - If a question is outside Islamic knowledge, politely redirect the user.
        - Provide references from the Quran or Hadith whenever possible.
        - Keep responses concise but deep.`
      }
    });

    return response.text || "عذراً، لم أتمكن من الحصول على رد. يرجى المحاولة مرة أخرى.";
  } catch (error) {
    console.error("Noor AI Chat Error:", error);
    return "عذراً، واجهت مشكلة في الاتصال بمساعد نور. يرجى المحاولة مرة أخرى.";
  }
}

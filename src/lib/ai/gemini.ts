// ============================================================================
// RozgarSync — Google Gemini AI Client
// ============================================================================
// Singleton client for Google Gemini 2.0 Flash API calls.
// Provides structured JSON output, bilingual prompts, and error handling.
// ============================================================================

import { GoogleGenerativeAI } from '@google/generative-ai';

// Singleton instance
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || '');

// Default system instruction for RozgarSync context
const ROZGARSYNC_SYSTEM_INSTRUCTION = `You are RozgarSync AI (روزگار سنک), an intelligent multi-agent system designed for Pakistan's informal gig economy.

CONTEXT:
- You serve informal workers (plumbers, electricians, painters, drivers, tailors, etc.) across Pakistan
- Pakistan's monthly minimum wage is PKR 32,000 (daily ~PKR 1,200, hourly ~PKR 150)
- Current CPI inflation factor: ~1.29 (29% year-over-year)
- Major cities: Karachi, Lahore, Islamabad, Rawalpindi, Faisalabad, Multan, Peshawar, Quetta, Sialkot, Gujranwala, Hyderabad, Bahawalpur
- EOBI (Employees' Old-Age Benefits Institution) provides social security
- Emergency contacts: Police 15, Rescue 1122, Edhi 115

RULES:
1. Always respond in valid JSON format
2. Include bilingual text (English in "en" field, Urdu in "ur" field) for all reasoning
3. Be culturally aware of Pakistani labor market dynamics
4. Prioritize worker safety and fair wages
5. Use PKR (Pakistani Rupees) for all monetary values
6. Consider seasonal factors (Eid, monsoon, wedding season)`;

/**
 * Generate text with Gemini AI.
 */
export async function generateWithGemini(
  prompt: string,
  systemInstruction?: string
): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction: systemInstruction || ROZGARSYNC_SYSTEM_INSTRUCTION,
    });

    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error('[Gemini] Generation failed:', error);
    throw error;
  }
}

/**
 * Generate structured JSON response with Gemini AI.
 * Parses the response and returns typed result.
 */
export async function generateJSON<T>(
  prompt: string,
  systemInstruction?: string
): Promise<T> {
  const rawText = await generateWithGemini(prompt, systemInstruction);

  // Extract JSON from response (handle markdown code blocks)
  let jsonStr = rawText.trim();
  if (jsonStr.startsWith('```json')) {
    jsonStr = jsonStr.slice(7);
  } else if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.slice(3);
  }
  if (jsonStr.endsWith('```')) {
    jsonStr = jsonStr.slice(0, -3);
  }
  jsonStr = jsonStr.trim();

  try {
    return JSON.parse(jsonStr) as T;
  } catch (parseError) {
    console.error('[Gemini] JSON parse failed. Raw text:', rawText);
    throw new Error(`Failed to parse Gemini response as JSON: ${rawText.substring(0, 200)}`);
  }
}

/**
 * Generate with Gemini and fallback to a default value on error.
 */
export async function generateWithFallback<T>(
  prompt: string,
  fallback: T,
  systemInstruction?: string
): Promise<T> {
  try {
    return await generateJSON<T>(prompt, systemInstruction);
  } catch {
    console.warn('[Gemini] Using fallback due to API error');
    return fallback;
  }
}

export { ROZGARSYNC_SYSTEM_INSTRUCTION };

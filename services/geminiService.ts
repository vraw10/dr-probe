import { GoogleGenAI, Type } from "@google/genai";
import { Question, QuizMode } from "../types";

// Initialize Gemini Client
// Resolve API key: Vite define replacement -> import.meta.env (Vite standard) -> globalThis fallback
const resolveApiKey = (): string => {
  // Vite's define will replace process.env.* at build/dev time
  try { if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY; } catch {}
  try { if (process.env.API_KEY) return process.env.API_KEY; } catch {}
  // Fallback for non-bundled environments
  if (typeof globalThis !== 'undefined' && (globalThis as any).__GEMINI_API_KEY__) {
    return (globalThis as any).__GEMINI_API_KEY__;
  }
  return '';
};
const ai = new GoogleGenAI({ apiKey: resolveApiKey() });

export const generateQuestions = async (topic: string, count: number, mode: QuizMode, ignoreStems: string[] = [], isPYQ: boolean = false): Promise<Question[]> => {
  const model = isPYQ ? "gemini-3.1-pro-preview" : "gemini-3-flash-preview";

  let modeInstructions = "";

  if (isPYQ) {
    modeInstructions = `
    3. Difficulty & Mode (PYQ ONLY):
       - You MUST ONLY provide questions that have been asked in previous INICET or NEET PG exams.
       - You MUST include the exact year and exam reference in the 'pyqReference' field (e.g., "NEET PG 2021", "INICET Nov 2022").
       - DO NOT make up or hallucinate references. If you cannot find enough real PYQs for this topic, return a single question object where the 'text' field is exactly "ERROR_NO_PYQ".
       - Difficulty should reflect the actual exam question.`;
  } else if (mode === 'hard') {
    modeInstructions = `
    3. Difficulty & Mode (HARD):
       - Bias HEAVILY towards 'Hard' (H) questions.
       - Focus on deep conceptual understanding, multi-step clinical reasoning, and correlating fine details.
       - Avoid direct factual recall.`;
  } else if (mode === 'tricky') {
    modeInstructions = `
    3. Difficulty & Mode (TRICKY):
       - The difficulty level can be mixed (E/M/H), but the PRIMARY goal is to be TRICKY.
       - Use very similar sounding options (distractors).
       - Use specific phrasing like "All EXCEPT", "Most likely vs Definitive".`;
  } else {
    modeInstructions = `
    3. Difficulty & Mode (STANDARD):
       - Generate mostly Moderate questions, with a few Easy and a few Hard.`;
  }

  // Logic to handle repeated tests to ensure variety
  const ignoreInstruction = ignoreStems.length > 0
    ? `7. Novelty & Variety: The user has just seen questions with the following stems/vignettes: ${JSON.stringify(ignoreStems.slice(-20))}. DO NOT replicate these.`
    : "";

  const prompt = `
    You are an expert medical examiner creating a mock test for the NEET PG (India).

    Target Audience: MBBS doctors.
    Task: Generate ${count} MCQs based on the topic: "${topic}".

    Guidelines:
    1. Context: Use concepts from past NEET PG exams.
    2. Style: Clinical vignettes.
    ${modeInstructions}
    4. Precision: Label 'precision' as 'High', 'Med', or 'Low'.
    5. Options: Exactly 4 options. Only ONE is correct.
    6. Explanation: Provide a strategic explanation.
    ${ignoreInstruction}

    Output Format: Return strictly a JSON array of objects.
  `;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              text: {
                type: Type.STRING,
                description: "The question stem. If no PYQs are found, set this to 'ERROR_NO_PYQ'."
              },
              options: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Array of 4 possible answers."
              },
              correctAnswerIndex: {
                type: Type.INTEGER,
                description: "The index (0-3) of the correct answer."
              },
              difficulty: {
                type: Type.STRING,
                enum: ["E", "M", "H"]
              },
              precision: {
                type: Type.STRING,
                enum: ["Low", "Med", "High"]
              },
              explanation: {
                type: Type.STRING
              },
              pyqReference: {
                type: Type.STRING,
                description: "The exam and year reference, e.g., 'NEET PG 2021'. If not a PYQ, leave as empty string."
              }
            },
            required: ["text", "options", "correctAnswerIndex", "difficulty", "precision", "explanation", "pyqReference"]
          }
        }
      }
    });

    if (!response.text) {
      throw new Error("No response generated from AI");
    }

    let jsonStr = response.text.trim();
    if (jsonStr.startsWith("```json")) {
      jsonStr = jsonStr.replace(/^```json\n/, "").replace(/\n```$/, "");
    } else if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```\n/, "").replace(/\n```$/, "");
    }

    const rawData = JSON.parse(jsonStr);

    if (rawData.length > 0 && rawData[0].text === "ERROR_NO_PYQ") {
      throw new Error("Dr. Probe couldn't find enough verified Previous Year Questions (PYQs) for this specific topic. Try broadening your search or switching to Standard mode.");
    }

    const questions: Question[] = rawData.map((q: any, index: number) => ({
      id: `q-${Date.now()}-${index}`,
      text: q.text,
      options: q.options,
      correctAnswerIndex: q.correctAnswerIndex,
      difficulty: q.difficulty,
      precision: q.precision,
      explanation: q.explanation,
      pyqReference: isPYQ ? q.pyqReference : undefined,
    }));

    return questions;

  } catch (error: any) {
    if (error.message.includes("Previous Year Questions")) {
      throw error;
    }
    console.error("Error generating questions:", error);
    throw new Error(`Failed to generate questions: ${error.message}`);
  }
};

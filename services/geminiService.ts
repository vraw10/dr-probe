import { GoogleGenAI, Type } from "@google/genai";
import { Question, QuizMode } from "../types";

// Initialize Gemini Client
// IMPORTANT: process.env.API_KEY is assumed to be available in the environment
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateQuestions = async (topic: string, count: number, mode: QuizMode, ignoreStems: string[] = []): Promise<Question[]> => {
  const model = "gemini-3-flash-preview";

  let modeInstructions = "";
  
  if (mode === 'hard') {
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
                description: "The question stem."
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
              }
            },
            required: ["text", "options", "correctAnswerIndex", "difficulty", "precision", "explanation"]
          }
        }
      }
    });

    if (!response.text) {
      throw new Error("No response generated from AI");
    }

    const rawData = JSON.parse(response.text);

    const questions: Question[] = rawData.map((q: any, index: number) => ({
      id: `q-${Date.now()}-${index}`,
      text: q.text,
      options: q.options,
      correctAnswerIndex: q.correctAnswerIndex,
      difficulty: q.difficulty,
      precision: q.precision,
      explanation: q.explanation,
    }));

    return questions;

  } catch (error: any) {
    console.error("Error generating questions:", error);
    throw new Error("Failed to generate questions. Please try again.");
  }
};
import { GoogleGenAI, Type } from "@google/genai";
import { Question, QuizMode } from "../types";

// Initialize Gemini Client
// IMPORTANT: process.env.API_KEY is assumed to be available in the environment
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const generateMedicalImage = async (description: string): Promise<string | undefined> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: `Generate a high-quality, photorealistic medical education image showing: ${description}. The image should be clear, clinical, and suitable for a medical exam. No text or labels on the image.` }],
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
  } catch (error) {
    console.error("Image generation failed:", error);
    return undefined;
  }
  return undefined;
};

export const generateQuestions = async (topic: string, count: number, mode: QuizMode, ignoreStems: string[] = [], isVisual: boolean = false): Promise<Question[]> => {
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

  // Visual Mode Logic
  let visualInstructions = "";
  if (isVisual) {
    visualInstructions = `
    IMPORTANT - VISUAL MODE ACTIVE:
    1. VALIDATION STEP: You must first judge if the topic "${topic}" is suitable for visual-based questions (e.g., Radiology, Dermatology, Pathology, Anatomy, ECGs, Surgical Instruments).
       - If the topic is ABSTRACT (e.g., "Medical Ethics", "Psychiatry Interview", "Pharmacology Mechanism", "Biostats"), you MUST return a single question object where the 'text' field is exactly "ERROR_TOPIC_IRRELEVANT".
    2. CONTENT: Generate questions that RELY on a visual finding.
       - Since you cannot send a real image file, you MUST provide a vivid, highly detailed text description of the image in the 'visualDescription' field.
       - The 'text' (question stem) should reference the image (e.g., "Identify the pathology shown in the figure...", "Based on the ECG strip described...").
    3. CONSTRAINT: Use ONLY standard, "textbook" visual presentations (e.g., "Target lesions in Erythema Multiforme", "Bamboo spine in AS"). Do NOT invent random or ambiguous visuals.
    `;
  } else {
    visualInstructions = `
    IMPORTANT - TEXT ONLY MODE:
    - Do NOT generate questions that rely on images or visual findings.
    - Leave the 'visualDescription' field empty or null.
    - Ensure questions are solvable by text alone.
    `;
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
    ${visualInstructions}
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
                description: "The question stem. If topic is irrelevant for visuals, set this to 'ERROR_TOPIC_IRRELEVANT'."
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
              visualDescription: {
                type: Type.STRING,
                description: "A detailed text description of the clinical image/ECG/Slide associated with this question. Required if Visual Mode is active."
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

    // Check for the specific error flag from the prompt
    if (rawData.length > 0 && rawData[0].text === "ERROR_TOPIC_IRRELEVANT") {
      throw new Error("TOPIC_NOT_VISUAL");
    }

    // Process questions and generate images if needed
    const questions: Question[] = await Promise.all(rawData.map(async (q: any, index: number) => {
      let imageUrl: string | undefined = undefined;
      // Strict filtering: Only use visualDescription if isVisual is true. 
      // This prevents hallucinated descriptions in text-only mode from triggering UI fallbacks.
      const visualDescription = isVisual ? q.visualDescription : undefined;
      
      if (isVisual && visualDescription) {
        imageUrl = await generateMedicalImage(visualDescription);
      }

      return {
        id: `q-${Date.now()}-${index}`,
        text: q.text,
        options: q.options,
        correctAnswerIndex: q.correctAnswerIndex,
        difficulty: q.difficulty,
        precision: q.precision,
        explanation: q.explanation,
        visualDescription: visualDescription,
        imageUrl: imageUrl
      };
    }));

    return questions;

  } catch (error: any) {
    if (error.message === "TOPIC_NOT_VISUAL") {
      throw error; // Propagate up for UI handling
    }
    console.error("Error generating questions:", error);
    throw new Error("Failed to generate questions. Please try again.");
  }
};
import { supabase } from "@/integrations/supabase/client";

interface AIResponse {
  success: boolean;
  generatedText?: string;
  error?: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export const generateAIText = async (
  prompt: string,
  systemMessage?: string,
  maxTokens?: number
): Promise<string> => {
  try {
    const { data, error } = await supabase.functions.invoke('ai-text-generation', {
      body: {
        prompt,
        systemMessage,
        maxTokens
      }
    });

    if (error) {
      console.error('Supabase function error:', error);
      throw new Error(`AI service error: ${error.message}`);
    }

    const response = data as AIResponse;

    if (!response.success) {
      throw new Error(response.error || 'AI generation failed');
    }

    return response.generatedText || '';

  } catch (error) {
    console.error('Error calling AI service:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to generate AI response');
  }
};

// Specialized function for medication information
export const getMedicationInsights = async (medicationName: string): Promise<string> => {
  const prompt = `Provide a brief clinical summary for the medication "${medicationName}". Include:
1. Primary uses and mechanism of action
2. Key side effects to monitor
3. Important drug interactions
4. Special patient considerations

Keep it concise and clinically relevant for healthcare providers.`;

  const systemMessage = `You are a clinical pharmacology expert providing concise, evidence-based medication information for healthcare professionals. Always include appropriate disclaimers about consulting official prescribing information.`;

  return generateAIText(prompt, systemMessage, 300);
};

// Function for diagnosis assistance
export const getDiagnosisInsights = async (symptoms: string, bodyPart: string): Promise<string> => {
  const prompt = `Based on the following symptoms in the ${bodyPart}: "${symptoms}"

Provide a brief clinical assessment including:
1. Differential diagnoses to consider
2. Recommended investigations
3. Red flag symptoms to watch for

Be concise and evidence-based.`;

  const systemMessage = `You are a clinical decision support tool providing diagnostic guidance to healthcare professionals. Always emphasize the importance of clinical judgment and comprehensive patient evaluation.`;

  return generateAIText(prompt, systemMessage, 400);
};
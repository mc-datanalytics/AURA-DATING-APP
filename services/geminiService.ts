
import { GoogleGenAI, Type } from "@google/genai";
import { AttachmentStyle, UserProfile } from '../types';

// Safely retrieve the API key
const apiKey = (typeof process !== 'undefined' && process.env && process.env.API_KEY) || '';

const getAI = () => {
  if (!apiKey) {
    console.warn("API Key missing.");
  }
  return new GoogleGenAI({ apiKey });
};

/**
 * Analyzes a user's raw text bio to determine their MBTI and Attachment Style.
 */
export const analyzeSoul = async (bio: string): Promise<{ mbti: string, attachment: AttachmentStyle, summary: string }> => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Analyze the following self-description for a dating profile. 
      Determine the most likely MBTI type (4 letters) and Attachment Style (Secure, Anxious, Avoidant, Disorganized).
      Also provide a 1-sentence poetic summary of their "Soul Aura".
      
      Bio: "${bio}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            mbti: { type: Type.STRING },
            attachment: { type: Type.STRING, enum: ['Sécure', 'Anxieux', 'Évitant', 'Désorganisé'] },
            summary: { type: Type.STRING }
          },
          required: ['mbti', 'attachment', 'summary']
        }
      }
    });

    const result = JSON.parse(response.text || '{}');
    return {
      mbti: result.mbti || 'INFJ',
      attachment: result.attachment as AttachmentStyle || AttachmentStyle.SECURE,
      summary: result.summary || "Une âme mystérieuse en quête de connexion."
    };
  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    return {
      mbti: 'ENFP',
      attachment: AttachmentStyle.SECURE,
      summary: "Une énergie rayonnante prête à explorer le monde."
    };
  }
};

/**
 * Simulates a chat response.
 */
export const generateChatReply = async (
  targetProfile: UserProfile,
  userMessage: string,
  chatHistory: { sender: string, text: string }[]
): Promise<string> => {
  try {
    const ai = getAI();
    const historyContext = chatHistory.map(m => `${m.sender}: ${m.text}`).join('\n');
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are roleplaying as ${targetProfile.name} on a dating app called Aura.
      Profile: MBTI ${targetProfile.mbti}, Attachment ${targetProfile.attachment}, Bio: ${targetProfile.bio}.
      Context: Dating app chat. Keep it short (max 2 sentences).
      
      History:
      ${historyContext}
      Match: ${userMessage}
      You:`,
    });

    return response.text || "...";
  } catch (error) {
    return "C'est fascinant, dis-m'en plus !";
  }
};

/**
 * Generates a deep psychological compatibility report between two users.
 */
export const generateCompatibilityReport = async (me: UserProfile, other: UserProfile): Promise<{
    title: string;
    synergy: string;
    challenges: string;
    advice: string;
}> => {
    try {
        const ai = getAI();
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Act as an expert relationship psychologist. Analyze the compatibility between two users based on their psychological profiles.

            User A (Me):
            - Name: ${me.name}
            - MBTI: ${me.mbti}
            - Attachment: ${me.attachment}
            - Bio: "${me.bio}"
            - Interests: ${me.interests.join(', ')}

            User B (Target):
            - Name: ${other.name}
            - MBTI: ${other.mbti}
            - Attachment: ${other.attachment}
            - Bio: "${other.bio}"
            - Interests: ${other.interests.join(', ')}

            Output a JSON object with:
            1. "title": A poetic/catchy title for this pairing (e.g., "Fire and Earth", "The Intellectual Waltz").
            2. "synergy": A paragraph explaining why they match deeply (strengths).
            3. "challenges": A paragraph explaining potential friction points.
            4. "advice": One sentence of golden advice for User A to seduce User B.
            
            Language: French. Tone: Insightful, empathetic, slightly mystical.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        synergy: { type: Type.STRING },
                        challenges: { type: Type.STRING },
                        advice: { type: Type.STRING }
                    },
                    required: ['title', 'synergy', 'challenges', 'advice']
                }
            }
        });

        return JSON.parse(response.text || '{}');

    } catch (error) {
        console.error("Report Generation Failed:", error);
        return {
            title: "Analyse Cosmique",
            synergy: "Vos énergies semblent s'aligner sur des fréquences similaires, créant une résonance naturelle.",
            challenges: "Attention aux malentendus si la communication n'est pas explicite.",
            advice: "Soyez vous-même, c'est votre meilleur atout."
        };
    }
}

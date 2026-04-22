import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export interface ChatMessage {
  role: 'user' | 'model' | 'system';
  content: string;
}

export const startConversation = async (studentName: string, studentLevel: string, scenario: string) => {
  const systemInstruction = `
    You are a friendly and encouraging English tutor at "BTechnology English School".
    Your goal is to help the student "${studentName}" (Level: ${studentLevel}) practice English through a simulated real-life scenario.
    
    Current Scenario: ${scenario}
    
    Guidelines:
    1. Stay in character! If the scenario is ordering in a restaurant, you are the waiter.
    2. Adapt your vocabulary and grammar complexity to the student's level (${studentLevel}).
    3. Be encouraging. If the student makes a significant mistake, gently provide a small correction or a better way to say it in parentheses at the end of your response, but prioritize keeping the conversation flowing.
    4. Ask open-ended questions to keep the student talking.
    5. Always response in English.
  `;

  return ai.chats.create({
    model: "gemini-3-flash-preview",
    config: {
      systemInstruction,
    }
  });
};

export const scenarios = [
  { id: 'restaurant', label: 'Ordering in a Restaurant', description: 'Practice ordering food and drinks at a café or restaurant.' },
  { id: 'airport', label: 'At the Airport', description: 'Practice check-in, security, and asking for directions at an airport.' },
  { id: 'job_interview', label: 'Job Interview', description: 'Practice introducing yourself and answering common interview questions.' },
  { id: 'hotel', label: 'Hotel Check-in', description: 'Practice checking in and asking about hotel amenities.' },
  { id: 'shopping', label: 'Shopping for Clothes', description: 'Practice asking for sizes, prices, and trying on clothes.' },
  { id: 'doctor', label: 'At the Doctor', description: 'Practice describing symptoms and understanding medical advice.' },
];

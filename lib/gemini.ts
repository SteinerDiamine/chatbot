import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '');

export async function generateResponse(prompt: string, context: string = '') {
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
  
  const fullPrompt = context 
    ? `Context: ${context}\n\nQuestion: ${prompt}\nAnswer:`
    : prompt;

  try {
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error generating response:', error);
    return 'Sorry, I encountered an error processing your request.';
  }
}
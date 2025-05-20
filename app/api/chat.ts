import { supabase } from '@/lib/supabse'; 
import { generateResponse } from '../../lib/gemini';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      req.headers.authorization?.split(' ')[1] || ''
    );

    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { prompt, pdfText } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Generate response from Gemini
    const response = await generateResponse(prompt, pdfText);

    // Save to database
    const { error: dbError } = await supabase
      .from('chat_history')
      .insert({
        user_id: user.id,
        user_query: prompt,
        chatbot_response: response,
        pdf_context: pdfText || null
      });

    if (dbError) {
      console.error('Database error:', dbError);
    }

    return res.status(200).json({ response });
  } catch (error) {
    console.error('Error in chat API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
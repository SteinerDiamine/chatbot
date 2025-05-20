import pdf from 'pdf-parse';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    if (!req.body) {
      return res.status(400).json({ error: 'No PDF data provided' });
    }

    const data = await pdf(Buffer.from(req.body));
    return res.status(200).json({ text: data.text });
  } catch (error) {
    console.error('Error parsing PDF:', error);
    return res.status(500).json({ error: 'Failed to parse PDF' });
  }
}
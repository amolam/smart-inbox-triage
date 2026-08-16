import type { VercelRequest, VercelResponse } from '@vercel/node';
import { executeTriage } from './_triageEngine.js';

export const config = {
  maxDuration: 60, // Timeout up to 60 seconds on Vercel for batch AI processing
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { messages } = req.body || {};
    const result = await executeTriage(messages);
    return res.status(200).json(result);
  } catch (error: any) {
    console.error('Error in Vercel serverless /api/triage:', error);
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      error: error.message || "We couldn't analyse the messages right now. Please try again.",
    });
  }
}

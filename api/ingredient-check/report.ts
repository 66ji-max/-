import { VercelRequest, VercelResponse } from '@vercel/node';
import { streamText, getLLMConfig } from '../../server/llmProvider';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { productName, category, market, ingredients } = req.body;

    const prompt = `You are a professional compliance assistant for cross-border e-commerce.
Please generate a structured compliance report in JSON format for the following product:
- Product Name: ${productName}
- Category: ${category}
- Target Market: ${market}
- Ingredients: ${ingredients}

Output ONLY a JSON object with this exact structure (no markdown tags, no extra text):
{
  "title": "...",
  "reportNo": "...",
  "generatedAt": "...",
  "productInfo": {
    "name": "...",
    "category": "...",
    "market": "..."
  },
  "riskLevel": "...",
  "summary": "...",
  "triggeredRules": ["...", "..."],
  "requiredMaterials": ["...", "..."],
  "rectificationSuggestions": ["...", "..."],
  "localResources": [
    { "name": "...", "description": "..." }
  ],
  "recheckSteps": ["...", "..."],
  "disclaimer": "..."
}

Language: Chinese (Simplified).
`;

    const config = getLLMConfig();
    let fullText = '';
    
    // @ts-ignore
    for await (const chunk of streamText([{ role: 'user', content: prompt }], 'You are a compliance assistant.', config)) {
       fullText += chunk;
    }

    if (fullText) {
      let jsonStr = fullText.trim();
      if (jsonStr.startsWith('```json')) {
         jsonStr = jsonStr.replace(/^```json/, '').replace(/```$/, '').trim();
      } else if (jsonStr.startsWith('```')) {
         jsonStr = jsonStr.replace(/^```/, '').replace(/```$/, '').trim();
      }
      try {
          const data = JSON.parse(jsonStr);
          return res.status(200).json(data);
      } catch (e) {
          console.error("JSON parse error on LLM output:", jsonStr);
          throw new Error("Invalid JSON format from LLM");
      }
    }
    
    throw new Error('LLM generated empty response');

  } catch (error: any) {
    console.error('Ingredient report generation failed:', error);
    return res.status(500).json({ error: error.message });
  }
}


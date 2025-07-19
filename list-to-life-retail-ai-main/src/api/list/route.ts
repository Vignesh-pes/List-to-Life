import { GoogleGenerativeAI } from "@google/generative-ai";

// AI List Generation API endpoint
export async function POST(request: Request) {
  try {
    const { query, user_id } = await request.json();

    // Ensure the API key is available
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("Missing GEMINI_API_KEY environment variable.");
    }

    // Initialize the Google Generative AI with your API key
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      You are an intelligent shopping list generator for a retail store. Based on the user's query, create a shopping list.
      The user's query is: "${query}"
      Provide the response in a JSON format with the following structure:
      {
        "items": [
          { "name": "Product Name", "quantity": 1, "price": 1.00, "stock": 50, "reason": "A brief reason for adding this item." }
        ],
        "suggestions": ["A helpful suggestion.", "Another suggestion."],
        "preferences": {}
      }
      Do not include any text or markdown formatting outside of the JSON object.
    `;

    const result = await model.generateContent(prompt);
    const responseText = await result.response.text();
    
    // Clean up the response to ensure it's valid JSON
    const cleanedText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    const data = JSON.parse(cleanedText);

    const total = data.items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);

    return Response.json({
      success: true,
      data: {
        ...data,
        total,
        query,
        preferences: data.preferences || {}
      }
    });

  } catch (error: any) {
    console.error('AI List Generation Error:', error);
    return Response.json(
      { 
        success: false, 
        error: 'Failed to generate shopping list. ' + error.message
      },
      { status: 500 }
    );
  }
}s

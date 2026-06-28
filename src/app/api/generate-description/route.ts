import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { title, location, price, bedrooms, bathrooms, amenities } = await req.json();

    // 1. Build a highly specific prompt for the Nigerian real estate market
    const prompt = `You are an expert Nigerian real estate copywriter. Write a compelling, professional, and attractive property description for a listing with the following details:
    - Title: ${title}
    - Location: ${location}
    - Price: ₦${price}
    - Bedrooms: ${bedrooms}
    - Bathrooms: ${bathrooms}
    - Key Features/Amenities: ${amenities}
    
    Make the tone inviting and professional. Highlight local selling points and format it with a short introductory paragraph followed by a clean bulleted list of features. Keep it under 200 words.`;

    // 2. Call the AI model endpoint securely using your environment variable
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    );

    const data = await response.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || "Failed to generate description.";

    return NextResponse.json({ description: generatedText });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

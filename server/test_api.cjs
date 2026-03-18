const axios = require('axios');
require('dotenv').config();

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
// Let's test standard Gemini 1.5 Flash first, as it is known to support images well on OpenRouter.
const VISION_MODEL = "google/gemini-1.5-flash"; 
const API_URL = "https://openrouter.ai/api/v1/chat/completions";

async function testApi() {
    const photoUrl = "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Pothole_in_New_York_City.jpg/800px-Pothole_in_New_York_City.jpg";
    const systemPrompt = "Analyze this image.";
    const userPrompt = "Is this a pothole?";
    
    console.log("Using API Key:", OPENROUTER_API_KEY ? OPENROUTER_API_KEY.substring(0, 10) + "..." : "undefined");
    console.log("Model:", VISION_MODEL);

    try {
        const response = await axios.post(
            API_URL,
            {
                model: VISION_MODEL,
                messages: [
                    { role: "system", content: systemPrompt },
                    {
                        role: "user",
                        content: [
                            { type: "text", text: userPrompt },
                            { type: "image_url", image_url: { url: photoUrl } }
                        ]
                    }
                ]
            },
            {
                headers: {
                    "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                    "Content-Type": "application/json",
                    "HTTP-Referer": "http://localhost:5173",
                    "X-Title": "NagarSevak AI Validator"
                }
            }
        );
        console.log("Success:", JSON.stringify(response.data.choices[0], null, 2));
    } catch (error) {
        console.log("=== ERROR RESPONSE ===");
        if (error.response && error.response.data) {
            console.log(JSON.stringify(error.response.data, null, 2));
        } else {
            console.log(error.message);
        }
        console.log("======================");
    }
}

testApi();

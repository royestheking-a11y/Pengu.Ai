require('dotenv').config();

async function listModes() {
    try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GOOGLE_GENERATIVE_AI_API_KEY}`);
        const data = await res.json();
        if (data.models) {
            console.log("Available Gemini Models:");
            data.models.filter(m => m.name.includes("gemini")).forEach(m => console.log(`- ${m.name}`));
        } else {
            console.log("No models returned:", data);
        }
    } catch (e) {
        console.error("List error:", e.message);
    }
}
listModes();

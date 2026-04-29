import {ChatMistralAI} from "@langchain/mistralai";
import appConfig from "../config/config.js";

export const getTitle = async (content) => {
    try {
        const mistralModel = new ChatMistralAI({
          apiKey: appConfig.MISTRAL_API_KEY,
          model: "mistral-medium-latest",
        });

        const prompt = `Generate a concise and descriptive title for a chat conversation based on the following content: ${content} 
        The title should be short, ideally under 2-4 words, and should capture the essence of the conversation. Avoid using generic titles like "Chat" or "Conversation".`;

         const response = await mistralModel.invoke(prompt);

        const title = response.content
            .trim()
            .replace(/^["']|["']$/g, "");
            
        return title;
    
    }
    catch (error) {
        console.error("Error generating title:", error);
        throw new Error("Failed to generate title");
    }
}
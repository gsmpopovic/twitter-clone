import { HfInference } from "@huggingface/inference";
import mongoose from "mongoose";
import dotenv from "dotenv";
import Category from "../../models/category.model.js";
dotenv.config();

const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY;
const client = new HfInference(HUGGINGFACE_API_KEY);

// MongoDB connection URI
const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/yourDatabase";

// Connect to MongoDB once to avoid repeated connections
await mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
console.log("Connected to MongoDB");

// Function to fetch a random category from MongoDB
async function getRandomCategory() {
  try {
    const count = await Category.countDocuments();
    if (count === 0) return null;

    const randomIndex = Math.floor(Math.random() * count);
    const randomCategory = await Category.findOne().skip(randomIndex);
    return randomCategory?.name;
  } catch (error) {
    console.error("Error fetching random category:", error);
    return null;
  }
}

// Function to generate a short-form tweet
async function generateTweetContent() {
  let generatedText = "";
  try {
    const category = await getRandomCategory();
    if (!category) throw new Error("No categories found in the database");

    const prompt = `Write a short, opinionated tweet about ${category}. The opinion can be good, bad, or neutral.`;

    const stream = client.chatCompletionStream({
      model: "meta-llama/Llama-3.1-8B-Instruct",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 100,
    });

    for await (const chunk of stream) {
      if (chunk.choices && chunk.choices.length > 0) {
        const newContent = chunk.choices[0].delta.content;
        generatedText += newContent || "";
      }
    }

    return `${generatedText.trim()}`;
  } catch (error) {
    console.error("Error generating tweet content:", error);
    return "Thinking about something interesting...";
  }
}

// Close the MongoDB connection when the process exits
process.on("exit", async () => {
  await mongoose.disconnect();
  console.log("Disconnected from MongoDB");
});

// Export the function to be used externally
export default generateTweetContent;

import mongoose from "mongoose";
import dotenv from "dotenv";
import Category from "../../models/category.model.js";
import OpenAI from "openai";

dotenv.config();

const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/yourDatabase";

// Initialize OpenAI with API key
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Connect to MongoDB once at the start
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

// Function to generate content using OpenAI
async function generatePostContent() {
  try {
    const category = await getRandomCategory();
    if (!category) throw new Error("No categories found in the database");

    const prompt = `Write a short, opinionated tweet about ${category} as a social media user, either from personal experience or as an informational post.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
    });

    const generatedText = completion.choices[0]?.message?.content || "";
    return generatedText.trim();
  } catch (error) {
    console.error("Error generating post content:", error);
    return null;
  }
}

// Close the MongoDB connection when the process exits
process.on("exit", async () => {
  await mongoose.disconnect();
  console.log("Disconnected from MongoDB");
});

export default generatePostContent;

// analyze.js
import mongoose from "mongoose";
import dotenv from "dotenv";
import fetch from "node-fetch";
import Analysis from "../backend/models/analysis.model.js"; // Assuming Analysis model path

dotenv.config();

const HUGGINGFACE_API_URL = "https://api-inference.huggingface.co/models/cardiffnlp/twitter-roberta-base-sentiment";
const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY;
const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/test";

// Connect to MongoDB if not already connected
async function initializeDatabase() {
  if (mongoose.connection.readyState === 0) {
    try {
      await mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
      console.log("Connected to MongoDB");
    } catch (error) {
      console.error("Failed to connect to MongoDB:", error);
    }
  }
}

// Check if Hugging Face model is ready
async function waitForModelToLoad() {
  const maxAttempts = 10;
  const delay = 10000;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`Checking model readiness... (Attempt ${attempt}/${maxAttempts})`);
      const response = await fetch(HUGGINGFACE_API_URL, {
        headers: { Authorization: `Bearer ${HUGGINGFACE_API_KEY}`, "Content-Type": "application/json" },
        method: "POST",
        body: JSON.stringify({ inputs: "Test" }),
      });

      const result = await response.json();
      if (!result.error || !result.error.includes("loading")) {
        console.log("Model is ready.");
        return;
      }
      console.log("Model is still loading. Retrying...");
    } catch (error) {
      console.error("Error checking model readiness:", error);
    }
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  throw new Error("Model failed to load after multiple attempts.");
}

// Query Hugging Face API for sentiment analysis
async function queryHuggingFace(text) {
  try {
    const response = await fetch(HUGGINGFACE_API_URL, {
      headers: { Authorization: `Bearer ${HUGGINGFACE_API_KEY}`, "Content-Type": "application/json" },
      method: "POST",
      body: JSON.stringify({ inputs: text }),
    });
    return await response.json();
  } catch (error) {
    console.error("Error querying Hugging Face API:", error);
    return null;
  }
}

// Analyze a single post and save the result to the Analysis model
async function analyze(post) {
  await initializeDatabase();
  try {
    await waitForModelToLoad();

    const analysisResponse = await queryHuggingFace(post.text);
    if (analysisResponse && Array.isArray(analysisResponse[0])) {
      const topSentiment = analysisResponse[0].reduce((prev, current) =>
        current.score > prev.score ? current : prev
      );

      const analysisEntry = new Analysis({
        postId: post._id,
        sentiment: topSentiment.label,
        score: topSentiment.score,
      });

      await analysisEntry.save();
      console.log(`Analyzed post ${post._id} with sentiment: ${topSentiment.label}`);
    } else {
      console.error(`Failed to analyze post ${post._id}: Invalid response format`);
    }
  } catch (error) {
    console.error("Error during sentiment analysis:", error);
  } finally {
    mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

export default analyze;

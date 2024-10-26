import fetch from "node-fetch";
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const HUGGINGFACE_API_URL = "https://api-inference.huggingface.co/models/cardiffnlp/twitter-roberta-base-sentiment";
const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY;
const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/test";

// MongoDB schemas
const postSchema = new mongoose.Schema({
  text: String,
  user: mongoose.Schema.Types.ObjectId,
  createdAt: Date,
});

const analysisSchema = new mongoose.Schema({
  postId: { type: mongoose.Schema.Types.ObjectId, ref: "Post", required: true },
  sentiment: { type: String, required: true }, // Define as a required string field
  score: { type: Number, required: true }, // Define as a required number field
  analyzedAt: { type: Date, default: Date.now },
});

const Analysis = mongoose.model("Analysis", analysisSchema);


const Post = mongoose.model("Post", postSchema);

// Function to wait until the model is ready by making a test request
async function waitForModelToLoad() {
  const maxAttempts = 10; // Maximum number of retries
  const delay = 10000; // Delay in milliseconds (10 seconds)
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`Checking model readiness... (Attempt ${attempt}/${maxAttempts})`);
      
      const response = await fetch(HUGGINGFACE_API_URL, {
        headers: {
          Authorization: `Bearer ${HUGGINGFACE_API_KEY}`,
          "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify({ inputs: "Test" }), // Simple test input
      });

      const result = await response.json();

      if (result.error && result.error.includes("loading")) {
        console.log("Model is still loading. Retrying...");
      } else {
        console.log("Model is ready.");
        return true;
      }
    } catch (error) {
      console.error("Error checking model readiness:", error);
    }

    // Wait before the next attempt
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  throw new Error("Model failed to load after multiple attempts.");
}

// Hugging Face API Query Function
async function queryHuggingFace(data) {
  try {
    const response = await fetch(HUGGINGFACE_API_URL, {
      headers: {
        Authorization: `Bearer ${HUGGINGFACE_API_KEY}`,
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify(data),
    });

    const result = await response.json();
    console.log("Response from Hugging Face API:", JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.error("Error querying Hugging Face API:", error);
    return null;
  }
}

// Main function to analyze posts and store results
// Main function to analyze posts and store results
async function analyzePostsAndSave() {
  try {
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB");

    // Wait until the Hugging Face model is ready
    await waitForModelToLoad();

    const posts = await Post.find();
    for (const post of posts) {
      const analysisResponse = await queryHuggingFace({ inputs: post.text });

      if (analysisResponse && Array.isArray(analysisResponse[0])) {
        // Find the label with the highest score
        const topSentiment = analysisResponse[0].reduce((prev, current) =>
          current.score > prev.score ? current : prev
        );

        const analysisEntry = new Analysis({
          postId: post._id,
          sentiment: topSentiment.label, // Set to the label with the highest score
          score: topSentiment.score,
        });

        await analysisEntry.save();
        console.log(`Analyzed post ${post._id} with sentiment: ${topSentiment.label}`);
      } else {
        console.error(`Failed to analyze post ${post._id}`);
      }
    }
  } catch (error) {
    console.error("Error during sentiment analysis and storage:", error);
  } finally {
    mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}



// Run the main function
analyzePostsAndSave();

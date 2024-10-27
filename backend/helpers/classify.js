// classify.js
import fetch from "node-fetch";
import mongoose from "mongoose";
import dotenv from "dotenv";
import Classification from "../models/classification.model.js";

dotenv.config();

const HUGGINGFACE_API_URL = "https://api-inference.huggingface.co/models/facebook/bart-large-mnli";
const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY;
const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/test";

// Initialize MongoDB connection
async function initializeDatabase() {
  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
      console.log("Connected to MongoDB");
    }
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
  }
}

// Wait for Hugging Face model readiness
async function waitForModelToLoad() {
  const maxAttempts = 10;
  const delay = 10000;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    console.log(`Checking model readiness... (Attempt ${attempt}/${maxAttempts})`);
    try {
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

// Query Hugging Face for classification
async function queryClassification(text, candidateLabels) {
  try {
    const response = await fetch(HUGGINGFACE_API_URL, {
      headers: { Authorization: `Bearer ${HUGGINGFACE_API_KEY}`, "Content-Type": "application/json" },
      method: "POST",
      body: JSON.stringify({ inputs: text, parameters: { candidate_labels: candidateLabels } }),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Error querying Hugging Face API:", error);
    return null;
  }
}

// Save or update classification in the database
async function saveOrUpdateClassification(post, classifications, candidateLabels) {
  for (let i = 0; i < classifications.labels.length; i++) {
    const label = classifications.labels[i];
    const score = classifications.scores[i];

    if (score > 0.5) {
      const category = candidateLabels.find(cat => cat === label);
      if (category) {
        await Classification.findOneAndUpdate(
          { postId: post._id, categoryName: category },
          { relevanceScore: score, classifiedAt: new Date() },
          { upsert: true, new: true }
        );
        console.log(`Classification saved for post ${post._id} in category ${label} with score ${score}`);
      }
    } else {
      console.log(`Score too low for category ${label}, skipping.`);
    }
  }
}

// Classify a single post by text with dynamic category labels
async function classify(post, candidateLabels) {
  await initializeDatabase();
  try {
    await waitForModelToLoad();

    const response = await queryClassification(post.text, candidateLabels);
    if (response && response.labels) {
      await saveOrUpdateClassification(post, response, candidateLabels);
    } else {
      console.error(`Failed classification for post ${post._id}: Invalid response format`);
    }
  } catch (error) {
    console.error("Error during classification:", error);
  } finally {
    mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

// Example usage:
// const post = { _id: "exampleId", text: "Sample post text" };
// const candidateLabels = ["Technology", "Health", "Education", "Entertainment"];
// classify(post, candidateLabels);

/* 
    const categories = await Category.find();
    if (!categories.length) {
      console.log("No categories found, stopping classification.");
      return;
    }
    const candidateLabels = categories.map(category => category.name);

*/

export default classify;

import fetch from "node-fetch";
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const HUGGINGFACE_API_URL = "https://api-inference.huggingface.co/models/facebook/bart-large-mnli"; // Updated to a zero-shot classification model
const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY;
const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/test";

// MongoDB schemas
const postSchema = new mongoose.Schema({
  text: String,
  user: mongoose.Schema.Types.ObjectId,
  createdAt: Date,
});

const categorySchema = new mongoose.Schema({
  name: String,
  type: { type: String, enum: ["hobby", "subject"] },
});

const classificationSchema = new mongoose.Schema({
  postId: { type: mongoose.Schema.Types.ObjectId, ref: "Post", required: true },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
  relevanceScore: { type: Number, required: true },
  classifiedAt: { type: Date, default: Date.now },
});

const Post = mongoose.model("Post", postSchema);
const Category = mongoose.model("Category", categorySchema);
const Classification = mongoose.model("Classification", classificationSchema);

async function fetchCategories() {
  try {
    const categories = await Category.find();
    console.log("Fetched categories:", categories);
    return categories;
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
}

async function waitForModelToLoad() {
  const maxAttempts = 10;
  const delay = 10000;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`Checking model readiness... (Attempt ${attempt}/${maxAttempts})`);
      
      const response = await fetch(HUGGINGFACE_API_URL, {
        headers: {
          Authorization: `Bearer ${HUGGINGFACE_API_KEY}`,
          "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify({ inputs: "Test" }),
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

    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  throw new Error("Model failed to load after multiple attempts.");
}

async function queryHuggingFaceClassification(text, candidateLabels) {
  try {
    const response = await fetch(HUGGINGFACE_API_URL, {
      headers: {
        Authorization: `Bearer ${HUGGINGFACE_API_KEY}`,
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify({
        inputs: text,
        parameters: {
          candidate_labels: candidateLabels,
        },
      }),
    });

    const result = await response.json();
    console.log("Response from Hugging Face API:", JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.error("Error querying Hugging Face API:", error);
    return null;
  }
}

async function classifyPosts() {
  try {
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB");

    await waitForModelToLoad();

    const categories = await fetchCategories();
    if (!categories.length) {
      console.log("No categories found, stopping classification.");
      return;
    }

    const categoryNames = categories.map(category => category.name);
    const posts = await Post.find();
    if (!posts.length) {
      console.log("No posts found, stopping classification.");
      return;
    }

    for (const post of posts) {
      console.log(`Classifying post: ${post._id} - ${post.text}`);

      const classificationResponse = await queryHuggingFaceClassification(post.text, categoryNames);

      if (classificationResponse && classificationResponse.labels) {
        for (let i = 0; i < classificationResponse.labels.length; i++) {
          const categoryLabel = classificationResponse.labels[i];
          const relevanceScore = classificationResponse.scores[i];

          if (relevanceScore > 0.5) { // Threshold for saving classification
            const category = categories.find(cat => cat.name === categoryLabel);
            if (category) {
              const classificationEntry = new Classification({
                postId: post._id,
                categoryId: category._id,
                relevanceScore,
              });

              await classificationEntry.save();
              console.log(`Saved classification for post ${post._id} in category ${categoryLabel} with score ${relevanceScore}`);
            }
          } else {
            console.log(`Score too low for category ${categoryLabel}, not saving.`);
          }
        }
      } else {
        console.error(`Invalid response format for post ${post._id}`);
      }
    }
  } catch (error) {
    console.error("Error during classification:", error);
  } finally {
    mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

// Run the classification function
classifyPosts();

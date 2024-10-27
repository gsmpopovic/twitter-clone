import mongoose from "mongoose";
import dotenv from "dotenv";
import Category from "../../models/category.model.js";

dotenv.config();

// MongoDB connection URI
const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/yourDatabase";

// Predefined meaningful categories array
const categories = [
  { name: "Personal Development & Wellness", type: "lifestyle" },
  { name: "Art & Creativity", type: "interest" },
  { name: "Food & Culinary Arts", type: "interest" },
  { name: "Science & Technology", type: "interest" },
  { name: "Entertainment & Pop Culture", type: "interest" },
  { name: "Travel & Adventure", type: "lifestyle" },
  { name: "Sports & Outdoor Activities", type: "interest" },
  { name: "Lifestyle & Home Improvement", type: "lifestyle" },
  { name: "Education & Learning", type: "interest" },
  { name: "Social Issues & Current Events", type: "interest" },
];

// Function to check and insert new categories
const populateCategories = async () => {
  try {
    for (const category of categories) {
      const existingCategory = await Category.findOne({ name: category.name });
      if (!existingCategory) {
        await Category.create(category);
        console.log(`Inserted category: ${category.name}`);
      } else {
        console.log(`Category already exists: ${category.name}`);
      }
    }
    console.log("Categories populated successfully");
  } catch (error) {
    console.error("Error populating categories:", error);
  }
};

// Wrapper function to handle MongoDB connection and category seeding
const runCategorySeeder = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log("Connected to MongoDB");

    // Run the populate function
    await populateCategories();
  } catch (error) {
    console.error("Error in category seeder:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
};

// Export the category seeder function
export default runCategorySeeder;

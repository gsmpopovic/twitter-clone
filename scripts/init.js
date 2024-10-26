import mongoose from "mongoose";
import runUserSeeder from "../backend/db/seeders/userSeeder.js";
import runPostSeeder from "../backend/db/seeders/postSeeder.js";
import runCategorySeeder from "../backend/db/seeders/categorySeeder.js"; // Import the category seeder

const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/yourDatabase";

// Check for flags
const shouldRefresh = process.argv.includes("--refresh");
const seedUsers = process.argv.includes("--users") || process.argv.includes("--all");
const seedPosts = process.argv.includes("--posts") || process.argv.includes("--all");
const seedCategories = process.argv.includes("--categories") || process.argv.includes("--all");

const runSeeders = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB");

    // Drop the existing collections if --refresh flag is passed
    if (shouldRefresh) {
      const collections = await mongoose.connection.db.collections();
      for (let collection of collections) {
        if ( (seedCategories && collection.collectionName === "categories") ||
          (seedUsers && collection.collectionName === "users") || 
            (seedPosts && collection.collectionName === "posts")) {
          await collection.drop();
          console.log(`Dropped ${collection.collectionName} collection`);
        }
      }
    }

    // Run User Seeder if --users or --all is passed
    if (seedUsers) {
      await runUserSeeder();
      console.log("User seeding completed");
    }

    // Run Post Seeder if --posts or --all is passed
    if (seedPosts) {
      await runPostSeeder();
      console.log("Post seeding completed");
    }

        // Run Post Seeder if --posts or --all is passed
        if (seedCategories) {
          await runCategorySeeder();
          console.log("Category seeding completed");
        }

  } catch (error) {
    console.error("Error running seeders:", error);
  } finally {
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
};

// Run the seeder functions
runSeeders();

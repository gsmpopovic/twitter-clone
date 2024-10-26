import { faker } from "@faker-js/faker";
import User from "../../models/user.model.js";
import Post from "../../models/post.model.js";
import generateTweetContent from "./tweet.js";

const batchSize = 100; // Number of posts to insert at once

// Generate random posts in batches
const createRandomPosts = async (numPosts = 250) => {
  try {
    // Fetch user IDs to associate posts with users
    const users = await User.find({}, "_id");
    const userIds = users.map((user) => user._id.toString());

    if (!userIds.length) {
      console.log("No users found. Cannot create posts.");
      return;
    }

    const posts = [];
    for (let i = 0; i < numPosts; i++) {
      // Generate a tweet using the async function and wait for it to resolve
      let tweet;
      try {
        tweet = await generateTweetContent();
      } catch (error) {
        console.error("Error fetching tweet content:", error);
        tweet = "Default tweet content due to error"; // Optional fallback
      }

      const img = null; // Can add image URL generation logic if needed
      const userId = userIds[Math.floor(Math.random() * userIds.length)];

      posts.push({
        user: userId,
        text: tweet, // Store the generated tweet in the `text` field
        img,
        createdAt: faker.date.recent(),
      });

      // Insert posts in batches
      if (posts.length >= batchSize || i === numPosts - 1) {
        await Post.insertMany(posts);
        console.log(`Inserted ${posts.length} posts`);
        posts.length = 0;
      }
    }

    console.log(`Successfully created ${numPosts} posts with hobbies and subjects!`);
  } catch (error) {
    console.error("Error creating random posts:", error);
  }
};

// Wrapper function to handle MongoDB connection and seeding
const runSeeder = async () => {
  try {
    await createRandomPosts(); // Run the post creation function
  } catch (error) {
    console.error("Error in post seeder:", error);
  } finally {
    console.log("Disconnected from MongoDB");
  }
};

// Export the seeder function
export default runSeeder;

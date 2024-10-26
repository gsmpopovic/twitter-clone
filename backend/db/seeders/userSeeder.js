import bcrypt from "bcryptjs";
import { faker } from "@faker-js/faker";
import User from "../../models/user.model.js";

const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/test";
const batchSize = 100; // Number of users to insert at once

// Function to create random users in batches
const createRandomUsers = async (numUsers = 100) => {
  try {
    const users = [];
    const usernames = new Set();
    const emails = new Set();

    for (let i = 0; i < numUsers; i++) {
      let fullName = faker.person.fullName();
      let username;
      let email;

      // Ensure unique username and email
      do {
        username = faker.internet.userName();
      } while (usernames.has(username));
      usernames.add(username);

      do {
        email = faker.internet.email();
      } while (emails.has(email));
      emails.add(email);

      // Generate hashed password
      const password = await bcrypt.hash(faker.internet.password(8), 10);

      // Add new user to batch
      users.push({
        fullName,
        username,
        email,
        password,
        followers: [],
        following: [],
        profileImg: faker.image.avatar(),
        coverImg: faker.image.urlLoremFlickr({ category: 'nature' })
      });

      // Insert batch every `batchSize` users
      if (users.length >= batchSize || i === numUsers - 1) {
        const insertedUsers = await User.insertMany(users);
        console.log(`Inserted ${insertedUsers.length} users`);
        
        // Clear users array for the next batch
        users.length = 0;

        // Retrieve the IDs of newly inserted users
        const userIds = insertedUsers.map(user => user._id);

        // Update followers and following for each inserted user
        for (const user of insertedUsers) {
          const randomFollowers = getRandomSubset(userIds, 10, user._id);
          const randomFollowing = getRandomSubset(userIds, 10, user._id);

          await User.findByIdAndUpdate(user._id, {
            followers: randomFollowers,
            following: randomFollowing,
          });
        }
      }
    }

    console.log(`Successfully created ${numUsers} users with followers and following!`);

    // Return all user IDs for further usage
    const allUsers = await User.find({}, "_id");
    return allUsers.map(user => user._id);
  } catch (error) {
    console.error("Error creating random users:", error);
  }
};

// Helper function to get a random subset of user IDs
const getRandomSubset = (array, num, excludeId) => {
  const filteredArray = array.filter(id => id.toString() !== excludeId.toString());
  const shuffled = filteredArray.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, num);
};

// Wrapping function to handle connection, seeding admin, and other users
const runSeeder = async () => {
  try {

    // Run the user creation function and get all user IDs
    const allUserIds = await createRandomUsers();

    // Create or update the admin user
    const adminPassword = await bcrypt.hash("admin123", 10);
    const admin = await User.findOneAndUpdate(
      { username: "admin" }, // Filter to find admin by username
      {
        fullName: "Admin",
        username: "admin",
        email: "admin@gmail.com",
        password: adminPassword,
        followers: [],
        following: [],
        profileImg: faker.image.avatar(),
        coverImg: faker.image.urlLoremFlickr({ category: 'nature' })
      },
      {
        new: true,      // Return the updated document
        upsert: true    // Create the document if it does not exist
      }
    );
    console.log("Admin user created or updated");

    // Assign random followers and following to admin
    const adminFollowers = getRandomSubset(allUserIds, 10, admin._id);
    const adminFollowing = getRandomSubset(allUserIds, 10, admin._id);

    await User.findByIdAndUpdate(admin._id, {
      followers: adminFollowers,
      following: adminFollowing,
    });
    console.log("Admin followers and following set");

  } catch (error) {
    console.error("Error in seeder:", error);
  } finally {

  }
};

// Export the seeder function
export default runSeeder;

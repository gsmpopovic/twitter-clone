// server/routes/dashboard.route.js
import express from "express";
import User from "../models/user.model.js";
import Post from "../models/post.model.js";
import Analysis from "../models/analysis.model.js";

const router = express.Router();

// Dashboard route
router.get("/summary", async (req, res) => {
  try {
    // Aggregate sentiment data from the Analysis model
    const sentimentSummary = await Analysis.aggregate([
      { $group: { _id: "$sentiment", count: { $sum: 1 } } }
    ]);

    const totalSentiments = sentimentSummary.reduce((acc, item) => acc + item.count, 0);
    const sentimentData = sentimentSummary.map(item => ({
      sentiment: item._id,
      count: item.count,
      percentage: ((item.count / totalSentiments) * 100).toFixed(2)
    }));

    // Get total user count and post count
    const userCount = await User.countDocuments();
    const postCount = await Post.countDocuments();

    // Send all the data as JSON
    res.json({
      totalUsers: userCount,
      totalPosts: postCount,
      sentimentData,
      totalSentiments
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    res.status(500).json({ error: "Failed to retrieve dashboard data" });
  }
});

export default router;

import express from "express";
import User from "../models/user.model.js";
import Post from "../models/post.model.js";
import Analysis from "../models/analysis.model.js";
import Classification from "../models/classification.model.js"; // Import Classification model

const router = express.Router();

// Analytics summary route
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
      percentage: ((item.count / totalSentiments) * 100).toFixed(2),
    }));

    // Aggregate classification data
    const classificationSummary = await Classification.aggregate([
      {
        $lookup: {
          from: "categories", // Assumes 'categories' collection name
          localField: "categoryId",
          foreignField: "_id",
          as: "category"
        }
      },
      { $unwind: "$category" },
      { $group: { _id: "$category.name", count: { $sum: 1 } } }
    ]);

    const totalClassifications = classificationSummary.reduce((acc, item) => acc + item.count, 0);
    const classificationData = classificationSummary.map(item => ({
      category: item._id,
      count: item.count,
      percentage: ((item.count / totalClassifications) * 100).toFixed(2),
    }));

    // Get total user count and post count
    const userCount = await User.countDocuments();
    const postCount = await Post.countDocuments();

    // Send all data as JSON
    res.json({
      totalUsers: userCount,
      totalPosts: postCount,
      sentimentData,
      totalSentiments,
      classificationData,
      totalClassifications,
    });
  } catch (error) {
    console.error("Error fetching analytics data:", error);
    res.status(500).json({ error: "Failed to retrieve analytics data" });
  }
});

export default router;

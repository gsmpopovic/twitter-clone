// server/routes/analytics.js
import express from 'express';
import Analysis from '../models/analysis.model.js';

const router = express.Router();

// Route to get sentiment data summary
router.get('/sentiment-summary', async (req, res) => {
  try {
    // Group and count sentiments
    const summary = await Analysis.aggregate([
      {
        $group: {
          _id: "$sentiment",
          count: { $sum: 1 }
        }
      }
    ]);

    // Calculate total for percentages
    const total = summary.reduce((acc, item) => acc + item.count, 0);

    // Add percentages to each sentiment category
    const sentimentData = summary.map(item => ({
      sentiment: item._id,
      count: item.count,
      percentage: ((item.count / total) * 100).toFixed(2)
    }));

    res.json({ total, sentimentData });
  } catch (error) {
    console.error("Error fetching sentiment summary:", error);
    res.status(500).json({ error: "Failed to retrieve sentiment summary" });
  }
});

export default router;

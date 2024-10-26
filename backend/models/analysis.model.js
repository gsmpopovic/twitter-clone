// models/analysis.model.js
import mongoose from "mongoose";

const analysisSchema = new mongoose.Schema(
	{
		post: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Post",
			required: true,
		},
		sentiment: {
			type: String,
			enum: ["LABEL_1", "LABEL_2", "LABEL_0"],
			required: true,
		},
		score: {
			type: Number,
			required: true,
		},
		analyzedAt: {
			type: Date,
			default: Date.now,
		},
	},
	{ timestamps: true }
);

const Analysis = mongoose.model("Analysis", analysisSchema);

export default Analysis;

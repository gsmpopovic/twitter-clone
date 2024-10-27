import mongoose from "mongoose";

// Define the schema for classifications
const classificationSchema = new mongoose.Schema({
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Post",
    required: true
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: true
  },
  relevanceScore: {
    type: Number,
    required: true,
  },
  classifiedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true // Automatically manage createdAt and updatedAt fields
});

// Create a unique index to prevent duplicate classifications for the same post and category
classificationSchema.index({ postId: 1, categoryId: 1 }, { unique: true });

// Check if the model is already registered, otherwise define it
const Classification = mongoose.models.Classification || mongoose.model("Classification", classificationSchema);

export default Classification;

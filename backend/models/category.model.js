import mongoose from "mongoose";

// Define the schema for categories
const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    type: {
      type: String,
      enum: ["interest", "lifestyle"],
      required: true,
    },
  },
  { timestamps: true }
);

// Check if the model is already registered, otherwise define it
const Category = mongoose.models.Category || mongoose.model("Category", categorySchema);

export default Category;

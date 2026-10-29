
const mongoose = require("mongoose");

const mealPlanSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    weekStarting: {
      type: String,
      required: true,
    },
    preferences: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    meals: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    nutrition: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    budget: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("MealPlan", mealPlanSchema);

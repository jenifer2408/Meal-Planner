const mongoose = require("mongoose");

const favoriteSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    recipeId: {
      type: String,
      required: true,
    },
    recipeName: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

favoriteSchema.index(
  { userId: 1, recipeId: 1 },
  { unique: true }
);

module.exports = mongoose.model("Favorite", favoriteSchema);
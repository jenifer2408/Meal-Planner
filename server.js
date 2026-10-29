
require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("./models/User");
const MealPlan = require("./models/MealPlan");
const Favorite = require("./models/Favorite");

const app = express();

app.use(cors());
app.use(express.json());

// HOME
app.get("/", (req, res) => {
  res.send("NutriPlan Backend is Running!");
});

// SIGNUP
app.post("/api/auth/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string" ||
      !name.trim() ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        message: "Please fill in all required fields.",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        message: "An account with this email already exists.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
    });

    return res.status(201).json({
      message: "Account created successfully!",
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "An account with this email already exists.",
      });
    }

    console.error("Signup error:", error.message);

    return res.status(500).json({
      message: "Unable to create account. Please try again.",
    });
  }
});

// LOGIN
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        message: "Email and password are required.",
      });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    });

    if (
      !user ||
      !(await bcrypt.compare(password, user.password))
    ) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is missing from .env");
    }

    const token = jwt.sign(
      { userId: user._id.toString() },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return res.status(200).json({
      message: "Login successful!",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Login error:", error.message);

    return res.status(500).json({
      message: "Unable to log in. Please try again.",
    });
  }
});

// VERIFY JWT TOKEN
function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;

  if (!token) {
    return res.status(401).json({
      message: "Please log in to access your meal plans.",
    });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    req.userId = decoded.userId;
    next();
  } catch {
    return res.status(401).json({
      message: "Invalid or expired token. Please log in again.",
    });
  }
}

// SAVE WEEKLY MEAL PLAN
app.post("/api/mealplans", authenticateToken, async (req, res) => {
  try {
    const {
      weekStarting,
      preferences,
      meals,
      nutrition,
      budget,
    } = req.body;

    if (
      typeof weekStarting !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(weekStarting) ||
      !preferences ||
      !Array.isArray(meals) ||
      !nutrition ||
      !budget
    ) {
      return res.status(400).json({
        message: "Invalid weekly meal plan data.",
      });
    }

    const savedPlan = await MealPlan.create({
      userId: req.userId,
      weekStarting,
      preferences,
      meals,
      nutrition,
      budget,
    });

    return res.status(201).json({
      message: "Weekly plan saved successfully!",
      planId: savedPlan._id,
    });
  } catch (error) {
    console.error("Save meal plan error:", error.message);

    return res.status(500).json({
      message: "Could not save the weekly plan.",
    });
  }
});

// GET THE LOGGED-IN USER'S SAVED PLANS
app.get("/api/mealplans", authenticateToken, async (req, res) => {
  try {
    const plans = await MealPlan.find({
      userId: req.userId,
    }).sort({ createdAt: -1 });

    return res.json(plans);
  } catch (error) {
    console.error("Fetch meal plans error:", error.message);

    return res.status(500).json({
      message: "Could not retrieve saved plans.",
    });
  }
});
// ADD A FAVORITE RECIPE
app.post("/api/favorites", authenticateToken, async (req, res) => {
  try {
    const { recipeId, recipeName } = req.body;

    if (
      typeof recipeId !== "string" ||
      typeof recipeName !== "string" ||
      !recipeId.trim() ||
      !recipeName.trim()
    ) {
      return res.status(400).json({
        message: "Recipe ID and name are required.",
      });
    }

    const favorite = await Favorite.create({
      userId: req.userId,
      recipeId: recipeId.trim(),
      recipeName: recipeName.trim(),
    });

    return res.status(201).json({
      message: "Recipe added to favorites!",
      favorite,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Recipe is already in favorites.",
      });
    }

    console.error("Add favorite error:", error.message);

    return res.status(500).json({
      message: "Could not add favorite recipe.",
    });
  }
});

// GET FAVORITE RECIPES
app.get("/api/favorites", authenticateToken, async (req, res) => {
  try {
    const favorites = await Favorite.find({
      userId: req.userId,
    }).sort({ createdAt: -1 });

    return res.json(favorites);
  } catch (error) {
    console.error("Get favorites error:", error.message);

    return res.status(500).json({
      message: "Could not retrieve favorite recipes.",
    });
  }
});

// REMOVE A FAVORITE RECIPE
app.delete(
  "/api/favorites/:recipeId",
  authenticateToken,
  async (req, res) => {
    try {
      const favorite = await Favorite.findOneAndDelete({
        userId: req.userId,
        recipeId: req.params.recipeId,
      });

      if (!favorite) {
        return res.status(404).json({
          message: "Favorite recipe not found.",
        });
      }

      return res.json({
        message: "Recipe removed from favorites!",
      });
    } catch (error) {
      console.error("Remove favorite error:", error.message);

      return res.status(500).json({
        message: "Could not remove favorite recipe.",
      });
    }
  }
);

// START SERVER
async function startServer() {
  try {
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is missing from .env");
    }

    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected successfully!");

    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Backend startup failed:", error.message);
    process.exit(1);
  }
}

startServer();

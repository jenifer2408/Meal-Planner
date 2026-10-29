
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import App from "./App.jsx";
import FindMeals from "./pages/FindMeals.jsx";
import Recipes from "./pages/Recipes.jsx";
import MealPlanner from "./pages/MealPlanner.jsx";
import WeeklyPlanner from "./pages/WeeklyPlanner.jsx";

import Signup from "./pages/Signup.jsx";
import Login from "./pages/Login.jsx";

import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/find-meals" element={<FindMeals />} />
        <Route path="/recipes" element={<Recipes />} />
        <Route path="/meal-planner" element={<MealPlanner />} />
        <Route path="/weekly-planner" element={<WeeklyPlanner />} />
        
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);

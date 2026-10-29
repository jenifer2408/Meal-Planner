NutriPlan frontend update
1. Copy src/main.jsx into your existing src/main.jsx.
2. Copy src/App.jsx and src/Home.css into your existing src folder (these replace the old intro/search home).
3. Copy src/pages/FindMeals.jsx and src/pages/FindMeals.css into src/pages.
4. Copy src/pages/Recipes.jsx into src/pages/Recipes.jsx. Keep your existing src/pages/Recipes.css; it already styles the recipe cards and modal.
5. Copy src/components/Navbar.jsx and src/components/Navbar.css into src/components (create components folder if needed).
6. To make Meal Planner navigation consistent, in src/pages/MealPlanner.jsx import Navbar from "../components/Navbar.jsx"; replace its current <nav className="navbar">...</nav> block with <Navbar />.
7. Your existing recipes.json and MealPlanner.css can stay as they are.
Note: Home images use Unsplash URLs and need internet access to load.

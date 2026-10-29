
import { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar.jsx";
import "./WeeklyPlanner.css";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Sector,
} from "recharts";

const DAYS = [
  "Monday", "Tuesday", "Wednesday", "Thursday",
  "Friday", "Saturday", "Sunday",
];

const MEALS = [
  { key: "Breakfast", label: "🌅 Breakfast" },
  { key: "Lunch", label: "☀️ Lunch" },
  { key: "Snacks", label: "🍎 Snacks" },
  { key: "Dinner", label: "🌙 Dinner" },
];

const PIE_COLORS = ["#4c9662", "#e7b65c", "#6b8fc5"];

function WeeklyPlanner() {
  const [recipes, setRecipes] = useState([]);
  const [diet, setDiet] = useState("Vegetarian");
  const [goal, setGoal] = useState("Balanced eating");
  const [mealsPerDay, setMealsPerDay] = useState("4");
  const [servings, setServings] = useState("1");
  const [ingredients, setIngredients] = useState("");
  const [ingredientMode, setIngredientMode] = useState("Flexible");
  const [weeklyPlan, setWeeklyPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [planNotice, setPlanNotice] = useState("");
  const [shoppingSelected, setShoppingSelected] = useState([]);
  const [weeklyBudget, setWeeklyBudget] = useState("2500");
  const [savingPlan, setSavingPlan] = useState(false);
  const [saveNotice, setSaveNotice] = useState("");

  useEffect(() => {
    fetch("/recipes.json")
      .then((response) => {
        if (!response.ok) throw new Error("Failed to load recipes");
        return response.json();
      })
      .then((data) => {
        if (!Array.isArray(data)) throw new Error("Invalid recipe data");
        setRecipes(data);
      })
      .catch((err) => {
        console.error("Recipe loading failed:", err);
        setError("Could not load recipes.json. Please check the file.");
      })
      .finally(() => setLoading(false));
  }, []);

  const containsMeat = (recipe) => {
    const text = [
      recipe.name || "",
      ...(Array.isArray(recipe.ingredients) ? recipe.ingredients : []),
    ].join(" ").toLowerCase();

    return /\b(chicken|mutton|fish|prawn|prawns|shrimp|beef|pork|turkey|meat)\b/.test(text);
  };

  // Editable local demo prices: approximate INR cost for a typical recipe serving.
  // These are estimates, not live market prices. Add aliases as your recipes grow.
  const INGREDIENT_PRICES = [
    { terms: ["rice"], cost: 8 },
    { terms: ["tomato", "tomatoes"], cost: 5 },
    { terms: ["onion", "onions"], cost: 4 },
    { terms: ["oil", "olive oil"], cost: 3 },
    { terms: ["egg", "eggs"], cost: 8 },
    { terms: ["bread"], cost: 8 },
    { terms: ["cheese"], cost: 15 },
    { terms: ["banana"], cost: 6 },
    { terms: ["oats"], cost: 10 },
    { terms: ["milk"], cost: 8 },
    { terms: ["carrot", "carrots"], cost: 5 },
    { terms: ["potato", "potatoes"], cost: 5 },
    { terms: ["spinach"], cost: 8 },
    { terms: ["peas"], cost: 8 },
    { terms: ["beans"], cost: 8 },
    { terms: ["chicken"], cost: 35 },
    { terms: ["mutton"], cost: 55 },
    { terms: ["fish"], cost: 30 },
    { terms: ["prawn", "prawns", "shrimp"], cost: 35 },
    { terms: ["paneer"], cost: 20 },
    { terms: ["curd", "yogurt"], cost: 8 },
    { terms: ["dal", "lentil", "lentils"], cost: 10 },
    { terms: ["chickpea", "chickpeas"], cost: 10 },
    { terms: ["peanut", "peanuts"], cost: 8 },
    { terms: ["almond", "almonds", "cashew", "cashews", "walnut", "walnuts"], cost: 15 },
    { terms: ["wheat", "roti", "chapati", "flour"], cost: 6 },
    { terms: ["pasta"], cost: 12 },
    { terms: ["poha"], cost: 8 },
    { terms: ["upma", "semolina", "rava"], cost: 7 },
    { terms: ["apple", "apples"], cost: 15 },
    { terms: ["berries", "strawberry", "strawberries"], cost: 20 },
    { terms: ["lemon", "lime"], cost: 3 },
    { terms: ["coconut"], cost: 8 },
    { terms: ["spice", "spices", "salt", "pepper", "cumin", "turmeric"], cost: 3 },
  ];

  const estimateRecipeCost = (recipe) => {
    const ingredientsList = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];
    if (ingredientsList.length === 0) return 25;

    const ingredientCosts = ingredientsList.map((ingredient) => {
      const text = String(ingredient).toLowerCase();
      const match = INGREDIENT_PRICES.find((item) =>
        item.terms.some((term) => new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(text))
      );
      // Unknown ingredients receive a small default estimate.
      return match ? match.cost : 8;
    });

    const total = ingredientCosts.reduce((sum, cost) => sum + cost, 0);
    return Math.max(5, Math.round(total / 5) * 5);
  };

  const generateWeeklyPlan = () => {
    setError("");
    setPlanNotice("");

    try {
      if (!recipes.length) {
        setWeeklyPlan(null);
        setError("No recipes are available. Check public/recipes.json.");
        return;
      }

      const preferred = ingredients
        .toLowerCase()
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

      const available = recipes.filter((recipe) => {
        const type = (recipe.dietType || "").toLowerCase();

        if (diet === "Vegetarian") {
          return type !== "non-vegetarian" && !containsMeat(recipe);
        }

        return type !== "vegetarian" &&
          (type === "non-vegetarian" || containsMeat(recipe));
      });

      if (!available.length) {
        setWeeklyPlan(null);
        setError(`No ${diet.toLowerCase()} recipes are available.`);
        return;
      }

      const ingredientMatches = available.filter((recipe) => {
        const text = [
          recipe.name || "",
          ...(Array.isArray(recipe.ingredients) ? recipe.ingredients : []),
        ].join(" ").toLowerCase();

        return preferred.some((item) => text.includes(item));
      });

      if (
        ingredientMode === "Strict" &&
        preferred.length > 0 &&
        ingredientMatches.length === 0
      ) {
        setWeeklyPlan(null);
        setError(
          `No recipes match ${preferred.join(", ")}. Try other ingredients or choose Flexible mode.`
        );
        return;
      }

      const pool =
        ingredientMode === "Strict" && preferred.length
          ? ingredientMatches
          : available;

      if (
        ingredientMode === "Flexible" &&
        preferred.length > 0 &&
        ingredientMatches.length === 0
      ) {
        setPlanNotice(
          `No recipes matched ${preferred.join(", ")}. Alternative recipes are shown.`
        );
      }

      const selectedMeals = MEALS.slice(0, Number(mealsPerDay));
      // Track usage counts so recipes are spread across the week as evenly as possible.
      const recipeUseCount = new Map();

      const plan = DAYS.map((day) => {
        const meals = selectedMeals.map((meal) => {
          const categoryMatches = pool.filter(
            (recipe) =>
              (recipe.category || "").toLowerCase() ===
              meal.key.toLowerCase()
          );

          const candidates = categoryMatches.length
            ? categoryMatches
            : pool;

          // Prefer category-matching recipes, but never repeat one while another
          // eligible recipe is still unused. Once all have appeared, reuse the
          // least-used recipes to distribute repeats more evenly.
          const leastUsedCount = Math.min(
            ...pool.map((recipe) => recipeUseCount.get(recipe.name) || 0)
          );

          let unused = candidates.filter(
            (recipe) => (recipeUseCount.get(recipe.name) || 0) === leastUsedCount
          );

          if (!unused.length) {
            unused = pool.filter(
              (recipe) => (recipeUseCount.get(recipe.name) || 0) === leastUsedCount
            );
          }

          // If the category has candidates used more often than other recipes,
          // fall back to the globally least-used recipes for better variety.
          const ranked = unused.map((recipe) => {
            const text = [
              recipe.name || "",
              ...(Array.isArray(recipe.ingredients) ? recipe.ingredients : []),
            ].join(" ").toLowerCase();

            let score = Math.random();

            // When a weekly budget is set, gently prefer lower-cost meals.
            const estimatedCost = estimateRecipeCost(recipe);
            const budgetValue = Number(weeklyBudget);
            if (budgetValue > 0) {
              const estimatedWeekMeals = DAYS.length * Number(mealsPerDay);
              const averageMealBudget = budgetValue / (estimatedWeekMeals * Math.max(1, Number(servings)));
              score += Math.max(-5, Math.min(5, (averageMealBudget - estimatedCost) / 25));
            }

            score += preferred.filter(
              (item) => text.includes(item)
            ).length * 5;

            const time = Number(recipe.time);

            if (
              goal === "Quick and easy meals" &&
              time > 0 && time <= 20
            ) score += 4;

            if (
              goal === "Muscle gain" &&
              /\b(egg|eggs|paneer|chicken|fish|chickpeas|peanuts|milk|curd|dal|beans)\b/.test(text)
            ) score += 2;

            if (
              goal === "Weight management" &&
              /\b(salad|soup|vegetable|vegetables|oats|chickpeas)\b/.test(text)
            ) score += 2;

            if (
              goal === "Balanced eating" &&
              /\b(vegetable|vegetables|tomato|spinach|carrot|peas|beans|oats|banana|fruit)\b/.test(text)
            ) score += 2;

            return { recipe, score };
          }).sort((a, b) => b.score - a.score);

          const chosen = ranked[0].recipe;
          recipeUseCount.set(
            chosen.name,
            (recipeUseCount.get(chosen.name) || 0) + 1
          );

          return { ...meal, recipe: chosen };
        });

        return { day, meals };
      });

      const repeatedNames = plan
        .flatMap(({ meals }) => meals.map(({ recipe }) => recipe.name))
        .filter((name, index, all) => all.indexOf(name) !== index);

      if (repeatedNames.length > 0) {
        setPlanNotice(
          `Some recipes repeat because the selected diet and filters limit the available choices. Repeats are spread out as evenly as possible.`
        );
      } else if (!planNotice) {
        setPlanNotice("Great! This plan uses a different recipe for every meal.");
      }

      setWeeklyPlan(plan);
    } catch (err) {
      console.error("Weekly plan generation failed:", err);
      setWeeklyPlan(null);
      setError("Something went wrong while generating your plan. Check the browser console.");
    }
  };

  const nutritionByDay = useMemo(() => {
    if (!weeklyPlan) return [];

    return weeklyPlan.map(({ day, meals }) => {
      const totals = {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
      };

      meals.forEach(({ recipe }) => {
        if (!recipe?.nutrition) return;

        totals.calories += Number(recipe.nutrition.calories) || 0;
        totals.protein += Number(recipe.nutrition.protein) || 0;
        totals.carbs += Number(recipe.nutrition.carbs) || 0;
        totals.fat += Number(recipe.nutrition.fat) || 0;
      });

      return { day, ...totals };
    });
  }, [weeklyPlan]);

  const weeklyTotals = nutritionByDay.reduce(
    (total, day) => ({
      calories: total.calories + day.calories,
      protein: total.protein + day.protein,
      carbs: total.carbs + day.carbs,
      fat: total.fat + day.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  useEffect(() => {
    setShoppingSelected([]);
  }, [weeklyPlan]);

  const shoppingItems = useMemo(() => {
    if (!weeklyPlan) return [];

    const uniqueItems = new Map();
    weeklyPlan.forEach(({ meals }) => {
      meals.forEach(({ recipe }) => {
        (recipe?.ingredients || []).forEach((ingredient) => {
          if (typeof ingredient !== "string" || !ingredient.trim()) return;
          const cleanIngredient = ingredient.trim();
          const key = cleanIngredient.toLowerCase();
          if (!uniqueItems.has(key)) uniqueItems.set(key, cleanIngredient);
        });
      });
    });

    return Array.from(uniqueItems.entries()).map(([key, label]) => ({ key, label }));
  }, [weeklyPlan]);

  const toggleShoppingItem = (key) => {
    setShoppingSelected((current) =>
      current.includes(key)
        ? current.filter((item) => item !== key)
        : [...current, key]
    );
  };

  const macroData = [
    {
      name: "Protein",
      value: weeklyTotals.protein,
      fill: PIE_COLORS[0],
    },
    {
      name: "Carbs",
      value: weeklyTotals.carbs,
      fill: PIE_COLORS[1],
    },
    {
      name: "Fat",
      value: weeklyTotals.fat,
      fill: PIE_COLORS[2],
    },
  ].filter((item) => item.value > 0);

  const saveWeeklyPlan = async () => {
    setSaveNotice("");

    const token = localStorage.getItem("nutriplan_token");
    if (!token) {
      setSaveNotice("Please log in before saving your weekly plan.");
      return;
    }

    if (!weeklyPlan) {
      setSaveNotice("Generate a weekly plan before saving it.");
      return;
    }

    const planData = {
      weekStarting: new Date().toISOString().slice(0, 10),
      preferences: {
        diet,
        goal,
        mealsPerDay: Number(mealsPerDay),
        servings: Number(servings),
        weeklyBudget: Number(weeklyBudget) || 0,
        ingredients: ingredients.split(",").map((item) => item.trim()).filter(Boolean),
        ingredientMode,
      },
      meals: weeklyPlan.map(({ day, meals }) => ({
        day,
        meals: meals.map(({ key, label, recipe }) => ({
          key,
          label,
          recipe: recipe ? {
            name: recipe.name,
            ingredients: recipe.ingredients || [],
            time: recipe.time,
            description: recipe.description || "",
            nutrition: recipe.nutrition || {},
            category: recipe.category || "",
            image: recipe.image || "",
          } : null,
        })),
      })),
      nutrition: {
        daily: nutritionByDay,
        weekly: weeklyTotals,
      },
      budget: {
        weeklyBudget: Number(weeklyBudget) || 0,
        estimatedCost: estimatedWeeklyCost,
        remainingBudget: (Number(weeklyBudget) || 0) - estimatedWeeklyCost,
      },
    };

    setSavingPlan(true);
    try {
      const response = await fetch("http://localhost:5000/api/mealplans", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(planData),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not save the plan.");
      setSaveNotice("Weekly plan saved to your account successfully!");
    } catch (err) {
      setSaveNotice(err.message === "Failed to fetch"
        ? "Cannot connect to the backend. Make sure the server is running."
        : err.message);
    } finally {
      setSavingPlan(false);
    }
  };

  const estimatedWeeklyCost = weeklyPlan
    ? weeklyPlan.reduce(
        (total, day) =>
          total + day.meals.reduce(
            (dayTotal, meal) => dayTotal + estimateRecipeCost(meal.recipe) * Math.max(1, Number(servings)),
            0
          ),
        0
      )
    : 0;

  return (
    <div className="weekly-page">
      <Navbar />

      <header className="weekly-hero">
        <span className="weekly-eyebrow">PLAN AHEAD, EAT WELL</span>
        <h1>Your Weekly Meal Planner 🗓️</h1>
        <p>Plan seven days of meals around your food preferences and goals.</p>
      </header>

      <main className="weekly-content">
        <section className="weekly-settings">
          <h2>Build Your Week</h2>
          <p>Choose your preferences to generate your weekly schedule.</p>

          <div className="weekly-fields">
            <label>
              Food preference
              <select value={diet} onChange={(e) => setDiet(e.target.value)}>
                <option>Vegetarian</option>
                <option>Non-vegetarian</option>
              </select>
            </label>

            <label>
              Nutrition goal
              <select value={goal} onChange={(e) => setGoal(e.target.value)}>
                <option>Balanced eating</option>
                <option>Muscle gain</option>
                <option>Weight management</option>
                <option>Quick and easy meals</option>
              </select>
            </label>

            <label>
              Meals per day
              <select
                value={mealsPerDay}
                onChange={(e) => setMealsPerDay(e.target.value)}
              >
                <option value="2">2 meals</option>
                <option value="3">3 meals</option>
                <option value="4">4 meals</option>
              </select>
            </label>

            <label>
              Number of servings
              <select value={servings} onChange={(e) => setServings(e.target.value)}>
                <option value="1">1 person</option>
                <option value="2">2 people</option>
                <option value="3">3 people</option>
                <option value="4">4 people</option>
                <option value="5">5 people</option>
                <option value="6">6 people</option>
              </select>
              <small>Cost estimates scale with the number of servings.</small>
            </label>

            <label>
              Weekly food budget (₹)
              <input
                type="number"
                min="0"
                value={weeklyBudget}
                onChange={(e) => setWeeklyBudget(e.target.value)}
                placeholder="e.g. 2500"
              />
              <small>Estimated for one person; choose servings to scale the total.</small>
            </label>

            <label>
              Ingredients you have (optional)
              <input
                value={ingredients}
                onChange={(e) => setIngredients(e.target.value)}
                placeholder="e.g. rice, tomato, onion"
              />
            </label>

            <label>
              Ingredient matching
              <select
                value={ingredientMode}
                onChange={(e) => setIngredientMode(e.target.value)}
              >
                <option value="Flexible">Flexible</option>
                <option value="Strict">Strict</option>
              </select>
            </label>
          </div>

          <button
            className="weekly-primary-btn"
            onClick={generateWeeklyPlan}
            disabled={loading}
          >
            {loading ? "Loading recipes..." : "✨ Generate My Week"}
          </button>

          {error && <p className="weekly-error">{error}</p>}
          {planNotice && <p className="weekly-notice">{planNotice}</p>}
        </section>

        {weeklyPlan && (
          <>
            <section className="weekly-budget-summary">
              <div>
                <span>Estimated weekly cost ({servings} {Number(servings) === 1 ? "person" : "people"})</span>
                <strong>₹{estimatedWeeklyCost.toLocaleString("en-IN")}</strong>
              </div>
              <div>
                <span>Your weekly budget</span>
                <strong>₹{Number(weeklyBudget || 0).toLocaleString("en-IN")}</strong>
              </div>
              <p>
                {Number(weeklyBudget) > 0 && estimatedWeeklyCost <= Number(weeklyBudget)
                  ? "This plan is within your estimated budget."
                  : "This plan is above your entered budget. Try a higher budget or fewer meals per day."}
                {" "}Costs are approximate typical-serving estimates based on a local price list, not live prices.
              </p>
            </section>
            <section className="weekly-panel">
              <div className="weekly-heading">
                <div>
                  <span className="weekly-eyebrow">YOUR WEEK, YOUR PLATE</span>
                  <h2>Your 7-Day Meal Schedule 🗓️</h2>
                  <p>Goal: {goal} · Preference: {diet}</p>
                </div>

                <div className="weekly-plan-actions">
                  <button
                    className="weekly-primary-btn"
                    onClick={saveWeeklyPlan}
                    disabled={savingPlan}
                  >
                    {savingPlan ? "Saving..." : "💾 Save Weekly Plan"}
                  </button>
                  <button
                    className="weekly-secondary-btn"
                    onClick={generateWeeklyPlan}
                  >
                    🔄 Regenerate Week
                  </button>
                </div>
              </div>

              <div className="weekly-table-wrap">
                <table className="weekly-table">
                  <thead>
                    <tr>
                      <th>Day</th>
                      {MEALS.slice(0, Number(mealsPerDay)).map((meal) => (
                        <th key={meal.key}>{meal.label}</th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {weeklyPlan.map(({ day, meals }) => (
                      <tr key={day}>
                        <th scope="row">{day}</th>
                        {meals.map((meal) => (
                          <td key={meal.key}>
                            {meal.recipe ? (
                              <details className="weekly-meal-details">
                                <summary>
                                  {meal.recipe.image ? (
                                    <img
                                      className="weekly-meal-card-image"
                                      src={meal.recipe.image}
                                      alt={meal.recipe.name}
                                      loading="lazy"
                                      onError={(e) => {
                                        e.currentTarget.style.display = "none";
                                      }}
                                    />
                                  ) : null}
                                  <strong>{meal.recipe.name}</strong>
                                  <small>
                                    {meal.recipe.time} min
                                    {meal.recipe.nutrition
                                      ? ` · ${meal.recipe.nutrition.calories} kcal`
                                      : ""}
                                  </small>
                                </summary>

                                <p>{meal.recipe.description}</p>
                                <strong>Ingredients</strong>
                                <ul>
                                  {(meal.recipe.ingredients || []).map((item) => (
                                    <li key={item}>{item}</li>
                                  ))}
                                </ul>

                                <strong>Cooking instructions</strong>
                                {meal.recipe.steps?.length ? (
                                  <ol>
                                    {meal.recipe.steps.map((step, index) => (
                                      <li key={index}>{step}</li>
                                    ))}
                                  </ol>
                                ) : (
                                  <p>Instructions are not available yet.</p>
                                )}
                              </details>
                            ) : (
                              <span>No recipe available</span>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {saveNotice && <p className="weekly-notice" role="status">{saveNotice}</p>}

              <p className="weekly-hint">
                Click a meal to view its ingredients and cooking instructions.
                Recipes are kept unique across the week where possible.
              </p>
            </section>

            <section className="weekly-panel">
              <div className="weekly-heading">
                <div>
                  <span className="weekly-eyebrow">NUTRITION AT A GLANCE</span>
                  <h2>Weekly Nutrition Summary 📊</h2>
                  <p>Estimated totals from recipes with nutrition data.</p>
                </div>
              </div>

              <div className="weekly-total-cards">
                <article>
                  <span>🔥 Weekly calories</span>
                  <strong>{weeklyTotals.calories.toLocaleString()} kcal</strong>
                </article>
                <article>
                  <span>💪 Weekly protein</span>
                  <strong>{weeklyTotals.protein} g</strong>
                </article>
                <article>
                  <span>🌾 Weekly carbs</span>
                  <strong>{weeklyTotals.carbs} g</strong>
                </article>
                <article>
                  <span>🥑 Weekly fat</span>
                  <strong>{weeklyTotals.fat} g</strong>
                </article>
              </div>

              <div className="nutrition-and-shopping-layout">
                <div className="nutrition-main">
                  <div className="nutrition-dashboard">
                    <div className="nutrition-chart-card">
                      <h3>📊 Daily Calorie Comparison</h3>
                      <p>Estimated calories from planned meals each day.</p>
                      <div className="nutrition-chart">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={nutritionByDay}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="calories" name="Calories (kcal)" fill="#4c9662" radius={[5, 5, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="nutrition-chart-card">
                      <h3>🥗 Weekly Macronutrients</h3>
                      <p>Estimated protein, carbohydrates, and fat totals.</p>
                      <div className="nutrition-chart">
                        {macroData.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={macroData}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                outerRadius={85}
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                shape={(props) => <Sector {...props} fill={props.payload?.fill || "#4c9662"} />}
                              />
                              <Tooltip />
                              <Legend />
                            </PieChart>
                          </ResponsiveContainer>
                        ) : (
                          <p>No macronutrient data is available.</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="weekly-table-wrap">
                    <table className="weekly-nutrition-table">
                      <thead><tr><th>Day</th><th>Calories</th><th>Protein</th><th>Carbs</th><th>Fat</th></tr></thead>
                      <tbody>
                        {nutritionByDay.map((day) => (
                          <tr key={day.day}>
                            <th scope="row">{day.day}</th>
                            <td>{day.calories.toLocaleString()} kcal</td>
                            <td>{day.protein} g</td>
                            <td>{day.carbs} g</td>
                            <td>{day.fat} g</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <aside className="shopping-list-card">
                  <span className="weekly-eyebrow">PLAN YOUR GROCERIES</span>
                  <h3>🛒 Shopping List</h3>
                  <p>Tick only the ingredients you need to buy. Items are gathered from your weekly recipes.</p>
                  <div className="shopping-list-count">{shoppingSelected.length} item{shoppingSelected.length === 1 ? "" : "s"} selected</div>

                  {shoppingItems.length ? (
                    <div className="shopping-list-items">
                      {shoppingItems.map(({ key, label }) => (
                        <label className="shopping-list-item" key={key}>
                          <input
                            type="checkbox"
                            checked={shoppingSelected.includes(key)}
                            onChange={() => toggleShoppingItem(key)}
                          />
                          <span>{label}</span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <p>No ingredients were found in this weekly plan.</p>
                  )}

                  <button
                    className="weekly-primary-btn shopping-print-button"
                    type="button"
                    disabled={shoppingSelected.length === 0}
                    onClick={() => window.print()}
                  >
                    🖨️ Print Shopping List
                  </button>

                  <div className="shopping-print-area">
                    <h2>NutriPlan — Shopping List</h2>
                    <ul>
                      {shoppingItems.filter(({ key }) => shoppingSelected.includes(key)).map(({ key, label }) => (
                        <li key={key}>{label}</li>
                      ))}
                    </ul>
                  </div>
                </aside>
              </div>

              <p className="weekly-hint">
                Values are approximate and include only recipes with nutrition
                data. Actual nutrition varies by serving size and preparation.
              </p>
            </section>
          </>
        )}
      </main>

      <footer className="weekly-footer">
        Made with 💚 and a little hunger | NutriPlan © 2026
      </footer>
    </div>
  );
}

export default WeeklyPlanner;

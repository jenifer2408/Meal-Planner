
import { useEffect, useState } from "react";
import Navbar from "../components/Navbar.jsx";
import "./MealPlanner.css";

function MealPlanner() {
  const [recipes, setRecipes] = useState([]);
  const [diet, setDiet] = useState("Vegetarian");
  const [goal, setGoal] = useState("Balanced eating");
  const [mealsPerDay, setMealsPerDay] = useState("4");
  const [ingredients, setIngredients] = useState("");
  const [ingredientMode, setIngredientMode] = useState("Flexible");
  const [mealPlan, setMealPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [planNotice, setPlanNotice] = useState("");
  const [viewMode, setViewMode] = useState("Daily");
  const [weeklyPlan, setWeeklyPlan] = useState(null);

  useEffect(() => {
    fetch("/recipes.json")
      .then((response) => {
        if (!response.ok) throw new Error("Could not load recipes.");
        return response.json();
      })
      .then((data) => setRecipes(data))
      .catch(() =>
        setError("Unable to load recipes. Please check recipes.json.")
      )
      .finally(() => setLoading(false));
  }, []);

  const containsMeat = (recipe) => {
    const text = [
      recipe.name || "",
      ...(recipe.ingredients || [])
    ].join(" ").toLowerCase();

    return /\b(chicken|mutton|fish|prawn|prawns|shrimp|beef|pork|turkey|meat)\b/.test(text);
  };

  const generatePlan = () => {
    setPlanNotice("");

    if (recipes.length === 0) {
      setError("No recipes are available yet.");
      setMealPlan(null);
      return;
    }

    const preferredIngredients = ingredients
      .toLowerCase()
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    let availableRecipes = recipes.filter((recipe) => {
      const type = (recipe.dietType || "").toLowerCase();

      if (diet === "Vegetarian") {
        if (type === "non-vegetarian") return false;
        return type === "vegetarian" || !containsMeat(recipe);
      }

      if (type === "vegetarian") return false;
      return type === "non-vegetarian" || containsMeat(recipe);
    });

    if (availableRecipes.length === 0) {
      setError(
        `No ${diet.toLowerCase()} recipes are available. Add more recipes to recipes.json.`
      );
      setMealPlan(null);
      return;
    }

    const ingredientMatches = preferredIngredients.length
      ? availableRecipes.filter((recipe) => {
          const recipeText = [
            recipe.name || "",
            ...(recipe.ingredients || [])
          ].join(" ").toLowerCase();

          return preferredIngredients.some((item) => recipeText.includes(item));
        })
      : availableRecipes;

    if (
      ingredientMode === "Strict" &&
      preferredIngredients.length > 0 &&
      ingredientMatches.length === 0
    ) {
      setError(
        `No ${diet.toLowerCase()} recipes match any of these ingredients: ${preferredIngredients.join(", ")}. Try different ingredients or choose Flexible mode.`
      );
      setMealPlan(null);
      return;
    }

    const recipePool =
      ingredientMode === "Strict" && preferredIngredients.length > 0
        ? ingredientMatches
        : availableRecipes;

    const mealTypes = [
      { key: "Breakfast", label: "🌅 Breakfast" },
      { key: "Lunch", label: "☀️ Lunch" },
      { key: "Snacks", label: "🍎 Snack" },
      { key: "Dinner", label: "🌙 Dinner" }
    ];

    const selectedMeals = mealTypes.slice(0, Number(mealsPerDay));
    const usedRecipes = new Set();

    const generatedPlan = selectedMeals.map((meal) => {
      const categoryMatches = recipePool.filter(
        (recipe) =>
          (recipe.category || "").toLowerCase() === meal.key.toLowerCase()
      );

      let candidates =
        categoryMatches.length > 0 ? categoryMatches : recipePool;

      let unused = candidates.filter(
        (recipe) => !usedRecipes.has(recipe.name)
      );

      if (unused.length === 0) {
        unused = recipePool.filter(
          (recipe) => !usedRecipes.has(recipe.name)
        );
      }

      if (unused.length === 0) {
        return { ...meal, recipe: null };
      }

      candidates = unused;

      const scored = candidates.map((recipe) => {
        let score = Math.random();

        const ingredientText = (recipe.ingredients || [])
          .join(" ")
          .toLowerCase();

        const nameAndIngredients = [
          recipe.name || "",
          ...((recipe.ingredients || []))
        ].join(" ").toLowerCase();

        const matchingIngredients = preferredIngredients.filter((item) =>
          ingredientText.includes(item)
        ).length;

        score += matchingIngredients * 5;

        const time = Number(recipe.time);
        const isQuick = Number.isFinite(time) && time > 0 && time <= 20;

        if (goal === "Quick and easy meals" && isQuick) score += 4;

        if (
          goal === "Muscle gain" &&
          /\b(egg|eggs|paneer|chicken|fish|chickpeas|peanuts|milk|curd|dal|beans)\b/.test(nameAndIngredients)
        ) {
          score += 2;
        }

        if (
          goal === "Weight management" &&
          /\b(salad|soup|vegetable|vegetables|oats|chickpeas)\b/.test(nameAndIngredients)
        ) {
          score += 2;
        }

        if (
          goal === "Balanced eating" &&
          /\b(vegetable|vegetables|tomato|spinach|carrot|peas|beans|oats|banana|fruit)\b/.test(nameAndIngredients)
        ) {
          score += 2;
        }

        return { recipe, score };
      });

      scored.sort((a, b) => b.score - a.score);

      const chosen = scored[0].recipe;
      usedRecipes.add(chosen.name);

      return { ...meal, recipe: chosen };
    });

    setError("");
    if (
      ingredientMode === "Flexible" &&
      preferredIngredients.length > 0 &&
      ingredientMatches.length === 0
    ) {
      setPlanNotice(
        `No recipes matched ${preferredIngredients.join(", ")}. These are alternative ${diet.toLowerCase()} suggestions based on your other preferences.`
      );
    }
    setMealPlan(generatedPlan);
  };

  const generateWeeklyPlan = () => {
    setError("");
    setPlanNotice("");
    setMealPlan(null);
    setWeeklyPlan(null);

    if (recipes.length === 0) {
      setError("No recipes are available yet. Please check recipes.json.");
      return;
    }

    const preferredIngredients = ingredients
      .toLowerCase()
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    const availableRecipes = recipes.filter((recipe) => {
      const type = (recipe.dietType || "").toLowerCase();
      if (diet === "Vegetarian") {
        if (type === "non-vegetarian") return false;
        return type === "vegetarian" || !containsMeat(recipe);
      }
      if (type === "vegetarian") return false;
      return type === "non-vegetarian" || containsMeat(recipe);
    });

    if (availableRecipes.length === 0) {
      setError(`No ${diet.toLowerCase()} recipes are available.`);
      return;
    }

    const ingredientMatches = preferredIngredients.length
      ? availableRecipes.filter((recipe) => {
          const text = [recipe.name || "", ...(recipe.ingredients || [])]
            .join(" ").toLowerCase();
          return preferredIngredients.some((item) => text.includes(item));
        })
      : availableRecipes;

    if (ingredientMode === "Strict" && preferredIngredients.length && !ingredientMatches.length) {
      setError(`No recipes match these ingredients: ${preferredIngredients.join(", ")}. Try different ingredients or choose Flexible mode.`);
      return;
    }

    const pool = ingredientMode === "Strict" && preferredIngredients.length
      ? ingredientMatches
      : availableRecipes;
    if (ingredientMode === "Flexible" && preferredIngredients.length && !ingredientMatches.length) {
      setPlanNotice(`No recipes matched ${preferredIngredients.join(", ")}. The weekly plan uses alternative suggestions based on your other preferences.`);
    }

    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const mealTypes = [
      { key: "Breakfast", label: "🌅 Breakfast" },
      { key: "Lunch", label: "☀️ Lunch" },
      { key: "Snacks", label: "🍎 Snack" },
      { key: "Dinner", label: "🌙 Dinner" }
    ].slice(0, Number(mealsPerDay));

    const generated = days.map((day) => {
      const used = new Set();
      const meals = mealTypes.map((meal) => {
        const categoryMatches = pool.filter((recipe) =>
          (recipe.category || "").toLowerCase() === meal.key.toLowerCase()
        );
        let candidates = categoryMatches.length ? categoryMatches : pool;
        let unused = candidates.filter((recipe) => !used.has(recipe.name));
        if (!unused.length) unused = pool.filter((recipe) => !used.has(recipe.name));
        if (!unused.length) return { ...meal, recipe: null };

        const ranked = unused.map((recipe) => {
          const text = [recipe.name || "", ...(recipe.ingredients || [])].join(" ").toLowerCase();
          let score = Math.random();
          score += preferredIngredients.filter((item) => text.includes(item)).length * 5;
          const time = Number(recipe.time);
          if (goal === "Quick and easy meals" && time > 0 && time <= 20) score += 4;
          if (goal === "Muscle gain" && /\b(egg|eggs|paneer|chicken|fish|chickpeas|peanuts|milk|curd|dal|beans)\b/.test(text)) score += 2;
          if (goal === "Weight management" && /\b(salad|soup|vegetable|vegetables|oats|chickpeas)\b/.test(text)) score += 2;
          if (goal === "Balanced eating" && /\b(vegetable|tomato|spinach|carrot|peas|beans|oats|banana|fruit)\b/.test(text)) score += 2;
          return { recipe, score };
        }).sort((a, b) => b.score - a.score);

        const chosen = ranked[0].recipe;
        used.add(chosen.name);
        return { ...meal, recipe: chosen };
      });
      return { day, meals };
    });

    setWeeklyPlan(generated);
  };

  const dailyNutrition = (mealPlan || []).reduce(
    (total, meal) => {
      if (!meal.recipe?.nutrition) return total;

      total.calories += Number(meal.recipe.nutrition.calories) || 0;
      total.protein += Number(meal.recipe.nutrition.protein) || 0;
      total.carbs += Number(meal.recipe.nutrition.carbs) || 0;
      total.fat += Number(meal.recipe.nutrition.fat) || 0;
      total.count += 1;

      return total;
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0, count: 0 }
  );

  const hasNutrition = dailyNutrition.count > 0;

  return (
    <div className="planner-page">
      <Navbar />

      <header className="planner-hero">
        <span className="planner-tag">YOUR DAY, YOUR PLATE</span>
        <h1>Your Personalized Meal Plan 🥗</h1>
        <p>Tell us what you like. We'll help you decide what to eat today.</p>
      </header>

      <main className="planner-content">
        <section className="planner-form">
          <h2>Let's plan your meals!</h2>
          <p className="planner-subtitle">
            Customize your preferences to get recipe suggestions.
          </p>

          <label htmlFor="plannerMode">Planning mode</label>
          <select
            id="plannerMode"
            value={viewMode}
            onChange={(e) => {
              setViewMode(e.target.value);
              setMealPlan(null);
              setWeeklyPlan(null);
              setError("");
              setPlanNotice("");
            }}
          >
            <option value="Daily">Daily meal plan</option>
            <option value="Weekly">Weekly meal plan (7 days)</option>
          </select>

          <label htmlFor="diet">Food preference</label>
          <select
            id="diet"
            value={diet}
            onChange={(e) => setDiet(e.target.value)}
          >
            <option>Vegetarian</option>
            <option>Non-vegetarian</option>
          </select>

          <label htmlFor="goal">Your goal</label>
          <select
            id="goal"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
          >
            <option>Balanced eating</option>
            <option>Muscle gain</option>
            <option>Weight management</option>
            <option>Quick and easy meals</option>
          </select>

          <label htmlFor="meals">Meals per day</label>
          <select
            id="meals"
            value={mealsPerDay}
            onChange={(e) => setMealsPerDay(e.target.value)}
          >
            <option value="2">2 meals</option>
            <option value="3">3 meals</option>
            <option value="4">4 meals</option>
          </select>

          <label htmlFor="ingredients">Ingredients you have (optional)</label>
          <input
            id="ingredients"
            type="text"
            placeholder="e.g. rice, tomato, onion"
            value={ingredients}
            onChange={(e) => setIngredients(e.target.value)}
          />
          <p className="input-hint">Separate ingredients with commas.</p>

          <label htmlFor="ingredientMode">Ingredient matching</label>
          <select
            id="ingredientMode"
            value={ingredientMode}
            onChange={(e) => setIngredientMode(e.target.value)}
          >
            <option value="Flexible">Flexible — prioritize matching recipes</option>
            <option value="Strict">Strict — only matching recipes</option>
          </select>
          <p className="input-hint">
            Strict mode matches recipes containing at least one ingredient you enter.
          </p>

          <button
            className="generate-btn"
            onClick={viewMode === "Weekly" ? generateWeeklyPlan : generatePlan}
            disabled={loading}
          >
            {loading ? "Loading recipes..." : viewMode === "Weekly" ? "✨ Generate My Weekly Plan" : "✨ Generate My Meal Plan"}
          </button>

          {error && <p className="planner-error">{error}</p>}
        </section>

        {weeklyPlan && (
          <section className="generated-plan weekly-generated-plan">
            <div className="plan-heading">
              <div>
                <span className="planner-tag">YOUR WEEK, YOUR PLATE</span>
                <h2>Your 7-Day Meal Plan 🗓️</h2>
                <p>Goal: {goal} · Preference: {diet}</p>
                {ingredients.trim() && <p>Ingredients: {ingredients} · Mode: {ingredientMode}</p>}
                {planNotice && <p className="planner-notice">ℹ️ {planNotice}</p>}
              </div>
              <button className="regenerate-btn" onClick={generateWeeklyPlan}>🔄 Regenerate Week</button>
            </div>
            <div className="weekly-plan-grid">
              {weeklyPlan.map((day) => (
                <section className="weekly-day-card" key={day.day}>
                  <h3>{day.day}</h3>
                  {day.meals.map((meal) => (
                    <article className="weekly-meal" key={meal.key}>
                      <span className="meal-label">{meal.label}</span>
                      {meal.recipe ? (
                        <>
                          {meal.recipe.image ? (
                            <div className="planned-meal-image-wrap">
                              <img
                                className="planned-meal-image"
                                src={meal.recipe.image}
                                alt={meal.recipe.name}
                                loading="lazy"
                                onError={(e) => {
                                  e.currentTarget.style.display = "none";
                                }}
                              />
                            </div>
                          ) : null}
                          <h4>{meal.recipe.name}</h4>
                          <p>{meal.recipe.description}</p>
                          <div className="planned-meal-meta">⏱️ {meal.recipe.time} minutes</div>
                          {meal.recipe.nutrition && (
                            <p className="weekly-nutrition-line">
                              🔥 {meal.recipe.nutrition.calories} kcal · 💪 {meal.recipe.nutrition.protein}g protein
                            </p>
                          )}
                          <details>
                            <summary>Ingredients & instructions</summary>
                            <strong>Ingredients</strong>
                            <ul>{(meal.recipe.ingredients || []).map((item) => <li key={item}>{item}</li>)}</ul>
                            <strong>Cooking instructions</strong>
                            {meal.recipe.steps?.length ? (
                              <ol>{meal.recipe.steps.map((step, index) => <li key={index}>{step}</li>)}</ol>
                            ) : <p>Instructions are not available yet.</p>}
                          </details>
                        </>
                      ) : <p>No different recipe is available for this meal yet.</p>}
                    </article>
                  ))}
                </section>
              ))}
            </div>
          </section>
        )}

        {mealPlan && (
          <section className="generated-plan">
            <div className="plan-heading">
              <div>
                <span className="planner-tag">MADE FOR YOUR PREFERENCES</span>
                <h2>Your Daily Menu 🍽️</h2>
                <p>Goal: {goal} · Preference: {diet}</p>
                {ingredients.trim() && (
                  <p>
                    Ingredients: {ingredients} · Mode: {ingredientMode}
                  </p>
                )}
                {planNotice && <p className="planner-notice">ℹ️ {planNotice}</p>}
              </div>
              <button className="regenerate-btn" onClick={generatePlan}>
                🔄 Regenerate
              </button>
            </div>

            {hasNutrition && (
              <section className="daily-nutrition">
                <h2>📊 Your Daily Nutrition Summary</h2>
                <p>
                  Estimated totals from {dailyNutrition.count} meal
                  {dailyNutrition.count === 1 ? "" : "s"} with nutrition data.
                </p>

                <div className="daily-nutrition-grid">
                  <div className="daily-nutrition-item calories">
                    <span>🔥 Calories</span>
                    <strong>{dailyNutrition.calories} kcal</strong>
                  </div>
                  <div className="daily-nutrition-item protein">
                    <span>💪 Protein</span>
                    <strong>{dailyNutrition.protein} g</strong>
                  </div>
                  <div className="daily-nutrition-item carbs">
                    <span>🌾 Carbs</span>
                    <strong>{dailyNutrition.carbs} g</strong>
                  </div>
                  <div className="daily-nutrition-item fat">
                    <span>🥑 Fat</span>
                    <strong>{dailyNutrition.fat} g</strong>
                  </div>
                </div>

                <p className="nutrition-note">
                  Approximate values per serving. Actual nutrition varies with
                  portion size and preparation.
                </p>
              </section>
            )}

            <div className="meal-plan-grid">
              {mealPlan.map((meal) => (
                <article className="planned-meal" key={meal.key}>
                  <span className="meal-label">{meal.label}</span>

                  {!meal.recipe ? (
                    <p>No different recipe is available for this meal yet.</p>
                  ) : (
                    <>
                      {meal.recipe.image ? (
                        <div className="planned-meal-image-wrap">
                          <img
                            className="planned-meal-image"
                            src={meal.recipe.image}
                            alt={meal.recipe.name}
                            loading="lazy"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        </div>
                      ) : null}
                      <h3>{meal.recipe.name}</h3>
                      <p>{meal.recipe.description}</p>

                      <div className="planned-meal-meta">
                        ⏱️ {meal.recipe.time} minutes
                      </div>

                      {meal.recipe.nutrition && (
                        <div className="nutrition-panel">
                          <h4>🥗 Nutrition per serving</h4>

                          <div className="nutrition-grid">
                            <div className="nutrition-item calories">
                              <strong>{meal.recipe.nutrition.calories}</strong>
                              <span>kcal</span>
                              <small>Calories</small>
                            </div>
                            <div className="nutrition-item protein">
                              <strong>{meal.recipe.nutrition.protein}g</strong>
                              <small>Protein</small>
                            </div>
                            <div className="nutrition-item carbs">
                              <strong>{meal.recipe.nutrition.carbs}g</strong>
                              <small>Carbs</small>
                            </div>
                            <div className="nutrition-item fat">
                              <strong>{meal.recipe.nutrition.fat}g</strong>
                              <small>Fat</small>
                            </div>
                          </div>
                          <p className="nutrition-note">
                            Approximate values; actual nutrition varies by
                            portion and preparation.
                          </p>
                        </div>
                      )}

                      <details>
                        <summary>View ingredients</summary>
                        <ul>
                          {(meal.recipe.ingredients || []).map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </details>

                      <details>
                        <summary>Cooking instructions</summary>
                        {meal.recipe.steps?.length > 0 ? (
                          <ol>
                            {meal.recipe.steps.map((step, index) => (
                              <li key={index}>{step}</li>
                            ))}
                          </ol>
                        ) : (
                          <p>Instructions are not available yet.</p>
                        )}
                      </details>
                    </>
                  )}
                </article>
              ))}
            </div>
          </section>
        )}
      </main>

      <footer>
        Made with 💚 and a little hunger | NutriPlan © 2026
      </footer>
    </div>
  );
}

export default MealPlanner;

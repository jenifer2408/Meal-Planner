
import { useState, useEffect } from "react";
import Navbar from "../components/Navbar.jsx";
import "./FindMeals.css";

function FindMeals() {
  const [ingredients, setIngredients] = useState("");
  const [results, setResults] = useState(null);
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    fetch("/recipes.json")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Could not load recipes");
        }
        return response.json();
      })
      .then(setRecipes)
      .catch((error) => {
        console.error("Recipe loading error:", error);
        setLoadError(true);
      })
      .finally(() => setLoading(false));
  }, []);

  function findRecipes() {
    const available = ingredients
      .toLowerCase()
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    if (available.length === 0) {
      setResults([]);
      return;
    }

    const matches = recipes
      .map((recipe) => {
        const recipeIngredients = recipe.ingredients || [];

        const matched = recipeIngredients.filter((item) =>
          available.some(
            (a) =>
              item.toLowerCase().includes(a) ||
              a.includes(item.toLowerCase())
          )
        );

        const missing = recipeIngredients.filter(
          (item) => !matched.includes(item)
        );

        return {
          ...recipe,
          matched,
          missing,
          score:
            matched.length / Math.max(recipeIngredients.length, 1),
        };
      })
      .filter((recipe) => recipe.matched.length >= 2)
      .sort(
        (a, b) =>
          b.score - a.score ||
          b.matched.length - a.matched.length
      );

    setResults(matches);
  }

  return (
    <div className="find-meals-page">
      <Navbar />

      <header className="find-meals-hero">
        <span className="find-meals-tag">
          YOUR FOOD. YOUR MOOD. YOUR PLAN.
        </span>

        <h1>
          Hungry again?
          <br />
          <span>Out of ideas?</span>
        </h1>

        <p>
          Too lazy to decide what to eat?
          <br />
          Tell us what's in your kitchen.
          <br />
          We'll figure out dinner!
        </p>

        <div className="find-meals-emoji">🥑 🥗 🍓</div>
      </header>

      <main className="find-meals-content">
        <section className="find-meals-form">
          <span className="find-meals-tag">
            THE FRIDGE RESCUE PLAN
          </span>

          <h2>What's in your kitchen?</h2>

          <p>
            Enter ingredients separated by commas. Let's see
            what you can cook!
          </p>

          <textarea
            value={ingredients}
            onChange={(e) => setIngredients(e.target.value)}
            placeholder="e.g. rice, tomato, onion, egg..."
            aria-label="Ingredients you have"
          />

          <button
            onClick={findRecipes}
            disabled={loading || loadError}
          >
            {loading ? "Loading recipes..." : "Find Recipes"}
          </button>

          {loadError && (
            <p className="find-meals-error">
              Couldn't load recipes. Please check recipes.json
              and refresh the page.
            </p>
          )}
        </section>

        {results !== null && !loadError && (
          <section className="find-meals-results">
            <h2>
              {results.length
                ? "Your kitchen can make these!"
                : "Oops! No matching recipes yet"}
            </h2>

            {!results.length && (
              <p>
                Try ingredients like rice, tomato, onion, egg,
                bread, cheese, banana or oats.
              </p>
            )}

            <div className="find-meals-grid">
              {results.map((recipe) => (
                <article
                  className="find-meals-card"
                  key={recipe.name}
                >
                  <div className="find-meals-card-image">
                    {recipe.image ? (
                      <img
                        src={recipe.image}
                        alt={recipe.name}
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="find-meals-no-image">
                        Image unavailable
                      </div>
                    )}
                  </div>

                  <div className="find-meals-card-body">
                    <h3>{recipe.name}</h3>

                    <p>{recipe.description}</p>

                    <p className="find-meals-time">
                      Cooking time: {recipe.time} minutes
                    </p>

                    <p>
                      <strong>You have:</strong>{" "}
                      {recipe.matched.join(", ")}
                    </p>

                    {recipe.missing.length ? (
                      <p className="find-meals-missing">
                        <strong>Still need:</strong>{" "}
                        {recipe.missing.join(", ")}
                      </p>
                    ) : (
                      <p className="find-meals-complete">
                        You have all listed ingredients!
                      </p>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
      </main>

      <section className="find-meals-about">
        <h2>Less thinking. More eating.</h2>
        <p>
          Plan your meals, discover recipes, and create your
          grocery list — all in one place.
        </p>
      </section>

      <footer className="find-meals-footer">
        Made with care | NutriPlan © 2026
      </footer>
    </div>
  );
}

export default FindMeals;


import { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar.jsx";
import "./Recipes.css";

function getRecipeImage(recipe) {
  return recipe?.image || "";
}


function Recipes() {
  const [recipes, setRecipes] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [diet, setDiet] = useState("All");
  const [maxTime, setMaxTime] = useState("All");
  const [showFavourites, setShowFavourites] = useState(false);
  const [favourites, setFavourites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [ingredientReplacements, setIngredientReplacements] = useState({});

  useEffect(() => {
    fetch("/recipes.json")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to load recipes");
        }
        return response.json();
      })
      .then((data) => {
        if (!Array.isArray(data)) {
          throw new Error("Invalid recipe data");
        }
        setRecipes(data);
      })
      .catch((error) => {
        console.error("Recipe loading error:", error);
      })
      .finally(() => setLoading(false));
  }, []);

  const categories = [
    "All",
    "Breakfast",
    "Lunch",
    "Dinner",
    "Snacks",
  ];

  const containsMeat = (recipe) => {
    const text = [
      recipe.name || "",
      ...(Array.isArray(recipe.ingredients)
        ? recipe.ingredients
        : []),
    ]
      .join(" ")
      .toLowerCase();

    return /\b(chicken|mutton|fish|prawn|prawns|shrimp|beef|pork|turkey|meat)\b/.test(
      text
    );
  };

  // Load the logged-in user's favorites from MongoDB.
  useEffect(() => {
    const loadFavourites = async () => {
      const token = localStorage.getItem("nutriplan_token");

      if (!token) {
        setFavourites([]);
        return;
      }

      try {
        const response = await fetch("http://localhost:5000/api/favorites", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Could not load favorite recipes.");
        }

        setFavourites(
          Array.isArray(data)
            ? data.map((favorite) => favorite.recipeId)
            : []
        );
      } catch (error) {
        console.error("Load favorites error:", error);
      }
    };

    loadFavourites();
  }, []);

  const isFavourite = (recipe) => favourites.includes(recipe.name);

  const toggleFavourite = async (recipe) => {
    const token = localStorage.getItem("nutriplan_token");

    if (!token) {
      alert("Please log in to save favorite recipes.");
      return;
    }

    const recipeId = recipe.name;
    const alreadyFavourite = favourites.includes(recipeId);

    try {
      const response = await fetch(
        alreadyFavourite
          ? `http://localhost:5000/api/favorites/${encodeURIComponent(recipeId)}`
          : "http://localhost:5000/api/favorites",
        {
          method: alreadyFavourite ? "DELETE" : "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          ...(alreadyFavourite
            ? {}
            : {
                body: JSON.stringify({
                  recipeId,
                  recipeName: recipe.name,
                }),
              }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not update favorite recipe.");
      }

      setFavourites((current) =>
        alreadyFavourite
          ? current.filter((name) => name !== recipeId)
          : current.includes(recipeId)
            ? current
            : [...current, recipeId]
      );
    } catch (error) {
      console.error("Update favorite error:", error);
      alert(error.message || "Could not update favorite recipe.");
    }
  };

  const filteredRecipes = useMemo(() => {
    return recipes.filter((recipe) => {
      const searchText = search.toLowerCase().trim();

      const ingredients = Array.isArray(recipe.ingredients)
        ? recipe.ingredients
        : [];

      const matchesSearch =
        (recipe.name || "")
          .toLowerCase()
          .includes(searchText) ||
        ingredients.some((ingredient) =>
          String(ingredient).toLowerCase().includes(searchText)
        ) ||
        (recipe.description || "")
          .toLowerCase()
          .includes(searchText);

      const matchesCategory =
        category === "All" ||
        (recipe.category || "").toLowerCase() ===
          category.toLowerCase();

      const dietType = (recipe.dietType || "").toLowerCase();
      const hasMeat = containsMeat(recipe);

      const isVegetarian =
        dietType === "vegetarian" ||
        (dietType !== "non-vegetarian" && !hasMeat);

      const matchesDiet =
        diet === "All" ||
        (diet === "Vegetarian" && isVegetarian) ||
        (diet === "Non-vegetarian" &&
          (dietType === "non-vegetarian" || hasMeat));

      const cookingTime = Number(recipe.time);

      const matchesTime =
        maxTime === "All" ||
        (Number.isFinite(cookingTime) &&
          cookingTime > 0 &&
          cookingTime <= Number(maxTime));

      const matchesFavourite =
        !showFavourites || favourites.includes(recipe.name);

      return (
        matchesSearch &&
        matchesCategory &&
        matchesDiet &&
        matchesTime &&
        matchesFavourite
      );
    });
  }, [recipes, search, category, diet, maxTime, showFavourites, favourites]);

  const openRecipe = (recipe) => {
    setIngredientReplacements({});
    setSelectedRecipe(recipe);
  };

  const replaceIngredient = (ingredient, replacement) => {
    setIngredientReplacements((current) => {
      const updated = { ...current };
      if (!replacement) delete updated[ingredient];
      else updated[ingredient] = replacement;
      return updated;
    });
  };

  const clearFilters = () => {
    setSearch("");
    setCategory("All");
    setDiet("All");
    setMaxTime("All");
    setShowFavourites(false);
  };

  const hasNutrition = (recipe) =>
    recipe?.nutrition &&
    ["calories", "protein", "carbs", "fat"].some(
      (key) =>
        recipe.nutrition[key] !== undefined &&
        recipe.nutrition[key] !== null &&
        recipe.nutrition[key] !== ""
    );

  const renderNutrition = (recipe, detailed = false) => {
    if (!hasNutrition(recipe)) {
      return (
        <p className="nutrition-unavailable">
          Nutrition information is not available for this recipe.
        </p>
      );
    }

    const nutrition = recipe.nutrition;

    const items = [
      {
        label: "Calories",
        key: "calories",
        unit: "kcal",
      },
      {
        label: "Protein",
        key: "protein",
        unit: "g",
      },
      {
        label: "Carbs",
        key: "carbs",
        unit: "g",
      },
      {
        label: "Fat",
        key: "fat",
        unit: "g",
      },
    ];

    return (
      <div
        className={
          detailed
            ? "recipe-nutrition-grid"
            : "recipe-mini-nutrition"
        }
      >
        {items.map(({ label, key, unit }) => (
          <div
            className={
              detailed
                ? "recipe-nutrition-item"
                : undefined
            }
            key={key}
          >
            {detailed ? (
              <>
                <span>{label}</span>
                <strong>
                  {nutrition[key] ?? "—"} {unit}
                </strong>
              </>
            ) : (
              <span>
                {label}: {nutrition[key] ?? "—"} {unit}
              </span>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="recipes-page">
      <Navbar />

      <header className="recipes-hero">
        <span className="tagline">
          YOUR NEXT DELICIOUS IDEA
        </span>

        <h1>Explore Our Healthy Recipes</h1>

        <p>
          Discover quick, wholesome dishes that fit real-life
          schedules and taste amazing. Search recipes, explore
          ingredients, and find meals that match your goals.
        </p>
      </header>

      <main className="recipes-content">
        <input
          className="recipe-search"
          type="text"
          placeholder="Search recipes or ingredients..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search recipes or ingredients"
        />

        <div className="category-filters">
          {categories.map((item) => (
            <button
              key={item}
              className={category === item ? "active" : ""}
              onClick={() => setCategory(item)}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="recipe-favourite-filter">
          <button
            type="button"
            className={showFavourites ? "favourites-filter-btn active" : "favourites-filter-btn"}
            onClick={() => setShowFavourites((current) => !current)}
            aria-pressed={showFavourites}
          >
            {showFavourites ? "Showing Favourites" : "Show Favourites"}
            {" "}({favourites.length})
          </button>
        </div>

        <div className="recipe-advanced-filters">
          <label>
            Food preference
            <select
              value={diet}
              onChange={(e) => setDiet(e.target.value)}
            >
              <option value="All">All diets</option>
              <option value="Vegetarian">Vegetarian</option>
              <option value="Non-vegetarian">
                Non-vegetarian
              </option>
            </select>
          </label>

          <label>
            Maximum cooking time
            <select
              value={maxTime}
              onChange={(e) => setMaxTime(e.target.value)}
            >
              <option value="All">Any duration</option>
              <option value="15">15 minutes or less</option>
              <option value="30">30 minutes or less</option>
              <option value="45">45 minutes or less</option>
            </select>
          </label>

          <button
            type="button"
            className="clear-recipe-filters"
            onClick={clearFilters}
          >
            Clear filters
          </button>
        </div>

        {!loading && (
          <p className="recipe-result-count">
            Showing <strong>{filteredRecipes.length}</strong>{" "}
            of <strong>{recipes.length}</strong> recipes
          </p>
        )}

        {loading ? (
          <p className="recipe-message">
            Loading recipes...
          </p>
        ) : filteredRecipes.length === 0 ? (
          <div className="recipe-empty-state">
            <p className="recipe-message">
              No recipes found. Try changing your filters.
            </p>
            <button
              className="clear-recipe-filters"
              onClick={clearFilters}
            >
              Show all recipes
            </button>
          </div>
        ) : (
          <div className="explorer-grid">
            {filteredRecipes.map((recipe) => (
              <article
                className="explorer-card"
                key={recipe.name}
              >
                <div className="recipe-photo-wrap">
                  <span className="recipe-photo-fallback" aria-hidden="true">
                    Image unavailable
                  </span>
                  {getRecipeImage(recipe) && (
                    <img
                      className="recipe-photo"
                      src={getRecipeImage(recipe)}
                      alt={recipe.name || "Prepared meal"}
                      loading="lazy"
                      onError={(event) => {
                        event.currentTarget.style.display = "none";
                      }}
                    />
                  )}
                  <button
                    type="button"
                    className={isFavourite(recipe) ? "favourite-heart is-favourite" : "favourite-heart"}
                    onClick={() => toggleFavourite(recipe)}
                    aria-label={
                      isFavourite(recipe)
                        ? `Remove ${recipe.name} from favourites`
                        : `Add ${recipe.name} to favourites`
                    }
                    aria-pressed={isFavourite(recipe)}
                    title={isFavourite(recipe) ? "Remove from favourites" : "Add to favourites"}
                  >
                    {isFavourite(recipe) ? "♥" : "♡"}
                  </button>
                </div>

                <div className="explorer-card-body">
                  <span className="recipe-category">
                    {recipe.category || "Everyday meals"}
                  </span>

                  <h2>{recipe.name}</h2>

                  <p>{recipe.description}</p>

                  <div className="explorer-meta">
                    <span>
                      {recipe.time ?? "—"} min
                    </span>
                    <span>
                      {" "}
                      {(recipe.ingredients || []).length}{" "}
                      ingredients
                    </span>
                  </div>

                  <div className="recipe-card-nutrition">
                    <h3>Nutrition information</h3>
                    {renderNutrition(recipe)}
                  </div>

                  <details className="recipe-details">
                    <summary>View ingredients</summary>
                    <ul>
                      {(recipe.ingredients || []).map(
                        (ingredient, index) => (
                          <li key={`${ingredient}-${index}`}>
                            {ingredient}
                          </li>
                        )
                      )}
                    </ul>
                  </details>

                  <button
                    className="view-recipe-btn"
                    onClick={() => openRecipe(recipe)}
                  >
                    View Recipe →
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      {selectedRecipe && (
        <div
          className="recipe-modal-overlay"
          onClick={() => setSelectedRecipe(null)}
        >
          <section
            className="recipe-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="recipe-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="close-modal"
              onClick={() => setSelectedRecipe(null)}
              aria-label="Close recipe"
            >
              ✕
            </button>

            <div className="recipe-modal-photo-wrap">
              <span className="recipe-photo-fallback" aria-hidden="true">
                Image unavailable
              </span>
              {getRecipeImage(selectedRecipe) && (
                <img
                  className="recipe-modal-photo"
                  src={getRecipeImage(selectedRecipe)}
                  alt={selectedRecipe.name || "Prepared meal"}
                  onError={(event) => {
                    event.currentTarget.style.display = "none";
                  }}
                />
              )}
            </div>

            <button
              type="button"
              className={isFavourite(selectedRecipe) ? "modal-favourite-btn is-favourite" : "modal-favourite-btn"}
              onClick={() => toggleFavourite(selectedRecipe)}
              aria-pressed={isFavourite(selectedRecipe)}
            >
              {isFavourite(selectedRecipe) ? "♥ Remove from Favourites" : "♡ Add to Favourites"}
            </button>

            <span className="recipe-category">
              {selectedRecipe.category || "Everyday meals"}
            </span>

            <h2 id="recipe-modal-title">
              {selectedRecipe.name}
            </h2>

            <p>{selectedRecipe.description}</p>

            <p>
              Cooking time: {selectedRecipe.time ?? "—"}{" "}
              minutes
            </p>

            <h3>Nutrition Information</h3>
            {renderNutrition(selectedRecipe, true)}

            <h3>Ingredients</h3>
            <p className="substitution-intro">
              Missing an ingredient? Choose a suggested alternative below.
            </p>

            <ul className="recipe-ingredients-list">
              {(selectedRecipe.ingredients || []).map((ingredient, index) => {
                const alternatives = selectedRecipe.substitutions?.[ingredient] || [];
                const currentIngredient = ingredientReplacements[ingredient] || ingredient;

                return (
                  <li key={`${ingredient}-${index}`} className="recipe-ingredient-row">
                    <span className="recipe-ingredient-name">
                      {currentIngredient}
                      {ingredientReplacements[ingredient] && (
                        <small className="substitution-label">Replaces {ingredient}</small>
                      )}
                    </span>
                    {alternatives.length > 0 && (
                      <label className="substitution-control">
                        <span>Replace</span>
                        <select
                          value={ingredientReplacements[ingredient] || ""}
                          onChange={(event) => replaceIngredient(ingredient, event.target.value)}
                          aria-label={`Substitute for ${ingredient}`}
                        >
                          <option value="">Keep {ingredient}</option>
                          {alternatives.map((alternative) => (
                            <option key={alternative} value={alternative}>{alternative}</option>
                          ))}
                        </select>
                      </label>
                    )}
                  </li>
                );
              })}
            </ul>
            {Object.keys(ingredientReplacements).length > 0 && (
              <button
                type="button"
                className="reset-substitutions-btn"
                onClick={() => setIngredientReplacements({})}
              >
                Reset ingredient substitutions
              </button>
            )}

            <h3>Cooking Instructions</h3>

            {selectedRecipe.steps?.length > 0 ? (
              <ol>
                {selectedRecipe.steps.map((step, index) => (
                  <li key={index}>{step}</li>
                ))}
              </ol>
            ) : (
              <p>
                Cooking instructions for this recipe
                will be added soon.
              </p>
            )}
          </section>
        </div>
      )}

      <footer>
        NutriPlan © 2026
      </footer>
    </div>
  );
}

export default Recipes;

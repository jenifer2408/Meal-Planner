import { Link } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import "./Home.css";

function App() {
  return (
    <div className="nutriplan-home">
      <Navbar />
      <header className="home-hero">
        <div className="home-hero-copy">
          <span className="home-eyebrow">WELCOME TO NUTRIPLAN</span>
          <h1>Good food. <span>Less guesswork.</span></h1>
          <p>Make everyday eating easier with simple recipes, personalized meal ideas, and nutrition information that helps you plan with confidence.</p>
          <div className="home-hero-actions">
            <Link to="/find-meals" className="home-primary-btn">Find meals with my ingredients →</Link>
            <Link to="/recipes" className="home-secondary-btn">Explore recipes</Link>
          </div>
        </div>
        <div className="home-hero-image">
          <img src="https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1100&q=85" alt="A colorful bowl of fresh vegetables and healthy food" />
          <div className="home-image-note">Fresh ideas for your everyday plate 🥗</div>
        </div>
      </header>

      <section className="home-intro">
        <span className="home-eyebrow">EAT WELL, YOUR WAY</span>
        <h2>Small steps toward a better plate</h2>
        <p>Find inspiration for everyday meals, make use of ingredients you already have, and plan ahead with less stress.</p>
      </section>

      <section className="home-feature-grid">
        <article className="home-feature-card">
          <img src="https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=700&q=80" alt="Fresh ingredients ready for a meal" />
          <div><span>01 · INGREDIENT SEARCH</span><h3>Cook with what you have</h3><p>Enter ingredients from your kitchen and discover recipes that use them.</p><Link to="/find-meals">Find meals →</Link></div>
        </article>
        <article className="home-feature-card">
          <img src="https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=700&q=80" alt="A balanced meal with vegetables and grains" />
          <div><span>02 · RECIPE EXPLORER</span><h3>Find your next favorite</h3><p>Browse recipes by name, ingredient, or meal category and view cooking steps.</p><Link to="/recipes">Explore recipes →</Link></div>
        </article>
        <article className="home-feature-card">
          <img src="https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=700&q=80" alt="Fresh vegetables and ingredients arranged on a table" />
          <div><span>03 · PERSONALIZED PLANNING</span><h3>Make a plan that fits you</h3><p>Choose your food preference, goal, meals per day, and ingredient-matching style.</p><Link to="/meal-planner">Plan my meals →</Link></div>
        </article>
      </section>
      <section className="home-bottom-cta">
        <div><span className="home-eyebrow">YOUR NEXT GOOD MEAL STARTS HERE</span><h2>Less thinking. More eating. 💚</h2><p>Plan your meals, discover recipes, and make everyday cooking feel simpler.</p></div>
        <Link to="/meal-planner" className="home-primary-btn">Build my meal plan →</Link>
      </section>
      <footer className="home-footer">Made with 💚 and a little hunger | NutriPlan © 2026</footer>
    </div>
  );
}
export default App;


import { Link, useLocation, useNavigate } from "react-router-dom";
import "./Navbar.css";

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();

  const user = JSON.parse(
    localStorage.getItem("nutriplan_user") || "null"
  );

  const links = [
    { label: "Home", to: "/" },
    { label: "Find Meals", to: "/find-meals" },
    { label: "Recipes", to: "/recipes" },
    { label: "Meal Planner", to: "/meal-planner" },
    { label: "Weekly Planner", to: "/weekly-planner" },
  ];

  const handleLogout = () => {
    localStorage.removeItem("nutriplan_token");
    localStorage.removeItem("nutriplan_user");
    navigate("/");
  };

  return (
    <nav className="navbar">
      <Link to="/" className="brand">
        🥗 NutriPlan
      </Link>

      <div className="nav-links">
        {links.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className={
              location.pathname === link.to
                ? "nav-link active"
                : "nav-link"
            }
          >
            {link.label}
          </Link>
        ))}
      </div>

      <div className="nav-auth">
        {user ? (
          <>
            <span className="nav-user">
              Hi, {user.name} 👋
            </span>
            <button
              className="auth-link login-link"
              onClick={handleLogout}
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="auth-link login-link">
              Login
            </Link>
            <Link to="/signup" className="auth-link signup-link">
              Sign Up
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;

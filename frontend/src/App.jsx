import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import Landing from "./pages/landing";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import RecipeDetails from "./pages/RecipeDetails";
import CreateRecipe from "./pages/CreateRecipe";
import EditRecipe from "./pages/EditRecipe";
import MyRecipes from "./pages/MyRecipes";
import Favorites from "./pages/Favorites";
import Profile from "./pages/Profile";
import EditProfile from "./pages/EditProfile";
import ChangePassword from "./pages/ChangePassword";
import About from "./pages/About";
import ProtectedRoute from "./components/ProtectedRoute";
import AuthRoute from "./components/AuthRoute";

// Pages where the Navbar should be hidden
const NO_NAVBAR_ROUTES = [
  "/",
  "/login",
  "/register",
  "/home",
  "/dashboard",
  "/add-recipe",
  "/my-recipes",
  "/favorites",
  "/favourites",
  "/profile",
  "/edit-profile",
  "/change-password",
];

const NO_NAVBAR_PREFIXES = ["/recipes/", "/recipe/", "/edit-recipe/"];

function shouldHideNavbar(pathname) {
  return (
    NO_NAVBAR_ROUTES.includes(pathname) ||
    NO_NAVBAR_PREFIXES.some((prefix) => pathname.startsWith(prefix))
  );
}

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <div style={{ width: "100%", minHeight: "100vh" }}>

          <Routes>
            {/* ── Public ──────────────────────────────────────── */}
            <Route path="/" element={<Landing />} />
            <Route path="/landing" element={<Landing />} />
            {/* ── Public Auth (Hidden when logged in) ── */}
            <Route element={<AuthRoute />}>
              <Route path="/login" element={<Login defaultMode="login" />} />
              <Route path="/register" element={<Login defaultMode="register" />} />
            </Route>

            {/* ── Main App (Protected Routes) ── */}
            <Route element={<ProtectedRoute />}>
              <Route path="/home" element={<Home />} />
              <Route path="/dashboard" element={<Dashboard />} />

              {/* Recipes */}
              <Route path="/recipes/:legacyId/:slug" element={<RecipeDetails />} />
              <Route path="/recipes/:id" element={<RecipeDetails />} />
              <Route path="/recipe/:id" element={<RecipeDetails />} />
              <Route path="/add-recipe" element={<CreateRecipe />} />
              <Route path="/edit-recipe/:id" element={<EditRecipe />} />
              <Route path="/my-recipes" element={<MyRecipes />} />
              <Route path="/favorites" element={<Favorites />} />
              <Route path="/favourites" element={<Favorites />} />

              {/* Profile & Settings */}
              <Route path="/profile" element={<Profile />} />
              <Route path="/profile/:userId" element={<Profile />} />
              <Route path="/edit-profile" element={<EditProfile />} />
              <Route path="/change-password" element={<ChangePassword />} />
            </Route>

            {/* ── Static ──────────────────────────────────────── */}
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<h1 style={{ color: "#fff", padding: "40px" }}>Contact</h1>} />

            {/* ── 404 Fallback ─────────────────────────────────── */}
            <Route path="*" element={<h1 style={{ color: "#fff", textAlign: "center", padding: "80px 20px" }}>404 — Page Not Found</h1>} />
          </Routes>

        </div>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;

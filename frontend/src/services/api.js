import axios from "axios";

// Create axios instance with base URL - using correct backend port 4000
const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4000/api",
  timeout: 10000, // 10 second timeout
  withCredentials: true,
});

// Add token to requests if it exists
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response errors globally
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid — clear auth and redirect to login
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.dispatchEvent(new Event("authChange"));
      if (!window.location.pathname.includes("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

// ─────────────────────────────────────────────────────────────
// AUTH APIS
// ─────────────────────────────────────────────────────────────

// LOGIN
export const login = async (email, password) => {
  try {
    const response = await API.post("/auth/login", { email, password });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// SIGNUP
export const signup = async (name, email, password) => {
  try {
    const response = await API.post("/auth/signup", { name, email, password });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// GET CURRENT USER PROFILE
export const getProfile = async () => {
  try {
    const response = await API.get("/users/profile");
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to fetch profile" };
  }
};

// EDIT PROFILE
export const editProfile = async (name, email, bio, profileImage) => {
  try {
    const response = await API.put("/auth/profile", { name, email, bio, profileImage });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Profile update failed" };
  }
};

export const uploadImage = async (file, category = "general", fields = {}) => {
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("category", category);

    Object.entries(fields).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        formData.append(key, value);
      }
    });

    const response = await API.post("/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 30000,
    });

    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Image upload failed" };
  }
};


export const uploadProfileImage = async (file) => {
  try {
    const formData = new FormData();
    formData.append("image", file);
    const response = await API.put("/users/profile/image", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 30000,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Profile image upload failed" };
  }
};

export const searchGlobal = async (q) => {
  try {
    const response = await API.get("/search", { params: { q } });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Search failed" };
  }
};
// CHANGE PASSWORD
export const changePassword = async (currentPassword, newPassword) => {
  try {
    const response = await API.put("/auth/change-password", {
      currentPassword,
      newPassword,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Password change failed" };
  }
};

// ─────────────────────────────────────────────────────────────
// RECIPE APIS
// ─────────────────────────────────────────────────────────────

// GET ALL RECIPES (with pagination, search, category, difficulty filters)
export const getRecipes = async (params = {}) => {
  try {
    const response = await API.get("/recipes", { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to fetch recipes" };
  }
};

// GET SINGLE RECIPE BY ID
export const getRecipe = async (id) => {
  try {
    const response = await API.get(`/recipes/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to fetch recipe" };
  }
};

// CREATE NEW RECIPE (protected)
export const createRecipe = async (recipeData) => {
  try {
    const response = await API.post("/recipes", recipeData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to create recipe" };
  }
};

// UPDATE RECIPE (protected, owner only)
export const updateRecipe = async (id, recipeData) => {
  try {
    const response = await API.put(`/recipes/${id}`, recipeData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to update recipe" };
  }
};

// DELETE RECIPE (protected, owner only)
export const deleteRecipe = async (id) => {
  try {
    const response = await API.delete(`/recipes/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to delete recipe" };
  }
};

// LIKE / UNLIKE RECIPE (protected)
export const toggleLikeRecipe = async (id) => {
  try {
    const response = await API.post(`/recipes/${id}/like`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to like/unlike recipe" };
  }
};

// RATE RECIPE (protected)
export const rateRecipe = async (id, value) => {
  try {
    const response = await API.post(`/recipes/${id}/rate`, { value });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to rate recipe" };
  }
};

// RECORD RECIPE VIEW
export const recordRecipeView = async (id) => {
  try {
    const response = await API.patch(`/recipes/${id}/view`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to record recipe view" };
  }
};

// ─────────────────────────────────────────────────────────────
// USER-SPECIFIC RECIPE APIS  (all protected)
// ─────────────────────────────────────────────────────────────

// GET USER'S OWN RECIPES
export const getMyRecipes = async (params = {}) => {
  try {
    const response = await API.get("/recipes/my", { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to fetch your recipes" };
  }
};

// GET USER'S LIKED RECIPES (Favorites)
export const getLikedRecipes = async (params = {}) => {
  try {
    const response = await API.get("/recipes/user/liked", { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to fetch liked recipes" };
  }
};

// GET USER DASHBOARD STATS
// Returns: { totalRecipes, totalLikes, totalViews, topRecipe }
export const getUserStats = async () => {
  try {
    const response = await API.get("/recipes/user/stats");
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to fetch user stats" };
  }
};

// GET USER ACTIVITY FEED
export const getUserActivity = async (params = {}) => {
  try {
    const response = await API.get("/activity", { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to fetch user activity" };
  }
};

export const getDashboard = async (params = {}) => {
  try {
    const response = await API.get("/dashboard", { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to fetch dashboard" };
  }
};

export default API;

import React, { useState, useRef, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API, { uploadImage } from "../services/api";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "../components/Sidebar";
import NavbarHome from "../components/NavbarHome";
import Footer from "../components/Footer";
import RecipeDetails from "./RecipeDetails";
import { buildPreviewRecipe } from "../utils/buildPreviewRecipe";
import { getPageBackgroundStyle } from "../utils/theme";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, delay: i * 0.07, ease: [0.4, 0, 0.2, 1] },
  }),
};

const CATEGORIES = ["Breakfast", "Lunch", "Dinner", "Dessert", "Snacks", "Drinks", "Vegan"];
const CUISINES = ["Indian", "Italian", "Chinese", "Arabian", "Thai", "Japanese", "French", "Mexican", "American", "Mediterranean", "Other"];
const UNITS = ["g", "kg", "ml", "L", "tsp", "tbsp", "cup", "pcs"];
const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
const MIN_IMAGE_SIZE = 100 * 1024;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const defaultIngredients = () => [
  { id: 1, name: "", qty: "", unit: "g" },
  { id: 2, name: "", qty: "", unit: "g" }
];
const defaultSteps = () => [
  { id: 1, text: "" },
  { id: 2, text: "" }
];

export default function EditRecipe() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [difficulty, setDifficulty] = useState(null);
  const [selectedCats, setSelectedCats] = useState([]);
  const [cuisine, setCuisine] = useState("");
  const [serves, setServes] = useState(2);
  const [cookTime, setCookTime] = useState(30);
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageUrl, setImageUrl] = useState("");
  const [currentImage, setCurrentImage] = useState("");
  const [ingredients, setIngredients] = useState(defaultIngredients());
  const [steps, setSteps] = useState(defaultSteps());
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState("");
  const [visibility, setVisibility] = useState("draft");
  const [featured, setFeatured] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [fullPreviewMode, setFullPreviewMode] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [imageError, setImageError] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [width, setWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;
  const isCompact = isMobile || isTablet;
  const fileInputRef = useRef(null);

  // Load recipe data on mount
  useEffect(() => {
    const loadRecipe = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Authentication token not found");

        const response = await API.get(`/recipes/${id}`);

        const recipe = response.data.recipe;

        setTitle(recipe.title || "");
        setDescription(recipe.description || "");
        setDifficulty(recipe.difficultyLevel || null);
        setSelectedCats(recipe.category || []);
        setCuisine(recipe.cuisine || "");
        setServes(recipe.serves || 2);
        setCookTime(recipe.cookTime || 30);
        setCurrentImage(recipe.image || "");
        setImageUrl(recipe.image || "");

        const formattedIngredients = recipe.ingredients?.map((ing, idx) => ({
          id: `ing-${idx}-${Date.now()}`,
          name: ing.name || (typeof ing === "string" ? ing : ""),
          qty: ing.qty || ing.quantity || "",
          unit: ing.unit || "g",
        })) || defaultIngredients();
        setIngredients(formattedIngredients.length > 0 ? formattedIngredients : defaultIngredients());

        const formattedSteps = recipe.instructions?.map((step, idx) => ({
          id: `step-${idx}-${Date.now()}`,
          text: typeof step === "string" ? step : step.text || "",
        })) || defaultSteps();
        setSteps(formattedSteps.length > 0 ? formattedSteps : defaultSteps());

        setTags(recipe.tags || []);
        setVisibility(recipe.visibility || "draft");
        setFeatured(recipe.featured || false);

        setIsLoading(false);
        setIsError(false);
      } catch (err) {
        setIsError(true);
        setStatusMessage(`Error loading recipe: ${err?.response?.data?.message || err.message}`);
        setIsLoading(false);
        console.error("Load recipe error:", err);
      }
    };

    if (id) loadRecipe();
  }, [id]);

  // Track changes
  useEffect(() => {
    setHasChanges(true);
  }, [title, description, difficulty, selectedCats, cuisine, serves, cookTime, ingredients, steps, tags, visibility, featured, image]);

  const handleImageSelect = (file) => {
    setImageError("");
    if (!file) return;
    if (!ALLOWED_IMAGE_TYPES.includes(file.type) || file.size < MIN_IMAGE_SIZE || file.size > MAX_IMAGE_SIZE) {
      setImage(null);
      setImagePreview(null);
      setImageError("Image must be between 100KB and 5MB.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    setImage(file);
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e) => handleImageSelect(e.target.files?.[0] || null);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    handleImageSelect(e.dataTransfer.files?.[0] || null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => setIsDragOver(false);

  const resetImage = () => {
    setImage(null);
    setImagePreview(null);
    setImageUrl(currentImage);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const cancelImage = () => {
    setImage(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const toggleCat = (cat) =>
    setSelectedCats((prev) => prev.includes(cat) ? prev.filter((c) => c !== cat) : (prev.length < 3 ? [...prev, cat] : prev));

  const addIngredient = () => setIngredients((prev) => prev.length >= 25 ? prev : [...prev, { id: Date.now(), name: "", qty: "", unit: "g" }]);
  const removeIngredient = (id) => setIngredients((prev) => (prev.length > 2 ? prev.filter((i) => i.id !== id) : prev));
  const updateIngredient = (id, field, value) =>
    setIngredients((prev) => prev.map((i) => (i.id === id ? { ...i, [field]: field === "qty" ? value.replace(/[^\d.]/g, "") : value } : i)));

  const addStep = () => setSteps((prev) => prev.length >= 25 ? prev : [...prev, { id: Date.now(), text: "" }]);
  const removeStep = (id) => setSteps((prev) => (prev.length > 2 ? prev.filter((s) => s.id !== id) : prev));
  const updateStep = (id, value) =>
    setSteps((prev) => prev.map((s) => (s.id === id ? { ...s, text: value } : s)));

  const addTag = () => {
    const normalized = tagInput.trim();
    if (!normalized) return;
    if (tags.length >= 5) {
      setStatusMessage("Use no more than 5 tags.");
      setIsError(true);
      return;
    }
    if (tags.some((tag) => tag.toLowerCase() === normalized.toLowerCase())) {
      setStatusMessage("Tags cannot contain duplicates.");
      setIsError(true);
      return;
    }
    setTags([...tags, normalized]);
    setTagInput("");
  };

  const removeTag = (tag) => setTags(tags.filter(t => t !== tag));

  const validateDraftForm = () => {
    const errors = [];
    const trimmedTitle = title.trim();
    if (trimmedTitle.length < 3 || trimmedTitle.length > 80) {
      errors.push("Title must be between 3 and 80 characters");
    }
    return errors;
  };

  const validateForm = () => {
    const errors = [];
    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();
    if (trimmedTitle.length < 3 || trimmedTitle.length > 80) errors.push("Title must be between 3 and 80 characters");
    if (trimmedDescription.length < 20 || trimmedDescription.length > 300) errors.push("Description must be between 20 and 300 characters");
    if (!difficulty) errors.push("Difficulty level is required");
    if (selectedCats.length < 1 || selectedCats.length > 3) errors.push("Select 1 to 3 categories");
    if (!cuisine) errors.push("Cuisine type is required");
    if (Number(serves) < 1 || Number(serves) > 10) errors.push("Servings must be between 1 and 10");
    if (Number(cookTime) < 5 || Number(cookTime) > 300) errors.push("Cook time must be between 5 and 300 minutes");
    const validIngredients = ingredients.filter(i => i.name.trim());
    if (validIngredients.length < 2 || validIngredients.length > 25) errors.push("Add 2 to 25 ingredients");
    if (validIngredients.some((i) => i.qty && !/^\d+(\.\d+)?$/.test(i.qty))) errors.push("Ingredient quantities must be numbers only");
    const validSteps = steps.filter(s => s.text.trim());
    if (validSteps.length < 2 || validSteps.length > 25) errors.push("Add 2 to 25 instruction steps");
    if (tags.length > 5) errors.push("Use no more than 5 tags");
    if (new Set(tags.map((tag) => tag.toLowerCase())).size !== tags.length) errors.push("Tags cannot contain duplicates");
    if (!image && !imagePreview && !imageUrl && !currentImage) errors.push("Recipe image is required");
    if (imageError) errors.push(imageError);
    return errors;
  };

  const handleSubmit = async (e, saveType = "update") => {
    e.preventDefault();

    const errors = saveType === "draft" ? validateDraftForm() : validateForm();
    if (errors.length > 0) {
      setIsError(true);
      setStatusMessage(`Please fix the following: ${errors.join(", ")}`);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication token not found. Please login first.");

      const formattedIngredients = ingredients
        .map((i) => ({ name: i.name?.trim() || "", qty: i.qty, unit: i.unit }))
        .filter((i) => i.name);
      const formattedSteps = steps.map((s) => s.text?.trim() || "").filter(Boolean);

      const determineVisibility = () => {
        if (saveType === "draft") return "draft";
        if (saveType === "publish") return "public";
        return visibility;
      };

      let uploadedImageUrl = imageUrl || currentImage;
      let uploadedImagePublicId = null;

      if (image) {
        const uploadResult = await uploadImage(image, "recipe", { recipeId: id });
        uploadedImageUrl = uploadResult.imageUrl;
        uploadedImagePublicId = uploadResult.imagePublicId || uploadResult.image?.publicId || null;
      }

      const jsonPayload = {
        title: title.trim(),
        description: description.trim(),
        difficultyLevel: difficulty,
        category: selectedCats,
        cuisine: cuisine,
        cookTime,
        serves,
        ingredients: formattedIngredients,
        instructions: formattedSteps,
        tags: tags,
        visibility: determineVisibility(),
        featured: featured,
        image: uploadedImageUrl,
        imageUrl: uploadedImageUrl,
        imagePublicId: uploadedImagePublicId,
      };

      const updateJson = async (payload) =>
        API.put(`/recipes/${id}`, payload);

      const res = await updateJson(jsonPayload);

      setIsError(false);
      const messageMap = {
        draft: "Recipe saved as draft.",
        update: "Recipe updated successfully.",
        publish: "Recipe updated and published.",
      };
      setStatusMessage(messageMap[saveType] || "Changes saved!");
      setHasChanges(false);
      console.log(res.data);
      setTimeout(() => {
        if (saveType === "publish" || saveType === "update") {
          navigate(`/recipes/${id}`);
        } else {
          setStatusMessage("");
        }
      }, 2000);
    } catch (err) {
      const errMsg = err?.response?.data?.message || err.message || "Unknown error";
      setIsError(true);
      setStatusMessage(`Error: ${errMsg}`);
      console.error("Update recipe error:", err);
    }
  };

  const previewData = useMemo(() => buildPreviewRecipe({
    title,
    description,
    difficulty,
    selectedCats,
    cuisine,
    serves,
    cookTime,
    imagePreview,
    imageUrl,
    currentImage,
    ingredients,
    steps,
    tags,
    visibility,
    featured,
  }), [title, description, difficulty, selectedCats, cuisine, serves, cookTime, imagePreview, imageUrl, currentImage, ingredients, steps, tags, visibility, featured]);

  if (fullPreviewMode) {
    return (
      <RecipeDetails
        previewRecipe={previewData}
        previewMode
        onEditAgain={() => setFullPreviewMode(false)}
      />
    );
  }

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        minHeight: '100vh',
        width: '100%',
        ...getPageBackgroundStyle(isMobile, 0.58),
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Poppins, sans-serif',
      }}>
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{
            fontSize: '48px',
            textAlign: 'center',
          }}
        >
          Loading recipe...
        </motion.div>
      </div>
    );
  }

  const displayImage = imagePreview || imageUrl || currentImage;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      width: '100%',
      ...getPageBackgroundStyle(isMobile, 0.58),
    }}>
      {/* NAVBAR */}
      <NavbarHome />

      {/* SIDEBAR */}
      <Sidebar sidebarOpen={sidebarOpen} />

      {/* CONTENT WRAPPER */}
      <div style={{
        marginLeft: isCompact ? '0' : '250px',
        width: isCompact ? '100%' : 'calc(100% - 250px)',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
      }}>

        <div
          style={{
            flex: 1,
            minHeight: '100vh',
            background: 'transparent',
            fontFamily: 'Poppins, sans-serif',
            padding: isMobile ? '60px 20px 40px' : '70px 40px 60px',
          }}
        >
          <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <form onSubmit={(e) => handleSubmit(e, "update")}>
          {/* Alert */}
          <AnimatePresence>
            {statusMessage && (
              <motion.div
                style={{
                  position: 'fixed',
                  top: '80px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  zIndex: 9999,
                  minWidth: '320px',
                  maxWidth: '500px',
                  padding: '16px 20px',
                  background: isError ? 'rgba(239,68,68,0.15)' : 'rgba(232,184,75,0.15)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  border: `1px solid ${isError ? 'rgba(239,68,68,0.3)' : 'rgba(232,184,75,0.3)'}`,
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.3 }}
              >
                <span style={{ fontSize: '20px' }}>{isError ? "!" : "OK"}</span>
                <span style={{ flex: 1 }}>{statusMessage}</span>
                <button
                  type="button"
                  onClick={() => setStatusMessage("")}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#fff',
                    fontSize: '20px',
                    cursor: 'pointer',
                    padding: '4px',
                  }}
                >
                  x
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Header */}
          <motion.div initial="hidden" animate="show" variants={fadeUp} custom={0} style={{ marginBottom: '40px' }}>
            <div style={{
              fontSize: '13px',
              color: 'rgba(232,184,75,0.8)',
              fontWeight: '600',
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <span>Recipes</span>
              <span style={{ color: 'rgba(255,255,255,0.4)' }}>-</span>
              <span>Edit Recipe</span>
            </div>
            <h1 style={{
              fontSize: 'clamp(36px, 5vw, 56px)',
              fontWeight: '800',
              color: '#fff',
              margin: '0 0 12px 0',
              lineHeight: '1.1',
            }}>
              Edit <span style={{ color: 'rgba(232,184,75,1)' }}>Recipe</span>
            </h1>
            <p style={{
              fontSize: '16px',
              color: 'rgba(255,255,255,0.6)',
              margin: 0,
              maxWidth: '600px',
            }}>
              Update your recipe details and keep your published content fresh.
            </p>
          </motion.div>

          {/* Preview Toggle */}
          <motion.div initial="hidden" animate="show" variants={fadeUp} custom={1} style={{ marginBottom: '24px' }}>
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              style={{
                background: 'rgba(255,255,255,0.08)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '10px',
                padding: '12px 24px',
                color: '#fff',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(255,255,255,0.12)';
                e.target.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(255,255,255,0.08)';
                e.target.style.transform = 'translateY(0)';
              }}
            >
              {showPreview ? "Edit Mode" : "Live Preview"}
            </button>
            <button
              type="button"
              onClick={() => setFullPreviewMode(true)}
              style={{
                marginLeft: '12px',
                background: 'rgba(232,184,75,0.12)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(232,184,75,0.35)',
                borderRadius: '10px',
                padding: '12px 24px',
                color: 'rgba(232,184,75,1)',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              Full Preview
            </button>
          </motion.div>

          {/* Main Layout */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: showPreview ? 'repeat(2, 1fr)' : '1fr',
            gap: '32px',
          }}>
            {/* Form Column */}
            <div>
              {/* Section 1: Basics */}
              <motion.div
                initial="hidden"
                animate="show"
                variants={fadeUp}
                custom={2}
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  backdropFilter: 'blur(16px)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '20px',
                  padding: '32px',
                  marginBottom: '24px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                  <span style={{
                    fontSize: '24px',
                    fontWeight: '800',
                    color: 'rgba(232,184,75,0.8)',
                  }}>01</span>
                  <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#fff', margin: 0 }}>
                    Basic Details
                  </h2>
                </div>

                {/* Title */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: 'rgba(255,255,255,0.8)',
                    marginBottom: '8px',
                  }}>
                    Recipe Title *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Grandma's Secret Pasta"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      background: 'rgba(255,255,255,0.08)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      borderRadius: '10px',
                      color: '#fff',
                      fontSize: '14px',
                      outline: 'none',
                      transition: 'all 0.3s ease',
                      boxSizing: 'border-box',
                    }}
                    onFocus={(e) => {
                      e.target.style.background = 'rgba(255,255,255,0.12)';
                      e.target.style.borderColor = 'rgba(232,184,75,0.5)';
                    }}
                    onBlur={(e) => {
                      e.target.style.background = 'rgba(255,255,255,0.08)';
                      e.target.style.borderColor = 'rgba(255,255,255,0.15)';
                    }}
                  />
                </div>

                {/* Description */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: 'rgba(255,255,255,0.8)',
                    marginBottom: '8px',
                  }}>
                    Short Description
                  </label>
                  <textarea
                    placeholder="A brief description of your recipe..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      background: 'rgba(255,255,255,0.08)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      borderRadius: '10px',
                      color: '#fff',
                      fontSize: '14px',
                      outline: 'none',
                      resize: 'vertical',
                      fontFamily: 'Poppins, sans-serif',
                      transition: 'all 0.3s ease',
                      boxSizing: 'border-box',
                    }}
                    onFocus={(e) => {
                      e.target.style.background = 'rgba(255,255,255,0.12)';
                      e.target.style.borderColor = 'rgba(232,184,75,0.5)';
                    }}
                    onBlur={(e) => {
                      e.target.style.background = 'rgba(255,255,255,0.08)';
                      e.target.style.borderColor = 'rgba(255,255,255,0.15)';
                    }}
                  />
                </div>

                {/* Difficulty & Cuisine */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '16px',
                  marginBottom: '20px',
                }}>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: 'rgba(255,255,255,0.8)',
                      marginBottom: '8px',
                    }}>
                      Difficulty *
                    </label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {[
                        { key: "easy", label: "Easy", color: "rgba(232,184,75,0.8)" },
                        { key: "medium", label: "Med", color: "rgba(251,191,36,0.8)" },
                        { key: "hard", label: "Hard", color: "rgba(239,68,68,0.8)" }
                      ].map(({ key, label, color }) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setDifficulty(key)}
                          style={{
                            flex: 1,
                            padding: '10px',
                            background: difficulty === key ? color : 'rgba(255,255,255,0.08)',
                            border: `1px solid ${difficulty === key ? color : 'rgba(255,255,255,0.15)'}`,
                            borderRadius: '8px',
                            color: '#fff',
                            fontSize: '13px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                          }}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: 'rgba(255,255,255,0.8)',
                      marginBottom: '8px',
                    }}>
                      Cuisine Type *
                    </label>
                    <select
                      value={cuisine}
                      onChange={(e) => setCuisine(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        background: 'rgba(255,255,255,0.08)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        borderRadius: '10px',
                        color: '#fff',
                        fontSize: '14px',
                        outline: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      <option value="" style={{ background: '#111', color: '#fff' }}>Select cuisine</option>
                      {CUISINES.map((c) => (
                        <option key={c} value={c} style={{ background: '#111', color: '#fff' }}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Category */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: 'rgba(255,255,255,0.8)',
                    marginBottom: '8px',
                  }}>
                    Category * (Select one or more)
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => toggleCat(cat)}
                        style={{
                          padding: '8px 16px',
                          background: selectedCats.includes(cat) ? 'rgba(232,184,75,0.9)' : 'rgba(255,255,255,0.08)',
                          border: `1px solid ${selectedCats.includes(cat) ? 'rgba(232,184,75,0.5)' : 'rgba(255,255,255,0.15)'}`,
                          borderRadius: '20px',
                          color: '#fff',
                          fontSize: '13px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                        }}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Serves & Cook Time */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '16px',
                  marginBottom: '20px',
                }}>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: 'rgba(255,255,255,0.8)',
                      marginBottom: '8px',
                    }}>
                      Serves
                    </label>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      background: 'rgba(255,255,255,0.08)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      borderRadius: '10px',
                      padding: '8px',
                    }}>
                      <button
                        type="button"
                        onClick={() => setServes(v => Math.max(1, v - 1))}
                        style={{
                          background: 'rgba(255,255,255,0.1)',
                          border: 'none',
                          color: '#fff',
                          width: '32px',
                          height: '32px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '18px',
                          fontWeight: '700',
                        }}
                      >
                        -
                      </button>
                      <span style={{
                        flex: 1,
                        textAlign: 'center',
                        color: '#fff',
                        fontSize: '16px',
                        fontWeight: '600',
                      }}>
                        {serves} people
                      </span>
                      <button
                        type="button"
                        onClick={() => setServes(v => v + 1)}
                        style={{
                          background: 'rgba(255,255,255,0.1)',
                          border: 'none',
                          color: '#fff',
                          width: '32px',
                          height: '32px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '18px',
                          fontWeight: '700',
                        }}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: 'rgba(255,255,255,0.8)',
                      marginBottom: '8px',
                    }}>
                      Cook Time
                    </label>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      background: 'rgba(255,255,255,0.08)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      borderRadius: '10px',
                      padding: '8px',
                    }}>
                      <button
                        type="button"
                        onClick={() => setCookTime(v => Math.max(5, v - 5))}
                        style={{
                          background: 'rgba(255,255,255,0.1)',
                          border: 'none',
                          color: '#fff',
                          width: '32px',
                          height: '32px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '18px',
                          fontWeight: '700',
                        }}
                      >
                        -
                      </button>
                      <span style={{
                        flex: 1,
                        textAlign: 'center',
                        color: '#fff',
                        fontSize: '16px',
                        fontWeight: '600',
                      }}>
                      Time {cookTime} min
                    </span>
                      <button
                        type="button"
                        onClick={() => setCookTime(v => v + 5)}
                        style={{
                          background: 'rgba(255,255,255,0.1)',
                          border: 'none',
                          color: '#fff',
                          width: '32px',
                          height: '32px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '18px',
                          fontWeight: '700',
                        }}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {/* Image Upload */}
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: 'rgba(255,255,255,0.8)',
                    marginBottom: '8px',
                  }}>
                    Recipe Image
                  </label>
                  {displayImage ? (
                    <div style={{
                      position: 'relative',
                      borderRadius: '12px',
                      overflow: 'hidden',
                    }}>
                      <img
                        src={displayImage}
                        alt="Preview"
                        style={{
                          width: '100%',
                          height: '200px',
                          objectFit: 'cover',
                        }}
                      />
                      <div style={{
                        position: 'absolute',
                        bottom: '12px',
                        right: '12px',
                        display: 'flex',
                        gap: '8px',
                      }}>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          style={{
                            background: 'rgba(255,255,255,0.9)',
                            backdropFilter: 'blur(10px)',
                            border: 'none',
                            padding: '8px 16px',
                            borderRadius: '8px',
                            color: '#000',
                            fontSize: '12px',
                            fontWeight: '600',
                            cursor: 'pointer',
                          }}
                        >
                          Change
                        </button>
                        {imagePreview || (imageUrl && imageUrl !== currentImage) ? (
                          <button
                            type="button"
                            onClick={resetImage}
                            style={{
                              background: 'rgba(239,68,68,0.9)',
                              backdropFilter: 'blur(10px)',
                              border: 'none',
                              padding: '8px 16px',
                              borderRadius: '8px',
                              color: '#fff',
                              fontSize: '12px',
                              fontWeight: '600',
                              cursor: 'pointer',
                            }}
                          >
                            Reset
                          </button>
                        ) : null}
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
                        style={{ display: 'none' }}
                        onChange={handleFileInputChange}
                      />
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      style={{
                        border: `2px dashed ${isDragOver ? 'rgba(232,184,75,0.5)' : 'rgba(255,255,255,0.2)'}`,
                        borderRadius: '12px',
                        padding: '40px 20px',
                        textAlign: 'center',
                        cursor: 'pointer',
                        background: isDragOver ? 'rgba(232,184,75,0.05)' : 'rgba(255,255,255,0.04)',
                        transition: 'all 0.3s ease',
                      }}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
                        style={{ display: 'none' }}
                        onChange={handleFileInputChange}
                      />
                      <div style={{ fontSize: "24px", marginBottom: "12px", fontWeight: "700" }}>Image</div>
                      <p style={{
                        fontSize: '14px',
                        color: 'rgba(255,255,255,0.7)',
                        margin: '0 0 8px 0',
                      }}>
                        <strong>Choose photo</strong> or drag & drop
                      </p>
                      <p style={{
                        fontSize: '12px',
                        color: 'rgba(255,255,255,0.5)',
                        margin: 0,
                      }}>
                        PNG, JPG, JPEG, WEBP — 100KB to 5MB
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Section 2: Ingredients */}
              <motion.div
                initial="hidden"
                animate="show"
                variants={fadeUp}
                custom={3}
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  backdropFilter: 'blur(16px)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '20px',
                  padding: '32px',
                  marginBottom: '24px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                  <span style={{
                    fontSize: '24px',
                    fontWeight: '800',
                    color: 'rgba(232,184,75,0.8)',
                  }}>02</span>
                  <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#fff', margin: 0 }}>
                    Ingredients
                  </h2>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <AnimatePresence>
                    {ingredients.map((ing, idx) => (
                      <motion.div
                        key={ing.id}
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -16 }}
                        transition={{ duration: 0.2 }}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '2fr 1fr 1fr auto',
                          gap: '12px',
                          marginBottom: '12px',
                        }}
                      >
                        <input
                          type="text"
                          placeholder={`Ingredient ${idx + 1}`}
                          value={ing.name}
                          onChange={(e) => updateIngredient(ing.id, "name", e.target.value)}
                          style={{
                            padding: '12px 16px',
                            background: 'rgba(255,255,255,0.08)',
                            border: '1px solid rgba(255,255,255,0.15)',
                            borderRadius: '10px',
                            color: '#fff',
                            fontSize: '14px',
                            outline: 'none',
                          }}
                        />
                        <input
                          type="text"
                          placeholder="Qty"
                          value={ing.qty}
                          onChange={(e) => updateIngredient(ing.id, "qty", e.target.value)}
                          style={{
                            padding: '12px 16px',
                            background: 'rgba(255,255,255,0.08)',
                            border: '1px solid rgba(255,255,255,0.15)',
                            borderRadius: '10px',
                            color: '#fff',
                            fontSize: '14px',
                            outline: 'none',
                          }}
                        />
                        <select
                          value={ing.unit}
                          onChange={(e) => updateIngredient(ing.id, "unit", e.target.value)}
                          style={{
                            padding: '12px 16px',
                            background: 'rgba(255,255,255,0.08)',
                            border: '1px solid rgba(255,255,255,0.15)',
                            borderRadius: '10px',
                            color: '#fff',
                            fontSize: '14px',
                            outline: 'none',
                            cursor: 'pointer',
                          }}
                        >
                          {UNITS.map((u) => (
                            <option key={u} value={u} style={{ background: '#111', color: '#fff' }}>
                              {u}
                            </option>
                          ))}
                        </select>
                        {ingredients.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removeIngredient(ing.id)}
                          style={{
                            width: '44px',
                            height: '44px',
                            background: 'rgba(239,68,68,0.9)',
                            border: 'none',
                            borderRadius: '10px',
                            color: '#fff',
                            fontSize: '18px',
                            cursor: 'pointer',
                          }}
                        >
                          x
                        </button>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                <button
                  type="button"
                  onClick={addIngredient}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: 'rgba(232,184,75,0.1)',
                    border: '1px dashed rgba(232,184,75,0.5)',
                    borderRadius: '10px',
                    color: 'rgba(232,184,75,1)',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'rgba(232,184,75,0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'rgba(232,184,75,0.1)';
                  }}
                >
                  + Add Ingredient
                </button>
              </motion.div>

              {/* Section 3: Instructions */}
              <motion.div
                initial="hidden"
                animate="show"
                variants={fadeUp}
                custom={4}
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  backdropFilter: 'blur(16px)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '20px',
                  padding: '32px',
                  marginBottom: '24px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                  <span style={{
                    fontSize: '24px',
                    fontWeight: '800',
                    color: 'rgba(232,184,75,0.8)',
                  }}>03</span>
                  <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#fff', margin: 0 }}>
                    Instructions
                  </h2>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <AnimatePresence>
                    {steps.map((step, idx) => (
                      <motion.div
                        key={step.id}
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -16 }}
                        transition={{ duration: 0.2 }}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'auto 1fr auto',
                          gap: '12px',
                          marginBottom: '12px',
                          alignItems: 'start',
                        }}
                      >
                        <div style={{
                          width: '36px',
                          height: '36px',
                          background: 'rgba(232,184,75,0.2)',
                          border: '1px solid rgba(232,184,75,0.5)',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'rgba(232,184,75,1)',
                          fontSize: '14px',
                          fontWeight: '700',
                        }}>
                          {idx + 1}
                        </div>
                        <textarea
                          placeholder={`Describe step ${idx + 1}...`}
                          value={step.text}
                          onChange={(e) => updateStep(step.id, e.target.value)}
                          rows={2}
                          style={{
                            padding: '12px 16px',
                            background: 'rgba(255,255,255,0.08)',
                            border: '1px solid rgba(255,255,255,0.15)',
                            borderRadius: '10px',
                            color: '#fff',
                            fontSize: '14px',
                            outline: 'none',
                            resize: 'vertical',
                            fontFamily: 'Poppins, sans-serif',
                          }}
                        />
                        {steps.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removeStep(step.id)}
                          style={{
                            width: '36px',
                            height: '36px',
                            background: 'rgba(239,68,68,0.9)',
                            border: 'none',
                            borderRadius: '8px',
                            color: '#fff',
                            fontSize: '16px',
                            cursor: 'pointer',
                          }}
                        >
                          x
                        </button>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                <button
                  type="button"
                  onClick={addStep}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: 'rgba(232,184,75,0.1)',
                    border: '1px dashed rgba(232,184,75,0.5)',
                    borderRadius: '10px',
                    color: 'rgba(232,184,75,1)',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'rgba(232,184,75,0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'rgba(232,184,75,0.1)';
                  }}
                >
                  + Add Step
                </button>
              </motion.div>

              {/* Section 4: Tags & Visibility */}
              <motion.div
                initial="hidden"
                animate="show"
                variants={fadeUp}
                custom={5}
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  backdropFilter: 'blur(16px)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '20px',
                  padding: '32px',
                  marginBottom: '24px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                  <span style={{
                    fontSize: '24px',
                    fontWeight: '800',
                    color: 'rgba(232,184,75,0.8)',
                  }}>04</span>
                  <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#fff', margin: 0 }}>
                    Tags & Visibility
                  </h2>
                </div>

                {/* Tags */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: 'rgba(255,255,255,0.8)',
                    marginBottom: '8px',
                  }}>
                    Tags
                  </label>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                    <input
                      type="text"
                      placeholder="Add a tag..."
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addTag();
                        }
                      }}
                      style={{
                        flex: 1,
                        padding: '12px 16px',
                        background: 'rgba(255,255,255,0.08)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        borderRadius: '10px',
                        color: '#fff',
                        fontSize: '14px',
                        outline: 'none',
                      }}
                    />
                    <button
                      type="button"
                      onClick={addTag}
                      style={{
                        padding: '12px 24px',
                        background: 'rgba(232,184,75,0.9)',
                        border: 'none',
                        borderRadius: '10px',
                        color: '#fff',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer',
                      }}
                    >
                      Add
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '6px 12px',
                          background: 'rgba(232,184,75,0.2)',
                          border: '1px solid rgba(232,184,75,0.5)',
                          borderRadius: '20px',
                          color: 'rgba(232,184,75,1)',
                          fontSize: '13px',
                          fontWeight: '600',
                        }}
                      >
                        #{tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'rgba(232,184,75,1)',
                            cursor: 'pointer',
                            fontSize: '14px',
                            padding: 0,
                          }}
                        >
                          x
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Visibility */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: 'rgba(255,255,255,0.8)',
                    marginBottom: '8px',
                  }}>
                    Visibility
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                    <button
                      type="button"
                      onClick={() => setVisibility("draft")}
                      style={{
                        padding: '16px',
                        background: visibility === "draft" ? 'rgba(251,191,36,0.2)' : 'rgba(255,255,255,0.08)',
                        border: `2px solid ${visibility === "draft" ? 'rgba(251,191,36,0.8)' : 'rgba(255,255,255,0.15)'}`,
                        borderRadius: '12px',
                        color: '#fff',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        textAlign: 'left',
                      }}
                    >
                      <div style={{ fontSize: "24px", marginBottom: "8px" }}>Draft</div>
                      <div>Draft</div>
                      <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginTop: '4px' }}>
                        Only you can see this
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setVisibility("public")}
                      style={{
                        padding: '16px',
                        background: visibility === "public" ? 'rgba(232,184,75,0.2)' : 'rgba(255,255,255,0.08)',
                        border: `2px solid ${visibility === "public" ? 'rgba(232,184,75,0.8)' : 'rgba(255,255,255,0.15)'}`,
                        borderRadius: '12px',
                        color: '#fff',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        textAlign: 'left',
                      }}
                    >
                      <div style={{ fontSize: "24px", marginBottom: "8px" }}>Public</div>
                      <div>Public</div>
                      <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginTop: '4px' }}>
                        Everyone can see this
                      </div>
                    </button>
                  </div>
                </div>

                {/* Featured */}
                <div>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    cursor: 'pointer',
                    userSelect: 'none',
                  }}>
                    <input
                      type="checkbox"
                      checked={featured}
                      onChange={(e) => setFeatured(e.target.checked)}
                      style={{
                        width: '20px',
                        height: '20px',
                        cursor: 'pointer',
                      }}
                    />
                    <span style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: 'rgba(255,255,255,0.8)',
                    }}>
                      Mark as featured recipe *
                    </span>
                  </label>
                </div>
              </motion.div>

              {/* Action Buttons */}
              <motion.div
                initial="hidden"
                animate="show"
                variants={fadeUp}
                custom={6}
                style={{
                  display: 'flex',
                  gap: '12px',
                  flexWrap: 'wrap',
                  justifyContent: 'flex-end',
                }}
              >
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  style={{
                    padding: '16px 32px',
                    background: 'rgba(255,255,255,0.08)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '15px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'rgba(255,255,255,0.12)';
                    e.target.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'rgba(255,255,255,0.08)';
                    e.target.style.transform = 'translateY(0)';
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={(e) => handleSubmit(e, "draft")}
                  style={{
                    padding: '16px 32px',
                    background: 'rgba(251,191,36,0.1)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(251,191,36,0.3)',
                    borderRadius: '12px',
                    color: 'rgba(251,191,36,0.9)',
                    fontSize: '15px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'rgba(251,191,36,0.2)';
                    e.target.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'rgba(251,191,36,0.1)';
                    e.target.style.transform = 'translateY(0)';
                  }}
                >
                  Save Draft
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '16px 32px',
                    background: 'rgba(232,184,75,0.9)',
                    border: '1px solid rgba(232,184,75,0.5)',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '15px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 16px rgba(232,184,75,0.3)',
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'rgba(232,184,75,1)';
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 8px 24px rgba(232,184,75,0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'rgba(232,184,75,0.9)';
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 4px 16px rgba(232,184,75,0.3)';
                  }}
                >
                  Save Changes
                </button>
                {visibility === "draft" && (
                  <button
                    type="button"
                    onClick={(e) => handleSubmit(e, "publish")}
                    style={{
                      padding: '16px 32px',
                      background: 'rgba(232,184,75,0.2)',
                      backdropFilter: 'blur(12px)',
                      border: '1px solid rgba(232,184,75,0.5)',
                      borderRadius: '12px',
                      color: 'rgba(232,184,75,0.9)',
                      fontSize: '15px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = 'rgba(232,184,75,0.3)';
                      e.target.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = 'rgba(232,184,75,0.2)';
                      e.target.style.transform = 'translateY(0)';
                    }}
                  >
                    Publish Public
                  </button>
                )}
              </motion.div>
            </div>

            {/* Preview Column */}
            {showPreview && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                style={{
                  position: 'sticky',
                  top: '20px',
                  height: 'fit-content',
                  maxHeight: 'calc(100vh - 40px)',
                  overflow: 'auto',
                  borderRadius: '20px',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                <RecipeDetails previewRecipe={previewData} previewMode embedded />
              </motion.div>
            )}
          </div>
        </form>
      </div>
      </div>

      {/* FOOTER */}
      <Footer />
    </div>
  </div>
  );
}


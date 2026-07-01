import React, { useState, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import API, { uploadImage } from "../services/api";
import { useToast } from "../context/ToastContext";
import { motion, AnimatePresence } from "framer-motion";
import NavbarHome from "../components/NavbarHome";
import Sidebar from "../components/Sidebar";
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

export default function CreateRecipe() {
  const navigate = useNavigate();
  const { showError, showSuccess } = useToast();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [difficulty, setDifficulty] = useState(null);
  const [selectedCats, setSelectedCats] = useState([]);
  const [cuisine, setCuisine] = useState("");
  const [serves, setServes] = useState(2);
  const [cookTime, setCookTime] = useState(30);
  const [isLoading, setIsLoading] = useState(false);
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageUrl, setImageUrl] = useState("");
  const [ingredients, setIngredients] = useState(defaultIngredients());
  const [steps, setSteps] = useState(defaultSteps());
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState("");
  const [visibility, setVisibility] = useState("draft"); // draft or public
  const [featured, setFeatured] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [fullPreviewMode, setFullPreviewMode] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [imageError, setImageError] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [width, setWidth] = useState(window.innerWidth);
  const fileInputRef = useRef(null);

  React.useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;
  const isCompact = isMobile || isTablet;

  const resetForm = () => {
    setTitle(""); setDescription(""); setDifficulty(null); setSelectedCats([]);
    setCuisine(""); setServes(2); setCookTime(30); setImage(null);
    setImagePreview(null); setImageUrl(""); setTags([]);
    setIngredients(defaultIngredients()); setSteps(defaultSteps());
    setVisibility("draft"); setFeatured(false); setTagInput(""); setImageError("");
  };

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
    e.preventDefault(); setIsDragOver(false);
    handleImageSelect(e.dataTransfer.files?.[0] || null);
  };

  const handleDragOver = (e) => { e.preventDefault(); setIsDragOver(true); };
  const handleDragLeave = () => setIsDragOver(false);

  const cancelImage = () => {
    setImage(null); setImagePreview(null); setImageError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const toggleCat = (cat) =>
    setSelectedCats((prev) => prev.includes(cat) ? prev.filter((c) => c !== cat) : (prev.length < 3 ? [...prev, cat] : prev));

  const addIngredient = () => setIngredients((prev) => prev.length >= 25 ? prev : [...prev, { id: Date.now(), name: "", qty: "", unit: "g" }]);
  const removeIngredient = (id) => setIngredients((prev) => prev.filter((i) => i.id !== id));
  const updateIngredient = (id, field, value) =>
    setIngredients((prev) => prev.map((i) => (i.id === id ? { ...i, [field]: field === "qty" ? value.replace(/[^\d.]/g, "") : value } : i)));

  const addStep = () => setSteps((prev) => prev.length >= 25 ? prev : [...prev, { id: Date.now(), text: "" }]);
  const removeStep = (id) => setSteps((prev) => prev.filter((s) => s.id !== id));
  const updateStep = (id, value) =>
    setSteps((prev) => prev.map((s) => (s.id === id ? { ...s, text: value } : s)));

  const addTag = () => {
    const normalized = tagInput.trim();
    if (!normalized) return;
    if (tags.length >= 5) {
      showError("Use no more than 5 tags.");
      return;
    }
    if (tags.some((tag) => tag.toLowerCase() === normalized.toLowerCase())) {
      showError("Tags cannot contain duplicates.");
      return;
    }
    if (normalized) {
      setTags([...tags, normalized]);
      setTagInput("");
    }
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
    if (!image && !imageUrl.trim()) errors.push("Recipe image is required");
    if (imageError) errors.push(imageError);
    return errors;
  };

  const handleSubmit = async (e, isDraft = false) => {
    e.preventDefault();

    const errors = isDraft ? validateDraftForm() : validateForm();
    if (errors.length > 0) {
      showError(`Please fix the following: ${errors.join(", ")}`);
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        showError("Authentication token not found. Please login first.");
        setIsLoading(false);
        return;
      }

      const formattedIngredients = ingredients
        .map((i) => ({ name: i.name?.trim() || "", qty: i.qty, unit: i.unit }))
        .filter((i) => i.name);
      const formattedSteps = steps
        .map((s) => ({ text: s.text?.trim() || "" }))
        .filter((s) => s.text);

      let uploadedImageUrl = imageUrl.trim();
      let uploadedImagePublicId = null;

      if (image) {
        const uploadResult = await uploadImage(image, "recipe");
        uploadedImageUrl = uploadResult.imageUrl;
        uploadedImagePublicId = uploadResult.imagePublicId || uploadResult.image?.publicId || null;
      }

      const jsonPayload = {
        title: title.trim(),
        description: description.trim(),
        difficultyLevel: difficulty?.toLowerCase(),
        category: selectedCats,
        cuisine: cuisine,
        cookTime,
        serves,
        ingredients: formattedIngredients,
        instructions: formattedSteps,
        tags: tags,
        visibility: isDraft ? "draft" : visibility,
        featured: featured,
        image: uploadedImageUrl,
        imageUrl: uploadedImageUrl,
        imagePublicId: uploadedImagePublicId,
      };

      const postJson = async (payload) =>
        API.post("/recipes", payload);

      await postJson(jsonPayload);

      showSuccess(isDraft ? "Recipe saved as draft." : "Recipe published successfully.");
      resetForm();
      setStatusMessage(isDraft ? "Saved as Draft" : "Published Successfully!");
      setIsError(false);
      setTimeout(() => setStatusMessage(""), 4000);
    } catch (err) {
      console.error("Submit error:", err);
      const msg = err.response?.data?.message || err.message || "Failed to save recipe";
      showError(msg);
      setStatusMessage(msg);
      setIsError(true);
      setTimeout(() => setStatusMessage(""), 4000);
    } finally {
      setIsLoading(false);
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
    ingredients,
    steps,
    tags,
    visibility,
    featured,
  }), [title, description, difficulty, selectedCats, cuisine, serves, cookTime, imagePreview, imageUrl, ingredients, steps, tags, visibility, featured]);

  if (fullPreviewMode) {
    return (
      <RecipeDetails
        previewRecipe={previewData}
        previewMode
        onEditAgain={() => setFullPreviewMode(false)}
      />
    );
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      width: '100%',
      ...getPageBackgroundStyle(isMobile, 0.58),
    }}>
      {/* ADD NAVBAR */}
      <NavbarHome />

      {/* ADD SIDEBAR */}
      <Sidebar sidebarOpen={sidebarOpen} />

      {/* WRAP CONTENT WITH MARGIN */}
      <div style={{
        marginLeft: isCompact ? '0' : '250px',
        width: isCompact ? '100%' : 'calc(100% - 250px)',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
      }}>

        {/* PAGE CONTENT */}
        <div style={{
          flex: 1,
          padding: isMobile ? '20px 12px 30px' : isTablet ? '30px 24px 50px' : '30px 40px 60px',
          maxWidth: '1200px',
          margin: '0 auto',
          width: '100%',
          fontFamily: 'Poppins, sans-serif',
        }}>
          <form onSubmit={handleSubmit} style={{ width: '100%' }}>

            <motion.div variants={fadeUp} initial="hidden" animate="show" custom={0.5} style={{ marginBottom: '24px', display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setShowPreview(!showPreview)}
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: '10px',
                  padding: '12px 24px',
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                {showPreview ? "Edit Mode" : "Live Preview"}
              </button>
              <button
                type="button"
                onClick={() => setFullPreviewMode(true)}
                style={{
                  background: 'rgba(232,184,75,0.12)',
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

            <div style={{
              display: 'grid',
              gridTemplateColumns: showPreview && !isCompact ? 'repeat(2, minmax(0, 1fr))' : '1fr',
              gap: '32px',
            }}>
            <div>

            {/* Header */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="show"
              custom={0}
              style={{
                textAlign: 'center',
                marginBottom: isMobile ? '32px' : '48px',
              }}
            >
              <h1 style={{
                fontSize: isMobile ? '28px' : '42px',
                fontWeight: '800',
                background: 'linear-gradient(135deg, #fff 0%, rgba(232,184,75,1) 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '-1px',
                marginBottom: '12px',
              }}>
                Create Your Recipe
              </h1>
              <p style={{
                fontSize: isMobile ? '14px' : '16px',
                color: 'rgba(255,255,255,0.6)',
                maxWidth: '600px',
                margin: '0 auto',
              }}>
                Share your culinary masterpiece with the world
              </p>
            </motion.div>

            {/* Status Message */}
            <AnimatePresence>
              {statusMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  style={{
                    padding: '16px 20px',
                    background: isError
                      ? 'rgba(239, 68, 68, 0.15)'
                      : 'rgba(232, 184, 75, 0.15)',
                    border: `1px solid ${isError ? 'rgba(239, 68, 68, 0.35)' : 'rgba(232, 184, 75, 0.35)'}`,
                    borderRadius: '12px',
                    marginBottom: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    color: '#fff',
                  }}
                >
                  <span style={{ fontSize: '20px' }}>
                    {isError ? '!' : 'OK'}
                  </span>
                  <span style={{ fontSize: '14px', fontWeight: '500' }}>
                    {statusMessage}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form Container */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              borderRadius: '24px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              padding: isMobile ? '20px 16px' : isTablet ? '32px 32px' : '40px 48px',
              boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
            }}>

              {/* Basic Info Section */}
              <motion.div
                variants={fadeUp}
                initial="hidden"
                animate="show"
                custom={1}
                style={{ marginBottom: '32px' }}
              >
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: '700',
                  color: '#fff',
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}>
                  Basic Information
                </h3>

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
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Classic Chocolate Chip Cookies"
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '14px',
                      outline: 'none',
                      transition: 'all 0.3s ease',
                    }}
                    onFocus={(e) => {
                      e.target.style.background = 'rgba(255, 255, 255, 0.12)';
                      e.target.style.border = '1px solid rgba(232, 184, 75, 0.5)';
                    }}
                    onBlur={(e) => {
                      e.target.style.background = 'rgba(255, 255, 255, 0.08)';
                      e.target.style.border = '1px solid rgba(255, 255, 255, 0.15)';
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
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description of your recipe..."
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '14px',
                      outline: 'none',
                      resize: 'vertical',
                      transition: 'all 0.3s ease',
                      fontFamily: 'Poppins, sans-serif',
                    }}
                    onFocus={(e) => {
                      e.target.style.background = 'rgba(255, 255, 255, 0.12)';
                      e.target.style.border = '1px solid rgba(232, 184, 75, 0.5)';
                    }}
                    onBlur={(e) => {
                      e.target.style.background = 'rgba(255, 255, 255, 0.08)';
                      e.target.style.border = '1px solid rgba(255, 255, 255, 0.15)';
                    }}
                  />
                </div>

                {/* Difficulty Level */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: 'rgba(255,255,255,0.8)',
                    marginBottom: '8px',
                  }}>
                    Difficulty Level *
                  </label>
                  <div style={{ display: 'flex', gap: isMobile ? '8px' : '12px', flexWrap: 'wrap' }}>
                    {['Easy', 'Medium', 'Hard'].map((level) => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setDifficulty(level)}
                        style={{
                          padding: isMobile ? '8px 16px' : '10px 20px',
                          background: difficulty === level
                            ? 'rgba(232, 184, 75, 0.2)'
                            : 'rgba(255, 255, 255, 0.08)',
                          border: difficulty === level
                            ? '1px solid rgba(232, 184, 75, 0.5)'
                            : '1px solid rgba(255, 255, 255, 0.15)',
                          borderRadius: '100px',
                          color: difficulty === level ? 'rgba(232, 184, 75, 1)' : '#fff',
                          fontSize: '14px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                        }}
                        onMouseEnter={(e) => {
                          if (difficulty !== level) {
                            e.target.style.background = 'rgba(255, 255, 255, 0.12)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (difficulty !== level) {
                            e.target.style.background = 'rgba(255, 255, 255, 0.08)';
                          }
                        }}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Categories */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: 'rgba(255,255,255,0.8)',
                    marginBottom: '8px',
                  }}>
                    Categories * (select at least one)
                  </label>
                  <div style={{ display: 'flex', gap: isMobile ? '8px' : '10px', flexWrap: 'wrap' }}>
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => toggleCat(cat)}
                        style={{
                          padding: isMobile ? '6px 12px' : '8px 16px',
                          background: selectedCats.includes(cat)
                            ? 'rgba(232, 184, 75, 0.2)'
                            : 'rgba(255, 255, 255, 0.08)',
                          border: selectedCats.includes(cat)
                            ? '1px solid rgba(232, 184, 75, 0.5)'
                            : '1px solid rgba(255, 255, 255, 0.15)',
                          borderRadius: '100px',
                          color: selectedCats.includes(cat) ? 'rgba(232, 184, 75, 1)' : '#fff',
                          fontSize: '13px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                        }}
                        onMouseEnter={(e) => {
                          if (!selectedCats.includes(cat)) {
                            e.target.style.background = 'rgba(255, 255, 255, 0.12)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!selectedCats.includes(cat)) {
                            e.target.style.background = 'rgba(255, 255, 255, 0.08)';
                          }
                        }}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Cuisine */}
                <div style={{ marginBottom: '20px' }}>
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
                      padding: '14px 16px',
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '12px',
                      color: cuisine ? '#fff' : 'rgba(255,255,255,0.5)',
                      fontSize: '14px',
                      outline: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                    }}
                    onFocus={(e) => {
                      e.target.style.background = 'rgba(255, 255, 255, 0.12)';
                      e.target.style.border = '1px solid rgba(232, 184, 75, 0.5)';
                    }}
                    onBlur={(e) => {
                      e.target.style.background = 'rgba(255, 255, 255, 0.08)';
                      e.target.style.border = '1px solid rgba(255, 255, 255, 0.15)';
                    }}
                  >
                    <option value="" disabled>Select cuisine type</option>
                    {CUISINES.map((c) => (
                      <option key={c} value={c} style={{ background: '#0A140D', color: '#fff' }}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Cooking Details */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                  gap: '20px'
                }}>
                  {/* Servings */}
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: 'rgba(255,255,255,0.8)',
                      marginBottom: '8px',
                    }}>
                      Servings
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={serves}
                      onChange={(e) => setServes(parseInt(e.target.value) || 1)}
                      style={{
                        width: '100%',
                        padding: '14px 16px',
                        background: 'rgba(255, 255, 255, 0.08)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: '12px',
                        color: '#fff',
                        fontSize: '14px',
                        outline: 'none',
                        transition: 'all 0.3s ease',
                      }}
                      onFocus={(e) => {
                        e.target.style.background = 'rgba(255, 255, 255, 0.12)';
                        e.target.style.border = '1px solid rgba(232, 184, 75, 0.5)';
                      }}
                      onBlur={(e) => {
                        e.target.style.background = 'rgba(255, 255, 255, 0.08)';
                        e.target.style.border = '1px solid rgba(255, 255, 255, 0.15)';
                      }}
                    />
                  </div>

                  {/* Cook Time */}
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: 'rgba(255,255,255,0.8)',
                      marginBottom: '8px',
                    }}>
                      Cook Time (minutes)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={cookTime}
                      onChange={(e) => setCookTime(parseInt(e.target.value) || 1)}
                      style={{
                        width: '100%',
                        padding: '14px 16px',
                        background: 'rgba(255, 255, 255, 0.08)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: '12px',
                        color: '#fff',
                        fontSize: '14px',
                        outline: 'none',
                        transition: 'all 0.3s ease',
                      }}
                      onFocus={(e) => {
                        e.target.style.background = 'rgba(255, 255, 255, 0.12)';
                        e.target.style.border = '1px solid rgba(232, 184, 75, 0.5)';
                      }}
                      onBlur={(e) => {
                        e.target.style.background = 'rgba(255, 255, 255, 0.08)';
                        e.target.style.border = '1px solid rgba(255, 255, 255, 0.15)';
                      }}
                    />
                  </div>
                </div>
              </motion.div>

              {/* Image Upload Section */}
              <motion.div
                variants={fadeUp}
                initial="hidden"
                animate="show"
                custom={2}
                style={{ marginBottom: '32px' }}
              >
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: '700',
                  color: '#fff',
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}>
                  Recipe Image *
                </h3>

                {/* Image Upload Area */}
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  style={{
                    padding: isMobile ? '32px 20px' : '48px 40px',
                    background: isDragOver
                      ? 'rgba(232, 184, 75, 0.1)'
                      : 'rgba(255, 255, 255, 0.05)',
                    border: isDragOver
                      ? '2px dashed rgba(232, 184, 75, 0.5)'
                      : '2px dashed rgba(255, 255, 255, 0.2)',
                    borderRadius: '16px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                  }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    onChange={handleFileInputChange}
                    style={{ display: 'none' }}
                  />

                  {imagePreview ? (
                    <div style={{ position: 'relative' }}>
                      <img
                        src={imagePreview}
                        alt="Preview"
                        style={{
                          width: '100%',
                          maxWidth: '400px',
                          height: 'auto',
                          borderRadius: '12px',
                          marginBottom: '16px',
                        }}
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          cancelImage();
                        }}
                        style={{
                          padding: '8px 16px',
                          background: 'rgba(239, 68, 68, 0.2)',
                          border: '1px solid rgba(239, 68, 68, 0.5)',
                          borderRadius: '100px',
                          color: '#ef4444',
                          fontSize: '13px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background = 'rgba(239, 68, 68, 0.3)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = 'rgba(239, 68, 68, 0.2)';
                        }}
                      >
                        Remove Image
                      </button>
                    </div>
                  ) : (
                    <>
                      <div style={{
                        fontSize: '48px',
                        marginBottom: '16px',
                      }}>Image</div>
                      <p style={{
                        fontSize: '15px',
                        fontWeight: '600',
                        color: '#fff',
                        marginBottom: '8px',
                      }}>
                        Click to upload or drag and drop
                      </p>
                      <p style={{
                        fontSize: '13px',
                        color: 'rgba(255,255,255,0.5)',
                      }}>
                        PNG, JPG, or WEBP (max. 5MB)
                      </p>
                    </>
                  )}
                </div>
                {imageError && (
                  <p style={{ margin: '10px 0 0', color: '#ef4444', fontSize: '13px', fontWeight: 600 }}>
                    {imageError}
                  </p>
                )}

                {/* Image URL Alternative */}
                <div style={{ marginTop: '20px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: 'rgba(255,255,255,0.8)',
                    marginBottom: '8px',
                  }}>
                    Or paste image URL
                  </label>
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    disabled={!!image}
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      background: image
                        ? 'rgba(255, 255, 255, 0.03)'
                        : 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '12px',
                      color: image ? 'rgba(255,255,255,0.3)' : '#fff',
                      fontSize: '14px',
                      outline: 'none',
                      cursor: image ? 'not-allowed' : 'text',
                      transition: 'all 0.3s ease',
                    }}
                    onFocus={(e) => {
                      if (!image) {
                        e.target.style.background = 'rgba(255, 255, 255, 0.12)';
                        e.target.style.border = '1px solid rgba(232, 184, 75, 0.5)';
                      }
                    }}
                    onBlur={(e) => {
                      if (!image) {
                        e.target.style.background = 'rgba(255, 255, 255, 0.08)';
                        e.target.style.border = '1px solid rgba(255, 255, 255, 0.15)';
                      }
                    }}
                  />
                </div>
              </motion.div>

              {/* Ingredients Section */}
              <motion.div
                variants={fadeUp}
                initial="hidden"
                animate="show"
                custom={3}
                style={{ marginBottom: '32px' }}
              >
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: '700',
                  color: '#fff',
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}>
                  Ingredients *
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {ingredients.map((ing, index) => (
                    <div
                      key={ing.id}
                      style={{
                        display: isMobile ? 'grid' : 'flex',
                        gridTemplateColumns: isMobile ? '1fr 1fr auto' : 'none',
                        gap: '10px',
                        alignItems: 'flex-start',
                      }}
                    >
                      <input
                        type="text"
                        value={ing.name}
                        onChange={(e) => updateIngredient(ing.id, 'name', e.target.value)}
                        placeholder="Ingredient name"
                        style={{
                          flex: isMobile ? 'none' : '2',
                          gridColumn: isMobile ? '1 / -1' : 'auto',
                          padding: '12px 14px',
                          background: 'rgba(255, 255, 255, 0.08)',
                          border: '1px solid rgba(255, 255, 255, 0.15)',
                          borderRadius: '10px',
                          color: '#fff',
                          fontSize: '14px',
                          outline: 'none',
                          transition: 'all 0.3s ease',
                        }}
                        onFocus={(e) => {
                          e.target.style.background = 'rgba(255, 255, 255, 0.12)';
                          e.target.style.border = '1px solid rgba(232, 184, 75, 0.5)';
                        }}
                        onBlur={(e) => {
                          e.target.style.background = 'rgba(255, 255, 255, 0.08)';
                          e.target.style.border = '1px solid rgba(255, 255, 255, 0.15)';
                        }}
                      />
                      <input
                        type="text"
                        value={ing.qty}
                        onChange={(e) => updateIngredient(ing.id, 'qty', e.target.value)}
                        placeholder="Qty"
                        style={{
                          flex: isMobile ? 'none' : '0.5',
                          padding: '12px 14px',
                          background: 'rgba(255, 255, 255, 0.08)',
                          border: '1px solid rgba(255, 255, 255, 0.15)',
                          borderRadius: '10px',
                          color: '#fff',
                          fontSize: '14px',
                          outline: 'none',
                          transition: 'all 0.3s ease',
                        }}
                        onFocus={(e) => {
                          e.target.style.background = 'rgba(255, 255, 255, 0.12)';
                          e.target.style.border = '1px solid rgba(232, 184, 75, 0.5)';
                        }}
                        onBlur={(e) => {
                          e.target.style.background = 'rgba(255, 255, 255, 0.08)';
                          e.target.style.border = '1px solid rgba(255, 255, 255, 0.15)';
                        }}
                      />
                      <select
                        value={ing.unit}
                        onChange={(e) => updateIngredient(ing.id, 'unit', e.target.value)}
                        style={{
                          flex: isMobile ? 'none' : '0.5',
                          padding: '12px 14px',
                          background: 'rgba(255, 255, 255, 0.08)',
                          border: '1px solid rgba(255, 255, 255, 0.15)',
                          borderRadius: '10px',
                          color: '#fff',
                          fontSize: '14px',
                          outline: 'none',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                        }}
                        onFocus={(e) => {
                          e.target.style.background = 'rgba(255, 255, 255, 0.12)';
                          e.target.style.border = '1px solid rgba(232, 184, 75, 0.5)';
                        }}
                        onBlur={(e) => {
                          e.target.style.background = 'rgba(255, 255, 255, 0.08)';
                          e.target.style.border = '1px solid rgba(255, 255, 255, 0.15)';
                        }}
                      >
                        {UNITS.map((u) => (
                          <option key={u} value={u} style={{ background: '#0A140D', color: '#fff' }}>
                            {u}
                          </option>
                        ))}
                      </select>
                      {ingredients.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removeIngredient(ing.id)}
                          style={{
                            padding: '12px 14px',
                            background: 'rgba(239, 68, 68, 0.15)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            borderRadius: '10px',
                            color: '#ef4444',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            flexShrink: 0,
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.background = 'rgba(239, 68, 68, 0.25)';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.background = 'rgba(239, 68, 68, 0.15)';
                          }}
                        >
                          x
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={addIngredient}
                  style={{
                    marginTop: '16px',
                    padding: '12px 24px',
                    background: 'rgba(232, 184, 75, 0.1)',
                    border: '1px solid rgba(232, 184, 75, 0.3)',
                    borderRadius: '100px',
                    color: 'rgba(232, 184, 75, 1)',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'rgba(232, 184, 75, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'rgba(232, 184, 75, 0.1)';
                  }}
                >
                  <span>+</span> Add Ingredient
                </button>
              </motion.div>

              {/* Instructions Section */}
              <motion.div
                variants={fadeUp}
                initial="hidden"
                animate="show"
                custom={4}
                style={{ marginBottom: '32px' }}
              >
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: '700',
                  color: '#fff',
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}>
                  Instructions *
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {steps.map((step, index) => (
                    <div
                      key={step.id}
                      style={{
                        display: 'flex',
                        gap: '10px',
                        alignItems: 'flex-start',
                      }}
                    >
                      <div style={{
                        width: '32px',
                        height: '32px',
                        background: 'rgba(232, 184, 75, 0.2)',
                        border: '1px solid rgba(232, 184, 75, 0.5)',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'rgba(232, 184, 75, 1)',
                        fontSize: '14px',
                        fontWeight: '700',
                        flexShrink: 0,
                      }}>
                        {index + 1}
                      </div>
                      <textarea
                        value={step.text}
                        onChange={(e) => updateStep(step.id, e.target.value)}
                        placeholder={`Step ${index + 1} instructions...`}
                        rows={2}
                        style={{
                          flex: 1,
                          padding: isMobile ? '10px 12px' : '12px 14px',
                          background: 'rgba(255, 255, 255, 0.08)',
                          border: '1px solid rgba(255, 255, 255, 0.15)',
                          borderRadius: '10px',
                          color: '#fff',
                          fontSize: '14px',
                          outline: 'none',
                          resize: 'vertical',
                          transition: 'all 0.3s ease',
                          fontFamily: 'Poppins, sans-serif',
                        }}
                        onFocus={(e) => {
                          e.target.style.background = 'rgba(255, 255, 255, 0.12)';
                          e.target.style.border = '1px solid rgba(232, 184, 75, 0.5)';
                        }}
                        onBlur={(e) => {
                          e.target.style.background = 'rgba(255, 255, 255, 0.08)';
                          e.target.style.border = '1px solid rgba(255, 255, 255, 0.15)';
                        }}
                      />
                      {steps.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removeStep(step.id)}
                          style={{
                            padding: '12px 14px',
                            background: 'rgba(239, 68, 68, 0.15)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            borderRadius: '10px',
                            color: '#ef4444',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            flexShrink: 0,
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.background = 'rgba(239, 68, 68, 0.25)';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.background = 'rgba(239, 68, 68, 0.15)';
                          }}
                        >
                          x
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={addStep}
                  style={{
                    marginTop: '16px',
                    padding: '12px 24px',
                    background: 'rgba(232, 184, 75, 0.1)',
                    border: '1px solid rgba(232, 184, 75, 0.3)',
                    borderRadius: '100px',
                    color: 'rgba(232, 184, 75, 1)',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'rgba(232, 184, 75, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'rgba(232, 184, 75, 0.1)';
                  }}
                >
                  <span>+</span> Add Step
                </button>
              </motion.div>

              {/* Tags Section */}
              <motion.div
                variants={fadeUp}
                initial="hidden"
                animate="show"
                custom={5}
                style={{ marginBottom: '32px' }}
              >
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: '700',
                  color: '#fff',
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}>
                  Tags (optional)
                </h3>

                <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                    placeholder="Add a tag..."
                    style={{
                      flex: 1,
                      padding: '12px 16px',
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '10px',
                      color: '#fff',
                      fontSize: '14px',
                      outline: 'none',
                      transition: 'all 0.3s ease',
                    }}
                    onFocus={(e) => {
                      e.target.style.background = 'rgba(255, 255, 255, 0.12)';
                      e.target.style.border = '1px solid rgba(232, 184, 75, 0.5)';
                    }}
                    onBlur={(e) => {
                      e.target.style.background = 'rgba(255, 255, 255, 0.08)';
                      e.target.style.border = '1px solid rgba(255, 255, 255, 0.15)';
                    }}
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    style={{
                      padding: '12px 24px',
                      background: 'rgba(232, 184, 75, 0.1)',
                      border: '1px solid rgba(232, 184, 75, 0.3)',
                      borderRadius: '10px',
                      color: 'rgba(232, 184, 75, 1)',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      whiteSpace: 'nowrap',
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = 'rgba(232, 184, 75, 0.2)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = 'rgba(232, 184, 75, 0.1)';
                    }}
                  >
                    Add Tag
                  </button>
                </div>

                {tags.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {tags.map((tag) => (
                      <div
                        key={tag}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '6px 12px',
                          background: 'rgba(232, 184, 75, 0.15)',
                          border: '1px solid rgba(232, 184, 75, 0.3)',
                          borderRadius: '100px',
                          fontSize: '13px',
                          fontWeight: '600',
                          color: 'rgba(232, 184, 75, 1)',
                        }}
                      >
                        <span>#{tag}</span>
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'rgba(232, 184, 75, 1)',
                            cursor: 'pointer',
                            padding: 0,
                            fontSize: '14px',
                            display: 'flex',
                            alignItems: 'center',
                          }}
                        >
                          x
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>

              {/* Publishing Options */}
              <motion.div
                variants={fadeUp}
                initial="hidden"
                animate="show"
                custom={6}
                style={{ marginBottom: '32px' }}
              >
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: '700',
                  color: '#fff',
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}>
                  Publishing Options
                </h3>

                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                }}>
                  {/* Visibility */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '16px 20px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}>
                    <div>
                      <div style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#fff',
                        marginBottom: '4px',
                      }}>
                        Visibility
                      </div>
                      <div style={{
                        fontSize: '12px',
                        color: 'rgba(255,255,255,0.5)',
                      }}>
                        Control who can see this recipe
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {['public', 'draft'].map((vis) => (
                        <button
                          key={vis}
                          type="button"
                          onClick={() => setVisibility(vis)}
                          style={{
                            padding: '8px 16px',
                            background: visibility === vis
                              ? 'rgba(232, 184, 75, 0.2)'
                              : 'rgba(255, 255, 255, 0.08)',
                            border: visibility === vis
                              ? '1px solid rgba(232, 184, 75, 0.5)'
                              : '1px solid rgba(255, 255, 255, 0.15)',
                            borderRadius: '100px',
                            color: visibility === vis ? 'rgba(232, 184, 75, 1)' : '#fff',
                            fontSize: '13px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            textTransform: 'capitalize',
                          }}
                          onMouseEnter={(e) => {
                            if (visibility !== vis) {
                              e.target.style.background = 'rgba(255, 255, 255, 0.12)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (visibility !== vis) {
                              e.target.style.background = 'rgba(255, 255, 255, 0.08)';
                            }
                          }}
                        >
                          {vis}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Featured */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '16px 20px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}>
                    <div>
                      <div style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#fff',
                        marginBottom: '4px',
                      }}>
                        Featured Recipe
                      </div>
                      <div style={{
                        fontSize: '12px',
                        color: 'rgba(255,255,255,0.5)',
                      }}>
                        Highlight this recipe on your profile
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFeatured(!featured)}
                      style={{
                        width: '48px',
                        height: '28px',
                        background: featured
                          ? 'rgba(232, 184, 75, 0.3)'
                          : 'rgba(255, 255, 255, 0.15)',
                        border: 'none',
                        borderRadius: '14px',
                        position: 'relative',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                      }}
                    >
                      <div style={{
                        width: '20px',
                        height: '20px',
                        background: featured
                          ? 'rgba(232, 184, 75, 1)'
                          : '#fff',
                        borderRadius: '50%',
                        position: 'absolute',
                        top: '4px',
                        left: featured ? '24px' : '4px',
                        transition: 'all 0.3s ease',
                      }} />
                    </button>
                  </div>
                </div>
              </motion.div>

              {/* Action Buttons */}
              <motion.div
                variants={fadeUp}
                initial="hidden"
                animate="show"
                custom={7}
                style={{
                  display: 'flex',
                  gap: '12px',
                  flexWrap: 'wrap',
                }}
              >
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  disabled={isLoading}
                  style={{
                    flex: 1,
                    minWidth: isMobile ? '100%' : '200px',
                    padding: '16px 32px',
                    background: 'transparent',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: '100px',
                    color: '#fff',
                    fontSize: '15px',
                    fontWeight: '700',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s ease',
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isLoading}
                  style={{
                    flex: 1,
                    minWidth: isMobile ? '100%' : '200px',
                    padding: '16px 32px',
                    background: isLoading
                      ? 'rgba(232, 184, 75, 0.3)'
                      : 'rgba(232, 184, 75, 1)',
                    border: 'none',
                    borderRadius: '100px',
                    color: '#fff',
                    fontSize: '15px',
                    fontWeight: '700',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 8px 20px rgba(232, 184, 75, 0.3)',
                  }}
                  onMouseEnter={(e) => {
                    if (!isLoading) {
                      e.target.style.transform = 'translateY(-2px)';
                      e.target.style.boxShadow = '0 12px 24px rgba(232, 184, 75, 0.4)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isLoading) {
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = '0 8px 20px rgba(232, 184, 75, 0.3)';
                    }
                  }}
                >
                  {isLoading ? "Publishing..." : "Publish Recipe"}
                </button>

                <button
                  type="button"
                  onClick={(e) => handleSubmit(e, true)}
                  disabled={isLoading}
                  style={{
                    flex: 1,
                    minWidth: isMobile ? '100%' : '200px',
                    padding: '16px 32px',
                    background: 'transparent',
                    border: '1px solid rgba(232, 184, 75, 0.5)',
                    borderRadius: '100px',
                    color: 'rgba(232, 184, 75, 1)',
                    fontSize: '15px',
                    fontWeight: '700',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!isLoading) {
                      e.target.style.background = 'rgba(232, 184, 75, 0.1)';
                      e.target.style.transform = 'translateY(-2px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isLoading) {
                      e.target.style.background = 'transparent';
                      e.target.style.transform = 'translateY(0)';
                    }
                  }}
                >
                  Save as Draft
                </button>

                <button
                  type="button"
                  onClick={() => setFullPreviewMode(true)}
                  style={{
                    flex: 1,
                    minWidth: isMobile ? '100%' : '200px',
                    padding: '16px 32px',
                    background: 'transparent',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: '100px',
                    color: '#fff',
                    fontSize: '15px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                  }}
                >
                  Preview
                </button>
              </motion.div>
            </div>
            </div>
            {showPreview && (
              <div style={{
                position: 'sticky',
                top: '20px',
                maxHeight: 'calc(100vh - 40px)',
                overflow: 'auto',
                borderRadius: '20px',
                border: '1px solid rgba(255,255,255,0.1)',
              }}>
                <RecipeDetails previewRecipe={previewData} previewMode embedded />
              </div>
            )}
            </div>
          </form>
        </div>

        {/* ADD FOOTER */}
        <Footer />
      </div>
    </div>
  );
}


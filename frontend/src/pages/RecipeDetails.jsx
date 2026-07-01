import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { 
  FaLink, FaWhatsapp, FaFacebook, FaInstagram, FaEnvelope,
  FaGrinTongue, FaThumbsUp, FaFire, FaHeart, FaCheck,
  FaClipboardList, FaStar, FaRegStar, FaPen, FaTrash, FaUserCircle
} from "react-icons/fa";
import { FaRegHeart } from "react-icons/fa6";
import { IoMdShareAlt } from "react-icons/io";
import { IoEyeSharp } from "react-icons/io5";
import { CiSaveDown2 } from "react-icons/ci";
import { TiCamera } from "react-icons/ti";
import { GiSpellBook } from "react-icons/gi";
import { BsPeopleFill } from "react-icons/bs";
import { MdAccessTime, MdArrowBack, MdCalendarToday, MdPublic, MdReportProblem, MdSignalCellularAlt } from "react-icons/md";
import API, { rateRecipe, recordRecipeView } from "../services/api";
import NavbarHome from "../components/NavbarHome";
import Footer from "../components/Footer";
import Sidebar from "../components/Sidebar";
import DefaultAvatar from "../components/common/DefaultAvatar";
import { ACCENT_HEX, accent, getPageBackgroundStyle } from "../utils/theme";
import "./RecipeDetails.css";

const REACTION_META = {
  delicious: { emoji: <FaGrinTongue />, label: "Delicious" },
  like: { emoji: <FaThumbsUp />, label: "Like" },
  fire: { emoji: <FaFire />, label: "Fire" },
};

const difficultyConfig = {
  easy: { label: "Easy", color: "#e8b84b" },
  medium: { label: "Medium", color: "#f59e0b" },
  hard: { label: "Hard", color: "#ef4444" },
};

const fractionMap = {
  "¼": 0.25,
  "½": 0.5,
  "¾": 0.75,
  "⅓": 1 / 3,
  "⅔": 2 / 3,
  "⅛": 0.125,
};

const formatTime = (minutes) => {
  if (!minutes) return "-";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder ? `${hours}h ${remainder}m` : `${hours}h`;
};

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
};

const userIdOf = (user) => String(user?._id || user?.id || "");

const getIngredientBaseQuantity = (ingredient) => {
  if (ingredient?.qty !== undefined && ingredient?.qty !== null && ingredient?.qty !== "") {
    return `${ingredient.qty}${ingredient.unit ? ` ${ingredient.unit}` : ""}`.trim();
  }
  return ingredient?.quantity || "";
};

const parseQuantityStart = (value) => {
  const text = String(value || "").trim();
  const tokenMatch = text.match(/^(\d+(?:\.\d+)?)([¼½¾⅓⅔⅛])?|^([¼½¾⅓⅔⅛])/);
  if (!tokenMatch) return null;

  const token = tokenMatch[0];
  const whole = tokenMatch[1] ? Number(tokenMatch[1]) : 0;
  const fraction = tokenMatch[2] || tokenMatch[3];
  const amount = whole + (fraction ? fractionMap[fraction] : 0);

  return {
    amount,
    token,
    suffix: text.slice(token.length).trimStart(),
  };
};

const formatScaledAmount = (value) => {
  if (!Number.isFinite(value)) return "";
  const rounded = Math.round(value * 100) / 100;
  if (Number.isInteger(rounded)) return String(rounded);
  return String(rounded).replace(/\.?0+$/, "");
};

const scaleQuantity = (ingredient, ratio) => {
  const base = getIngredientBaseQuantity(ingredient);
  if (!base || ratio === 1) return base;

  if (typeof ingredient?.qty === "number") {
    return `${formatScaledAmount(ingredient.qty * ratio)}${ingredient.unit ? ` ${ingredient.unit}` : ""}`.trim();
  }

  const parsed = parseQuantityStart(base);
  if (!parsed) return base;
  const scaled = formatScaledAmount(parsed.amount * ratio);
  return `${scaled}${parsed.suffix ? ` ${parsed.suffix}` : ""}`.trim();
};

const displayIngredient = (ingredient, ratio) => {
  if (typeof ingredient === "string") return ingredient;
  const scaled = scaleQuantity(ingredient, ratio);
  const name = ingredient?.name || "Ingredient";
  const weight = ingredient?.weight ? ` (${ingredient.weight})` : "";
  return `${scaled ? `${scaled}${weight} ` : ""}${name}`.trim();
};

const getStepText = (step) => {
  if (typeof step === "string") return step;
  if (step?.text) return step.text;
  if (step?.title && step?.description) return `${step.title}: ${step.description}`;
  return step?.description || "";
};


function RecipeDetails({ previewRecipe = null, previewMode = false, onEditAgain = null, embedded = false }) {
  const { id, legacyId } = useParams();
  const recipeParam = previewMode ? null : (legacyId || id);
  const navigate = useNavigate();
  const menuRef = useRef(null);
  const shareMenuRef = useRef(null);

  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(!previewMode);
  const [error, setError] = useState(null);
  const [imgError, setImgError] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [favoriteBusy, setFavoriteBusy] = useState(false);
  const [saveBusy, setSaveBusy] = useState(false);
  const [ratingBusy, setRatingBusy] = useState(false);
  const [reactionBusy, setReactionBusy] = useState(false);
  const [width, setWidth] = useState(window.innerWidth);
  const [sidebarOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [servings, setServings] = useState(1);
  const [doneSteps, setDoneSteps] = useState({});
  const [lightboxImage, setLightboxImage] = useState(null);
  const [bioExpanded, setBioExpanded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [shareMenuOpen, setShareMenuOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [RecipeSnapOpen, setRecipeSnapOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [RecipeSnapFile, setRecipeSnapFile] = useState(null);
  const [localSnaps, setLocalSnaps] = useState([]);
  const [reportReason, setReportReason] = useState("Spam");
  const [reportNote, setReportNote] = useState("");
  const [reportBusy, setReportBusy] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewText, setReviewText] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [reviewBusy, setReviewBusy] = useState(false);

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (!userStr) return;
    try {
      setCurrentUser(JSON.parse(userStr));
    } catch (err) {
      console.error("Recipe details user parse error:", err);
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) setMenuOpen(false);
      if (shareMenuRef.current && !shareMenuRef.current.contains(event.target)) setShareMenuOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timeout = window.setTimeout(() => setToast(null), 3000);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const fetchRecipe = async () => {
    try {
      setLoading(true);
      setImgError(false);

      const response = await API.get(`/recipes/${recipeParam}`);
      setRecipe(response?.data?.data || response?.data?.recipe || response?.data || null);
      setError(null);
    } catch (err) {
      console.error("Recipe fetch error:", err);
      setError(err?.response?.data?.message || "Failed to load recipe.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (previewMode && previewRecipe) {
      setRecipe(previewRecipe);
      setLoading(false);
      setError(null);
    }
  }, [previewMode, previewRecipe]);

  useEffect(() => {
    if (previewMode || !recipeParam) return;
    fetchRecipe();
  }, [recipeParam, previewMode]);

  useEffect(() => {
    if (previewMode || !recipe) return;
    const recipeId = recipe.id || recipe._id;
    const currentUserId = userIdOf(currentUser);
    const creatorId = userIdOf(recipe.createdBy) || String(recipe.userId || "");
    if (currentUserId && creatorId && currentUserId === creatorId) return;
    recordRecipeView(recipeId).catch(() => {});
  }, [recipe, currentUser, previewMode]);

  useEffect(() => {
    if (!recipe) return;
    const currentUserId = userIdOf(currentUser);
    const savedBy = Array.isArray(recipe.savedBy) ? recipe.savedBy.map(String) : [];
    setIsSaved(Boolean(currentUserId && savedBy.includes(currentUserId)));
    setServings(Number(recipe.serves) || 1);
    setDoneSteps({});
    setBioExpanded(false);
  }, [recipe, currentUser]);

  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;
  const isCompact = isMobile || isTablet;
  const authorRaw = recipe?.createdBy && typeof recipe.createdBy === "object"
    ? recipe.createdBy
    : (recipe?.author || recipe?.authorName || {});
  const authorObj = authorRaw && typeof authorRaw === 'object' ? authorRaw : {};
  const authorName = typeof authorRaw === 'string' ? authorRaw : (authorRaw?.name || '');
  const authorId = userIdOf(authorObj);
  const currentUserId = userIdOf(currentUser);
  const canEdit = Boolean(currentUserId && recipe && (currentUserId === String(recipe.userId || "") || currentUserId === authorId));
  const diffConfig = difficultyConfig[recipe?.difficultyLevel] || {
    label: recipe?.difficulty || recipe?.difficultyLevel || "Unknown",
    color: ACCENT_HEX,
  };

  const ingredients = useMemo(() => (Array.isArray(recipe?.ingredients) ? recipe.ingredients : []), [recipe]);
  const instructions = useMemo(() => (Array.isArray(recipe?.instructions) ? recipe.instructions : []), [recipe]);
  const categories = Array.isArray(recipe?.category) ? recipe.category : recipe?.category ? [recipe.category] : [];
  const tags = Array.isArray(recipe?.tags) ? recipe.tags : [];
  const demoSnaps = [
    ...(Array.isArray(recipe?.demoSnaps) ? recipe.demoSnaps : []),
    ...localSnaps
  ];
  const reviews = Array.isArray(recipe?.reviews) ? recipe.reviews : [];
  const myReview = useMemo(() => {
    if (!currentUserId) return null;
    return reviews.find((item) => String(item.user || item.userId || "") === currentUserId) || null;
  }, [reviews, currentUserId]);
  const reactions = Array.isArray(recipe?.reactions) ? recipe.reactions : [];
  const reactionCounts = recipe?.reactionCounts || {};
  const servingRatio = servings / (Number(recipe?.serves) || 1);

  const otherReactions = useMemo(
    () => reactions.filter((reaction) => String(reaction.userId || "") !== currentUserId),
    [reactions, currentUserId]
  );

  const socialProof = useMemo(() => {
    if (!otherReactions.length) return null;
    const typeCounts = otherReactions.reduce((acc, item) => {
      acc[item.type] = (acc[item.type] || 0) + 1;
      return acc;
    }, {});
    const commonType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "liked";
    return {
      emoji: commonType === "saved" ? <CiSaveDown2 /> : <FaHeart />,
      userName: otherReactions[0]?.userName || "Someone",
      hasOthers: otherReactions.length > 1,
    };
  }, [otherReactions]);

  const notify = (message) => setToast({ id: Date.now(), message });

  const toggleFavorite = async () => {
    if (!currentUser || favoriteBusy || !recipe) {
      if (!currentUser) alert("Please login to like this recipe.");
      return;
    }
    if (!recipeParam) {
      console.warn("toggleFavorite aborted – missing recipe ID");
      return;
    }

    try {
      setFavoriteBusy(true);
      const response = await API.post(`/recipes/${recipeParam}/like`);
      setRecipe((prev) => ({
        ...prev,
        likes: response?.data?.likes ?? prev.likes,
        isLiked: response?.data?.isLiked ?? !prev.isLiked,
      }));
    } catch (err) {
      console.error("Favorite toggle error:", err);
      alert(err?.response?.data?.message || "Failed to update like.");
    } finally {
      setFavoriteBusy(false);
    }
  };

  const toggleSave = async () => {
    if (!currentUser || saveBusy || !recipe) {
      if (!currentUser) alert("Please login to save this recipe!");
      return;
    }

    try {
      setSaveBusy(true);
      const response = await API.put(`/recipes/${recipeParam}/save`);
      const nextSaved = response?.data?.isSaved ?? response?.data?.saved ?? !isSaved;
      setIsSaved(nextSaved);
      setRecipe((prev) => {
        const savedBy = new Set((prev.savedBy || []).map(String));
        if (nextSaved) savedBy.add(currentUserId);
        else savedBy.delete(currentUserId);
        return { ...prev, savedBy: [...savedBy] };
      });
      notify(nextSaved ? "Recipe saved! Come back to it later." : "Recipe removed from saved.");
    } catch (err) {
      console.error("Save toggle error:", err);
      alert(err?.response?.data?.message || "Failed to update saved recipe.");
    } finally {
      setSaveBusy(false);
    }
  };

  const handleRate = async (value) => {
    if (!currentUser || ratingBusy || !recipe) {
      if (!currentUser) alert("Please login to rate this recipe.");
      return;
    }
    if (!recipeParam) {
      console.warn("handleRate aborted – missing recipe ID");
      return;
    }

    try {
      setRatingBusy(true);
      const response = await rateRecipe(recipeParam, value);
      setRecipe((prev) => ({
        ...prev,
        rating: response?.rating ?? prev.rating,
        ratingCount: response?.ratingCount ?? prev.ratingCount,
        userRating: response?.userRating ?? value,
      }));
    } catch (err) {
      console.error("Rate recipe error:", err);
      alert(err?.response?.data?.message || "Failed to save rating.");
    } finally {
      setRatingBusy(false);
    }
  };

  const handleReaction = async (type) => {
    if (!currentUser || reactionBusy || !recipe) {
      if (!currentUser) alert("Please login to react to this recipe.");
      return;
    }

    try {
      setReactionBusy(true);
      const response = await API.post(`/recipes/${recipeParam}/react`, { type });
      setRecipe((prev) => ({
        ...prev,
        reactionCounts: response?.data?.reactionCounts || {
          ...(prev.reactionCounts || {}),
          [type]: (prev.reactionCounts?.[type] || 0) + 1,
        },
        reactions: response?.data?.reactions || prev.reactions,
      }));
    } catch (err) {
      console.error("Reaction error:", err);
      alert(err?.response?.data?.message || "Failed to add reaction.");
    } finally {
      setReactionBusy(false);
    }
  };

  const getShareUrl = () => (previewMode ? window.location.origin : window.location.href);
  const getShareLinks = () => {
    const url = encodeURIComponent(getShareUrl());
    const title = encodeURIComponent(recipe?.title || "Recipe");
    return {
      whatsapp: `https://wa.me/?text=${title}%20${url}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      gmail: `mailto:?subject=${title}&body=${encodeURIComponent(`Check out this recipe: ${decodeURIComponent(url)}`)}`,
      instagram: "https://www.instagram.com/",
    };
  };

  const copyLink = async () => {
    if (previewMode) {
      notify("Preview mode — link available after publishing.");
      return;
    }
    try {
      await navigator.clipboard.writeText(window.location.href);
      if (currentUser) {
        API.post(`/recipes/${recipeParam}/share`).catch((error) => {
          console.error("Share activity error:", error);
        });
      }
      notify("Link copied!");
    } catch (err) {
      console.error("Copy link error:", err);
    }
  };

  const openShareWindow = (url) => {
    if (previewMode) {
      notify("Preview mode — sharing available after publishing.");
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleAddToFavorites = async () => {
    if (previewMode) return;
    if (!currentUser || saveBusy || favoriteBusy || !recipe) {
      if (!currentUser) alert("Please login to add this recipe to favorites.");
      return;
    }

    try {
      setSaveBusy(true);
      setFavoriteBusy(true);
      const response = await API.post(`/recipes/${recipeParam}/favorite`);
      setIsSaved(true);
      setRecipe((prev) => ({
        ...prev,
        isLiked: true,
        likes: response?.data?.likes ?? prev.likes,
        savedBy: response?.data?.savedBy || prev.savedBy,
      }));
      notify("Added to Saved&liked list!");
    } catch (err) {
      console.error("Add to favorites error:", err);
      alert(err?.response?.data?.message || "Failed to add to favorites.");
    } finally {
      setSaveBusy(false);
      setFavoriteBusy(false);
    }
  };

  const submitRecipeSnap = async (event) => {
    event.preventDefault();
    if (previewMode) return;
    if (!currentUser) {
      alert("Please login to add a RecipeSnap.");
      return;
    }

    if (RecipeSnapFile) {
      const previewUrl = URL.createObjectURL(RecipeSnapFile);
      setLocalSnaps((prev) => [...prev, previewUrl]);
    }
    setRecipeSnapOpen(false);
    setRecipeSnapFile(null);
    notify("RecipeSnap uploaded successfully!");
  };

  const openReviewForm = (existingReview = null) => {
    if (previewMode) return;
    if (!currentUser) {
      alert("Please login to write a review.");
      return;
    }
    setEditingReviewId(existingReview?._id || existingReview?.id || null);
    setReviewText(existingReview?.text || "");
    setReviewRating(Number(existingReview?.rating) || 5);
    setReviewOpen(true);
  };

  const submitReview = async (event) => {
    event.preventDefault();
    if (previewMode || !recipe || reviewBusy) return;
    const trimmed = reviewText.trim();
    if (trimmed.length < 5) {
      alert("Review must be at least 5 characters.");
      return;
    }

    try {
      setReviewBusy(true);
      const recipeId = recipe.id || recipe._id;
      const payload = { text: trimmed, rating: reviewRating };
      const response = editingReviewId
        ? await API.put(`/recipes/${recipeId}/reviews/${editingReviewId}`, payload)
        : await API.post(`/recipes/${recipeId}/reviews`, payload);
      const updated = response?.data?.recipe || response?.data?.data;
      if (updated) setRecipe(updated);
      setReviewOpen(false);
      setReviewText("");
      setReviewRating(5);
      setEditingReviewId(null);
      notify(editingReviewId ? "Review updated." : "Review posted.");
    } catch (err) {
      console.error("Review submit error:", err);
      alert(err?.response?.data?.message || "Failed to save review.");
    } finally {
      setReviewBusy(false);
    }
  };

  const deleteReview = async (reviewId) => {
    if (previewMode || !recipe || reviewBusy) return;
    if (!window.confirm("Delete this review?")) return;

    try {
      setReviewBusy(true);
      const recipeId = recipe.id || recipe._id;
      const response = await API.delete(`/recipes/${recipeId}/reviews/${reviewId}`);
      const updated = response?.data?.recipe || response?.data?.data;
      if (updated) setRecipe(updated);
      notify("Review deleted.");
    } catch (err) {
      console.error("Review delete error:", err);
      alert(err?.response?.data?.message || "Failed to delete review.");
    } finally {
      setReviewBusy(false);
    }
  };

  const submitReport = async (event) => {
    event.preventDefault();
    if (!reportReason) {
      alert("Please select a reason for reporting.");
      return;
    }
    setReportBusy(true);
    try {
      // Frontend demo delay
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setReportOpen(false);
      setReportReason("Spam");
      setReportNote("");
      notify("Recipe reported successfully. Thank you for helping improve Recipe.IO.");
    } finally {
      setReportBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="recipe-details-status" style={getPageBackgroundStyle(false, 0.62)}>
        <div>Loading recipe...</div>
      </div>
    );
  }

  if (error || !recipe) {
    return (
      <div className="recipe-details-status" style={getPageBackgroundStyle(false, 0.62)}>
        <div>{error || "Recipe not found."}</div>
        <button onClick={() => navigate("/home")}><MdArrowBack /> Back to Home</button>
      </div>
    );
  }

  return (
    <div className={`recipe-details-shell ${embedded ? "recipe-details-embedded" : ""}`}>
      {!embedded && <NavbarHome />}
      {!embedded && <Sidebar sidebarOpen={sidebarOpen} />}

      <main
        className="recipe-details-main"
        style={{
          marginLeft: embedded || isCompact ? "0" : "250px",
          width: embedded || isCompact ? "100%" : "calc(100% - 250px)",
          maxWidth: "100%",
          overflowX: "clip",
          boxSizing: "border-box",
        }}
      >
        <section className="recipe-details-page" style={getPageBackgroundStyle(isMobile, 0.58)}>
          <AnimatePresence>
            {toast && (
              <motion.div
                key={toast.id}
                className="recipe-toast"
                initial={{ opacity: 0, x: 40, y: -10 }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                exit={{ opacity: 0, x: 40 }}
              >
                <span>{toast.message}</span>
                <button onClick={() => setToast(null)} aria-label="Dismiss notification">×</button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="recipe-details-wrap">
            <motion.button
              className="recipe-back-btn"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => (onEditAgain ? onEditAgain() : navigate(-1))}
            >
              {onEditAgain ? <><FaPen /> Edit Again</> : <><MdArrowBack /> Go Back</>}
            </motion.button>

            {previewMode && (
              <div className="recipe-preview-banner">Preview Mode — no changes are saved</div>
            )}

            <motion.section className="recipe-hero-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="recipe-hero-grid">
                <div className="recipe-hero-image-wrap">
                  {!imgError && recipe.image ? (
                    <img src={recipe.image} alt={recipe.title} onError={() => setImgError(true)} />
                  ) : (
                    <div className="recipe-image-fallback">No image</div>
                  )}
                </div>

                <div className="recipe-hero-copy">
                  <div className="recipe-hero-topline">
                    {recipe.isDraft && <span className="recipe-draft-pill">Draft Recipe</span>}
                    <div className="recipe-menu-wrap" ref={menuRef}>
                      <button className="recipe-menu-button" onClick={() => setMenuOpen((prev) => !prev)} aria-label="Recipe options">
                        ⋯
                      </button>
                      <AnimatePresence>
                        {menuOpen && (
                          <motion.div
                            className="recipe-options-menu"
                            initial={{ opacity: 0, scaleY: 0, originY: 0 }}
                            animate={{ opacity: 1, scaleY: 1, originY: 0 }}
                            exit={{ opacity: 0, scaleY: 0, originY: 0 }}
                          >
                            <button onClick={() => { setRecipeSnapOpen(true); setMenuOpen(false); }}><TiCamera /> Add RecipeSnap</button>
                            <button onClick={() => { setReportOpen(true); setMenuOpen(false); }}><MdReportProblem /> Report Recipe</button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
                    {recipe.title}
                  </motion.h1>

                  <div className="recipe-action-row">
                    <button className="recipe-primary-pill" onClick={toggleFavorite} disabled={favoriteBusy}>
                      {recipe.isLiked ? <FaHeart style={{ color: "#ef4444" }} /> : <FaRegHeart />} {recipe.likes || 0} {recipe.isLiked ? "Liked" : "Likes"}
                    </button>
                    <motion.button
                      className={`recipe-save-pill ${isSaved ? "is-saved" : ""}`}
                      onClick={toggleSave}
                      disabled={saveBusy}
                      whileTap={{ scale: 0.92 }}
                    >
                      <span><CiSaveDown2 /></span> {isSaved ? "Saved" : "Save"}
                    </motion.button>
                    <div className="share-menu-wrap" ref={shareMenuRef}>
                      <button className="recipe-ghost-pill" onClick={() => setShareMenuOpen((prev) => !prev)}><IoMdShareAlt /> Share Link</button>
                      <AnimatePresence>
                        {shareMenuOpen && (
                          <motion.div
                            className="recipe-share-menu"
                            initial={{ opacity: 0, scale: 0.95, y: -10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -10 }}
                            transition={{ duration: 0.2 }}
                          >
                            <button onClick={() => { copyLink(); setShareMenuOpen(false); }}>
                              <FaLink /> <span>Copy URL</span>
                            </button>
                            <button onClick={() => { openShareWindow(getShareLinks().whatsapp); setShareMenuOpen(false); }}>
                              <FaWhatsapp /> <span>WhatsApp</span>
                            </button>
                            <button onClick={() => { openShareWindow(getShareLinks().facebook); setShareMenuOpen(false); }}>
                              <FaFacebook /> <span>Facebook</span>
                            </button>
                            <button onClick={() => {
                              copyLink();
                              openShareWindow(getShareLinks().instagram);
                              setShareMenuOpen(false);
                            }}>
                              <FaInstagram /> <span>Instagram</span>
                            </button>
                            <button onClick={() => { openShareWindow(getShareLinks().gmail); setShareMenuOpen(false); }}>
                              <FaEnvelope /> <span>Gmail</span>
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    <button className="recipe-ghost-pill" onClick={handleAddToFavorites} disabled={saveBusy || favoriteBusy}><CiSaveDown2 /> Add to Favorites</button>
                    {canEdit && (
                      <button className="recipe-edit-pill" onClick={() => navigate(`/edit-recipe/${id}`)}>
                        <FaPen /> Edit Recipe
                      </button>
                    )}
                  </div>

                  <div className="recipe-meta-row">
                    <span><MdAccessTime /> Time {formatTime(recipe.cookTime)}</span>
                    <span style={{ borderColor: diffConfig.color, color: diffConfig.color }}><MdSignalCellularAlt /> Difficulty {diffConfig.label}</span>
                    <span><BsPeopleFill /> Serves {recipe.serves}</span>
                    <span>
                      {Number(recipe.ratingCount || 0) > 0
                        ? <><FaStar /> Rating {Number(recipe.rating || 0).toFixed(1)} / 5 ({recipe.ratingCount || 0})</>
                        : <><FaRegStar /> No ratings yet</>}
                    </span>
                    <span><IoEyeSharp /> Views {recipe.views || 0}</span>
                  </div>

                  <div className="recipe-reaction-row">
                    {Object.entries(REACTION_META).map(([type, meta]) => (
                      <button key={type} onClick={() => handleReaction(type)} disabled={reactionBusy} aria-label={meta.label}>
                        {meta.emoji} <span>{reactionCounts[type] || 0}</span>
                      </button>
                    ))}
                  </div>

                  {reviews.length === 0 && !previewMode && (
                    <button className="recipe-first-review" onClick={() => openReviewForm()}>
                      <FaStar /> Write the first review!
                    </button>
                  )}

                  {demoSnaps.length > 0 && (
                    <div className="demo-snaps-container" style={{ marginTop: '20px', display: 'flex', gap: '10px', overflowX: 'auto' }}>
                      {demoSnaps.map((snap, i) => (
                        <button key={i} onClick={() => setLightboxImage(snap)} style={{ border: 0, background: 'transparent', padding: 0, cursor: 'pointer' }}>
                          <img src={snap} alt={`RecipeSnap ${i + 1}`} style={{ height: '120px', borderRadius: '12px', objectFit: 'cover' }} />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.section>

            <AnimatePresence>
              {socialProof && (
                <motion.div
                  className="recipe-social-proof"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                >
                  <span>{socialProof.emoji}</span>
                  <strong>{socialProof.userName}</strong>
                  <span>{socialProof.hasOthers ? "& Others Loved this Recipe" : "Loved this Recipe"}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="recipe-content-grid">
              <div className="recipe-left-column">
                <section className="content-card recipe-about-card">
                  <h2><GiSpellBook /> About This Recipe</h2>
                  <p>{recipe.description || "A CookSphere recipe with complete ingredients and step-by-step instructions."}</p>
                  <div className="recipe-chip-row">
                    {[...tags, ...categories].map((tag, index) => (
                      <button
                        key={`${tag}-${index}`}
                        className="recipe-chip"
                        onClick={() => navigate(`/home?tag=${encodeURIComponent(tag)}`)}
                        style={{ cursor: 'pointer', border: 'none', background: 'transparent', textDecoration: 'none' }}
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                  {recipe.tip && <div className="recipe-tip">Tip: {recipe.tip}</div>}
                </section>

                <section className="content-card">
                  <div className="recipe-card-header">
                    <div>
                      <h2>Ingredients ({ingredients.length})</h2>
                      <p><BsPeopleFill /> For {servings} servings</p>
                    </div>
                    <div className="servings-adjuster">
                      <button onClick={() => setServings((prev) => Math.max(1, prev - 1))}>−</button>
                      <span>{servings}</span>
                      <button onClick={() => setServings((prev) => Math.min(20, prev + 1))}>+</button>
                    </div>
                  </div>

                  <ul className="recipe-ingredient-list">
                    {ingredients.map((ingredient, index) => {
                      const group = typeof ingredient === "object" ? ingredient.group : null;
                      const previous = ingredients[index - 1];
                      const previousGroup = typeof previous === "object" ? previous.group : null;
                      return (
                        <React.Fragment key={`${group || "ingredient"}-${index}`}>
                          {group && group !== previousGroup && <li className="ingredient-group-heading">{group}</li>}
                          <motion.li animate={{ scale: [1, 1.04, 1] }} transition={{ duration: 0.25 }}>
                            {displayIngredient(ingredient, servingRatio)}
                          </motion.li>
                        </React.Fragment>
                      );
                    })}
                  </ul>
                </section>

                <section className="content-card">
                  <h2><FaClipboardList /> Step-by-Step Instructions ({instructions.length})</h2>
                  <div className="recipe-step-list">
                    {instructions.map((step, index) => {
                      const stepImages = Array.isArray(step?.images) ? step.images.slice(0, 3) : [];
                      const done = doneSteps[index];
                      return (
                        <motion.article
                          key={index}
                          className={`recipe-step-card ${done ? "is-done" : ""}`}
                          animate={{ opacity: done ? 0.42 : 1 }}
                        >
                          <label className="step-done-toggle">
                            <input
                              type="checkbox"
                              checked={Boolean(done)}
                              onChange={(event) => setDoneSteps((prev) => ({ ...prev, [index]: event.target.checked }))}
                            />
                            <span>Mark as Done</span>
                          </label>
                          {done && <div className="step-check-overlay"><FaCheck /></div>}
                          <div className="step-title-row">
                            <span className="step-number">Step {step?.step || index + 1}</span>
                            {step?.durationMinutes && <span className="step-time-badge"><MdAccessTime /> {step.durationMinutes} min</span>}
                          </div>
                          <p>{getStepText(step)}</p>
                          {stepImages.length > 0 && (
                            <div className="step-image-row">
                              {stepImages.map((image) => (
                                <button key={image} onClick={() => setLightboxImage(image)}>
                                  <img src={image} alt="" />
                                </button>
                              ))}
                            </div>
                          )}
                        </motion.article>
                      );
                    })}
                  </div>
                </section>

                <section className="content-card">
                  <h2><FaStar /> Rate this Recipe</h2>
                  <div className="recipe-rating-row">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => handleRate(star)}
                        disabled={ratingBusy || previewMode}
                        className={star <= (recipe.userRating || 0) ? "is-active" : ""}
                      >
                        <FaStar />
                      </button>
                    ))}
                  </div>
                  {recipe.userRating ? <p>You rated this recipe {recipe.userRating}/5.</p> : null}
                </section>

                <section className="content-card">
                  <div className="recipe-card-header">
                    <h2>Reviews ({reviews.length})</h2>
                    {!previewMode && currentUser && !myReview && (
                      <button className="recipe-ghost-pill" type="button" onClick={() => openReviewForm()}>Write Review</button>
                    )}
                  </div>
                  {reviews.length > 0 ? (
                    <div className="recipe-review-list">
                      {reviews.map((review) => {
                        const reviewId = review._id || review.id;
                        const reviewUserId = String(review.user || review.userId || "");
                        const isOwn = currentUserId && reviewUserId === currentUserId;
                        return (
                          <article key={reviewId} className="recipe-review-card">
                            <div className="recipe-review-top">
                              <strong>{review.userName || "Community Member"}</strong>
                              {review.rating ? <span>{review.rating}/5 <FaStar /></span> : null}
                            </div>
                            <p>{review.text}</p>
                            {!previewMode && isOwn && (
                              <div className="recipe-review-actions">
                                <button type="button" onClick={() => openReviewForm(review)}><FaPen /> Edit</button>
                                <button type="button" onClick={() => deleteReview(reviewId)}><FaTrash /> Delete</button>
                              </div>
                            )}
                          </article>
                        );
                      })}
                    </div>
                  ) : (
                    <p>No reviews yet.</p>
                  )}
                </section>
              </div>

              <aside className="recipe-right-column">
                <section className="content-card chef-card">
                  <div className="chef-card-top">
                    <DefaultAvatar src={authorObj.profileImage} alt={authorName || "Chef"} className="chef-avatar" />
                    <div>
                      <h2>{authorName || "CookSphere Chef"}</h2>
                      <p>@{authorObj.username || "chef"}</p>
                    </div>
                  </div>
                  <p className="chef-joined">Joined {formatDate(authorObj.createdAt)}</p>
                  <button className="follow-btn" onClick={() => navigate(`/profile/${authorObj.username || authorId}`)}>
                    <FaUserCircle /> View Profile
                  </button>
                  {authorObj.bio && (
                    <div className={`chef-bio ${bioExpanded ? "is-expanded" : ""}`}>
                      <p>{authorObj.bio}</p>
                      <button onClick={() => setBioExpanded((prev) => !prev)}>
                        {bioExpanded ? "Show less ↑" : "Read more ↓"}
                      </button>
                    </div>
                  )}
                  {(authorObj.username || authorId) && <Link to={`/profile/${authorObj.username || authorId}`} className="chef-profile-link">View all recipes by this chef</Link>}
                </section>

                <section className="content-card details-card">
                  <h2>Recipe Details</h2>
                  <dl>
                    <div><dt><MdSignalCellularAlt /> Difficulty</dt><dd>{diffConfig.label}</dd></div>
                    <div><dt><MdAccessTime /> Time</dt><dd>{formatTime(recipe.cookTime)}</dd></div>
                    <div><dt><BsPeopleFill /> Servings</dt><dd>{recipe.serves || "-"}</dd></div>
                    <div><dt><MdPublic /> Status</dt><dd>{recipe.isDraft ? "Draft" : "Published"}</dd></div>
                    <div><dt><MdCalendarToday /> Created</dt><dd>{formatDate(recipe.createdAt)}</dd></div>
                  </dl>
                </section>
              </aside>
            </div>
          </div>
        </section>

        {!embedded && <Footer />}
      </main>

      <AnimatePresence>
        {lightboxImage && (
          <motion.div className="recipe-lightbox" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setLightboxImage(null)}>
            <button aria-label="Close image">×</button>
            <img src={lightboxImage} alt="" />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {reviewOpen && (
          <motion.div className="recipe-modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.form className="recipe-modal" onSubmit={submitReview} initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 24, opacity: 0 }}>
              <button type="button" className="modal-close" onClick={() => setReviewOpen(false)}>×</button>
              <h2>{editingReviewId ? "Edit Review" : "Write a Review"}</h2>
              <div className="recipe-rating-row">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewRating(star)}
                    className={star <= reviewRating ? "is-active" : ""}
                  >
                    <FaStar />
                  </button>
                ))}
              </div>
              <textarea
                value={reviewText}
                onChange={(event) => setReviewText(event.target.value)}
                placeholder="Share your experience with this recipe..."
                rows={5}
                required
              />
              <button type="submit" className="recipe-primary-pill" disabled={reviewBusy}>
                {reviewBusy ? "Saving..." : editingReviewId ? "Update Review" : "Post Review"}
              </button>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {RecipeSnapOpen && (
          <motion.div className="recipe-modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.form className="recipe-modal" onSubmit={submitRecipeSnap} initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 24, opacity: 0 }}>
              <button type="button" className="modal-close" onClick={() => setRecipeSnapOpen(false)}>×</button>
              <h2><TiCamera /> Add RecipeSnap</h2>
              <input type="file" accept="image/*" onChange={(event) => setRecipeSnapFile(event.target.files?.[0] || null)} />
              {RecipeSnapFile && (
                <div style={{ marginTop: '14px', marginBottom: '14px' }}>
                  <img src={URL.createObjectURL(RecipeSnapFile)} alt="Preview" style={{ width: '100%', borderRadius: '12px', maxHeight: '200px', objectFit: 'contain' }} />
                </div>
              )}
              <button type="submit" className="recipe-primary-pill">Submit RecipeSnap</button>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {reportOpen && (
          <motion.div className="recipe-modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.form className="recipe-modal" onSubmit={submitReport} initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 24, opacity: 0 }}>
              <button type="button" className="modal-close" onClick={() => setReportOpen(false)}>×</button>
              <h2><MdReportProblem /> Report Recipe</h2>
              <select value={reportReason} onChange={(event) => setReportReason(event.target.value)}>
                <option>Spam</option>
                <option>Inappropriate</option>
                <option>Copyright</option>
                <option>Other</option>
              </select>
              <textarea value={reportNote} onChange={(event) => setReportNote(event.target.value)} placeholder="Optional note" />
              <button type="submit" className="recipe-primary-pill" disabled={reportBusy}>
                {reportBusy ? "Submitting..." : "Submit Report"}
              </button>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default RecipeDetails;







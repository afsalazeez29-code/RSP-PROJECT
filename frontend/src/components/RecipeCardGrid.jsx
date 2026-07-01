import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import { toggleLikeRecipe } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { FaHeart, FaRegHeart, FaStar, FaRegStar, FaArrowRight } from "react-icons/fa";
import { TbChefHatFilled } from "react-icons/tb";
import { MdAccessTime, MdAdd, MdSignalCellularAlt } from "react-icons/md";

const RecipeCardGrid = ({ recipes = [], totalCards = null, showPlaceholders = false }) => {
  const { user, isAuthenticated, updateUser } = useAuth();
  const [favoriteOverrides, setFavoriteOverrides] = useState({});
  const location = useLocation();
  const isLanding = location.pathname === '/';
  const [width, setWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handle = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handle);
    return () => window.removeEventListener('resize', handle);
  }, []);

  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;

  const likedRecipeIds = useMemo(() => {
    if (!Array.isArray(user?.likedRecipes)) return new Set();
    return new Set(user.likedRecipes.map((id) => id?.toString()));
  }, [user?.likedRecipes]);

  const isFavorite = (recipe) => {
    const id = (recipe._id || recipe.id)?.toString();
    if (Object.prototype.hasOwnProperty.call(favoriteOverrides, id)) {
      return favoriteOverrides[id];
    }
    return Boolean(recipe.isFavorite || recipe.isLiked || likedRecipeIds.has(id));
  };

  const toggleFavorite = async (recipe, e) => {
    e.preventDefault();
    e.stopPropagation();

    const id = (recipe._id || recipe.id)?.toString();
    if (!id) {
      console.warn("toggleFavorite aborted – recipe ID is missing", recipe);
      return;
    }
    const nextFavorite = !isFavorite(recipe);

    setFavoriteOverrides((prev) => ({ ...prev, [id]: nextFavorite }));

    if (!isAuthenticated) return;

    try {
      const response = await toggleLikeRecipe(id);
      const serverFavorite = Boolean(response?.isLiked);

      setFavoriteOverrides((prev) => ({ ...prev, [id]: serverFavorite }));

      if (user && updateUser) {
        const currentLiked = Array.isArray(user.likedRecipes) ? user.likedRecipes.map((item) => item?.toString()) : [];
        const nextLiked = serverFavorite
          ? Array.from(new Set([...currentLiked, id]))
          : currentLiked.filter((recipeId) => recipeId !== id);
        updateUser({ ...user, likedRecipes: nextLiked });
      }
    } catch (error) {
      setFavoriteOverrides((prev) => ({ ...prev, [id]: !nextFavorite }));
      console.error("Favorite toggle error:", error);
    }
  };

  const placeholderCount = showPlaceholders
    ? Math.max(0, (totalCards || recipes.length) - recipes.length)
    : 0;

  const PlaceholderCard = ({ index }) => (
    <div
      className="recipe-card placeholder-card"
      style={{
        ...cardStyle,
        minHeight: "100%",
        cursor: "default",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: isMobile ? "32px 18px" : "40px 24px",
        borderStyle: "dashed",
        boxShadow: "0 12px 32px rgba(0,0,0,0.18)",
        opacity: 0.72,
        pointerEvents: "none",
      }}
      aria-disabled="true"
    >
      <span
        className="plus-icon"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: isMobile ? "64px" : "76px",
          height: isMobile ? "64px" : "76px",
          borderRadius: "50%",
          border: "1px solid rgba(255,255,255,0.22)",
          color: "#e8b84b",
          fontSize: isMobile ? "60px" : "72px",
          lineHeight: 1,
          fontWeight: 300,
          marginBottom: "18px",
        }}
      >
        <MdAdd />
      </span>
      <p style={{ margin: "0 0 6px", color: "#fff", fontSize: "17px", fontWeight: 800 }}>
        New Recipe
      </p>
      <p className="pending-label" style={{ margin: 0, color: "rgba(255,255,255,0.58)", fontSize: "13px" }}>
        admin integration pending
      </p>
    </div>
  );

  const containerStyle = {
    display: "grid",
    gridTemplateColumns: isMobile ? "1fr" : isTablet ? "repeat(2, 1fr)" : "repeat(auto-fill, minmax(280px, 1fr))",
    gap: isMobile ? "16px" : "24px",
    width: "100%",
    padding: "0",
  };

  const cardStyle = {
    background: "rgba(255, 255, 255, 0.08)",
    backdropFilter: "blur(15px)",
    WebkitBackdropFilter: "blur(15px)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "12px",
    overflow: "hidden",
    cursor: "pointer",
    transition: "all 0.3s ease",
    textDecoration: "none",
    color: "inherit",
    display: "flex",
    flexDirection: "column",
    height: "100%",
  };

  const ImageContainerStyle = {
    position: "relative",
    overflow: "hidden",
    height: "220px",
    backgroundColor: "rgba(0, 0, 0, 0.2)",
  };

  const imageStyle = {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    transition: "transform 0.4s ease",
  };

  const heartStyle = {
    position: "absolute",
    top: "12px",
    right: "12px",
    fontSize: "24px",
    cursor: "pointer",
    transition: "all 0.2s ease",
    filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.2))",
  };

  const contentStyle = {
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    flex: 1,
    justifyContent: "space-between",
  };

  const categoryStyle = {
    fontSize: "11px",
    fontWeight: "600",
    letterSpacing: "0.5px",
    textTransform: "uppercase",
    color: "#e8b84b",
    opacity: 0.85,
    margin: "0",
  };

  const titleStyle = {
    fontSize: "16px",
    fontWeight: "700",
    color: "#fff",
    margin: "0",
    lineHeight: "1.4",
    display: "-webkit-box",
    WebkitLineClamp: "2",
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
  };

  const descriptionStyle = {
    fontSize: "13px",
    color: "rgba(255,255,255,0.68)",
    lineHeight: "1.45",
    margin: 0,
    display: "-webkit-box",
    WebkitLineClamp: "2",
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
  };

  const metaRowStyle = {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flexWrap: "wrap",
    fontSize: "12px",
    color: "rgba(255,255,255,0.62)",
  };

  const ratingContainerStyle = {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "13px",
    color: "rgba(255,255,255,0.7)",
  };

  const viewRecipeStyle = {
    fontSize: "13px",
    fontWeight: "600",
    color: "#e8b84b",
    marginTop: "8px",
    transition: "color 0.2s ease",
  };

  return (
    <div style={containerStyle}>
      {recipes.length === 0 && !showPlaceholders ? (
        <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "40px 0", color: "rgba(255,255,255,0.5)" }}>
          No recipes found.
        </div>
      ) : (
        <>
          {recipes.map((recipe, index) => {
            const recipeId = recipe._id || recipe.id;
            const targetPath = isLanding
              ? (isAuthenticated ? `/recipe/${recipeId}` : "/login")
              : `/recipes/${recipeId}`;
            const recipeFavorite = isFavorite(recipe);
            const authorRaw = recipe.author || recipe.createdBy || recipe.authorName;
            const authorName = typeof authorRaw === 'string' ? authorRaw : (authorRaw?.name || '');
            const authorFirst = authorName ? authorName.split(' ')[0] : '';
            const difficulty = recipe.difficulty || recipe.difficultyLevel;

            return (
              <Link key={recipeId} to={targetPath} style={{ textDecoration: "none" }}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{
                    background: "rgba(255, 255, 255, 0.12)",
                    border: "1px solid rgba(232, 184, 75, 0.4)",
                    y: -6,
                    boxShadow: "0 12px 32px rgba(232, 184, 75, 0.2)",
                  }}
                  style={cardStyle}
                >
                  <div style={ImageContainerStyle}>
                    <img
                      src={recipe.image}
                      alt={recipe.title}
                      style={{
                        ...imageStyle,
                        transition: "transform 0.4s ease",
                      }}
                      onMouseEnter={(e) => (e.target.style.transform = "scale(1.08)")}
                      onMouseLeave={(e) => (e.target.style.transform = "scale(1)")}
                    />
                    <div
                      style={{
                        ...heartStyle,
                        color: recipeFavorite ? "#ff4757" : "rgba(255,255,255,0.8)",
                      }}
                      onClick={(e) => toggleFavorite(recipe, e)}
                    >
                      {recipeFavorite ? <FaHeart color="#ff4757" /> : <FaRegHeart />}
                    </div>
                  </div>

                  <div style={contentStyle}>
                    {recipe.category && <p style={categoryStyle}>{recipe.category}</p>}
                    <h3 style={titleStyle}>{recipe.title}</h3>
                    {recipe.description && <p style={descriptionStyle}>{recipe.description}</p>}
                    {authorName && (
                      <p style={{ margin: 0, fontSize: "12px", color: "rgba(255,255,255,0.62)", lineHeight: 1.4, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <TbChefHatFilled />
                        {isLanding ? `by Chef ${authorFirst}` : `by ${authorName}`}
                      </p>
                    )}
                    {(difficulty || recipe.cookTime) && (
                      <div style={metaRowStyle}>
                        {difficulty && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MdSignalCellularAlt /> {String(difficulty).charAt(0).toUpperCase() + String(difficulty).slice(1)}</span>}
                        {recipe.cookTime && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MdAccessTime /> {recipe.cookTime} min</span>}
                      </div>
                    )}

                    <div style={ratingContainerStyle}>
                      {Number(recipe.ratingCount || 0) > 0 ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <FaStar color="#ffd700" /> {Number(recipe.rating || 0).toFixed(1)} / 5
                        </span>
                      ) : (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><FaRegStar /> No ratings yet</span>
                      )}
                    </div>

                    <div style={{ ...viewRecipeStyle, display: 'flex', alignItems: 'center', gap: '4px' }}>View Recipe <FaArrowRight /></div>
                  </div>
                </motion.div>
              </Link>
            );
          })}
          {Array.from({ length: placeholderCount }, (_, index) => (
            <PlaceholderCard key={`placeholder-${index}`} index={index} />
          ))}
        </>
      )}
    </div>
  );
};

export default RecipeCardGrid;



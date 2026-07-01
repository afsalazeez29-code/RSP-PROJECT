import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import NavbarHome from "../components/NavbarHome";
import Sidebar from "../components/Sidebar";
import Footer from "../components/Footer";
import { FaHeart, FaStar } from "react-icons/fa";
import { CiSearch } from "react-icons/ci";
import { IoEyeSharp } from "react-icons/io5";
import { TbChefHatFilled } from "react-icons/tb";
import DefaultAvatar from "../components/common/DefaultAvatar";
import API from "../services/api";
import { ACCENT_HEX, accent, getPageBackgroundStyle } from "../utils/theme";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, delay: i * 0.05, ease: [0.4, 0, 0.2, 1] },
  }),
};

const Favorites = () => {
  const navigate = useNavigate();
  const [recipes, setRecipes] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [width, setWidth] = useState(window.innerWidth);
  const recipesPerPage = 9;

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const loadSavedRecipes = async () => {
      try {
        setIsLoading(true);
        const response = await API.get("/recipes/user/saved");
        setRecipes(response?.data?.recipes || []);
      } catch (err) {
        console.error("Load favorites error:", err);
        setIsError(true);
        setStatusMessage(err?.response?.data?.message || "Failed to load favorites.");
      } finally {
        setIsLoading(false);
      }
    };

    loadSavedRecipes();
  }, []);

  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;
  const isCompact = isMobile || isTablet;

  const filteredRecipes = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return recipes;

    return recipes.filter((recipe) => {
      const haystack = [
        recipe.title,
        recipe.description,
        recipe.createdBy?.name,
        ...(recipe.category || []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [recipes, searchQuery]);

  const totalPages = Math.ceil(filteredRecipes.length / recipesPerPage);
  const paginatedRecipes = filteredRecipes.slice(
    (currentPage - 1) * recipesPerPage,
    currentPage * recipesPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const handleCardClick = (id) => navigate(`/recipes/${id}`);

  const handleUnlike = async (id) => {
    try {
      const response = await API.put(`/recipes/${id}/save`);
      if (response?.data) {
        setRecipes((prev) => prev.filter((recipe) => recipe.id !== id && recipe._id !== id));
        setStatusMessage("Removed from saved recipes.");
        setIsError(false);
      }
    } catch (err) {
      console.error("Unsave recipe error:", err);
      setStatusMessage(err?.response?.data?.message || "Failed to remove saved recipe.");
      setIsError(true);
    } finally {
      setTimeout(() => setStatusMessage(""), 2500);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", width: "100%" }}>
      <NavbarHome />
      <Sidebar sidebarOpen={sidebarOpen} />

      <div
        style={{
          marginLeft: isCompact ? "0" : "250px",
          width: isCompact ? "100%" : "calc(100% - 250px)",
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
        }}
      >
        <div
          style={{
            flex: 1,
            minHeight: "100vh",
            ...getPageBackgroundStyle(isMobile, 0.58),
            fontFamily: "Poppins, sans-serif",
            padding: isMobile ? "30px 20px 40px" : "30px 40px 60px",
          }}
        >
          <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
            <motion.div initial="hidden" animate="show" variants={fadeUp} style={{ marginBottom: "32px" }}>
              <h1
                style={{
                  fontSize: isMobile ? "36px" : "48px",
                  fontWeight: "800",
                  color: "#fff",
                  marginBottom: "16px",
                  background: `linear-gradient(135deg, ${ACCENT_HEX} 0%, #f4cf73 100%)`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                My Favorites
              </h1>
              <p style={{ fontSize: "16px", color: "rgba(255,255,255,0.78)" }}>
                Your real saved recipe collection from the database.
              </p>
            </motion.div>

            <AnimatePresence>
              {statusMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  style={{
                    padding: "16px 20px",
                    background: isError ? "rgba(239,68,68,0.2)" : accent(0.2),
                    border: `1px solid ${isError ? "rgba(239,68,68,0.35)" : accent(0.32)}`,
                    borderRadius: "12px",
                    marginBottom: "24px",
                    color: "#fff",
                    fontSize: "14px",
                    fontWeight: "500",
                  }}
                >
                  {statusMessage}
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div initial="hidden" animate="show" variants={fadeUp} custom={1} style={{ marginBottom: "32px" }}>
              <input
                type="text"
                placeholder="Search favorites..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  maxWidth: "500px",
                  padding: "14px 20px",
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  borderRadius: "12px",
                  color: "#fff",
                  fontSize: "14px",
                  outline: "none",
                }}
              />
            </motion.div>

            {isLoading && (
              <motion.div
                initial="hidden"
                animate="show"
                variants={fadeUp}
                custom={2}
                style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "60px 20px" }}
              >
                <div style={{ fontSize: "24px", color: "rgba(255,255,255,0.65)" }}>Loading your favorites...</div>
              </motion.div>
            )}

            {!isLoading && filteredRecipes.length === 0 && (
              <motion.div
                initial="hidden"
                animate="show"
                variants={fadeUp}
                custom={2}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "60px 20px",
                }}
              >
                <div style={{ fontSize: "72px", marginBottom: "16px", color: "#ef4444" }}><FaHeart /></div>
                <h3 style={{ fontSize: "24px", color: "#fff", marginBottom: "8px" }}>No favorites yet</h3>
                <p style={{ fontSize: "16px", color: "rgba(255,255,255,0.7)", marginBottom: "24px" }}>
                  Like recipes from other users and they will appear here instantly.
                </p>
                <button
                  onClick={() => navigate("/home")}
                  style={{
                    padding: "12px 24px",
                    background: ACCENT_HEX,
                    border: "none",
                    borderRadius: "100px",
                    color: "#fff",
                    fontSize: "14px",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                >
                  <CiSearch /> Explore Recipes
                </button>
              </motion.div>
            )}

            {!isLoading && paginatedRecipes.length > 0 && (
              <motion.div
                initial="hidden"
                animate="show"
                variants={fadeUp}
                custom={2}
                style={{
                  display: "grid",
                  gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(320px, 1fr))",
                  gap: "24px",
                }}
              >
                <AnimatePresence>
                  {paginatedRecipes.map((recipe, index) => (
                    <motion.div
                      key={recipe.id || recipe._id || index}
                      initial="hidden"
                      animate="show"
                      exit={{ opacity: 0, scale: 0.95 }}
                      variants={fadeUp}
                      custom={index}
                      style={{
                        background: "rgba(255,255,255,0.06)",
                        borderRadius: "16px",
                        overflow: "hidden",
                        border: "1px solid rgba(255,255,255,0.1)",
                        backdropFilter: "blur(10px)",
                        WebkitBackdropFilter: "blur(10px)",
                        cursor: "pointer",
                        position: "relative",
                      }}
                    >
                      <div
                        style={{
                          height: "200px",
                          backgroundImage: `url(${recipe.image})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                          position: "relative",
                        }}
                        onClick={() => handleCardClick(recipe.id || recipe._id)}
                      >
                        <div
                          style={{
                            position: "absolute",
                            top: "12px",
                            right: "12px",
                            background: "rgba(0,0,0,0.7)",
                            padding: "6px 12px",
                            borderRadius: "20px",
                            color: "#fff",
                            fontSize: "12px",
                            fontWeight: "600",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          <FaHeart style={{ color: "#ef4444" }} /> {recipe.likes || 0}
                        </div>
                      </div>

                      <div style={{ padding: "20px" }} onClick={() => handleCardClick(recipe.id || recipe._id)}>
                        <h3 style={{ fontSize: "18px", fontWeight: "600", color: "#fff", marginBottom: "8px" }}>
                          {recipe.title}
                        </h3>
                        <p
                          style={{
                            fontSize: "14px",
                            color: "rgba(255,255,255,0.74)",
                            marginBottom: "16px",
                            lineHeight: "1.45",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {recipe.description || "Open this recipe to see the full details."}
                        </p>

                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            marginBottom: "16px",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: "12px", color: "rgba(255,255,255,0.65)" }}><IoEyeSharp /> {recipe.views || 0}</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: "12px", color: "rgba(255,255,255,0.65)" }}>
                              <FaStar /> {Number(recipe.rating || 0).toFixed(1)}
                            </span>
                          </div>
                          <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.65)" }}>
                            {recipe.createdAt ? new Date(recipe.createdAt).toLocaleDateString() : "-"}
                          </div>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <DefaultAvatar
                            src={recipe.createdBy?.profileImage}
                            alt={recipe.createdBy?.name || "Recipe creator"}
                            size={24}
                            style={{
                            }}
                          />
                          <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.8)" }}>
                            <TbChefHatFilled /> by {recipe.createdBy?.name || "Unknown creator"}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUnlike(recipe.id || recipe._id);
                        }}
                        style={{
                          position: "absolute",
                          bottom: "12px",
                          right: "12px",
                          background: "rgba(239,68,68,0.2)",
                          border: "1px solid rgba(239,68,68,0.3)",
                          padding: "8px 12px",
                          borderRadius: "16px",
                          color: "#ef4444",
                          fontSize: "12px",
                          fontWeight: "600",
                          cursor: "pointer",
                        }}
                      >
                        Remove
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            )}

            {!isLoading && totalPages > 1 && (
              <motion.div
                initial="hidden"
                animate="show"
                variants={fadeUp}
                custom={3}
                style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "8px", marginTop: "32px" }}
              >
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  style={{
                    padding: "8px 16px",
                    background: currentPage === 1 ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "8px",
                    color: currentPage === 1 ? "rgba(255,255,255,0.3)" : "#fff",
                    cursor: currentPage === 1 ? "not-allowed" : "pointer",
                  }}
                >
                  Previous
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    style={{
                      padding: "8px 12px",
                      background: currentPage === page ? ACCENT_HEX : "rgba(255,255,255,0.05)",
                      border: "1px solid",
                      borderColor: currentPage === page ? ACCENT_HEX : "rgba(255,255,255,0.1)",
                      borderRadius: "8px",
                      color: currentPage === page ? "#fff" : "rgba(255,255,255,0.7)",
                      cursor: "pointer",
                      minWidth: "40px",
                    }}
                  >
                    {page}
                  </button>
                ))}

                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  style={{
                    padding: "8px 16px",
                    background: currentPage === totalPages ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "8px",
                    color: currentPage === totalPages ? "rgba(255,255,255,0.3)" : "#fff",
                    cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                  }}
                >
                  Next
                </button>
              </motion.div>
            )}
          </div>
        </div>

        <Footer />
      </div>
    </div>
  );
};

export default Favorites;




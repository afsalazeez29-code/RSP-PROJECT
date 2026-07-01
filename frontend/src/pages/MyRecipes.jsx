import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "../context/ToastContext";
import API from "../services/api";
import Sidebar from "../components/Sidebar";
import NavbarHome from "../components/NavbarHome";
import Footer from "../components/Footer";
import { FaHeart, FaPen, FaStar, FaTrash } from "react-icons/fa";
import { IoEyeSharp } from "react-icons/io5";
import { CiSearch } from "react-icons/ci";
import { ImBooks } from "react-icons/im";
import { RiDraftFill } from "react-icons/ri";
import { SiBookstack } from "react-icons/si";
import { TfiWrite } from "react-icons/tfi";
import { MdAdd, MdContentCopy, MdPublic } from "react-icons/md";
import { ACCENT_HEX, accent, getPageBackgroundStyle } from "../utils/theme";
import DeleteConfirmModal from "../components/DeleteConfirmModal";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, delay: i * 0.05, ease: [0.4, 0, 0.2, 1] },
  }),
};

const MyRecipes = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  const [recipes, setRecipes] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [width, setWidth] = useState(window.innerWidth);

  const recipesPerPage = 9;

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;
  const isCompact = isMobile || isTablet;

  const loadRecipes = async () => {
    try {
      setIsLoading(true);
      const response = await API.get("/recipes/user/my-recipes");
      setRecipes(response?.data?.recipes || []);
    } catch (err) {
      console.error("Load recipes error:", err);
      showError(err?.response?.data?.message || "Failed to load your recipes.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRecipes();
  }, []);

  const filteredRecipes = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return recipes.filter((recipe) => {
      const matchesSearch = !query || [recipe.title, recipe.description, ...(recipe.category || [])]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query);

      const matchesStatus = statusFilter === "all" || recipe.visibility === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [recipes, searchQuery, statusFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  const totalPages = Math.ceil(filteredRecipes.length / recipesPerPage);
  const paginatedRecipes = filteredRecipes.slice(
    (currentPage - 1) * recipesPerPage,
    currentPage * recipesPerPage
  );

  const totalRecipes = recipes.length;
  const totalViews = recipes.reduce((sum, recipe) => sum + (recipe.views || 0), 0);
  const totalLikes = recipes.reduce((sum, recipe) => sum + (recipe.likes || 0), 0);
  const ratingTotals = recipes.reduce((acc, recipe) => {
    const count = Number(recipe.ratingCount || 0);
    if (count > 0) {
      acc.stars += Number(recipe.rating || 0) * count;
      acc.count += count;
    }
    return acc;
  }, { stars: 0, count: 0 });
  const avgRating = ratingTotals.count ? (ratingTotals.stars / ratingTotals.count).toFixed(1) : "0.0";
  const draftCount = recipes.filter((recipe) => recipe.visibility === "draft").length;
  const publicCount = recipes.filter((recipe) => recipe.visibility === "public").length;

  const handleView = (id) => navigate(`/recipes/${id}`);
  const handleEdit = (id) => navigate(`/edit-recipe/${id}`);

  const handleDelete = (recipe) => {
    setDeleteTarget(recipe);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const id = deleteTarget.id || deleteTarget._id;
    try {
      await API.delete(`/recipes/${id}`);
      setRecipes((prev) => prev.filter((recipe) => (recipe.id || recipe._id) !== id));
      setDeleteTarget(null);
      showSuccess("Recipe deleted successfully.");
    } catch (err) {
      console.error("Delete error:", err);
      showError(err?.response?.data?.message || "Failed to delete recipe.");
    }
  };

  const handlePublishToggle = async (recipe) => {
    const id = recipe.id || recipe._id;
    const nextVisibility = recipe.visibility === "public" ? "draft" : "public";

    try {
      const response = await API.put(`/recipes/${id}`, { visibility: nextVisibility });
      const updatedRecipe = response?.data?.recipe;

      setRecipes((prev) =>
        prev.map((item) => ((item.id || item._id) === id ? updatedRecipe : item))
      );
      setStatusMessage(nextVisibility === "public" ? "Recipe published." : "Recipe moved to draft.");
      setTimeout(() => setStatusMessage(""), 2400);
    } catch (err) {
      console.error("Publish toggle error:", err);
      showError(err?.response?.data?.message || "Failed to update recipe visibility.");
    }
  };

  const handleDuplicate = async (recipe) => {
    const id = recipe.id || recipe._id;

    try {
      const copyResponse = await API.post(`/recipes/${id}/copy`);
      const newRecipe = copyResponse?.data?.recipe;
      if (newRecipe) {
        setRecipes((prev) => [newRecipe, ...prev]);
      }
      showSuccess("Recipe duplicated as a new draft.");
    } catch (err) {
      console.error("Duplicate error:", err);
      showError(err?.response?.data?.message || "Failed to duplicate recipe.");
    }
  };

  const getVisibilityColor = (visibility) => (
    visibility === "public" ? accent(0.2) : "rgba(251, 191, 36, 0.2)"
  );

  const getVisibilityBorderColor = (visibility) => (
    visibility === "public" ? accent(0.5) : "rgba(251, 191, 36, 0.5)"
  );

  const getVisibilityLabel = (visibility) => (visibility === "public" ? "Public" : "Draft");

  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          minHeight: "100vh",
          width: "100%",
          ...getPageBackgroundStyle(false, 0.62),
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Poppins, sans-serif",
        }}
      >
        <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }} style={{ fontSize: "40px" }}>
          Loading your recipes...
        </motion.div>
      </div>
    );
  }

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
            <AnimatePresence>
              {statusMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  style={{
                    position: "fixed",
                    top: "90px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    zIndex: 9999,
                    minWidth: "280px",
                    padding: "14px 20px",
                    background: accent(0.2),
                    backdropFilter: "blur(12px)",
                    border: `1px solid ${accent(0.35)}`,
                    borderRadius: "12px",
                    color: "#fff",
                    textAlign: "center",
                  }}
                >
                  {statusMessage}
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div initial="hidden" animate="show" variants={fadeUp} custom={0} style={{ marginBottom: "40px" }}>
              <div style={{ fontSize: "13px", color: accent(0.9), fontWeight: "600", marginBottom: "12px" }}>
                Dashboard • My Recipes
              </div>
              <h1 style={{ fontSize: "clamp(32px, 5vw, 48px)", fontWeight: "800", color: "#fff", margin: "0 0 8px 0" }}>
                My <span style={{ color: ACCENT_HEX }}>Recipes</span>
              </h1>
              <p style={{ fontSize: "16px", color: "rgba(255,255,255,0.72)", maxWidth: "620px", margin: 0 }}>
                Manage your real recipes, update visibility, and track actual likes, views, and ratings.
              </p>
            </motion.div>

            <motion.div
              initial="hidden"
              animate="show"
              variants={fadeUp}
              custom={1}
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "16px",
                marginBottom: "32px",
              }}
            >
              {[
                { icon: <ImBooks />, label: "Total Recipes", value: totalRecipes },
                { icon: <IoEyeSharp />, label: "Total Views", value: totalViews.toLocaleString() },
                { icon: <FaHeart />, label: "Total Likes", value: totalLikes.toLocaleString() },
                { icon: <FaStar />, label: "Avg Rating", value: avgRating },
              ].map((stat) => (
                <div
                  key={stat.label}
                  style={{
                    background: "rgba(255,255,255,0.07)",
                    backdropFilter: "blur(12px)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "16px",
                    padding: "20px",
                  }}
                >
                  <div style={{ fontSize: "28px", marginBottom: "12px" }}>{stat.icon}</div>
                  <div style={{ fontSize: "24px", fontWeight: "800", marginBottom: "4px", color: "#fff" }}>{stat.value}</div>
                  <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.62)", fontWeight: "600" }}>{stat.label}</div>
                </div>
              ))}
            </motion.div>

            <motion.div
              initial="hidden"
              animate="show"
              variants={fadeUp}
              custom={2}
              style={{ display: "flex", gap: "16px", marginBottom: "32px", flexWrap: "wrap", alignItems: "center" }}
            >
              <div style={{ flex: 1, minWidth: "250px", position: "relative" }}>
                <CiSearch style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.62)", pointerEvents: "none" }} />
                <input
                  type="text"
                  placeholder="Search recipes by title or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px 16px 12px 40px",
                    background: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.15)",
                    borderRadius: "12px",
                    color: "#fff",
                    fontSize: "14px",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {[
                  { value: "all", label: "All", count: totalRecipes, icon: <SiBookstack /> },
                  { value: "public", label: "Public", count: publicCount, icon: <MdPublic /> },
                  { value: "draft", label: "Draft", count: draftCount, icon: <RiDraftFill /> },
                ].map((filter) => (
                  <button
                    key={filter.value}
                    onClick={() => setStatusFilter(filter.value)}
                    style={{
                      padding: "10px 16px",
                      background: statusFilter === filter.value ? ACCENT_HEX : "rgba(255,255,255,0.08)",
                      border: `1px solid ${statusFilter === filter.value ? ACCENT_HEX : "rgba(255,255,255,0.15)"}`,
                      borderRadius: "10px",
                      color: "#fff",
                      fontSize: "13px",
                      fontWeight: "600",
                      cursor: "pointer",
                    }}
                  >
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>{filter.icon}{filter.label} ({filter.count})</span>
                  </button>
                ))}
              </div>

              <button
                onClick={() => navigate("/add-recipe")}
                style={{
                  padding: "12px 24px",
                  background: ACCENT_HEX,
                  border: "none",
                  borderRadius: "12px",
                  color: "#fff",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                <MdAdd /> Add Recipe
              </button>
            </motion.div>

            {paginatedRecipes.length > 0 ? (
              <>
                <motion.div
                  initial="hidden"
                  animate="show"
                  variants={fadeUp}
                  custom={3}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                    gap: "24px",
                    marginBottom: "32px",
                  }}
                >
                  <AnimatePresence>
                    {paginatedRecipes.map((recipe, idx) => {
                      const id = recipe.id || recipe._id || idx;
                      return (
                        <motion.div
                          key={id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 20 }}
                          transition={{ duration: 0.3, delay: idx * 0.03 }}
                          style={{
                            background: "rgba(255,255,255,0.06)",
                            backdropFilter: "blur(16px)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: "16px",
                            overflow: "hidden",
                            display: "flex",
                            flexDirection: "column",
                          }}
                        >
                          <div style={{ position: "relative", height: "190px", overflow: "hidden" }}>
                            <img
                              src={recipe.image}
                              alt={recipe.title}
                              style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            />
                            <div
                              style={{
                                position: "absolute",
                                top: "12px",
                                right: "12px",
                                padding: "6px 12px",
                                background: getVisibilityColor(recipe.visibility),
                                border: `1px solid ${getVisibilityBorderColor(recipe.visibility)}`,
                                borderRadius: "20px",
                                fontSize: "12px",
                                fontWeight: "600",
                                color: recipe.visibility === "public" ? ACCENT_HEX : "rgba(251, 191, 36, 1)",
                              }}
                            >
                              {getVisibilityLabel(recipe.visibility)}
                            </div>
                            {recipe.featured && (
                              <div
                                style={{
                                  position: "absolute",
                                  top: "12px",
                                  left: "12px",
                                  padding: "6px 12px",
                                  background: "rgba(236, 72, 153, 0.2)",
                                  border: "1px solid rgba(236, 72, 153, 0.45)",
                                  borderRadius: "20px",
                                  fontSize: "12px",
                                  fontWeight: "600",
                                  color: "rgba(236, 72, 153, 1)",
                                }}
                              >
                                Featured
                              </div>
                            )}
                          </div>

                          <div style={{ padding: "16px", flex: 1, display: "flex", flexDirection: "column" }}>
                            <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#fff", margin: "0 0 8px 0" }}>
                              {recipe.title}
                            </h3>

                            <p
                              style={{
                                fontSize: "13px",
                                color: "rgba(255,255,255,0.7)",
                                margin: "0 0 12px 0",
                                lineHeight: "1.4",
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                              }}
                            >
                              {recipe.description || "Open this recipe to see the full details."}
                            </p>

                            <div style={{ display: "flex", gap: "12px", marginBottom: "12px", fontSize: "12px", color: "rgba(255,255,255,0.72)" }}>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><IoEyeSharp /> {recipe.views || 0}</span>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><FaHeart /> {recipe.likes || 0}</span>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><FaStar /> {Number(recipe.rating || 0).toFixed(1)}</span>
                            </div>

                            <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.55)", marginBottom: "16px" }}>
                              Updated {recipe.updatedAt ? new Date(recipe.updatedAt).toLocaleDateString() : "-"}
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "8px", marginTop: "auto" }}>
                              <button
                                onClick={() => handleView(id)}
                                style={{
                                  padding: "8px 12px",
                                  background: accent(0.16),
                                  border: `1px solid ${accent(0.4)}`,
                                  borderRadius: "8px",
                                  color: ACCENT_HEX,
                                  fontSize: "11px",
                                  fontWeight: "600",
                                  cursor: "pointer",
                                }}
                              >
                                <IoEyeSharp /> View
                              </button>
                              <button
                                onClick={() => handleEdit(id)}
                                style={{
                                  padding: "8px 12px",
                                  background: "rgba(6,182,212,0.2)",
                                  border: "1px solid rgba(6,182,212,0.45)",
                                  borderRadius: "8px",
                                  color: "rgba(6,182,212,1)",
                                  fontSize: "11px",
                                  fontWeight: "600",
                                  cursor: "pointer",
                                }}
                              >
                                <FaPen /> Edit
                              </button>
                              <button
                                onClick={() => handlePublishToggle(recipe)}
                                style={{
                                  padding: "8px 12px",
                                  background: recipe.visibility === "public" ? "rgba(251,191,36,0.2)" : "rgba(255,255,255,0.08)",
                                  border: recipe.visibility === "public"
                                    ? "1px solid rgba(251,191,36,0.45)"
                                    : "1px solid rgba(255,255,255,0.16)",
                                  borderRadius: "8px",
                                  color: recipe.visibility === "public" ? "rgba(251,191,36,1)" : "rgba(255,255,255,0.8)",
                                  fontSize: "11px",
                                  fontWeight: "600",
                                  cursor: "pointer",
                                }}
                              >
                                {recipe.visibility === "public" ? <RiDraftFill /> : <MdPublic />}
                                {recipe.visibility === "public" ? "Draft" : "Publish"}
                              </button>
                              <button
                                onClick={() => handleDuplicate(recipe)}
                                style={{
                                  padding: "8px 12px",
                                  background: "rgba(168,85,247,0.2)",
                                  border: "1px solid rgba(168,85,247,0.45)",
                                  borderRadius: "8px",
                                  color: "rgba(168,85,247,1)",
                                  fontSize: "11px",
                                  fontWeight: "600",
                                  cursor: "pointer",
                                }}
                              >
                                <MdContentCopy /> Copy
                              </button>
                              <button
                                onClick={() => handleDelete(recipe)}
                                style={{
                                  padding: "8px 12px",
                                  background: "rgba(239,68,68,0.2)",
                                  border: "1px solid rgba(239,68,68,0.45)",
                                  borderRadius: "8px",
                                  color: "rgba(239,68,68,1)",
                                  fontSize: "11px",
                                  fontWeight: "600",
                                  cursor: "pointer",
                                }}
                              >
                                <FaTrash /> Delete
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </motion.div>

                {totalPages > 1 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "12px", flexWrap: "wrap" }}
                  >
                    <button
                      onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                      disabled={currentPage === 1}
                      style={{
                        padding: "10px 20px",
                        background: currentPage === 1 ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.08)",
                        border: "1px solid rgba(255,255,255,0.15)",
                        borderRadius: "10px",
                        color: currentPage === 1 ? "rgba(255,255,255,0.3)" : "#fff",
                        cursor: currentPage === 1 ? "not-allowed" : "pointer",
                      }}
                    >
                      Previous
                    </button>

                    {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        style={{
                          width: "40px",
                          height: "40px",
                          background: currentPage === page ? ACCENT_HEX : "rgba(255,255,255,0.08)",
                          border: currentPage === page ? "none" : "1px solid rgba(255,255,255,0.15)",
                          borderRadius: "10px",
                          color: "#fff",
                          cursor: "pointer",
                        }}
                      >
                        {page}
                      </button>
                    ))}

                    <button
                      onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                      disabled={currentPage === totalPages}
                      style={{
                        padding: "10px 20px",
                        background: currentPage === totalPages ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.08)",
                        border: "1px solid rgba(255,255,255,0.15)",
                        borderRadius: "10px",
                        color: currentPage === totalPages ? "rgba(255,255,255,0.3)" : "#fff",
                        cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                      }}
                    >
                      Next
                    </button>
                  </motion.div>
                )}
              </>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{
                  textAlign: "center",
                  padding: "80px 20px",
                  background: "rgba(255,255,255,0.05)",
                  backdropFilter: "blur(16px)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "20px",
                }}
              >
                <div style={{ fontSize: "64px", marginBottom: "20px", opacity: 0.7 }}>
                  <TfiWrite />
                </div>
                <h2 style={{ fontSize: "24px", fontWeight: "700", color: "#fff", marginBottom: "12px" }}>
                  {searchQuery ? "No recipes found" : recipes.length === 0 ? "No recipes yet" : "No matching recipes"}
                </h2>
                <p style={{ fontSize: "15px", color: "rgba(255,255,255,0.7)", maxWidth: "420px", margin: "0 auto 24px" }}>
                  {searchQuery
                    ? `Try adjusting your search query "${searchQuery}".`
                    : "Start creating recipes and they will appear here with live metrics."}
                </p>
                <button
                  onClick={() => navigate("/add-recipe")}
                  style={{
                    padding: "14px 32px",
                    background: ACCENT_HEX,
                    border: "none",
                    borderRadius: "12px",
                    color: "#fff",
                    fontSize: "15px",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                >
                  <MdAdd /> Create Your First Recipe
                </button>
              </motion.div>
            )}
          </div>
        </div>

        <Footer />
      </div>
      <DeleteConfirmModal
        open={Boolean(deleteTarget)}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
};

export default MyRecipes;









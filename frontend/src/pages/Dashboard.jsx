import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "../components/Sidebar";
import NavbarHome from "../components/NavbarHome";
import Footer from "../components/Footer";
import { FaHeart, FaStar, FaFire, FaPen, FaTrash, FaThumbsUp, FaComment, FaUserCircle } from "react-icons/fa";
import { IoEyeSharp } from "react-icons/io5";
import { IoMdShareAlt } from "react-icons/io";
import { CiSaveDown2, CiSearch } from "react-icons/ci";
import { ImBooks } from "react-icons/im";
import { RiDraftFill } from "react-icons/ri";
import { GiSpellBook } from "react-icons/gi";
import { MdAdd, MdContentCopy, MdPublic } from "react-icons/md";
import API, { getDashboard } from "../services/api";
import { ACCENT_HEX, accent, getPageBackgroundStyle } from "../utils/theme";
import { formatTimeAgo } from "../utils/formatTimeAgo";
import DeleteConfirmModal from "../components/DeleteConfirmModal";

const pageIn = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.08 } },
};

const slideUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] } },
};

const StatCard = ({ icon, num, label, trend }) => (
  <motion.div
    variants={slideUp}
    whileHover={{ y: -4 }}
    style={{
      background: "rgba(255,255,255,0.07)",
      backdropFilter: "blur(14px)",
      WebkitBackdropFilter: "blur(14px)",
      border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: "18px",
      padding: "22px",
    }}
  >
    <div style={{ fontSize: "30px", marginBottom: "12px" }}>{icon}</div>
    <div style={{ fontSize: "28px", fontWeight: "800", color: "#fff", marginBottom: "6px" }}>{num}</div>
    <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.68)", fontWeight: "600" }}>{label}</div>
    {trend ? <div style={{ fontSize: "11px", color: ACCENT_HEX, fontWeight: "700", marginTop: "8px" }}>{trend}</div> : null}
  </motion.div>
);

const ActionCard = ({ num, icon, title, desc, to, btnLabel }) => (
  <motion.div
    variants={slideUp}
    whileHover={{ y: -6 }}
    style={{
      background: "rgba(255,255,255,0.07)",
      backdropFilter: "blur(14px)",
      WebkitBackdropFilter: "blur(14px)",
      border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: "18px",
      padding: "24px",
      display: "flex",
      flexDirection: "column",
      gap: "14px",
    }}
  >
    <span style={{ fontSize: "40px", fontWeight: "900", color: "rgba(255,255,255,0.18)" }}>{num}</span>
    <div style={{ fontSize: "38px" }}>{icon}</div>
    <h3 style={{ fontSize: "20px", margin: 0, color: "#fff" }}>{title}</h3>
    <p style={{ fontSize: "14px", lineHeight: "1.55", color: "rgba(255,255,255,0.72)", margin: 0 }}>{desc}</p>
    <Link
      to={to}
      style={{
        alignSelf: "flex-start",
        textDecoration: "none",
        background: ACCENT_HEX,
        color: "#fff",
        padding: "12px 18px",
        borderRadius: "10px",
        fontSize: "13px",
        fontWeight: "700",
      }}
    >
      {btnLabel}
    </Link>
  </motion.div>
);

const TopRecipeCard = ({ recipe, rank, metric }) => (
  <motion.div
    whileHover={{ y: -4, scale: 1.01 }}
    style={{
      background: "rgba(255,255,255,0.06)",
      backdropFilter: "blur(12px)",
      border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: "16px",
      overflow: "hidden",
    }}
  >
    <div style={{ position: "relative" }}>
      <img src={recipe.image} alt={recipe.title} style={{ width: "100%", height: "150px", objectFit: "cover" }} />
      <span
        style={{
          position: "absolute",
          top: "12px",
          left: "12px",
          background: "rgba(0,0,0,0.72)",
          color: "#fff",
          padding: "4px 10px",
          borderRadius: "16px",
          fontSize: "12px",
          fontWeight: "700",
        }}
      >
        #{rank}
      </span>
    </div>
    <div style={{ padding: "16px" }}>
      <h4 style={{ margin: "0 0 8px 0", fontSize: "16px", color: "#fff" }}>{recipe.title}</h4>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "rgba(255,255,255,0.72)" }}>
        <span style={{ display: 'flex', alignItems: 'center' }}>{metric === "views" ? <IoEyeSharp /> : <FaHeart />}</span>
        <span style={{ fontWeight: "700", color: ACCENT_HEX }}>
          {metric === "views" ? recipe.views || 0 : recipe.likes || 0}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>• <FaStar /> {Number(recipe.rating || 0).toFixed(1)}</span>
      </div>
    </div>
  </motion.div>
);

const activityIconMap = {
  CREATE_RECIPE: <MdAdd />,
  EDIT_RECIPE: <FaPen />,
  DELETE_RECIPE: <FaTrash />,
  PUBLISH_RECIPE: <MdPublic />,
  DRAFT_RECIPE: <RiDraftFill />,
  SAVE_RECIPE: <CiSaveDown2 />,
  LIKE_RECIPE: <FaThumbsUp />,
  RATE_RECIPE: <FaStar />,
  REVIEW_RECIPE: <FaComment />,
  UPDATE_PROFILE: <FaUserCircle />,
  SHARE_RECIPE: <IoMdShareAlt />,
};

function Dashboard() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [topMetric, setTopMetric] = useState("views");
  const [myRecipes, setMyRecipes] = useState([]);
  const [savedRecipes, setSavedRecipes] = useState([]);
  const [activityFeed, setActivityFeed] = useState([]);
  const [stats, setStats] = useState({
    totalRecipes: 0,
    totalLikes: 0,
    totalViews: 0,
    avgRating: 0,
    mostViewedRecipe: null,
    mostLikedRecipe: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const [topRecipesByViews, setTopRecipesByViews] = useState([]);
  const [topRecipesByLikes, setTopRecipesByLikes] = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [width, setWidth] = useState(window.innerWidth);
  const recipesPerPage = 6;

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;
  const isCompact = isMobile || isTablet;

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (!userStr) return;
    try {
      const parsed = JSON.parse(userStr);
      if (parsed?.name) setUserName(parsed.name);
    } catch (error) {
      console.error("Dashboard user parse error:", error);
    }
  }, []);

  const loadDashboard = async () => {
    try {
      setIsLoading(true);
      const dashboard = await getDashboard({ limit: 20 });

      setStats({
        totalRecipes: dashboard?.stats?.totalRecipes || 0,
        totalLikes: dashboard?.stats?.totalLikes || 0,
        totalViews: dashboard?.stats?.totalViews || 0,
        avgRating: dashboard?.stats?.avgRating || 0,
        mostViewedRecipe: dashboard?.performanceHighlights?.mostViewed || null,
        mostLikedRecipe: dashboard?.performanceHighlights?.mostLiked || null,
      });
      setMyRecipes(dashboard?.myRecipes || []);
      setSavedRecipes(dashboard?.savedRecipes || []);
      setActivityFeed(dashboard?.recentActivities || []);
      setTopRecipesByViews(dashboard?.topRecipes?.byViews || []);
      setTopRecipesByLikes(dashboard?.topRecipes?.byLikes || []);
      if (dashboard?.user?.name) setUserName(dashboard.user.name);
    } catch (error) {
      console.error("Dashboard fetch error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const filteredRecipes = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return myRecipes;
    return myRecipes.filter((recipe) =>
      [recipe.title, recipe.description, ...(recipe.category || [])]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [myRecipes, searchQuery]);

  const totalPages = Math.ceil(filteredRecipes.length / recipesPerPage);
  const paginatedRecipes = filteredRecipes.slice(
    (currentPage - 1) * recipesPerPage,
    currentPage * recipesPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const topRecipes = useMemo(() => {
    return topMetric === "views" ? topRecipesByViews : topRecipesByLikes;
  }, [topMetric, topRecipesByViews, topRecipesByLikes]);

  const handleDelete = (recipe) => {
    setDeleteTarget(recipe);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const id = deleteTarget.id || deleteTarget._id;
    try {
      await API.delete(`/recipes/${id}`);
      setMyRecipes((prev) => prev.filter((recipe) => (recipe.id || recipe._id) !== id));
      setSavedRecipes((prev) => prev.filter((recipe) => (recipe.id || recipe._id) !== id));
      setDeleteTarget(null);
      await loadDashboard();
    } catch (error) {
      console.error("Dashboard delete error:", error);
    }
  };


  const handlePublishToggle = async (recipe) => {
    const id = recipe.id || recipe._id;
    const nextVisibility = recipe.visibility === "public" ? "draft" : "public";
    try {
      const response = await API.put(`/recipes/${id}`, { visibility: nextVisibility });
      const updatedRecipe = response?.data?.recipe || response?.data?.data;
      setMyRecipes((prev) => prev.map((item) => ((item.id || item._id) === id ? updatedRecipe : item)));
    } catch (error) {
      console.error("Dashboard visibility update error:", error);
    }
  };

  const handleDuplicate = async (recipe) => {
    const id = recipe.id || recipe._id;
    try {
      const createResponse = await API.post(`/recipes/${id}/copy`);
      const newRecipe = createResponse?.data?.recipe || createResponse?.data?.data;
      if (newRecipe) setMyRecipes((prev) => [newRecipe, ...prev]);
    } catch (error) {
      console.error("Dashboard duplicate error:", error);
    }
  };
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
        <div style={{ fontSize: "42px", color: "#fff" }}>Loading dashboard...</div>
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
            padding: isMobile ? "20px 20px 40px" : "20px 40px 60px",
          }}
        >
          <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
            <motion.div className="dash-header" variants={pageIn} initial="hidden" animate="show" style={{ marginBottom: "40px" }}>
              <motion.div variants={slideUp}>
                <div style={{ fontSize: "12px", fontWeight: "700", color: ACCENT_HEX, letterSpacing: "2px", marginBottom: "12px", textTransform: "uppercase" }}>
                  Recipe.IO Dashboard
                </div>
                <h1 style={{ fontSize: isMobile ? "38px" : "52px", fontWeight: "800", color: "#fff", margin: "0 0 16px 0", lineHeight: 1.1 }}>
                  {userName ? `${userName}'s Command Center` : "Command Center"}
                </h1>
                <p style={{ fontSize: "16px", color: "rgba(255,255,255,0.74)", margin: 0 }}>
                  Welcome back, {userName}. Your live recipe data is ready.
                </p>
              </motion.div>
            </motion.div>

            <motion.div variants={pageIn} initial="hidden" animate="show" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "20px", marginBottom: "36px" }}>
              <StatCard icon={<ImBooks />} num={stats.totalRecipes} label="Total Recipes" trend={`${myRecipes.filter((recipe) => recipe.visibility === "public").length} public`} />
              <StatCard icon={<FaHeart />} num={stats.totalLikes} label="Total Likes" trend={`${savedRecipes.length} recipes saved`} />
              <StatCard icon={<IoEyeSharp />} num={stats.totalViews.toLocaleString()} label="Total Views" trend={`${topRecipes[0]?.views || 0} top views`} />
              <StatCard icon={<FaStar />} num={Number(stats.avgRating || 0).toFixed(1)} label="Avg Rating" trend={`${activityFeed.length} recent activities`} />
            </motion.div>

            <motion.div variants={pageIn} initial="hidden" animate="show" style={{ marginBottom: "36px" }}>
              <h2 style={{ fontSize: "28px", fontWeight: "800", color: "#fff", marginBottom: "20px" }}>Performance Highlights</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
                {[
                  {
                    title: "Most Viewed Recipe",
                    emoji: <FaFire />,
                    recipe: stats.mostViewedRecipe,
                    metric: `${stats.mostViewedRecipe?.views || 0} views`,
                  },
                  {
                    title: "Most Liked Recipe",
                    emoji: <FaHeart />,
                    recipe: stats.mostLikedRecipe,
                    metric: `${stats.mostLikedRecipe?.likes || 0} likes`,
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    style={{
                      background: "rgba(255,255,255,0.07)",
                      backdropFilter: "blur(16px)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "20px",
                      padding: "24px",
                    }}
                  >
                    <h3 style={{ margin: "0 0 16px 0", fontSize: "16px", color: "rgba(255,255,255,0.72)", fontWeight: "600" }}>
                      {item.emoji} {item.title}
                    </h3>
                    {item.recipe ? (
                      <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                        <img src={item.recipe.image} alt={item.recipe.title} style={{ width: "80px", height: "80px", borderRadius: "12px", objectFit: "cover" }} />
                        <div>
                          <h4 style={{ margin: "0 0 8px 0", fontSize: "18px", fontWeight: "700", color: "#fff" }}>{item.recipe.title}</h4>
                          <span style={{ fontSize: "14px", color: ACCENT_HEX, fontWeight: "600" }}>{item.metric}</span>
                        </div>
                      </div>
                    ) : (
                      <p style={{ margin: 0, color: "rgba(255,255,255,0.72)" }}>No recipe data yet.</p>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div variants={pageIn} initial="hidden" animate="show" style={{ marginBottom: "36px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", flexWrap: "wrap", marginBottom: "20px" }}>
                <h2 style={{ fontSize: "28px", fontWeight: "800", color: "#fff", margin: 0 }}>Top Recipes</h2>
                <div style={{ display: "flex", gap: "8px" }}>
                  {[
                    { key: "views", label: "Sort by Views" },
                    { key: "likes", label: "Sort by Likes" },
                  ].map((item) => (
                    <button
                      key={item.key}
                      onClick={() => setTopMetric(item.key)}
                      style={{
                        padding: "10px 16px",
                        borderRadius: "10px",
                        border: `1px solid ${topMetric === item.key ? ACCENT_HEX : "rgba(255,255,255,0.15)"}`,
                        background: topMetric === item.key ? ACCENT_HEX : "rgba(255,255,255,0.08)",
                        color: "#fff",
                        cursor: "pointer",
                        fontWeight: "600",
                        fontSize: "13px",
                      }}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "20px" }}>
                {topRecipes.length > 0 ? (
                  topRecipes.map((recipe, idx) => (
                    <TopRecipeCard key={recipe.id || recipe._id || idx} recipe={recipe} rank={idx + 1} metric={topMetric} />
                  ))
                ) : (
                  <div style={{ gridColumn: "1 / -1", color: "rgba(255,255,255,0.72)", padding: "24px", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "16px", background: "rgba(255,255,255,0.06)" }}>
                    No {topMetric === "views" ? "Views" : "Likes"} Data Yet.
                  </div>
                )}
              </div>
            </motion.div>

            <motion.div variants={pageIn} initial="hidden" animate="show" style={{ marginBottom: "36px" }}>
              <div style={{ fontSize: "14px", fontWeight: "700", color: ACCENT_HEX, letterSpacing: "2px", marginBottom: "24px", textTransform: "uppercase" }}>
                Quick Actions
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "24px" }}>
                <ActionCard num="01" icon={<MdAdd />} title="Create Recipe" desc="Add a new recipe and publish it to the community." to="/add-recipe" btnLabel="Start Creating" />
                <ActionCard num="02" icon={<GiSpellBook />} title="My Recipes" desc="Manage your existing recipes and keep them up to date." to="/my-recipes" btnLabel="View Recipes" />
                <ActionCard num="03" icon={<FaUserCircle />} title="Profile" desc="Update your profile, bio, and account preferences." to="/profile" btnLabel="Go to Profile" />
              </div>
            </motion.div>

            <motion.div variants={pageIn} initial="hidden" animate="show" style={{ marginBottom: "36px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", gap: "16px", flexWrap: "wrap" }}>
                <h2 style={{ fontSize: "28px", fontWeight: "800", color: "#fff", margin: 0 }}>My Recipes</h2>
                <div style={{ position: "relative", width: isMobile ? "100%" : "300px" }}>
                  <CiSearch style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.62)", pointerEvents: "none" }} />
                  <input
                    type="text"
                    placeholder="Search recipes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "12px 16px 12px 40px",
                      background: "rgba(255,255,255,0.08)",
                      border: "1px solid rgba(255,255,255,0.15)",
                      borderRadius: "12px",
                      color: "#fff",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px", marginBottom: "24px" }}>
                <AnimatePresence>
                  {paginatedRecipes.map((recipe, idx) => (
                    <motion.div
                      key={recipe.id || recipe._id || idx}
                      whileHover={{ y: -4 }}
                      style={{
                        background: "rgba(255,255,255,0.06)",
                        backdropFilter: "blur(12px)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "16px",
                        overflow: "hidden",
                      }}
                    >
                      <img src={recipe.image} alt={recipe.title} style={{ width: "100%", height: "160px", objectFit: "cover" }} />
                      <div style={{ padding: "16px" }}>
                        <h4 style={{ margin: "0 0 12px 0", fontSize: "16px", color: "#fff" }}>{recipe.title}</h4>
                        <div style={{ display: "flex", gap: "14px", marginBottom: "14px", fontSize: "13px", color: "rgba(255,255,255,0.72)" }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><FaHeart /> {recipe.likes || 0}</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><IoEyeSharp /> {recipe.views || 0}</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><FaStar /> {Number(recipe.rating || 0).toFixed(1)}</span>
                        </div>
                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                          <button onClick={() => navigate(`/recipes/${recipe.id || recipe._id}`)} style={{ background: ACCENT_HEX, border: "none", color: "#fff", borderRadius: "8px", padding: "8px 12px", cursor: "pointer", fontWeight: "600", display: "inline-flex", alignItems: "center", gap: "6px" }}><IoEyeSharp /> View</button>
                          <button onClick={() => navigate(`/edit-recipe/${recipe.id || recipe._id}`)} style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.18)", color: "#fff", borderRadius: "8px", padding: "8px 12px", cursor: "pointer", fontWeight: "600", display: "inline-flex", alignItems: "center", gap: "6px" }}><FaPen /> Edit</button>
                          <button onClick={() => handlePublishToggle(recipe)} style={{ background: recipe.visibility === "public" ? "rgba(251,191,36,0.2)" : "rgba(255,255,255,0.08)", border: recipe.visibility === "public" ? "1px solid rgba(251,191,36,0.45)" : "1px solid rgba(255,255,255,0.16)", color: recipe.visibility === "public" ? "rgba(251,191,36,1)" : "rgba(255,255,255,0.8)", borderRadius: "8px", padding: "8px 12px", cursor: "pointer", fontWeight: "600", display: "inline-flex", alignItems: "center", gap: "6px" }}>{recipe.visibility === "public" ? <RiDraftFill /> : <MdPublic />}{recipe.visibility === "public" ? "Draft" : "Publish"}</button>
                          <button onClick={() => handleDuplicate(recipe)} style={{ background: "rgba(168,85,247,0.2)", border: "1px solid rgba(168,85,247,0.45)", color: "rgba(168,85,247,1)", borderRadius: "8px", padding: "8px 12px", cursor: "pointer", fontWeight: "600", display: "inline-flex", alignItems: "center", gap: "6px" }}><MdContentCopy /> Copy</button>
                          <button onClick={() => handleDelete(recipe)} style={{ background: "rgba(239,68,68,0.2)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444", borderRadius: "8px", padding: "8px 12px", cursor: "pointer", fontWeight: "600", display: "inline-flex", alignItems: "center", gap: "6px" }}><FaTrash /> Delete</button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {totalPages > 1 && (
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                  <button onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={currentPage === 1} style={{ padding: "10px 18px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.08)", color: "#fff", cursor: "pointer" }}>Previous</button>
                  {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((page) => (
                    <button key={page} onClick={() => setCurrentPage(page)} style={{ width: "40px", height: "40px", borderRadius: "10px", border: "none", background: currentPage === page ? ACCENT_HEX : "rgba(255,255,255,0.08)", color: "#fff", cursor: "pointer" }}>{page}</button>
                  ))}
                  <button onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))} disabled={currentPage === totalPages} style={{ padding: "10px 18px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.08)", color: "#fff", cursor: "pointer" }}>Next</button>
                </div>
              )}
            </motion.div>

            <motion.div variants={pageIn} initial="hidden" animate="show" style={{ marginBottom: "36px" }}>
              <h2 style={{ fontSize: "28px", fontWeight: "800", color: "#fff", marginBottom: "20px" }}>Saved Recipes</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "20px" }}>
                {savedRecipes.slice(0, 10).map((recipe, idx) => (
                  <motion.div key={recipe.id || recipe._id || idx} whileHover={{ y: -4 }} onClick={() => navigate(`/recipes/${recipe.id || recipe._id}`)} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "16px", overflow: "hidden", cursor: "pointer" }}>
                    <img src={recipe.image} alt={recipe.title} style={{ width: "100%", height: "140px", objectFit: "cover" }} />
                    <div style={{ padding: "16px" }}>
                      <h4 style={{ margin: "0 0 8px 0", fontSize: "15px", color: "#fff" }}>{recipe.title}</h4>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "rgba(255,255,255,0.7)" }}>
                        <span>by {recipe.createdBy?.name || "Unknown"}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: ACCENT_HEX, fontWeight: "700" }}><FaHeart /> {recipe.likes || 0}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div variants={pageIn} initial="hidden" animate="show">
              <h2 style={{ fontSize: "28px", fontWeight: "800", color: "#fff", marginBottom: "20px" }}>Recent Activity</h2>
              <div style={{ background: "rgba(255,255,255,0.05)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "20px", padding: "24px" }}>
                {activityFeed.length > 0 ? (
                  activityFeed.map((activity, idx) => (
                    <div key={activity.id || activity._id || idx} style={{ display: "flex", gap: "16px", padding: "14px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                      <div style={{ fontSize: "24px", width: "40px", height: "40px", display: "flex", alignItems: "center", justifyContent: "center", background: accent(0.16), borderRadius: "10px" }}>
                        {activityIconMap[activity.type] || <ImBooks />}
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: "0 0 4px 0", fontSize: "14px", color: "#fff", fontWeight: "500" }}>{activity.message}</p>
                        <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.55)" }}>{formatTimeAgo(activity.createdAt)}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p style={{ margin: 0, color: "rgba(255,255,255,0.72)" }}>No activity yet.</p>
                )}
              </div>
            </motion.div>
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
}

export default Dashboard;




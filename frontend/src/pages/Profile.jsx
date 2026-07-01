import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getProfile } from "../services/api";
import API from "../services/api";
import Sidebar from "../components/Sidebar";
import NavbarHome from "../components/NavbarHome";
import Footer from "../components/Footer";
import DefaultAvatar from "../components/common/DefaultAvatar";
import RecipeCardGrid from "../components/RecipeCardGrid";
import { ACCENT_HEX, accent, getPageBackgroundStyle } from "../utils/theme";
import { FaPen } from "react-icons/fa";
import { IoLogOutOutline } from "react-icons/io5";
import { GiSpellBook } from "react-icons/gi";
import { MdCalendarToday, MdDashboard, MdLock } from "react-icons/md";

const Profile = () => {
  const navigate = useNavigate();
  const { userId: profileUsername } = useParams();
  const [width, setWidth] = useState(window.innerWidth);
  const [user, setUser] = useState(null);
  const [recipes, setRecipes] = useState([]);
  const [stats, setStats] = useState({
    totalRecipes: 0,
    totalLikes: 0,
    totalViews: 0,
    avgRating: 0,
  });
  const [dataLoading, setDataLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isPublicProfile = Boolean(profileUsername);

  useEffect(() => {
    const handle = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handle);
    return () => window.removeEventListener("resize", handle);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setDataLoading(true);

        if (isPublicProfile) {
          const response = await API.get(`/users/profile/${profileUsername}`);
          const payload = response?.data?.data || response?.data || {};
          setUser(payload.user);
          setStats({
            totalRecipes: payload.stats?.totalRecipes || payload.stats?.recipesCount || 0,
            sharedRecipes: payload.stats?.sharedRecipes || payload.stats?.sharedRecipesCount || 0,
            totalLikes: payload.stats?.totalLikes || 0,
            totalViews: payload.stats?.totalViews || 0,
            avgRating: payload.stats?.avgRating ?? null,
            latestRecipe: payload.stats?.latestRecipe || "",
          });
          setRecipes(payload.recipes || []);
        } else {
          const response = await getProfile();
          const payload = response?.data || response;

          setUser(payload.user);
          setStats({
            totalRecipes: payload.stats?.totalRecipes || payload.stats?.recipesCount || 0,
            sharedRecipes: payload.stats?.sharedRecipes || payload.stats?.sharedRecipesCount || 0,
            totalLikes: payload.stats?.totalLikes || 0,
            totalViews: payload.stats?.totalViews || 0,
            avgRating: payload.stats?.avgRating ?? null,
            latestRecipe: payload.stats?.latestRecipe || "",
          });
          setRecipes(payload.recipes || []);
        }
      } catch (err) {
        console.error("Profile fetch error:", err);
      } finally {
        setDataLoading(false);
      }
    };

    fetchData();
  }, [isPublicProfile, profileUsername]);

  const isMobile = width < 640;
  const isTablet = width >= 640 && width < 1024;
  const isCompact = isMobile || isTablet;

  const styles = {
    page: {
      margin: 0,
      padding: 0,
      width: "100%",
      minHeight: "100vh",
      ...getPageBackgroundStyle(isMobile, 0.58),
      color: "#fff",
      fontFamily: "Poppins, sans-serif",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      paddingTop: isMobile ? "32px" : "56px",
      paddingLeft: isMobile ? "12px" : "24px",
      paddingRight: isMobile ? "12px" : "24px",
    },
    container: {
      width: "85vw",
      maxWidth: "1150px",
      background: "rgba(255, 255, 255, 0.06)",
      backdropFilter: "blur(25px) saturate(180%)",
      WebkitBackdropFilter: "blur(25px) saturate(180%)",
      borderRadius: "32px",
      border: "1px solid rgba(255, 255, 255, 0.12)",
      padding: isMobile ? "22px 16px" : isTablet ? "32px 24px" : "40px 36px",
      boxShadow: "0 25px 50px rgba(0,0,0,0.35)",
      position: "relative",
      overflow: "hidden",
    },
    topSection: {
      display: "flex",
      flexDirection: isCompact ? "column" : "row",
      alignItems: isCompact ? "center" : "center",
      justifyContent: "space-between",
      gap: isMobile ? "20px" : "28px",
      marginBottom: "24px",
    },
    profileIntro: {
      display: "flex",
      flexDirection: isMobile ? "column" : "row",
      alignItems: "center",
      gap: isMobile ? "18px" : "24px",
      flex: 1,
      minWidth: 0,
      width: "100%",
    },
    profileText: {
      display: "flex",
      flexDirection: "column",
      alignItems: isMobile ? "center" : "flex-start",
      textAlign: isMobile ? "center" : "left",
      minWidth: 0,
    },
    avatarWrapper: {
      width: isMobile ? "124px" : isTablet ? "148px" : "172px",
      height: isMobile ? "124px" : isTablet ? "148px" : "172px",
      borderRadius: isMobile ? "32px" : "38px",
      margin: 0,
      padding: "5px",
      background: `linear-gradient(135deg, ${ACCENT_HEX}, rgba(255, 255, 255, 0.25))`,
      boxShadow: `0 0 20px ${accent(0.35)}`,
      position: "relative",
      flexShrink: 0,
    },
    avatar: {
      width: "100%",
      height: "100%",
      borderRadius: isMobile ? "28px" : "34px",
      objectFit: "cover",
      border: "3px solid rgba(18, 15, 10, 0.85)",
    },
    avatarInitial: {
      width: "100%",
      height: "100%",
      borderRadius: isMobile ? "28px" : "34px",
      background: `linear-gradient(135deg, ${ACCENT_HEX}, #c9972d)`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: isMobile ? "34px" : "40px",
      fontWeight: "700",
      color: "#fff",
      border: "3px solid rgba(18, 15, 10, 0.85)",
    },
    name: {
      fontSize: isMobile ? "24px" : "30px",
      fontWeight: "700",
      margin: "0 0 6px 0",
    },
    email: {
      fontSize: "15px",
      opacity: 0.75,
      marginBottom: "10px",
      wordBreak: "break-word",
    },
    bioSection: {
      marginBottom: "24px",
      padding: "14px 18px",
      background: "rgba(255, 255, 255, 0.08)",
      borderRadius: "14px",
      border: "1px solid rgba(255,255,255,0.08)",
      textAlign: "left",
    },
    bioLabel: {
      fontSize: "12px",
      opacity: 0.6,
      marginBottom: "4px",
      textTransform: "uppercase",
      letterSpacing: "0.5px",
    },
    bioText: {
      fontSize: "14px",
      opacity: 0.9,
      lineHeight: "1.5",
      margin: 0,
    },
    infoSection: {
      textAlign: "left",
      display: "flex",
      flexDirection: "column",
      gap: "15px",
      marginBottom: "32px",
    },
    infoRow: {
      display: "flex",
      flexDirection: isMobile ? "column" : "row",
      justifyContent: "space-between",
      alignItems: isMobile ? "flex-start" : "center",
      gap: isMobile ? "6px" : "12px",
      padding: "16px 20px",
      background: "rgba(255, 255, 255, 0.08)",
      borderRadius: "16px",
      border: "1px solid rgba(255, 255, 255, 0.06)",
    },
    label: {
      opacity: 0.65,
      fontSize: "14px",
    },
    value: {
      fontWeight: "500",
      fontSize: "14px",
      textAlign: isMobile ? "left" : "right",
    },
    buttonGroup: {
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))",
      gap: "12px",
    },
    backBtn: {
      background: ACCENT_HEX,
      border: "none",
      padding: "14px",
      borderRadius: "100px",
      color: "#fff",
      fontWeight: "600",
      cursor: "pointer",
      transition: "all 0.3s ease",
      boxShadow: `0 8px 20px ${accent(0.25)}`,
    },
    editBtn: {
      background: "transparent",
      border: `1px solid ${accent(0.45)}`,
      padding: "14px",
      borderRadius: "100px",
      color: ACCENT_HEX,
      fontWeight: "500",
      cursor: "pointer",
      transition: "all 0.3s ease",
    },
    logoutBtn: {
      background: "transparent",
      border: "1px solid rgba(255, 255, 255, 0.15)",
      padding: "14px",
      borderRadius: "100px",
      color: "rgba(255, 255, 255, 0.72)",
      fontWeight: "500",
      cursor: "pointer",
      transition: "all 0.3s ease",
    },
    statsGrid: {
      display: "grid",
      gridTemplateColumns: isTablet
        ? "repeat(4, minmax(0, 1fr))"
        : "repeat(2, minmax(0, 1fr))",
      gap: "12px",
      width: isCompact ? "100%" : "320px",
      flexShrink: 0,
    },
    statCard: {
      background: "rgba(255, 255, 255, 0.08)",
      borderRadius: "16px",
      border: "1px solid rgba(255, 255, 255, 0.08)",
      padding: "16px 12px",
      textAlign: "center",
    },
    statValue: {
      fontSize: "24px",
      fontWeight: "700",
      color: ACCENT_HEX,
      marginBottom: "4px",
    },
    statLabel: {
      fontSize: "12px",
      opacity: 0.7,
      textTransform: "uppercase",
      letterSpacing: "0.4px",
    },
  };

  if (dataLoading) {
    return (
      <div
        style={{
          display: "flex",
          minHeight: "100vh",
          width: "100%",
          ...getPageBackgroundStyle(false, 0.64),
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Poppins, sans-serif",
        }}
      >
        <div style={{ fontSize: "28px", textAlign: "center" }}>Loading profile...</div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        width: "100%",
      }}
    >
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
        <div style={styles.page}>
          <div style={styles.container}>
            <div style={styles.topSection}>
              <div style={styles.profileIntro}>
                <div style={styles.avatarWrapper}>
                  <DefaultAvatar src={user?.profileImage} alt={user?.name || "Profile"} style={styles.avatar} />
                </div>

                <div style={styles.profileText}>
                  <h2 style={styles.name}>{user?.name || "User"}</h2>
                  <p style={styles.email}>{isPublicProfile ? `@${user?.username || "-"}` : (user?.email || "-")}</p>
                </div>
              </div>

              <div style={styles.statsGrid}>
                <div style={styles.statCard}>
                  <div style={styles.statValue}>{stats.totalRecipes}</div>
                  <div style={styles.statLabel}>Recipes</div>
                </div>
                <div style={styles.statCard}>
                  <div style={{
                    ...styles.statValue,
                    fontSize: stats.avgRating != null ? "24px" : "13px",
                    lineHeight: stats.avgRating != null ? undefined : "1.3",
                  }}>
                    {stats.avgRating != null ? Number(stats.avgRating).toFixed(1) : "No Ratings Yet"}
                  </div>
                  <div style={styles.statLabel}>Avg Rating</div>
                </div>
                <div style={styles.statCard}>
                  <div style={styles.statValue}>{stats.totalViews}</div>
                  <div style={styles.statLabel}>Total Views</div>
                </div>
                <div style={styles.statCard}>
                  <div style={styles.statValue}>{stats.totalLikes}</div>
                  <div style={styles.statLabel}>Total Likes</div>
                </div>
              </div>
            </div>

            {user?.bio && (
              <div style={styles.bioSection}>
                <p style={styles.bioLabel}>Bio</p>
                <p style={styles.bioText}>{user.bio}</p>
              </div>
            )}

            <div style={styles.infoSection}>
              <div style={styles.infoRow}>
                <span style={styles.label}>Bio</span>
                <span style={styles.value}>{user?.bio || "No bio yet"}</span>
              </div>

              <div style={styles.infoRow}>
                <span style={styles.label}><MdCalendarToday /> Member Since</span>
                <span style={styles.value}>
                  {user?.createdAt
                    ? new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })
                    : "-"}
                </span>
              </div>

              <div style={styles.infoRow}>
                <span style={styles.label}>Shared Recipes</span>
                <span style={styles.value}>
                  {(stats.sharedRecipes || 0)} Recipe{(stats.sharedRecipes || 0) !== 1 ? "s" : ""}
                </span>
              </div>

              {user?.location && (
                <div style={styles.infoRow}>
                  <span style={styles.label}>Location</span>
                  <span style={styles.value}>{user.location}</span>
                </div>
              )}

              {user?.favoriteCuisine && (
                <div style={styles.infoRow}>
                  <span style={styles.label}>Favorite Cuisine</span>
                  <span style={styles.value}>{user.favoriteCuisine}</span>
                </div>
              )}

              <div style={styles.infoRow}>
                <span style={styles.label}>Latest Recipe</span>
                <span style={styles.value}>{stats.latestRecipe || recipes[0]?.title || "No recipes yet"}</span>
              </div>
            </div>

            {!isPublicProfile && <div style={styles.buttonGroup}>
              <button
                style={styles.editBtn}
                onClick={() => navigate("/edit-profile")}
                onMouseEnter={(e) => {
                  e.target.style.background = accent(0.1);
                  e.target.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = "transparent";
                  e.target.style.transform = "translateY(0)";
                }}
              >
                <FaPen /> Edit Profile
              </button>

              <button
                style={styles.editBtn}
                onClick={() => navigate("/my-recipes")}
                onMouseEnter={(e) => {
                  e.target.style.background = accent(0.1);
                  e.target.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = "transparent";
                  e.target.style.transform = "translateY(0)";
                }}
              >
                <GiSpellBook /> View My Recipes
              </button>

              <button
                style={styles.backBtn}
                onClick={() => navigate("/dashboard")}
                onMouseEnter={(e) => {
                  e.target.style.transform = "scale(1.02)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = "scale(1)";
                }}
              >
                <MdDashboard /> Back to Dashboard
              </button>

              <button
                style={styles.editBtn}
                onClick={() => navigate("/change-password")}
                onMouseEnter={(e) => {
                  e.target.style.background = accent(0.1);
                  e.target.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = "transparent";
                  e.target.style.transform = "translateY(0)";
                }}
              >
                <MdLock /> Change Password
              </button>


            </div>}

            {isPublicProfile && (
              <div style={{ marginTop: "34px" }}>
                <h3 style={{ margin: "0 0 18px", fontSize: isMobile ? "22px" : "28px", fontWeight: 800 }}>
                  Recipes by {user?.name || "Chef"}
                </h3>
                <RecipeCardGrid recipes={recipes} />
              </div>
            )}
          </div>
        </div>

        <Footer />
      </div>
    </div>
  );
};

export default Profile;






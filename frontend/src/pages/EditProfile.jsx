import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import API, { getProfile, uploadProfileImage } from "../services/api";
import Sidebar from "../components/Sidebar";
import NavbarHome from "../components/NavbarHome";
import Footer from "../components/Footer";
import DefaultAvatar from "../components/common/DefaultAvatar";
import { ACCENT_HEX, accent, getPageBackgroundStyle } from "../utils/theme";
import { useAuth } from "../context/AuthContext";

const MAX_BIO = 200;
const MAX_FILE_SIZE = 2 * 1024 * 1024;

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, delay, ease: [0.4, 0, 0.2, 1] },
  }),
};

const EditProfile = () => {
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const { updateUser } = useAuth();

  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    bio: "",
    location: "",
    favoriteCuisine: "",
    profileImage: "",
    isPrivate: false,
  });
  const [previewImage, setPreviewImage] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [width, setWidth] = useState(window.innerWidth);
  const [hasChanges, setHasChanges] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const initialDataRef = useRef(null);

  useEffect(() => {
    const handle = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handle);
    return () => window.removeEventListener("resize", handle);
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setDataLoading(true);
        const response = await getProfile();
        const profile = response?.user || response?.data?.user || {};
        const nextFormData = {
          name: profile.name || "",
          username: profile.username || "",
          email: profile.email || "",
          bio: profile.bio || "",
          location: profile.location || "",
          favoriteCuisine: profile.favoriteCuisine || "",
          profileImage: profile.profileImage || "",
          isPrivate: profile.isPrivate || false,
        };

        setUser(profile);
        setFormData(nextFormData);
        setPreviewImage(profile.profileImage || "");
        initialDataRef.current = nextFormData;
      } catch (err) {
        console.error("Edit profile load error:", err);
        setToast({ message: "Failed to load your profile.", type: "error" });
      } finally {
        setDataLoading(false);
      }
    };

    fetchProfile();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!initialDataRef.current) return;
    const changed = JSON.stringify(formData) !== JSON.stringify(initialDataRef.current) || imageFile !== null;
    setHasChanges(changed);
  }, [formData, imageFile]);

  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;
  const isCompact = isMobile || isTablet;
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePrivacyChange = (e) => {
    setFormData((prev) => ({ ...prev, isPrivate: e.target.checked }));
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      setToast({ message: "Image too large. Max 2MB allowed.", type: "error" });
      return;
    }

    if (!file.type.startsWith("image/")) {
      setToast({ message: "Please select a valid image file.", type: "error" });
      return;
    }

      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result || "";
        setPreviewImage(result);
        setImageFile(file);
      };
      reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = () => {
    setPreviewImage("");
    setImageFile(null);
    setFormData((prev) => ({ ...prev, profileImage: "" }));
    if (fileInputRef.current) fileInputRef.current.value = "";
    setToast({ message: "Avatar removed.", type: "success" });
  };

  const handleReset = () => {
    if (!initialDataRef.current) return;
    setFormData({ ...initialDataRef.current });
    setPreviewImage(initialDataRef.current.profileImage || "");
    setImageFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setHasChanges(false);
    setToast({ message: "Form reset to original values.", type: "success" });
  };

  const handleSave = async () => {
    if (!hasChanges) {
      setToast({ message: "No changes to save.", type: "error" });
      return;
    }

    if (!formData.name.trim() || !formData.email.trim()) {
      setToast({ message: "Name and email are required.", type: "error" });
      return;
    }

    setLoading(true);
    try {
      const payload = { ...formData };

      if (imageFile) {
        const uploadResult = await uploadProfileImage(imageFile);
        payload.profileImage = uploadResult?.user?.profileImage || uploadResult?.imageUrl || payload.profileImage;
      }

      const response = await API.put("/auth/profile", payload);
      const updatedUser = response?.data?.user || payload;

      setUser(updatedUser);
      initialDataRef.current = payload;
      setHasChanges(false);
      setImageFile(null);
      // Update AuthContext state so navbars re-render immediately with correct profile image
      updateUser(updatedUser);
      setToast({ message: "Profile updated successfully!", type: "success" });

      setTimeout(() => navigate("/profile"), 1000);
    } catch (err) {
      console.error("Edit profile save error:", err);
      setToast({ message: err?.response?.data?.message || "Failed to update profile.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

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
      paddingBottom: "40px",
      paddingLeft: isMobile ? "12px" : "24px",
      paddingRight: isMobile ? "12px" : "24px",
    },
    container: {
      width: "100%",
      maxWidth: "820px",
      background: "rgba(255, 255, 255, 0.07)",
      backdropFilter: "blur(25px) saturate(180%)",
      WebkitBackdropFilter: "blur(25px) saturate(180%)",
      borderRadius: "32px",
      border: "1px solid rgba(255, 255, 255, 0.12)",
      padding: isMobile ? "24px 18px" : "32px 30px",
      boxShadow: "0 25px 50px rgba(0,0,0,0.35)",
    },
    backBtn: {
      background: "transparent",
      border: `1px solid ${accent(0.35)}`,
      padding: "8px 16px",
      borderRadius: "20px",
      color: ACCENT_HEX,
      fontSize: "13px",
      fontWeight: "600",
      cursor: "pointer",
      marginBottom: "16px",
    },
    title: {
      fontSize: isMobile ? "28px" : "34px",
      fontWeight: "700",
      margin: "0 0 8px 0",
    },
    subtitle: {
      fontSize: "14px",
      opacity: 0.72,
      margin: 0,
    },
    avatarSection: {
      display: "flex",
      flexDirection: isMobile ? "column" : "row",
      alignItems: isMobile ? "flex-start" : "center",
      gap: "20px",
      marginTop: "28px",
      marginBottom: "28px",
      paddingBottom: "24px",
      borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
    },
    avatarWrapper: {
      width: "112px",
      height: "112px",
      borderRadius: "30px",
      padding: "4px",
      background: `linear-gradient(135deg, ${ACCENT_HEX}, rgba(255, 255, 255, 0.25))`,
      boxShadow: `0 0 18px ${accent(0.35)}`,
      flexShrink: 0,
    },
    avatar: {
      width: "100%",
      height: "100%",
      borderRadius: "26px",
      objectFit: "cover",
      border: "3px solid rgba(18, 15, 10, 0.85)",
    },
    avatarInitial: {
      width: "100%",
      height: "100%",
      borderRadius: "26px",
      background: `linear-gradient(135deg, ${ACCENT_HEX}, #c9972d)`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "34px",
      fontWeight: "700",
      color: "#fff",
      border: "3px solid rgba(18, 15, 10, 0.85)",
    },
    avatarName: {
      fontSize: "18px",
      fontWeight: "700",
      margin: "0 0 4px 0",
    },
    avatarEmail: {
      fontSize: "13px",
      opacity: 0.7,
      margin: "0 0 12px 0",
    },
    avatarActions: {
      display: "flex",
      gap: "10px",
      flexWrap: "wrap",
    },
    avatarActionBtn: {
      padding: "8px 14px",
      background: accent(0.14),
      border: `1px solid ${accent(0.35)}`,
      borderRadius: "20px",
      color: ACCENT_HEX,
      fontSize: "12px",
      fontWeight: "600",
      cursor: "pointer",
    },
    avatarRemoveBtn: {
      padding: "8px 14px",
      background: "rgba(239, 68, 68, 0.1)",
      border: "1px solid rgba(239, 68, 68, 0.3)",
      borderRadius: "20px",
      color: "#ef4444",
      fontSize: "12px",
      fontWeight: "600",
      cursor: "pointer",
    },
    grid: {
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))",
      gap: "16px",
    },
    field: {
      display: "flex",
      flexDirection: "column",
      gap: "8px",
    },
    fullWidth: {
      gridColumn: isMobile ? "auto" : "1 / -1",
    },
    label: {
      fontSize: "13px",
      opacity: 0.76,
    },
    input: {
      width: "100%",
      boxSizing: "border-box",
      background: "rgba(255,255,255,0.08)",
      border: "1px solid rgba(255,255,255,0.14)",
      borderRadius: "14px",
      padding: "13px 14px",
      color: "#fff",
      fontSize: "14px",
      outline: "none",
    },
    textarea: {
      minHeight: "120px",
      resize: "vertical",
      lineHeight: "1.5",
    },
    privacyRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: "12px",
      marginTop: "8px",
      padding: "16px",
      borderRadius: "16px",
      background: "rgba(255,255,255,0.05)",
      border: "1px solid rgba(255,255,255,0.08)",
    },
    actions: {
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "repeat(3, minmax(0, 1fr))",
      gap: "12px",
      marginTop: "24px",
    },
    primaryBtn: {
      background: ACCENT_HEX,
      border: "none",
      borderRadius: "999px",
      color: "#fff",
      padding: "14px 18px",
      fontSize: "14px",
      fontWeight: "600",
      cursor: "pointer",
      boxShadow: `0 8px 18px ${accent(0.24)}`,
    },
    secondaryBtn: {
      background: "transparent",
      border: "1px solid rgba(255,255,255,0.18)",
      borderRadius: "999px",
      color: "#fff",
      padding: "14px 18px",
      fontSize: "14px",
      fontWeight: "600",
      cursor: "pointer",
    },
  };

  if (dataLoading) {
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
        <div style={{ fontSize: "42px", textAlign: "center" }}>Loading profile editor...</div>
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
        <div style={styles.page}>
          <motion.div style={styles.container} initial="hidden" animate="show" variants={fadeUp} custom={0}>
            <button style={styles.backBtn} onClick={() => navigate("/profile")}>
              Back to Profile
            </button>

            <h1 style={styles.title}>Edit Profile</h1>
            <p style={styles.subtitle}>
              {hasChanges ? "You have unsaved changes." : "Update your account details and profile info."}
            </p>

            <div style={styles.avatarSection}>
              <div style={styles.avatarWrapper}>
                <DefaultAvatar src={previewImage} alt="Profile" style={styles.avatar} />
              </div>

              <div style={{ flex: 1 }}>
                <p style={styles.avatarName}>{formData.name || user?.name || "User"}</p>
                <p style={styles.avatarEmail}>{formData.email || user?.email || "-"}</p>
                <div style={styles.avatarActions}>
                  <button style={styles.avatarActionBtn} onClick={() => fileInputRef.current?.click()}>
                    {previewImage ? "Replace Photo" : "Upload Photo"}
                  </button>
                  <button style={styles.avatarRemoveBtn} onClick={handleRemoveAvatar}>
                    Remove
                  </button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  style={{ display: "none" }}
                />
              </div>
            </div>

            <div style={styles.grid}>
              <div style={styles.field}>
                <label style={styles.label}>Name</label>
                <input name="name" value={formData.name} onChange={handleInputChange} style={styles.input} />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Username</label>
                <input name="username" value={formData.username} onChange={handleInputChange} style={styles.input} />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Email</label>
                <input name="email" type="email" value={formData.email} onChange={handleInputChange} style={styles.input} />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Favorite Cuisine</label>
                <input
                  name="favoriteCuisine"
                  value={formData.favoriteCuisine}
                  onChange={handleInputChange}
                  style={styles.input}
                />
              </div>

              <div style={{ ...styles.field, ...styles.fullWidth }}>
                <label style={styles.label}>Location</label>
                <input name="location" value={formData.location} onChange={handleInputChange} style={styles.input} />
              </div>

              <div style={{ ...styles.field, ...styles.fullWidth }}>
                <label style={styles.label}>Bio</label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  maxLength={MAX_BIO}
                  style={{ ...styles.input, ...styles.textarea }}
                />
                <span style={{ fontSize: "12px", opacity: 0.55 }}>
                  {formData.bio.length}/{MAX_BIO}
                </span>
              </div>
            </div>

            <div style={styles.privacyRow}>
              <div>
                <div style={{ fontWeight: "600", marginBottom: "4px" }}>Private Profile</div>
                <div style={{ fontSize: "13px", opacity: 0.68 }}>
                  Control whether your profile is visible to other users.
                </div>
              </div>
              <input type="checkbox" checked={formData.isPrivate} onChange={handlePrivacyChange} />
            </div>

            <div style={styles.actions}>
              <button style={styles.primaryBtn} onClick={handleSave} disabled={loading}>
                {loading ? "Saving..." : "Save Changes"}
              </button>
              <button style={styles.secondaryBtn} onClick={handleReset} disabled={loading}>
                Reset
              </button>
              <button style={styles.secondaryBtn} onClick={() => navigate("/profile")} disabled={loading}>
                Cancel
              </button>
            </div>
          </motion.div>
        </div>

        <Footer />
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            style={{
              position: "fixed",
              top: "90px",
              left: "50%",
              transform: "translateX(-50%)",
              background: toast.type === "error" ? "rgba(239, 68, 68, 0.9)" : accent(0.95),
              color: "#fff",
              padding: "12px 18px",
              borderRadius: "12px",
              zIndex: 1000,
              fontSize: "14px",
              fontWeight: "600",
            }}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EditProfile;


const bgImg = "/bg-img-RSP.jpg";

export const ACCENT_HEX = "#e8b84b";
export const ACCENT_DARK_HEX = "#c9972d";
export const ACCENT_RGB = "232, 184, 75";
export const ACCENT_SOFT_RGB = "201, 151, 45";

export const accent = (alpha = 1) => `rgba(${ACCENT_RGB}, ${alpha})`;
export const accentSoft = (alpha = 1) => `rgba(${ACCENT_SOFT_RGB}, ${alpha})`;

export const appBackgroundImage = bgImg;

export const getPageBackgroundStyle = (isMobile = false, overlay = 0.62) => ({
  backgroundImage: `linear-gradient(rgba(0, 0, 0, ${overlay}), rgba(0, 0, 0, ${overlay})), url(${bgImg})`,
  backgroundSize: "cover",
  backgroundPosition: "center",
  backgroundAttachment: isMobile ? "scroll" : "fixed",
  backgroundRepeat: "no-repeat",
  backgroundColor: "#120f0a",
});

// Converts a recipe title to a URL-safe slug
// e.g. "Butter Chicken (Indian Cuisine)" → "butter-chicken-indian-cuisine"
export const generateSlug = (title) =>
  String(title)
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]/g, '');


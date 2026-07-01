export const COMPONENT_KEYS = {
  FOOD_SLIDER: "foodSlider",
  FOOD_SLIDER_2: "foodSlider2",
  HERO_BANNER: "heroBanner",
  RECIPE_CARD: "recipeCard",
};

export const fetchPublishedComponentContent = async (componentKey) => {
  if (!Object.values(COMPONENT_KEYS).includes(componentKey)) {
    return [];
  }
  return [];
};
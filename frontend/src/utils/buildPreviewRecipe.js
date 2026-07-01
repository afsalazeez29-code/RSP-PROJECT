export function buildPreviewRecipe({
  title,
  description,
  difficulty,
  selectedCats,
  cuisine,
  serves,
  cookTime,
  imagePreview,
  imageUrl,
  currentImage,
  ingredients,
  steps,
  tags,
  visibility,
  featured,
  currentUser,
}) {
  const userStr = currentUser || (typeof localStorage !== "undefined" ? JSON.parse(localStorage.getItem("user") || "null") : null);
  const formattedIngredients = (ingredients || [])
    .map((i) => ({
      name: i.name?.trim() || "",
      qty: i.qty || "",
      unit: i.unit || "",
      quantity: i.qty ? `${i.qty}${i.unit ? ` ${i.unit}` : ""}` : "",
    }))
    .filter((i) => i.name);

  const formattedSteps = (steps || [])
    .map((s, index) => ({
      step: index + 1,
      text: s.text?.trim() || "",
      description: s.text?.trim() || "",
    }))
    .filter((s) => s.text);

  const image = imagePreview || imageUrl || currentImage || "";

  return {
    id: "preview",
    _id: "preview",
    title: title?.trim() || "Untitled Recipe",
    description: description?.trim() || "",
    difficulty: difficulty || "Easy",
    difficultyLevel: String(difficulty || "easy").toLowerCase(),
    category: selectedCats || [],
    cuisine: cuisine || "",
    serves: Number(serves) || 1,
    servings: Number(serves) || 1,
    cookTime: Number(cookTime) || 0,
    image,
    imageUrl: image,
    ingredients: formattedIngredients,
    instructions: formattedSteps,
    steps: formattedSteps,
    tags: tags || [],
    isDraft: visibility === "draft",
    featured: Boolean(featured),
    likes: 0,
    views: 0,
    rating: 0,
    ratingCount: 0,
    reviews: [],
    reactions: [],
    reactionCounts: { delicious: 0, like: 0, fire: 0 },
    createdBy: userStr
      ? {
          _id: userStr._id || userStr.id,
          id: userStr._id || userStr.id,
          name: userStr.name || "You",
          username: userStr.username || "",
          profileImage: userStr.profileImage || "",
          bio: userStr.bio || "",
          createdAt: userStr.createdAt || new Date().toISOString(),
        }
      : { name: "You", username: "chef" },
    createdAt: new Date().toISOString(),
  };
}

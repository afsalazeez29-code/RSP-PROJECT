import React, { useEffect, useRef, useState } from "react";
import API from "../services/api";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useToast } from "../context/ToastContext";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";
import HeroBanner from "../components/HeroBanner";
import FoodSlider2 from "../components/FoodSlider2";
import Footer from "../components/Footer";
import Sidebar from "../components/Sidebar";
import RecipeCardGrid from "../components/RecipeCardGrid";
import NavbarHome from "../components/NavbarHome";
import { COMPONENT_KEYS, fetchPublishedComponentContent } from "../services/componentContent";
import {
  COMING_SOON_HERO_BANNER,
  FOOD_SLIDER2_SECTIONS,
  HOME_HERO_BANNERS,
} from "../data/realContent";

const bgImage = "/bg-img-RSP.jpg";
const HOME_RECIPE_CARD_TOTAL = 4;
const HOME_REAL_RECIPE_LIMIT = 16;
const HOME_CLOUDINARY_RECIPE_CARDS = [
  { legacyId: "3", title: "Kunafa Delight", match: ["kunafa"], image: "https://res.cloudinary.com/dgovvdud9/image/upload/v1781717982/kunafa_b52g6h.jpg" },
  { legacyId: "1", title: "Chocolate Brownies", match: ["chocolate brownies", "brownies"], image: "https://res.cloudinary.com/dgovvdud9/image/upload/v1781717978/Brownies_sdjmok.jpg", description: "Rich, fudgy chocolate brownies with a soft center and crackly top.", difficulty: "Medium", difficultyLevel: "medium", cookTime: 30 },
  { legacyId: "2", title: "Chicken Fried Rice", match: ["chicken fried rice", "fried rice"], image: "https://res.cloudinary.com/dgovvdud9/image/upload/v1781717980/FriedRice_tj7oau.jpg" },
  { legacyId: "4", title: "Loaded Cheese Fries", match: ["loaded cheese fries", "loaded fries"], image: "https://res.cloudinary.com/dgovvdud9/image/upload/v1781717982/LoadedFries_tlc5df.jpg" },
  { legacyId: "5", title: "Crispy Masala Dosa", match: ["crispy masala dosa", "masala dosa"], image: "https://res.cloudinary.com/dgovvdud9/image/upload/v1781717984/MasalaDosa_zdz2yv.jpg" },
  { legacyId: "6", title: "Creamy Mushroom Risotto", match: ["creamy mushroom risotto", "mushroom risotto"], image: "https://res.cloudinary.com/dgovvdud9/image/upload/v1781717986/MushroomRisotto_pad2kq.jpg" },
  { legacyId: "7", title: "Spicy Japanese Ramen", match: ["spicy japanese ramen", "ramen"], image: "https://res.cloudinary.com/dgovvdud9/image/upload/v1781717987/Ramen_cyelh9.jpg" },
  { legacyId: "9", title: "Mexican Beef Tacos", match: ["mexican beef tacos", "tacos"], image: "https://res.cloudinary.com/dgovvdud9/image/upload/v1781717991/Tacos_xijstg.jpg" },
  { legacyId: "8", title: "Chicken Shawarma", match: ["chicken shawarma", "shawarma"], image: "https://res.cloudinary.com/dgovvdud9/image/upload/v1781717988/Shawarma_f39igi.jpg" },
];

const ALL_EXCLUDED_PROMO_TITLES = [
  "Butter Chicken", "Pad Thai", "Sushi", "Red Velvet Cake",
  "Cream Cheese Pizza", "Authentic Beef Mandhi", "Blueberry Smoothie", "Choco-Berry Cake",
  "Juicy Burger", "Cheesy Pizza", "Crispy Fried Chicken", "Golden Fries",
  "Grilled Chicken", "Fresh Salad", "Fresh Salmon", "Warm Soup",
  "Soft Cookies", "Sweet Cupcakes", "Glazed Donuts", "Fluffy Waffles",
  "Garlicky Bread", "Crispy Nuggets", "Salty Popcorn", "Tasty Sandwich",
  "Pasta", "Spaghetti", "Alfredo", "Chicken Biriyani", "Hot Dogs", "Noodles", "Kebab", "Kofta"
];

const isExcludedPromo = (title) => {
  if (!title) return false;
  const titleLower = title.toLowerCase();
  return ALL_EXCLUDED_PROMO_TITLES.some(promo => titleLower.includes(promo.toLowerCase()));
};

const normalizeRecipeName = (value = "") => String(value).toLowerCase().replace(/[^a-z0-9]/g, "");

const findRecipeForHomeCard = (dbRecipes, card, usedIds) => {
  const matchNames = [card.title, ...(card.match || [])].map(normalizeRecipeName).filter(Boolean);
  const recipe = dbRecipes.find((item) => {
    const id = String(item.id || item._id || "");
    const legacyId = String(item.legacyId || "");
    if (usedIds.has(id)) return false;
    const title = normalizeRecipeName(item.title);
    return legacyId === String(card.legacyId || "")
      || matchNames.some((match) => title === match || title.includes(match) || match.includes(title));
  });

  if (recipe) usedIds.add(String(recipe.id || recipe._id || ""));
  return recipe || null;
};

const Home = () => {
  const cursorRef = useRef(null);
  const recipesRef = useRef(null);
  const slider2Ref = useRef(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tagFilter = (searchParams.get("tag") || searchParams.get("search") || "").trim();
  const { showError, showSuccess } = useToast();

  // ✅ STATE MANAGEMENT
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [width, setWidth] = useState(window.innerWidth);
  const [recipesInView, setRecipesInView] = useState(false);
  const [slider2InView, setSlider2InView] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [managedHeroBanner, setManagedHeroBanner] = useState(null);
  const [managedSlider2, setManagedSlider2] = useState([]);
  const [tagResults, setTagResults] = useState([]);
  const [tagLoading, setTagLoading] = useState(false);

  // Responsive flags
  const isMobile = width < 768;   // Only phones hide sidebar
  const isTablet = width >= 768 && width < 1024;  // Tablet shows sidebar
  const isDesktop = width >= 1024;
  const isCompact = isMobile || isTablet;

  // ★ HERO BANNERS DATA
  const heroBanners = HOME_HERO_BANNERS;

  // ★ FETCH RECIPES
  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        setLoading(true);
        let fetchedData = [];
        try {
          const response = await API.get('/recipes', { params: { limit: 50 } });
          const serverRecipes = response.data?.recipes || response.data?.data?.recipes || response.data;
          const dbRecipes = Array.isArray(serverRecipes) ? serverRecipes : [];
          const usedRecipeIds = new Set();
          const mappedPromoRecipes = HOME_CLOUDINARY_RECIPE_CARDS.map((card, index) => {
            const r = findRecipeForHomeCard(dbRecipes, card, usedRecipeIds) || {};
            return {
              _id: r.id || r._id,
              id: r.id || r._id || card.legacyId,
              title: r.title || card.title,
              description: r.description || card.description || "",
              category: Array.isArray(r.category) ? r.category[0] : r.category,
              image: card.image,
              imageUrl: card.image,
              cloudinaryPublicId: r.cloudinaryPublicId || r.imagePublicId,
              difficulty: r.difficulty || card.difficulty,
              difficultyLevel: r.difficultyLevel || card.difficultyLevel,
              rating: Number(r.rating || 0),
              ratingCount: Number(r.ratingCount || 0),
              isFavorite: Boolean(r.isFavorite || r.isLiked),
              isLiked: Boolean(r.isLiked),
              cookTime: r.cookTime || card.cookTime,
              serves: r.serves,
              createdBy: r.createdBy?.id || r.createdBy || r.userId,
              author: r.author || r.createdBy,
            };
          }).filter(r => !isExcludedPromo(r.title));
          
          const userCreatedRecipes = dbRecipes
            .filter(r => {
              const rId = String(r.id || r._id || "");
              const title = r.title || "";
              return rId && !usedRecipeIds.has(rId) && !isExcludedPromo(title);
            })
            .map(r => ({
              ...r,
              image: r.image || r.imageUrl,
              imageUrl: r.imageUrl || r.image,
            }));

          fetchedData = [...mappedPromoRecipes, ...userCreatedRecipes];
        } catch (apiErr) {
          console.log("Featured recipe cards unavailable", apiErr.message);
          fetchedData = HOME_CLOUDINARY_RECIPE_CARDS.map((card, index) => ({
            id: card.legacyId,
            title: card.title,
            description: card.description || "",
            image: card.image,
            imageUrl: card.image,
            difficulty: card.difficulty,
            difficultyLevel: card.difficultyLevel,
            cookTime: card.cookTime,
            rating: 0,
            ratingCount: 0,
          }));
        }

        setTimeout(() => {
          setRecipes(fetchedData);
          setLoading(false);
        }, 800);
      } catch (err) {
        setError(err.message || "Failed to fetch recipes");
        setLoading(false);
      }
    };

    fetchRecipes();
  }, []);

  useEffect(() => {
    const fetchTagResults = async () => {
      if (!tagFilter) {
        setTagResults([]);
        return;
      }

      try {
        setTagLoading(true);
        const response = await API.get("/recipes", { params: { tag: tagFilter, limit: 50 } });
        const serverRecipes = response.data?.recipes || response.data?.data?.recipes || [];
        setTagResults(Array.isArray(serverRecipes) ? serverRecipes : []);
      } catch (err) {
        console.error("Tag filter fetch error:", err);
        setTagResults([]);
      } finally {
        setTagLoading(false);
      }
    };

    fetchTagResults();
  }, [tagFilter]);

  // ★ EFFECTS - Resize, Cursor, Observers
  useEffect(() => {
    const loadManagedContent = async () => {
      try {
        const [heroItems, sliderItems] = await Promise.all([
          fetchPublishedComponentContent(COMPONENT_KEYS.HERO_BANNER),
          fetchPublishedComponentContent(COMPONENT_KEYS.FOOD_SLIDER_2),
        ]);
        if (heroItems.length) setManagedHeroBanner(heroItems[0]);
        if (sliderItems.length) setManagedSlider2(sliderItems);
      } catch (error) {
        console.log("Using bundled home component content", error.message);
      }
    };

    loadManagedContent();

    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);

    const handleMouseMove = (e) => {
      if (cursorRef.current) {
        cursorRef.current.style.left = e.clientX + 'px';
        cursorRef.current.style.top = e.clientY + 'px';
      }
    };
    window.addEventListener("mousemove", handleMouseMove);

    const recipesObserver = new IntersectionObserver(
      ([entry]) => setRecipesInView(entry.isIntersecting),
      { threshold: 0.1 }
    );
    if (recipesRef.current) recipesObserver.observe(recipesRef.current);


    const reveals = document.querySelectorAll('.reveal');
    const revealObserver = new IntersectionObserver(
      (entries) => entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add('active');
      }),
      { threshold: 0.1 }
    );
    reveals.forEach(el => revealObserver.observe(el));

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      recipesObserver.disconnect();

      revealObserver.disconnect();
    };
  }, []);

  // Fix: Re-attach slider2 observer whenever loading completes or page changes
  useEffect(() => {
    const slider2Observer = new IntersectionObserver(
      ([entry]) => setSlider2InView(entry.isIntersecting),
      { threshold: 0.1 }
    );
    if (slider2Ref.current) slider2Observer.observe(slider2Ref.current);

    return () => {
      slider2Observer.disconnect();
    };
  }, [loading, currentPage]);

  // Ã¢Å“â€¦ SLIDER DATA
  const sliderSections = FOOD_SLIDER2_SECTIONS.map((section) => ({
    ...section,
    slides: managedSlider2.length ? managedSlider2 : section.slides,
  }));
  const activeRecipeCards = recipes.slice(0, HOME_REAL_RECIPE_LIMIT);
  const getRecipeCardsForPage = (pageNumber) => {
    const start = (pageNumber - 1) * HOME_RECIPE_CARD_TOTAL;
    return activeRecipeCards.slice(start, start + HOME_RECIPE_CARD_TOTAL);
  };

  // Ã¢Å“â€¦ STYLES
  const styles = {
    pageWrapper: {
      display: 'flex',
      minHeight: '100vh',
      width: '100%',
      background: `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.65)), url(${bgImage})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
      backgroundAttachment: "fixed",
      color: "#fff",
      fontFamily: "Poppins, sans-serif",
      flexDirection: 'column',
      /* default cursor */
    },

    mainContent: {
      marginLeft: isCompact ? '0' : '250px',
      width: isCompact ? '100%' : 'calc(100% - 250px)',
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
    },

    recipeSection: {
      paddingTop: isMobile ? "10px" : isTablet ? "15px" : "20px",
      paddingLeft: isMobile ? "16px" : "24px",
      paddingRight: isMobile ? "16px" : "24px",
      paddingBottom: isMobile ? "10px" : "10px",
      width: "100%",
      flex: 1,
    },

    sectionTitle: {
      fontSize: isMobile ? "24px" : isTablet ? "32px" : "40px",
      fontWeight: "800",
      textAlign: "center",
      marginBottom: isMobile ? "30px" : isTablet ? "40px" : "50px",
      color: "#fff",
      margin: 0,
    },

    loadingError: {
      textAlign: 'center',
      padding: '60px 20px',
      fontSize: '16px',
    },
  };

  return (
    <div style={styles.pageWrapper}>
      <style>{`
        .reveal {
          opacity: 0;
          transform: translateY(40px);
          transition: all 0.8s ease-out;
        }
        .reveal.active {
          opacity: 1;
          transform: translateY(0);
        }
      `}</style>

      {/* NAVBAR */}
      <NavbarHome />

      {/* SIDEBAR (Fixed on desktop/tablet) */}
      <Sidebar />

      {/* MAIN CONTENT with margin for sidebar */}
      <div style={styles.mainContent}>
        <section style={styles.recipeSection} ref={recipesRef}>

          {loading && (
            <div style={{ ...styles.loadingError, color: 'rgba(255,255,255,0.7)' }}>
              Loading delicious recipes...
            </div>
          )}

          {error && (
            <div style={{ ...styles.loadingError, color: '#ff6b6b' }}>
              Error: {error}
            </div>
          )}

          {tagFilter && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ marginBottom: "32px" }}
            >
              <h2 style={{ fontSize: "28px", fontWeight: 800, marginBottom: "8px" }}>
                Recipes tagged #{tagFilter}
              </h2>
              <p style={{ color: "rgba(255,255,255,0.72)", marginBottom: "20px" }}>
                {tagLoading ? "Searching recipes..." : `${tagResults.length} recipe${tagResults.length === 1 ? "" : "s"} found`}
              </p>
              {!tagLoading && tagResults.length > 0 && (
                <RecipeCardGrid recipes={tagResults} totalCards={tagResults.length} />
              )}
              {!tagLoading && tagResults.length === 0 && (
                <div style={{ padding: "24px", borderRadius: "16px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
                  No published recipes found for #{tagFilter}.
                </div>
              )}
            </motion.div>
          )}

          {!loading && !error && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={recipesInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.6 }}
            >
              {(() => {
                // Data map for each of the 4 pages
                const pageConfig = [
                  {
                    title: "Trending Recipes",
                    subtitle: "The most viewed recipes, handpicked for quick discovery.",
                    banner1: managedHeroBanner || heroBanners[0],
                    banner2: heroBanners[1],
                    cards: getRecipeCardsForPage(1),
                    sliderSection: sliderSections[0],
                  },
                  {
                    title: "Popular Main Dishes",
                    subtitle: "Hearty, flavorful meals loved by our community.",
                    banner1: managedHeroBanner || heroBanners[2],
                    banner2: heroBanners[3],
                    cards: getRecipeCardsForPage(2),
                    sliderSection: sliderSections[1],
                  },
                  {
                    title: "Featured Desserts",
                    subtitle: "Sweet treats crafted to inspire your next indulgence.",
                    banner1: managedHeroBanner || heroBanners[4],
                    banner2: COMING_SOON_HERO_BANNER,
                    cards: getRecipeCardsForPage(3),
                    sliderSection: sliderSections[2],
                  },
                  {
                    title: "World Cuisines",
                    subtitle: "Explore flavors from every corner of the globe.",
                    banner1: COMING_SOON_HERO_BANNER,
                    banner2: COMING_SOON_HERO_BANNER,
                    cards: getRecipeCardsForPage(4),
                    sliderSection: sliderSections[3],
                  },
                ];

                const page = pageConfig[currentPage - 1];

                return (
                  <>
                    {/* 1. Section Title */}
                    <motion.div
                      key={`title-${currentPage}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                    >
                      <h2 style={{ ...styles.sectionTitle, marginBottom: isMobile ? "8px" : "12px" }}>
                        {page.title}
                      </h2>
                      <p style={{ textAlign: "center", color: "rgba(255,255,255,0.7)", fontSize: isMobile ? "14px" : "16px", marginBottom: isMobile ? "20px" : "32px", fontFamily: "Poppins, sans-serif" }}>
                        {page.subtitle}
                      </p>
                    </motion.div>

                    {/* 2. First HeroBanner */}
                    <motion.div
                      key={`banner1-${currentPage}`}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.7, ease: 'easeOut' }}
                    >
                      <HeroBanner
                        category={page.banner1.category}
                        countryCode={page.banner1.countryCode}
                        title={page.banner1.title}
                        quote={page.banner1.quote}
                        description={page.banner1.description}
                        image={page.banner1.image}
                        accentColor={page.banner1.accentColor}
                        recipeId={page.banner1.recipeId}
                        hideDescriptionUntilDesktop
                      />
                    </motion.div>

                    {/* 3. Top Picks Title + 4 Recipe Cards */}
                    <motion.div
                      key={`cards-${currentPage}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.1 }}
                    >
                      <h2 style={{ ...styles.sectionTitle, marginBottom: isMobile ? "8px" : "12px" }}>
                        Top Picks
                      </h2>
                      <p style={{ textAlign: "center", color: "rgba(255,255,255,0.7)", fontSize: isMobile ? "14px" : "16px", marginBottom: isMobile ? "20px" : "32px", fontFamily: "Poppins, sans-serif" }}>
                        Community favorites you need to try.
                      </p>
                      <RecipeCardGrid recipes={page.cards} totalCards={HOME_RECIPE_CARD_TOTAL} showPlaceholders />
                    </motion.div>

                    {/* 4. Second HeroBanner */}
                    <motion.div
                      key={`banner2-${currentPage}`}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.7, delay: 0.15, ease: 'easeOut' }}
                      style={{ marginTop: isMobile ? "40px" : "60px" }}
                    >
                      <HeroBanner
                        category={page.banner2.category}
                        countryCode={page.banner2.countryCode}
                        title={page.banner2.title}
                        quote={page.banner2.quote}
                        description={page.banner2.description}
                        image={page.banner2.image}
                        accentColor={page.banner2.accentColor}
                        recipeId={page.banner2.recipeId}
                        hideDescriptionUntilDesktop
                      />
                    </motion.div>

                    {/* 5. FoodSlider2 */}
                    <motion.div
                      key={`slider-${currentPage}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                    >
                      <section ref={slider2Ref} style={{ display: "flex", justifyContent: "center" }}>
                        <FoodSlider2
                          sectionTitle={page.sliderSection.header}
                          slides={page.sliderSection.slides}
                          datasetKey={page.sliderSection.datasetKey}
                          isInView={slider2InView}
                          onActiveSlideChange={(idx) => console.log("Slider2 active:", idx)}
                          transitionDuration={1.2}
                          disableRotation={true}
                          hideDecos={true}
                        />
                      </section>
                    </motion.div>

                    {/* 6. Pagination Controls */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      gap: isMobile ? '8px' : '12px',
                      marginTop: isMobile ? '40px' : '60px',
                      flexWrap: 'wrap'
                    }}>
                      {/* Previous Button - Hidden on Page 1 */}
                      {currentPage > 1 && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            setCurrentPage(currentPage - 1);
                            recipesRef.current?.scrollIntoView({ behavior: 'smooth' });
                          }}
                          style={{
                            padding: isMobile ? '10px 14px' : '12px 18px',
                            background: 'rgba(232, 184, 75, 0.2)',
                            border: '1.5px solid rgba(232, 184, 75, 0.5)',
                            color: '#e8b84b',
                            borderRadius: '8px',
                            fontWeight: '600',
                            fontSize: isMobile ? '12px' : '14px',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            backdropFilter: 'blur(10px)',
                            fontFamily: 'Poppins, sans-serif'
                          }}
                        >
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}><FaArrowLeft /> Previous</span>
                        </motion.button>
                      )}

                      {/* Page Numbers 1Ã¢â‚¬â€œ4 */}
                      <div style={{ display: 'flex', gap: isMobile ? '4px' : '8px', alignItems: 'center' }}>
                        {[1, 2, 3, 4].map((pg) => (
                          <motion.button
                            key={pg}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                              setCurrentPage(pg);
                              recipesRef.current?.scrollIntoView({ behavior: 'smooth' });
                            }}
                            style={{
                              width: isMobile ? '36px' : '42px',
                              height: isMobile ? '36px' : '42px',
                              borderRadius: '8px',
                              border: pg === currentPage ? '2px solid #e8b84b' : '1.5px solid rgba(255, 255, 255, 0.2)',
                              background: pg === currentPage ? 'rgba(232, 184, 75, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                              color: pg === currentPage ? '#e8b84b' : '#fff',
                              fontWeight: pg === currentPage ? '700' : '600',
                              fontSize: isMobile ? '12px' : '14px',
                              cursor: 'pointer',
                              transition: 'all 0.3s ease',
                              backdropFilter: 'blur(10px)',
                              fontFamily: 'Poppins, sans-serif'
                            }}
                          >
                            {pg}
                          </motion.button>
                        ))}
                      </div>

                      {/* Next Button */}
                      <motion.button
                        whileHover={currentPage < 4 ? { scale: 1.05 } : {}}
                        whileTap={currentPage < 4 ? { scale: 0.95 } : {}}
                        onClick={() => {
                          if (currentPage < 4) {
                            setCurrentPage(currentPage + 1);
                            recipesRef.current?.scrollIntoView({ behavior: 'smooth' });
                          }
                        }}
                        disabled={currentPage === 4}
                        style={{
                          padding: isMobile ? '10px 14px' : '12px 18px',
                          background: currentPage === 4 ? 'rgba(255, 255, 255, 0.08)' : 'rgba(232, 184, 75, 0.2)',
                          border: `1.5px solid ${currentPage === 4 ? 'rgba(255, 255, 255, 0.1)' : 'rgba(232, 184, 75, 0.5)'}`,
                          color: currentPage === 4 ? 'rgba(255, 255, 255, 0.3)' : '#e8b84b',
                          borderRadius: '8px',
                          fontWeight: '600',
                          fontSize: isMobile ? '12px' : '14px',
                          cursor: currentPage === 4 ? 'not-allowed' : 'pointer',
                          transition: 'all 0.3s ease',
                          backdropFilter: 'blur(10px)',
                          fontFamily: 'Poppins, sans-serif'
                        }}
                      >
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>Next <FaArrowRight /></span>
                      </motion.button>
                    </div>

                    {/* Page Info Label */}
                    <div style={{
                      textAlign: 'center',
                      marginTop: isMobile ? '20px' : '24px',
                      color: 'rgba(255, 255, 255, 0.5)',
                      fontSize: isMobile ? '12px' : '14px',
                      fontFamily: 'Poppins, sans-serif'
                    }}>
                      Page {currentPage} of 4
                    </div>
                  </>
                );
              })()}
            </motion.div>
          )}
        </section>

        {/* FOOTER */}
        <Footer />
      </div>
    </div>
  );
};

export default Home;







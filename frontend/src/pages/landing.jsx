import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from 'react-router-dom';
const bgImage = "https://res.cloudinary.com/dgovvdud9/image/upload/v1781717956/bg-img-RSP_bk4k2x.jpg";
import { motion } from 'framer-motion';
import { FaHeart } from 'react-icons/fa';
import { TbChefHatFilled } from 'react-icons/tb'; import '../landing.css';
import ReactCountryFlag from 'react-country-flag';

// â”€â”€ Imported Components â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
import NavbarLanding from '../components/NavbarLanding';  // 1. Navbar component
import FoodSlider from '../components/FoodSlider';         // 3. FoodSlider
import FAQ from '../components/Faq';                       // 4. FAQ component
import { SliderColorProvider, useSliderColor } from '../context/SliderColorContext';
import { COMPONENT_KEYS, fetchPublishedComponentContent } from '../services/componentContent';
import { LANDING_SLIDER_RECIPES, LANDING_TOP_RECIPES } from '../data/realContent';

// â”€â”€ Slides data required by FoodSlider / SliderCard â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const slides = LANDING_TOP_RECIPES;

// â”€â”€ Slides data for FoodSlider â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const sliderSlides = LANDING_SLIDER_RECIPES;

const mapCardContent = (item) => ({
  id: item.id || item.recipeId || item.contentId,
  title: item.title,
  label: item.category || item.label || 'Featured',
  desc: item.desc || item.description || 'A featured recipe selected by the Recipe.IO content team.',
  reviews: item.metadata?.reviews || 'Featured',
  rating: item.metadata?.rating || '5.0',
  accentColor: item.accentColor || '#e8b84b',
  image: item.image,
  createdBy: item.createdBy?.id || item.createdBy || item.metadata?.createdBy,
  author: item.author || item.createdBy,
});

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const Landing = () => {
  const navigate = useNavigate();
  const { sliderColor } = useSliderColor();
  const [width, setWidth] = useState(window.innerWidth);
  const [openFaq, setOpenFaq] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const [cardsInView, setCardsInView] = useState(false);
  const [sliderInView, setSliderInView] = useState(false);
  const [faqInView, setFaqInView] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [managedSliderSlides, setManagedSliderSlides] = useState([]);
  const [managedRecipeCards, setManagedRecipeCards] = useState([]);

  // â”€â”€ Refs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const cursorRef = useRef(null);
  const cardsRef = useRef(null);
  const sliderRef = useRef(null);
  const faqRef = useRef(null);
  const heroInnerRef = useRef(null);
  const heroContainerRef = useRef(null);
  const topPicksRef = useRef(null);

  // â”€â”€ Derived accent color (changes per food slide) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Now driven by SliderColorContext (sliderColor) rather than local slides array
  const activeSliderSlides = managedSliderSlides.length ? managedSliderSlides : sliderSlides;
  const activeTopCards = managedRecipeCards.length ? managedRecipeCards.map(mapCardContent) : slides;
  const currentAccent = activeSliderSlides[activeSlide]?.accentColor || sliderColor;

  // â”€â”€ Helpers for custom cursor â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const cursorEnter = () => cursorRef.current?.classList.add('hovered');
  const cursorLeave = () => cursorRef.current?.classList.remove('hovered');

  // â”€â”€ Responsive flags â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const isMobile = width < 640;
  const isTablet = width < 1024;

  // â”€â”€ Effects â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    const loadManagedContent = async () => {
      try {
        const [foodSliderItems, recipeCardItems] = await Promise.all([
          fetchPublishedComponentContent(COMPONENT_KEYS.FOOD_SLIDER),
          fetchPublishedComponentContent(COMPONENT_KEYS.RECIPE_CARD),
        ]);
        if (foodSliderItems.length) setManagedSliderSlides(foodSliderItems);
        if (recipeCardItems.length) setManagedRecipeCards(recipeCardItems);
      } catch (error) {
        console.log('Using bundled landing content', error.message);
      }
    };

    loadManagedContent();

    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);

    const handleScroll = () => {
      const sy = window.scrollY;
      setScrolled(sy > 10);

      if (heroInnerRef.current) {
        const parallaxY = Math.min(sy * 0.25, 100);
        heroInnerRef.current.style.transform = `translateY(-${parallaxY}px)`;
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });

    const handleMouseMove = (e) => {
      if (cursorRef.current) {
        cursorRef.current.style.left = e.clientX + 'px';
        cursorRef.current.style.top = e.clientY + 'px';
      }
    };
    window.addEventListener("mousemove", handleMouseMove);

    const reveals = document.querySelectorAll('.reveal');
    const revealObserver = new IntersectionObserver(
      (entries) => entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add('active');
      }),
      { threshold: 0.1 }
    );
    reveals.forEach(el => revealObserver.observe(el));

    const heroObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          heroObserver.unobserve(entry.target);
        }
      },
      { threshold: 0.3 }
    );
    if (heroContainerRef.current) heroObserver.observe(heroContainerRef.current);

    const topPicksObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          topPicksObserver.unobserve(entry.target);
        }
      },
      { threshold: 0.3 }
    );
    if (topPicksRef.current) topPicksObserver.observe(topPicksRef.current);

    const sliderObserver = new IntersectionObserver(
      ([entry]) => setSliderInView(entry.isIntersecting),
      { threshold: 0.15 }
    );
    if (sliderRef.current) sliderObserver.observe(sliderRef.current);

    const faqObserver = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setFaqInView(true); },
      { threshold: 0.08 }
    );
    if (faqRef.current) faqObserver.observe(faqRef.current);

    const cardsObserver = new IntersectionObserver(
      ([entry]) => setCardsInView(entry.isIntersecting),
      { threshold: 0.1 }
    );
    if (cardsRef.current) cardsObserver.observe(cardsRef.current);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("mousemove", handleMouseMove);
      revealObserver.disconnect();
      heroObserver.disconnect();
      topPicksObserver.disconnect();
      cardsObserver.disconnect();
      sliderObserver.disconnect();
      faqObserver.disconnect();
    };
  }, []);

  // â”€â”€ Styles â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const styles = {
    heroInner: {
      width: "100%",
      height: "100%",
      background: `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.65)), url(${bgImage})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
      display: "flex",
      flexDirection: "column",
      color: "#fff",
      fontFamily: "Poppins, sans-serif",
      /* default cursor */
    },

    heroContainer: {
      flex: 1,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      textAlign: "center",
      padding: isMobile ? "60px 20px" : "100px 20px",
      gap: "24px",
    },

    heroTitle: {
      fontFamily: "Orbitron, sans-serif",
      fontSize: "clamp(48px, 8vw, 84px)",
      lineHeight: "1.05",
      fontWeight: "800",
      letterSpacing: "-2px",
      margin: 0,
      background: "linear-gradient(180deg, #FFFFFF 0%, rgba(255,255,255,0.7) 100%)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
    },

    heroSubtitle: {
      fontSize: "clamp(20px, 4vw, 32px)",
      color: sliderColor,
      fontWeight: "600",
      margin: 0,
      letterSpacing: "-0.5px",
      transition: 'color 1.2s ease',
    },

    heroDesc: {
      fontSize: isMobile ? "16px" : "18px",
      opacity: 0.7,
      lineHeight: "1.7",
      maxWidth: "500px",
      margin: "0 0 10px 0",
    },

    heroBtn: {
      background: "rgba(232, 184, 75, 1)",
      backdropFilter: "blur(12px)",
      border: "1px solid rgba(255,255,255,0.2)",
      padding: isMobile ? "16px 32px" : "18px 40px",
      borderRadius: "100px",
      color: "#fff",
      /* default cursor */
      transition: "all 0.3s ease",
      boxShadow: "0 10px 30px rgba(232, 184, 75, 0.4)",
      outline: "none",
      fontSize: "16px",
      fontWeight: "600",
      display: "flex",
      alignItems: "center",
      gap: "10px",
      width: "fit-content",
      alignSelf: "center",
    },

    foodCardsSection: {
      padding: isMobile ? "30px 16px" : isTablet ? "30px 24px" : "30px 40px",
      width: "100%",
    },
    sectionTitle: {
      fontSize: isMobile ? "24px" : isTablet ? "32px" : "40px",
      fontWeight: "800",
      textAlign: "center",
      marginBottom: "20px",
      color: "#fff",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "12px",
    },

    cardsGrid: {
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)",
      gap: isMobile ? "20px" : isTablet ? "24px" : "32px",
      maxWidth: "1200px",
      margin: "0 auto",
    },
  };

  // â”€â”€ Render â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  return (
    <>
      {/* NavbarLanding fixed over all layers */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999 }}>
        <NavbarLanding scrolled={scrolled} sliderColor={currentAccent} />
      </div>

      {/* LAYER 1 â€” STICKY HERO */}
      <div className="landing-hero-layer">
        <div
          ref={heroInnerRef}
          className="landing-hero-inner"
          style={styles.heroInner}
        >
          <main ref={heroContainerRef} className="hero-container-animate" style={styles.heroContainer}>
            <h2 style={styles.heroTitle}>Recipe.IO</h2>
            <h3 style={styles.heroSubtitle}>
              Let's Talk Food Recipes,
              {(isMobile || isTablet) && <br />}
              <span style={{ color: '#fff' }}>Shall We?</span>
            </h3>

            <p style={styles.heroDesc}>
              Recipio is a recipe sharing platform for real everyday cooking.
              Discover delicious recipes, healthy meal ideas, comfort food, meal
              prep inspiration, and helpful search filters that make it easy to
              find exactly what you need,<br />
              Is Here
            </p>

            <button
              style={{
                ...styles.heroBtn,
                background: sliderColor,
                boxShadow: `0 10px 30px ${sliderColor}66`,
                transition: 'background 1.2s ease, box-shadow 1.2s ease',
              }}
              onMouseEnter={(e) => {
                cursorEnter();
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = `0 15px 35px ${sliderColor}99`;
              }}
              onMouseLeave={(e) => {
                cursorLeave();
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = `0 10px 30px ${sliderColor}66`;
              }}
              onClick={() =>
                document.getElementById('food-slider')?.scrollIntoView({ behavior: 'smooth' })
              }
            >
              Explore Recipes
            </button>
          </main>
        </div>
      </div>

      {/* LAYER 2 â€” CONTENT CURTAIN */}
      <div
        className="landing-content-layer"
        style={{ color: "#fff", fontFamily: "Poppins, sans-serif" }}
      >
        {/* FOOD CARDS SECTION */}
        <div ref={cardsRef} id="food-cards-section" style={styles.foodCardsSection}>
          <div
            ref={topPicksRef}
            className="top-picks-title"
            style={styles.sectionTitle}
          >            TOP RATED RECIPES
          </div>

          <p
            style={{
              margin: "0 0 30px 0",
              maxWidth: "600px",
              marginLeft: "auto",
              marginRight: "auto",
              fontSize: isMobile ? "14px" : isTablet ? "15px" : "16px",
              opacity: 0.7,
              lineHeight: "1.6",
              textAlign: "center",
              color: "rgba(255, 255, 255, 0.8)",
            }}
          >
            Out of all the many recipes on Recipe.IO, these are our shining stars - the recipes we come back to again and again
          </p>

          <motion.div
            style={styles.cardsGrid}
            initial={{ opacity: 0, y: 20 }}
            animate={cardsInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6 }}
          >
            {activeTopCards.map((slide, idx) => (
              <motion.div
                key={slide.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={cardsInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                onClick={() => navigate(`/recipes/${slide.legacyId}/${slide.slug}`)}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  backdropFilter: 'blur(12px)',
                  border: `1px solid ${slide.accentColor}30`,
                  borderRadius: isMobile ? '12px' : '16px',
                  overflow: 'hidden',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
                  e.currentTarget.style.transform = 'translateY(-8px)';
                  e.currentTarget.style.boxShadow = `0 16px 40px ${slide.accentColor}40`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div
                  style={{
                    width: '100%',
                    height: isMobile ? '180px' : isTablet ? '280px' : '240px',
                    backgroundColor: `${slide.accentColor}20`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    position: 'relative',
                  }}
                >
                  <img
                    src={slide.image}
                    alt={slide.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                </div>

                <div style={{ padding: isMobile ? '16px' : '5px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <p style={{ margin: 0, fontSize: isMobile ? '11px' : '12px', opacity: 0.7, fontWeight: '600', letterSpacing: '0.5px', textTransform: 'uppercase', color: slide.accentColor }}>
                    {slide.label}
                  </p>
                  <h3 style={{ margin: 0, fontSize: isMobile ? '16px' : '18px', fontWeight: 'bold', color: '#fff', lineHeight: '1.3' }}>
                    {(() => {
                      if (!slide.title || !slide.title.includes('(')) return slide.title;
                      const [name, cuisinePart] = slide.title.split('(');
                      let countryCode = null;
                      if (cuisinePart.includes('Indian')) countryCode = 'IN';
                      else if (cuisinePart.includes('Thai')) countryCode = 'TH';
                      else if (cuisinePart.includes('Japanese')) countryCode = 'JP';
                      else if (cuisinePart.includes('USA') || cuisinePart.includes('American')) countryCode = 'US';
                      
                      if (countryCode) {
                        return (
                          <>
                            {name}(<ReactCountryFlag countryCode={countryCode} svg style={{ margin: '0 4px', fontSize: '1.1em', transform: 'translateY(-2px)' }} />{cuisinePart}
                          </>
                        );
                      }
                      return slide.title;
                    })()}
                  </h3>
                  {(() => {
                    const authorRaw = slide.author || slide.createdBy || slide.authorName;
                    const authorName = typeof authorRaw === 'string' ? authorRaw : (authorRaw?.name || '');
                    const authorFirst = authorName ? String(authorName).split(' ')[0] : '';
                    return authorName ? (
                      <p style={{ margin: 0, fontSize: isMobile ? '11px' : '12px', opacity: 0.68, lineHeight: '1.4', color: 'rgba(255,255,255,0.72)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <TbChefHatFilled /> {`by Chef ${authorFirst}`}
                      </p>
                    ) : null;
                  })()}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: isMobile ? '11px' : '12px', opacity: 0.7, marginTop: '4px' }}>
                    <span style={{ color: '#ffd700', display: 'flex', alignItems: 'center', gap: '4px' }}><FaHeart style={{ color: '#ef4444' }} /> {slide.rating}</span>
                    <span style={{ color: 'rgba(255,255,255,0.6)' }}>({slide.reviews})</span>
                  </div>
                  <p style={{ margin: '3px 0 0 0', fontSize: isMobile ? '11px' : '12px', opacity: 0.75, lineHeight: '1.4', color: 'rgba(255,255,255,0.8)' }}>
                    {slide.desc}
                  </p>
                  <span
                    style={{ marginTop: '4px', color: slide.accentColor, fontSize: isMobile ? '13px' : '14px', fontWeight: '600', textDecoration: 'none', transition: 'opacity 0.2s ease', display: 'inline-block' }}
                    onMouseEnter={(e) => { cursorEnter(); e.currentTarget.style.opacity = '0.7'; }}
                    onMouseLeave={(e) => { cursorLeave(); e.currentTarget.style.opacity = '1'; }}
                  >
                    View Recipe
                  </span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* FOOD SLIDER */}
        <div id="food-slider" ref={sliderRef} style={{ minHeight: '100vh', position: 'relative' }}>
          <FoodSlider
            slides={activeSliderSlides}
            isInView={sliderInView}
            onActiveSlideChange={setActiveSlide}
            transitionDuration={1.2}
          />
        </div>

        {/* FAQ */}
        <div ref={faqRef}>
          <FAQ
            bgColor={currentAccent + '18'}
            accentColor={currentAccent}
            isInView={faqInView}
            transitionDuration={1.2}
          />
        </div>
      </div>
    </>
  );
};

// Wrap with SliderColorProvider so context is available to all children
const LandingWithProvider = () => (
  <SliderColorProvider>
    <Landing />
  </SliderColorProvider>
);

export default LandingWithProvider;


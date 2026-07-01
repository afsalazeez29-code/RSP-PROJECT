import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { generateSlug } from '../utils/theme';
import { FaArrowLeft, FaArrowRight, FaFire } from 'react-icons/fa';
import { MdAccessTime } from 'react-icons/md';
import { BsPeopleFill } from 'react-icons/bs';
import { TbChefHatFilled } from 'react-icons/tb';
// ── Derives a very dark, hue-matched background from the accent colour ────────
function darkBg(hex) {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = Math.round(((n >> 16) & 0xff) * 0.22);
  const g = Math.round(((n >> 8) & 0xff) * 0.22);
  const b = Math.round((n & 0xff) * 0.22);
  return `rgb(${r},${g},${b})`;
}

// ─────────────────────────────────────────────────────────────────────────────

export default function FoodSlider2({
  sectionTitle = 'Fast Food Recipes',
  slides,
  datasetKey,
  isInView,
  onActiveSlideChange,
  transitionDuration = 1.2,
  disableRotation = true,
  hideDecos = true,
}) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeIdx, setActiveIdx] = useState(0);
  const [width, setWidth] = useState(window.innerWidth);
  const [autoPlay, setAutoPlay] = useState(true);

  const current = slides[activeIdx];
  const likedRecipeIds = useMemo(() => {
    if (!Array.isArray(user?.likedRecipes)) return new Set();
    return new Set(user.likedRecipes.map((id) => id?.toString()));
  }, [user?.likedRecipes]);

  useEffect(() => { onActiveSlideChange?.(activeIdx); }, [activeIdx]);

  useEffect(() => {
    setActiveIdx(0);
  }, [datasetKey]);

  useEffect(() => {
    const fn = () => setWidth(window.innerWidth);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);

  // Auto-advance
  useEffect(() => {
    if (!isInView || !autoPlay) return;
    const timer = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % slides.length);
    }, 7000);
    return () => clearInterval(timer);
  }, [isInView, autoPlay, slides.length, activeIdx]);

  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;
  const isDesktop = width >= 1024;
  const isCompact = isMobile || isTablet;

  const handlePrev = () => setActiveIdx(i => (i - 1 + slides.length) % slides.length);
  const handleNext = () => setActiveIdx(i => (i + 1) % slides.length);

  const getVisibleIndices = () => {
    if (isMobile) return [activeIdx];
    const prev = (activeIdx - 1 + slides.length) % slides.length;
    const next = (activeIdx + 1) % slides.length;
    if (isTablet) return [prev, activeIdx, next];
    const nextTwo = (activeIdx + 2) % slides.length;
    return [prev, activeIdx, next, nextTwo];
  };

  const visibleIndices = getVisibleIndices();

  const cardImageHeight = isMobile ? '220px' : '200px';

  return (
    <motion.section
      animate={{ backgroundColor: darkBg(current.accentColor) }}
      transition={{ duration: transitionDuration, ease: 'easeInOut' }}
      style={{
        position: 'relative',
        width: '100%',
        minHeight: isMobile ? 'auto' : '60vh',
        margin: '0 auto',
        padding: isMobile ? '20px 12px 76px' : '30px 24px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        fontFamily: "'Poppins', sans-serif",
        borderRadius: isMobile ? '20px' : isTablet ? '28px' : '32px',
      }}
    >
      {/* Subtle vignette */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.45) 100%)',
      }} />

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: -20 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        style={{
          position: 'relative',
          marginBottom: isMobile ? '20px' : '28px',
          zIndex: 6,
          textAlign: 'center',
          pointerEvents: 'none',
        }}
      >
        <h2 style={{
          margin: 0,
          fontSize: isMobile ? '24px' : isTablet ? '32px' : '40px',
          fontWeight: 800,
          color: '#ffffff',
          letterSpacing: 'normal',
          textTransform: 'none',
          fontFamily: "'Poppins', sans-serif",
          textAlign: 'center',
        }}>
          {sectionTitle}
        </h2>
      </motion.div>

      {/* ── 4 Cards Row ── */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: isMobile ? '0' : isTablet ? '12px' : '16px',
          width: '100%',
          position: 'relative',
          zIndex: 2,
        }}
        onMouseEnter={() => setAutoPlay(false)}
        onMouseLeave={() => setAutoPlay(true)}
      >
        {visibleIndices.map((slideIdx, position) => {
          const sourceSlide = slides[slideIdx];
          const slideId = (sourceSlide._id || sourceSlide.id)?.toString();
          const slide = {
            ...sourceSlide,
            isFavorite: Boolean(sourceSlide.isFavorite || sourceSlide.isLiked || likedRecipeIds.has(slideId)),
          };
          const isActive = slideIdx === activeIdx;
          const isTabletSideCard = isTablet && !isActive;
          const authorRaw = slide.author || slide.createdBy || slide.authorName;
          const authorName = typeof authorRaw === 'string' ? authorRaw : (authorRaw?.name || '');
          const authorFirst = authorName ? authorName.split(' ')[0] : '';
          return (
            <motion.div
              key={slideIdx}
              animate={{
                scale: isMobile ? 1 : isActive ? 1.05 : 0.9,
                opacity: isMobile ? 1 : isActive ? 1 : 0.7,
              }}
              transition={{ duration: 0.4, ease: 'easeInOut' }}
              onClick={() => {
                if (!isActive) setActiveIdx(slideIdx);
              }}
              style={{
                flex: isMobile ? '0 0 100%' : isTablet ? (isActive ? '0 0 55%' : '0 0 20%') : isActive ? '0 0 30%' : '0 0 22%',
                maxWidth: isMobile ? '100%' : isTablet ? (isActive ? '480px' : '180px') : isActive ? '360px' : '260px',
                background: darkBg(slide.accentColor),
                borderRadius: '16px',
                overflow: 'hidden',
                cursor: isActive ? 'default' : 'pointer',
                border: isActive
                  ? `2px solid ${slide.accentColor}55`
                  : '1px solid rgba(255,255,255,0.08)',
                boxShadow: isActive
                  ? `0 16px 48px rgba(0,0,0,0.5), 0 0 0 1px ${slide.accentColor}30`
                  : '0 4px 16px rgba(0,0,0,0.3)',
                transition: 'flex 0.4s ease, max-width 0.4s ease',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Card Image */}
              <div style={{
                width: '100%',
                height: cardImageHeight,
                overflow: 'hidden',
                position: 'relative',
                flexShrink: 0,
              }}>
                <AnimatePresence mode="wait">
                  <motion.img
                    key={`img-${slideIdx}-${isActive}`}
                    src={slide.image}
                    alt={slide.title}
                    initial={{ opacity: 0, scale: 1.08 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                </AnimatePresence>
                {/* Label badge */}
                <div style={{
                  position: 'absolute',
                  top: '10px',
                  left: '10px',
                  background: `${slide.accentColor}cc`,
                  color: '#fff',
                  fontSize: '10px',
                  fontWeight: '700',
                  letterSpacing: '1.2px',
                  textTransform: 'uppercase',
                  padding: '4px 10px',
                  borderRadius: '20px',
                }}>
                  {slide.label}
                </div>
              </div>

              {/* Card Content */}
              <div style={{
                padding: isMobile && isActive ? '0 0 16px' : isActive ? '18px' : '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: isMobile && isActive ? '0' : '8px',
                flex: 1,
              }}>
                {/* Title */}
                <h3 style={{
                  margin: isMobile && isActive ? '12px 16px 4px' : 0,
                  fontSize: isActive ? (isMobile ? '18px' : '20px') : '13px',
                  fontWeight: '800',
                  color: '#ffffff',
                  lineHeight: 1.2,
                  letterSpacing: '-0.3px',
                }}>
                  {slide.title}
                </h3>

                {authorName && !isTabletSideCard && (
                  <p style={{
                    margin: isMobile && isActive ? '0 16px 8px' : 0,
                    fontSize: isActive ? (isMobile ? '12px' : '12px') : '9px',
                    color: 'rgba(255,255,255,0.62)',
                    lineHeight: 1.4,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <TbChefHatFilled />
                    {`by Chef ${authorFirst}`}
                  </p>
                )}

                {/* Description — active card only */}
                {isActive && (
                  <p style={{
                    margin: isMobile ? '0 16px 8px' : 0,
                    fontSize: isMobile ? '13px' : '13px',
                    color: 'rgba(255,255,255,0.65)',
                    lineHeight: 1.5,
                  }}>
                    {slide.desc}
                  </p>
                )}

                {/* Stats row */}
                {!isTabletSideCard && (
                  <div style={{
                    display: 'flex',
                    gap: '6px',
                    flexWrap: 'wrap',
                    margin: isMobile && isActive ? '0 16px 10px' : '4px 0 0',
                  }}>
                    {[
                      { icon: <MdAccessTime />, val: slide.time },
                      { icon: <FaFire />, val: slide.kcal },
                      { icon: <BsPeopleFill />, val: slide.serves },
                    ].map(({ icon, val }) => (
                      <span key={val} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px',
                        fontSize: isActive ? (isMobile ? '10px' : '11px') : '9px',
                        color: '#fff',
                        background: `${slide.accentColor}30`,
                        border: `1px solid ${slide.accentColor}55`,
                        backdropFilter: 'blur(8px)',
                        padding: '3px 8px',
                        borderRadius: '20px',
                        fontWeight: 600,
                      }}>
                        {icon} {val}
                      </span>
                    ))}
                  </div>
                )}
                {/* View Recipe button — active card only */}
                {isActive && (
                  <motion.button
                    whileHover={{ scale: 1.04, y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => {
                      const path = slide.legacyId
                        ? `/recipes/${slide.legacyId}/${generateSlug(slide.title)}`
                        : `/recipes/${slideId}`;
                      navigate(path);
                    }}
                    style={{
                      margin: isMobile ? '0 16px 0' : '6px 0 0',
                      background: slide.accentColor,
                      color: '#fff',
                      border: 'none',
                      padding: isMobile ? '0 14px' : '10px 20px',
                      borderRadius: '10px',
                      fontSize: isMobile ? '13px' : '13px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: `0 6px 18px ${slide.accentColor}55`,
                      transition: 'box-shadow 0.3s ease',
                      alignSelf: isMobile ? 'stretch' : 'flex-start',
                      width: isMobile ? 'calc(100% - 32px)' : 'auto',
                      height: isMobile ? '44px' : 'auto',
                    }}
                  >
                    View Recipe
                  </motion.button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ── BOTTOM-RIGHT: Glassmorphism Pill Navigation ───────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.5, delay: 0.35 }}
        style={{
          position: isCompact ? 'relative' : 'absolute',
          bottom: isCompact ? 'auto' : '5%',
          right: isCompact ? 'auto' : '30%',
          marginTop: isCompact ? '18px' : 0,
          display: 'flex',
          alignItems: 'center',
          zIndex: 5,
          background: 'rgba(255, 255, 255, 0.10)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          border: `1px solid ${current.accentColor}55`,
          borderRadius: '999px',
          padding: isCompact ? '4px' : '2px',
          gap: isCompact ? '4px' : '4px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
          transition: 'border-color 0.5s ease',
        }}
        onMouseEnter={() => setAutoPlay(false)}
        onMouseLeave={() => setAutoPlay(true)}
      >
        {/* Prev */}
        <motion.button
          onClick={handlePrev}
          whileHover={{ background: 'rgba(255,255,255,0.22)' }}
          whileTap={{ scale: 0.92 }}
          aria-label="Previous slide"
          style={{
            width: isCompact ? '40px' : '48px',
            height: isCompact ? '40px' : '48px',
            borderRadius: '50%',
            border: 'none',
            background: 'rgba(255,255,255,0.00)',
            color: '#fff',
            fontSize: isCompact ? '18px' : '22px',
            fontWeight: 'bold',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.25s ease, transform 0.2s ease',
            outline: 'none',
            flexShrink: 0,
          }}
          onFocus={(e) => { e.currentTarget.style.boxShadow = `0 0 0 3px ${current.accentColor}88`; }}
          onBlur={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
        >
          &lt;
        </motion.button>

        {/* Next */}
        <motion.button
          onClick={handleNext}
          whileHover={{ background: 'rgba(255,255,255,0.22)' }}
          whileTap={{ scale: 0.92 }}
          aria-label="Next slide"
          style={{
            width: isCompact ? '40px' : '48px',
            height: isCompact ? '40px' : '48px',
            borderRadius: '50%',
            border: 'none',
            background: 'rgba(255,255,255,0.00)',
            color: '#fff',
            fontSize: isCompact ? '18px' : '22px',
            fontWeight: 'bold',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.25s ease, transform 0.2s ease',
            outline: 'none',
            flexShrink: 0,
          }}
          onFocus={(e) => { e.currentTarget.style.boxShadow = `0 0 0 3px ${current.accentColor}88`; }}
          onBlur={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
        >
          &gt;
        </motion.button>
      </motion.div>
    </motion.section>
  );
}

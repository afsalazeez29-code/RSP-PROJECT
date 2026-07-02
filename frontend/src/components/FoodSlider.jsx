import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import SliderPagination from './SliderPagination';
import { useSliderColor } from '../context/SliderColorContext';
import { MdAccessTime } from 'react-icons/md';
import { FaFire, FaArrowRight } from 'react-icons/fa';
import { BsPeopleFill } from 'react-icons/bs';

// Derives a very dark, hue-matched background from the accent colour
function darkBg(hex) {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = Math.round(((n >> 16) & 0xff) * 0.22);
  const g = Math.round(((n >> 8) & 0xff) * 0.22);
  const b = Math.round((n & 0xff) * 0.22);
  return `rgb(${r},${g},${b})`;
}

// Free-floating decorative food image (no circle, no border)
function FloatingImg({ src, style, delay = 0, isInView }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.6, rotate: -15 }}
      animate={isInView
        ? { opacity: 1, scale: 1, rotate: 0, y: [0, -14, 0] }
        : { opacity: 0, scale: 0.6 }}
      transition={{
        opacity: { duration: 0.6, delay },
        scale: { duration: 0.6, delay },
        rotate: { duration: 0.6, delay },
        y: { duration: 4, repeat: Infinity, ease: 'easeInOut', delay: delay + 0.6 },
      }}
      style={{
        position: 'absolute',
        zIndex: 3,
        pointerEvents: 'none',
        ...style,
      }}
    >
      <img
        src={src}
        alt=""
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          filter: 'drop-shadow(0 10px 28px rgba(0,0,0,0.55))',
        }}
      />
    </motion.div>
  );
}



export default function FoodSlider({
  slides,
  isInView,
  onActiveSlideChange,
  transitionDuration = 1.2,
  disableRotation = false,
  hideDecos = false,
}) {
  const navigate = useNavigate();
  const [activeIdx, setActiveIdx] = useState(0);
  const [width, setWidth] = useState(window.innerWidth);
  const current = slides[activeIdx];

  const [autoPlay, setAutoPlay] = useState(true);
  const { setSliderIndex } = useSliderColor();

  useEffect(() => {
    onActiveSlideChange?.(activeIdx);
    setSliderIndex(activeIdx);
  }, [activeIdx]);
  useEffect(() => {
    const fn = () => setWidth(window.innerWidth);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);

  // Auto-advance mechanism (resets on activeIdx change, like button clicks)
  useEffect(() => {
    if (!isInView || !autoPlay) return;
    const timer = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % slides.length);
    }, 7000); // Auto slide time slightly decreased from 5000
    return () => clearInterval(timer);
  }, [isInView, autoPlay, slides.length, activeIdx]);

  const isMobile = width < 640;
  const isTablet = width < 1024;

  const handlePrev = () => setActiveIdx(i => (i - 1 + slides.length) % slides.length);
  const handleNext = () => setActiveIdx(i => (i + 1) % slides.length);

  // watermark removed — no giant background text

  // circular food image size - smaller on mobile to prevent overlay
  const imgSize = isMobile ? '65vw' : isTablet ? '42vw' : '35.2vw';

  return (
    <motion.section
      animate={{ backgroundColor: darkBg(current.accentColor) }}
      transition={{ duration: transitionDuration, ease: 'easeInOut' }}
      style={{
        position: 'relative',
        width: '85%',
        minHeight: '100vh',
        margin: '0 auto',
        padding: isMobile ? '20px' : '30px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Poppins', sans-serif",
        borderRadius: isMobile ? '20px' : isTablet ? '28px' : '32px',
      }}
    >

      {/* ── Subtle vignette overlay ────────────────────────────────────────── */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.55) 100%)',
      }} />

      {/* ── "The Latest & Greatest Recipes" Section Heading ───────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: -20 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        style={{
          position: 'relative',
          marginTop: isMobile ? '10px' : '-10px',
          marginBottom: '30px',
          zIndex: 6,
          textAlign: 'center',
          pointerEvents: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          background: 'rgba(0, 0, 0, 0.1)',
          backdropFilter: 'blur(1px)',
          WebkitBackdropFilter: 'blur(1px)',
          border: '1px solid rgba(255, 252, 252, 0.2)',
          borderRadius: '99.9px',
          padding: isMobile ? '10px 20px' : '1px 25px',
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
          Latest &amp; Greatest
        </h2>
      </motion.div>

      {/* ── INNER SLIDER WRAPPER ─────────────────────────────────────────── */}
      <div style={{ position: 'relative', flex: 1, width: '100%' }}>

        {/* ── Floating decorative images (free, no bubble) ────────────────── */}
        {!hideDecos && (
          <AnimatePresence mode="wait">
            <motion.div key={`decos-${activeIdx}`} style={{ position: 'absolute', inset: 0, zIndex: 3, pointerEvents: 'none' }}>
              <FloatingImg src={current.smallImage || current.image} isInView={isInView} delay={0.1}
                style={{
                  top: isMobile ? '10%' : '35%', left: isMobile ? '3%' : '12%',
                  width: isMobile ? '70px' : '200px', height: isMobile ? '70px' : '130px'
                }} />
              <FloatingImg src={current.smallImage || current.image} isInView={isInView} delay={0.25}
                style={{
                  top: isMobile ? '8%' : '6%', right: isMobile ? '3%' : '13%',
                  width: isMobile ? '60px' : '200px', height: isMobile ? '60px' : '150px'
                }} />
              <FloatingImg src={current.smallImage || current.image} isInView={isInView} delay={0.4}
                style={{
                  bottom: isMobile ? '20%' : '22%', right: isMobile ? '4%' : '6%',
                  width: isMobile ? '52px' : '80px', height: isMobile ? '52px' : '80px'
                }} />
            </motion.div>
          </AnimatePresence>
        )}

        {/* ── FOOD IMAGE — centred, slow continuous rotation ────────────────── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`img-${activeIdx}`}
            initial={{ opacity: 0, scale: 0.72 }}
            animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.72 }}
            exit={{ opacity: 0, scale: 0.82 }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: imgSize,
              height: imgSize,
              marginTop: `calc(-${imgSize} / 2)`,
              marginLeft: `calc(-${imgSize} / 2)`,
              borderRadius: '50%',
              overflow: 'hidden',
              zIndex: 2,
              boxShadow: `0 0px 0px rgba(0,0,0,0.0)`,
            }}
          >
            <motion.img
              src={current.image}
              alt={current.title}
              animate={!disableRotation && isInView ? { rotate: 360, scale: 1 } : { rotate: 0, scale: 1 }}
              transition={!disableRotation && isInView
                ? { duration: 35, repeat: Infinity, ease: 'linear' }
                : { duration: 0 }}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'center center',
                display: 'block',
                transformOrigin: '50% 50%',
                pointerEvents: 'none',
              }}
            />
          </motion.div>
        </AnimatePresence>

        {/* ── BOTTOM-LEFT: Title + Description ─────────────────────────────── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`info-${activeIdx}`}
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.65, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: 'absolute',
              bottom: isMobile ? '6%' : '6%',
              left: isMobile ? '3%' : '1.5%',
              maxWidth: isMobile ? '38%' : '32%',
              zIndex: 5,
            }}
          >
            {/* Label */}
            <motion.p style={{
              margin: '0 0 7px',
              fontSize: isMobile ? '10px' : '12px',
              fontWeight: 700,
              letterSpacing: '1.8px',
              textTransform: 'uppercase',
              color: current.accentColor,
              opacity: 0.9,
            }}>
              {current.label}
            </motion.p>

            {/* Title */}
            <motion.h2 style={{
              margin: '0 0 12px',
              fontSize: isMobile ? '24px' : isTablet ? '28px' : '34px',
              fontWeight: 900,
              color: '#ffffff',
              lineHeight: 1.1,
              letterSpacing: '-0.5px',
              wordBreak: 'break-word',
            }}>
              {current.title}
            </motion.h2>

            {/* Description — small, free-floating, no border */}
            <motion.p style={{
              margin: 0,
              fontSize: isMobile ? '10px' : '13px',
              color: 'rgba(255,255,255,0.65)',
              lineHeight: 1.5,
              fontWeight: 400,
              wordBreak: 'break-word',
              overflowWrap: 'break-word',
              hyphens: 'auto',
            }}>
              {current.desc}
            </motion.p>

            {/* Stats row */}
            <motion.div style={{
              display: 'flex',
              gap: isMobile ? '6px' : '8px',
              marginTop: isMobile ? '10px' : '14px',
              flexWrap: 'wrap',
            }}>
              {[
                { icon: <MdAccessTime />, val: current.time },
                { icon: <FaFire />, val: current.kcal },
                { icon: <BsPeopleFill />, val: current.serves },
              ].map(({ icon, val }) => (
                <span key={val} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                  fontSize: isMobile ? '9px' : '12px',
                  color: '#fff',
                  background: `${current.accentColor}30`,
                  border: `1px solid ${current.accentColor}55`,
                  backdropFilter: 'blur(8px)',
                  padding: isMobile ? '4px 8px' : '5px 10px',
                  borderRadius: '20px',
                  fontWeight: 600,
                }}>
                  {icon} {val}
                </span>
              ))}
            </motion.div>

            {/* View Recipe button */}
            {(() => {
              const navigatePath = current.legacyId && current.slug
                ? `/recipes/${current.legacyId}/${current.slug}`
                : `/recipes/${(current._id || current.id || current.recipeId || current.contentId)?.toString()}`;
              return (
                <motion.button
                  data-current-id={current.legacyId || (current._id || current.id)?.toString()}
                  onClick={() => navigate(navigatePath)}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  style={{
                    marginTop: isMobile ? '10px' : '18px',
                    background: current.accentColor,
                    color: '#fff',
                    border: 'none',
                    padding: isMobile ? '8px 16px' : '12px 26px',
                    borderRadius: '10px',
                    fontSize: isMobile ? '12px' : '14px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: `0 8px 24px ${current.accentColor}55`,
                    transition: 'box-shadow 0.3s ease',
                  }}
                >
                  View Recipe <FaArrowRight />
                </motion.button>
              );
            })()}


            {/* Mobile/Tablet: Dots Indicator below View Recipe */}
            {isTablet && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={isInView ? { opacity: 1 } : { opacity: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                style={{
                  display: 'flex',
                  gap: '8px',
                  alignItems: 'center',
                  marginTop: isMobile ? '16px' : '22px',
                }}
              >
                {slides.map((_, i) => (
                  <motion.button
                    key={i}
                    onClick={() => setActiveIdx(i)}
                    animate={{
                      width: i === activeIdx ? '26px' : '8px',
                      opacity: i === activeIdx ? 1 : 0.4,
                      background: i === activeIdx ? current.accentColor : 'rgba(255,255,255,0.4)',
                    }}
                    transition={{ duration: 0.3 }}
                    style={{
                      height: '8px',
                      borderRadius: '4px',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  />
                ))}
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>



        {/* ── TOP-RIGHT: Dots Indicators (Desktop Only) ─────────────────────────────────── */}
        {!isTablet && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            style={{
              position: 'absolute',
              top: isMobile ? '20px' : '-25px',
              right: isMobile ? '16px' : '24px',
              display: 'flex',
              gap: '8px',
              alignItems: 'center',
              zIndex: 5,
            }}
          >
            {slides.map((_, i) => (
              <motion.button
                key={i}
                onClick={() => setActiveIdx(i)}
                animate={{
                  width: i === activeIdx ? '26px' : '8px',
                  opacity: i === activeIdx ? 1 : 0.4,
                  background: i === activeIdx ? current.accentColor : 'rgba(255,255,255,0.4)',
                }}
                transition={{ duration: 0.3 }}
                style={{
                  height: '8px',
                  borderRadius: '4px',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                }}
              />
            ))}
          </motion.div>
        )}

        {/* ── BOTTOM-RIGHT: Glassmorphism Pill Navigation ───────────────────── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
          style={{
            position: 'absolute',
            bottom: isMobile ? '4%' : '8%',
            right: isMobile ? '3%' : '5%',
            display: 'flex',
            alignItems: 'center',
            zIndex: 5,
            /* Pill container */
            background: 'rgba(255, 255, 255, 0.10)',
            backdropFilter: 'blur(14px)',
            WebkitBackdropFilter: 'blur(14px)',
            border: `1px solid ${current.accentColor}55`,
            borderRadius: '999px',
            padding: isMobile ? '4px' : '6px',
            gap: isMobile ? '4px' : '6px',
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
              width: isMobile ? '40px' : '48px',
              height: isMobile ? '40px' : '48px',
              borderRadius: '50%',
              border: 'none',
              background: 'rgba(255,255,255,0.00)',
              color: '#fff',
              fontSize: isMobile ? '18px' : '22px',
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
              width: isMobile ? '40px' : '48px',
              height: isMobile ? '40px' : '48px',
              borderRadius: '50%',
              border: 'none',
              background: 'rgba(255,255,255,0.00)',
              color: '#fff',
              fontSize: isMobile ? '18px' : '22px',
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
      </div>
    </motion.section>
  );
}

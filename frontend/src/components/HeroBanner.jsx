import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateSlug } from '../utils/theme';
import ReactCountryFlag from 'react-country-flag';

export default function HeroBanner({
  category = "Chef's Special",
  countryCode,
  title = "Smoked BBQ Platter",
  quote = "Food is symbolic of love when words are inadequate.",
  description = "Experience the art of slow-smoked perfection, crafted with passion.",
  image = "",
  accentColor = "#e8b84b",
  recipeId = "1",
  hideDescriptionUntilDesktop = false
}) {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  const [width, setWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Responsive breakpoints
  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;
  const isDesktop = width >= 1024;

  // Responsive dimensions
  const bannerWidth = isMobile ? '100%' : isTablet ? '100%' : '100%';
  const bannerHeight = isMobile ? '400px' : isTablet ? '500px' : '600px';
  const topLeftFontSize = isMobile ? '12px' : isTablet ? '13px' : '14px';
  const topLeftTitleSize = isMobile ? '24px' : isTablet ? '28px' : '36px';
  const bottomQuoteSize = isMobile ? '20px' : isTablet ? '26px' : '32px';
  const bottomDescSize = isMobile ? '14px' : isTablet ? '16px' : '18px';
  const topLeftPadding = isMobile ? '12px 16px' : isTablet ? '14px 20px' : '16px 24px';
  const bottomPadding = isMobile ? '20px 24px' : isTablet ? '24px 32px' : '32px 40px';
  const hasImage = Boolean(image);
  const hasRecipe = Boolean(recipeId && recipeId !== "coming-soon");

  const handleBannerClick = () => {
    if (!hasRecipe) return;
    navigate(`/recipes/${recipeId}/${generateSlug(title)}`);
  };

  return (
    <div
      onClick={handleBannerClick}
      style={{
        position: 'relative',
        width: bannerWidth,
        height: bannerHeight,
        overflow: 'hidden',
        borderRadius: '24px',
        margin: '0 auto 40px auto',
        transition: 'all 0.3s ease',
        cursor: hasRecipe ? 'pointer' : 'default',
      }}>
      {/* Background Image */}
      {hasImage ? (
        <img
          src={image}
          alt={title}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            position: 'absolute',
            top: 0,
            left: 0,
            zIndex: 1,
          }}
        />
      ) : (
        <div
          aria-label={title}
          style={{
            width: '100%',
            height: '100%',
            position: 'absolute',
            top: 0,
            left: 0,
            zIndex: 1,
            background: `linear-gradient(135deg, rgba(0,0,0,0.82), ${accentColor}55)`,
          }}
        />
      )}

      {/* Dark Overlay */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'linear-gradient(to bottom, rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.6))',
        zIndex: 2,
      }} />

      {/* Static Hero Text - Top Left */}
      <div style={{
        position: 'absolute',
        top: isMobile ? '20px' : isTablet ? '24px' : '40px',
        left: isMobile ? '16px' : isTablet ? '20px' : '40px',
        zIndex: 3,
        background: 'rgba(255, 255, 255, 0.08)',
        backdropFilter: 'blur(15px)',
        WebkitBackdropFilter: 'blur(15px)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        borderRadius: '16px',
        padding: topLeftPadding,
        transition: 'all 0.3s ease',
      }}>
        <p style={{
          margin: '0 0 4px 0',
          fontWeight: '600',
          color: accentColor,
          fontSize: topLeftFontSize,
          letterSpacing: '0.5px',
        }}>
          {countryCode && <ReactCountryFlag countryCode={countryCode} svg style={{ marginRight: '8px' }} />}
          {category}
        </p>
        <h1 style={{
          margin: 0,
          fontSize: topLeftTitleSize,
          fontWeight: '700',
          color: '#fff',
          lineHeight: '1.2',
        }}>
          {title}
        </h1>
      </div>

      {/* Hero Overlay - Center Content */}
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          position: 'absolute',
          bottom: isMobile ? '20px' : isTablet ? '24px' : '40px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 3,
          maxWidth: isMobile ? '100%' : isTablet ? '650px' : '800px',
          width: isMobile ? '90%' : '90%',
          background: isHovered
            ? 'rgba(255, 255, 255, 0.12)'
            : 'rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(15px)',
          WebkitBackdropFilter: 'blur(15px)',
          border: isHovered
            ? '1px solid rgba(255, 255, 255, 0.25)'
            : '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '20px',
          padding: bottomPadding,
          textAlign: 'center',
          transition: 'all 0.3s ease',
          boxShadow: isHovered
            ? `0 20px 40px rgba(0,0,0,0.6)`
            : '0 10px 30px rgba(0,0,0,0.3)',
        }}
      >
        <h2 style={{
          margin: '0 0 16px 0',
          fontSize: bottomQuoteSize,
          fontWeight: '800',
          color: '#fff',
          lineHeight: '1.3',
          fontStyle: 'italic',
        }}>
          "{quote}"
        </h2>

        {/* Description visibility logic based on props & screen size */}
        {(!hideDescriptionUntilDesktop || (hideDescriptionUntilDesktop && isDesktop)) && (
          <p style={{
            margin: 0,
            fontSize: bottomDescSize,
            color: 'rgba(255, 255, 255, 0.85)',
            lineHeight: '1.6',
            maxWidth: '600px',
            marginLeft: 'auto',
            marginRight: 'auto',
          }}>
            {description}
          </p>
        )}
      </div>

      {/* Hover visual cue border */}
      <div style={{
        position: 'absolute',
        inset: 0,
        border: isHovered ? `2px solid ${accentColor}` : '2px solid transparent',
        borderRadius: '24px',
        pointerEvents: 'none',
        transition: 'border 0.4s ease',
        zIndex: 10,
      }} />
    </div>
  );
}

import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import DefaultAvatar, { DEFAULT_AVATAR_URL } from './common/DefaultAvatar';

export default function NavbarLanding({ scrolled: externalScrolled, sliderColor = '#e8b84b' }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [width, setWidth] = useState(window.innerWidth);
  const [internalScrolled, setInternalScrolled] = useState(false);

  // Get username from localStorage as fallback
  const storedUser = (() => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  })();
  const activeUser = user || storedUser;
  const username = activeUser?.name || "User";
  const profileImage = user?.profileImage?.trim()
    ? user.profileImage
    : storedUser?.profileImage?.trim()
      ? storedUser.profileImage
      : DEFAULT_AVATAR_URL;

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    const handleScroll = () => setInternalScrolled(window.scrollY > 10);
    handleScroll();
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const scrolled = externalScrolled || internalScrolled;
  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;
  const isDesktop = width >= 1024;
  const isCompact = isMobile || isTablet;
  const isLandingPage = location.pathname === '/';

  const handleStartHereClick = () => {
    navigate('/register');
    setIsMobileMenuOpen(false);
  };

  const startHereButtonStyle = {
    background: sliderColor,
    border: '1px solid rgba(255,255,255,0.2)',
    padding: isMobile ? '8px 16px' : '15px 24px',
    borderRadius: '100px',
    color: '#fff',
    fontSize: isMobile ? 12 : 16,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'background 1.2s ease, box-shadow 1.2s ease, transform 0.3s ease',
    boxShadow: `0 4px 15px ${sliderColor}66`,
    outline: 'none',
    whiteSpace: 'nowrap',
  };

  // Navigation Logic 
  const handleHomeClick = () => {
    if (activeUser) {
      navigate('/home');
    } else {
      if (isLandingPage) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        navigate('/');
      }
    }
    setIsMobileMenuOpen(false);
  };

  const handleRecipesClick = () => {
    if (activeUser) {
      navigate('/my-recipes');
    } else {
      if (isLandingPage) {
        const cardsSection = document.getElementById('food-cards-section');
        if (cardsSection) {
          cardsSection.scrollIntoView({ behavior: 'smooth' });
        }
      } else {
        navigate('/');
      }
    }
    setIsMobileMenuOpen(false);
  };

  const handleAboutClick = () => {
    if (activeUser) {
      navigate('/about');
    } else {
      if (isLandingPage) {
        const aboutSection = document.getElementById('about-section');
        if (aboutSection) {
          aboutSection.scrollIntoView({ behavior: 'smooth' });
        } else {
          navigate('/about');
        }
      } else {
        navigate('/about');
      }
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      padding: scrolled ? '0' : '16px 16px 0 16px',
      transition: 'padding 0.4s ease',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      width: '100%',
      boxSizing: 'border-box',
    }}>
      <motion.nav
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: isCompact ? '2px 16px' : '2px 38px',
          backdropFilter: 'blur(10px) saturate(200%)',
          WebkitBackdropFilter: 'blur(10px) saturate(200%)',
          background: 'rgba(255, 255, 255, 0.15)',
          border: scrolled ? 'none' : '1px solid rgba(255, 255, 255, 0.2)',
          outline: scrolled ? 'none' : '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: 'none',
          width: '100%',
          maxWidth: '1600px',
          borderRadius: scrolled ? '0' : '8px',
          transition: 'border-radius 0.4s ease, border 0.4s ease',
          position: 'relative',
        }}
        initial={{ opacity: 0, y: -18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.0, ease: 'easeOut' }}
      >
        {/* ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ Left: Logo ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ */}
        <button
          onClick={() => navigate('/')}
          style={{
            background: 'none',
            border: 'none',
            padding: 18,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            outline: 'none',
          }}
        >
          <p style={{
            fontSize: isMobile ? 19 : 29,
            fontWeight: 100,
            margin: -15,
            letterSpacing: '0.7px',
            color: '#fff',
            whiteSpace: 'nowrap',
          }}>
            <span style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: 900 }}>Recipe.IO</span>
          </p>
        </button>

        {/* ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ Center: Navigation Links (Desktop Only) ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ */}
        {isDesktop && (
          <div style={{
            display: 'flex',
            gap: '200px',
            alignItems: 'center',
            flex: 1,
            justifyContent: 'center',
          }}>
            <button
              onClick={handleHomeClick}
              style={{
                background: 'none',
                border: 'none',
                color: '#fff',
                fontSize: 16,
                fontWeight: 500,
                cursor: 'pointer',
                padding: '8px 16px',
                borderRadius: '6px',
                transition: 'all 0.3s ease',
                outline: 'none',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
            >
              Home
            </button>

            <button
              onClick={handleAboutClick}
              style={{
                background: 'none',
                border: 'none',
                color: '#fff',
                fontSize: 16,
                fontWeight: 500,
                cursor: 'pointer',
                padding: '8px 16px',
                borderRadius: '6px',
                transition: 'all 0.3s ease',
                outline: 'none',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
            >
              About
            </button>

            <button
              onClick={handleRecipesClick}
              style={{
                background: 'none',
                border: 'none',
                color: '#fff',
                fontSize: 16,
                fontWeight: 500,
                cursor: 'pointer',
                padding: '8px 16px',
                borderRadius: '6px',
                transition: 'all 0.3s ease',
                outline: 'none',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
            >
              Recipes
            </button>
          </div>
        )}

        {/* ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ Right: Profile/Start Here + Mobile Menu Toggle ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ */}
        <div style={{
          display: 'flex',
          gap: isMobile ? 8 : 16,
          alignItems: 'center',
        }}>
          {activeUser ? (
            <div
              onClick={() => navigate('/profile')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: isCompact ? '6px' : '15px',
                cursor: 'pointer',
                padding: isCompact ? '3px' : '3px 20px 3px 2px',
                borderRadius: '100px',
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'rgba(255,255,255,0.08)',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.14)';
                e.currentTarget.style.border = '1px solid rgba(255,255,255,0.35)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                e.currentTarget.style.border = '1px solid rgba(255,255,255,0.2)';
              }}
            >
              <div style={{ position: 'relative' }}>
                <DefaultAvatar
                  src={profileImage}
                  alt="Profile"
                  size={isCompact ? 42 : 52}
                  style={{
                    border: '2px solid rgba(255, 255, 255, 0.3)',
                    display: 'block',
                  }}
                />
                <div style={{
                  position: 'absolute',
                  bottom: '1px',
                  right: '3px',
                  width: isCompact ? '8px' : '11px',
                  height: isCompact ? '8px' : '11px',
                  borderRadius: '50%',
                  background: '#34C759',
                  border: '2px solid rgba(0, 0, 0, 0.8)',
                }} />
              </div>
              {isDesktop && (
                <span style={{
                  color: '#fff',
                  fontSize: '15px',
                  fontWeight: '600',
                  whiteSpace: 'nowrap',
                }}>
                  {username}
                </span>
              )}
            </div>
          ) : (
            isDesktop && (
              <button
                onClick={handleStartHereClick}
                style={startHereButtonStyle}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = `0 6px 20px ${sliderColor}99`;
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = `0 4px 15px ${sliderColor}66`;
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                Start Here
              </button>
            )
          )}

          {/* ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ Mobile Hamburger Icon ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ */}
          {isCompact && (
            <motion.button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#fff',
                cursor: 'pointer',
                padding: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="6" x2="21" y2="6"
                  style={{
                    transform: isMobileMenuOpen ? 'rotate(45deg) translate(8px, 8px)' : 'none',
                    transformOrigin: 'center',
                    transition: 'transform 0.3s ease',
                  }} />
                <line x1="3" y1="12" x2="21" y2="12"
                  style={{ opacity: isMobileMenuOpen ? 0 : 1, transition: 'opacity 0.3s ease' }} />
                <line x1="3" y1="18" x2="21" y2="18"
                  style={{
                    transform: isMobileMenuOpen ? 'rotate(-45deg) translate(8px, -8px)' : 'none',
                    transformOrigin: 'center',
                    transition: 'transform 0.3s ease',
                  }} />
              </svg>
            </motion.button>
          )}
        </div>
      </motion.nav>

      {/* ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ Mobile Menu Dropdown (Nav Items Only) ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ */}
      {isCompact && (
        <motion.div
          initial={{ opacity: 0, y: -10, scaleY: 0.95 }}
          animate={isMobileMenuOpen ? { opacity: 1, y: 0, scaleY: 1 } : { opacity: 0, y: -10, scaleY: 0.95 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            left: 0,
            background: 'rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(30px)',
            WebkitBackdropFilter: 'blur(30px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderTop: 'none',
            borderRadius: '0 0 12px 12px',
            padding: '16px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            zIndex: 999,
            transformOrigin: 'top',
            pointerEvents: isMobileMenuOpen ? 'auto' : 'none',
          }}
        >
          <button
            onClick={handleHomeClick}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.3)',
              padding: '12px 20px',
              borderRadius: '8px',
              color: '#fff',
              fontSize: 15,
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              width: '100%',
              textAlign: 'left',
            }}
          >
            Home
          </button>

          <button
            onClick={handleAboutClick}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.3)',
              padding: '12px 20px',
              borderRadius: '8px',
              color: '#fff',
              fontSize: 15,
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              width: '100%',
              textAlign: 'left',
            }}
          >
            About
          </button>

          <button
            onClick={handleRecipesClick}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.3)',
              padding: '12px 20px',
              borderRadius: '8px',
              color: '#fff',
              fontSize: 15,
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              width: '100%',
              textAlign: 'left',
            }}
          >
            Recipes
          </button>

          {!activeUser && (
            <button
              onClick={handleStartHereClick}
              style={{ ...startHereButtonStyle, width: '100%' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = `0 6px 20px ${sliderColor}99`;
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = `0 4px 15px ${sliderColor}66`;
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              Start Here
            </button>
          )}
        </motion.div>
      )}

      <style>{`
        button:focus, button:focus-visible {
          outline: none !important;
        }
      `}</style>
    </div>
  );
}

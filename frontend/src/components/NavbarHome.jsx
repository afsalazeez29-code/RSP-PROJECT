import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import DefaultAvatar, { DEFAULT_AVATAR_URL } from './common/DefaultAvatar';
import { searchGlobal } from '../services/api';
import { CiSearch } from 'react-icons/ci';
import {
  AccountIcon,
  CreateIcon,
  DashboardIcon,
  HomeIcon,
  LogoutIcon,
  RecipesIcon,
  SavedIcon,
} from './Sidebar';

function SearchIcon() {
  return <CiSearch size={18} aria-hidden="true" />;
}

// ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ Mobile menu nav items mirror Sidebar menuItems ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬
const mobileNavItems = [
  { label: 'Home', path: '/home', icon: <HomeIcon /> },
  { label: 'My Recipes', path: '/my-recipes', icon: <RecipesIcon /> },
  { label: 'Saved Recipes', path: '/favourites', icon: <SavedIcon /> },
  { label: 'Create Recipe', path: '/add-recipe', icon: <CreateIcon /> },
  { label: 'Dashboard', path: '/dashboard', icon: <DashboardIcon /> },
  { label: 'Account', path: '/profile', icon: <AccountIcon /> },
];

export default function NavbarHome() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [width, setWidth] = useState(window.innerWidth);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchResults, setSearchResults] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchAreaRef = useRef(null);

  // Get username from localStorage as fallback
  const storedUser = (() => {
    try { return JSON.parse(localStorage.getItem('user')); }
    catch { return null; }
  })();
  const username = user?.name || storedUser?.name || 'User';
  const profileImage = user?.profileImage?.trim()
    ? user.profileImage
    : storedUser?.profileImage?.trim()
      ? storedUser.profileImage
      : DEFAULT_AVATAR_URL;

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tagQuery = params.get('search');
    if (tagQuery) {
      setSearchQuery(tagQuery);
      setSearchFocused(true);
    }
  }, [location.search]);

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    const handleScroll = () => setScrolled(window.scrollY > 10);
    handleScroll();
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  useEffect(() => {
    const query = searchQuery.trim();
    if (!query || query.length < 2) {
      setSearchResults(null);
      setSearchOpen(false);
      setSearchLoading(false);
      return;
    }

    if (!isAuthenticated) {
      setSearchResults(null);
      setSearchOpen(false);
      return;
    }

    let cancelled = false;
    setSearchLoading(true);

    const timer = setTimeout(async () => {
      try {
        const response = await searchGlobal(query);
        if (cancelled) return;
        const data = response?.data || {};
        setSearchResults({
          recipes: Array.isArray(data.recipes) ? data.recipes : [],
          users: Array.isArray(data.users) ? data.users : [],
        });
        setSearchOpen(true);
      } catch {
        if (!cancelled) {
          setSearchResults({ recipes: [], users: [] });
          setSearchOpen(true);
        }
      } finally {
        if (!cancelled) setSearchLoading(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [searchQuery, isAuthenticated]);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (searchAreaRef.current && !searchAreaRef.current.contains(event.target)) {
        setSearchOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setSearchOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;
  const isDesktop = width >= 1024;
  const isCompact = isMobile || isTablet;

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;

    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const firstRecipe = searchResults?.recipes?.[0];
    if (firstRecipe?._id || firstRecipe?.id) {
      navigate(`/recipe/${firstRecipe._id || firstRecipe.id}`);
    } else {
      navigate(`/home?search=${encodeURIComponent(query)}`);
    }

    setSearchQuery('');
    setSearchOpen(false);
    setMobileMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const renderSearchDropdown = () => {
    if (!searchOpen || !searchQuery.trim() || !isAuthenticated) return null;

    const recipes = searchResults?.recipes || [];
    const users = searchResults?.users || [];
    const hasResults = recipes.length > 0 || users.length > 0;
    const thumbSize = isMobile ? 36 : isTablet ? 40 : isDesktop ? 48 : 44;

    const rowStyle = {
      width: '100%',
      border: 'none',
      background: 'transparent',
      color: '#fff',
      textAlign: 'left',
      padding: '9px 12px',
      borderRadius: '8px',
      cursor: 'pointer',
      fontFamily: 'Poppins, sans-serif',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
    };

    return (
      <div style={{
        position: 'absolute',
        top: 'calc(100% + 8px)',
        left: 0,
        right: 0,
        zIndex: 1200,
        padding: '10px',
        borderRadius: '12px',
        border: '1px solid rgba(255,255,255,0.16)',
        background: 'rgba(10,10,10,0.96)',
        boxShadow: '0 18px 40px rgba(0,0,0,0.35)',
      }}>
        {searchLoading ? (
          <div style={{ color: 'rgba(255,255,255,0.7)', padding: '10px 12px', fontSize: '13px' }}>Searching...</div>
        ) : !hasResults ? (
          <div style={{ color: 'rgba(255,255,255,0.7)', padding: '10px 12px', fontSize: '13px' }}>No matches found.</div>
        ) : (
          <>
            {recipes.slice(0, 5).map((recipe) => {
              const recipeId = recipe.recipeId || recipe._id || recipe.id;
              return (
                <button
                  key={`recipe-${recipeId}`}
                  type="button"
                  onClick={() => {
                    navigate(`/recipe/${recipeId}`);
                    setSearchQuery('');
                    setSearchOpen(false);
                    setMobileMenuOpen(false);
                  }}
                  style={rowStyle}
                >
                  <img src={recipe.imageUrl || recipe.image} alt="" style={{ width: thumbSize, height: thumbSize, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />
                  <div style={{ minWidth: 0 }}>
                    <strong style={{ display: 'block', fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{recipe.title}</strong>
                    <span style={{ display: 'block', color: 'rgba(255,255,255,0.6)', fontSize: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {recipe.description || recipe.category || 'Recipe'}
                    </span>
                    <span style={{ color: '#e8b84b', fontSize: '11px', fontWeight: 700 }}>Recipe</span>
                  </div>
                </button>
              );
            })}

            {users.slice(0, 3).map((person) => {
              const personId = person._id || person.id;
              return (
                <button
                  key={`user-${personId}`}
                  type="button"
                  onClick={() => {
                    navigate(`/profile/${person.username}`);
                    setSearchQuery('');
                    setSearchOpen(false);
                    setMobileMenuOpen(false);
                  }}
                  style={rowStyle}
                >
                  <img src={person.profileImage || DEFAULT_AVATAR_URL} alt="" style={{ width: thumbSize, height: thumbSize, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />
                  <div style={{ minWidth: 0 }}>
                    <strong style={{ display: 'block', fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{person.fullName || person.name || person.username}</strong>
                    <span style={{ display: 'block', color: 'rgba(255,255,255,0.6)', fontSize: '12px' }}>@{person.username}</span>
                    <span style={{ color: '#e8b84b', fontSize: '11px', fontWeight: 700 }}>User</span>
                  </div>
                </button>
              );
            })}
          </>
        )}
      </div>
    );
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      padding: (scrolled || isDesktop) ? '0' : '12px 16px 0 16px',
      transition: isDesktop ? 'none' : 'padding 0.4s ease',
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
          padding: isCompact ? '4px 16px' : '12px 28px',
          backdropFilter: 'blur(20px) saturate(200%)',
          WebkitBackdropFilter: 'blur(20px) saturate(200%)',
          background: 'rgba(255, 255, 255, 0.08)',
          border: (scrolled || isDesktop) ? 'none' : '1px solid rgba(255, 255, 255, 0.2)',
          outline: '1px solid rgba(255, 255, 255, 0.15)',
          boxShadow: 'none',
          width: '100%',
          maxWidth: '1600px',
          borderRadius: (scrolled || isDesktop) ? '0' : '9px',
          transition: isDesktop ? 'none' : 'border-radius 0.4s ease, border 0.4s ease',
          position: 'relative',
          gap: isCompact ? '8px' : '24px',
          minHeight: isCompact ? '56px' : '60px',
        }}
        initial={isDesktop ? { opacity: 1, y: 0 } : { opacity: 0, y: -18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: isDesktop ? 0 : 0.6, ease: 'easeOut' }}
      >
        {/* ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ Left: Logo ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ */}
        <button
          onClick={() => navigate('/landing')}
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            outline: 'none',
            flexShrink: 0,
          }}
        >
          <p style={{
            fontSize: isMobile ? 19 : 29,
            fontWeight: 100,
            margin: -2,
            letterSpacing: '0.6px',
            color: '#fff',
            whiteSpace: 'nowrap',
          }}>
            <span style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: 900 }}>Recipe.IO</span>
          </p>
        </button>

        {/* ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ Center: Search Bar (hidden on mobile ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â moved to drawer) ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ */}
        {!isCompact && (
          <form
            onSubmit={handleSearchSubmit}
            ref={searchAreaRef}
            style={{ flex: 1, maxWidth: '450px', position: 'relative' }}
          >
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <div style={{
                position: 'absolute', left: '14px', display: 'flex', alignItems: 'center',
                color: searchFocused ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.6)',
                transition: isDesktop ? 'none' : 'color 0.3s ease',
              }}>
                <SearchIcon />
              </div>
              <input
                type="text"
                placeholder="Search recipes, ingredients, cuisine..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                style={{
                  width: '100%',
                  padding: '10px 18px 10px 44px',
                  background: searchFocused ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)',
                  border: `1px solid ${searchFocused ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.2)'}`,
                  borderRadius: '100px',
                  color: '#fff',
                  fontSize: '14px',
                  outline: 'none',
                  transition: isDesktop ? 'none' : 'all 0.3s ease',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                }}
              />
            </div>
            {renderSearchDropdown()}
          </form>
        )}

        {/* ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ Right: Profile pill + Mobile hamburger ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ */}
        <div style={{ display: 'flex', alignItems: 'center', gap: isCompact ? '4px' : '16px', flexShrink: 0 }}>
          {/* Profile pill */}
          <div
            onClick={() => navigate('/profile')}
            style={{
              display: 'flex', alignItems: 'center',
              gap: isCompact ? '6px' : '15px', cursor: 'pointer',
              padding: isCompact ? '3px 3px 3px 3px' : '2px 20px 2px 2px',
              borderRadius: '100px', border: '1px solid rgba(255,255,255,0.2)',
              background: 'rgba(255,255,255,0.08)',
              transition: isDesktop ? 'none' : 'all 0.3s ease',
              position: 'relative',
            }}
            onMouseEnter={(e) => {
              if (!isDesktop) {
                e.currentTarget.style.background = 'rgba(255,255,255,0.14)';
                e.currentTarget.style.border = '1px solid rgba(255,255,255,0.35)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isDesktop) {
                e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                e.currentTarget.style.border = '1px solid rgba(255,255,255,0.2)';
              }
            }}
          >
            <div style={{ position: 'relative' }}>
              <DefaultAvatar
                src={profileImage}
                alt="Profile"
                size={isCompact ? 36 : 45}
                style={{
                  border: '2px solid rgba(255,255,255,0.3)',
                  display: 'block',
                }}
              />
              <div style={{
                position: 'absolute', bottom: '1px', right: '3px',
                width: isCompact ? '8px' : '11px', height: isCompact ? '8px' : '11px',
                borderRadius: '50%', background: '#34C759',
                border: '2px solid rgba(0,0,0,0.8)',
              }} />
            </div>
            {isDesktop && (
              <span style={{ color: '#fff', fontSize: '13px', fontWeight: '600', whiteSpace: 'nowrap' }}>
                {username}
              </span>
            )}
          </div>

          {/* ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ Mobile Hamburger ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ */}
          {isCompact && (
            <motion.button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              whileTap={{ scale: 0.92 }}
              aria-label="Toggle menu"
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '8px',
                color: '#fff',
                cursor: 'pointer',
                padding: '8px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                outline: 'none',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                {mobileMenuOpen ? (
                  <>
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </>
                ) : (
                  <>
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <line x1="3" y1="12" x2="21" y2="12" />
                    <line x1="3" y1="18" x2="21" y2="18" />
                  </>
                )}
              </svg>
            </motion.button>
          )}
        </div>
      </motion.nav>

      {/* ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ Mobile Slide-Down Drawer (search + nav items) ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ */}
      <AnimatePresence>
        {isCompact && mobileMenuOpen && (
          <motion.div
            key="mobile-drawer"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            style={{
              overflow: 'hidden',
              background: 'rgba(10, 10, 10, 0.9)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              borderTop: '1px solid rgba(255,255,255,0.1)',
              zIndex: 999,
              width: '100%',
            }}
          >
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* Search bar inside drawer */}
              <form ref={searchAreaRef} onSubmit={handleSearchSubmit} style={{ position: 'relative' }}>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <div style={{ position: 'absolute', left: '14px', color: 'rgba(255,255,255,0.5)', display: 'flex' }}>
                    <SearchIcon />
                  </div>
                  <input
                    type="text"
                    placeholder="Search recipes, ingredients..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 16px 10px 42px',
                      background: 'rgba(255,255,255,0.1)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '100px',
                      color: '#fff',
                      fontSize: '14px',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                {renderSearchDropdown()}
              </form>

              {/* Sidebar nav items */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
                {mobileNavItems.map((item) => (
                  <button
                    key={item.path}
                    onClick={() => { navigate(item.path); setMobileMenuOpen(false); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '12px',
                      padding: '12px 16px',
                      background: 'rgba(255,255,255,0.07)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: '10px',
                      color: '#fff',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      textAlign: 'left',
                      width: '100%',
                      outline: 'none',
                      fontFamily: 'Poppins, sans-serif',
                    }}
                  >
                    <span style={{
                      minWidth: '40px',
                      minHeight: '40px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      {item.icon}
                    </span>
                    {item.label}
                  </button>
                ))}

                {/* Logout */}
                <button
                  onClick={handleLogout}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '12px 16px',
                    background: 'rgba(239,68,68,0.1)',
                    border: '1px solid rgba(239,68,68,0.3)',
                    borderRadius: '10px',
                    color: '#ef4444',
                    fontSize: '14px', fontWeight: '500',
                    cursor: 'pointer', textAlign: 'left',
                    width: '100%', outline: 'none',
                    fontFamily: 'Poppins, sans-serif',
                    marginTop: '4px',
                  }}
                >
                  <span style={{
                    minWidth: '40px',
                    minHeight: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <LogoutIcon />
                  </span>
                  Logout
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        button:focus, button:focus-visible { outline: none !important; }
        input::placeholder { color: rgba(255,255,255,0.5); }
      `}</style>
    </div>
  );
}



import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { LuHouse, LuUtensils, LuBookmark, LuCirclePlus, LuLayoutGrid, LuCircleUser, LuLogOut } from 'react-icons/lu';
import { useAuth } from '../context/AuthContext';

const navIconProps = {
  size: 24,
  'aria-hidden': 'true',
  style: { minWidth: '24px', minHeight: '24px', flexShrink: 0 },
};

export function HomeIcon() {
  return <LuHouse {...navIconProps} />;
}

export function RecipesIcon() {
  return <LuUtensils {...navIconProps} />;
}

export function CreateIcon() {
  return <LuCirclePlus {...navIconProps} />;
}

export function SavedIcon() {
  return <LuBookmark {...navIconProps} />;
}

export function DashboardIcon() {
  return <LuLayoutGrid {...navIconProps} />;
}

export function AccountIcon() {
  return <LuCircleUser {...navIconProps} />;
}

export function LogoutIcon() {
  return <LuLogOut {...navIconProps} />;
}

export default function Sidebar({ sidebarOpen }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const [width, setWidth] = useState(window.innerWidth);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (sidebarOpen !== undefined) {
      setMobileOpen(sidebarOpen);
    }
  }, [sidebarOpen]);

  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const menuItems = [
    { icon: <HomeIcon />, label: 'Home', path: '/home' },
    { icon: <RecipesIcon />, label: 'My Recipes', path: '/my-recipes' },
    { icon: <SavedIcon />, label: 'Saved Recipes', path: '/favourites' },
    { icon: <CreateIcon />, label: 'Create Recipe', path: '/add-recipe' },
    { icon: <DashboardIcon />, label: 'Dashboard', path: '/dashboard' },
    { icon: <AccountIcon />, label: 'Account', path: '/profile' },
  ];

  const isActive = (path) => location.pathname === path;

  // For mobile only (<768px): don't render sidebar Ã¢â‚¬â€ handled by toggle menu
  if (isMobile || isTablet) {
    return null;
  }

  return (
    <>
      {/* Fixed Sidebar (Desktop) */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        style={{
          position: 'fixed',
          left: 0,
          top: '76px', // Adjust based on navbar height
          width: '250px',
          height: 'calc(100vh - 76px)',
          background: 'rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(20px) saturate(200%)',
          WebkitBackdropFilter: 'blur(20px) saturate(200%)',
          borderRight: '1px solid rgba(255, 255, 255, 0.15)',
          padding: '24px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          overflowY: 'auto',
          zIndex: 10,
          boxSizing: 'border-box',
        }}
      >
        {/* Menu Items */}
        {menuItems.map((item, index) => (
          <motion.button
            className="menu-item"
            key={item.path}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: index * 0.08 }}
            onClick={() => navigate(item.path)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              background: isActive(item.path)
                ? 'rgba(232, 184, 75, 0.2)'
                : 'rgba(255, 255, 255, 0.05)',
              border: isActive(item.path)
                ? '1px solid rgba(232, 184, 75, 0.5)'
                : '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '10px',
              color: isActive(item.path) ? '#e8b84b' : '#fff',
              fontSize: '14px',
              fontWeight: isActive(item.path) ? '600' : '500',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              outline: 'none',
              textAlign: 'left',
            }}
            onMouseEnter={(e) => {
              if (!isActive(item.path)) {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.2)';
                e.currentTarget.style.transform = 'translateX(4px)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive(item.path)) {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.transform = 'translateX(0)';
              }
            }}
          >
            <div className="icon-wrap">
              {item.icon}
            </div>
            <span>{item.label}</span>
          </motion.button>
        ))}

        {/* Logout Button */}
        <motion.button
          className="menu-item"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: menuItems.length * 0.08 }}
          onClick={handleLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 16px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '10px',
            color: '#ef4444',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            outline: 'none',
            marginTop: 'auto',
            textAlign: 'left',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
            e.currentTarget.style.border = '1px solid rgba(239, 68, 68, 0.5)';
            e.currentTarget.style.transform = 'translateX(4px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
            e.currentTarget.style.border = '1px solid rgba(239, 68, 68, 0.3)';
            e.currentTarget.style.transform = 'translateX(0)';
          }}
        >
          <div className="icon-wrap">
            <LogoutIcon />
          </div>
          <span>Logout</span>
        </motion.button>
      </motion.div>

      <style>{`
        button:focus, button:focus-visible {
          outline: none !important;
        }
        .menu-item {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .menu-item .icon-wrap {
          min-width: 40px;
          min-height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        /* Custom scrollbar for sidebar */
        div::-webkit-scrollbar {
          width: 6px;
        }
        div::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        div::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 10px;
        }
        div::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
      `}</style>
    </>
  );
}




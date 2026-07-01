import { useNavigate } from 'react-router-dom';

export default function Footer() {
  const navigate = useNavigate();

  return (
    <footer style={{
      width: '100%',
      padding: '10px 2px',
      background: 'rgba(0, 0, 0, 0.0)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      borderTop: '1px solid rgba(255, 255, 255, 0.3)',
      borderTopLeftRadius: '1200px',
      borderTopRightRadius: '1200px',
      marginTop: 'auto',
    }}>
      <div style={{
        maxWidth: '1600px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1px',
      }}>
        {/* Links */}
        <div style={{
          display: 'flex',
          gap: '100px',
          alignItems: 'center',
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}>
          <button
            onClick={() => navigate('/about')}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              padding: '8px 8px',
              transition: 'all 0.3s ease',
              outline: 'none',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#fff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)';
            }}
          >
            About
          </button>

          <button
            onClick={() => navigate('/contact')}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              padding: '4px 4px',
              transition: 'all 0.3s ease',
              outline: 'none',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#fff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)';
            }}
          >
            Contact Us
          </button>
        </div>

        {/* Copyright */}
        <p style={{
          margin: 0,
          color: 'rgba(255, 255, 255, 0.5)',
          fontSize: '13px',
          fontWeight: '400',
          textAlign: 'center',
        }}>
          © {new Date().getFullYear()} <span style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: 700 }}>Recipe.IO</span> All rights reserved.
        </p>
      </div>

      <style>{`
        button:focus, button:focus-visible {
          outline: none !important;
        }
      `}</style>
    </footer>
  );
}
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const faqs = [
  { q: 'What is Recipe.IO?', a: 'Recipe.IO is a modern recipe-sharing platform where users can find, share, and save recipes.' },
  { q: 'Can I use Recipe.IO on any device?', a: 'Yes — Recipe.IO is fully responsive and works on phones, tablets, and desktops.' },
  { q: 'Why should I choose Recipe.IO?', a: 'Because it has a clean modern UI, easy sharing tools, and works across all devices.' },
  { q: 'Who developed Recipe.IO?', a: 'Recipe.IO was developed by "___".For any queries, contact the developer ->' },
];

// Reusable fade-up variant
const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1], delay },
  }),
};

export default function FAQ({ bgColor, accentColor, transitionDuration = 1.2, isInView = false }) {
  const [openFaq, setOpenFaq] = useState(0);
  const [width, setWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;

  return (
    <section
      style={{
        position: 'relative',
        minHeight: '72vh',
        padding: isMobile ? '48px 12px 24px' : '58px 0 24px',
        background: 'transparent',
        transition: `background ${transitionDuration}s ease`,
        width: '100%',
        maxWidth: '100%',
        overflowX: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      {/* ── Card container — slides up when FAQ section enters viewport ── */}
      <motion.div
        initial="hidden"
        animate={isInView ? 'show' : 'hidden'}
        variants={{
          hidden: { opacity: 0, y: 40 },
          show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
        }}
        style={{
          width: 'min(680px, calc(100vw - 30px))',
          margin: '0 auto',
          padding: '26px 22px',
          boxSizing: 'border-box',
          background: 'rgba(5, 15, 8, 0.58)',
          border: `1px solid ${accentColor}55`,
          borderRadius: 22,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: '0 20px 45px rgba(0, 0, 0, 0.45)',
          position: 'relative',
          zIndex: 2,
        }}
      >
        {/* Heading */}
        <motion.h2
          variants={fadeUp}
          custom={0.05}
          initial="hidden"
          animate={isInView ? 'show' : 'hidden'}
          style={{
            textAlign: 'center',
            fontSize: 'clamp(24px, 4.5vw, 34px)',
            fontWeight: 800,
            margin: 0,
            color: '#fff',
            letterSpacing: '-1px',
          }}
        >
          Frequently Asked Questions
        </motion.h2>

        <motion.p
          variants={fadeUp}
          custom={0.12}
          initial="hidden"
          animate={isInView ? 'show' : 'hidden'}
          style={{
            textAlign: 'center',
            opacity: 0.72,
            margin: '10px 0 22px',
            fontSize: 14,
            color: '#fff',
          }}
        >
          Everything you need to know about Recipe.IO
        </motion.p>

        {/* FAQ items — each staggered */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {faqs.map((faq, index) => {
            const isOpen = openFaq === index;
            return (
              <motion.div
                key={faq.q}
                variants={fadeUp}
                custom={0.15 + index * 0.07}   // stagger each item
                initial="hidden"
                animate={isInView ? 'show' : 'hidden'}
                onClick={() => setOpenFaq(isOpen ? null : index)}
                style={{
                  background: isOpen ? `${accentColor}22` : 'rgba(255,255,255,0.05)',
                  border: isOpen ? `1px solid ${accentColor}88` : '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 14,
                  padding: '14px 16px',
                  transition: `all ${transitionDuration}s ease`,
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                  <span style={{
                    fontSize: 15,
                    fontWeight: 600,
                    color: isOpen ? accentColor : '#fff',
                    transition: `color ${transitionDuration}s ease`,
                  }}>
                    {faq.q}
                  </span>
                  <span style={{
                    fontSize: 20,
                    color: isOpen ? accentColor : 'rgba(255,255,255,0.45)',
                    transition: `all ${transitionDuration}s ease`,
                    transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)',
                    lineHeight: 1,
                    flexShrink: 0,
                  }}>
                    +
                  </span>
                </div>
                {isOpen && (
                  <p style={{
                    margin: '10px 0 0',
                    fontSize: 14,
                    color: 'rgba(255,255,255,0.78)',
                    lineHeight: 1.6,
                    borderTop: '1px solid rgba(255,255,255,0.12)',
                    paddingTop: 10,
                  }}>
                    {faq.a}
                  </p>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* CTA button */}
        <motion.button
          variants={fadeUp}
          custom={0.15 + faqs.length * 0.07}
          initial="hidden"
          animate={isInView ? 'show' : 'hidden'}
          onClick={() => (window.location.href = '/register')}
          style={{
            display: 'block',
            margin: '18px auto 0',
            border: '1px solid rgba(255,255,255,0.25)',
            background: accentColor,
            padding: '14px 28px',
            borderRadius: 999,
            color: '#fff',
            fontSize: 15,
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: `0 10px 28px ${accentColor}70`,
            transition: `all ${transitionDuration}s ease`,
          }}
        >
          Let's Begin Cook
        </motion.button>
      </motion.div>

      {/* Footer */}
      <motion.footer
        variants={fadeUp}
        custom={0.3}
        initial="hidden"
        animate={isInView ? 'show' : 'hidden'}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
          padding: '0px 16px 0px',
          borderTop: `1px solid ${accentColor}80`,
          borderTopLeftRadius: '1200px',
          borderTopRightRadius: '1200px',
          marginTop: 20,
          position: 'relative',
          zIndex: 2,
        }}
      >
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: isMobile ? 24 : isTablet ? 48 : 230,
          opacity: 0.85,
          fontSize: isMobile ? 13 : 15,
          transform: 'translateY(18px)',
          flexWrap: 'wrap',
          width: '100%',
          textAlign: 'center',
          boxSizing: 'border-box',
        }}>
          <a href="/about" style={{ color: '#fff', textDecoration: 'none' }}>Contact Us</a>
          <a href="/about" style={{ color: '#fff', textDecoration: 'none' }}>Developer</a>
          <a href="/about" style={{ color: '#fff', textDecoration: 'none' }}>About</a>
        </div>
        {/* Copyright */}
        <p style={{
          margin: -2,
          color: 'rgba(255, 255, 255, 0.5)',
          fontSize: '13px',
          fontWeight: '400',
          textAlign: 'center',
          transform: 'translateY(25px)',
        }}>
          © {new Date().getFullYear()} <span style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: 700 }}>Recipe.IO</span> All rights reserved.
        </p>
      </motion.footer>
    </section>
  );
}


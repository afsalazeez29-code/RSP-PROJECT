import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.4, 0, 0.2, 1] },
  },
};

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
};

export default function About() {
  const navigate = useNavigate();
  const [width] = useState(window.innerWidth);
  const isMobile = width < 768;

  const styles = {
    page: {
      width: '100%',
      minHeight: '100vh',
      background: 'radial-gradient(circle at top, #0f1f14, #070B08)',
      color: '#fff',
      fontFamily: 'Poppins, sans-serif',
      paddingTop: isMobile ? '80px' : '100px',
      paddingBottom: '80px',
    },
    container: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: isMobile ? '20px' : '60px 40px',
    },
    header: {
      textAlign: 'center',
      marginBottom: '80px',
    },
    title: {
      fontSize: isMobile ? '36px' : '56px',
      fontWeight: 700,
      fontFamily: 'Inter, sans-serif',
      margin: '0 0 16px 0',
      letterSpacing: '-1px',
      background: 'linear-gradient(135deg, #e8b84b 0%, #c9972d 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
    },
    subtitle: {
      fontSize: isMobile ? '16px' : '18px',
      opacity: 0.7,
      marginBottom: '40px',
      lineHeight: 1.6,
    },
    section: {
      marginBottom: '80px',
    },
    sectionTitle: {
      fontSize: isMobile ? '28px' : '36px',
      fontWeight: 600,
      fontFamily: 'Inter, sans-serif',
      marginBottom: '24px',
      color: '#e8b84b',
    },
    box: {
      background: 'rgba(255, 255, 255, 0.03)',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '20px',
      padding: isMobile ? '24px' : '40px',
      marginBottom: '24px',
    },
    text: {
      fontSize: '16px',
      lineHeight: 1.8,
      opacity: 0.85,
      margin: '0 0 16px 0',
    },
    featureGrid: {
      display: 'grid',
      gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
      gap: '24px',
      marginTop: '40px',
    },
    featureCard: {
      background: 'rgba(232, 184, 75, 0.08)',
      border: '1px solid rgba(232, 184, 75, 0.3)',
      borderRadius: '16px',
      padding: '24px',
      textAlign: 'center',
    },
    featureIcon: {
      fontSize: '40px',
      marginBottom: '12px',
    },
    featureTitle: {
      fontSize: '16px',
      fontWeight: 600,
      fontFamily: 'Inter, sans-serif',
      color: '#e8b84b',
      marginBottom: '8px',
    },
    featureText: {
      fontSize: '14px',
      opacity: 0.7,
      lineHeight: 1.6,
    },
    button: {
      background: '#e8b84b',
      border: 'none',
      padding: '14px 32px',
      borderRadius: '100px',
      color: '#fff',
      fontSize: '14px',
      fontWeight: 600,
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      boxShadow: '0 8px 20px rgba(232, 184, 75, 0.3)',
      marginTop: '24px',
    },
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <motion.div
          style={styles.header}
          variants={container}
          initial="hidden"
          animate="show"
        >
          <motion.h1 style={styles.title} variants={fadeUp}>
            About Recipe.IO
          </motion.h1>
          <motion.p style={styles.subtitle} variants={fadeUp}>
            Discover a smarter way to manage your healthy lifestyle. Share, save, and explore delicious recipes from food lovers around the world.
          </motion.p>
        </motion.div>

        <motion.div
          style={styles.section}
          variants={container}
          initial="hidden"
          animate="show"
        >
          <motion.h2 style={styles.sectionTitle} variants={fadeUp}>
            Our Mission
          </motion.h2>
          <motion.div style={styles.box} variants={fadeUp}>
            <p style={styles.text}>
              At Recipe.IO, we believe that everyone deserves access to healthy, delicious recipes that fit their lifestyle. Our mission is to create a vibrant community where food lovers can discover, share, and organize recipes that inspire them to eat better every day.
            </p>
            <p style={styles.text}>
              We're committed to making meal planning effortless and enjoyable, helping you build a collection of trusted recipes that you can revisit anytime.
            </p>
          </motion.div>
        </motion.div>

        <motion.div
          style={styles.section}
          variants={container}
          initial="hidden"
          animate="show"
        >
          <motion.h2 style={styles.sectionTitle} variants={fadeUp}>
            Why Choose Recipe.IO?
          </motion.h2>
          <motion.div style={styles.featureGrid} variants={fadeUp}>
            <div style={styles.featureCard}>
              <div style={styles.featureIcon}>[]</div>
              <div style={styles.featureTitle}>Smart Organization</div>
              <p style={styles.featureText}>Save and organize recipes by cuisine, ingredients, or dietary preferences.</p>
            </div>
            <div style={styles.featureCard}>
              <div style={styles.featureIcon}>+</div>
              <div style={styles.featureTitle}>Community Driven</div>
              <p style={styles.featureText}>Discover recipes from food lovers around the world and share your favorites.</p>
            </div>
            <div style={styles.featureCard}>
              <div style={styles.featureIcon}>{'>>'}</div>
              <div style={styles.featureTitle}>Lightning Fast</div>
              <p style={styles.featureText}>Browse, search, and discover your next favorite recipe in seconds.</p>
            </div>
          </motion.div>
        </motion.div>

        <motion.div
          style={styles.section}
          variants={container}
          initial="hidden"
          animate="show"
        >
          <motion.h2 style={styles.sectionTitle} variants={fadeUp}>
            What We Offer
          </motion.h2>
          <motion.div style={styles.box} variants={fadeUp}>
            <h3 style={{ fontSize: '18px', fontFamily: 'Inter, sans-serif', fontWeight: 600, color: '#e8b84b', marginBottom: '12px' }}>
              Recipe Discovery
            </h3>
            <p style={styles.text}>
              Explore thousands of recipes shared by our community. Filter by cuisine, ingredients, dietary preferences, and more.
            </p>

            <h3 style={{ fontSize: '18px', fontFamily: 'Inter, sans-serif', fontWeight: 600, color: '#e8b84b', marginBottom: '12px', marginTop: '20px' }}>
              Personal Recipe Collection
            </h3>
            <p style={styles.text}>
              Save your favorite recipes and organize them into custom collections for easy access anytime.
            </p>

            <h3 style={{ fontSize: '18px', fontFamily: 'Inter, sans-serif', fontWeight: 600, color: '#e8b84b', marginBottom: '12px', marginTop: '20px' }}>
              Share Your Recipes
            </h3>
            <p style={styles.text}>
              Share your own recipes with the community and inspire others to cook delicious meals.
            </p>

            <h3 style={{ fontSize: '18px', fontFamily: 'Inter, sans-serif', fontWeight: 600, color: '#e8b84b', marginBottom: '12px', marginTop: '20px' }}>
              Get Inspired
            </h3>
            <p style={styles.text}>
              Discover trending recipes, seasonal favorites, and chef's special picks from food lovers worldwide.
            </p>
          </motion.div>
        </motion.div>

        <motion.div
          style={styles.section}
          variants={container}
          initial="hidden"
          animate="show"
        >
          <motion.h2 style={styles.sectionTitle} variants={fadeUp}>
            Our Core Values
          </motion.h2>
          <motion.div style={styles.featureGrid} variants={fadeUp}>
            <div style={styles.featureCard}>
              <div style={styles.featureIcon}>+</div>
              <div style={styles.featureTitle}>Health First</div>
              <p style={styles.featureText}>We promote healthy eating and nutritious lifestyle choices.</p>
            </div>
            <div style={styles.featureCard}>
              <div style={styles.featureIcon}>@</div>
              <div style={styles.featureTitle}>Community</div>
              <p style={styles.featureText}>Building a supportive network of food lovers worldwide.</p>
            </div>
            <div style={styles.featureCard}>
              <div style={styles.featureIcon}>*</div>
              <div style={styles.featureTitle}>Creativity</div>
              <p style={styles.featureText}>Celebrating culinary creativity and diverse cooking styles.</p>
            </div>
          </motion.div>
        </motion.div>

        <motion.div
          style={{
            ...styles.box,
            textAlign: 'center',
            background: 'rgba(232, 184, 75, 0.1)',
            border: '1px solid rgba(232, 184, 75, 0.3)',
          }}
          variants={fadeUp}
          initial="hidden"
          animate="show"
        >
          <h2 style={{ ...styles.sectionTitle, marginBottom: '16px', color: '#e8b84b' }}>
            Ready to Discover Amazing Recipes?
          </h2>
          <p style={{ ...styles.text, marginBottom: '0' }}>
            Join thousands of food lovers and start exploring, saving, and sharing recipes today!
          </p>
          <button
            style={styles.button}
            onClick={() => navigate('/register')}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 12px 28px rgba(232, 184, 75, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 8px 20px rgba(232, 184, 75, 0.3)';
            }}
          >
            Get Started Now
          </button>
        </motion.div>
      </div>
    </div>
  );
}

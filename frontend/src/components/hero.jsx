import { motion } from 'framer-motion';
import { useState } from 'react';
import { FaArrowRight } from 'react-icons/fa';

// stagger: each child slides up + fades in one by one
const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.18, delayChildren: 0.35 } },
};

const item = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 4, ease: [0.22, 1, 0.36, 1] } },
};

const cardContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.14, delayChildren: 0.6 } },
};

const cardItem = {
  hidden: { opacity: 0, y: 28, scale: 0.93 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

const foodCards = [
  {
    id: 1,
    name: 'Chicken BBQ Pizza',
    label: "Italian - Chef's Special",
    image: '/assetshttps://res.cloudinary.com/dgovvdud9/image/upload/v1781717942/pizza_enxnro.png',
  },
  {
    id: 2,
    name: 'Grilled Chicken Bowl',
    label: 'Healthy - High Protein',
    image: 'https://res.cloudinary.com/dgovvdud9/image/upload/v1781717937/chicken-salad_izxweo.png',
  },
  {
    id: 3,
    name: 'Low-Carb Beef Salad',
    label: 'Keto - Power Meal',
    image: 'https://res.cloudinary.com/dgovvdud9/image/upload/v1781717956/download_4_vv6c3o.jpg',
  },
  {
    id: 4,
    name: 'Rava Upma',
    label: 'South Indian - Breakfast',
    image: 'https://res.cloudinary.com/dgovvdud9/image/upload/v1781718003/Salad_rouz3g.jpg',
  },
];

function FoodCard({ card, index }) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      variants={cardItem}
      onClick={() => { window.location.href = '/recipe'; }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? 'rgba(255,255,255,0.98)' : 'rgba(255,255,255,0.92)',
        border: '2px solid rgba(255,255,255,0.95)',
        borderRadius: 18,
        boxShadow: hovered
          ? '0 16px 40px rgba(0,0,0,0.35), 0 2px 8px rgba(0,0,0,0.18)'
          : '0 6px 22px rgba(0,0,0,0.22), 0 1px 4px rgba(0,0,0,0.12)',
        cursor: 'pointer',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        transform: hovered ? 'translateY(-6px) scale(1.03)' : 'translateY(0) scale(1)',
        transition: 'transform 0.28s ease, box-shadow 0.28s ease, background 0.2s ease',
      }}
    >
      {/* Food image */}
      <div style={{
        width: '100%',
        height: 115,
        overflow: 'hidden',
        background: 'rgba(0,0,0,0.06)',
        flexShrink: 0,
      }}>
        <img
          src={card.image}
          alt={card.name}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transform: hovered ? 'scale(1.08)' : 'scale(1)',
            transition: 'transform 0.38s ease',
          }}
        />
      </div>

      {/* Card text */}
      <div style={{
        padding: '10px 12px 12px',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
      }}>
        <span style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: 13,
          fontWeight: 600,
          color: '#111',
          lineHeight: 1.3,
          letterSpacing: '-0.2px',
        }}>
          {card.name}
        </span>
        <span style={{
          fontFamily: 'Poppins, sans-serif',
          fontSize: 11,
          fontWeight: 400,
          color: '#666',
        }}>
          {card.label}
        </span>
        <div style={{
          fontFamily: 'Inter, sans-serif',
          marginTop: 6,
          fontSize: 11,
          fontWeight: 600,
          color: hovered ? '#c9972d' : '#e8b84b',
          transition: 'color 0.2s ease',
          letterSpacing: '0.2px',
        }}>
          View Recipe <FaArrowRight />
        </div>
      </div>
    </motion.div>
  );
}

export default function Hero() {
  return (
    <motion.main
      variants={container}
      initial="hidden"
      animate="show"
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '100px 48px 60px',
        gap: '56px',
        maxWidth: 1200,
        margin: '0 auto',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      {/* Ã¢â€â‚¬Ã¢â€â‚¬ LEFT: Hero text Ã¢â€â‚¬Ã¢â€â‚¬ */}
      <div style={{
        flex: '1 1 420px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        textAlign: 'left',
        gap: '20px',
        minWidth: 0,
      }}>
        {/* Title */}
        <motion.h2 variants={item} style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: 'clamp(40px, 6vw, 78px)',
          fontWeight: 800,
          letterSpacing: '-2px',
          margin: 0,
          lineHeight: 1.05,
          background: 'linear-gradient(180deg, #FFFFFF 0%, rgba(255,255,255,0.65) 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          RECIPE.IO
        </motion.h2>

        {/* Subtitle */}
        <motion.h3 variants={item} style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: 'clamp(18px, 3vw, 28px)',
          color: '#e8b84b',
          fontWeight: 600,
          margin: 0,
          letterSpacing: '-0.5px',
        }}>
          Eat Clean. Live Strong.
        </motion.h3>

        {/* Description */}
        <motion.p variants={item} style={{
          fontFamily: 'Poppins, sans-serif',
          fontSize: 17,
          fontWeight: 400,
          opacity: 0.75,
          lineHeight: 1.7,
          maxWidth: 440,
          color: '#fff',
          margin: 0,
        }}>
          Discover a smarter way to manage your healthy lifestyle.
          Save, organize, and explore nutritious recipes designed
          to help you eat better every day.
        </motion.p>

        {/* Button */}
        <motion.button
          variants={item}
          onClick={() => {
            document.getElementById('food-slider')?.scrollIntoView({ behavior: 'smooth' });
          }}
          style={{
            background: '#e8b84b',
            border: '1px solid rgba(255,255,255,0.2)',
            padding: '16px 38px',
            borderRadius: '100px',
            color: '#fff',
            fontSize: 16,
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 10px 30px rgba(232,184,75,0.4)',
            transition: 'all 0.3s ease',
            alignSelf: 'flex-start',
            marginTop: 4,
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 15px 35px rgba(232,184,75,0.6)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 10px 30px rgba(232,184,75,0.4)';
          }}
        >
          Explore Recipes <FaArrowRight />
        </motion.button>
      </div>

      {/* Ã¢â€â‚¬Ã¢â€â‚¬ RIGHT: Food cards Ã¢â€â‚¬Ã¢â€â‚¬ */}
      <motion.div
        variants={cardContainer}
        initial="hidden"
        animate="show"
        style={{
          flex: '0 0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          minWidth: 0,
        }}
      >
        {/* Header label */}
        <motion.div variants={cardItem} style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: 12,
          fontWeight: 600,
          color: 'rgba(255,255,255,0.72)',
          letterSpacing: '1.2px',
          textTransform: 'uppercase',
          marginBottom: 2,
          paddingLeft: 2,
        }}>          Top Picks From Our Users
        </motion.div>

        {/* 2Ãƒâ€”2 grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 12,
          width: 'min(340px, 42vw)',
        }}>
          {foodCards.map((card, index) => (
            <FoodCard key={card.id} card={card} index={index} />
          ))}
        </div>
      </motion.div>
    </motion.main>
  );
}


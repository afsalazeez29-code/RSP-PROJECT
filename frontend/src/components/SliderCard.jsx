import { motion, AnimatePresence } from 'framer-motion';
import { MdAccessTime } from "react-icons/md";
import { FaFire, FaArrowLeft, FaArrowRight } from "react-icons/fa";
import { BsPeopleFill } from "react-icons/bs";

const cardVariants = {
  hidden: { opacity: 0, y: 60,  scale: 0.96 },
  show:   { opacity: 1, y: 0,   scale: 1,
    transition: { delay: 0.2, duration: 0.6, type: 'spring', bounce: 0.28 } },
  exit:   { opacity: 0, y: -30, scale: 0.97,
    transition: { duration: 0.28 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 22 },
  show: (d) => ({
    opacity: 1, y: 0,
    transition: {
      delay: 0.3 + d * 0.12,
      duration: 0.55,
      ease: [0.22, 1, 0.36, 1],
    }
  }),
  exit: (d) => ({
    opacity: 0, y: -14,
    transition: { delay: d * 0.05, duration: 0.22 }
  }),
};

export default function SlideCard({ slide, isActive, onPrev, onNext, isFirst, isLast }) {
  return (
    <div className="slide-wrapper">
      <AnimatePresence mode="wait">
        {isActive && (
          <motion.div key={`card-${slide.id}`} className="glass-card"
            variants={cardVariants} initial="hidden" animate="show" exit="exit"
          >
            <motion.p custom={0} variants={itemVariants}
              initial="hidden" animate="show" exit="exit" className="card-label"
            >{slide.label}</motion.p>

            <motion.h2 custom={1} variants={itemVariants}
              initial="hidden" animate="show" exit="exit" className="card-title"
            >{slide.title}</motion.h2>

            <motion.p custom={2} variants={itemVariants}
              initial="hidden" animate="show" exit="exit" className="card-desc"
            >{slide.desc}</motion.p>

            <motion.div custom={3} variants={itemVariants}
              initial="hidden" animate="show" exit="exit" className="card-bottom"
            >
              <div className="pills">
                <span className="pill" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MdAccessTime /> {slide.time}</span>
                <span className="pill" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><FaFire /> {slide.kcal}</span>
                <span className="pill" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><BsPeopleFill /> {slide.serves}</span>
              </div>
              <button className="cta-btn" style={{ background: slide.accentColor }}>
                View Recipe <FaArrowRight />
              </button>
            </motion.div>

            <div className="card-nav">
              <button className="nav-btn" onClick={onPrev} disabled={isFirst}
                style={{ opacity: isFirst ? 0.3 : 1 }}><FaArrowLeft /></button>
              <button className="nav-btn" onClick={onNext} disabled={isLast}
                style={{ opacity: isLast ? 0.3 : 1 }}><FaArrowRight /></button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

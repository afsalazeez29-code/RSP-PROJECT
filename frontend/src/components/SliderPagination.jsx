import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const SliderPagination = ({
  currentPage = 0,
  totalPages = 1,
  onPageChange,
  autoAdvanceInterval = 5000,
  isInView = true,
}) => {
  const [activeIdx, setActiveIdx] = useState(currentPage);
  const [autoPlayEnabled, setAutoPlayEnabled] = useState(true);

  // Auto-advance slides
  useEffect(() => {
    if (!autoPlayEnabled || !isInView || totalPages <= 1) return;

    const timer = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % totalPages);
    }, autoAdvanceInterval);

    return () => clearInterval(timer);
  }, [autoPlayEnabled, isInView, totalPages, autoAdvanceInterval]);

  // Sync internal state with external currentPage
  useEffect(() => {
    setActiveIdx(currentPage);
  }, [currentPage]);

  // Notify parent of page change
  useEffect(() => {
    onPageChange?.(activeIdx);
  }, [activeIdx]);

  const handleDotClick = (index) => {
    setActiveIdx(index);
    setAutoPlayEnabled(false);
    // Resume autoplay after 8 seconds of user inactivity
    const timer = setTimeout(() => setAutoPlayEnabled(true), 8000);
    return () => clearTimeout(timer);
  };

  // Keyboard navigation for sliders
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setActiveIdx((prev) => (prev - 1 + totalPages) % totalPages);
        setAutoPlayEnabled(false);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setActiveIdx((prev) => (prev + 1) % totalPages);
        setAutoPlayEnabled(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [totalPages]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : { opacity: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      style={{
        display: 'flex',
        gap: '12px',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        zIndex: 10,
      }}
    >
      {Array.from({ length: totalPages }).map((_, i) => (
        <motion.button
          key={i}
          onClick={() => handleDotClick(i)}
          animate={{
            width: i === activeIdx ? '32px' : '10px',
            opacity: i === activeIdx ? 1 : 0.4,
            background: i === activeIdx ? 'rgba(232, 184, 75, 0.9)' : 'rgba(255, 255, 255, 0.3)',
            boxShadow: i === activeIdx ? '0 0 20px rgba(232, 184, 75, 0.6)' : 'none',
          }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          aria-label={`Go to slide ${i + 1} of ${totalPages}`}
          aria-current={i === activeIdx ? 'true' : 'false'}
          style={{
            height: '10px',
            borderRadius: '5px',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            background: i === activeIdx ? 'rgba(232, 184, 75, 0.9)' : 'rgba(255, 255, 255, 0.3)',
            backdropFilter: 'blur(15px)',
            WebkitBackdropFilter: 'blur(15px)',
            transition: 'all 0.3s ease',
          }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onMouseEnter={() => setAutoPlayEnabled(false)}
          onMouseLeave={() => setAutoPlayEnabled(true)}
        />
      ))}
    </motion.div>
  );
};

export default SliderPagination;

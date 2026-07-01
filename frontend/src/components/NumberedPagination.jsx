import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const NumberedPagination = ({
  currentPage = 1,
  totalPages = 1,
  onPageChange,
}) => {
  const [activePage, setActivePage] = useState(currentPage);
  const [scrollToTop, setScrollToTop] = useState(false);

  useEffect(() => {
    setActivePage(currentPage);
  }, [currentPage]);

  const handlePageClick = (page) => {
    setActivePage(page);
    setScrollToTop(true);
    onPageChange?.(page);
  };

  const handlePrevious = () => {
    if (activePage > 1) {
      handlePageClick(activePage - 1);
    }
  };

  const handleNext = () => {
    if (activePage < totalPages) {
      handlePageClick(activePage + 1);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        handlePrevious();
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activePage, totalPages]);

  useEffect(() => {
    if (scrollToTop) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setScrollToTop(false);
    }
  }, [scrollToTop]);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, activePage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    if (start > 1) pages.push('...');

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (end < totalPages) pages.push('...');

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      style={{
        display: 'flex',
        gap: '8px',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
        flexWrap: 'wrap',
        zIndex: 10,
      }}
    >
      <motion.button
        onClick={handlePrevious}
        disabled={activePage === 1}
        whileHover={activePage !== 1 ? { scale: 1.05 } : {}}
        whileTap={activePage !== 1 ? { scale: 0.95 } : {}}
        aria-label={`Previous page, current page is ${activePage} of ${totalPages}`}
        style={{
          padding: '10px 18px',
          borderRadius: '8px',
          border: 'none',
          background: activePage === 1 ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(15px)',
          WebkitBackdropFilter: 'blur(15px)',
          color: activePage === 1 ? 'rgba(255, 255, 255, 0.3)' : '#fff',
          cursor: activePage === 1 ? 'not-allowed' : 'pointer',
          fontSize: '14px',
          fontWeight: '600',
          transition: 'all 0.3s ease',
          opacity: activePage === 1 ? 0.5 : 1,
        }}
      >
        &lt;- Previous
      </motion.button>

      <div
        style={{
          display: 'flex',
          gap: '6px',
          alignItems: 'center',
        }}
      >
        {pageNumbers.map((page, idx) => (
          page === '...' ? (
            <span
              key={`dots-${idx}`}
              style={{
                color: 'rgba(255, 255, 255, 0.5)',
                padding: '0 4px',
                fontSize: '14px',
              }}
            >
              ...
            </span>
          ) : (
            <motion.button
              key={page}
              onClick={() => handlePageClick(page)}
              animate={{
                background: page === activePage
                  ? 'rgba(232, 184, 75, 0.9)'
                  : 'rgba(255, 255, 255, 0.08)',
                color: page === activePage ? '#fff' : 'rgba(255, 255, 255, 0.8)',
              }}
              whileHover={{
                background: page === activePage
                  ? 'rgba(232, 184, 75, 0.95)'
                  : 'rgba(255, 255, 255, 0.15)',
                scale: 1.05,
              }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.2 }}
              aria-label={`Go to page ${page}`}
              aria-current={page === activePage ? 'page' : undefined}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: page === activePage ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
                background: page === activePage
                  ? 'rgba(232, 184, 75, 0.9)'
                  : 'rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(15px)',
                WebkitBackdropFilter: 'blur(15px)',
                color: page === activePage ? '#fff' : 'rgba(255, 255, 255, 0.8)',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: page === activePage ? '700' : '600',
                transition: 'all 0.3s ease',
                minWidth: '40px',
                textAlign: 'center',
              }}
            >
              {page}
            </motion.button>
          )
        ))}
      </div>

      <motion.button
        onClick={handleNext}
        disabled={activePage === totalPages}
        whileHover={activePage !== totalPages ? { scale: 1.05 } : {}}
        whileTap={activePage !== totalPages ? { scale: 0.95 } : {}}
        aria-label={`Next page, current page is ${activePage} of ${totalPages}`}
        style={{
          padding: '10px 18px',
          borderRadius: '8px',
          border: 'none',
          background: activePage === totalPages ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(15px)',
          WebkitBackdropFilter: 'blur(15px)',
          color: activePage === totalPages ? 'rgba(255, 255, 255, 0.3)' : '#fff',
          cursor: activePage === totalPages ? 'not-allowed' : 'pointer',
          fontSize: '14px',
          fontWeight: '600',
          transition: 'all 0.3s ease',
          opacity: activePage === totalPages ? 0.5 : 1,
        }}
      >
        Next -&gt;
      </motion.button>
    </motion.div>
  );
};

export default NumberedPagination;

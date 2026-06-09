import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Route helper that scrolls pages back to the top after navigation.
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

export default ScrollToTop;

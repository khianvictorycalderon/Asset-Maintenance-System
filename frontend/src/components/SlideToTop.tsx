import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function SlideToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    const scrollToTop = () => {
      // Try window first (PublicLayout)
      window.scrollTo({ top: 0, behavior: "smooth" });

      // Then fallback to PrivateLayout scroll container
      const main = document.querySelector("main");
      if (main) {
        main.scrollTo({ top: 0, behavior: "smooth" });
      }
    };

    requestAnimationFrame(scrollToTop);
  }, [pathname]);

  return null;
}
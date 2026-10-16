import { useEffect } from "react";
import { useLocation } from "@tanstack/react-router";

/** Progressive enhancement: content stays visible without JavaScript or motion. */
export function StoreMotion() {
  const { pathname } = useLocation();

  useEffect(() => {
    const storefront = pathname === "/" || pathname === "/shop" || pathname === "/carrinho" || pathname.startsWith("/produto/");
    if (!storefront) return;
    document.body.classList.add("rt-store-motion");
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let observer: IntersectionObserver | undefined;
    let mutations: MutationObserver | undefined;
    const marked = new Set<Element>();

    const stop = () => {
      observer?.disconnect();
      mutations?.disconnect();
      marked.forEach((element) => element.classList.remove("rt-reveal", "rt-revealed"));
      marked.clear();
    };
    const start = () => {
      stop();
      if (preference.matches || !("IntersectionObserver" in window)) return;
      observer = new IntersectionObserver((entries) => {
        entries.forEach(({ target, isIntersecting }) => {
          if (!isIntersecting) return;
          target.classList.add("rt-revealed");
          observer?.unobserve(target);
        });
      }, { threshold: 0.06 });
      const register = () => {
        document.querySelectorAll("main > section, #quem-somos, #servicos, #contato, [data-motion='product']").forEach((element) => {
          if (marked.has(element)) return;
          marked.add(element);
          // No initial-screen delay and no disappearing content during hydration.
          if (element.getBoundingClientRect().top < window.innerHeight) return;
          element.classList.add("rt-reveal");
          observer?.observe(element);
        });
      };
      register();
      mutations = new MutationObserver(register);
      mutations.observe(document.body, { childList: true, subtree: true });
    };
    start();
    preference.addEventListener("change", start);
    return () => {
      stop();
      preference.removeEventListener("change", start);
      document.body.classList.remove("rt-store-motion");
    };
  }, [pathname]);

  return null;
}
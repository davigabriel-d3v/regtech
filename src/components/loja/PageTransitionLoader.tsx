import { useEffect, useRef, useState } from "react";
import { useRouter } from "@tanstack/react-router";

/**
 * A brief, branded loading layer for client-side route changes.
 * It never delays the router; it only gives the transition a visible finish.
 */
export function PageTransitionLoader() {
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const startedAt = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    const clearTimer = () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = undefined;
    };

    const unsubscribeBefore = router.subscribe("onBeforeNavigate", () => {
      clearTimer();
      startedAt.current = Date.now();
      setVisible(true);
    });

    const unsubscribeResolved = router.subscribe("onResolved", () => {
      const remaining = Math.max(0, 220 - (Date.now() - startedAt.current));
      clearTimer();
      timer.current = setTimeout(() => {
        setVisible(false);
        timer.current = undefined;
      }, remaining);
    });

    return () => {
      clearTimer();
      unsubscribeBefore();
      unsubscribeResolved();
    };
  }, [router]);

  if (!visible) return null;

  return (
    <div className="rt-page-loader" role="status" aria-live="polite" aria-label="Carregando página">
      <div className="rt-page-loader__content">
        <div className="rt-page-loader__mark" aria-hidden="true">
          <span>R</span>
        </div>
        <div className="rt-page-loader__track" aria-hidden="true">
          <span />
        </div>
        <p>Preparando sua experiência</p>
      </div>
    </div>
  );
}

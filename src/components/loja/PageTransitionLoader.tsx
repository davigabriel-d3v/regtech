import { useEffect, useRef, useState } from "react";
import { useRouter } from "@tanstack/react-router";

/** Minimal spinner shown briefly during client-side route changes. */
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
      const remaining = Math.max(0, 180 - (Date.now() - startedAt.current));
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
      <span className="rt-page-loader__spinner" aria-hidden="true" />
    </div>
  );
}

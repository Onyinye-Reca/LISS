import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { onApiActivity } from "../lib/api";

/**
 * A thin top-of-page progress bar. A single-page app gets no browser tab
 * spinner on client-side navigation, so this gives visible feedback while the
 * app is fetching (including slow free-tier cold starts) and on route changes.
 */
export default function LoadingBar() {
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const trickle = useRef<ReturnType<typeof setInterval>>();
  const hideTimer = useRef<ReturnType<typeof setTimeout>>();
  const apiActive = useRef(false);

  const start = () => {
    clearTimeout(hideTimer.current);
    clearInterval(trickle.current);
    setVisible(true);
    setProgress((p) => (p > 0 && p < 90 ? p : 10));
    // Ease toward 90% while we wait; the response snaps it to 100%.
    trickle.current = setInterval(() => {
      setProgress((p) => (p < 90 ? p + (90 - p) * 0.12 : p));
    }, 250);
  };

  const done = () => {
    clearInterval(trickle.current);
    setProgress(100);
    hideTimer.current = setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 300);
  };

  // Drive from in-flight API calls — the real waits.
  useEffect(
    () =>
      onApiActivity((active) => {
        apiActive.current = active;
        if (active) start();
        else done();
      }),
    [],
  );

  // Pulse on client-side navigation so instant page swaps still register.
  // Don't finish the pulse if an API request is still loading — let it complete.
  const { pathname } = useLocation();
  useEffect(() => {
    start();
    const t = setTimeout(() => {
      if (!apiActive.current) done();
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(
    () => () => {
      clearInterval(trickle.current);
      clearTimeout(hideTimer.current);
    },
    [],
  );

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-0.5"
      style={{ opacity: visible ? 1 : 0, transition: "opacity 250ms ease" }}
    >
      <div
        className="h-full bg-gold shadow-[0_0_10px_rgba(192,141,51,0.7)]"
        style={{ width: `${progress}%`, transition: "width 200ms ease-out" }}
      />
    </div>
  );
}

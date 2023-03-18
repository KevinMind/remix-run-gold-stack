import { useEffect, useRef } from "react";
import { useTransition } from "@remix-run/react";

export function useProgress() {
  const el = useRef<HTMLDivElement>(null);
  const timeout = useRef<NodeJS.Timeout>();
  const { location } = useTransition();

  useEffect(() => {
    if (!location || !el.current) {
      return;
    }

    const currentEl = el.current;

    if (timeout.current) {
      clearTimeout(timeout.current);
    }

    currentEl.style.width = `0%`;

    let updateWidth = (ms: number) => {
      timeout.current = setTimeout(() => {
        if (!currentEl) return;

        let width = parseFloat(el.current.style.width);
        let percent = !isNaN(width) ? 10 + 0.9 * width : 0;

        currentEl.style.width = `${percent}%`;

        updateWidth(100);
      }, ms);
    };

    updateWidth(300);

    return () => {
      clearTimeout(timeout.current);

      if (!currentEl) return;

      if (currentEl.style.width === `0%`) {
        return;
      }

      currentEl.style.width = `100%`;
      timeout.current = setTimeout(() => {
        if (currentEl.style.width !== "100%") {
          return;
        }

        currentEl.style.width = ``;
      }, 200);
    };
  }, [location]);

  return el;
}

export function Progress() {
  const progress = useProgress();

  return (
    <div className="fixed top-0 left-0 right-0 flex h-1">
      <div
        ref={progress}
        className="bg-gradient-to-r from-blue-100 via-blue-500 to-blue-200 transition-all ease-out"
      />
    </div>
  );
}

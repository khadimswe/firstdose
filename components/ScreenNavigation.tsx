"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

function focusMain() {
  document.getElementById("main-content")?.focus({ preventScroll: true });
}

/** Give keyboard and screen-reader users a destination after client navigation. */
export function ScreenNavigation() {
  const pathname = usePathname();
  const previous = useRef(pathname);

  useEffect(() => {
    if (previous.current === pathname) return;
    previous.current = pathname;
    const frame = requestAnimationFrame(focusMain);
    return () => cancelAnimationFrame(frame);
  }, [pathname]);

  return (
    <a href="#main-content" tabIndex={0} onClick={focusMain}
      className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:rounded-lg focus:bg-white focus:px-4 focus:py-3 focus:text-black focus:outline-2 focus:outline-offset-2 focus:outline-black">
      Skip to main content
    </a>
  );
}

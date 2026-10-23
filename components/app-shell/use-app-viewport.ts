"use client";

import { useEffect, useState } from "react";

const KEYBOARD_MIN_HEIGHT = 60; // Filter out browser chrome address bar shifts

function isInteractiveInputFocused(): boolean {
  if (typeof document === "undefined") return false;
  const active = document.activeElement;
  if (!active) return false;
  const tag = active.tagName.toLowerCase();
  if (tag === "input") {
    const type = (active as HTMLInputElement).type.toLowerCase();
    if (["checkbox", "radio", "button", "submit", "reset", "file", "color", "range", "image"].includes(type)) {
      return false;
    }
    return true;
  }
  if (tag === "textarea") return true;
  if ((active as HTMLElement).isContentEditable) return true;
  return false;
}

export function useAppViewport() {
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.visualViewport) return;

    const vv = window.visualViewport;

    const resetViewport = () => {
      const wasKeyboardOpen = document.documentElement.hasAttribute("data-keyboard-open");
      document.documentElement.style.setProperty("--app-viewport-height", "100%");
      document.documentElement.removeAttribute("data-keyboard-open");
      if (wasKeyboardOpen && window.scrollY !== 0) {
        window.scrollTo(0, 0);
      }
      setIsKeyboardOpen(false);
    };

    const updateViewport = () => {
      const isInputActive = isInteractiveInputFocused();
      if (!isInputActive) {
        if (document.documentElement.hasAttribute("data-keyboard-open")) {
          resetViewport();
        }
        return;
      }

      const height = vv.height;
      const keyboardHeight = Math.max(0, window.innerHeight - height);
      const keyboardOpen = keyboardHeight > KEYBOARD_MIN_HEIGHT;

      if (keyboardOpen) {
        document.documentElement.style.setProperty("--app-viewport-height", `${height}px`);
        document.documentElement.setAttribute("data-keyboard-open", "true");
        setIsKeyboardOpen(true);
        if (window.scrollY !== 0) {
          window.scrollTo(0, 0);
        }
      } else if (document.documentElement.hasAttribute("data-keyboard-open")) {
        resetViewport();
      }
    };

    updateViewport();

    const handleFocusOut = () => {
      // Delay slightly to check if focus moved to another input
      window.setTimeout(() => {
        if (!isInteractiveInputFocused()) {
          resetViewport();
        }
      }, 50);
    };

    const handleVisibility = () => {
      if (document.hidden || !isInteractiveInputFocused()) {
        resetViewport();
      }
    };

    vv.addEventListener("resize", updateViewport);
    window.addEventListener("focusin", updateViewport);
    window.addEventListener("focusout", handleFocusOut);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      vv.removeEventListener("resize", updateViewport);
      window.removeEventListener("focusin", updateViewport);
      window.removeEventListener("focusout", handleFocusOut);
      document.removeEventListener("visibilitychange", handleVisibility);
      document.documentElement.style.removeProperty("--app-viewport-height");
      document.documentElement.removeAttribute("data-keyboard-open");
    };
  }, []);

  return { isKeyboardOpen };
}

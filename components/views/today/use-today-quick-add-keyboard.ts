"use client";

import { useCallback, useEffect, useRef } from "react";

const KEYBOARD_MIN_HEIGHT = 60;
const NATURAL_SPACING = 16; // Clearance (px) above the keyboard / accessory bar

export function useTodayQuickAddKeyboard() {
  const formRef = useRef<HTMLFormElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const isFocusedRef = useRef(false);
  const animationTimerRef = useRef<number[]>([]);

  const clearTimers = useCallback(() => {
    animationTimerRef.current.forEach((id) => window.clearTimeout(id));
    animationTimerRef.current = [];
  }, []);

  // Find the internal scroll container of the App Shell (.page-container)
  const getScrollContainer = useCallback((): HTMLElement | null => {
    if (!formRef.current) return null;
    return formRef.current.closest<HTMLElement>(".page-container");
  }, []);

  // Check if form is occluded in the scroll container and scroll only if needed
  const adjustScrollIfNeeded = useCallback((smooth = true) => {
    const formEl = formRef.current;
    const scrollContainer = getScrollContainer();
    if (!formEl || !scrollContainer || typeof window === "undefined") return;

    // Check if virtual keyboard is active
    const vv = window.visualViewport;
    const keyboardHeight = vv ? Math.max(0, window.innerHeight - (vv.offsetTop + vv.height)) : 0;
    if (keyboardHeight <= KEYBOARD_MIN_HEIGHT) return;

    // Ensure window coordinate system is clean
    if (window.scrollY !== 0) {
      window.scrollTo(0, 0);
    }

    const formRect = formEl.getBoundingClientRect();
    const containerRect = scrollContainer.getBoundingClientRect();

    const visibleTop = containerRect.top;
    const visibleBottom = containerRect.bottom;
    const desiredBottom = visibleBottom - NATURAL_SPACING;

    // If the input is already fully within the visible bounds, do nothing
    if (formRect.top >= visibleTop && formRect.bottom <= desiredBottom) {
      return;
    }

    // How much the form is below the desired position
    const delta = formRect.bottom - desiredBottom;

    if (delta > 0) {
      // Never scroll so much that the top of the form is pushed off the top of the screen
      const maxDelta = Math.max(0, formRect.top - visibleTop - 12);
      const scrollAmount = Math.min(delta, maxDelta);

      if (scrollAmount > 0) {
        scrollContainer.scrollTo({
          top: scrollContainer.scrollTop + scrollAmount,
          behavior: smooth ? "smooth" : "auto",
        });
      }
    }
  }, [getScrollContainer]);

  // Handle visualViewport resize events
  const onViewportResize = useCallback(() => {
    if (!isFocusedRef.current) return;
    adjustScrollIfNeeded(false);
  }, [adjustScrollIfNeeded]);

  const onFocus = useCallback(() => {
    isFocusedRef.current = true;
    clearTimers();

    // Give visualViewport and iOS keyboard animation 250ms to settle
    const timerId = window.setTimeout(() => {
      if (!isFocusedRef.current) return;
      adjustScrollIfNeeded(true);
    }, 250);
    animationTimerRef.current.push(timerId);
  }, [adjustScrollIfNeeded, clearTimers]);

  const onBlur = useCallback(() => {
    isFocusedRef.current = false;
    clearTimers();

    const timerId = window.setTimeout(() => {
      if (isFocusedRef.current) return;
      const scrollContainer = getScrollContainer();
      if (!scrollContainer) return;

      // Clamp scrollTop if it exceeds normal scroll bounds after keyboard dismiss
      const maxScroll = Math.max(0, scrollContainer.scrollHeight - scrollContainer.clientHeight);
      if (scrollContainer.scrollTop > maxScroll) {
        scrollContainer.scrollTo({ top: maxScroll, behavior: "smooth" });
      }
    }, 150);
    animationTimerRef.current.push(timerId);
  }, [clearTimers, getScrollContainer]);

  useEffect(() => {
    if (typeof window === "undefined" || !window.visualViewport) return;
    const vv = window.visualViewport;

    vv.addEventListener("resize", onViewportResize);

    return () => {
      vv.removeEventListener("resize", onViewportResize);
      clearTimers();
    };
  }, [clearTimers, onViewportResize]);

  // Triggered when a task is submitted and newly added items shift the layout
  const triggerScrollAdjustment = useCallback(
    (smooth = true) => {
      window.requestAnimationFrame(() => {
        if (!isFocusedRef.current) return;
        adjustScrollIfNeeded(smooth);
      });
    },
    [adjustScrollIfNeeded],
  );

  return {
    formRef,
    inputRef,
    onFocus,
    onBlur,
    triggerScrollAdjustment,
  };
}

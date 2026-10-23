import React, { useEffect, useRef } from "react";

const INTERACTIVE_TARGET_SELECTOR =
  "button, a, input, textarea, select, [role='button'], [data-no-swipe]";

interface HoldToActOptions<T extends HTMLElement> {
  onTrigger: (anchor: T) => void;
  delay?: number;
  tolerance?: number;
  disabled?: boolean;
  allowInteractive?: boolean;
}

const isInteractiveTarget = (target: EventTarget | null) => {
  if (!(target instanceof Element)) return false;
  return target.closest(INTERACTIVE_TARGET_SELECTOR) !== null;
};

export function useHoldToAct<T extends HTMLElement = HTMLElement>({
  onTrigger,
  delay = 500,
  tolerance = 12,
  disabled = false,
  allowInteractive = false,
}: HoldToActOptions<T>) {
  const anchorRef = useRef<T | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const origin = useRef<{ x: number; y: number } | null>(null);
  const suppressClick = useRef(false);
  const triggerRef = useRef(onTrigger);

  useEffect(() => {
    triggerRef.current = onTrigger;
  }, [onTrigger]);

  const clear = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    origin.current = null;
  };

  useEffect(() => clear, []);

  const begin = (x: number, y: number, target: EventTarget | null) => {
    if (disabled || (!allowInteractive && isInteractiveTarget(target))) return;
    clear();
    origin.current = { x, y };
    timer.current = setTimeout(() => {
      timer.current = null;
      origin.current = null;
      suppressClick.current = true;
      if (anchorRef.current) triggerRef.current(anchorRef.current);
    }, delay);
  };

  const move = (x: number, y: number) => {
    const start = origin.current;
    if (!start) return;
    if (
      Math.abs(x - start.x) > tolerance ||
      Math.abs(y - start.y) > tolerance
    ) {
      clear();
    }
  };

  const pointerDown = (event: React.PointerEvent<T>) => {
    if (event.pointerType === "touch" || event.button > 0) return;
    begin(event.clientX, event.clientY, event.target);
  };

  const pointerMove = (event: React.PointerEvent<T>) => {
    if (event.pointerType === "touch") return;
    move(event.clientX, event.clientY);
  };

  const touchStart = (event: React.TouchEvent<T>) => {
    const touch = event.touches[0];
    if (touch) begin(touch.clientX, touch.clientY, event.target);
  };

  const touchMove = (event: React.TouchEvent<T>) => {
    const touch = event.touches[0];
    if (touch) move(touch.clientX, touch.clientY);
  };

  const contextMenu = (event: React.MouseEvent<T>) => {
    if (disabled || (!allowInteractive && isInteractiveTarget(event.target))) {
      return;
    }
    event.preventDefault();
    clear();
    if (anchorRef.current) triggerRef.current(anchorRef.current);
  };

  const onClickCapture = (event: React.MouseEvent<T>) => {
    if (!suppressClick.current) return;
    suppressClick.current = false;
    event.preventDefault();
    event.stopPropagation();
  };

  return {
    anchorRef,
    onClickCapture,
    handlers: {
      onPointerDown: pointerDown,
      onPointerMove: pointerMove,
      onPointerUp: clear,
      onPointerCancel: clear,
      onPointerLeave: clear,
      onTouchStart: touchStart,
      onTouchMove: touchMove,
      onTouchEnd: clear,
      onTouchCancel: clear,
      onContextMenu: contextMenu,
    },
  };
}

import { useLayoutEffect, useRef } from "react";

// FLIP(First-Last-Invert-Play): 컬럼이 사라져 나머지가 리플로우될 때
// 순간이동 대신 이전 위치에서 새 위치로 부드럽게 이동하도록 함
export function useFlip(keys: string[]) {
  const nodes = useRef(new Map<string, HTMLElement>());
  const prevRects = useRef(new Map<string, DOMRect>());

  useLayoutEffect(() => {
    const newRects = new Map<string, DOMRect>();

    nodes.current.forEach((el, key) => {
      const rect = el.getBoundingClientRect();
      newRects.set(key, rect);

      const prev = prevRects.current.get(key);
      if (!prev) return;

      const dx = prev.left - rect.left;
      const dy = prev.top - rect.top;
      if (!dx && !dy) return;

      el.style.transition = "none";
      el.style.transform = `translate(${dx}px, ${dy}px)`;
      el.getBoundingClientRect(); // 강제 리플로우
      requestAnimationFrame(() => {
        el.style.transition = "transform 0.3s ease";
        el.style.transform = "";
      });
    });

    prevRects.current = newRects;
  }, [keys.join(",")]);

  return (key: string) => (el: HTMLElement | null) => {
    if (el) nodes.current.set(key, el);
    else nodes.current.delete(key);
  };
}

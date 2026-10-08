import { useLayoutEffect, useRef } from "react";

// FLIP(First-Last-Invert-Play): 컬럼이 사라져 나머지가 리플로우될 때
// 순간이동 대신 이전 위치에서 새 위치로 부드럽게 이동하도록 함
export function useFlip(keys: string[]) {
  const nodes = useRef(new Map<string, HTMLElement>());
  const prevRects = useRef(new Map<string, DOMRect>());
  const prevKeys = useRef("");

  // 매 커밋마다 위치를 기록해 둠 — 키가 바뀔 때만 기록하면 그 사이 레이아웃 변화(독 등장 애니메이션 등)로
  // 이전 위치가 낡아서 엉뚱한 곳에서 날아옴. 애니메이션은 키(순서/구성)가 바뀐 커밋에서만
  useLayoutEffect(() => {
    const joined = keys.join(",");
    const changed = joined !== prevKeys.current;
    prevKeys.current = joined;
    const newRects = new Map<string, DOMRect>();

    nodes.current.forEach((el, key) => {
      const rect = el.getBoundingClientRect();
      newRects.set(key, rect);

      const prev = prevRects.current.get(key);
      if (!changed || !prev) return;

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
  });

  return (key: string) => (el: HTMLElement | null) => {
    if (el) nodes.current.set(key, el);
    else nodes.current.delete(key);
  };
}

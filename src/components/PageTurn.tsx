import { useLayoutEffect, useRef } from "react";

export type TurnSnapshot = {
  direction: "forward" | "backward";
  front: HTMLElement;
  stationary: HTMLElement;
};

export function copyPage(page: HTMLElement) {
  const copy = page.cloneNode(true) as HTMLElement;
  copy.removeAttribute("id");
  copy.querySelectorAll("[id]").forEach((node) => node.removeAttribute("id"));
  const originalInputs = page.querySelectorAll("textarea");
  copy.querySelectorAll("textarea").forEach((node, i) => {
    node.value = originalInputs[i]?.value ?? "";
  });
  return copy;
}

// Decorative copies keep the actual journal pages accessible and interactive after the turn.
export function PageTurn({ snapshot, pages, onComplete }: {
  snapshot: TurnSnapshot;
  pages: HTMLDivElement | null;
  onComplete: () => void;
}) {
  const front = useRef<HTMLDivElement>(null);
  const back = useRef<HTMLDivElement>(null);
  const stationary = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const target = pages?.querySelector<HTMLElement>(
      snapshot.direction === "forward" ? ".left-page" : ".right-page",
    );
    if (!target) {
      onComplete();
      return;
    }
    front.current?.replaceChildren(snapshot.front);
    back.current?.replaceChildren(copyPage(target));
    stationary.current?.replaceChildren(snapshot.stationary);
  }, [snapshot, pages, onComplete]);
  return (
    <div className={`page-turn page-turn-${snapshot.direction}`} aria-hidden="true" inert>
      <div className="turn-stationary" ref={stationary} />
      <div className="turn-sheet" onAnimationEnd={(event) => {
        if (event.target === event.currentTarget) onComplete();
      }}>
        <div className="turn-face turn-front" ref={front} />
        <div className="turn-face turn-back" ref={back} />
      </div>
    </div>
  );
}
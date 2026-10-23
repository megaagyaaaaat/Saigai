import React, { useEffect } from 'react';

interface FadeToBlackProps {
  active: boolean;
  onExit: () => void;
  /** how long the screen takes to go fully black */
  durationMs?: number;
  /** wait this long before the screen starts darkening, so the pull-back is seen first */
  delayMs?: number;
}

/** Full-screen black curtain that fades in slowly. Click or press any key to bring the app back. */
export const FadeToBlack: React.FC<FadeToBlackProps> = ({ active, onExit, durationMs = 9000, delayMs = 1500 }) => {
  useEffect(() => {
    if (!active) return;
    const handler = () => onExit();
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [active, onExit]);

  return (
    <div
      role="presentation"
      onClick={active ? onExit : undefined}
      className="fixed inset-0 z-[100] bg-black flex items-end justify-center pb-10"
      style={{
        opacity: active ? 1 : 0,
        pointerEvents: active ? 'auto' : 'none',
        // slow, eased fade to black; quicker return
        transition: `opacity ${active ? durationMs : 700}ms ${active ? 'cubic-bezier(0.45, 0, 0.55, 1)' : 'ease-out'} ${active ? delayMs : 0}ms`,
        cursor: active ? 'pointer' : 'default',
      }}
    >
      <span
        className="text-[11px] font-mono tracking-widest text-white/30 uppercase"
        style={{
          opacity: active ? 1 : 0,
          transition: `opacity 1200ms ease ${active ? durationMs + delayMs + 600 : 0}ms`,
        }}
      >
        Click anywhere to return
      </span>
    </div>
  );
};

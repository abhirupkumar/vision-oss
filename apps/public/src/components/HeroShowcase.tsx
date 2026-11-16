import React, { useEffect, useRef, useState } from 'react';

// Dark mode banners
import darkLlmAnalytics from '../assets/banners/dark-mode/llm-analytics.png';
import darkProductAnalytics from '../assets/banners/dark-mode/product-analytics.png';
import darkUnitEconomics from '../assets/banners/dark-mode/unit-economics.png';
import darkUserJourney from '../assets/banners/dark-mode/user-journey.png';

// Light mode banners
import lightLlmAnalytics from '../assets/banners/light-mode/llm-analytics.png';
import lightProductAnalytics from '../assets/banners/light-mode/product-analytics.png';
import lightUnitEconomics from '../assets/banners/light-mode/unit-economics.png';
import lightUserJourney from '../assets/banners/light-mode/user-journey.png';

/** Reactive dark-mode hook */
function useIsDarkMode(): boolean {
  const [isDark, setIsDark] = useState<boolean>(() =>
    typeof document !== 'undefined'
      ? document.documentElement.classList.contains('dark')
      : true
  );
  useEffect(() => {
    const update = () => setIsDark(document.documentElement.classList.contains('dark'));
    update();
    const obs = new MutationObserver((muts) => {
      for (const m of muts)
        if (m.type === 'attributes' && m.attributeName === 'class') update();
    });
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    window.addEventListener('storage', update);
    return () => { obs.disconnect(); window.removeEventListener('storage', update); };
  }, []);
  return isDark;
}

const DARK_IMAGES = [darkLlmAnalytics, darkProductAnalytics, darkUnitEconomics, darkUserJourney];
const LIGHT_IMAGES = [lightLlmAnalytics, lightProductAnalytics, lightUnitEconomics, lightUserJourney];

const COLS = 4;
const ROWS = 4;
const COUNT = COLS * ROWS;

// ── KEY FIX FOR BLUR ──────────────────────────────────────────────────────────
// We keep the camera at scale ≈ 1.0 while zoomed IN (never upscale the GPU
// layer). The grid is sized so one card fills roughly the scene width at 1×.
// ZOOM_OUT pulls back just enough to show the grid context.
const ZOOM_IN = 1.05;   // barely above 1 — crisp, no upscale blur
const ZOOM_OUT = 0.58;   // reveal the surrounding grid

const DIM = 0.25;  // unfocused card opacity while zoomed in
const DIM_RELAXED = 0.55;  // unfocused card opacity while pulled back

const T = {
  hold: 2.6,
  zoomOut: 0.8,
  pan: 0.85,
  panOverlap: 0.25,
  zoomIn: 0.8,
};

// Cubic-bezier easing (0.65, 0, 0.35, 1)
function makeCubicBezier(x1: number, y1: number, x2: number, y2: number) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const X = (t: number) => ((ax * t + bx) * t + cx) * t;
  const Y = (t: number) => ((ay * t + by) * t + cy) * t;
  const dX = (t: number) => (3 * ax * t + 2 * bx) * t + cx;
  return (x: number) => {
    let t = x;
    for (let i = 0; i < 8; i++) {
      const e = X(t) - x; if (Math.abs(e) < 1e-5) break;
      const d = dX(t); if (Math.abs(d) < 1e-6) break;
      t -= e / d;
    }
    return Y(Math.min(1, Math.max(0, t)));
  };
}
const ease = makeCubicBezier(0.65, 0, 0.35, 1);

type TweenTarget = Record<string, number>;
function createTweenEngine() {
  type Tween = { obj: TweenTarget; prop: string; from: number; to: number; dur: number; start: number | null; resolve: () => void; };
  const tweens = new Set<Tween>();
  let ticking = false;
  let onRender: (() => void) | null = null;

  function tick(now: number) {
    for (const t of tweens) {
      if (t.start === null) t.start = now;
      const p = Math.min(1, (now - t.start) / t.dur);
      t.obj[t.prop] = t.from + (t.to - t.from) * ease(p);
      if (p >= 1) { tweens.delete(t); t.resolve(); }
    }
    onRender?.();
    if (tweens.size) requestAnimationFrame(tick); else ticking = false;
  }

  return {
    setRenderCallback(cb: () => void) { onRender = cb; },
    tween(obj: TweenTarget, prop: string, to: number, seconds: number): Promise<void> {
      return new Promise((resolve) => {
        tweens.add({ obj, prop, from: obj[prop], to, dur: seconds * 1000, start: null, resolve });
        if (!ticking) { ticking = true; requestAnimationFrame(tick); }
      });
    },
    killAll() { tweens.clear(); ticking = false; },
  };
}

interface HeroShowcaseProps {
  className?: string;
  isMobile?: boolean;
}

export default function HeroShowcase({ className, isMobile }: HeroShowcaseProps = {}) {
  const isDark = useIsDarkMode();

  const sceneRef = useRef<HTMLDivElement>(null);
  const cameraRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const imgRefs = useRef<HTMLImageElement[]>([]);
  const cardRefs = useRef<HTMLDivElement[]>([]);
  const frameRefs = useRef<HTMLDivElement[]>([]);
  const isDarkRef = useRef(isDark);
  isDarkRef.current = isDark;

  // Swap images and styling on theme change without restarting animation
  useEffect(() => {
    const imgs = isDark ? DARK_IMAGES : LIGHT_IMAGES;
    imgRefs.current.forEach((el, i) => { if (el) el.src = imgs[i % imgs.length]; });
    frameRefs.current.forEach((frame) => {
      if (frame) {
        frame.style.border = isDark ? '1px solid rgba(255,255,255,0.06)' : 'none';
        frame.style.background = isDark ? '#101622' : 'transparent';
        frame.style.boxShadow = isDark
          ? '0 12px 32px -6px rgba(0,0,0,0.65)'
          : '0 10px 28px -6px rgba(0,0,0,0.1)';
      }
    });
  }, [isDark]);

  // Build grid + run camera animation — once on mount
  useEffect(() => {
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    const grid = gridRef.current;
    if (!scene || !camera || !grid) return;

    const IMAGES = isDarkRef.current ? DARK_IMAGES : LIGHT_IMAGES;
    const N = IMAGES.length;
    // Tile 4 images so no two neighbours share the same image
    const imageOf = (i: number) => (Math.floor(i / COLS) * 2 + (i % COLS)) % N;

    imgRefs.current = [];
    cardRefs.current = [];
    frameRefs.current = [];
    grid.innerHTML = '';

    for (let i = 0; i < COUNT; i++) {
      const card = document.createElement('div');
      card.style.cssText = `
        position:relative;
        aspect-ratio:16/10;
        opacity:${DIM};
      `;

      const frame = document.createElement('div');
      frame.style.cssText = `
        position:absolute;inset:0;overflow:hidden;border-radius:10px;
        border:${isDarkRef.current ? '1px solid rgba(255,255,255,0.06)' : 'none'};
        background:${isDarkRef.current ? '#101622' : 'transparent'};
        box-shadow:${isDarkRef.current
          ? '0 12px 32px -6px rgba(0,0,0,0.65)'
          : '0 10px 28px -6px rgba(0,0,0,0.1)'};
      `;
      frameRefs.current.push(frame);

      const img = document.createElement('img');
      img.alt = '';
      img.loading = 'lazy';
      img.decoding = 'async';
      img.draggable = false;
      // Render images at their true pixel size — no GPU upscale blur
      img.style.cssText = `
        display:block;width:100%;height:100%;
        object-fit:cover;object-position:left top;
        image-rendering:-webkit-optimize-contrast;
        image-rendering:crisp-edges;
      `;
      img.src = IMAGES[imageOf(i)];
      frame.appendChild(img);
      imgRefs.current.push(img);

      // Zero-size marker for measuring card centres
      const marker = document.createElement('span');
      marker.style.cssText = 'position:absolute;left:50%;top:50%;width:0;height:0;pointer-events:none;';

      card.appendChild(frame);
      card.appendChild(marker);
      grid.appendChild(card);
      cardRefs.current.push(card);
    }

    const markers = Array.from(grid.querySelectorAll('span')) as HTMLElement[];

    // 4 inner cards in diagonal order → each stop = different image
    const SEQUENCE: number[] = [
      1 * COLS + 1,  // row1,col1
      2 * COLS + 2,  // row2,col2
      1 * COLS + 2,  // row1,col2
      2 * COLS + 1,  // row2,col1
    ];

    const S: TweenTarget = { scale: ZOOM_IN, px: 0, py: 0, relax: 0 };
    const focus: TweenTarget = {};
    for (let i = 0; i < COUNT; i++) focus[i] = 0;

    function render() {
      if (!camera) return;
      const x = -S.scale * S.px;
      const y = -S.scale * S.py;
      // NO will-change on camera — browser rasterises at current resolution each frame
      camera.style.transform = `translate(${x}px,${y}px) scale(${S.scale})`;
      const base = DIM + (DIM_RELAXED - DIM) * S.relax;
      for (let i = 0; i < COUNT; i++) {
        const f = focus[i];
        if (cardRefs.current[i])
          cardRefs.current[i].style.opacity = String(f + (1 - f) * base);
      }
    }

    let centers: { x: number; y: number }[] = [];
    function measure() {
      if (!scene) return;
      const r = scene.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const s = S.scale || 1;
      const tx = -S.scale * S.px;
      const ty = -S.scale * S.py;
      centers = markers.map((m) => {
        const b = m.getBoundingClientRect();
        return { x: (b.left - cx - tx) / s, y: (b.top - cy - ty) / s };
      });
    }

    const engine = createTweenEngine();
    engine.setRenderCallback(render);
    const { tween } = engine;

    let destroyed = false;
    const resizeObs = new ResizeObserver(() => measure());
    if (scene) resizeObs.observe(scene);

    const wait = (s: number) => new Promise<void>((r) => setTimeout(r, s * 1000));

    async function run() {
      await new Promise<void>((r) => requestAnimationFrame(() => r()));
      if (destroyed) return;
      measure();

      let pos = 0;
      let cur = SEQUENCE[0];
      S.px = centers[cur]?.x ?? 0;
      S.py = centers[cur]?.y ?? 0;
      S.scale = ZOOM_IN;
      S.relax = 0;
      focus[cur] = 1;
      render();

      for (; ;) {
        if (destroyed) return;
        await wait(T.hold);
        if (destroyed) return;

        pos = (pos + 1) % SEQUENCE.length;
        const next = SEQUENCE[pos];
        const target = centers[next] ?? { x: 0, y: 0 };

        // Zoom out
        const zoomOut = Promise.all([
          tween(S, 'scale', ZOOM_OUT, T.zoomOut),
          tween(S, 'relax', 1, T.zoomOut),
        ]);

        // Pan (overlapped with tail of zoom-out)
        await wait(T.zoomOut - T.panOverlap);
        if (destroyed) return;

        const pan = Promise.all([
          tween(S, 'px', target.x, T.pan),
          tween(S, 'py', target.y, T.pan),
          tween(focus, String(cur), 0, T.pan),
          tween(focus, String(next), 1, T.pan),
        ]);
        cur = next;
        await Promise.all([zoomOut, pan]);
        if (destroyed) return;

        // Zoom in
        await Promise.all([
          tween(S, 'scale', ZOOM_IN, T.zoomIn),
          tween(S, 'relax', 0, T.zoomIn),
        ]);
      }
    }

    run();

    return () => {
      destroyed = true;
      engine.killAll();
      resizeObs.disconnect();
      if (grid) grid.innerHTML = '';
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      aria-hidden="true"
      className={
        className ||
        'relative w-full h-[360px] sm:h-[420px] md:h-[480px] lg:h-[560px] xl:h-[620px] max-w-[540px] sm:max-w-[620px] md:max-w-[700px] lg:max-w-none mx-auto overflow-hidden select-none pointer-events-none'
      }
    >
      {/* Left edge fade overlay to smoothly dissolve cards before text area on desktop */}
      {!isMobile && (
        <div
          className="pointer-events-none absolute inset-y-0 left-0 w-28 xl:w-40 z-20"
          style={{
            background: `linear-gradient(to right, ${isDark ? '#090A0F' : '#F8FAFC'} 0%, transparent 100%)`,
          }}
        />
      )}

      {/* Scene wrapper: radial mask melts all outer edges into the page */}
      <div
        ref={sceneRef}
        style={{
          position: 'absolute',
          inset: 0,
          WebkitMaskImage: isMobile
            ? 'radial-gradient(ellipse 90% 86% at 50% 50%, #000 70%, transparent 100%)'
            : 'radial-gradient(ellipse 94% 90% at 55% 50%, #000 72%, transparent 100%)',
          maskImage: isMobile
            ? 'radial-gradient(ellipse 90% 86% at 50% 50%, #000 70%, transparent 100%)'
            : 'radial-gradient(ellipse 94% 90% at 55% 50%, #000 72%, transparent 100%)',
          overflow: 'hidden',
        }}
      >
        {/*
          Camera div — NO will-change here.
          will-change:transform rasterises the layer at its natural size and
          then GPU-upscales it → blurry images. Without it the browser
          re-rasterises each frame at the correct resolution → crisp.
        */}
        <div
          ref={cameraRef}
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transformOrigin: '50% 50%',
          }}
        >
          {/*
            Grid is wide so the camera shows 1 card per "scene width" when
            zoomed in at ~1×. No upscaling needed → no blur.
          */}
          <div
            ref={gridRef}
            style={{
              flexShrink: 0,
              width: '300%',
              display: 'grid',
              gridTemplateColumns: `repeat(${COLS}, 1fr)`,
              gap: 'clamp(8px, 1.2vw, 16px)',
            }}
          />
        </div>
      </div>
    </div>
  );
}

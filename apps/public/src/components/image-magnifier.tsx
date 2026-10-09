'use client';

import * as React from 'react';
import Image from 'next/image';
import { cn } from '@ecom/ui';

const ZOOM = 2.5;
const LENS = 168;

/**
 * Product image with a hover magnifier.
 *
 * A pointer over the frame shows a round lens holding the same image scaled up, its
 * background offset so the lens always reveals the point under the cursor. The zoomed
 * layer is a plain background-image rather than next/image: the optimiser would have to
 * emit a second, much larger variant, and the browser already has these bytes.
 *
 * Pointer type decides the behaviour. A mouse gets the lens on hover; touch has no
 * hover state and a lens under a fingertip would be hidden by the finger, so a tap
 * toggles a full-frame zoom that can then be panned by dragging.
 */
export function ImageMagnifier({
  src,
  alt,
  priority = false,
  className,
}: {
  src: string;
  alt: string;
  priority?: boolean;
  className?: string;
}) {
  const frame = React.useRef<HTMLDivElement>(null);
  const [lens, setLens] = React.useState<{ x: number; y: number } | null>(null);
  const [touchZoom, setTouchZoom] = React.useState(false);
  const [coarse, setCoarse] = React.useState(false);

  React.useEffect(() => {
    const query = window.matchMedia('(hover: none), (pointer: coarse)');
    const sync = () => setCoarse(query.matches);
    sync();
    query.addEventListener('change', sync);
    return () => query.removeEventListener('change', sync);
  }, []);

  const track = (clientX: number, clientY: number) => {
    const box = frame.current?.getBoundingClientRect();
    if (!box) return;
    const x = Math.min(Math.max(clientX - box.left, 0), box.width);
    const y = Math.min(Math.max(clientY - box.top, 0), box.height);
    setLens({ x: (x / box.width) * 100, y: (y / box.height) * 100 });
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (coarse && !touchZoom) return;
    track(event.clientX, event.clientY);
  };

  // Magnifying the display-sized file would just show its pixels. Where the source
  // carries a width parameter, ask for a larger variant for the zoom layer only.
  const zoomSrc = React.useMemo(
    () => src.replace(/([?&]w=)(\d+)/, (_match, prefix, width) => prefix + Math.max(1600, Number(width) * 2)),
    [src],
  );

  const showLens = !coarse && lens !== null;
  const zoomStyle = lens
    ? {
        backgroundImage: `url(${zoomSrc})`,
        backgroundSize: `${ZOOM * 100}%`,
        backgroundPosition: `${lens.x}% ${lens.y}%`,
      }
    : undefined;

  return (
    <div className="space-y-2">
      <div
        ref={frame}
        onPointerMove={onPointerMove}
        onPointerLeave={() => setLens(null)}
        onClick={() => coarse && setTouchZoom((on) => !on)}
        className={cn(
          'relative aspect-square overflow-hidden rounded-2xl border border-line bg-surface-sunken',
          coarse ? 'cursor-zoom-in' : 'cursor-crosshair',
          className,
        )}
      >
        <Image
          src={src}
          alt={alt}
          fill
          priority={priority}
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-cover"
        />

        {coarse && touchZoom && lens && (
          <div className="absolute inset-0 bg-no-repeat" style={zoomStyle} aria-hidden="true" />
        )}

        {showLens && (
          <div
            className="pointer-events-none absolute rounded-full border-2 border-white/80 bg-no-repeat shadow-overlay ring-1 ring-ink/10"
            style={{
              ...zoomStyle,
              width: LENS,
              height: LENS,
              left: `calc(${lens.x}% - ${LENS / 2}px)`,
              top: `calc(${lens.y}% - ${LENS / 2}px)`,
            }}
            aria-hidden="true"
          />
        )}
      </div>

      <p className="text-2xs text-ink-muted">
        {coarse ? (touchZoom ? 'Drag to pan, tap to exit zoom' : 'Tap the image to zoom') : 'Hover to magnify'}
      </p>
    </div>
  );
}

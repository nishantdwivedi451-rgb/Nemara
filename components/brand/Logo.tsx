// Nemara identity — the lotus line-mark over a widely tracked classical wordmark.
// Letterforms are outlined (lib/brand/logo-paths.ts), so they emboss, foil and scale with no font
// dependency. Colour follows `currentColor`.
import { TAGLINE, WORDMARK } from "@/lib/brand/logo-paths";

/** Lotus petals as open outlines — drawn with a stroke so the line weight stays even at every size. */
export const LOTUS_PATHS = [
  "M60 66C47 52 47 27 60 6C73 27 73 52 60 66Z",
  "M57 66C40 61 31 44 33 21C47 29 56 46 57 66Z",
  "M63 66C80 61 89 44 87 21C73 29 64 46 63 66Z",
  "M52 66C35 67 17 59 7 42C22 40 41 47 52 66Z",
  "M68 66C85 67 103 59 113 42C98 40 79 47 68 66Z",
];
export const LOTUS_VIEWBOX = "0 0 120 72";

export function Lotus({ className, title, weight = 3.4 }: { className?: string; title?: string; weight?: number }) {
  return (
    <svg className={className} viewBox="2 2 116 68" role={title ? "img" : undefined} aria-label={title} aria-hidden={title ? undefined : true}
      fill="none" stroke="currentColor" strokeWidth={weight} strokeLinejoin="round" strokeLinecap="round">
      {LOTUS_PATHS.map((d) => <path key={d} d={d} />)}
    </svg>
  );
}

export function Wordmark({ className, title = "Nemara" }: { className?: string; title?: string }) {
  return (
    <svg className={className} viewBox={`0 0 ${WORDMARK.width} ${WORDMARK.height}`} role="img" aria-label={title} fill="currentColor">
      <path d={WORDMARK.d} />
    </svg>
  );
}

/** Stacked lockup from the brand card: lotus, wordmark and (optionally) the ruled tagline. */
export function Lockup({ className, tagline = false, title = "Nemara" }: { className?: string; tagline?: boolean; title?: string }) {
  const W = WORDMARK.width, lotusW = 270, lotusH = 158, gap = 34;
  const tagScale = 0.2, tagCap = 100 * tagScale;
  const tagY = lotusH + gap + 100 + 46;
  const H = tagline ? tagY + tagCap + 4 : lotusH + gap + 100 + 2;
  const tw = TAGLINE.width * tagScale;
  return (
    <svg className={className} viewBox={`0 -4 ${W} ${H + 4}`} role="img" aria-label={title} fill="currentColor">
      <g transform={`translate(${(W - lotusW) / 2} 0) scale(${lotusW / 116}) translate(-2 -2)`} fill="none" stroke="currentColor" strokeWidth={3.2} strokeLinejoin="round">
        {LOTUS_PATHS.map((d) => <path key={d} d={d} />)}
      </g>
      <path transform={`translate(0 ${lotusH + gap})`} d={WORDMARK.d} />
      {tagline && (
        <g transform={`translate(0 ${tagY})`}>
          <path transform={`translate(${(W - tw) / 2} 0) scale(${tagScale})`} d={TAGLINE.d} />
          <path d={`M0 ${tagCap / 2}H${(W - tw) / 2 - 26}M${(W + tw) / 2 + 26} ${tagCap / 2}H${W}`} stroke="currentColor" strokeWidth={3} />
        </g>
      )}
    </svg>
  );
}

/** Lotus alone — favicon, stamp, packaging and social mark. */
export function Mark({ className, title = "Nemara" }: { className?: string; title?: string }) {
  return <Lotus className={className} title={title} />;
}

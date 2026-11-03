// Watercolour lavender botanicals from the brand card — pure SVG (no raster), softened with a
// turbulence filter so the edges bleed like paint. Decorative only: always aria-hidden.
import { useId } from "react";

const LEAF = "M0 0C22-17 62-19 96 0C62 19 22 17 0 0Z";
const PETAL = "M0 0C24-24 74-30 118 0C74 30 24 24 0 0Z";

function Defs({ id }: { id: string }) {
  return (
    <defs>
      <linearGradient id={`${id}-leaf`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#8E6BB8" stopOpacity=".95" />
        <stop offset=".55" stopColor="#B69ADB" stopOpacity=".85" />
        <stop offset="1" stopColor="#D9C8EE" stopOpacity=".7" />
      </linearGradient>
      <radialGradient id={`${id}-petal`} cx="0" cy=".5" r="1">
        <stop offset="0" stopColor="#F3EAFB" />
        <stop offset=".45" stopColor="#C6AEE6" />
        <stop offset="1" stopColor="#8F6BBF" />
      </radialGradient>
      <filter id={`${id}-paint`} x="-10%" y="-10%" width="120%" height="120%">
        <feTurbulence type="fractalNoise" baseFrequency=".035" numOctaves="2" seed="7" />
        <feDisplacementMap in="SourceGraphic" scale="5" />
      </filter>
    </defs>
  );
}

function Leaf({ x, y, a, s = 1, id }: { x: number; y: number; a: number; s?: number; id: string }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${a}) scale(${s})`}>
      <path d={LEAF} fill={`url(#${id}-leaf)`} />
      <path d="M4 0C34-2 64-2 90 0" stroke="#F4ECFA" strokeOpacity=".7" strokeWidth="1.4" fill="none" />
    </g>
  );
}

function Stamens({ x, y, a, n = 6, len = 46 }: { x: number; y: number; a: number; n?: number; len?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${a})`}>
      {Array.from({ length: n }, (_, i) => {
        const t = -32 + (64 / (n - 1)) * i, r = len * (0.78 + ((i * 37) % 5) * 0.06);
        const ex = Math.cos((t * Math.PI) / 180) * r, ey = Math.sin((t * Math.PI) / 180) * r;
        return (
          <g key={i}>
            <path d={`M0 0Q${ex * 0.5} ${ey * 0.5 - 6} ${ex} ${ey}`} stroke="#E0A848" strokeWidth="1.3" fill="none" />
            <ellipse cx={ex} cy={ey} rx="3.6" ry="2.2" transform={`rotate(${t} ${ex} ${ey})`} fill="#E39A3B" />
          </g>
        );
      })}
    </g>
  );
}

/** Sprig with leaves and a stamen cluster — the card's top-left corner. Place in a corner; flip with CSS. */
export function FloralSprig({ className }: { className?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg className={className} viewBox="0 0 400 400" aria-hidden="true" focusable="false">
      <Defs id={id} />
      <g filter={`url(#${id}-paint)`}>
        <path d="M18 392C70 300 120 220 190 150S320 50 380 30" stroke="#8B68B5" strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M120 222C150 175 175 150 215 128" stroke="#8B68B5" strokeWidth="2" fill="none" />
        <Leaf id={id} x={62} y={312} a={-118} s={0.9} />
        <Leaf id={id} x={70} y={300} a={-20} s={0.8} />
        <Leaf id={id} x={110} y={240} a={-140} s={1} />
        <Leaf id={id} x={128} y={222} a={-40} s={0.95} />
        <Leaf id={id} x={190} y={152} a={-150} s={0.85} />
        <Leaf id={id} x={210} y={132} a={-30} s={1.05} />
        <Leaf id={id} x={280} y={86} a={-165} s={0.8} />
        <Leaf id={id} x={300} y={70} a={-45} s={0.85} />
        <Leaf id={id} x={215} y={128} a={-75} s={0.7} />
        <Leaf id={id} x={360} y={36} a={-15} s={0.6} />
      </g>
      <Stamens x={150} y={190} a={-62} n={7} len={52} />
      <Stamens x={232} y={118} a={-20} n={5} len={34} />
    </svg>
  );
}

/** Open lily with saffron stamens and leaves — the card's bottom-right corner. */
export function FloralLily({ className }: { className?: string }) {
  const id = useId().replace(/:/g, "");
  const cx = 230, cy = 230;
  return (
    <svg className={className} viewBox="0 0 400 400" aria-hidden="true" focusable="false">
      <Defs id={id} />
      <g filter={`url(#${id}-paint)`}>
        <path d="M398 398C340 330 290 290 230 232" stroke="#8B68B5" strokeWidth="3" fill="none" />
        <path d="M40 372C120 330 190 300 300 300" stroke="#8B68B5" strokeWidth="2.4" fill="none" />
        <Leaf id={id} x={300} y={300} a={150} s={1.1} />
        <Leaf id={id} x={210} y={318} a={195} s={1} />
        <Leaf id={id} x={130} y={346} a={160} s={0.9} />
        <Leaf id={id} x={330} y={332} a={-80} s={1.1} />
        <Leaf id={id} x={370} y={372} a={-110} s={0.9} />
        <Leaf id={id} x={340} y={250} a={-70} s={0.9} />
        <Leaf id={id} x={300} y={210} a={-58} s={1} />
        {[200, 255, 310, 10, 140, 75].map((a, i) => (
          <g key={a} transform={`translate(${cx} ${cy}) rotate(${a}) scale(${i % 2 ? 0.92 : 1.05})`}>
            <path d={PETAL} fill={`url(#${id}-petal)`} opacity=".93" />
            <path d="M8 0C40-3 80-3 108 0" stroke="#7D58AC" strokeOpacity=".35" strokeWidth="1.2" fill="none" />
          </g>
        ))}
      </g>
      <Stamens x={cx} y={cy} a={-118} n={7} len={64} />
    </svg>
  );
}

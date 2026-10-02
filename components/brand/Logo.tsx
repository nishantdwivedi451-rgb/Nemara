// Nemara wordmark & mark — original Didone-contrast letterforms drawn as paths (no font dependency),
// so they emboss, stamp and scale cleanly. Colour follows `currentColor`.

export function Wordmark({ className, title = "Nemara" }: { className?: string; title?: string }) {
  return (
    <svg className={className} viewBox="0 0 552 100" role="img" aria-label={title} fill="currentColor">
      <path d="M0 0h3v100H0zM67 0h3v100h-3zM0 0h14l56 100H56z" />
      <path d="M92 0h14v100H92zM92 0h56v3H92zM92 48.5h44v3H92zM92 97h58v3H92z" />
      <path d="M172 0h3v100h-3zM172 0h14l34 100h-7zM214 100h3l34-100h-3zM248 0h14v100h-14z" />
      <path d="M284 100h3l36-100h-3zM320 0h8l32 100h-14zM297 64h41v3h-41z" />
      <path d="M382 0h14v100h-14zM396 0h24c20 0 26 12 26 26s-8 26-26 26h-24v-3h22c14 0 16-11 16-23s-4-23-16-23h-22zM414 52h12l28 48h-14z" />
      <path d="M476 100h3l36-100h-3zM512 0h8l32 100h-14zM489 64h41v3h-41z" />
    </svg>
  );
}

/** The N wearing a single bead — favicon, stamp, packaging and social mark. */
export function Mark({ className, title = "Nemara" }: { className?: string; title?: string }) {
  return (
    <svg className={className} viewBox="-15 -30 100 140" role="img" aria-label={title} fill="currentColor">
      <path d="M0 0h3v100H0zM67 0h3v100h-3zM0 0h14l56 100H56z" />
      <circle cx="68.5" cy="-14" r="7" />
    </svg>
  );
}

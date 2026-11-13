export type Tone = 'green' | 'orange' | 'gold';

/** Le losange vert des Sims : humeur du joueur. Les couleurs viennent de sims.css (classe sims-tone-*). */
export function Plumbob({ tone, inline = false }: { tone: Tone; inline?: boolean }) {
  const id = `pb-${tone}`;
  return (
    <svg
      viewBox="0 0 22 32"
      className={`sims-tone-${tone} ${inline ? 'sims-plumbob-inline' : 'sims-plumbob'}`}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" className="sims-pb-light" />
          <stop offset="0.55" className="sims-pb-mid" />
          <stop offset="1" className="sims-pb-dark" />
        </linearGradient>
      </defs>
      <polygon
        points="11,1 21,16 11,31 1,16"
        fill={`url(#${id})`}
        className="sims-pb-edge"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <polygon points="11,1 21,16 11,16" className="sims-pb-hi" />
      <polygon points="11,16 21,16 11,31" className="sims-pb-lo" />
    </svg>
  );
}

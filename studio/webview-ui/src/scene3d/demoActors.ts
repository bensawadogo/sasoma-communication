import { useEffect, useState } from 'react';

import type { StudioActor } from './Studio3D.js';

const TEAM = [
  'Chef de studio',
  'Veilleur',
  'Stratège',
  'Scénariste',
  'Créateur visuel',
  'Contrôleur',
  'Programmateur',
  'Publicitaire',
  'Analyste',
  'Formateur',
  'Commercial',
];

/**
 * A made-up team for looking at the 3D office without launching any agent (add ?demo3d to the address).
 * Everyone arrives one after the other, then somebody finishes and goes to the lounge, or comes back, every few seconds.
 */
export function useDemoActors(enabled: boolean): StudioActor[] {
  const [actors, setActors] = useState<StudioActor[]>([]);
  useEffect(() => {
    if (!enabled) return;
    let step = 0;
    const timer = window.setInterval(() => {
      step += 1;
      setActors((prev) => {
        if (prev.length < TEAM.length) {
          const i = prev.length;
          return [...prev, { key: `demo:${i}`, ownerId: i, name: TEAM[i], helper: false, waiting: false, detail: 'rédige' }];
        }
        // Once everyone is in, someone finishes or gets back to work only every few seconds.
        if (step % 4 !== 0) return prev;
        const i = (step * 5) % TEAM.length;
        return prev.map((a, k) => (k === i ? { ...a, waiting: !a.waiting } : a));
      });
    }, 1600);
    return () => window.clearInterval(timer);
  }, [enabled]);
  return enabled ? actors : [];
}

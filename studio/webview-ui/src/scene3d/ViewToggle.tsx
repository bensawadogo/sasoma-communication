import './scene3d.css';

interface Props {
  is3d: boolean;
  onToggle: () => void;
}

/** Switches the office between the 3D scene and the older 2D one. */
export function ViewToggle({ is3d, onToggle }: Props) {
  return (
    <button
      type="button"
      className="view-toggle"
      onClick={onToggle}
      aria-pressed={is3d}
      aria-label={is3d ? 'Passer au bureau en 2D' : 'Passer au bureau en 3D'}
    >
      {is3d ? '2D' : '3D'}
    </button>
  );
}

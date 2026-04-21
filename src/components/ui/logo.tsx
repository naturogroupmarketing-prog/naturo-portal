/* eslint-disable @next/next/no-img-element */
interface LogoProps {
  size?: number;
  className?: string;
  iconOnly?: boolean;
}

export function Logo({ size = 32, className = "", iconOnly = false }: LogoProps) {
  return (
    <span className={`inline-flex items-center select-none ${className}`}>
      <img
        src="/Logotrackio.svg"
        alt="trackio"
        draggable={false}
        style={{
          // Explicit height (not max-height) gives the browser a concrete render
          // target so the SVG stays crisp at all sizes. width:auto preserves
          // the aspect ratio; maxWidth guards against overflow on narrow phones.
          height: `${Math.round(size * 0.7)}px`,
          width: "auto",
          maxWidth: "160px",
        }}
      />
    </span>
  );
}

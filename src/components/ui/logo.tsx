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
          // maxHeight keeps vertical rhythm; maxWidth prevents the 5:1 aspect-ratio
          // SVG from overflowing the header on narrow phones (360 px Android).
          // Both constraints together let the browser scale proportionally.
          maxHeight: `${size * 0.7}px`,
          maxWidth: "160px",
          width: "auto",
          height: "auto",
        }}
      />
    </span>
  );
}

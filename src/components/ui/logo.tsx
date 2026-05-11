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
          // Explicit height lets the browser give the SVG a concrete render target.
          // NO maxWidth — clamping width while keeping an explicit height distorts
          // the 5:1 aspect ratio and forces the embedded PNG to be squished & blurry.
          // The SVG's natural width at this height is size*0.7*5 ≈ size*3.5 px,
          // which is well within any normal header width.
          height: `${Math.round(size * 0.7)}px`,
          width: "auto",
        }}
      />
    </span>
  );
}

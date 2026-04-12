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
        src="/Logo_trackio.svg"
        alt="Trackio"
        height={size}
        style={{ height: `${size}px`, width: "auto" }}
        draggable={false}
      />
    </span>
  );
}

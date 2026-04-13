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
        src="/trackio_t_full_logo.svg"
        alt="trackio"
        height={size}
        style={{ height: `${size * 0.7}px`, width: "auto" }}
        draggable={false}
      />
    </span>
  );
}

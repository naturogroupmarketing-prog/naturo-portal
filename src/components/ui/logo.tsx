interface LogoProps {
  size?: number;
  className?: string;
}

export function Logo({ size = 32, className = "" }: LogoProps) {
  const fontSize = size * 0.65;

  return (
    <span
      className={`font-exo font-semibold select-none ${className}`}
      style={{ fontSize: `${fontSize}px`, lineHeight: 1, fontWeight: 600, color: "#1F3DD9" }}
    >
      trackio
    </span>
  );
}

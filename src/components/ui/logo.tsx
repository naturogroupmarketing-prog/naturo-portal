interface LogoProps {
  size?: number;
  className?: string;
  iconOnly?: boolean;
}

export function Logo({ size = 32, className = "", iconOnly = false }: LogoProps) {
  const fontSize = size * 0.65;
  const iconSize = size * 0.7;
  const color = "#1F3DD9";

  return (
    <span className={`inline-flex items-center gap-1.5 select-none ${className}`}>
      {/* Plug/connector icon */}
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Horizontal line from left */}
        <rect x="0" y="17" width="12" height="6" rx="3" fill={color} />
        {/* Rounded square body */}
        <rect x="10" y="8" width="24" height="24" rx="5" fill={color} />
        {/* Dash inside the square */}
        <rect x="16" y="17.5" width="12" height="5" rx="2.5" fill="white" />
      </svg>
      {/* Text */}
      {!iconOnly && (
        <span
          className="font-exo"
          style={{ fontSize: `${fontSize}px`, lineHeight: 1, fontWeight: 450, color }}
        >
          trackio
        </span>
      )}
    </span>
  );
}

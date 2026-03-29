interface LogoProps {
  size?: number;
  className?: string;
  iconOnly?: boolean;
}

export function Logo({ size = 32, className = "", iconOnly = false }: LogoProps) {
  const fontSize = size * 0.65;
  const iconSize = size * 0.75;
  const color = "#1F3DD9";

  return (
    <span className={`inline-flex items-center select-none ${className}`} style={{ gap: `${size * 0.08}px` }}>
      {/* Plug/connector icon */}
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Horizontal line from left */}
        <rect x="0" y="21" width="16" height="6" rx="1" fill={color} />
        {/* Rounded square plug head */}
        <rect x="13" y="10" width="28" height="28" rx="6" fill={color} />
        {/* White dash inside the square */}
        <rect x="21" y="21" width="14" height="6" rx="3" fill="white" />
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

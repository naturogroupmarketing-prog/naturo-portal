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
    <span className={`inline-flex items-center select-none ${className}`} style={{ gap: `${size * 0.06}px` }}>
      {/* Plug/connector icon — thin strokes matching the font weight */}
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: "block" }}
      >
        {/* Thin horizontal line from far left to the square */}
        <rect x="0" y="22" width="15" height="3.5" rx="1.75" fill={color} />
        {/* Rounded square — outline style (stroke, not filled) */}
        <rect x="14" y="12" width="22" height="22" rx="4.5" stroke={color} strokeWidth="3.5" fill="none" />
        {/* Thin white dash inside the square */}
        <rect x="20" y="21.5" width="10" height="3.5" rx="1.75" fill={color} />
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

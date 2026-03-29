interface LogoProps {
  size?: number;
  className?: string;
  iconOnly?: boolean;
}

export function Logo({ size = 32, className = "", iconOnly = false }: LogoProps) {
  const fontSize = size * 0.7;
  const iconSize = size * 0.85;
  const color = "#1F3DD9";

  return (
    <span className={`inline-flex items-center select-none ${className}`} style={{ gap: `${size * 0.12}px` }}>
      {/* Circle icon with arrow and connector */}
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Horizontal connector bar from left */}
        <rect x="0" y="27" width="14" height="10" rx="2" fill={color} />
        {/* Main circle (thick stroke) */}
        <circle cx="36" cy="32" r="20" stroke={color} strokeWidth="8" fill="none" />
        {/* Arrow/chevron inside circle pointing right */}
        <path d="M30 22L42 32L30 42" stroke="white" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        {/* Small vertical connector at top */}
        <rect x="31" y="2" width="10" height="12" rx="2" fill={color} />
      </svg>
      {/* Text */}
      {!iconOnly && (
        <span
          className="font-exo"
          style={{ fontSize: `${fontSize}px`, lineHeight: 1, fontWeight: 450, color, letterSpacing: "-0.02em" }}
        >
          trackio
        </span>
      )}
    </span>
  );
}

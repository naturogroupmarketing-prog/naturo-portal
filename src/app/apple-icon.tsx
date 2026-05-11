import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#7c3aed",
          borderRadius: "36px",
          fontFamily: "sans-serif",
        }}
      >
        <span
          style={{
            fontSize: "120px",
            fontWeight: 700,
            color: "white",
            marginTop: "-4px",
          }}
        >
          t
        </span>
      </div>
    ),
    { ...size }
  );
}

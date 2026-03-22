import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
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
          borderRadius: "8px",
          fontFamily: "sans-serif",
        }}
      >
        <span
          style={{
            fontSize: "22px",
            fontWeight: 700,
            color: "white",
            marginTop: "-1px",
          }}
        >
          t
        </span>
      </div>
    ),
    { ...size }
  );
}

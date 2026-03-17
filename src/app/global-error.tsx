"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          background: "#f4f5f7",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
        }}
      >
        <div
          style={{
            textAlign: "center",
            maxWidth: 480,
            padding: "48px 24px",
            background: "#ffffff",
            borderRadius: 12,
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: "#fef2f2",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 24px",
              fontSize: 28,
            }}
          >
            !
          </div>
          <h1
            style={{
              fontSize: 24,
              fontWeight: 700,
              color: "#0f1b3d",
              margin: "0 0 8px",
            }}
          >
            Something went wrong
          </h1>
          <p
            style={{
              fontSize: 15,
              color: "#6b7280",
              margin: "0 0 24px",
              lineHeight: 1.5,
            }}
          >
            An unexpected error occurred. Our team has been notified.
            {error.digest && (
              <span style={{ display: "block", fontSize: 12, marginTop: 8, color: "#9ca3af" }}>
                Error ID: {error.digest}
              </span>
            )}
          </p>
          <button
            onClick={reset}
            style={{
              padding: "10px 24px",
              fontSize: 14,
              fontWeight: 600,
              color: "#ffffff",
              background: "#0f1b3d",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
            }}
          >
            Try Again
          </button>
        </div>
      </body>
    </html>
  );
}

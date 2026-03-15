import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#0C447C",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "6px",
        }}
      >
        <span
          style={{
            color: "#1D9E75",
            fontSize: "14px",
            fontWeight: "700",
            letterSpacing: "-0.5px",
          }}
        >
          ETF
        </span>
      </div>
    ),
    { ...size }
  );
}

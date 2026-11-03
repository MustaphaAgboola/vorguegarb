import { ImageResponse } from "next/og";

// Browser tab / address bar icon. Next.js links it from every page.
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
          background: "#0A0A0A",
          color: "#FFFFFF",
          fontSize: 17,
          fontWeight: 700,
          letterSpacing: "-0.04em",
        }}
      >
        VG
      </div>
    ),
    size
  );
}

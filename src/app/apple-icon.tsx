import { ImageResponse } from "next/og";

// Home-screen icon when the site is saved on an iPhone or iPad.
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
          background: "#0A0A0A",
          color: "#FFFFFF",
          fontSize: 84,
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

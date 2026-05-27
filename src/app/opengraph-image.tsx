import { ImageResponse } from "next/og";
import fs from "fs";
import path from "path";

export const dynamic = "force-static";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const [serifFont, sansFont] = await Promise.all([
    fs.promises.readFile(
      path.resolve(
        process.cwd(),
        "node_modules/@fontsource/ibm-plex-serif/files/ibm-plex-serif-latin-400-normal.woff"
      )
    ),
    fs.promises.readFile(
      path.resolve(
        process.cwd(),
        "node_modules/@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-400-normal.woff"
      )
    ),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          backgroundColor: "#004144",
          display: "flex",
        }}
      >
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            padding: "80px 96px",
            height: "100%",
            gap: 16,
          }}
        >
          <div
            style={{
              fontSize: 36,
              color: "#ffffff",
              fontFamily: "IBM Plex Sans",
              display: "flex",
            }}
          >
            Quantum Technical Working Groups
          </div>
          <div
            style={{
              fontSize: 90,
              color: "#ffffff",
              fontFamily: "IBM Plex Serif",
              fontWeight: 400,
              lineHeight: 1.1,
              display: "flex",
              textWrap: 'balance'
            }}
          >
            Quantum research for the real world
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: "IBM Plex Serif",
          data: serifFont,
          weight: 400,
          style: "normal",
        },
        {
          name: "IBM Plex Sans",
          data: sansFont,
          weight: 400,
          style: "normal",
        },
      ],
    }
  );
}

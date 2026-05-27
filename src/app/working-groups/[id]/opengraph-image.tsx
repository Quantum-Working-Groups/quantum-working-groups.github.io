import { ImageResponse } from "next/og";
import { getWorkingGroups } from "@/lib/working-groups";
import fs from "fs";
import path from "path";

export const dynamic = "force-static";

export { generateStaticParams } from "@/app/working-groups/[id]/page";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function Image({ params }: Props) {
  const { id } = await params;
  const group = getWorkingGroups().find((g) => g.id === id);

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
            gap: 12,
          }}
        >
          <div
            style={{
              fontSize: 28,
              color: "#ffffff",
              fontFamily: "IBM Plex Sans",
              display: "flex",
            }}
          >
            Quantum Technical Working Groups
          </div>
          {group && (
            <div
              style={{
                fontSize: 52,
                color: "#ffffff",
                fontFamily: "IBM Plex Serif",
                fontWeight: 400,
                lineHeight: 1.15,
                maxWidth: 900,
                display: "flex",
                textWrap: 'balance'
              }}
            >
              {group.title}
            </div>
          )}
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

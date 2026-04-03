import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const outputDir = path.join(root, "website-images", "generated");
const outputPath = path.join(outputDir, "acefloor-premium-garage-crown-supercar.png");
const tileDir = path.join(root, "apps", "web", "public", "media", "crown-series", "top");
const basePhotoPath = "/tmp/acefloor-light-1.jpg";
const carPhotoPath = "/tmp/supercar-2.png";

const WIDTH = 1600;
const HEIGHT = 1600;
const FLOOR_TOP_Y = 900;
const FLOOR_BOTTOM_Y = 1680;
const FLOOR_TOP_LEFT_X = 410;
const FLOOR_TOP_RIGHT_X = 1275;
const FLOOR_BOTTOM_LEFT_X = 40;
const FLOOR_BOTTOM_RIGHT_X = 1575;

function lerp(start, end, t) {
  return start + (end - start) * t;
}

function svgBuffer(svg) {
  return Buffer.from(svg);
}

async function loadTile(name, size) {
  return sharp(path.join(tileDir, `${name}.jpg`))
    .trim()
    .resize(size, size, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();
}

async function buildFloorTexture() {
  const tileSize = 180;
  const cols = 12;
  const rows = 10;
  const buffers = {
    noir: await loadTile("noir", tileSize),
    charcoal: await loadTile("charcoal", tileSize),
    "gris-pale": await loadTile("gris-pale", tileSize),
    blanc: await loadTile("blanc", tileSize),
  };

  const composites = [];
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      let color = (row + col) % 2 === 0 ? "noir" : "charcoal";
      const isCenterPanel = col >= 4 && col <= 7 && row >= 2 && row <= 8;
      if (isCenterPanel) {
        color = (row + col) % 2 === 0 ? "gris-pale" : "charcoal";
      }
      if (row === 4 && col >= 3 && col <= 8) {
        color = col % 2 === 0 ? "blanc" : "gris-pale";
      }
      composites.push({
        input: buffers[color],
        left: col * tileSize,
        top: row * tileSize,
      });
    }
  }

  const floorBase = sharp({
    create: {
      width: cols * tileSize,
      height: rows * tileSize,
      channels: 4,
      background: { r: 12, g: 13, b: 17, alpha: 1 },
    },
  });

  return floorBase
    .composite(composites)
    .modulate({ brightness: 0.94, saturation: 0.92 })
    .png()
    .toBuffer();
}

async function buildFloorPerspective(textureBuffer) {
  const metadata = await sharp(textureBuffer).metadata();
  const stripCount = 160;
  const composites = [];

  for (let index = 0; index < stripCount; index += 1) {
    const t0 = index / stripCount;
    const t1 = (index + 1) / stripCount;
    const mid = (t0 + t1) / 2;
    const eased = Math.pow(mid, 1.04);

    const destTop = Math.round(lerp(FLOOR_TOP_Y, FLOOR_BOTTOM_Y, t0));
    const destBottom = Math.round(lerp(FLOOR_TOP_Y, FLOOR_BOTTOM_Y, t1));
    const destHeight = Math.max(5, destBottom - destTop + 2);
    const left = Math.round(lerp(FLOOR_TOP_LEFT_X, FLOOR_BOTTOM_LEFT_X, eased));
    const right = Math.round(lerp(FLOOR_TOP_RIGHT_X, FLOOR_BOTTOM_RIGHT_X, eased));
    const width = Math.max(16, right - left);

    const srcTop = Math.floor(t0 * metadata.height);
    const srcBottom = Math.max(srcTop + 1, Math.floor(t1 * metadata.height));
    const srcHeight = Math.max(1, srcBottom - srcTop);

    let row = sharp(textureBuffer)
      .extract({
        left: 0,
        top: srcTop,
        width: metadata.width,
        height: srcHeight,
      })
      .resize(width, destHeight, { fit: "fill" })
      .modulate({
        brightness: 0.56 + mid * 0.2,
        saturation: 0.72 + mid * 0.12,
      });

    row = row.blur(mid < 0.18 ? 0.8 : 0.3);

    const topFade = Math.min(1, mid / 0.16);
    const bottomFade = Math.min(1, (1 - mid) / 0.14);
    const edgeFade = Math.max(0, Math.min(topFade, bottomFade));
    const alpha = (0.18 + mid * 0.34) * edgeFade;
    composites.push({
      input: await row.ensureAlpha(alpha).png().toBuffer(),
      left,
      top: destTop,
    });
  }

  return composites;
}

function buildFloorOverlays() {
  const shadowSvg = `
    <svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="floorShade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="rgba(0,0,0,0.62)" />
          <stop offset="40%" stop-color="rgba(0,0,0,0.14)" />
          <stop offset="100%" stop-color="rgba(0,0,0,0.24)" />
        </linearGradient>
        <radialGradient id="floorGlow" cx="50%" cy="58%" r="34%">
          <stop offset="0%" stop-color="rgba(255,255,255,0.16)" />
          <stop offset="45%" stop-color="rgba(160,215,255,0.08)" />
          <stop offset="100%" stop-color="rgba(0,0,0,0)" />
        </radialGradient>
      </defs>
      <polygon points="410,900 1275,900 1575,1680 40,1680" fill="url(#floorShade)" />
      <ellipse cx="840" cy="1215" rx="350" ry="185" fill="url(#floorGlow)" />
    </svg>
  `;

  const roomMoodSvg = `
    <svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="ceilingBloom" cx="50%" cy="14%" r="56%">
          <stop offset="0%" stop-color="rgba(255,255,255,0.20)" />
          <stop offset="32%" stop-color="rgba(125,196,255,0.16)" />
          <stop offset="100%" stop-color="rgba(0,0,0,0)" />
        </radialGradient>
        <radialGradient id="vignette" cx="50%" cy="48%" r="68%">
          <stop offset="60%" stop-color="rgba(0,0,0,0)" />
          <stop offset="100%" stop-color="rgba(0,0,0,0.5)" />
        </radialGradient>
      </defs>
      <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#ceilingBloom)" />
      <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#vignette)" />
    </svg>
  `;

  return {
    shadow: svgBuffer(shadowSvg),
    roomMood: svgBuffer(roomMoodSvg),
  };
}

async function buildCarAssets() {
  const carBase = await sharp(carPhotoPath)
    .trim()
    .modulate({ brightness: 1.1, saturation: 1.02 })
    .png()
    .toBuffer();

  const cyanGlow = await sharp(carBase)
    .resize({ width: 760 })
    .blur(16)
    .tint({ r: 122, g: 211, b: 255 })
    .ensureAlpha(0.12)
    .png()
    .toBuffer();

  const car = await sharp(carBase)
    .resize({ width: 760 })
    .sharpen({ sigma: 1.05, m1: 0.28, m2: 0.92 })
    .png()
    .toBuffer();

  return { car, cyanGlow };
}

async function main() {
  await fs.mkdir(outputDir, { recursive: true });

  const floorTexture = await buildFloorTexture();
  const floorPerspective = await buildFloorPerspective(floorTexture);
  const floorOverlays = buildFloorOverlays();
  const carAssets = await buildCarAssets();

  const result = await sharp(basePhotoPath)
    .resize(WIDTH, HEIGHT, { fit: "cover", position: "centre" })
    .modulate({ brightness: 0.97, saturation: 1.05 })
    .composite([
      ...floorPerspective,
      { input: floorOverlays.shadow, blend: "over" },
      { input: carAssets.cyanGlow, left: 475, top: 810, blend: "screen" },
      { input: carAssets.car, left: 495, top: 820, blend: "over" },
      { input: floorOverlays.roomMood, blend: "over" },
    ])
    .sharpen({ sigma: 1.1, m1: 0.35, m2: 0.9 })
    .png()
    .toFile(outputPath);

  console.log(`Saved ${outputPath}`);
  return result;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

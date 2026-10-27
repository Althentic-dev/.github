/**
 * generate-matrix-banner.js
 * ---------------------------------------------------------
 * Renders an animated "matrix rain" banner (blue Althentic theme)
 * as a GIF, frame by frame, using node-canvas + gifencoder.
 *
 * Output: profile/matrix-banner.gif
 *
 * Run via: node scripts/generate-matrix-banner.js
 * (Executed automatically by .github/workflows/matrix-banner.yml)
 * ---------------------------------------------------------
 */

const fs = require("fs");
const path = require("path");
const { createCanvas } = require("canvas");
const GIFEncoder = require("gifencoder");

const WIDTH = 1200;
const HEIGHT = 260;
const FONT_SIZE = 16;
const COL_SPACING = 20;
const FRAME_COUNT = 60;
const FRAME_DELAY_MS = 80;

const CHARS = "01ALTHENTICDEVPROMPT$#@%01".split("");

const COLORS = {
  bg: "#05070d",
  head: "#eaf2ff",
  trailBright: "#3b82f6",
  trailDim: "#1d4ed8",
  wordmark: "#eaf2ff",
  subtext: "#9db7e8",
  overlay: "rgba(5, 7, 13, 0.30)",
};

const columnCount = Math.floor(WIDTH / COL_SPACING);

function randChar() {
  return CHARS[Math.floor(Math.random() * CHARS.length)];
}

function makeColumns() {
  const columns = [];
  for (let i = 0; i < columnCount; i++) {
    columns.push({
      x: i * COL_SPACING + 6,
      y: Math.random() * HEIGHT * -2,
      speed: 2 + Math.random() * 3,
      length: 8 + Math.floor(Math.random() * 10),
      chars: Array.from({ length: 20 }, randChar),
    });
  }
  return columns;
}

function drawFrame(ctx, columns) {
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.font = `${FONT_SIZE}px "Courier New", monospace`;
  ctx.textBaseline = "top";

  for (const col of columns) {
    for (let r = 0; r < col.length; r++) {
      const charY = col.y - r * FONT_SIZE;
      if (charY < -FONT_SIZE || charY > HEIGHT) continue;

      const fade = 1 - r / col.length;
      ctx.globalAlpha = Math.max(fade, 0);
      ctx.fillStyle = r === 0 ? COLORS.head : COLORS.trailBright;
      ctx.fillText(col.chars[r % col.chars.length], col.x, charY);
    }
    col.y += col.speed;
    if (col.y - col.length * FONT_SIZE > HEIGHT) {
      col.y = Math.random() * -200;
      col.speed = 2 + Math.random() * 3;
      col.chars = Array.from({ length: 20 }, randChar);
    }
    if (Math.random() < 0.05) {
      col.chars[0] = randChar();
    }
  }

  ctx.globalAlpha = 1;
  ctx.fillStyle = COLORS.overlay;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.textAlign = "center";
  ctx.fillStyle = COLORS.wordmark;
  ctx.font = "700 54px 'Segoe UI', Arial, sans-serif";
  ctx.fillText("Althentic.dev", WIDTH / 2, HEIGHT / 2 - 38);

  ctx.fillStyle = COLORS.subtext;
  ctx.font = "400 18px 'Segoe UI', Arial, sans-serif";
  ctx.fillText("MARKETPLACE FOR AI-READY PROMPTS", WIDTH / 2, HEIGHT / 2 + 14);

  ctx.textAlign = "left";
}

async function main() {
  const outDir = path.join(__dirname, "..", "profile");
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, "matrix-banner.gif");

  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext("2d");

  const encoder = new GIFEncoder(WIDTH, HEIGHT);
  const stream = encoder.createReadStream().pipe(fs.createWriteStream(outPath));

  encoder.start();
  encoder.setRepeat(0);
  encoder.setDelay(FRAME_DELAY_MS);
  encoder.setQuality(10);

  const columns = makeColumns();

  for (let f = 0; f < FRAME_COUNT; f++) {
    drawFrame(ctx, columns);
    encoder.addFrame(ctx);
  }

  encoder.finish();

  await new Promise((resolve, reject) => {
    stream.on("finish", resolve);
    stream.on("error", reject);
  });

  console.log(`Matrix banner written to ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

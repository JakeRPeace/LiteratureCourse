import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, "..", "public");

async function generatePNGs() {
  // Dynamic import to handle if package isn't installed
  let sharp;
  try {
    sharp = (await import("sharp")).default;
  } catch {
    console.log("Installing sharp for PNG generation...");
    const { execSync } = await import("child_process");
    execSync("npm install sharp --save-dev", {
      cwd: join(__dirname, ".."),
      stdio: "inherit"
    });
    sharp = (await import("sharp")).default;
  }

  const svgPath = join(publicDir, "logo.svg");
  const svgContent = readFileSync(svgPath);

  const sizes = [32, 64, 128, 256];

  for (const height of sizes) {
    // Calculate width based on viewBox aspect ratio (160:40 = 4:1)
    const width = height * 4;

    const pngBuffer = await sharp(svgContent)
      .resize(width, height)
      .png()
      .toBuffer();

    const outputPath = join(publicDir, `logo-${height}.png`);
    writeFileSync(outputPath, pngBuffer);
    console.log(`Created: logo-${height}.png (${width}x${height})`);
  }

  console.log("\nPNG files generated successfully!");
}

generatePNGs().catch(console.error);

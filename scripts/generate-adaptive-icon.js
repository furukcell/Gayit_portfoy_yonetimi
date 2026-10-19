const sharp = require("sharp");
const path = require("path");

const root = path.resolve(__dirname, "..");
const source = path.join(root, "assets/images/icon.png");
const output = path.join(root, "assets/images/adaptive-icon.png");

// Keep the existing logo unchanged. Scale the complete source into the
// center of a 1024px canvas so Android's adaptive-icon mask has breathing room.
async function main() {
  const canvasSize = 1024;
  const logoSize = 680;
  const logo = await sharp(source)
    .resize(logoSize, logoSize, { fit: "contain", background: { r: 16, g: 36, b: 58, alpha: 1 } })
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: canvasSize,
      height: canvasSize,
      channels: 4,
      background: { r: 16, g: 36, b: 58, alpha: 1 }
    }
  })
    .composite([{ input: logo, gravity: "centre" }])
    .png()
    .toFile(output);

  console.log("Generated Android adaptive icon:", output);
}

main().catch((error) => {
  console.error("Could not generate Android adaptive icon:", error);
  process.exitCode = 1;
});

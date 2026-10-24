/**
 * AmazonSEO Pro - Icon Generator
 * Run with: node generate-icons.js
 * Generates PNG icons at 16, 32, 48, 128px using Canvas API (Node.js)
 * 
 * Usage: node generate-icons.js
 * Requires: npm install canvas
 */

const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const SIZES = [16, 32, 48, 128];
const OUT_DIR = path.join(__dirname, '..', 'src', 'icons');

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

SIZES.forEach(size => {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  const pad = size * 0.08;
  const r = (size - pad * 2) / 2;
  const cx = size / 2, cy = size / 2;

  // Background circle - Amazon dark
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = '#131921';
  ctx.fill();

  // Orange ring
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.strokeStyle = '#FF9900';
  ctx.lineWidth = size * 0.08;
  ctx.stroke();

  // Magnifying glass
  const glassR = r * 0.38;
  const glassX = cx - r * 0.1;
  const glassY = cy - r * 0.1;

  ctx.beginPath();
  ctx.arc(glassX, glassY, glassR, 0, Math.PI * 2);
  ctx.strokeStyle = '#FF9900';
  ctx.lineWidth = size * 0.09;
  ctx.stroke();

  // Handle
  const angle = Math.PI * 0.75;
  const hx1 = glassX + Math.cos(angle) * glassR;
  const hy1 = glassY + Math.sin(angle) * glassR;
  const hx2 = glassX + Math.cos(angle) * (glassR + r * 0.32);
  const hy2 = glassY + Math.sin(angle) * (glassR + r * 0.32);

  ctx.beginPath();
  ctx.moveTo(hx1, hy1);
  ctx.lineTo(hx2, hy2);
  ctx.strokeStyle = '#FF9900';
  ctx.lineWidth = size * 0.1;
  ctx.lineCap = 'round';
  ctx.stroke();

  // Save
  const buffer = canvas.toBuffer('image/png');
  const outPath = path.join(OUT_DIR, `icon${size}.png`);
  fs.writeFileSync(outPath, buffer);
  console.log(`✅ Generated: icon${size}.png`);
});

console.log('\n🎉 All icons generated successfully!');
console.log(`📁 Location: ${OUT_DIR}`);

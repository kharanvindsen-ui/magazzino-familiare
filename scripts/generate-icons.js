// Genera icone PNG per PWA senza dipendenze esterne
const zlib = require('zlib')
const fs = require('fs')
const path = require('path')

function crc32(buf) {
  const table = new Uint32Array(256)
  for (let i = 0; i < 256; i++) {
    let c = i
    for (let j = 0; j < 8; j++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1)
    table[i] = c
  }
  let crc = 0xFFFFFFFF
  for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8)
  return (crc ^ 0xFFFFFFFF) >>> 0
}

function pngChunk(type, data) {
  const t = Buffer.from(type, 'ascii')
  const crcInput = Buffer.concat([t, data])
  const crc = Buffer.allocUnsafe(4)
  crc.writeUInt32BE(crc32(crcInput))
  const len = Buffer.allocUnsafe(4)
  len.writeUInt32BE(data.length)
  return Buffer.concat([len, t, data, crc])
}

function makePNG(size) {
  // Blue #3B82F6 = rgb(59, 130, 246) background with white house shape
  const R = 59, G = 130, B = 246
  const WR = 255, WG = 255, WB = 255

  const pixels = new Uint8Array(size * size * 3)

  // Fill blue
  for (let i = 0; i < size * size; i++) {
    pixels[i * 3] = R
    pixels[i * 3 + 1] = G
    pixels[i * 3 + 2] = B
  }

  // Draw white house silhouette scaled to icon size
  // Safe zone for maskable: center 80% = from 10% to 90%
  const safe = (v) => Math.round(v * size)
  const setWhite = (x, y) => {
    if (x < 0 || x >= size || y < 0 || y >= size) return
    const i = (y * size + x) * 3
    pixels[i] = WR; pixels[i+1] = WG; pixels[i+2] = WB
  }
  const setRect = (x1, y1, x2, y2) => {
    for (let y = y1; y <= y2; y++)
      for (let x = x1; x <= x2; x++)
        setWhite(x, y)
  }

  // House proportions (within 25%–75% of icon)
  const cx = Math.floor(size / 2)
  const roofTop = safe(0.25)
  const roofBottom = safe(0.46)
  const wallTop = safe(0.46)
  const wallBottom = safe(0.75)
  const wallLeft = safe(0.30)
  const wallRight = safe(0.70)
  const roofLeft = safe(0.20)
  const roofRight = safe(0.80)

  // Roof triangle
  const roofHeight = roofBottom - roofTop
  for (let y = roofTop; y <= roofBottom; y++) {
    const progress = (y - roofTop) / roofHeight
    const halfWidth = Math.round(progress * (cx - roofLeft))
    setRect(cx - halfWidth, y, cx + halfWidth, y)
  }
  // Body
  setRect(wallLeft, wallTop, wallRight, wallBottom)

  // Door (darker — same blue to cut out)
  const doorW = safe(0.12)
  const doorH = safe(0.18)
  const doorLeft = cx - Math.floor(doorW / 2)
  const doorRight = cx + Math.floor(doorW / 2)
  const doorTop = wallBottom - doorH
  for (let y = doorTop; y <= wallBottom; y++)
    for (let x = doorLeft; x <= doorRight; x++) {
      const i = (y * size + x) * 3
      pixels[i] = R; pixels[i+1] = G; pixels[i+2] = B
    }

  // Build raw PNG data (filter byte 0 per row + RGB pixels)
  const rowSize = 1 + size * 3
  const raw = Buffer.allocUnsafe(size * rowSize)
  for (let y = 0; y < size; y++) {
    raw[y * rowSize] = 0 // filter None
    Buffer.from(pixels).copy(raw, y * rowSize + 1, y * size * 3, (y + 1) * size * 3)
  }

  const sig = Buffer.from([0x89,0x50,0x4E,0x47,0x0D,0x0A,0x1A,0x0A])
  const ihdr = Buffer.allocUnsafe(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0

  return Buffer.concat([
    sig,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', zlib.deflateSync(raw)),
    pngChunk('IEND', Buffer.alloc(0)),
  ])
}

const outDir = path.join(__dirname, '..', 'public', 'icons')
fs.mkdirSync(outDir, { recursive: true })

const sizes = [
  { size: 192, name: 'icon-192.png' },
  { size: 512, name: 'icon-512.png' },
  { size: 180, name: 'apple-touch-icon.png' },
]

for (const { size, name } of sizes) {
  fs.writeFileSync(path.join(outDir, name), makePNG(size))
  console.log(`✓ ${name} (${size}x${size})`)
}

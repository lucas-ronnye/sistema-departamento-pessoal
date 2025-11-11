import fs from 'fs'
import path from 'path'
import sharp from 'sharp'

const root = path.resolve(process.cwd())
const publicDir = path.join(root, 'public')
const srcSvg = path.join(publicDir, 'logo-rh-digital.svg')
const srcPng = path.join(publicDir, 'logo-rh-digital.png')

async function main() {
  const usePng = fs.existsSync(srcPng)
  const useSvg = fs.existsSync(srcSvg)
  if (!usePng && !useSvg) {
    console.error('Fonte de logo não encontrada (PNG ou SVG) em public/')
    process.exit(1)
  }

  // Usa PNG como fonte se existir; caso contrário, cai para o SVG
  const base = usePng
    ? sharp(fs.readFileSync(srcPng))
    : sharp(fs.readFileSync(srcSvg), { density: 512 })

  const outputs = [
    ...(usePng ? [] : [{ file: 'logo-rh-digital.png', size: 512 }]), // se PNG já é a base, não sobrescreve
    { file: 'logo-rh-digital-512.png', size: 512 }, // ícone PWA
    { file: 'logo-rh-digital-192.png', size: 192 }, // ícone PWA
    { file: 'apple-touch-icon.png', size: 180 }, // iOS opcional
  ]

  for (const { file, size } of outputs) {
    const outPath = path.join(publicDir, file)
    await base
      .clone()
      .trim() // remove bordas/padding extra
      .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(outPath)
    console.log('Gerado:', outPath)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
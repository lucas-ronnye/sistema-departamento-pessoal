import fs from 'node:fs'
import path from 'node:path'

// Remueve bytes estranhos (ex.: EF BF BD ou BOM EF BB BF) antes da assinatura PNG
// Assinatura PNG correta: 89 50 4E 47 0D 0A 1A 0A

const filePath = process.argv[2]
if (!filePath) {
  console.error('Uso: node scripts/fix-png.mjs <caminho/do/arquivo.png>')
  process.exit(1)
}

const abs = path.resolve(filePath)
const buf = fs.readFileSync(abs)

const startsWith = (b, arr) => arr.every((v, i) => b[i] === v)

const PNG_SIG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
const BAD_SIG_1 = [0xef, 0xbf, 0xbd] // caractere de substituição (arquivo corrompido/encoding incorreto)
const BAD_SIG_2 = [0xef, 0xbb, 0xbf] // BOM UTF-8

let fixed = buf
let changed = false

if (startsWith(buf, BAD_SIG_1)) {
  fixed = buf.subarray(BAD_SIG_1.length)
  changed = true
} else if (startsWith(buf, BAD_SIG_2)) {
  fixed = buf.subarray(BAD_SIG_2.length)
  changed = true
}

// Caso a assinatura esteja sem o primeiro byte 0x89 (após remover BOM/bytes inválidos), adiciona-o
const PNG_SIG_NO_FIRST = [0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
if (!startsWith(fixed, PNG_SIG) && startsWith(fixed, PNG_SIG_NO_FIRST)) {
  fixed = Buffer.concat([Buffer.from([0x89]), fixed])
  changed = true
}

if (!startsWith(fixed, PNG_SIG)) {
  console.error('Arquivo não inicia com assinatura PNG válida. Não foi possível corrigir automaticamente.')
  process.exit(2)
}

const backup = abs + '.bak'
fs.writeFileSync(backup, buf)
fs.writeFileSync(abs, fixed)

console.log(`Corrigido: ${abs}`)
console.log(`Backup salvo em: ${backup}`)
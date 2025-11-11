import fs from 'fs';
import path from 'path';
import { PNG } from 'pngjs';

// Remove pixels brancos (e quase brancos) tornando-os transparantes.
// Uso: node scripts/remove-logo-bg.mjs [input] [output]
// Padrões:
// input: public/Gemini_Generated_Image_upj059upj059upj0.png
// output: public/logo-rh-digital.png

const projectRoot = path.resolve(process.cwd());
const defaultInput = path.join(projectRoot, 'public', 'Gemini_Generated_Image_upj059upj059upj0.png');
const defaultOutput = path.join(projectRoot, 'public', 'logo-rh-digital.png');

const input = process.argv[2] ? path.resolve(process.argv[2]) : defaultInput;
const output = process.argv[3] ? path.resolve(process.argv[3]) : defaultOutput;

if (!fs.existsSync(input)) {
  console.error(`Arquivo de entrada não encontrado: ${input}`);
  process.exit(1);
}

// Threshold para considerar "branco" (0-255). Quanto maior, mais agressivo.
const THRESHOLD = 240;

function isNearWhite(r, g, b) {
  return r >= THRESHOLD && g >= THRESHOLD && b >= THRESHOLD;
}

function removeWhiteBackground(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    fs.createReadStream(inputPath)
      .pipe(new PNG({ filterType: 4 }))
      .on('parsed', function () {
        const { width, height, data } = this;
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const idx = (width * y + x) << 2;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];
            const a = data[idx + 3];
            // Preserva pixels já transparentes
            if (a === 0) continue;
            if (isNearWhite(r, g, b)) {
              // Torna branco transparente
              data[idx + 3] = 0;
            }
          }
        }

        const outStream = fs.createWriteStream(outputPath);
        this.pack().pipe(outStream);
        outStream.on('finish', () => resolve());
        outStream.on('error', reject);
      })
      .on('error', reject);
  });
}

(async () => {
  try {
    await removeWhiteBackground(input, output);
    console.log(`Logo gerada sem fundo branco: ${output}`);
  } catch (err) {
    console.error('Falha ao processar imagem:', err);
    process.exit(1);
  }
})();
#!/usr/bin/env node

import { copyFile, mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import sharp from 'sharp';

const repoRoot = process.cwd();
const defaultInput = path.join('public', 'assets', 'favicon.svg');
const defaultOutputDir = path.join('public', 'assets', 'favicons');
const defaultPrimaryOutput = path.join('public', 'assets', 'favicon.png');
const defaultPrimarySize = 512;
const defaultSizes = [
  16,
  32,
  48,
  64,
  128,
  180,
  192,
  256,
  384,
  defaultPrimarySize,
];

function usage() {
  return `Usage: pnpm generate:favicons [options]

Generate square PNG favicons from public/assets/favicon.svg.

Options:
  -i, --input <path>       SVG source (default: ${defaultInput})
  -o, --output-dir <path>  Output directory (default: ${defaultOutputDir})
  -s, --sizes <list>       Comma-separated pixel sizes (default: ${defaultSizes.join(',')})
  -h, --help               Show this help

The default output also refreshes ${defaultPrimaryOutput} at ${defaultPrimarySize}x${defaultPrimarySize}.
`;
}

function parseSizes(value) {
  const sizes = value.split(',').map((rawSize) => {
    const size = Number(rawSize.trim());
    if (!Number.isInteger(size) || size <= 0) {
      throw new Error(`Invalid icon size: ${rawSize}`);
    }
    return size;
  });

  if (sizes.length === 0) {
    throw new Error('At least one icon size is required');
  }

  return [...new Set(sizes)];
}

function parseArgs(args) {
  const options = {
    input: defaultInput,
    outputDir: defaultOutputDir,
    sizes: defaultSizes,
  };

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];

    if (argument === '-h' || argument === '--help') {
      options.help = true;
      continue;
    }

    const value = args[index + 1];
    if (!value || value.startsWith('-')) {
      throw new Error(`Missing value for ${argument}`);
    }

    if (argument === '-i' || argument === '--input') {
      options.input = value;
    } else if (argument === '-o' || argument === '--output-dir') {
      options.outputDir = value;
    } else if (argument === '-s' || argument === '--sizes') {
      options.sizes = parseSizes(value);
    } else {
      throw new Error(`Unknown option: ${argument}`);
    }

    index += 1;
  }

  return options;
}

function resolvePath(filePath) {
  return path.resolve(repoRoot, filePath);
}

async function generateFavicons({ input, outputDir, sizes }) {
  const inputPath = resolvePath(input);
  const outputPath = resolvePath(outputDir);
  const source = await readFile(inputPath);
  const updatesPrimaryOutput =
    outputPath === resolvePath(defaultOutputDir) &&
    sizes.includes(defaultPrimarySize);

  await mkdir(outputPath, { recursive: true });

  const generated = await Promise.all(
    sizes.map(async (size) => {
      const destination = path.join(outputPath, `favicon-${size}x${size}.png`);
      await sharp(source)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .png()
        .toFile(destination);
      console.log(`Generated ${path.relative(repoRoot, destination)}`);
      return { destination, size };
    })
  );

  if (updatesPrimaryOutput) {
    const primarySource = generated.find(
      ({ size }) => size === defaultPrimarySize
    );
    const primaryOutput = resolvePath(defaultPrimaryOutput);
    await copyFile(primarySource.destination, primaryOutput);
    console.log(`Updated ${path.relative(repoRoot, primaryOutput)}`);
  }
}

try {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    console.log(usage());
  } else {
    await generateFavicons(options);
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  console.error(`\n${usage()}`);
  process.exitCode = 1;
}

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

/**
 * The site loads script.js as a classic (non-module) script so that opening
 * index.html straight from disk still works. Vite only bundles module scripts,
 * so this plugin copies the file into dist as-is — otherwise the build would
 * ship an HTML page with no JavaScript at all.
 */
const copyClassicScripts = (files) => ({
    name: 'copy-classic-scripts',
    apply: 'build',
    generateBundle() {
        for (const file of files) {
            this.emitFile({
                type: 'asset',
                fileName: file,
                source: fs.readFileSync(file, 'utf8'),
            });
        }
    },
});

const rootDir = path.dirname(fileURLToPath(import.meta.url));

// Static site: no framework plugins, no bundler magic needed.
// `base: './'` keeps the build portable (works from a sub-path such as GitHub Pages).
export default defineConfig({
    base: './',
    build: {
        outDir: 'dist',
        assetsInlineLimit: 0,
        rollupOptions: {
            // Both HTML files are built so the GenAI case study page ships at
            // /genai.html (Vite only discovers index.html by default).
            input: {
                index: path.resolve(rootDir, 'index.html'),
                genai: path.resolve(rootDir, 'genai.html'),
            },
        },
    },
    plugins: [copyClassicScripts(['script.js'])],
});

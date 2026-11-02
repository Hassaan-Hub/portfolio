import fs from 'node:fs';
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

// Static site: no framework plugins, no bundler magic needed.
// `base: './'` keeps the build portable (works from a sub-path such as GitHub Pages).
export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    assetsInlineLimit: 0,
  },
  plugins: [copyClassicScripts(['script.js'])],
});

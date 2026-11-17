import defineTagNamePlugin from './defineTagNamePlugin.js';
import dropPrivatePlugin from './dropPrivatePlugin.js';
import descriptionTagPlugin from './descriptionTagPlugin.js';
import mixinHeritagePlugin from './mixinHeritagePlugin.js';
import typeCasePlugin from './typeCasePlugin.js';

// Config for the Custom Elements Manifest analyzer (cem analyze), run by `package-tools docs cem` from the services directory.
// Paths are relative to that directory.
export default {
  globs: ['package/elements/*/*.js'],
  exclude: ['**/*.tpl.js', '**/index.js'],
  outdir: 'package',
  litelement: true,
  // package.json's customElements field is set by hand, so the analyzer doesn't rewrite package.json
  packagejson: false,
  plugins: [
    defineTagNamePlugin(),
    descriptionTagPlugin(),
    mixinHeritagePlugin(),
    typeCasePlugin(),
    // last, so it also removes anything the other plugins touched
    dropPrivatePlugin()
  ]
};

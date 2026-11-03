// global styles
import sharedStyles from '@ucd-lib/cork-theme/styles/css/style-ucdlib.css';
import { setFontFaces, setImageCssCustomProperties } from '@ucd-lib/cork-theme/utils/assets';

// Fonts and images are served by this app, straight from the package (see controllers/assets.js)
setFontFaces('/fonts');
setImageCssCustomProperties('/images');

const styles = `
  ${sharedStyles}

  [hidden] {
    display: none !important;
  }
`;

let sharedStyleElement = document.createElement('style');
sharedStyleElement.innerHTML = styles;
document.head.appendChild(sharedStyleElement);

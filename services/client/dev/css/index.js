// global styles
import sharedStyles from '@ucd-lib/cork-theme/styles/css/style-ucdlib.css';
import fonts from './fonts.css';

const styles = `
  ${sharedStyles}
  ${fonts}

  [hidden] {
    display: none !important;
  }
`;

let sharedStyleElement = document.createElement('style');
sharedStyleElement.innerHTML = styles;
document.head.appendChild(sharedStyleElement);
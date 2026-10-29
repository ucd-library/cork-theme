import { Command } from 'commander';
import styles from '../lib/styles.js';

const program = new Command();

program
  .command('run-all')
  .description('Run every style build')
  .action(styles.runAll.bind(styles));

program
  .command('css-properties')
  .description('Build styles/css/css-properties.css from campus custom properties plus our additions')
  .action(styles.cssProperties.bind(styles));

program
  .command('campus-css')
  .description('Build campus stylesheets as-is: styles/css/style.css and styles/css/print.css')
  .action(styles.campusCss.bind(styles));

program
  .command('ucdlib-css')
  .description('Build our stylesheet, styles/css/style-ucdlib.css')
  .action(styles.ucdlibCss.bind(styles));

program
  .command('colors')
  .description('Build styles/colors.js, the campus palette as JS, from sass/_variables.scss')
  .action(styles.colors.bind(styles));

program
  .command('lit')
  .description('Build a Lit css.js module in styles/js/ for each Sass partial')
  .action(styles.lit.bind(styles));

program
  .command('client-fonts')
  .description('Copy campus fonts (styles/fonts) to the client app\'s public/fonts/campus')
  .action(styles.clientFonts.bind(styles));

program.parse(process.argv);

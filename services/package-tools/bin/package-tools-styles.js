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

program.parse(process.argv);

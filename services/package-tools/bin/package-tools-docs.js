import { Command } from 'commander';
import docs from '../lib/docs.js';

const program = new Command();

program
  .command('run-all')
  .description('Run every docs build')
  .action(docs.runAll.bind(docs));

program
  .command('jsdoc')
  .description('Build markdown reference pages in docs/reference from the JSDoc in package/elements and package/utils')
  .argument('[names...]', 'Pages to build: element names (e.g. cork-header) or util folders (e.g. controllers). Default: all')
  .action(docs.jsdoc.bind(docs));

program.parse(process.argv);

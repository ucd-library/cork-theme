#! /usr/bin/env node

import { Command } from 'commander';

const program = new Command();

program
  .name('package-tools')
  .description('Tools for generating and maintaining the cork-theme package.')
  .version('1.0.0')
  .command('styles', 'Tools for compiling and transpiling campus-provided SCSS stylesheets.')
  ;

// commander exits silently with no arguments, so show help instead
if ( process.argv.length <= 2 ) {
  program.help();
}

program.parse(process.argv);

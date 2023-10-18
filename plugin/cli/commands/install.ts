import { program } from 'commander'
import { install } from '../actions/install'

export default program
  .command('install')
  .description('install the cli itself')
  .action(install)

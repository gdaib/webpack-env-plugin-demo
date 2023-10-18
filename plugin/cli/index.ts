import { program } from 'commander'

import './commands/switch-env'
import './commands/install'
export * from './commands/switch-env'

const name = 'replace-env-cli'
const defaultArgv = ['node', name]
const argv = defaultArgv.concat(process.argv.slice(defaultArgv.length))
program.name(name).option('--verbose', 'details').usage('<command> [options]').parse(argv)
 
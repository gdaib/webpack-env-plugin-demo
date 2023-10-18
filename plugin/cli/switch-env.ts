import program from './commands/switch-env'

const defaultArgv = ['node', 'switch-env']
const argv = defaultArgv.concat(process.argv.slice(2))
program.parse(argv)

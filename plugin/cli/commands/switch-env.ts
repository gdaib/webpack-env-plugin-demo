import { program } from 'commander'
import { switchEnv } from '../actions/switch-env'
export * from '../actions/switch-env'

export default program
  .command('update')
  .description('Update environment variables to existed htmls')
  .argument('env', 'Please select the the env, such as "switch-env develop"')
  .action(switchEnv)

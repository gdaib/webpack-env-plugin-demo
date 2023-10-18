import { execSync } from 'child_process'
import { findPath } from './switch-env'

export function install() {

  execSync(`ncc build ${findPath('switch-env.ts')} -m  --no-source-map-register  -o dist`)
}

import * as dotenv from 'dotenv'
import * as path from 'path'
import type { Compiler } from 'webpack'
import * as kebabcase from 'lodash.kebabcase'

export class WebpackEnvRepleacePlugin {

  protected logger: ReturnType<Compiler['getInfrastructureLogger']>

  get pluginName() {
    return kebabcase(Object.getPrototypeOf(this).constructor?.name)
  }

  public applyReplace(compiler: Compiler) {
    const { context } = compiler
    const file = path.join(context, '.env')

    const { parsed: variables } = dotenv.config({ path: file })
    const finalVariables = { ...variables }

    this.logger = compiler.getInfrastructureLogger(this.pluginName)

    this.logger.info(JSON.stringify(finalVariables))
  }

  public apply(compiler: Compiler) {
    this.applyReplace(compiler)
  }
}
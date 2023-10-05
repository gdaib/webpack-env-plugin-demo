import * as dotenv from "dotenv";
import * as path from "path";
import type { Compiler } from "webpack";
import { DefinePlugin } from "webpack";
import * as kebabcase from "lodash.kebabcase";

const ObjectKey = "window?.config";

const templateStr = (key: string, value: string) => {
  return `(${ObjectKey}?.${key} || '${value}')`;
};

export class WebpackEnvRepleacePlugin {
  protected logger: ReturnType<Compiler["getInfrastructureLogger"]>;

  get pluginName() {
    return kebabcase(Object.getPrototypeOf(this).constructor?.name);
  }

  public applyReplace(compiler: Compiler) {
    const { envs } = this.gatherEnvs(compiler);
    const { definitions } = this.formateData(envs);

    new DefinePlugin(definitions).apply(compiler);
  }

  public apply(compiler: Compiler) {
    this.init(compiler);
    this.applyReplace(compiler);
  }

  loadEnvFile({ path }: { path: string }) {
    try {
      const { parsed: variables } = dotenv.config({ path });

      return variables;
    } catch (error) {
      this.logger.warn("load file failed", error);
      return {};
    }
  }

  gatherEnvs(compiler: Compiler) {
    const { context } = compiler;
    const filePath = path.join(context, ".env");

    const variables = this.loadEnvFile({
      path: filePath
    });

    return { envs: variables };
  }

  formateData(variables: Record<string, any>) {
    const definitions = {} as Record<string, any>;

    Object.entries(variables).forEach(([key, value]) => {
      const finalKey = `process.env.${key}`;
      definitions[finalKey] = templateStr(key, value);
    });

    return { definitions };
  }

  init(compiler: Compiler) {
    this.logger = compiler.getInfrastructureLogger(this.pluginName);
  }
}

import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";
import type { Compiler } from "webpack";
import { DefinePlugin } from "webpack";
import * as kebabcase from "lodash.kebabcase";
import * as chalk from "chalk";

const ObjectKey = "window?.config";

const templateStr = (key: string, value: string) => {
  return `(${ObjectKey}?.${key} || '${value}')`;
};

interface IWebpackEnvRepleacePluginOption {
  dotenvDir: string;
}

const defaultOptions = {
  dotenvDir: "dotenv"
};

export class WebpackEnvRepleacePlugin {
  protected logger: ReturnType<Compiler["getInfrastructureLogger"]>;
  private dotenvDir: string;

  constructor(options: IWebpackEnvRepleacePluginOption) {
    const finalOptions = Object.assign({}, defaultOptions, options);
    this.dotenvDir = finalOptions.dotenvDir;
  }

  get pluginName() {
    return kebabcase(Object.getPrototypeOf(this).constructor?.name);
  }

  public applyReplace(compiler: Compiler) {
    const { envs } = this.gatherEnvs(compiler);
    const { definitions } = this.formateData(envs);
    new DefinePlugin(definitions).apply(compiler);
  }

  public getEnvs() {
    const sourcePath = path.resolve(process.cwd(), this.dotenvDir);

    if (!fs.existsSync(sourcePath)) {
      this.logger.error(
        `copy dotenv configuration file failed, because the provider path doesn't existed ${sourcePath}`
      );
      return;
    }

    const dirs = fs.readdirSync(sourcePath);

    const files = dirs.map((name) => {
      const finalPath = path.resolve(sourcePath, name);
      const content = fs.readFileSync(finalPath, "utf-8");

      return {
        name,
        content
      };
    });

    return {
      files
    };
  }

  public handleConfiguration(compiler: Compiler) {
    const { RawSource } = compiler.webpack.sources;
    // copy dotenv files
    compiler.hooks.thisCompilation.tap(this.pluginName, (compilation) => {
      compilation.hooks.afterOptimizeAssets.tap(this.pluginName, async () => {
        const { files } = this.getEnvs();
        if (files.length) {
          files.forEach(({ content, name }) => {
            const finalPath = path.join(defaultOptions.dotenvDir, name);
            compilation.emitAsset(finalPath, new RawSource(content, false));
          });
        }
      });

      const switchJSPath = path.resolve(process.cwd(), "./lib/index.js");

      const switchJSContent = fs.readFileSync(switchJSPath, 'utf-8');
      compilation.emitAsset(
        'switch-env.js',
        // for remove the comments, because with it webpack will generate the license.txt
        /*! https://mths.be/he v1.2.0 by @mathias | MIT license */
        new RawSource(switchJSContent.replace(`\/\*.*\*\/`, ''), false),
        {
          'minimized': true
        }
      );
    });

    compiler.hooks.afterDone.tap(this.pluginName, (compilation) => {
      this.logger.info(
        chalk.green(`${this.pluginName} initialized successfully.`)
      );
    });
  }

  public apply(compiler: Compiler) {
    this.init(compiler);
    this.applyReplace(compiler);
    this.handleConfiguration(compiler);
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

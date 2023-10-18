import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";
import type { Compiler } from "webpack";
import { DefinePlugin } from "webpack";
import * as kebabcase from "lodash.kebabcase";
import { parse } from "node-html-parser";
import * as chalk from "chalk";


const outputConfig = {
  files: [],
} as {
  files: string[]
}

const ObjectKey = "window?.config";

const CONFIG_TAG_ID = "__config__tag__id__";

const templateStr = (key: string, value: string) => {
  return `(${ObjectKey}?.${key} || '${value}')`;
};

const createObjectTemplete = (value: object) => {
  return `;(() => {window.config = ${JSON.stringify(value)}})()`;
};

interface IWebpackEnvRepleacePluginOption {
  dotenvDir: string
}

const defaultOptions = {
  dotenvDir: 'dotenv'
}

export class WebpackEnvRepleacePlugin {
  protected logger: ReturnType<Compiler["getInfrastructureLogger"]>;
  private dotenvDir: string

  constructor(options: IWebpackEnvRepleacePluginOption) {
    const finalOptions = Object.assign({}, defaultOptions, options)
    this.dotenvDir = finalOptions.dotenvDir
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
    const sourcePath = path.resolve(process.cwd(), this.dotenvDir)

    if (!fs.existsSync(sourcePath)) {
      this.logger.error(`copy dotenv configuration file failed, because the provider path doesn't existed ${sourcePath}`)
      return
    }

    const dirs = fs.readdirSync(sourcePath)

    const files = dirs.map(name => {
      const finalPath = path.resolve(sourcePath, name)
      const content = fs.readFileSync(finalPath, 'utf-8')

      return {
        name,
        content
      }
    })

    return {
      files,
    }
  }

  public handleConfiguration(compiler: Compiler) {
    const { RawSource } = compiler.webpack.sources;

    compiler.hooks.compilation.tap(this.pluginName, (compilation) => {
      compilation.hooks.afterOptimizeAssets.tap(
        {
          name: this.pluginName,
          stage: compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONS
        },
        async (assets) => {
          const entryHtmls = Object.keys(assets).filter((item) =>
            item.endsWith(".html")
          );
          outputConfig.entries = entryHtmls.map(name => {
            
          })
          const {files} = this.getEnvs()
          if (files.length) {
            files.forEach(({content, name}) => {
              const finalPath = path.join(defaultOptions.dotenvDir, name)
              compilation.emitAsset(finalPath, new RawSource(content, false))
            })
          }
        }
      );
    });

    compiler.hooks.afterDone.tap(this.pluginName, () => {
      this.logger.info(
        chalk.green(`${this.pluginName} initialized successfully.`)
      );
    });
  }

  public applyConfiguration(compiler: Compiler) {
    const { envs } = this.gatherEnvs(compiler);
    const { ReplaceSource } = compiler.webpack.sources;

    // this solution from https://stackoverflow.com/questions/67365277/how-to-modify-webpack-5-main-template-with-plugin
    compiler.hooks.compilation.tap(this.pluginName, (compilation) => {
      compilation.hooks.afterOptimizeAssets.tap(
        {
          name: this.pluginName,
          stage: compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONS
        },
        async (assets) => {
          const entryHtmls = Object.keys(assets).filter((item) =>
            item.endsWith(".html")
          );

          await entryHtmls.map((name) => {
            const oldSource = assets[name];
            const newSource = new ReplaceSource(oldSource, this.pluginName);

            const oldContent = oldSource.source().toString();

            newSource.replace(
              0,
              oldContent.length,
              this.injectContent(oldContent, envs),
              this.pluginName
            );

            return compilation.updateAsset(name, newSource);
          });
        }
      );
    });

    compiler.hooks.afterDone.tap(this.pluginName, () => {
      this.logger.info(
        chalk.green(`${this.pluginName} initialized successfully.`)
      );
    });
  }

  public apply(compiler: Compiler) {
    this.init(compiler);
    this.applyReplace(compiler);
    // this.applyConfiguration(compiler);
    this.handleConfiguration(compiler)
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

  injectContent(content: string, variables: Record<string, any>) {
    const root = parse(content);
    const [head] = root.getElementsByTagName("head");

    // remove the old one
    const configScript = head.getElementById(CONFIG_TAG_ID);
    if (configScript) {
      head.removeChild(configScript);
    }

    head.innerHTML = `<script id="${CONFIG_TAG_ID}">${createObjectTemplete(
      variables
    )}</script>${head.innerHTML}`;
    return root.innerHTML;
  }
}

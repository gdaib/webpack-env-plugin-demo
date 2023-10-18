import * as path from "path";
import * as fs from "fs";
import * as chalk from "chalk";
import { parse } from "node-html-parser";
import * as dotenv from 'dotenv'

const CONFIG_TAG_ID = "__config__tag__id__";
const dotenvDir = "dotenv";
const configFileName = ".env";

const createObjectTemplete = (value: object) => {
  return `;(() => {window.config = ${JSON.stringify(value)}})()`;
};

const error = (content: string) => {
  console.log(chalk.green('[switch-cli]:'),chalk.redBright(content));
};

const findPath = (fileName: string) => path.join(__dirname, '../../', fileName)

export function switchEnv(env: string) {
  const variables = readEnv(env)

  const htmls = fs
    .readdirSync(findPath('./'))
    .filter((name) => name.endsWith(".html"));

  if (!htmls.length) {
    error(`Can't find any .html files below current runnning directory ${__dirname}`)
  }

  htmls.forEach(name => {
    const filePath =  findPath(name)
    const content = fs.readFileSync(filePath, 'utf-8')
    const newContent = replaceHtml(content, variables)
    fs.writeFileSync(filePath,  newContent, 'utf-8')
  })
}

function readEnv(env: string) {
  const envName = env.endsWith(".env") ? env : `${env}.env`;
  const dirName = findPath(dotenvDir)
  const envFilePath = path.join(dotenvDir, envName);

  const names = fs.readdirSync(dirName);

  if (!fs.existsSync(envFilePath)) {
    error(
      `${envFilePath} not existed, please input the names whithin ${names.join(
        ","
      )}`
    );
    return;
  }

  const content = fs.readFileSync(envFilePath, "utf-8");
  fs.writeFileSync(configFileName, content, {
    encoding: "utf-8"
  });

  const variables = dotenv.parse(content)

  return {variables}
}

function replaceHtml(content: string, variables: object) {
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

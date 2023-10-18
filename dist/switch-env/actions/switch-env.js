"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.switchEnv = void 0;
var path = require("path");
var fs = require("fs");
var chalk = require("chalk");
var node_html_parser_1 = require("node-html-parser");
var dotenv = require("dotenv");
var CONFIG_TAG_ID = "__config__tag__id__";
var dotenvDir = "dotenv";
var configFileName = ".env";
var createObjectTemplete = function (value) {
    return ";(() => {window.config = ".concat(JSON.stringify(value), "})()");
};
var error = function (content) {
    console.log(chalk.green('[switch-cli]:'), chalk.redBright(content));
};
var findPath = function (fileName) { return path.join(__dirname, '../../', fileName); };
function switchEnv(env) {
    var variables = readEnv(env);
    var htmls = fs
        .readdirSync(findPath('./'))
        .filter(function (name) { return name.endsWith(".html"); });
    if (!htmls.length) {
        error("Can't find any .html files below current runnning directory ".concat(__dirname));
    }
    htmls.forEach(function (name) {
        var filePath = findPath(name);
        var content = fs.readFileSync(filePath, 'utf-8');
        var newContent = replaceHtml(content, variables);
        fs.writeFileSync(filePath, newContent, 'utf-8');
    });
}
exports.switchEnv = switchEnv;
function readEnv(env) {
    var envName = env.endsWith(".env") ? env : "".concat(env, ".env");
    var dirName = findPath(dotenvDir);
    var envFilePath = path.join(dotenvDir, envName);
    var names = fs.readdirSync(dirName);
    if (!fs.existsSync(envFilePath)) {
        error("".concat(envFilePath, " not existed, please input the names whithin ").concat(names.join(",")));
        return;
    }
    var content = fs.readFileSync(envFilePath, "utf-8");
    fs.writeFileSync(configFileName, content, {
        encoding: "utf-8"
    });
    var variables = dotenv.parse(content);
    return { variables: variables };
}
function replaceHtml(content, variables) {
    var root = (0, node_html_parser_1.parse)(content);
    var head = root.getElementsByTagName("head")[0];
    // remove the old one
    var configScript = head.getElementById(CONFIG_TAG_ID);
    if (configScript) {
        head.removeChild(configScript);
    }
    head.innerHTML = "<script id=\"".concat(CONFIG_TAG_ID, "\">").concat(createObjectTemplete(variables), "</script>").concat(head.innerHTML);
    return root.innerHTML;
}

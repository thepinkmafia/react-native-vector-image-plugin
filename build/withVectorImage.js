"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.withGenerateAndroidAssets = exports.withGenerateIosAssets = exports.getCommands = exports.setPBXShellScriptBuildPhaseStripSvg = exports.addStripSvgsImplementation = exports.GenerateCommands = void 0;
const config_plugins_1 = require("expo/config-plugins");
const path_1 = __importDefault(require("path"));
var GenerateCommands;
(function (GenerateCommands) {
    GenerateCommands["EntryFile"] = "--entry-file";
    GenerateCommands["Config"] = "--config";
    GenerateCommands["ResetCache"] = "--reset-cache";
})(GenerateCommands || (exports.GenerateCommands = GenerateCommands = {}));
const DefaultCommands = [
    {
        command: GenerateCommands.EntryFile,
        input: "index.js",
    },
    {
        command: GenerateCommands.Config,
        input: "metro.config.js",
    },
    {
        command: GenerateCommands.ResetCache,
        input: "false",
    },
];
const addStripSvgsImplementation = (projectBuildGradle) => {
    const addString = `apply from: new File(["node", "--print", "require.resolve('react-native/package.json')"].execute(null, rootDir).text.trim(), "../../react-native-vector-image/strip_svgs.gradle")`;
    const searchString = /"..\/react.gradle"\)\n/gm;
    if (projectBuildGradle.includes(addString)) {
        return projectBuildGradle;
    }
    return projectBuildGradle.replace(searchString, `"../react.gradle")\n${addString}`);
};
exports.addStripSvgsImplementation = addStripSvgsImplementation;
const withStripSvgsIos = (config) => {
    return (0, config_plugins_1.withAppBuildGradle)(config, ({ modResults, ...config }) => {
        modResults.contents = (0, exports.addStripSvgsImplementation)(modResults.contents);
        return { modResults, ...config };
    });
};
const addSlashes = (str) => {
    return str.replace(/[\\"]/g, "\\$&").replace(/\u0000/g, "\\0");
};
const setPBXShellScriptBuildPhaseStripSvg = async (config) => {
    const xcodeProject = config.modResults;
    const pbxShellScriptBuildPhases = xcodeProject.hash.project.objects.PBXShellScriptBuildPhase;
    for (const buildPhase of Object.values(pbxShellScriptBuildPhases)) {
        if (buildPhase?.name === '"Bundle React Native code and images"' &&
            !buildPhase?.shellScript.includes('"react-native-vector-image"')) {
            const parts = [
                'export NODE_BINARY=node\\n\\n# The project root by default is one level up from the ios directory\\nexport PROJECT_ROOT=\\"$PROJECT_DIR\\"/..\\n\\n',
                addSlashes(`\`node --print "require('path').dirname(require.resolve('react-native/package.json')) + '/scripts/react-native-xcode.sh'"\``),
                addSlashes(`\`node --print "require('path').dirname(require.resolve('react-native/package.json')) + '/../react-native-vector-image/strip_svgs.sh'"\``),
            ];
            // eslint-disable-next-line no-useless-escape
            buildPhase.shellScript = `\"${parts.join("\\n")}\"`;
        }
    }
    return config;
};
exports.setPBXShellScriptBuildPhaseStripSvg = setPBXShellScriptBuildPhaseStripSvg;
const withStripSvgsAndroid = (c) => {
    return (0, config_plugins_1.withXcodeProject)(c, async (config) => {
        config = await (0, exports.setPBXShellScriptBuildPhaseStripSvg)(config);
        return config;
    });
};
const getCliPath = () => {
    const packageLocation = path_1.default.dirname(require.resolve("react-native-vector-image/package.json"));
    return path_1.default.join(packageLocation, "src/cli/index");
};
const getCommands = (commands = DefaultCommands) => {
    const commandsMap = new Map();
    commands.forEach((c) => commandsMap.set(c.command, c.input));
    DefaultCommands.forEach((c) => {
        const exists = commandsMap.has(c.command);
        if (!exists) {
            commandsMap.set(c.command, c.input);
        }
    });
    return Array.from(commandsMap)
        .map((arr) => `${arr[0]} ${arr[1]}`)
        .join(" ");
};
exports.getCommands = getCommands;
const runCli = (cliCommand) => {
    const cliPath = getCliPath();
    const cli = require(cliPath);
    if (!cli) {
        throw new Error("Could not find react-native-vector-image cli");
    }
    cli(cliCommand);
};
const withGenerateIosAssets = (config, commands) => {
    return (0, config_plugins_1.withDangerousMod)(config, [
        "ios",
        (config) => {
            const appName = config.modRequest.projectName;
            runCli(`generate --no-android-output --ios-output ios/${appName}/Images.xcassets ${commands}`);
            return config;
        },
    ]);
};
exports.withGenerateIosAssets = withGenerateIosAssets;
const withGenerateAndroidAssets = (config, commands) => {
    return (0, config_plugins_1.withDangerousMod)(config, [
        "android",
        (config) => {
            runCli(`generate --no-ios-output ${commands}`);
            return config;
        },
    ]);
};
exports.withGenerateAndroidAssets = withGenerateAndroidAssets;
/**
 * Apply VectorImage configuration for Expo projects.
 */
const withVectorImage = (config, props = {}) => {
    const commands = [];
    if (props?.customEntryFile) {
        commands.push({
            command: GenerateCommands.EntryFile,
            input: props?.customEntryFile,
        });
    }
    if (props?.customMetroConfigFile) {
        commands.push({
            command: GenerateCommands.Config,
            input: props?.customMetroConfigFile,
        });
    }
    if (props?.resetCache) {
        commands.push({
            command: GenerateCommands.ResetCache,
            input: `${props?.resetCache}`,
        });
    }
    const commandsWithDefault = (0, exports.getCommands)(commands);
    if (props?.stripSvgs) {
        config = withStripSvgsIos(config);
        config = withStripSvgsAndroid(config);
    }
    config = (0, exports.withGenerateIosAssets)(config, commandsWithDefault);
    config = (0, exports.withGenerateAndroidAssets)(config, commandsWithDefault);
    return config;
};
exports.default = withVectorImage;

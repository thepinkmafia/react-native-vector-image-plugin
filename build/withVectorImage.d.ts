import { ConfigPlugin, ExportedConfigWithProps, XcodeProject } from "expo/config-plugins";
export declare enum GenerateCommands {
    EntryFile = "--entry-file",
    Config = "--config",
    ResetCache = "--reset-cache"
}
export declare const addStripSvgsImplementation: (projectBuildGradle: string) => string;
export declare const setPBXShellScriptBuildPhaseStripSvg: (config: ExportedConfigWithProps<XcodeProject>) => Promise<ExportedConfigWithProps<XcodeProject>>;
export declare const getCommands: (commands?: {
    command: GenerateCommands;
    input: string;
}[]) => string;
export declare const withGenerateIosAssets: ConfigPlugin<string | void>;
export declare const withGenerateAndroidAssets: ConfigPlugin<string | void>;
type VectorImagePlugin = ConfigPlugin<{
    customMetroConfigFile?: string;
    resetCache?: boolean;
    customEntryFile?: string;
    stripSvgs?: boolean;
} | void>;
/**
 * Apply VectorImage configuration for Expo projects.
 */
declare const withVectorImage: VectorImagePlugin;
export default withVectorImage;

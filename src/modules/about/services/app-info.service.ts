import { getName, getVersion } from "@tauri-apps/api/app";
import type { AppInfo } from "../about.types";

/**
 * Reads the app name and version from Tauri at runtime.
 * The source of truth is `src-tauri/tauri.conf.json`, so bumping the version
 * there updates the About dialog automatically, with nothing hardcoded in the UI.
 */
export async function getAppInfo(): Promise<AppInfo> {
  const [name, version] = await Promise.all([getName(), getVersion()]);
  return { name, version };
}

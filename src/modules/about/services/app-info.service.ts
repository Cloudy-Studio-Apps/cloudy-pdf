import { getName, getVersion } from "@tauri-apps/api/app";
import type { AppInfo } from "../about.types";

export async function getAppInfo(): Promise<AppInfo> {
  const [name, version] = await Promise.all([getName(), getVersion()]);
  return { name, version };
}

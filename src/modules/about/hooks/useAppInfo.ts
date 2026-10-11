import { useEffect, useState } from "react";
import { getAppInfo } from "../services/app-info.service";
import type { AppInfo } from "../about.types";

/** App name and version; null while loading or when not running inside Tauri (e.g. plain browser). */
export function useAppInfo(): AppInfo | null {
  const [info, setInfo] = useState<AppInfo | null>(null);

  useEffect(() => {
    getAppInfo().then(setInfo).catch(() => setInfo(null));
  }, []);

  return info;
}

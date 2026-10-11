import { useEffect, useState } from "react";
import { getAppInfo } from "../services/app-info.service";
import type { AppInfo } from "../about.types";

export function useAppInfo(): AppInfo | null {
  const [info, setInfo] = useState<AppInfo | null>(null);

  useEffect(() => {
    getAppInfo().then(setInfo).catch(() => setInfo(null));
  }, []);

  return info;
}

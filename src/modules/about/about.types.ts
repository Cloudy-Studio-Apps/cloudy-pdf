/** Name and version as declared in `src-tauri/tauri.conf.json`. */
export interface AppInfo {
  name: string;
  version: string;
}

export interface AboutDialogProps {
  open: boolean;
  onClose: () => void;
}

export interface AppInfo {
  name: string;
  version: string;
}

export interface AboutDialogProps {
  open: boolean;
  onClose: () => void;
}

import { open } from "@tauri-apps/plugin-dialog";
import { readFile } from "@tauri-apps/plugin-fs";
import { getFileName } from "@/shared/utils/path.utils";
import type { OpenedDocument } from "../document.types";

const PDF_FILTER = { name: "PDF Documents", extensions: ["pdf"] };

export async function pickPdfPath(): Promise<string | null> {
  return open({ multiple: false, directory: false, filters: [PDF_FILTER] });
}

export async function readDocument(path: string): Promise<OpenedDocument> {
  const data = await readFile(path);
  return { id: crypto.randomUUID(), name: getFileName(path), path, data };
}

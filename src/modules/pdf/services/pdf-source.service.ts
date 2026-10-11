/**
 * Bridge to the Rust side that serves a document's bytes on demand.
 * pdf.js never receives the whole file: it asks for byte ranges as it needs them.
 * See `src-tauri/src/document_source.rs`.
 */
import { invoke } from "@tauri-apps/api/core";
import {
  CLOSE_DOCUMENT_COMMAND,
  OPEN_DOCUMENT_COMMAND,
  READ_DOCUMENT_RANGE_COMMAND,
} from "../pdf.constants";
import type { PdfSource } from "../pdf.types";

export function openPdfSource(path: string): Promise<PdfSource> {
  return invoke<PdfSource>(OPEN_DOCUMENT_COMMAND, { path });
}

/** Bytes `[begin, end)`. Rust replies with raw bytes, so no JSON encoding is involved. */
export async function readPdfRange(source: PdfSource, begin: number, end: number): Promise<Uint8Array> {
  const buffer = await invoke<ArrayBuffer>(READ_DOCUMENT_RANGE_COMMAND, {
    id: source.id,
    offset: begin,
    length: end - begin,
  });
  return new Uint8Array(buffer);
}

export function closePdfSource(source: PdfSource): Promise<void> {
  return invoke(CLOSE_DOCUMENT_COMMAND, { id: source.id });
}

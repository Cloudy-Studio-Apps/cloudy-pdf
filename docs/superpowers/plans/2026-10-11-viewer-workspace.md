# Viewer Workspace Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Acrobat-style document workspace (doc toolbar, tools rail, panel rail with Thumbnails/Bookmarks, text layer, search, rotation, page display, hand tool, document properties, native print on Linux and Android).

**Architecture:** `app/components/Workspace` composes modules per document tab. `viewer` owns the view state (`useViewerState`) and the chrome; new `thumbnails`, `outline`, `search` modules are independent and only talk through props wired by the app layer. `pdf` stays the only pdf.js importer and gains text, outline, metadata and two React hooks shared by viewer and thumbnails. Rust adds `print.rs` (XDG Print portal) and a local Android plugin crate (Kotlin `PrintManager`).

**Tech Stack:** Tauri 2, Rust (ashpd `print`), Kotlin (Android plugin), React 19, TypeScript, Tailwind 4, pdfjs-dist 6.4 (`TextLayer`, `getTextContent`, `getOutline`, `getMetadata`).

**Spec:** `docs/superpowers/specs/2026-10-11-viewer-workspace-design.md`

## Global Constraints

- pnpm only; icons only from `react-icons/lu`.
- All types in `<module>.types.ts` (including props); constants in `<module>.constants.ts`; pure rules in `<module>.utils.ts`.
- No rounded corners; token classes only (`text-ink`, `bg-surface`, `border-border`, `text-danger`…).
- Imports go app → modules → shared. Modules import other modules only for types, except the infrastructure modules `pdf` and `menu`, which any module may use (existing practice: home uses `menu`, viewer uses `pdf`).
- Every keyboard shortcut goes through `useKeyboardShortcuts`; document shortcuts gated by `isActive`.
- Each file starts with a short purpose note; comment the *why*.
- No test suite and no linter (deferred by the user): verification is `pnpm exec tsc --noEmit`, `pnpm build`, `cargo clippy` for Linux and `aarch64-linux-android`, plus the manual checks listed per task.
- Do not commit unless the user asks.

## Review Focus

1. A PDF whose pages carry their own `/Rotate` combined with view rotation: canvas and text layer must stay aligned (pdf.js `getViewport({ rotation })` *replaces* the page rotation, so we always pass `page.rotate + viewRotation`). Manual check in Task 3.
2. Typing quickly in search on a large document: each keystroke must cancel the previous scan, and highlights from an old query must never appear. Manual check in Task 6.
3. Search in Single page mode: moving to a match on another page must flip to it, then center the highlight. Manual check in Task 7.
4. Print with no portal backend, or a cancelled dialog: cancel is silent, a missing backend shows the notice bar instead of crashing. Manual check in Task 1.
5. Phone layout: the side panel overlays the pages and closes after picking a page or bookmark; a `content://` file still prints after its grant is revoked. Manual check in Task 7 (Android).

---

### Task 1: Native print (Rust, Android plugin, system module)

**Files:**
- Modify: `src-tauri/Cargo.toml`
- Modify: `src-tauri/src/document_source.rs` (make `open_file` crate-visible)
- Create: `src-tauri/src/print.rs`
- Modify: `src-tauri/src/lib.rs`
- Create: `src-tauri/plugins/android-print/Cargo.toml`, `build.rs`, `src/lib.rs`, `src/android.rs`
- Create: `src-tauri/plugins/android-print/android/{build.gradle.kts,settings.gradle,consumer-rules.pro,.gitignore,src/main/AndroidManifest.xml,src/main/java/PrintPlugin.kt}`
- Modify: `src/modules/system/system.constants.ts`, `system.types.ts`, `services/system.service.ts`, `hooks/useSystemActions.ts`

**Interfaces:**
- Produces (Rust command): `print_document(path: String, title: String) -> Result<(), String>`
- Produces (TS): `SystemActions.print(path: string, title: string): void`, `SystemActions.clearError(): void`

- [ ] **Step 1: Cargo changes.** In `src-tauri/Cargo.toml`, change the ashpd line to add the `print` feature and add the Android-only plugin dependency:

```toml
ashpd = { version = "0.13.13", default-features = false, features = ["async-io", "open_uri", "print"] }

[target.'cfg(target_os = "android")'.dependencies]
tauri-plugin-android-print = { path = "plugins/android-print" }
```

- [ ] **Step 2: Expose `open_file`.** In `src-tauri/src/document_source.rs` change `fn open_file<R: Runtime>(` to `pub(crate) fn open_file<R: Runtime>(`.

- [ ] **Step 3: Write `print.rs`.**

File: `src-tauri/src/print.rs`
```rust
//! "Print": hands the original PDF to the system's print dialog.
//!
//! Printing the file itself (not a rendering of it) keeps vector quality and lets
//! the OS dialog handle printers, page ranges and copies, even for huge files.
//! - Linux: XDG Desktop Portal `org.freedesktop.portal.Print` (via `ashpd`), the
//!   same desktop-agnostic approach as "Open with…".
//! - Android: `PrintManager`, through the local `tauri-plugin-android-print` crate.

use std::fs::File;

use tauri::{AppHandle, Runtime};

use crate::document_source::open_file;

/// Command called from the frontend; `title` names the print job.
#[tauri::command]
pub async fn print_document<R: Runtime>(app: AppHandle<R>, path: String, title: String) -> Result<(), String> {
    // Same opening path as viewing: scope check, and on Android the descriptor
    // kept from the "Open with…" grant (which may have been revoked since).
    let opener = app.clone();
    let file = tauri::async_runtime::spawn_blocking(move || open_file(&opener, &path))
        .await
        .map_err(|error| error.to_string())??;
    print_file(&app, file, &title).await
}

#[cfg(target_os = "linux")]
async fn print_file<R: Runtime>(_app: &AppHandle<R>, file: File, title: &str) -> Result<(), String> {
    use std::os::fd::AsFd;

    use ashpd::desktop::ResponseError;
    use ashpd::desktop::print::{PreparePrintOptions, PrintOptions, PrintProxy};

    let result: ashpd::Result<()> = async {
        let proxy = PrintProxy::new().await?;
        // Step 1: the native dialog (printer, pages, copies). Step 2: send the file.
        let prepared = proxy
            .prepare_print(
                None,
                title,
                Default::default(),
                Default::default(),
                PreparePrintOptions::default().set_modal(true),
            )
            .await?
            .response()?;
        proxy
            .print(
                None,
                title,
                &file.as_fd(),
                PrintOptions::default().set_token(prepared.token).set_modal(true),
            )
            .await?
            .response()
    }
    .await;

    match result {
        Ok(()) => Ok(()),
        // Closing the dialog without printing is not an error.
        Err(ashpd::Error::Response(ResponseError::Cancelled)) => Ok(()),
        Err(error) => Err(format!("Could not print: {error}")),
    }
}

#[cfg(target_os = "android")]
async fn print_file<R: Runtime>(app: &AppHandle<R>, file: File, title: &str) -> Result<(), String> {
    use std::os::fd::IntoRawFd;

    use tauri_plugin_android_print::AndroidPrintExt;

    // Kotlin adopts the descriptor and closes it when the print job ends.
    app.android_print().print(file.into_raw_fd(), title)
}

#[cfg(not(any(target_os = "linux", target_os = "android")))]
async fn print_file<R: Runtime>(_app: &AppHandle<R>, _file: File, _title: &str) -> Result<(), String> {
    Err("Printing is not supported on this platform yet.".into())
}
```

- [ ] **Step 4: Register in `lib.rs`.** Add `mod print;` next to the other `mod` lines; add `print::print_document` to `generate_handler!`; and right after the single-instance plugin block add:

```rust
    // Android printing (PrintManager); the Linux side needs no plugin (XDG portal).
    #[cfg(target_os = "android")]
    let builder = builder.plugin(tauri_plugin_android_print::init());
```

- [ ] **Step 5: Android plugin crate.**

File: `src-tauri/plugins/android-print/Cargo.toml`
```toml
[package]
name = "tauri-plugin-android-print"
version = "0.1.0"
description = "Prints a PDF file descriptor with Android's PrintManager"
edition = "2024"
publish = false
# Required for Tauri to find this plugin's Android project when building the app.
links = "tauri-plugin-android-print"

[dependencies]
tauri = { version = "2" }
serde = { version = "1", features = ["derive"] }

[build-dependencies]
tauri-plugin = { version = "2", features = ["build"] }
```

File: `src-tauri/plugins/android-print/build.rs`
```rust
// Packages the Kotlin project in `android/` with the app (used by Android builds only).
fn main() {
    tauri_plugin::Builder::new(&[]).android_path("android").build();
}
```

File: `src-tauri/plugins/android-print/src/lib.rs`
```rust
//! Android printing for PDF Tormentosa: hands a PDF file descriptor to Android's
//! `PrintManager`, which shows the system print dialog. Called from Rust only
//! (no frontend commands); see `src-tauri/src/print.rs` in the app.

use tauri::plugin::{Builder, TauriPlugin};
use tauri::{Manager, Runtime};

mod android;

pub use android::AndroidPrint;

pub fn init<R: Runtime>() -> TauriPlugin<R> {
    Builder::new("android-print")
        .setup(|app, api| {
            app.manage(android::init(api)?);
            Ok(())
        })
        .build()
}

/// `app.android_print()` on any AppHandle / window.
pub trait AndroidPrintExt<R: Runtime> {
    fn android_print(&self) -> &AndroidPrint<R>;
}

impl<R: Runtime, T: Manager<R>> AndroidPrintExt<R> for T {
    fn android_print(&self) -> &AndroidPrint<R> {
        self.state::<AndroidPrint<R>>().inner()
    }
}
```

File: `src-tauri/plugins/android-print/src/android.rs`
```rust
//! Bridge to `PrintPlugin.kt`.

use serde::Serialize;
use serde::de::{DeserializeOwned, IgnoredAny};
use tauri::Runtime;
use tauri::plugin::{PluginApi, PluginHandle};

const PLUGIN_IDENTIFIER: &str = "com.darkredgm.print";

pub struct AndroidPrint<R: Runtime>(PluginHandle<R>);

pub fn init<R: Runtime, C: DeserializeOwned>(
    api: PluginApi<R, C>,
) -> Result<AndroidPrint<R>, Box<dyn std::error::Error>> {
    Ok(AndroidPrint(api.register_android_plugin(PLUGIN_IDENTIFIER, "PrintPlugin")?))
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct PrintArgs<'a> {
    fd: i32,
    job_name: &'a str,
}

impl<R: Runtime> AndroidPrint<R> {
    /// Shows the print dialog for the PDF behind `fd`, taking ownership of `fd`.
    pub fn print(&self, fd: i32, job_name: &str) -> Result<(), String> {
        // The Kotlin side resolves with an empty object; nothing to deserialize.
        self.0
            .run_mobile_plugin::<IgnoredAny>("print", PrintArgs { fd, job_name })
            .map(|_| ())
            .map_err(|error| error.to_string())
    }
}
```

File: `src-tauri/plugins/android-print/android/build.gradle.kts`
```kotlin
import org.jetbrains.kotlin.gradle.dsl.JvmTarget

plugins {
    id("com.android.library")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.darkredgm.print"
    compileSdk = 36

    defaultConfig {
        minSdk = 24
        consumerProguardFiles("consumer-rules.pro")
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_1_8
        targetCompatibility = JavaVersion.VERSION_1_8
    }
}

kotlin {
    compilerOptions {
        jvmTarget = JvmTarget.JVM_1_8
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.9.0")
    implementation(project(":tauri-android"))
}
```

File: `src-tauri/plugins/android-print/android/settings.gradle`
```groovy
pluginManagement {
    repositories {
        mavenCentral()
        gradlePluginPortal()
        google()
    }
    resolutionStrategy {
        eachPlugin {
            switch (requested.id.id) {
                case "com.android.library":
                    useVersion("8.0.2")
                    break
                case "org.jetbrains.kotlin.android":
                    useVersion("1.8.20")
                    break
            }
        }
    }
}

dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        mavenCentral()
        google()
    }
}

include ':tauri-android'
project(':tauri-android').projectDir = new File('./.tauri/tauri-api')
```

File: `src-tauri/plugins/android-print/android/consumer-rules.pro`
```
# Keep the plugin class: Tauri instantiates it by name.
-keep class com.darkredgm.print.PrintPlugin { *; }
```

File: `src-tauri/plugins/android-print/android/.gitignore`
```
/build
/.tauri
```

File: `src-tauri/plugins/android-print/android/src/main/AndroidManifest.xml`
```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
</manifest>
```

File: `src-tauri/plugins/android-print/android/src/main/java/PrintPlugin.kt`
```kotlin
package com.darkredgm.print

import android.app.Activity
import android.content.Context
import android.os.Bundle
import android.os.CancellationSignal
import android.os.ParcelFileDescriptor
import android.print.PageRange
import android.print.PrintAttributes
import android.print.PrintDocumentAdapter
import android.print.PrintDocumentInfo
import android.print.PrintManager
import app.tauri.annotation.Command
import app.tauri.annotation.InvokeArg
import app.tauri.annotation.TauriPlugin
import app.tauri.plugin.Invoke
import app.tauri.plugin.Plugin
import java.io.FileOutputStream

@InvokeArg
class PrintArgs {
    var fd: Int = -1
    var jobName: String = "Document"
}

/** Shows Android's print dialog for a PDF that Rust hands over as a file descriptor. */
@TauriPlugin
class PrintPlugin(private val activity: Activity) : Plugin(activity) {
    @Command
    fun print(invoke: Invoke) {
        val args = invoke.parseArgs(PrintArgs::class.java)
        // adoptFd: this side now owns the descriptor; the adapter closes it when the job ends.
        val source = ParcelFileDescriptor.adoptFd(args.fd)
        // PrintManager.print must run on the UI thread.
        activity.runOnUiThread {
            try {
                val manager = activity.getSystemService(Context.PRINT_SERVICE) as PrintManager
                manager.print(args.jobName, PdfFileAdapter(source, args.jobName), null)
                invoke.resolve()
            } catch (error: Exception) {
                source.close()
                invoke.reject(error.message ?: "Could not print")
            }
        }
    }
}

/** Streams the original PDF to the print service, which paginates and renders it. */
private class PdfFileAdapter(
    private val source: ParcelFileDescriptor,
    private val name: String,
) : PrintDocumentAdapter() {
    override fun onLayout(
        oldAttributes: PrintAttributes?,
        newAttributes: PrintAttributes,
        cancellationSignal: CancellationSignal?,
        callback: LayoutResultCallback,
        extras: Bundle?,
    ) {
        if (cancellationSignal?.isCanceled == true) {
            callback.onLayoutCancelled()
            return
        }
        val info = PrintDocumentInfo.Builder(name)
            .setContentType(PrintDocumentInfo.CONTENT_TYPE_DOCUMENT)
            .build()
        // The file doesn't depend on the paper settings: it only "changes" on the first layout.
        callback.onLayoutFinished(info, oldAttributes == null)
    }

    override fun onWrite(
        pages: Array<out PageRange>,
        destination: ParcelFileDescriptor,
        cancellationSignal: CancellationSignal?,
        callback: WriteResultCallback,
    ) {
        try {
            // A duplicate per write: onWrite can run again (e.g. another printer is picked),
            // and closing the stream must not close the descriptor the adapter still needs.
            ParcelFileDescriptor.AutoCloseInputStream(source.dup()).use { input ->
                input.channel.position(0)
                FileOutputStream(destination.fileDescriptor).use { output -> input.copyTo(output) }
            }
            if (cancellationSignal?.isCanceled == true) callback.onWriteCancelled()
            else callback.onWriteFinished(arrayOf(PageRange.ALL_PAGES))
        } catch (error: Exception) {
            callback.onWriteFailed(error.message)
        }
    }

    override fun onFinish() {
        source.close()
    }
}
```

- [ ] **Step 6: Frontend system module.**

File: `src/modules/system/system.constants.ts`
```ts
/** Must match the `open_with` command in `src-tauri/src/open_with.rs`. */
export const OPEN_WITH_COMMAND = "open_with";

/** Must match the `print_document` command in `src-tauri/src/print.rs`. */
export const PRINT_COMMAND = "print_document";
```

File: `src/modules/system/system.types.ts`
```ts
/**
 * The system module hands files over to the operating system:
 * reveal a file in the file manager, open it with another app, or print it.
 */

export interface SystemActions {
  /** Opens the file manager with the file selected. */
  reveal: (path: string) => void;
  /** Shows the OS "Open with…" app chooser for the file. */
  openWith: (path: string) => void;
  /** Shows the system print dialog for the original file; `title` names the job. */
  print: (path: string, title: string) => void;
  /** Last failure, if any (e.g. the file was moved). */
  error: string | null;
  clearError: () => void;
}
```

File: `src/modules/system/services/system.service.ts`
```ts
import { invoke } from "@tauri-apps/api/core";
import { revealItemInDir } from "@tauri-apps/plugin-opener";
import { OPEN_WITH_COMMAND, PRINT_COMMAND } from "../system.constants";

/**
 * Opens the system file manager with the file highlighted
 * (on Linux through the standard FileManager1 D-Bus interface: Dolphin, Nautilus…).
 */
export function revealInFileManager(path: string): Promise<void> {
  return revealItemInDir(path);
}

/** Shows the native "Open with…" chooser (implemented in Rust: `open_with.rs`). */
export function openWithChooser(path: string): Promise<void> {
  return invoke(OPEN_WITH_COMMAND, { path });
}

/** Native print dialog for the original PDF (Rust: `print.rs`). Cancelling resolves normally. */
export function printDocument(path: string, title: string): Promise<void> {
  return invoke(PRINT_COMMAND, { path, title });
}
```

File: `src/modules/system/hooks/useSystemActions.ts`
```ts
import { useCallback, useState } from "react";
import { getErrorMessage } from "@/shared/utils/error.utils";
import { openWithChooser, printDocument, revealInFileManager } from "../services/system.service";
import type { SystemActions } from "../system.types";

/** Fire-and-forget OS actions, with the last error kept for display. */
export function useSystemActions(): SystemActions {
  const [error, setError] = useState<string | null>(null);

  // Wraps a service call: clears the previous error, records a new one if it fails.
  const run = useCallback((action: () => Promise<void>) => {
    setError(null);
    action().catch((reason) => setError(getErrorMessage(reason)));
  }, []);

  const reveal = useCallback((path: string) => run(() => revealInFileManager(path)), [run]);
  const openWith = useCallback((path: string) => run(() => openWithChooser(path)), [run]);
  const print = useCallback((path: string, title: string) => run(() => printDocument(path, title)), [run]);
  const clearError = useCallback(() => setError(null), []);

  return { reveal, openWith, print, error, clearError };
}
```

- [ ] **Step 7: Verify.**

Run: `cd src-tauri && cargo clippy` → no warnings.
Run (Android): `cargo clippy --target aarch64-linux-android` with the NDK `CC_aarch64_linux_android` / `AR_aarch64_linux_android` env vars → no warnings.
Run: `pnpm exec tsc --noEmit` → exit 0.
Manual (Review Focus 4): after Task 7, print from the toolbar; close the dialog without printing → nothing shown; with the print portal unavailable → notice bar shows "Could not print: …".

---

### Task 2: pdf module — rotation, text, outline, metadata, shared hooks

**Files:**
- Modify: `src/modules/pdf/pdf.types.ts` (full replacement below)
- Create: `src/modules/pdf/pdf.utils.ts`
- Modify: `src/modules/pdf/services/pdf.service.ts` (full replacement below)
- Create: `src/modules/pdf/hooks/usePdfPageRender.ts`, `src/modules/pdf/hooks/usePdfTextLayer.ts`
- Delete: `src/modules/viewer/hooks/usePageRender.ts` (moved; its user is rewritten in Task 3)

**Interfaces:**
- Produces: `rotateSize(size: PageSize, rotation: number): PageSize`
- Produces: `getTextItems(pdf, pageNumber): Promise<PdfTextItem[]>`, `renderTextLayer(options): TextLayerJob`, `getOutline(pdf): Promise<PdfOutlineNode[]>`, `resolveDestination(pdf, dest): Promise<PageTarget | null>`, `getMetadata(pdf): Promise<PdfMetadata>`
- Produces: `usePdfPageRender(options: PageRenderOptions): void`, `usePdfTextLayer(options: TextLayerHookOptions): TextLayerHandle | null`
- `RenderPageOptions` gains `rotation: number` (view rotation, added to the page's own).

- [ ] **Step 1: Types.**

File: `src/modules/pdf/pdf.types.ts`
```ts
/**
 * The pdf module is the only place that imports pdf.js. Everything else uses
 * these types, so swapping or upgrading the PDF engine only touches this module.
 */
import type { RefObject } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";

/** Alias so other modules don't import pdf.js types directly. */
export type PdfDocument = PDFDocumentProxy;

/** Page size in PDF points (1/72 inch) at 100% zoom. */
export interface PageSize {
  width: number;
  height: number;
}

export interface RenderPageOptions {
  pdf: PdfDocument;
  /** 1-based, as in pdf.js. */
  pageNumber: number;
  canvas: HTMLCanvasElement;
  /** Zoom factor: 1 = 100%. */
  scale: number;
  /** Clockwise view rotation in degrees, applied on top of the page's own rotation. */
  rotation: number;
  /** Called with the page's real size at 100% (unrotated by the view), before it is drawn. */
  onPageSize?: (size: PageSize) => void;
}

/** A running page render that can be cancelled (e.g. the page scrolled away or zoom changed). */
export interface RenderJob {
  promise: Promise<void>;
  cancel: () => void;
}

/** A document opened on the Rust side, whose bytes are read on demand (`open_document`). */
export interface PdfSource {
  id: number;
  /** File size in bytes. */
  size: number;
}

/** A document being loaded; `destroy` frees the worker memory, even mid-load. */
export interface PdfLoadJob {
  promise: Promise<PdfDocument>;
  destroy: () => Promise<void>;
}

/** One run of text on a page. Same order as the text layer's elements. */
export interface PdfTextItem {
  str: string;
  /** The run ends a line. */
  hasEOL: boolean;
}

export interface TextLayerOptions {
  pdf: PdfDocument;
  pageNumber: number;
  /** Element the text spans are created in (sized and rotated by pdf.js). */
  container: HTMLElement;
  scale: number;
  rotation: number;
}

/** A rendered text layer: element `i` shows text item `i` (see getTextItems). */
export interface TextLayerHandle {
  textDivs: HTMLElement[];
  itemStrings: string[];
}

export interface TextLayerJob {
  promise: Promise<TextLayerHandle>;
  cancel: () => void;
}

/** A bookmark target: a named destination or pdf.js's explicit array form. */
export type PdfDestination = string | unknown[];

/** pdf.js's own outline item type (internal to the service). */
export type PdfjsOutlineItem = Awaited<ReturnType<PDFDocumentProxy["getOutline"]>>[number];

/** One bookmark and its children. `id` is its position in the tree ("0.2.1"). */
export interface PdfOutlineNode {
  id: string;
  title: string;
  /** null for bookmarks that only link outside the document. */
  dest: PdfDestination | null;
  children: PdfOutlineNode[];
}

/** Where to scroll: a page, and how far down it (0 = top edge, 1 = bottom edge). */
export interface PageTarget {
  pageNumber: number;
  topRatio: number;
}

/** Document information shown in "Document properties". Missing fields are null. */
export interface PdfMetadata {
  title: string | null;
  author: string | null;
  subject: string | null;
  creator: string | null;
  producer: string | null;
  created: Date | null;
  modified: Date | null;
  pdfVersion: string | null;
}

/** Options of usePdfPageRender. */
export interface PageRenderOptions {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  pdf: PdfDocument;
  pageNumber: number;
  scale: number;
  rotation: number;
  /** Render only when true (page near the screen, tab active). */
  enabled: boolean;
  onPageSize?: (pageNumber: number, size: PageSize) => void;
}

/** Options of usePdfTextLayer. */
export interface TextLayerHookOptions {
  containerRef: RefObject<HTMLElement | null>;
  pdf: PdfDocument;
  pageNumber: number;
  scale: number;
  rotation: number;
  enabled: boolean;
}
```

- [ ] **Step 2: Utils.**

File: `src/modules/pdf/pdf.utils.ts`
```ts
/** Page geometry helpers shared by the viewer and the thumbnails. */
import type { PageSize } from "./pdf.types";

/** The size a page takes on screen once turned by `rotation` degrees (90/270 swap the sides). */
export function rotateSize(size: PageSize, rotation: number): PageSize {
  return rotation % 180 === 0 ? size : { width: size.height, height: size.width };
}
```

- [ ] **Step 3: Service.**

File: `src/modules/pdf/services/pdf.service.ts`
```ts
/**
 * Thin wrapper around pdf.js: load a document, measure and draw pages, and read
 * text, bookmarks and document information.
 */
import {
  AbortException,
  GlobalWorkerOptions,
  PDFDataRangeTransport,
  PDFDateString,
  RenderingCancelledException,
  TextLayer,
  getDocument,
  type PDFDocumentLoadingTask,
  type PDFPageProxy,
} from "pdfjs-dist";
// `?url` is a Vite feature: it bundles the worker file and gives us its final URL.
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { clamp } from "@/shared/utils/math.utils";
import { MAX_CANVAS_PIXELS, RANGE_CHUNK_SIZE } from "../pdf.constants";
import type {
  PageSize,
  PageTarget,
  PdfDestination,
  PdfDocument,
  PdfjsOutlineItem,
  PdfLoadJob,
  PdfMetadata,
  PdfOutlineNode,
  PdfSource,
  PdfTextItem,
  RenderJob,
  RenderPageOptions,
  TextLayerJob,
  TextLayerOptions,
} from "../pdf.types";
import { closePdfSource, openPdfSource, readPdfRange } from "./pdf-source.service";

// pdf.js parses PDFs in a Web Worker (a background thread) so the UI never freezes.
// It must be told where that worker script lives.
GlobalWorkerOptions.workerSrc = workerUrl;

/** Feeds pdf.js the byte ranges it asks for, read by Rust. */
class RustRangeTransport extends PDFDataRangeTransport {
  #source: PdfSource;
  #aborted = false;

  constructor(source: PdfSource) {
    super(source.size, null);
    this.#source = source;
  }

  override requestDataRange(begin: number, end: number): void {
    readPdfRange(this.#source, begin, end)
      // pdf.js asserts the request still exists, so drop replies that arrive after destroy.
      .then((chunk) => this.#aborted || this.onDataRange(begin, chunk))
      .catch((error) => console.error(`Failed to read bytes ${begin}-${end}`, error));
  }

  override abort(): void {
    this.#aborted = true;
  }
}

/** Starts loading a PDF; only the parts pdf.js needs are ever read from disk. */
export function loadPdf(path: string): PdfLoadJob {
  let task: PDFDocumentLoadingTask | null = null;
  let destroyed = false;
  const source = openPdfSource(path);

  const promise = source.then((opened) => {
    if (destroyed) throw new Error("Loading was cancelled");
    task = getDocument({
      range: new RustRangeTransport(opened),
      rangeChunkSize: RANGE_CHUNK_SIZE,
      // Only fetch what's displayed. Without this, pdf.js downloads the rest of
      // the file in the background, and the whole file ends up in worker memory.
      disableAutoFetch: true,
      // No progressive stream here: every byte comes from a range request.
      disableStream: true,
    });
    return task.promise;
  });

  return {
    promise,
    destroy: async () => {
      destroyed = true;
      await task?.destroy();
      // Release the file in Rust, even if it finished opening after destroy was called.
      await source.then(closePdfSource).catch(() => undefined);
    },
  };
}

/**
 * pdf.js's `getViewport({ rotation })` *replaces* the page's own /Rotate instead of
 * adding to it, so the view rotation is always combined with it here.
 */
function totalRotation(page: PDFPageProxy, rotation: number): number {
  return (page.rotate + rotation) % 360;
}

/** Size of one page at 100%, in PDF points (its own rotation included). */
export async function getPageSize(pdf: PdfDocument, pageNumber: number): Promise<PageSize> {
  const { width, height } = (await pdf.getPage(pageNumber)).getViewport({ scale: 1 });
  return { width, height };
}

/**
 * Pixels per CSS pixel for a page drawn at `width` × `height` CSS px:
 * the screen's ratio (sharp text on HiDPI), lowered if the bitmap would be too big.
 */
function canvasPixelRatio(width: number, height: number): number {
  const screenRatio = window.devicePixelRatio || 1;
  const maxRatio = Math.sqrt(MAX_CANVAS_PIXELS / (width * height));
  return Math.min(screenRatio, maxRatio);
}

/** Draws one page onto a canvas at the given zoom and rotation. Returns a cancellable job. */
export function renderPage({ pdf, pageNumber, canvas, scale, rotation, onPageSize }: RenderPageOptions): RenderJob {
  // Two-step cancellation: the job may be cancelled while the page is still
  // being fetched (`cancelled` flag) or while it is drawing (`cancelTask`).
  let cancelTask: (() => void) | null = null;
  let cancelled = false;

  const promise = pdf.getPage(pageNumber).then((page) => {
    if (cancelled) return;

    // The viewer only knows page 1's size up front; this reports the real one.
    const base = page.getViewport({ scale: 1 });
    onPageSize?.({ width: base.width, height: base.height });

    // HiDPI screens have 2+ physical pixels per CSS pixel. Drawing the canvas at
    // physical resolution (then displaying it at CSS size) keeps text sharp.
    const viewport = page.getViewport({ scale, rotation: totalRotation(page, rotation) });
    const pixelRatio = canvasPixelRatio(viewport.width, viewport.height);
    canvas.width = Math.floor(viewport.width * pixelRatio);
    canvas.height = Math.floor(viewport.height * pixelRatio);

    const task = page.render({
      canvas,
      viewport,
      // Scale matrix [a, b, c, d, e, f]: enlarges the drawing by pixelRatio to fill the bigger canvas.
      transform: pixelRatio === 1 ? undefined : [pixelRatio, 0, 0, pixelRatio, 0, 0],
    });
    cancelTask = () => task.cancel();
    return task.promise;
  });

  return {
    promise,
    cancel: () => {
      cancelled = true;
      cancelTask?.();
    },
  };
}

/**
 * Frees what pdf.js cached for a page (parsed content, fonts, images) once it has
 * scrolled away. Without this, worker memory grows with every page ever viewed.
 */
export function releasePage(pdf: PdfDocument, pageNumber: number): void {
  pdf
    .getPage(pageNumber)
    .then((page) => page.cleanup())
    // The document may already be destroyed (tab closed); nothing left to free then.
    .catch(() => undefined);
}

/** Cancelling a render or a text layer rejects its promise; this tells that apart from a real error. */
export function isRenderCancelled(error: unknown): boolean {
  return error instanceof RenderingCancelledException || error instanceof AbortException;
}

/**
 * A page's text runs. Same filter as pdf.js's TextLayer (items that have a `str`),
 * so index `i` here is element `i` of the page's text layer: search relies on it.
 */
export async function getTextItems(pdf: PdfDocument, pageNumber: number): Promise<PdfTextItem[]> {
  const page = await pdf.getPage(pageNumber);
  const { items } = await page.getTextContent();
  return items
    .filter((item): item is Extract<(typeof items)[number], { str: string }> => "str" in item)
    .map(({ str, hasEOL }) => ({ str, hasEOL }));
}

/**
 * Builds the invisible, selectable text over a page canvas. pdf.js positions each
 * span in percentages of the page; the container's `--total-scale-factor` CSS
 * variable (set by the caller to `scale`) sizes the fonts.
 */
export function renderTextLayer({ pdf, pageNumber, container, scale, rotation }: TextLayerOptions): TextLayerJob {
  let layer: TextLayer | null = null;
  let cancelled = false;

  const promise = pdf.getPage(pageNumber).then(async (page) => {
    if (cancelled) throw new AbortException("Text layer cancelled");
    layer = new TextLayer({
      textContentSource: page.streamTextContent(),
      container,
      viewport: page.getViewport({ scale, rotation: totalRotation(page, rotation) }),
    });
    await layer.render();
    return { textDivs: layer.textDivs, itemStrings: layer.textContentItemsStr };
  });

  return {
    promise,
    cancel: () => {
      cancelled = true;
      layer?.cancel();
    },
  };
}

/** The document's bookmarks as a tree (empty if it has none). */
export async function getOutline(pdf: PdfDocument): Promise<PdfOutlineNode[]> {
  const toNode = (item: PdfjsOutlineItem, id: string): PdfOutlineNode => ({
    id,
    title: item.title,
    dest: item.dest ?? null,
    children: item.items.map((child: PdfjsOutlineItem, index: number) => toNode(child, `${id}.${index}`)),
  });
  const outline = await pdf.getOutline();
  return (outline ?? []).map((item, index) => toNode(item, String(index)));
}

/**
 * Turns a bookmark destination into a page and vertical position.
 * Explicit destinations look like `[pageRef, { name: "XYZ" }, left, top, zoom]`.
 */
export async function resolveDestination(pdf: PdfDocument, dest: PdfDestination): Promise<PageTarget | null> {
  const explicit = typeof dest === "string" ? await pdf.getDestination(dest) : dest;
  if (!Array.isArray(explicit) || explicit.length === 0) return null;

  const [ref, mode, ...args] = explicit as [unknown, { name?: string } | undefined, ...unknown[]];
  const pageIndex =
    typeof ref === "number" ? ref : await pdf.getPageIndex(ref as Parameters<PdfDocument["getPageIndex"]>[0]);
  const page = await pdf.getPage(pageIndex + 1);
  return { pageNumber: pageIndex + 1, topRatio: destinationTopRatio(page.view, mode?.name, args) };
}

/**
 * XYZ / FitH / FitBH carry a "top" coordinate in PDF units, measured from the
 * page's bottom edge; every other mode shows the page from its top.
 */
function destinationTopRatio(view: number[], mode: string | undefined, args: unknown[]): number {
  const top = mode === "XYZ" ? args[1] : mode === "FitH" || mode === "FitBH" ? args[0] : null;
  if (typeof top !== "number") return 0;
  const [, bottom, , pageTop] = view;
  return clamp((pageTop - top) / (pageTop - bottom), 0, 1);
}

/** Document information for "Document properties". */
export async function getMetadata(pdf: PdfDocument): Promise<PdfMetadata> {
  const { info } = await pdf.getMetadata();
  const fields = info as Record<string, unknown>;
  const text = (key: string): string | null => {
    const value = fields[key];
    return typeof value === "string" && value.trim() ? value : null;
  };
  const date = (key: string): Date | null => {
    const value = text(key);
    return value ? PDFDateString.toDateObject(value) : null;
  };

  return {
    title: text("Title"),
    author: text("Author"),
    subject: text("Subject"),
    creator: text("Creator"),
    producer: text("Producer"),
    created: date("CreationDate"),
    modified: date("ModDate"),
    pdfVersion: text("PDFFormatVersion"),
  };
}
```

- [ ] **Step 4: Shared render hook (moved from the viewer, now with rotation).**

File: `src/modules/pdf/hooks/usePdfPageRender.ts`
```ts
import { useEffect } from "react";
import { isRenderCancelled, releasePage, renderPage } from "../services/pdf.service";
import type { PageRenderOptions } from "../pdf.types";

/**
 * Draws a page onto its canvas while `enabled` is true. Used by the viewer pages
 * and the thumbnails.
 *
 * If the zoom or rotation changes, or the page scrolls away mid-render, the
 * effect cleanup cancels the running render, so stale renders never waste CPU
 * or draw an old state over a newer one.
 */
export function usePdfPageRender({
  canvasRef,
  pdf,
  pageNumber,
  scale,
  rotation,
  enabled,
  onPageSize,
}: PageRenderOptions): void {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!enabled || !canvas) return;

    const job = renderPage({
      pdf,
      pageNumber,
      canvas,
      scale,
      rotation,
      onPageSize: onPageSize && ((size) => onPageSize(pageNumber, size)),
    });
    job.promise.catch((error) => {
      // A cancelled render is expected, not a failure; only log real errors.
      if (!isRenderCancelled(error)) console.error(`Failed to render page ${pageNumber}`, error);
    });
    return job.cancel;
  }, [canvasRef, pdf, pageNumber, scale, rotation, enabled, onPageSize]);

  // Separate from the render effect so zooming (which re-renders) doesn't free
  // anything; this cleanup only runs when the page stops being shown.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!enabled || !canvas) return;
    return () => {
      // A full-page HiDPI canvas can hold 20–30 MB. WebKit keeps that bitmap until
      // garbage collection even after the element is removed; a zero size frees it now.
      canvas.width = 0;
      canvas.height = 0;
      releasePage(pdf, pageNumber);
    };
  }, [canvasRef, pdf, pageNumber, enabled]);
}
```

File: `src/modules/pdf/hooks/usePdfTextLayer.ts`
```ts
import { useEffect, useState } from "react";
import { isRenderCancelled, renderTextLayer } from "../services/pdf.service";
import type { TextLayerHandle, TextLayerHookOptions } from "../pdf.types";

/**
 * Builds a page's selectable text layer while `enabled`, rebuilt on zoom or
 * rotation. Returns the rendered layer (for search highlights), or null.
 */
export function usePdfTextLayer({
  containerRef,
  pdf,
  pageNumber,
  scale,
  rotation,
  enabled,
}: TextLayerHookOptions): TextLayerHandle | null {
  const [layer, setLayer] = useState<TextLayerHandle | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!enabled || !container) return;

    const job = renderTextLayer({ pdf, pageNumber, container, scale, rotation });
    job.promise.then(setLayer).catch((error) => {
      if (!isRenderCancelled(error)) console.error(`Failed to build text layer of page ${pageNumber}`, error);
    });
    return () => {
      job.cancel();
      container.replaceChildren();
      setLayer(null);
    };
  }, [containerRef, pdf, pageNumber, scale, rotation, enabled]);

  return layer;
}
```

- [ ] **Step 5: Delete the old hook.** `rm src/modules/viewer/hooks/usePageRender.ts`

- [ ] **Step 6: Verify.** `pnpm exec tsc --noEmit` — expected errors only in viewer files that still import the deleted hook / old `RenderPageOptions` (fixed in Task 3). No errors inside `src/modules/pdf/`.

---

### Task 3: viewer core — view state, rotation, fit page, single page, text layer, highlights, hand tool

**Files:**
- Create: `src/shared/hooks/useElementSize.ts`, `src/shared/hooks/useMediaQuery.ts`, `src/shared/hooks/useDebouncedValue.ts`
- Delete: `src/shared/hooks/useElementWidth.ts`
- Modify: `src/shared/hooks/hooks.types.ts` (append `ElementSize`)
- Modify: `src/shared/keyboard/keyboard.utils.ts`, `src/shared/keyboard/useKeyboardShortcuts.ts` (plain keys ignored while typing)
- Modify: `src/modules/viewer/viewer.types.ts`, `viewer.constants.ts`, `viewer.utils.ts` (full replacements)
- Modify: `src/modules/viewer/hooks/useZoom.ts`, `usePageNavigation.ts`, `useViewerShortcuts.ts` (full replacements)
- Create: `src/modules/viewer/hooks/useRotation.ts`, `useHandTool.ts`, `useTextHighlights.ts`, `useViewerState.ts`
- Modify: `src/modules/viewer/components/PdfPage.tsx`, `PageList.tsx` (full replacements)
- Create: `src/modules/viewer/components/ViewerPages.tsx`
- Delete: `src/modules/viewer/components/ViewerCanvas.tsx`, `src/modules/viewer/components/DocumentViewer.tsx`
- Modify: `src/styles/index.css` (tokens + text layer CSS)

**Interfaces:**
- Consumes: Task 2 hooks and `rotateSize`.
- Produces: `useViewerState(options: UseViewerStateOptions): ViewerState`; `ViewerPages({ viewer, highlights })`; types `ViewerState`, `ZoomControl` (adds `fitPage`, `setScale`), `PageNavigation` (`goToPage(pageNumber, topRatio?)`, `showPage(pageNumber)`), `Rotation`, `PageDisplay`, `ViewerTool`, `SidePanelId`, `TextRange`, `PageHighlight`, `HighlightsByPage`; constant `NO_PAGE_HIGHLIGHTS`; `VIEWER_SHORTCUTS`.

- [ ] **Step 1: Shared hooks.**

Append to `src/shared/hooks/hooks.types.ts`:
```ts

/** Width and height of an element, in CSS pixels. */
export interface ElementSize {
  width: number;
  height: number;
}
```

File: `src/shared/hooks/useElementSize.ts`
```ts
import { useEffect, useState } from "react";
import type { ElementSize } from "./hooks.types";

const UNMEASURED: ElementSize = { width: 0, height: 0 };

/**
 * Live size of an element, updated whenever it resizes (window resize, panel
 * opened…). The viewer uses it for the fit-width and fit-page zoom.
 *
 * Takes the element itself (not a ref) so the effect re-runs when the element
 * appears; callers get it via a callback ref + useState.
 */
export function useElementSize(element: HTMLElement | null): ElementSize {
  const [size, setSize] = useState<ElementSize>(UNMEASURED);

  useEffect(() => {
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize((current) => (current.width === width && current.height === height ? current : { width, height }));
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [element]);

  return size;
}
```

File: `src/shared/hooks/useMediaQuery.ts`
```ts
import { useEffect, useState } from "react";

/** True while the CSS media query matches, e.g. "(min-width: 48rem)". */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);

  useEffect(() => {
    const list = window.matchMedia(query);
    const update = () => setMatches(list.matches);
    update();
    list.addEventListener("change", update);
    return () => list.removeEventListener("change", update);
  }, [query]);

  return matches;
}
```

File: `src/shared/hooks/useDebouncedValue.ts`
```ts
import { useEffect, useState } from "react";

/** `value`, but only after it stopped changing for `delay` ms (e.g. search while typing). */
export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
```

Delete: `rm src/shared/hooks/useElementWidth.ts`

- [ ] **Step 2: Plain-key shortcuts must not fire while typing.** Single-page mode binds ArrowLeft/ArrowRight/PageUp/PageDown; without this, typing in the find bar would flip pages.

Append to `src/shared/keyboard/keyboard.utils.ts`:
```ts

/** True when the key press goes to a text field, where plain keys (arrows, letters) belong to the field. */
export function isTypingTarget(event: KeyboardEvent): boolean {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement;
}
```

In `src/shared/keyboard/useKeyboardShortcuts.ts`, replace the `find` line inside `onKeyDown` with:
```ts
      const typing = isTypingTarget(event);
      const binding = bindingsRef.current.find(
        ({ shortcut }) =>
          // While typing, only modifier shortcuts and Escape apply; plain keys go to the field.
          (!typing || shortcut.mod || shortcut.key === "Escape") && matchesShortcut(event, shortcut),
      );
```
and change its import to `import { isTypingTarget, matchesShortcut } from "./keyboard.utils";`.

- [ ] **Step 3: Viewer types, constants, utils.**

File: `src/modules/viewer/viewer.types.ts`
```ts
/** Types for the viewer module (displaying a loaded PDF and its controls). */
import type { ReactNode } from "react";
import type { IconType } from "react-icons";
import type { OpenedDocument } from "@/modules/document/document.types";
import type { MenuEntry } from "@/modules/menu/menu.types";
import type { PageSize, PdfDocument } from "@/modules/pdf/pdf.types";
import type { KeyboardShortcut } from "@/shared/keyboard/keyboard.types";
import type { ObserveVisibility, Point } from "@/shared/hooks/hooks.types";

/**
 * "fit-width" / "fit-page": scale follows the viewport size (recomputed on resize).
 * "custom": a fixed scale chosen by the user.
 */
export type ZoomMode = "fit-width" | "fit-page" | "custom";

export interface ZoomState {
  mode: ZoomMode;
  /** Only meaningful in "custom" mode. */
  scale: number;
}

/** Everything the UI needs to show and change the zoom (returned by useZoom). */
export interface ZoomControl {
  /** The effective scale currently applied to the pages. */
  scale: number;
  mode: ZoomMode;
  canZoomIn: boolean;
  canZoomOut: boolean;
  zoomIn: () => void;
  zoomOut: () => void;
  fitWidth: () => void;
  fitPage: () => void;
  /** Fixed zoom, e.g. 1 for "Actual size". Clamped to the zoom limits. */
  setScale: (scale: number) => void;
}

/** Clockwise view rotation, applied to every page on top of its own rotation. */
export type Rotation = 0 | 90 | 180 | 270;

export interface RotationControl {
  rotation: Rotation;
  rotateClockwise: () => void;
  rotateCounterclockwise: () => void;
}

/** "continuous": all pages stacked. "single": one page at a time. */
export type PageDisplay = "continuous" | "single";

/** What a mouse drag on the pages does: select text, or pan. */
export type ViewerTool = "select" | "hand";

export type SidePanelId = "thumbnails" | "bookmarks";

/** Returned by useScrollAnchor. */
export interface ScrollAnchor {
  /** Point (px from the scroll area's top-left) that stays fixed during the next zoom change. */
  setAnchor: (point: Point) => void;
}

/** Current page and ways to move (returned by usePageNavigation). */
export interface PageNavigation {
  currentPage: number;
  pageCount: number;
  /** Scrolls to a page; `topRatio` (0–1) picks a point further down it. */
  goToPage: (pageNumber: number, topRatio?: number) => void;
  /** Like goToPage, but doesn't move if the page is already on screen. */
  showPage: (pageNumber: number) => void;
}

/** A pending scroll, applied after the layout that shows the page exists. */
export interface ScrollRequest {
  pageNumber: number;
  topRatio: number;
}

/**
 * Loading a PDF as a "discriminated union": `status` tells TypeScript which
 * fields exist, so `pdf` can only be accessed once status === "ready".
 */
export type PdfLoadState =
  | { status: "loading" }
  | { status: "error"; error: string }
  | { status: "ready"; pdf: PdfDocument; defaultPageSize: PageSize };

/** Called by a page once it knows its real size at 100%. */
export type PageSizeReporter = (pageNumber: number, size: PageSize) => void;

/** Returned by usePageSizes. */
export interface PageSizes {
  /** One entry per page; page 1's size until a page reports its own. */
  sizes: PageSize[];
  reportSize: PageSizeReporter;
}

/** A character range inside one text item (one span of a page's text layer). */
export interface TextRange {
  itemIndex: number;
  start: number;
  end: number;
}

/** One search match on a page. `id` is unique per search, so the page knows when the current match changes. */
export interface PageHighlight {
  id: string;
  ranges: TextRange[];
  current: boolean;
}

export type HighlightsByPage = ReadonlyMap<number, readonly PageHighlight[]>;

export interface UseViewerStateOptions {
  pdf: PdfDocument;
  defaultPageSize: PageSize;
  /** False while the tab is in the background: no shortcuts, no canvases. */
  isActive: boolean;
}

/** One document's view: returned by useViewerState, rendered by ViewerPages. */
export interface ViewerState {
  pdf: PdfDocument;
  isActive: boolean;
  /** Callback ref for the scrolling element. */
  scrollRootRef: (element: HTMLDivElement | null) => void;
  zoom: ZoomControl;
  navigation: PageNavigation;
  pageSizes: PageSizes;
  rotation: RotationControl;
  display: PageDisplay;
  setDisplay: (display: PageDisplay) => void;
  tool: ViewerTool;
  setTool: (tool: ViewerTool) => void;
  /** True while the hand tool is dragging. */
  isPanning: boolean;
  /** Shared observer telling pages when they're near the screen; null until the scroll area exists. */
  observe: ObserveVisibility | null;
}

export interface ViewerShortcutsOptions {
  zoom: ZoomControl;
  navigation: PageNavigation;
  display: PageDisplay;
  enabled: boolean;
}

/** Shortcuts shown in the zoom menu and registered by useViewerShortcuts. */
export interface ViewerShortcuts {
  zoomIn: KeyboardShortcut;
  zoomOut: KeyboardShortcut;
  fitPage: KeyboardShortcut;
  actualSize: KeyboardShortcut;
  fitWidth: KeyboardShortcut;
}

/** A button of the tools rail or panel rail. */
export interface RailItem<T extends string> {
  id: T;
  label: string;
  icon: IconType;
}

export interface ViewerPagesProps {
  viewer: ViewerState;
  highlights: HighlightsByPage;
}

export interface PageListProps {
  pdf: PdfDocument;
  pageSizes: PageSize[];
  scale: number;
  rotation: Rotation;
  /** The page shown in single page display; null in continuous display. */
  singlePage: number | null;
  /** Background tabs draw no canvases, which frees their memory. */
  isActive: boolean;
  observe: ObserveVisibility | null;
  highlights: HighlightsByPage;
  onPageSize: PageSizeReporter;
}

export interface PdfPageProps {
  pdf: PdfDocument;
  pageNumber: number;
  size: PageSize;
  scale: number;
  rotation: Rotation;
  isActive: boolean;
  observe: ObserveVisibility | null;
  highlights: readonly PageHighlight[];
  onPageSize: PageSizeReporter;
}

export interface ViewerToolbarProps {
  zoom: ZoomControl;
  navigation: PageNavigation;
}

export interface ZoomControlsProps {
  zoom: ZoomControl;
}

export interface PageNavigatorProps {
  navigation: PageNavigation;
}

export interface ViewerMessageProps {
  title: string;
  description?: string;
}

export interface DocToolbarProps {
  title: string;
  zoom: ZoomControl;
  display: PageDisplay;
  onDisplayChange: (display: PageDisplay) => void;
  onRotate: () => void;
  onSearch: () => void;
  searchShortcut: KeyboardShortcut;
  onPrint: () => void;
  printShortcut: KeyboardShortcut;
  /** Entries of the ⋯ menu (built by the app, which knows the OS actions). */
  moreEntries: MenuEntry[];
}

export interface SearchTriggerProps {
  shortcut: KeyboardShortcut;
  onClick: () => void;
}

export interface RailButtonProps {
  icon: IconType;
  label: string;
  active?: boolean;
  /** Shown but not usable (e.g. a tool that's coming soon); keeps its tooltip. */
  unavailable?: boolean;
  onClick?: () => void;
}

export interface ToolsRailProps {
  tool: ViewerTool;
  onToolChange: (tool: ViewerTool) => void;
}

export interface PanelRailProps {
  active: SidePanelId | null;
  onToggle: (panel: SidePanelId) => void;
}

export interface SidePanelProps {
  panel: SidePanelId;
  onClose: () => void;
  children: ReactNode;
}

export interface NoticeBarProps {
  message: string;
  onDismiss: () => void;
}

export interface DocumentPropertiesDialogProps {
  open: boolean;
  onClose: () => void;
  pdf: PdfDocument;
  document: OpenedDocument;
  /** Page 1's size, shown as "Page size". */
  pageSize: PageSize;
}

export interface PropertyRowProps {
  label: string;
  value: string | null;
}
```

File: `src/modules/viewer/viewer.constants.ts`
```ts
/** Tuning values and static data for the viewer, kept in one place so behaviour is easy to adjust. */
import {
  LuBookmark,
  LuHand,
  LuHighlighter,
  LuLayoutGrid,
  LuMessageSquare,
  LuPencil,
  LuSignature,
  LuTextCursor,
  LuType,
} from "react-icons/lu";
import type { PageHighlight, RailItem, SidePanelId, ViewerShortcuts, ViewerTool } from "./viewer.types";

/** Zoom levels used by the +/− buttons, Ctrl+= / Ctrl+− and Ctrl+wheel. */
export const ZOOM_STEPS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 3, 4] as const;
export const MIN_ZOOM = ZOOM_STEPS[0];
export const MAX_ZOOM = ZOOM_STEPS[ZOOM_STEPS.length - 1];

/** Choices in the toolbar's zoom menu. */
export const ZOOM_PRESETS = [0.5, 0.75, 1, 1.25, 1.5, 2, 3, 4] as const;

/** Horizontal breathing room around pages, in px. Matches `px-8` in PageList. */
export const PAGE_GUTTER = 32;

/**
 * Vertical room kept in fit-page mode, in px: `pt-8` above the page plus the
 * floating toolbar's area below it.
 */
export const FIT_PAGE_VERTICAL_SPACE = 96;

/**
 * How far outside the viewport pages are pre-rendered.
 * Pages within 800px above/below the screen start drawing early,
 * so they're usually ready by the time you scroll to them.
 */
export const RENDER_MARGIN = "800px 0px";

/**
 * Where the "current page" line sits, as a fraction of the viewport height
 * from the top. A page becomes current once its top passes 35% of the screen,
 * which feels more natural than switching only when it reaches the very top.
 */
export const CURRENT_PAGE_THRESHOLD = 0.35;

/**
 * Ctrl+wheel distance (px) that counts as one zoom step.
 * A mouse wheel notch is usually ≥ 50px, so each notch is one step (like Acrobat).
 * Touchpads send many tiny deltas; they add up until they reach this amount,
 * so pinch / two-finger zoom isn't wildly fast.
 */
export const WHEEL_ZOOM_STEP = 50;

/** Pixel size of one "line" when the wheel reports lines (Firefox-style deltaMode 1). */
export const WHEEL_LINE_HEIGHT = 16;

/** Every page element carries `data-page-number` (see PdfPage); this finds them without a ref per page. */
export const PAGE_SELECTOR = "[data-page-number]";

/** Same keys as Acrobat: Ctrl+0 fit page, Ctrl+1 actual size, Ctrl+2 fit width. */
export const VIEWER_SHORTCUTS: ViewerShortcuts = {
  zoomIn: { key: "=", mod: true },
  zoomOut: { key: "-", mod: true },
  fitPage: { key: "0", mod: true },
  actualSize: { key: "1", mod: true },
  fitWidth: { key: "2", mod: true },
};

/** Working tools of the left rail. */
export const VIEWER_TOOLS: RailItem<ViewerTool>[] = [
  { id: "select", label: "Select text", icon: LuTextCursor },
  { id: "hand", label: "Hand tool (drag to scroll)", icon: LuHand },
];

/** Shown disabled until the PDF tools exist, so the rail already reads like Acrobat's. */
export const UPCOMING_TOOLS: RailItem<string>[] = [
  { id: "comment", label: "Comment", icon: LuMessageSquare },
  { id: "highlight", label: "Highlight", icon: LuHighlighter },
  { id: "draw", label: "Draw", icon: LuPencil },
  { id: "text", label: "Add text", icon: LuType },
  { id: "sign", label: "Fill & Sign", icon: LuSignature },
];

/** Panels of the right rail; `label` is also the panel title. */
export const SIDE_PANELS: RailItem<SidePanelId>[] = [
  { id: "thumbnails", label: "Page thumbnails", icon: LuLayoutGrid },
  { id: "bookmarks", label: "Bookmarks", icon: LuBookmark },
];

/** Shared empty list, so pages without matches keep a stable prop (PdfPage is memoized). */
export const NO_PAGE_HIGHLIGHTS: readonly PageHighlight[] = [];

/** Points per millimetre, for "Page size" in Document properties. */
export const POINTS_PER_MM = 72 / 25.4;
```

File: `src/modules/viewer/viewer.utils.ts`
```ts
/** Helpers for the viewer module: pure math, page lookups and text highlight DOM writes. */
import type { PageSize, TextLayerHandle } from "@/modules/pdf/pdf.types";
import type { ElementSize } from "@/shared/hooks/hooks.types";
import {
  FIT_PAGE_VERTICAL_SPACE,
  PAGE_GUTTER,
  PAGE_SELECTOR,
  POINTS_PER_MM,
  SIDE_PANELS,
  WHEEL_LINE_HEIGHT,
} from "./viewer.constants";
import type { PageHighlight, Rotation, SidePanelId } from "./viewer.types";

/**
 * Vertical wheel distance in pixels, whatever unit the browser reported.
 * deltaMode: 0 = pixels, 1 = lines, 2 = pages (`pageHeight` is one page of scrolling).
 */
export function wheelDeltaInPixels(event: WheelEvent, pageHeight: number): number {
  if (event.deltaMode === WheelEvent.DOM_DELTA_LINE) return event.deltaY * WHEEL_LINE_HEIGHT;
  if (event.deltaMode === WheelEvent.DOM_DELTA_PAGE) return event.deltaY * pageHeight;
  return event.deltaY;
}

/** Same-size check for page sizes (exact: both come from the same pdf.js numbers). */
export function isSameSize(a: PageSize, b: PageSize): boolean {
  return a.width === b.width && a.height === b.height;
}

/** Turns a rotation by ±90° steps, staying within 0–270. */
export function rotateBy(rotation: Rotation, degrees: number): Rotation {
  return ((((rotation + degrees) % 360) + 360) % 360) as Rotation;
}

/**
 * Scale that fits `page` (already rotated for display) into the viewport, or
 * null before the viewport has been measured.
 */
export function computeFitScale(mode: "fit-width" | "fit-page", page: PageSize, viewport: ElementSize): number | null {
  if (!viewport.width || !viewport.height || !page.width || !page.height) return null;
  const byWidth = (viewport.width - PAGE_GUTTER * 2) / page.width;
  if (mode === "fit-width") return byWidth;
  return Math.min(byWidth, (viewport.height - FIT_PAGE_VERTICAL_SPACE) / page.height);
}

/** "210 × 297 mm" from a size in points. */
export function formatPageSize(size: PageSize): string {
  const millimetres = (points: number) => Math.round(points / POINTS_PER_MM);
  return `${millimetres(size.width)} × ${millimetres(size.height)} mm`;
}

export function getSidePanelLabel(panel: SidePanelId): string {
  return SIDE_PANELS.find((item) => item.id === panel)?.label ?? "";
}

/** All page elements of the viewer, in page order (see `data-page-number` on PdfPage). */
export function getPageElements(container: HTMLElement): NodeListOf<HTMLElement> {
  return container.querySelectorAll<HTMLElement>(PAGE_SELECTOR);
}

export function getPageElement(container: HTMLElement, pageNumber: number): HTMLElement | null {
  return container.querySelector<HTMLElement>(`[data-page-number="${pageNumber}"]`);
}

/**
 * The page under vertical position `y` (px in the scroll content): the last page
 * whose top edge is at or above it, or null if there are no pages.
 *
 * Binary search, since pages are stacked in order: about 11 layout reads for a
 * 2,000-page document, instead of reading every page's position on each scroll.
 */
export function findPageAt(container: HTMLElement, y: number): HTMLElement | null {
  const pages = getPageElements(container);
  if (pages.length === 0) return null;

  let low = 0;
  let high = pages.length - 1;
  while (low < high) {
    // Round up so `low = middle` always makes progress.
    const middle = Math.ceil((low + high) / 2);
    if (pages[middle].offsetTop <= y) low = middle;
    else high = middle - 1;
  }
  return pages[low];
}

/** True if any part of the element is inside the scroll container's visible area. */
export function isOnScreen(container: HTMLElement, element: HTMLElement): boolean {
  const top = container.scrollTop;
  return element.offsetTop < top + container.clientHeight && element.offsetTop + element.offsetHeight > top;
}

/**
 * Marks search matches in a page's text layer by wrapping the matched characters
 * of each span in <mark> elements (styled in index.css). Spans touched by a
 * previous call are reset first. Returns the current match's first mark, if any.
 */
export function applyHighlights(layer: TextLayerHandle, highlights: readonly PageHighlight[]): HTMLElement | null {
  const { textDivs, itemStrings } = layer;
  for (let index = 0; index < textDivs.length; index++) {
    if (textDivs[index].childElementCount > 0) textDivs[index].textContent = itemStrings[index];
  }

  const rangesByItem = new Map<number, Array<{ start: number; end: number; current: boolean }>>();
  for (const highlight of highlights) {
    for (const range of highlight.ranges) {
      const list = rangesByItem.get(range.itemIndex) ?? [];
      list.push({ start: range.start, end: range.end, current: highlight.current });
      rangesByItem.set(range.itemIndex, list);
    }
  }

  let currentMark: HTMLElement | null = null;
  for (const [index, ranges] of rangesByItem) {
    const div = textDivs[index];
    const text = itemStrings[index];
    if (!div || text === undefined) continue;

    ranges.sort((a, b) => a.start - b.start);
    const fragment = document.createDocumentFragment();
    let cursor = 0;
    for (const range of ranges) {
      const start = Math.max(range.start, cursor);
      if (start > cursor) fragment.append(text.slice(cursor, start));
      if (range.end <= start) continue;
      const mark = document.createElement("mark");
      mark.textContent = text.slice(start, range.end);
      if (range.current) {
        mark.classList.add("current");
        currentMark ??= mark;
      }
      fragment.append(mark);
      cursor = range.end;
    }
    if (cursor < text.length) fragment.append(text.slice(cursor));
    div.replaceChildren(fragment);
  }
  return currentMark;
}
```

- [ ] **Step 4: Hooks.**

File: `src/modules/viewer/hooks/useZoom.ts`
```ts
import { useCallback, useMemo, useRef, useState } from "react";
import type { PageSize } from "@/modules/pdf/pdf.types";
import type { ElementSize } from "@/shared/hooks/hooks.types";
import { clamp } from "@/shared/utils/math.utils";
import { MAX_ZOOM, MIN_ZOOM, ZOOM_STEPS } from "../viewer.constants";
import { computeFitScale } from "../viewer.utils";
import type { ZoomControl, ZoomState } from "../viewer.types";

// The next zoom step above / below the current scale. The 0.001 tolerance avoids
// floating-point issues (e.g. 1.2500000001 not counting as 1.25).
// Fit modes produce arbitrary scales like 1.37, so zooming in from there goes to 1.5.
const nextStep = (scale: number) => ZOOM_STEPS.find((step) => step > scale + 0.001) ?? MAX_ZOOM;
const previousStep = (scale: number) =>
  [...ZOOM_STEPS].reverse().find((step) => step < scale - 0.001) ?? MIN_ZOOM;

/**
 * Zoom state for the viewer.
 * @param page size of the page the fit modes fit (page 1, rotated for display), at 100%
 * @param viewport current size of the scroll area, in px
 */
export function useZoom(page: PageSize, viewport: ElementSize): ZoomControl {
  // Starts in fit-width, the most comfortable default for reading.
  const [state, setState] = useState<ZoomState>({ mode: "fit-width", scale: 1 });

  // In fit modes the scale is derived, not stored: it's recomputed whenever the
  // window resizes, so pages keep filling the space.
  const scale = useMemo(() => {
    if (state.mode === "custom") return state.scale;
    const fit = computeFitScale(state.mode, page, viewport);
    return fit === null ? state.scale : clamp(fit, MIN_ZOOM, MAX_ZOOM);
  }, [state, page, viewport]);

  // Any manual zoom leaves the fit modes and freezes the chosen scale.
  // Updates are functional so fast repeats (several Ctrl+wheel notches before React
  // re-renders) each move one step instead of all reading the same stale scale.
  // The derived scale is read from a ref, so these callbacks stay stable while the
  // window resizes; otherwise every resize would re-render whatever receives them.
  const derivedScale = useRef(scale);
  derivedScale.current = scale;
  const step = useCallback(
    (pick: (scale: number) => number) =>
      setState((current) => ({
        mode: "custom",
        scale: pick(current.mode === "custom" ? current.scale : derivedScale.current),
      })),
    [],
  );
  const zoomIn = useCallback(() => step(nextStep), [step]);
  const zoomOut = useCallback(() => step(previousStep), [step]);
  const setScale = useCallback(
    (value: number) => setState({ mode: "custom", scale: clamp(value, MIN_ZOOM, MAX_ZOOM) }),
    [],
  );
  const fitWidth = useCallback(() => setState((current) => ({ ...current, mode: "fit-width" })), []);
  const fitPage = useCallback(() => setState((current) => ({ ...current, mode: "fit-page" })), []);

  return {
    scale,
    mode: state.mode,
    canZoomIn: scale < MAX_ZOOM,
    canZoomOut: scale > MIN_ZOOM,
    zoomIn,
    zoomOut,
    fitWidth,
    fitPage,
    setScale,
  };
}
```

File: `src/modules/viewer/hooks/usePageNavigation.ts`
```ts
import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { clamp } from "@/shared/utils/math.utils";
import { CURRENT_PAGE_THRESHOLD } from "../viewer.constants";
import { findPageAt, getPageElement, isOnScreen } from "../viewer.utils";
import type { PageNavigation, ScrollRequest } from "../viewer.types";

/** The page whose top edge has passed the "current page" line. */
function findCurrentPage(container: HTMLElement): number {
  const marker = container.scrollTop + container.clientHeight * CURRENT_PAGE_THRESHOLD;
  const page = findPageAt(container, marker);
  return page ? Number(page.dataset.pageNumber) : 1;
}

/**
 * Tracks which page is being read (from the scroll position) and scrolls to pages.
 *
 * Scrolling is applied in a layout effect after React has rendered, because the
 * target page may not exist yet: in single page display, only the current page
 * is in the DOM, so going to page 7 first renders page 7, then scrolls to it.
 *
 * Page offsets (`offsetTop`) are relative to ViewerPages' `relative` wrapper, which
 * sits at the scroll area's top-left, so they're positions in the scroll content.
 */
export function usePageNavigation(container: HTMLElement | null, pageCount: number): PageNavigation {
  const [currentPage, setCurrentPage] = useState(1);
  // A new object on every call, so going to the page you're already on still scrolls.
  const [request, setRequest] = useState<ScrollRequest | null>(null);

  useEffect(() => {
    if (!container) return;

    // Scroll events can fire several times per frame; measuring once per frame is enough.
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        setCurrentPage(findCurrentPage(container));
      });
    };

    // passive: tells the browser we never call preventDefault, so scrolling stays smooth.
    container.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      container.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, [container]);

  useLayoutEffect(() => {
    if (!container || !request) return;
    const page = getPageElement(container, request.pageNumber);
    if (page) container.scrollTop = page.offsetTop + request.topRatio * page.offsetHeight;
  }, [container, request]);

  const goToPage = useCallback(
    (pageNumber: number, topRatio = 0) => {
      // Accept anything typed (0, 999, 2.5) and turn it into a valid page.
      const target = clamp(Math.round(pageNumber), 1, pageCount);
      setCurrentPage(target);
      setRequest({ pageNumber: target, topRatio });
    },
    [pageCount],
  );

  const showPage = useCallback(
    (pageNumber: number) => {
      const page = container && getPageElement(container, pageNumber);
      if (!page || !container || !isOnScreen(container, page)) goToPage(pageNumber);
    },
    [container, goToPage],
  );

  return { currentPage, pageCount, goToPage, showPage };
}
```

File: `src/modules/viewer/hooks/useViewerShortcuts.ts`
```ts
import { useKeyboardShortcuts } from "@/shared/keyboard/useKeyboardShortcuts";
import type { ShortcutBinding } from "@/shared/keyboard/keyboard.types";
import { VIEWER_SHORTCUTS } from "../viewer.constants";
import type { ViewerShortcutsOptions } from "../viewer.types";

/**
 * Zoom shortcuts, plus page flipping in single page display. Active only while
 * `enabled` (the viewer's tab is visible).
 * Two bindings for zoom in because "+" needs Shift on most layouts:
 * Ctrl+= (no Shift) and Ctrl++ (with Shift) both work.
 */
export function useViewerShortcuts({ zoom, navigation, display, enabled }: ViewerShortcutsOptions): void {
  const next = () => navigation.goToPage(navigation.currentPage + 1);
  const previous = () => navigation.goToPage(navigation.currentPage - 1);

  const bindings: ShortcutBinding[] = [
    { shortcut: VIEWER_SHORTCUTS.zoomIn, handler: zoom.zoomIn },
    { shortcut: { key: "+", mod: true, shift: true }, handler: zoom.zoomIn },
    { shortcut: VIEWER_SHORTCUTS.zoomOut, handler: zoom.zoomOut },
    { shortcut: VIEWER_SHORTCUTS.fitPage, handler: zoom.fitPage },
    { shortcut: VIEWER_SHORTCUTS.actualSize, handler: () => zoom.setScale(1) },
    { shortcut: VIEWER_SHORTCUTS.fitWidth, handler: zoom.fitWidth },
    // In continuous display these keys keep their native scrolling.
    ...(display === "single"
      ? [
          { shortcut: { key: "PageDown" }, handler: next },
          { shortcut: { key: "ArrowRight" }, handler: next },
          { shortcut: { key: "PageUp" }, handler: previous },
          { shortcut: { key: "ArrowLeft" }, handler: previous },
        ]
      : []),
  ];

  useKeyboardShortcuts(enabled ? bindings : []);
}
```

File: `src/modules/viewer/hooks/useRotation.ts`
```ts
import { useCallback, useState } from "react";
import { rotateBy } from "../viewer.utils";
import type { Rotation, RotationControl } from "../viewer.types";

/** View rotation of a document (all pages turn together, like Acrobat's "Rotate view"). */
export function useRotation(): RotationControl {
  const [rotation, setRotation] = useState<Rotation>(0);
  const rotateClockwise = useCallback(() => setRotation((current) => rotateBy(current, 90)), []);
  const rotateCounterclockwise = useCallback(() => setRotation((current) => rotateBy(current, -90)), []);
  return { rotation, rotateClockwise, rotateCounterclockwise };
}
```

File: `src/modules/viewer/hooks/useHandTool.ts`
```ts
import { useEffect, useState } from "react";

/**
 * Hand tool: dragging with the mouse scrolls the pages. Returns true while dragging
 * (for the grabbing cursor).
 *
 * Mouse and pen only: on touch screens the browser's own scrolling already pans.
 */
export function useHandTool(container: HTMLElement | null, enabled: boolean): boolean {
  const [isPanning, setPanning] = useState(false);

  useEffect(() => {
    if (!container || !enabled) return;
    let start: { x: number; y: number; left: number; top: number } | null = null;

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0 || event.pointerType === "touch") return;
      start = { x: event.clientX, y: event.clientY, left: container.scrollLeft, top: container.scrollTop };
      // Keep receiving moves even if the pointer leaves the window mid-drag.
      container.setPointerCapture(event.pointerId);
      setPanning(true);
      // No text selection or image dragging while panning.
      event.preventDefault();
    };
    const onPointerMove = (event: PointerEvent) => {
      if (!start) return;
      container.scrollLeft = start.left - (event.clientX - start.x);
      container.scrollTop = start.top - (event.clientY - start.y);
    };
    const onPointerUp = () => {
      if (!start) return;
      start = null;
      setPanning(false);
    };

    container.addEventListener("pointerdown", onPointerDown);
    container.addEventListener("pointermove", onPointerMove);
    container.addEventListener("pointerup", onPointerUp);
    container.addEventListener("pointercancel", onPointerUp);
    return () => {
      container.removeEventListener("pointerdown", onPointerDown);
      container.removeEventListener("pointermove", onPointerMove);
      container.removeEventListener("pointerup", onPointerUp);
      container.removeEventListener("pointercancel", onPointerUp);
      setPanning(false);
    };
  }, [container, enabled]);

  return isPanning;
}
```

File: `src/modules/viewer/hooks/useTextHighlights.ts`
```ts
import { useEffect, useRef } from "react";
import type { TextLayerHandle } from "@/modules/pdf/pdf.types";
import { applyHighlights } from "../viewer.utils";
import type { PageHighlight } from "../viewer.types";

/**
 * Shows search matches in a page's text layer, re-applied whenever the layer is
 * rebuilt (zoom, rotation) or the matches change.
 *
 * The current match is scrolled into view only when it *becomes* current (its id
 * changes): matches keep arriving while a search runs, and re-scrolling on each
 * update would fight the user's own scrolling.
 */
export function useTextHighlights(layer: TextLayerHandle | null, highlights: readonly PageHighlight[]): void {
  const lastScrolledId = useRef<string | null>(null);

  useEffect(() => {
    // No layer yet (page just scrolled in): wait for it, keeping lastScrolledId as is.
    if (!layer) return;
    const currentMark = applyHighlights(layer, highlights);
    const currentId = highlights.find((highlight) => highlight.current)?.id ?? null;
    if (currentMark && currentId !== lastScrolledId.current) {
      currentMark.scrollIntoView({ block: "center", inline: "nearest" });
    }
    lastScrolledId.current = currentId;
  }, [layer, highlights]);
}
```

File: `src/modules/viewer/hooks/useViewerState.ts`
```ts
import { useEffect, useMemo, useRef, useState } from "react";
import { rotateSize } from "@/modules/pdf/pdf.utils";
import { useElementSize } from "@/shared/hooks/useElementSize";
import { useVisibilityObserver } from "@/shared/hooks/useVisibilityObserver";
import { RENDER_MARGIN } from "../viewer.constants";
import type { PageDisplay, UseViewerStateOptions, ViewerState, ViewerTool } from "../viewer.types";
import { useHandTool } from "./useHandTool";
import { usePageNavigation } from "./usePageNavigation";
import { usePageSizes } from "./usePageSizes";
import { useRotation } from "./useRotation";
import { useScrollAnchor } from "./useScrollAnchor";
import { useViewerShortcuts } from "./useViewerShortcuts";
import { useWheelZoom } from "./useWheelZoom";
import { useZoom } from "./useZoom";

/**
 * All the state of one document's view, in one place: zoom, rotation, page
 * display, tool, navigation and page sizes. The app's Workspace reads it to drive
 * the toolbar and panels; ViewerPages renders it.
 */
export function useViewerState({ pdf, defaultPageSize, isActive }: UseViewerStateOptions): ViewerState {
  // The scroll element is kept in state (via a callback ref) rather than a plain ref,
  // so hooks that depend on it re-run once it exists in the DOM.
  const [scrollRoot, setScrollRoot] = useState<HTMLDivElement | null>(null);
  const viewport = useElementSize(scrollRoot);
  const rotation = useRotation();
  const [display, setDisplay] = useState<PageDisplay>("continuous");
  const [tool, setTool] = useState<ViewerTool>("select");

  const pageSizes = usePageSizes(pdf.numPages, defaultPageSize, scrollRoot);
  // Fit modes follow page 1, not the widest page: sizes are learned while scrolling,
  // and the zoom changing because a wider page came into view would be disorienting.
  const fitTarget = useMemo(() => rotateSize(defaultPageSize, rotation.rotation), [defaultPageSize, rotation.rotation]);
  const zoom = useZoom(fitTarget, viewport);
  const navigation = usePageNavigation(scrollRoot, pdf.numPages);
  const anchor = useScrollAnchor(scrollRoot, zoom.scale);
  // One observer for all pages, telling each when it's near the screen.
  const observe = useVisibilityObserver(scrollRoot, RENDER_MARGIN);
  const isPanning = useHandTool(scrollRoot, tool === "hand");
  // Several viewers can be mounted (one per tab); only the visible one reacts to keys.
  useViewerShortcuts({ zoom, navigation, display, enabled: isActive });
  useWheelZoom(scrollRoot, zoom, anchor);

  // Rotating or switching page display rebuilds the whole layout; stay on the same page.
  const currentPage = useRef(navigation.currentPage);
  currentPage.current = navigation.currentPage;
  const { goToPage } = navigation;
  const isFirstLayout = useRef(true);
  useEffect(() => {
    if (isFirstLayout.current) {
      isFirstLayout.current = false;
      return;
    }
    goToPage(currentPage.current);
  }, [rotation.rotation, display, goToPage]);

  return {
    pdf,
    isActive,
    scrollRootRef: setScrollRoot,
    zoom,
    navigation,
    pageSizes,
    rotation,
    display,
    setDisplay,
    tool,
    setTool,
    isPanning,
    observe,
  };
}
```

- [ ] **Step 5: Page components.**

File: `src/modules/viewer/components/PdfPage.tsx`
```tsx
import { memo, useRef, type CSSProperties } from "react";
import { usePdfPageRender } from "@/modules/pdf/hooks/usePdfPageRender";
import { usePdfTextLayer } from "@/modules/pdf/hooks/usePdfTextLayer";
import { rotateSize } from "@/modules/pdf/pdf.utils";
import { useIsVisible } from "@/shared/hooks/useIsVisible";
import { useTextHighlights } from "../hooks/useTextHighlights";
import type { PdfPageProps } from "../viewer.types";

/**
 * One PDF page: the canvas, and the invisible selectable text over it. The outer
 * box always has the page's size (so scrolling and page positions are correct),
 * but canvas and text only exist while the page is near the screen and its tab is
 * the active one. Other pages are empty white boxes, which keeps memory flat on
 * big documents and with many tabs open.
 *
 * memo: skip re-rendering every page when only the toolbar state changes (e.g. current page).
 */
export const PdfPage = memo(function PdfPage({
  pdf,
  pageNumber,
  size,
  scale,
  rotation,
  isActive,
  observe,
  highlights,
  onPageSize,
}: PdfPageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textLayerRef = useRef<HTMLDivElement>(null);
  const shown = useIsVisible(containerRef, observe) && isActive;

  usePdfPageRender({ canvasRef, pdf, pageNumber, scale, rotation, enabled: shown, onPageSize });
  const textLayer = usePdfTextLayer({ containerRef: textLayerRef, pdf, pageNumber, scale, rotation, enabled: shown });
  useTextHighlights(textLayer, highlights);

  // Display size in CSS pixels (the canvas inside may have more physical pixels on HiDPI).
  const displayed = rotateSize(size, rotation);
  const width = displayed.width * scale;
  const height = displayed.height * scale;

  return (
    <div
      ref={containerRef}
      // Used by usePageNavigation to find pages and detect the current one.
      data-page-number={pageNumber}
      aria-label={`Page ${pageNumber}`}
      className="relative shrink-0 bg-white shadow-sm ring-1 ring-ink/5"
      style={{ width, height }}
    >
      {shown && (
        <>
          <canvas ref={canvasRef} className="block" style={{ width, height }} />
          {/* pdf.js sizes fonts from this variable; it must equal the canvas scale. */}
          <div
            ref={textLayerRef}
            className="textLayer"
            style={{ "--total-scale-factor": scale } as CSSProperties}
          />
        </>
      )}
    </div>
  );
});
```

File: `src/modules/viewer/components/PageList.tsx`
```tsx
import { NO_PAGE_HIGHLIGHTS } from "../viewer.constants";
import { PdfPage } from "./PdfPage";
import type { PageListProps } from "../viewer.types";

/** The pages: all of them stacked (continuous display), or just one (single page display). */
export function PageList({
  pdf,
  pageSizes,
  scale,
  rotation,
  singlePage,
  isActive,
  observe,
  highlights,
  onPageSize,
}: PageListProps) {
  const pageNumbers = singlePage ? [singlePage] : pageSizes.map((_, index) => index + 1);

  return (
    // w-max + min-w-full: when zoomed in, pages wider than the window make the list grow,
    // so horizontal scrolling works; when zoomed out, pages stay centered.
    // pb-24 leaves room so the last page isn't hidden behind the floating toolbar.
    <div className="mx-auto flex w-max min-w-full flex-col items-center gap-4 px-8 pt-8 pb-24">
      {pageNumbers.map((pageNumber) => (
        <PdfPage
          // Page order never changes within a document, so the page number is a stable key.
          key={pageNumber}
          pdf={pdf}
          pageNumber={pageNumber}
          size={pageSizes[pageNumber - 1]}
          scale={scale}
          rotation={rotation}
          isActive={isActive}
          observe={observe}
          highlights={highlights.get(pageNumber) ?? NO_PAGE_HIGHLIGHTS}
          onPageSize={onPageSize}
        />
      ))}
    </div>
  );
}
```

File: `src/modules/viewer/components/ViewerPages.tsx`
```tsx
import { cn } from "@/shared/utils/class-names.utils";
import { PageList } from "./PageList";
import { ViewerToolbar } from "./ViewerToolbar";
import type { ViewerPagesProps } from "../viewer.types";

/**
 * The reading area: the scrollable pages and the floating page/zoom pill.
 * All state comes from useViewerState; search highlights come from the app.
 */
export function ViewerPages({ viewer, highlights }: ViewerPagesProps) {
  const { zoom, navigation, rotation, display, tool, isPanning } = viewer;
  const isHand = tool === "hand";

  return (
    // `relative` lets the toolbar float over the pages, and is the offsetParent page
    // positions are measured against (see usePageNavigation).
    <div className="relative h-full">
      <div
        ref={viewer.scrollRootRef}
        className={cn(
          "h-full overflow-auto",
          // Hand tool: the text can't be selected, so drags reach the scroll area.
          isHand && "[&_.textLayer]:pointer-events-none",
          isHand && (isPanning ? "cursor-grabbing" : "cursor-grab"),
        )}
      >
        <PageList
          pdf={viewer.pdf}
          pageSizes={viewer.pageSizes.sizes}
          scale={zoom.scale}
          rotation={rotation.rotation}
          singlePage={display === "single" ? navigation.currentPage : null}
          isActive={viewer.isActive}
          observe={viewer.observe}
          highlights={highlights}
          onPageSize={viewer.pageSizes.reportSize}
        />
      </div>
      <ViewerToolbar zoom={zoom} navigation={navigation} />
    </div>
  );
}
```

Delete: `rm src/modules/viewer/components/ViewerCanvas.tsx src/modules/viewer/components/DocumentViewer.tsx`

- [ ] **Step 6: CSS.** In `src/styles/index.css`, add these tokens inside `@theme` after `--color-accent`:
```css
  --color-danger: #dc2626; /* errors */
  --color-search-hit: rgb(250 204 21 / 0.45); /* search matches */
  --color-search-current: rgb(234 88 12 / 0.55); /* the selected search match */
```
and append at the end of the file:
```css
/*
 * pdf.js text layer: invisible, selectable text positioned over each page canvas.
 * A minimal subset of pdfjs-dist/web/pdf_viewer.css (that file styles pdf.js's
 * whole viewer: annotations, editors…). Re-check it when upgrading pdf.js.
 * pdf.js sets each span's --font-height / --scale-x / --rotate, and the layer's
 * size from --total-scale-factor (set on the element by PdfPage).
 */
@layer components {
  .textLayer {
    position: absolute;
    inset: 0;
    overflow: clip;
    line-height: 1;
    text-align: initial;
    letter-spacing: normal;
    word-spacing: normal;
    text-size-adjust: none;
    -webkit-text-size-adjust: none;
    forced-color-adjust: none;
    transform-origin: 0 0;
    z-index: 0;
    --scale-round-x: 1px;
    --scale-round-y: 1px;
    --min-font-size: 1;
    --text-scale-factor: calc(var(--total-scale-factor) * var(--min-font-size));
    --min-font-size-inv: calc(1 / var(--min-font-size));
  }

  .textLayer :is(span, br) {
    color: transparent;
    position: absolute;
    white-space: pre;
    cursor: text;
    transform-origin: 0% 0%;
    -webkit-user-select: text;
    user-select: text;
  }

  .textLayer > :not(.markedContent),
  .textLayer .markedContent span:not(.markedContent) {
    z-index: 1;
    --font-height: 0;
    font-size: calc(var(--text-scale-factor) * var(--font-height));
    --scale-x: 1;
    --rotate: 0deg;
    transform: rotate(var(--rotate)) scaleX(var(--scale-x)) scale(var(--min-font-size-inv));
  }

  .textLayer .markedContent {
    display: contents;
  }

  .textLayer ::selection {
    background: color-mix(in srgb, var(--color-accent), transparent 70%);
    color: transparent;
  }

  .textLayer br::selection {
    background: transparent;
  }

  /* Search matches: <mark> elements inside the spans (see applyHighlights). */
  .textLayer mark {
    color: transparent;
    background: var(--color-search-hit);
  }

  .textLayer mark.current {
    background: var(--color-search-current);
  }

  /* View rotation: pdf.js lays the layer out unrotated and tags it with data-main-rotation. */
  .textLayer[data-main-rotation="90"] {
    transform: rotate(90deg) translateY(-100%);
  }

  .textLayer[data-main-rotation="180"] {
    transform: rotate(180deg) translate(-100%, -100%);
  }

  .textLayer[data-main-rotation="270"] {
    transform: rotate(270deg) translateX(-100%);
  }
}
```

- [ ] **Step 7: Verify.** `pnpm exec tsc --noEmit` — remaining errors only in `src/app/components/TabContent.tsx` (still imports `DocumentViewer`, fixed in Task 7). Manual (Review Focus 1, after Task 7): open a PDF that has rotated pages, rotate the view 90° twice; text selection must cover the visible words on every page.

---

### Task 4: viewer chrome — toolbar, rails, side panel, notice, properties; menu dropdown

**Files:**
- Modify: `src/modules/menu/menu.types.ts`, `src/modules/menu/components/MenuItem.tsx` (checked items)
- Create: `src/modules/menu/components/DropdownMenu.tsx`
- Modify: `src/shared/ui/ui.types.ts`, `src/shared/ui/Dialog.tsx` (optional `className`)
- Create: `src/modules/viewer/viewer.menus.ts`
- Create: `src/modules/viewer/hooks/useDocumentMetadata.ts`
- Create: `src/modules/viewer/components/DocToolbar.tsx`, `SearchTrigger.tsx`, `RailButton.tsx`, `ToolsRail.tsx`, `PanelRail.tsx`, `SidePanel.tsx`, `NoticeBar.tsx`, `DocumentPropertiesDialog.tsx`, `PropertyRow.tsx`

**Interfaces:**
- Consumes: `ZoomControl`, `PageDisplay`, `ViewerTool`, `SidePanelId`, `VIEWER_TOOLS`, `UPCOMING_TOOLS`, `SIDE_PANELS`, `getMetadata`.
- Produces: `DropdownMenu(props: DropdownMenuProps)`; `MenuItemDefinition.checked?: boolean`; components with the props declared in Task 3's `viewer.types.ts`.

- [ ] **Step 1: Checked menu items.** In `src/modules/menu/menu.types.ts`, add to `MenuItemDefinition` after `danger?`:
```ts
  /** Makes the item a choice with a check mark (e.g. the current zoom). */
  checked?: boolean;
```
and append:
```ts

/** A button that opens a menu below it (toolbar menus). */
export interface DropdownMenuProps {
  /** Accessible name and tooltip of the button. */
  label: string;
  /** Button content (icon, text…). */
  trigger: ReactNode;
  entries: MenuEntry[];
  /** Which edge of the button the menu lines up with. */
  align?: "start" | "end";
  className?: string;
}
```
and add `ReactNode` to its `import type { … } from "react"` line.

File: `src/modules/menu/components/MenuItem.tsx`
```tsx
import { LuCheck } from "react-icons/lu";
import { formatShortcut } from "@/shared/keyboard/keyboard.utils";
import { cn } from "@/shared/utils/class-names.utils";
import type { MenuItemProps } from "../menu.types";

/** A single row in a menu: optional check mark, icon and label on the left, shortcut hint on the right. */
export function MenuItem({ item, onSelected }: MenuItemProps) {
  const { icon: Icon } = item;
  const isChoice = item.checked !== undefined;

  const select = () => {
    // Close the menu first, so a dialog opened by the action isn't covered by it.
    onSelected();
    item.onSelect();
  };

  return (
    // role="none" removes the <li> list semantics; the button inside is the menu item.
    <li role="none">
      <button
        type="button"
        role={isChoice ? "menuitemradio" : "menuitem"}
        aria-checked={isChoice ? item.checked : undefined}
        disabled={item.disabled}
        className={cn(
          "flex h-8 w-full items-center gap-2.5 px-2.5 text-left transition-colors disabled:pointer-events-none disabled:text-subtle",
          item.danger ? "text-danger hover:bg-hover" : "text-ink hover:bg-hover",
        )}
        onClick={select}
      >
        {/* Invisible (not removed) when unchecked, so labels of a choice group stay aligned. */}
        {isChoice && <LuCheck className={cn("size-4 shrink-0 text-accent", !item.checked && "invisible")} />}
        {Icon && <Icon className="size-4 shrink-0 opacity-80" />}
        <span className="flex-1">{item.label}</span>
        {item.shortcut && <kbd className="pl-6 font-sans text-xs text-subtle">{formatShortcut(item.shortcut)}</kbd>}
      </button>
    </li>
  );
}
```

File: `src/modules/menu/components/DropdownMenu.tsx`
```tsx
import { useCallback, useRef, useState } from "react";
import { useClickOutside } from "@/shared/hooks/useClickOutside";
import { useKeyboardShortcuts } from "@/shared/keyboard/useKeyboardShortcuts";
import { cn } from "@/shared/utils/class-names.utils";
import { MenuList } from "./MenuList";
import type { DropdownMenuProps } from "../menu.types";

/**
 * A toolbar button that opens a menu under it (zoom, page display, ⋯).
 * Same panel as the menu bar and context menus (MenuList); closes on outside press,
 * Escape, or after picking an item.
 */
export function DropdownMenu({ label, trigger, entries, align = "start", className }: DropdownMenuProps) {
  const [isOpen, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);

  useClickOutside(ref, close, isOpen);
  useKeyboardShortcuts(isOpen ? [{ shortcut: { key: "Escape" }, handler: close }] : []);

  return (
    // `relative` anchors the absolutely positioned menu under the button.
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label={label}
        title={label}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        className={cn(
          "inline-flex h-7 items-center gap-1 px-1.5 text-muted transition-colors hover:bg-hover hover:text-ink",
          "focus-visible:outline-2 focus-visible:outline-accent",
          isOpen && "bg-hover text-ink",
          className,
        )}
        onClick={() => setOpen((open) => !open)}
      >
        {trigger}
      </button>
      {isOpen && (
        <MenuList
          entries={entries}
          onSelected={close}
          className={cn("absolute top-full mt-1", align === "end" ? "right-0" : "left-0")}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Dialog width.** In `src/shared/ui/ui.types.ts` add to `DialogProps`: `/** Extra classes for the card, e.g. a wider width. */ className?: string;`. In `src/shared/ui/Dialog.tsx`, destructure `className`, import `cn` from `@/shared/utils/class-names.utils`, and change the card's class to `className={cn("w-80 max-w-[calc(100vw-2rem)] border border-border bg-surface shadow-xl shadow-ink/5", className)}`.

- [ ] **Step 3: Zoom and page display menus.**

File: `src/modules/viewer/viewer.menus.ts`
```ts
import { LuFile, LuRows3 } from "react-icons/lu";
import { separator } from "@/modules/menu/menu.utils";
import type { MenuEntry } from "@/modules/menu/menu.types";
import { toPercent } from "@/shared/utils/math.utils";
import { VIEWER_SHORTCUTS, ZOOM_PRESETS } from "./viewer.constants";
import type { PageDisplay, ZoomControl } from "./viewer.types";

/** Toolbar zoom menu: Fit width · Fit page · Actual size │ 50% … 400%. */
export function buildZoomMenu(zoom: ZoomControl): MenuEntry[] {
  const isPreset = (scale: number) => zoom.mode === "custom" && Math.abs(zoom.scale - scale) < 0.001;
  return [
    {
      id: "fit-width",
      label: "Fit width",
      shortcut: VIEWER_SHORTCUTS.fitWidth,
      checked: zoom.mode === "fit-width",
      onSelect: zoom.fitWidth,
    },
    {
      id: "fit-page",
      label: "Fit page",
      shortcut: VIEWER_SHORTCUTS.fitPage,
      checked: zoom.mode === "fit-page",
      onSelect: zoom.fitPage,
    },
    {
      id: "actual-size",
      label: "Actual size",
      shortcut: VIEWER_SHORTCUTS.actualSize,
      checked: isPreset(1),
      onSelect: () => zoom.setScale(1),
    },
    separator("presets"),
    ...ZOOM_PRESETS.map((scale) => ({
      id: `zoom-${scale}`,
      label: toPercent(scale),
      checked: isPreset(scale),
      onSelect: () => zoom.setScale(scale),
    })),
  ];
}

/** Toolbar page display menu: Continuous · Single page. */
export function buildPageDisplayMenu(display: PageDisplay, onChange: (display: PageDisplay) => void): MenuEntry[] {
  return [
    {
      id: "continuous",
      label: "Continuous",
      icon: LuRows3,
      checked: display === "continuous",
      onSelect: () => onChange("continuous"),
    },
    {
      id: "single",
      label: "Single page",
      icon: LuFile,
      checked: display === "single",
      onSelect: () => onChange("single"),
    },
  ];
}
```

- [ ] **Step 4: Toolbar.**

File: `src/modules/viewer/components/SearchTrigger.tsx`
```tsx
import { LuSearch } from "react-icons/lu";
import { IconButton } from "@/shared/ui/IconButton";
import { formatShortcut } from "@/shared/keyboard/keyboard.utils";
import type { SearchTriggerProps } from "../viewer.types";

/**
 * Opens the find bar. Looks like a search field on wide screens (like Acrobat's),
 * and is just an icon on phones. The real input lives in the find bar, so there's
 * only ever one search box.
 */
export function SearchTrigger({ shortcut, onClick }: SearchTriggerProps) {
  return (
    <>
      <button
        type="button"
        onClick={onClick}
        className="hidden h-7 w-64 items-center gap-2 border border-border px-2 text-subtle transition-colors hover:border-muted hover:text-muted focus-visible:outline-2 focus-visible:outline-accent md:flex"
      >
        <LuSearch className="size-3.5" />
        <span className="flex-1 text-left">Search text</span>
        <kbd className="font-sans text-xs">{formatShortcut(shortcut)}</kbd>
      </button>
      <IconButton className="md:hidden" icon={LuSearch} label="Search text" onClick={onClick} />
    </>
  );
}
```

File: `src/modules/viewer/components/DocToolbar.tsx`
```tsx
import { LuChevronDown, LuEllipsis, LuFile, LuFileText, LuPrinter, LuRotateCw, LuRows3 } from "react-icons/lu";
import { DropdownMenu } from "@/modules/menu/components/DropdownMenu";
import { formatShortcut } from "@/shared/keyboard/keyboard.utils";
import { IconButton } from "@/shared/ui/IconButton";
import { toPercent } from "@/shared/utils/math.utils";
import { buildPageDisplayMenu, buildZoomMenu } from "../viewer.menus";
import { SearchTrigger } from "./SearchTrigger";
import type { DocToolbarProps } from "../viewer.types";

/**
 * The document's top bar (Acrobat-style): file name │ search │ zoom, rotate,
 * page display, print, ⋯.
 */
export function DocToolbar({
  title,
  zoom,
  display,
  onDisplayChange,
  onRotate,
  onSearch,
  searchShortcut,
  onPrint,
  printShortcut,
  moreEntries,
}: DocToolbarProps) {
  return (
    <header className="flex h-10 shrink-0 items-center gap-2 border-b border-border bg-surface px-2">
      <div className="flex min-w-0 flex-1 items-center gap-2 pl-1">
        <LuFileText className="size-4 shrink-0 text-muted" />
        <span className="truncate font-medium text-ink" title={title}>
          {title}
        </span>
      </div>

      <SearchTrigger shortcut={searchShortcut} onClick={onSearch} />

      <div className="flex flex-1 items-center justify-end gap-0.5">
        <DropdownMenu
          label="Zoom"
          align="end"
          entries={buildZoomMenu(zoom)}
          trigger={
            <>
              {/* Fixed width + tabular-nums: the bar doesn't shift as the number changes. */}
              <span className="w-10 text-right tabular-nums">{toPercent(zoom.scale)}</span>
              <LuChevronDown className="size-3.5" />
            </>
          }
        />
        <IconButton icon={LuRotateCw} label="Rotate view clockwise" onClick={onRotate} />
        <DropdownMenu
          label="Page display"
          align="end"
          entries={buildPageDisplayMenu(display, onDisplayChange)}
          trigger={display === "single" ? <LuFile className="size-4" /> : <LuRows3 className="size-4" />}
        />
        <span className="mx-1 h-4 w-px bg-border" />
        <IconButton icon={LuPrinter} label={`Print (${formatShortcut(printShortcut)})`} onClick={onPrint} />
        <DropdownMenu label="More options" align="end" entries={moreEntries} trigger={<LuEllipsis className="size-4" />} />
      </div>
    </header>
  );
}
```

- [ ] **Step 5: Rails and panel frame.**

File: `src/modules/viewer/components/RailButton.tsx`
```tsx
import { cn } from "@/shared/utils/class-names.utils";
import type { RailButtonProps } from "../viewer.types";

/**
 * Square icon button of the side rails. Active: accent icon on the hover tone.
 * Unavailable buttons use aria-disabled (not `disabled`) so their "coming soon"
 * tooltip still shows on hover.
 */
export function RailButton({ icon: Icon, label, active = false, unavailable = false, onClick }: RailButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={unavailable ? undefined : active}
      aria-disabled={unavailable || undefined}
      onClick={unavailable ? undefined : onClick}
      className={cn(
        "inline-flex size-8 shrink-0 items-center justify-center text-muted transition-colors",
        "focus-visible:outline-2 focus-visible:outline-accent",
        unavailable ? "cursor-default opacity-35" : "hover:bg-hover hover:text-ink",
        active && "bg-hover text-accent hover:text-accent",
      )}
    >
      <Icon className="size-4.5" />
    </button>
  );
}
```

File: `src/modules/viewer/components/ToolsRail.tsx`
```tsx
import { UPCOMING_TOOLS, VIEWER_TOOLS } from "../viewer.constants";
import { RailButton } from "./RailButton";
import type { ToolsRailProps } from "../viewer.types";

/**
 * Left rail of quick tools (Acrobat-style). Select and Hand work; the rest are
 * placeholders until the PDF tools exist. Hidden on phones, where touch already
 * pans and the two working tools move into the ⋯ menu.
 */
export function ToolsRail({ tool, onToolChange }: ToolsRailProps) {
  return (
    <nav
      aria-label="Tools"
      className="hidden w-11 shrink-0 flex-col items-center gap-1 border-r border-border bg-surface py-2 md:flex"
    >
      {VIEWER_TOOLS.map((item) => (
        <RailButton
          key={item.id}
          icon={item.icon}
          label={item.label}
          active={tool === item.id}
          onClick={() => onToolChange(item.id)}
        />
      ))}
      <span className="my-1 h-px w-6 bg-border" />
      {UPCOMING_TOOLS.map((item) => (
        <RailButton key={item.id} icon={item.icon} label={`${item.label} — coming soon`} unavailable />
      ))}
    </nav>
  );
}
```

File: `src/modules/viewer/components/PanelRail.tsx`
```tsx
import { SIDE_PANELS } from "../viewer.constants";
import { RailButton } from "./RailButton";
import type { PanelRailProps } from "../viewer.types";

/** Right rail: opens a side panel; pressing the active one again closes it. */
export function PanelRail({ active, onToggle }: PanelRailProps) {
  return (
    <nav
      aria-label="Panels"
      className="flex w-11 shrink-0 flex-col items-center gap-1 border-l border-border bg-surface py-2"
    >
      {SIDE_PANELS.map((item) => (
        <RailButton
          key={item.id}
          icon={item.icon}
          label={item.label}
          active={active === item.id}
          onClick={() => onToggle(item.id)}
        />
      ))}
    </nav>
  );
}
```

File: `src/modules/viewer/components/SidePanel.tsx`
```tsx
import { LuX } from "react-icons/lu";
import { IconButton } from "@/shared/ui/IconButton";
import { getSidePanelLabel } from "../viewer.utils";
import type { SidePanelProps } from "../viewer.types";

/**
 * Frame of a side panel (thumbnails, bookmarks): title bar and a body for the
 * panel's content. Pushes the pages aside on wide screens; on phones it floats
 * over them (next to the rail) so the pages keep their width.
 */
export function SidePanel({ panel, onClose, children }: SidePanelProps) {
  const title = getSidePanelLabel(panel);
  return (
    <aside
      aria-label={title}
      className="absolute inset-y-0 right-11 z-20 flex w-60 flex-col border-l border-border bg-surface shadow-lg shadow-ink/5 md:static md:z-auto md:shadow-none"
    >
      <header className="flex h-9 shrink-0 items-center justify-between border-b border-border pr-1 pl-3">
        <h2 className="text-xs font-medium tracking-wide text-muted uppercase">{title}</h2>
        <IconButton icon={LuX} label="Close panel" onClick={onClose} />
      </header>
      <div className="min-h-0 flex-1">{children}</div>
    </aside>
  );
}
```

File: `src/modules/viewer/components/NoticeBar.tsx`
```tsx
import { LuCircleAlert, LuX } from "react-icons/lu";
import { IconButton } from "@/shared/ui/IconButton";
import type { NoticeBarProps } from "../viewer.types";

/** One-line error under the toolbar (e.g. printing failed), until dismissed. */
export function NoticeBar({ message, onDismiss }: NoticeBarProps) {
  return (
    <div role="alert" className="flex h-8 shrink-0 items-center gap-2 border-b border-border bg-surface pr-1 pl-3 text-xs text-danger">
      <LuCircleAlert className="size-3.5 shrink-0" />
      <span className="min-w-0 flex-1 truncate" title={message}>
        {message}
      </span>
      <IconButton icon={LuX} label="Dismiss" onClick={onDismiss} />
    </div>
  );
}
```

- [ ] **Step 6: Document properties.**

File: `src/modules/viewer/hooks/useDocumentMetadata.ts`
```ts
import { useEffect, useState } from "react";
import { getMetadata } from "@/modules/pdf/services/pdf.service";
import type { PdfDocument, PdfMetadata } from "@/modules/pdf/pdf.types";

/** Document information, read the first time it's needed (`enabled`) and then kept. */
export function useDocumentMetadata(pdf: PdfDocument, enabled: boolean): PdfMetadata | null {
  const [metadata, setMetadata] = useState<PdfMetadata | null>(null);

  useEffect(() => {
    if (!enabled || metadata) return;
    let active = true;
    getMetadata(pdf)
      .then((value) => active && setMetadata(value))
      .catch((error) => console.error("Failed to read document properties", error));
    return () => {
      active = false;
    };
  }, [pdf, enabled, metadata]);

  return metadata;
}
```

File: `src/modules/viewer/components/PropertyRow.tsx`
```tsx
import type { PropertyRowProps } from "../viewer.types";

/** "Label   value" row of Document properties; missing values show a dash. */
export function PropertyRow({ label, value }: PropertyRowProps) {
  return (
    <>
      <dt className="text-muted">{label}</dt>
      {/* select-text: values (paths, titles) are worth copying, unlike the rest of the UI. */}
      <dd className="min-w-0 break-words text-ink select-text">{value ?? "—"}</dd>
    </>
  );
}
```

File: `src/modules/viewer/components/DocumentPropertiesDialog.tsx`
```tsx
import { Dialog } from "@/shared/ui/Dialog";
import { formatBytes } from "@/shared/utils/format.utils";
import { useDocumentMetadata } from "../hooks/useDocumentMetadata";
import { formatPageSize } from "../viewer.utils";
import { PropertyRow } from "./PropertyRow";
import type { DocumentPropertiesDialogProps } from "../viewer.types";

const formatDate = (date: Date | null) => (date ? date.toLocaleString() : null);

/** File and document information (⋯ → Document properties). */
export function DocumentPropertiesDialog({ open, onClose, pdf, document, pageSize }: DocumentPropertiesDialogProps) {
  const metadata = useDocumentMetadata(pdf, open);

  return (
    <Dialog open={open} title="Document properties" onClose={onClose} className="w-[28rem]">
      <dl className="mt-3 grid grid-cols-[8rem_1fr] gap-x-4 gap-y-2">
        <PropertyRow label="File" value={document.name} />
        <PropertyRow label="Location" value={document.path} />
        <PropertyRow label="File size" value={formatBytes(document.size)} />
        <PropertyRow label="Pages" value={String(pdf.numPages)} />
        <PropertyRow label="Page size" value={formatPageSize(pageSize)} />
        <PropertyRow label="Title" value={metadata?.title ?? null} />
        <PropertyRow label="Author" value={metadata?.author ?? null} />
        <PropertyRow label="Subject" value={metadata?.subject ?? null} />
        <PropertyRow label="Application" value={metadata?.creator ?? null} />
        <PropertyRow label="PDF producer" value={metadata?.producer ?? null} />
        <PropertyRow label="PDF version" value={metadata?.pdfVersion ?? null} />
        <PropertyRow label="Created" value={formatDate(metadata?.created ?? null)} />
        <PropertyRow label="Modified" value={formatDate(metadata?.modified ?? null)} />
      </dl>
    </Dialog>
  );
}
```

- [ ] **Step 7: Verify.** `pnpm exec tsc --noEmit` — only the TabContent error from Task 3 remains.

---

### Task 5: thumbnails module

**Files:**
- Create: `src/modules/thumbnails/thumbnails.types.ts`, `thumbnails.constants.ts`
- Create: `src/modules/thumbnails/components/ThumbnailsPanel.tsx`, `ThumbnailItem.tsx`

**Interfaces:**
- Consumes: `usePdfPageRender`, `rotateSize`, `useVisibilityObserver`, `useIsVisible`.
- Produces: `ThumbnailsPanel(props: ThumbnailsPanelProps)` with `{ pdf, pageSizes, rotation, currentPage, isActive, onSelect(pageNumber) }`.

- [ ] **Step 1: Types and constants.**

File: `src/modules/thumbnails/thumbnails.types.ts`
```ts
/**
 * The thumbnails module shows small previews of every page in a side panel.
 * It only renders; which page is current and what a click does come from props.
 */
import type { PageSize, PdfDocument } from "@/modules/pdf/pdf.types";
import type { ObserveVisibility } from "@/shared/hooks/hooks.types";

export interface ThumbnailsPanelProps {
  pdf: PdfDocument;
  /** Known page sizes at 100% (from the viewer). */
  pageSizes: PageSize[];
  /** View rotation in degrees, so previews match the pages. */
  rotation: number;
  currentPage: number;
  /** False in background tabs: no rendering. */
  isActive: boolean;
  onSelect: (pageNumber: number) => void;
}

export interface ThumbnailItemProps {
  pdf: PdfDocument;
  pageNumber: number;
  size: PageSize;
  rotation: number;
  isCurrent: boolean;
  isActive: boolean;
  observe: ObserveVisibility | null;
  onSelect: (pageNumber: number) => void;
}
```

File: `src/modules/thumbnails/thumbnails.constants.ts`
```ts
/** Width of a page preview in CSS px; fits the 240px panel with its padding. */
export const THUMBNAIL_WIDTH = 112;

/** Previews within this distance of the panel's visible area are drawn ahead of time. */
export const THUMBNAIL_RENDER_MARGIN = "300px 0px";
```

- [ ] **Step 2: Components.**

File: `src/modules/thumbnails/components/ThumbnailItem.tsx`
```tsx
import { memo, useRef } from "react";
import { usePdfPageRender } from "@/modules/pdf/hooks/usePdfPageRender";
import { rotateSize } from "@/modules/pdf/pdf.utils";
import { useIsVisible } from "@/shared/hooks/useIsVisible";
import { cn } from "@/shared/utils/class-names.utils";
import { THUMBNAIL_WIDTH } from "../thumbnails.constants";
import type { ThumbnailItemProps } from "../thumbnails.types";

/**
 * One page preview and its number. Drawn only while near the panel's visible
 * area (same lazy rendering as the viewer pages). memo: the list re-renders on
 * every page change, but only the old and new current items actually change.
 */
export const ThumbnailItem = memo(function ThumbnailItem({
  pdf,
  pageNumber,
  size,
  rotation,
  isCurrent,
  isActive,
  observe,
  onSelect,
}: ThumbnailItemProps) {
  const itemRef = useRef<HTMLLIElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const shown = useIsVisible(itemRef, observe) && isActive;

  const displayed = rotateSize(size, rotation);
  const scale = THUMBNAIL_WIDTH / displayed.width;
  const width = THUMBNAIL_WIDTH;
  const height = displayed.height * scale;
  usePdfPageRender({ canvasRef, pdf, pageNumber, scale, rotation, enabled: shown });

  return (
    // data-thumbnail: lets the panel scroll the current page's preview into view.
    <li ref={itemRef} data-thumbnail={pageNumber}>
      <button
        type="button"
        aria-label={`Page ${pageNumber}`}
        aria-current={isCurrent ? "page" : undefined}
        onClick={() => onSelect(pageNumber)}
        className="group flex flex-col items-center gap-1.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <span
          className={cn(
            "block bg-white ring-1 ring-border transition-shadow group-hover:ring-muted",
            isCurrent && "ring-2 ring-accent group-hover:ring-accent",
          )}
          style={{ width, height }}
        >
          {shown && <canvas ref={canvasRef} className="block" style={{ width, height }} />}
        </span>
        <span className={cn("text-xs tabular-nums text-muted", isCurrent && "font-medium text-accent")}>
          {pageNumber}
        </span>
      </button>
    </li>
  );
});
```

File: `src/modules/thumbnails/components/ThumbnailsPanel.tsx`
```tsx
import { useEffect, useState } from "react";
import { useVisibilityObserver } from "@/shared/hooks/useVisibilityObserver";
import { THUMBNAIL_RENDER_MARGIN } from "../thumbnails.constants";
import { ThumbnailItem } from "./ThumbnailItem";
import type { ThumbnailsPanelProps } from "../thumbnails.types";

/** Scrollable column of page previews; the current page is outlined and kept in view. */
export function ThumbnailsPanel({ pdf, pageSizes, rotation, currentPage, isActive, onSelect }: ThumbnailsPanelProps) {
  // Callback ref + state, so the observer is created once the element exists.
  const [root, setRoot] = useState<HTMLDivElement | null>(null);
  const observe = useVisibilityObserver(root, THUMBNAIL_RENDER_MARGIN);

  // Follow the reader: as pages change, the current preview scrolls into view
  // ("nearest" does nothing if it's already visible).
  useEffect(() => {
    root?.querySelector(`[data-thumbnail="${currentPage}"]`)?.scrollIntoView({ block: "nearest" });
  }, [root, currentPage]);

  return (
    <div ref={setRoot} className="h-full overflow-y-auto">
      <ol className="flex flex-col items-center gap-3 py-3">
        {pageSizes.map((size, index) => (
          <ThumbnailItem
            key={index + 1}
            pdf={pdf}
            pageNumber={index + 1}
            size={size}
            rotation={rotation}
            isCurrent={currentPage === index + 1}
            isActive={isActive}
            observe={observe}
            onSelect={onSelect}
          />
        ))}
      </ol>
    </div>
  );
}
```

- [ ] **Step 3: Verify.** `pnpm exec tsc --noEmit` — no errors inside `src/modules/thumbnails/`.

---

### Task 6: outline and search modules

**Files:**
- Create: `src/modules/outline/outline.types.ts`, `outline.constants.ts`, `hooks/useOutline.ts`, `components/OutlinePanel.tsx`, `components/OutlineTree.tsx`, `components/OutlineItem.tsx`, `components/OutlineMessage.tsx`
- Create: `src/modules/search/search.types.ts`, `search.constants.ts`, `search.utils.ts`, `hooks/useDocumentSearch.ts`, `components/FindBar.tsx`

**Interfaces:**
- Consumes: `getOutline`, `resolveDestination`, `getTextItems`, `useDebouncedValue`.
- Produces: `OutlinePanel({ pdf, onNavigate(target: PageTarget) })`; `useDocumentSearch(pdf): DocumentSearch`; `FindBar({ search })`; `SearchMatch { id, pageNumber, ranges: TextRange[] }`.

- [ ] **Step 1: Outline.**

File: `src/modules/outline/outline.types.ts`
```ts
/**
 * The outline module shows the PDF's bookmarks (table of contents) as a tree.
 * Clicking one resolves its destination and reports it; the app does the scrolling.
 */
import type { PageTarget, PdfDocument, PdfOutlineNode } from "@/modules/pdf/pdf.types";

export type OutlineState =
  | { status: "loading" }
  | { status: "ready"; nodes: PdfOutlineNode[] }
  | { status: "error"; error: string };

export interface OutlinePanelProps {
  pdf: PdfDocument;
  onNavigate: (target: PageTarget) => void;
}

export interface OutlineTreeProps {
  nodes: PdfOutlineNode[];
  depth: number;
  onSelect: (node: PdfOutlineNode) => void;
}

export interface OutlineItemProps {
  node: PdfOutlineNode;
  depth: number;
  onSelect: (node: PdfOutlineNode) => void;
}

export interface OutlineMessageProps {
  title: string;
  description?: string;
}
```

File: `src/modules/outline/outline.constants.ts`
```ts
/** Indentation per tree level, in px. */
export const OUTLINE_INDENT = 12;
```

File: `src/modules/outline/hooks/useOutline.ts`
```ts
import { useEffect, useState } from "react";
import { getOutline } from "@/modules/pdf/services/pdf.service";
import type { PdfDocument } from "@/modules/pdf/pdf.types";
import { getErrorMessage } from "@/shared/utils/error.utils";
import type { OutlineState } from "../outline.types";

/** Loads the document's bookmarks once per document. */
export function useOutline(pdf: PdfDocument): OutlineState {
  const [state, setState] = useState<OutlineState>({ status: "loading" });

  useEffect(() => {
    let active = true;
    setState({ status: "loading" });
    getOutline(pdf)
      .then((nodes) => active && setState({ status: "ready", nodes }))
      .catch((error) => active && setState({ status: "error", error: getErrorMessage(error) }));
    return () => {
      active = false;
    };
  }, [pdf]);

  return state;
}
```

File: `src/modules/outline/components/OutlineMessage.tsx`
```tsx
import type { OutlineMessageProps } from "../outline.types";

/** Centered status text inside the panel (loading, empty, error). */
export function OutlineMessage({ title, description }: OutlineMessageProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-1 px-6 text-center">
      <p className="font-medium text-ink">{title}</p>
      {description && <p className="text-xs text-muted">{description}</p>}
    </div>
  );
}
```

File: `src/modules/outline/components/OutlineItem.tsx`
```tsx
import { useState } from "react";
import { LuChevronRight } from "react-icons/lu";
import { cn } from "@/shared/utils/class-names.utils";
import { OUTLINE_INDENT } from "../outline.constants";
import { OutlineTree } from "./OutlineTree";
import type { OutlineItemProps } from "../outline.types";

/** One bookmark: expand toggle (if it has children) and its title, which jumps to it. */
export function OutlineItem({ node, depth, onSelect }: OutlineItemProps) {
  // Collapsed by default, like Acrobat: long documents start as a short list of chapters.
  const [isExpanded, setExpanded] = useState(false);
  const hasChildren = node.children.length > 0;

  return (
    <li role="treeitem" aria-expanded={hasChildren ? isExpanded : undefined}>
      <div className="flex items-start hover:bg-hover" style={{ paddingLeft: depth * OUTLINE_INDENT }}>
        {hasChildren ? (
          <button
            type="button"
            aria-label={isExpanded ? "Collapse" : "Expand"}
            onClick={() => setExpanded((expanded) => !expanded)}
            className="flex size-7 shrink-0 items-center justify-center text-muted hover:text-ink"
          >
            <LuChevronRight className={cn("size-3.5 transition-transform", isExpanded && "rotate-90")} />
          </button>
        ) : (
          <span className="size-7 shrink-0" />
        )}
        <button
          type="button"
          disabled={!node.dest}
          onClick={() => onSelect(node)}
          className="min-w-0 flex-1 py-1.5 pr-3 text-left leading-snug text-ink disabled:text-muted"
        >
          {node.title}
        </button>
      </div>
      {hasChildren && isExpanded && <OutlineTree nodes={node.children} depth={depth + 1} onSelect={onSelect} />}
    </li>
  );
}
```

File: `src/modules/outline/components/OutlineTree.tsx`
```tsx
import { OutlineItem } from "./OutlineItem";
import type { OutlineTreeProps } from "../outline.types";

/** A level of the bookmark tree; nested levels are rendered by OutlineItem. */
export function OutlineTree({ nodes, depth, onSelect }: OutlineTreeProps) {
  return (
    <ul role={depth === 0 ? "tree" : "group"}>
      {nodes.map((node) => (
        <OutlineItem key={node.id} node={node} depth={depth} onSelect={onSelect} />
      ))}
    </ul>
  );
}
```

File: `src/modules/outline/components/OutlinePanel.tsx`
```tsx
import { useCallback } from "react";
import { resolveDestination } from "@/modules/pdf/services/pdf.service";
import type { PdfOutlineNode } from "@/modules/pdf/pdf.types";
import { useOutline } from "../hooks/useOutline";
import { OutlineMessage } from "./OutlineMessage";
import { OutlineTree } from "./OutlineTree";
import type { OutlinePanelProps } from "../outline.types";

/** Bookmarks panel: the outline tree, or a message when there's nothing to show. */
export function OutlinePanel({ pdf, onNavigate }: OutlinePanelProps) {
  const state = useOutline(pdf);

  const select = useCallback(
    (node: PdfOutlineNode) => {
      if (!node.dest) return;
      resolveDestination(pdf, node.dest)
        .then((target) => target && onNavigate(target))
        .catch((error) => console.error("Failed to open bookmark", error));
    },
    [pdf, onNavigate],
  );

  if (state.status === "loading") return <OutlineMessage title="Loading bookmarks…" />;
  if (state.status === "error") return <OutlineMessage title="Bookmarks could not be read" description={state.error} />;
  if (state.nodes.length === 0) {
    return <OutlineMessage title="No bookmarks" description="This document has no table of contents." />;
  }
  return (
    <div className="h-full overflow-y-auto py-1">
      <OutlineTree nodes={state.nodes} depth={0} onSelect={select} />
    </div>
  );
}
```

- [ ] **Step 2: Search types, constants, utils.**

File: `src/modules/search/search.types.ts`
```ts
/**
 * The search module finds text in a document: it scans the pages in the
 * background, reports matches as character ranges of each page's text items,
 * and renders the find bar. Highlighting is done by the viewer.
 */
export interface SearchOptions {
  matchCase: boolean;
  wholeWords: boolean;
}

/** A page's text as one string, and where each text item starts in it. */
export interface PageText {
  text: string;
  itemStarts: number[];
  itemLengths: number[];
}

/** Characters [start, end) of text item `itemIndex`. */
export interface TextRange {
  itemIndex: number;
  start: number;
  end: number;
}

/** One match. `id` is unique across searches (`"<search>:<n>"`). A match can span several items. */
export interface SearchMatch {
  id: string;
  pageNumber: number;
  ranges: TextRange[];
}

export type SearchStatus = "idle" | "searching" | "done" | "error";

export interface SearchResult {
  matches: SearchMatch[];
  /** Index of the selected match, or -1 when there's none. */
  currentIndex: number;
  status: SearchStatus;
  error: string | null;
}

/** Returned by useDocumentSearch. */
export interface DocumentSearch extends SearchResult {
  isOpen: boolean;
  /** Increases every time the find bar is asked to focus its input (e.g. Ctrl+F again). */
  focusRequest: number;
  query: string;
  options: SearchOptions;
  open: () => void;
  close: () => void;
  setQuery: (query: string) => void;
  toggleOption: (option: keyof SearchOptions) => void;
  next: () => void;
  previous: () => void;
}

export interface FindBarProps {
  search: DocumentSearch;
}
```

File: `src/modules/search/search.constants.ts`
```ts
import type { SearchOptions, SearchResult } from "./search.types";

/** Wait this long after the last keystroke before searching. */
export const SEARCH_DEBOUNCE_MS = 250;

/** While scanning, matches are handed to React at most this often (one render per page would be too many). */
export const FLUSH_INTERVAL_MS = 100;

export const DEFAULT_SEARCH_OPTIONS: SearchOptions = { matchCase: false, wholeWords: false };

export const EMPTY_SEARCH_RESULT: SearchResult = { matches: [], currentIndex: -1, status: "idle", error: null };
```

File: `src/modules/search/search.utils.ts`
```ts
/** Search rules as pure functions: building page text, matching, mapping matches to text items. */
import type { PdfTextItem } from "@/modules/pdf/pdf.types";
import type { PageText, SearchMatch, SearchOptions, SearchResult, TextRange } from "./search.types";

/** Letters, digits and underscore in any script: what "whole words" treats as part of a word. */
const WORD_CHARACTER = /[\p{L}\p{N}_]/u;

/**
 * Joins a page's text items into one searchable string. An item that ends a line
 * adds a space, so the last word of a line and the first of the next don't merge.
 */
export function buildPageText(items: readonly PdfTextItem[]): PageText {
  let text = "";
  const itemStarts: number[] = [];
  const itemLengths: number[] = [];
  for (const item of items) {
    itemStarts.push(text.length);
    itemLengths.push(item.str.length);
    text += item.str;
    if (item.hasEOL) text += " ";
  }
  return { text, itemStarts, itemLengths };
}

/**
 * Lowercases one UTF-16 unit at a time, keeping the length unchanged so offsets in
 * the result are offsets in the original (`"İ".toLowerCase()` is 2 characters long).
 */
export function foldCase(text: string): string {
  let folded = "";
  for (let index = 0; index < text.length; index++) {
    const lower = text[index].toLowerCase();
    folded += lower.length === 1 ? lower : text[index];
  }
  return folded;
}

/** Non-overlapping [start, end) offsets of `query` in `text`. */
export function findMatches(text: string, query: string, options: SearchOptions): Array<[number, number]> {
  if (!query) return [];
  const haystack = options.matchCase ? text : foldCase(text);
  const needle = options.matchCase ? query : foldCase(query);
  const matches: Array<[number, number]> = [];

  for (let start = haystack.indexOf(needle); start !== -1; start = haystack.indexOf(needle, start + needle.length)) {
    const end = start + needle.length;
    const isWholeWord = !WORD_CHARACTER.test(haystack[start - 1] ?? "") && !WORD_CHARACTER.test(haystack[end] ?? "");
    if (!options.wholeWords || isWholeWord) matches.push([start, end]);
  }
  return matches;
}

/** Index of the last item starting at or before `offset` (binary search: starts are sorted). */
function itemAt(itemStarts: readonly number[], offset: number): number {
  let low = 0;
  let high = itemStarts.length - 1;
  while (low < high) {
    const middle = Math.ceil((low + high) / 2);
    if (itemStarts[middle] <= offset) low = middle;
    else high = middle - 1;
  }
  return low;
}

/** The character ranges of the text items covered by page offsets [start, end). Separators are skipped. */
export function toTextRanges(page: PageText, start: number, end: number): TextRange[] {
  const ranges: TextRange[] = [];
  for (let index = itemAt(page.itemStarts, start); index < page.itemStarts.length; index++) {
    const itemStart = page.itemStarts[index];
    if (itemStart >= end) break;
    const from = Math.max(start, itemStart) - itemStart;
    const to = Math.min(end, itemStart + page.itemLengths[index]) - itemStart;
    if (to > from) ranges.push({ itemIndex: index, start: from, end: to });
  }
  return ranges;
}

/** Adds a batch of matches; the first match ever found becomes the current one. */
export function appendMatches(result: SearchResult, batch: SearchMatch[]): SearchResult {
  if (batch.length === 0) return result;
  return { ...result, matches: [...result.matches, ...batch], currentIndex: Math.max(result.currentIndex, 0) };
}

/** Moves the current match by `delta`, wrapping around at both ends. */
export function stepMatch(result: SearchResult, delta: number): SearchResult {
  const count = result.matches.length;
  if (count === 0) return result;
  return { ...result, currentIndex: (result.currentIndex + delta + count) % count };
}

/** The find bar's count: "3 of 41", "3 of 41…" while scanning, "No results", "Searching…". */
export function describeResult(result: SearchResult): string {
  const count = result.matches.length;
  if (result.status === "error") return "Search failed";
  if (result.status === "idle") return "";
  if (count === 0) return result.status === "searching" ? "Searching…" : "No results";
  return `${result.currentIndex + 1} of ${count}${result.status === "searching" ? "…" : ""}`;
}
```

- [ ] **Step 3: Search hook.**

File: `src/modules/search/hooks/useDocumentSearch.ts`
```ts
import { useCallback, useEffect, useRef, useState } from "react";
import { getTextItems } from "@/modules/pdf/services/pdf.service";
import type { PdfDocument } from "@/modules/pdf/pdf.types";
import { useDebouncedValue } from "@/shared/hooks/useDebouncedValue";
import { getErrorMessage } from "@/shared/utils/error.utils";
import { DEFAULT_SEARCH_OPTIONS, EMPTY_SEARCH_RESULT, FLUSH_INTERVAL_MS, SEARCH_DEBOUNCE_MS } from "../search.constants";
import { appendMatches, buildPageText, findMatches, stepMatch, toTextRanges } from "../search.utils";
import type { DocumentSearch, PageText, SearchMatch, SearchOptions, SearchResult } from "../search.types";

/**
 * Text search over one document.
 *
 * Pages are scanned in order in the background, so the count grows while it runs
 * ("12 of 41…"); a new query or option cancels the running scan. Each page's text
 * is read once per document and cached, so refining a search doesn't re-read it.
 * On big files the first search reads every page's text from disk; that's fine,
 * since it only happens when the user asks for it.
 */
export function useDocumentSearch(pdf: PdfDocument): DocumentSearch {
  const [isOpen, setOpen] = useState(false);
  const [focusRequest, setFocusRequest] = useState(0);
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState<SearchOptions>(DEFAULT_SEARCH_OPTIONS);
  const [result, setResult] = useState<SearchResult>(EMPTY_SEARCH_RESULT);
  const debouncedQuery = useDebouncedValue(query, SEARCH_DEBOUNCE_MS);
  const pageTexts = useRef(new Map<number, PageText>());
  // Makes match ids unique across searches (the viewer uses them to know when the current match changes).
  const searchCount = useRef(0);

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResult(EMPTY_SEARCH_RESULT);
      return;
    }
    let cancelled = false;
    const searchId = ++searchCount.current;
    setResult({ ...EMPTY_SEARCH_RESULT, status: "searching" });

    const readPage = async (pageNumber: number): Promise<PageText> => {
      const cached = pageTexts.current.get(pageNumber);
      if (cached) return cached;
      const page = buildPageText(await getTextItems(pdf, pageNumber));
      pageTexts.current.set(pageNumber, page);
      return page;
    };

    const scan = async () => {
      let found = 0;
      let pending: SearchMatch[] = [];
      let lastFlush = performance.now();
      const flush = () => {
        const batch = pending;
        pending = [];
        lastFlush = performance.now();
        setResult((current) => appendMatches(current, batch));
      };

      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
        const page = await readPage(pageNumber);
        // Checked after every await: the query may have changed meanwhile.
        if (cancelled) return;
        for (const [start, end] of findMatches(page.text, debouncedQuery, options)) {
          pending.push({ id: `${searchId}:${found++}`, pageNumber, ranges: toTextRanges(page, start, end) });
        }
        if (pending.length > 0 && performance.now() - lastFlush > FLUSH_INTERVAL_MS) flush();
      }
      flush();
      setResult((current) => ({ ...current, status: "done" }));
    };

    scan().catch((error) => {
      if (!cancelled) setResult((current) => ({ ...current, status: "error", error: getErrorMessage(error) }));
    });
    return () => {
      cancelled = true;
    };
  }, [pdf, debouncedQuery, options]);

  const open = useCallback(() => {
    setOpen(true);
    setFocusRequest((count) => count + 1);
  }, []);
  const close = useCallback(() => setOpen(false), []);
  const toggleOption = useCallback(
    (option: keyof SearchOptions) => setOptions((current) => ({ ...current, [option]: !current[option] })),
    [],
  );
  const next = useCallback(() => setResult((current) => stepMatch(current, 1)), []);
  const previous = useCallback(() => setResult((current) => stepMatch(current, -1)), []);

  return { ...result, isOpen, focusRequest, query, options, open, close, setQuery, toggleOption, next, previous };
}
```

- [ ] **Step 4: Find bar.**

File: `src/modules/search/components/FindBar.tsx`
```tsx
import { useEffect, useRef, type KeyboardEvent } from "react";
import { LuCaseSensitive, LuChevronDown, LuChevronUp, LuSearch, LuWholeWord, LuX } from "react-icons/lu";
import { IconButton } from "@/shared/ui/IconButton";
import { cn } from "@/shared/utils/class-names.utils";
import { describeResult } from "../search.utils";
import type { FindBarProps } from "../search.types";

/**
 * Row under the document toolbar: search input with the match count, previous /
 * next, Match case, Whole words, close. Enter = next, Shift+Enter = previous,
 * Escape closes. These keys are handled on the input itself: they only mean
 * something while typing in it.
 */
export function FindBar({ search }: FindBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus (and select, to type a new query right away) on open and on every Ctrl+F.
  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, [search.focusRequest]);

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      if (event.shiftKey) search.previous();
      else search.next();
    } else if (event.key === "Escape") {
      event.preventDefault();
      search.close();
    }
  };

  const hasMatches = search.matches.length > 0;
  const toggleClass = (pressed: boolean) => cn(pressed && "bg-hover text-accent hover:text-accent");

  return (
    <div role="search" className="flex h-10 shrink-0 items-center gap-1 border-b border-border bg-surface px-2">
      <div className="flex h-7 min-w-0 flex-1 items-center gap-2 border border-border px-2 focus-within:border-accent md:max-w-sm">
        <LuSearch className="size-3.5 shrink-0 text-subtle" />
        <input
          ref={inputRef}
          value={search.query}
          onChange={(event) => search.setQuery(event.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Search text"
          aria-label="Search text"
          spellCheck={false}
          className="min-w-0 flex-1 bg-transparent text-ink outline-none placeholder:text-subtle"
        />
        <span className="shrink-0 text-xs tabular-nums text-muted" title={search.error ?? undefined}>
          {describeResult(search)}
        </span>
      </div>
      <IconButton icon={LuChevronUp} label="Previous result (Shift+Enter)" disabled={!hasMatches} onClick={search.previous} />
      <IconButton icon={LuChevronDown} label="Next result (Enter)" disabled={!hasMatches} onClick={search.next} />
      <span className="mx-1 h-4 w-px bg-border" />
      <IconButton
        icon={LuCaseSensitive}
        label="Match case"
        aria-pressed={search.options.matchCase}
        className={toggleClass(search.options.matchCase)}
        onClick={() => search.toggleOption("matchCase")}
      />
      <IconButton
        icon={LuWholeWord}
        label="Whole words"
        aria-pressed={search.options.wholeWords}
        className={toggleClass(search.options.wholeWords)}
        onClick={() => search.toggleOption("wholeWords")}
      />
      <span className="hidden flex-1 md:block" />
      <IconButton icon={LuX} label="Close search (Esc)" onClick={search.close} />
    </div>
  );
}
```

- [ ] **Step 5: Verify.** `pnpm exec tsc --noEmit` — no errors in `src/modules/outline/` or `src/modules/search/`. Manual (Review Focus 2, after Task 7): in a 300+ page PDF type "the", then quickly "thermal"; the count must restart, and no "the"-only highlights may remain on screen.

---

### Task 7: app layer — Workspace composition, shortcuts, menus; docs

**Files:**
- Modify: `src/app/app.constants.ts`, `src/app/app.types.ts`
- Create: `src/app/app.utils.ts`, `src/app/app.menus.ts`
- Create: `src/app/components/DocumentWorkspace.tsx`, `src/app/components/Workspace.tsx`
- Modify: `src/app/components/TabContent.tsx`
- Modify: `CLAUDE.md`

**Interfaces:**
- Consumes: everything above.
- Produces: `DocumentWorkspace({ document, isActive })` lazy-loaded by TabContent.

- [ ] **Step 1: Constants and types.**

Append to `src/app/app.constants.ts` (and import `DocumentShortcuts` from `./app.types`):
```ts

/** Document shortcuts (active document tab only); also shown in the toolbar hints. */
export const DOCUMENT_SHORTCUTS: DocumentShortcuts = {
  find: { key: "f", mod: true },
  print: { key: "p", mod: true },
};

/** Same breakpoint as Tailwind's `md`: below it the document workspace uses the phone layout. */
export const WIDE_LAYOUT_QUERY = "(min-width: 48rem)";
```

Append to `src/app/app.types.ts` (and add the imports `OpenedDocument` from `@/modules/document/document.types`, `PageSize, PdfDocument` from `@/modules/pdf/pdf.types`, `ViewerTool` from `@/modules/viewer/viewer.types`):
```ts

export interface DocumentShortcuts {
  find: KeyboardShortcut;
  print: KeyboardShortcut;
}

/** A document tab's content: loads the PDF, then shows the workspace. */
export interface DocumentWorkspaceProps {
  document: OpenedDocument;
  isActive: boolean;
}

/** The loaded document's workspace (toolbar, rails, pages, panels). */
export interface WorkspaceProps {
  document: OpenedDocument;
  pdf: PdfDocument;
  defaultPageSize: PageSize;
  isActive: boolean;
}

/** What the document's ⋯ menu can do. */
export interface DocumentMenuOptions {
  path: string;
  /** Wide screens show the tools in the rail; phones get them in this menu. */
  isWide: boolean;
  tool: ViewerTool;
  onToolChange: (tool: ViewerTool) => void;
  onRotateLeft: () => void;
  onRotateRight: () => void;
  onProperties: () => void;
  onReveal: (path: string) => void;
  onOpenWith: (path: string) => void;
}
```

- [ ] **Step 2: Utils and menu.**

File: `src/app/app.utils.ts`
```ts
/** Pure helpers of the app shell: data handed from one module to another. */
import type { SearchMatch } from "@/modules/search/search.types";
import type { HighlightsByPage, PageHighlight } from "@/modules/viewer/viewer.types";

/** Search matches (search module) → highlights per page (viewer module). */
export function groupHighlights(matches: readonly SearchMatch[], currentIndex: number): HighlightsByPage {
  const byPage = new Map<number, PageHighlight[]>();
  matches.forEach((match, index) => {
    const list = byPage.get(match.pageNumber) ?? [];
    list.push({ id: match.id, ranges: match.ranges, current: index === currentIndex });
    byPage.set(match.pageNumber, list);
  });
  return byPage;
}
```

File: `src/app/app.menus.ts`
```ts
import { LuAppWindow, LuFolderSearch, LuHand, LuInfo, LuRotateCcw, LuRotateCw, LuTextCursor } from "react-icons/lu";
import { separator } from "@/modules/menu/menu.utils";
import type { MenuEntry } from "@/modules/menu/menu.types";
import { isDesktop } from "@/shared/utils/platform.utils";
import type { DocumentMenuOptions } from "./app.types";

/**
 * The document toolbar's ⋯ menu:
 *   [Select · Hand │ phones only] Rotate left · Rotate right │ Document properties
 *   │ Show in file manager · Open with… (desktop only)
 * Built here because it mixes viewer actions with OS actions from the system module.
 */
export function buildDocumentMenu(options: DocumentMenuOptions): MenuEntry[] {
  const { path, tool } = options;
  const tools: MenuEntry[] = options.isWide
    ? []
    : [
        {
          id: "tool-select",
          label: "Select text",
          icon: LuTextCursor,
          checked: tool === "select",
          onSelect: () => options.onToolChange("select"),
        },
        {
          id: "tool-hand",
          label: "Hand tool",
          icon: LuHand,
          checked: tool === "hand",
          onSelect: () => options.onToolChange("hand"),
        },
        separator("tools"),
      ];
  const system: MenuEntry[] = isDesktop
    ? [
        separator("system"),
        { id: "reveal", label: "Show in file manager", icon: LuFolderSearch, onSelect: () => options.onReveal(path) },
        { id: "open-with", label: "Open with…", icon: LuAppWindow, onSelect: () => options.onOpenWith(path) },
      ]
    : [];

  return [
    ...tools,
    { id: "rotate-left", label: "Rotate left", icon: LuRotateCcw, onSelect: options.onRotateLeft },
    { id: "rotate-right", label: "Rotate right", icon: LuRotateCw, onSelect: options.onRotateRight },
    separator("view"),
    { id: "properties", label: "Document properties", icon: LuInfo, onSelect: options.onProperties },
    ...system,
  ];
}
```

- [ ] **Step 3: Workspace components.**

File: `src/app/components/DocumentWorkspace.tsx`
```tsx
import { ViewerMessage } from "@/modules/viewer/components/ViewerMessage";
import { usePdfDocument } from "@/modules/viewer/hooks/usePdfDocument";
import { Workspace } from "./Workspace";
import type { DocumentWorkspaceProps } from "../app.types";

/**
 * A document tab: loads the PDF, then shows the workspace.
 * Split from Workspace on purpose: Workspace only mounts once the PDF is ready,
 * so its hooks never have to handle a "no document yet" case.
 */
export function DocumentWorkspace({ document, isActive }: DocumentWorkspaceProps) {
  const state = usePdfDocument(document.path);

  if (state.status === "loading") return <ViewerMessage title="Loading document…" />;
  if (state.status === "error") {
    return <ViewerMessage title="This PDF could not be opened" description={state.error} />;
  }
  return (
    <Workspace document={document} pdf={state.pdf} defaultPageSize={state.defaultPageSize} isActive={isActive} />
  );
}
```

File: `src/app/components/Workspace.tsx`
```tsx
import { useCallback, useEffect, useMemo, useState } from "react";
import { OutlinePanel } from "@/modules/outline/components/OutlinePanel";
import type { PageTarget } from "@/modules/pdf/pdf.types";
import { FindBar } from "@/modules/search/components/FindBar";
import { useDocumentSearch } from "@/modules/search/hooks/useDocumentSearch";
import { useSystemActions } from "@/modules/system/hooks/useSystemActions";
import { ThumbnailsPanel } from "@/modules/thumbnails/components/ThumbnailsPanel";
import { DocToolbar } from "@/modules/viewer/components/DocToolbar";
import { DocumentPropertiesDialog } from "@/modules/viewer/components/DocumentPropertiesDialog";
import { NoticeBar } from "@/modules/viewer/components/NoticeBar";
import { PanelRail } from "@/modules/viewer/components/PanelRail";
import { SidePanel } from "@/modules/viewer/components/SidePanel";
import { ToolsRail } from "@/modules/viewer/components/ToolsRail";
import { ViewerPages } from "@/modules/viewer/components/ViewerPages";
import { useViewerState } from "@/modules/viewer/hooks/useViewerState";
import type { HighlightsByPage, SidePanelId } from "@/modules/viewer/viewer.types";
import { useMediaQuery } from "@/shared/hooks/useMediaQuery";
import { useKeyboardShortcuts } from "@/shared/keyboard/useKeyboardShortcuts";
import { DOCUMENT_SHORTCUTS, WIDE_LAYOUT_QUERY } from "../app.constants";
import { buildDocumentMenu } from "../app.menus";
import { groupHighlights } from "../app.utils";
import type { WorkspaceProps } from "../app.types";

const NO_HIGHLIGHTS: HighlightsByPage = new Map();

/**
 * One document's workspace (Acrobat-style): toolbar, find bar, tools rail, pages,
 * side panel and panel rail. Lives in the app layer because it connects modules
 * that don't know about each other: search results become viewer highlights, and
 * thumbnails / bookmarks drive the viewer's navigation.
 */
export function Workspace({ document, pdf, defaultPageSize, isActive }: WorkspaceProps) {
  const viewer = useViewerState({ pdf, defaultPageSize, isActive });
  const search = useDocumentSearch(pdf);
  // Per tab, so a print error shows in this document, not on Home.
  const system = useSystemActions();
  const isWide = useMediaQuery(WIDE_LAYOUT_QUERY);
  const [panel, setPanel] = useState<SidePanelId | null>(null);
  const [isPropertiesOpen, setPropertiesOpen] = useState(false);
  const { goToPage, showPage } = viewer.navigation;

  // A new current match: make sure its page is on screen; the page then centers the highlight.
  const currentMatch = search.matches[search.currentIndex];
  useEffect(() => {
    if (search.isOpen && currentMatch) showPage(currentMatch.pageNumber);
  }, [search.isOpen, currentMatch, showPage]);

  const highlights = useMemo(
    () => (search.isOpen ? groupHighlights(search.matches, search.currentIndex) : NO_HIGHLIGHTS),
    [search.isOpen, search.matches, search.currentIndex],
  );

  const { print: printFile } = system;
  const print = useCallback(() => printFile(document.path, document.name), [printFile, document.path, document.name]);
  useKeyboardShortcuts(
    isActive
      ? [
          { shortcut: DOCUMENT_SHORTCUTS.find, handler: search.open },
          { shortcut: DOCUMENT_SHORTCUTS.print, handler: print },
        ]
      : [],
  );

  const togglePanel = useCallback((id: SidePanelId) => setPanel((current) => (current === id ? null : id)), []);
  const closePanel = useCallback(() => setPanel(null), []);
  // On phones the panel covers the pages, so picking a destination also closes it.
  const closePanelOnPhone = useCallback(() => !isWide && setPanel(null), [isWide]);
  const selectPage = useCallback(
    (pageNumber: number) => {
      goToPage(pageNumber);
      closePanelOnPhone();
    },
    [goToPage, closePanelOnPhone],
  );
  const navigateTo = useCallback(
    (target: PageTarget) => {
      goToPage(target.pageNumber, target.topRatio);
      closePanelOnPhone();
    },
    [goToPage, closePanelOnPhone],
  );

  const moreEntries = buildDocumentMenu({
    path: document.path,
    isWide,
    tool: viewer.tool,
    onToolChange: viewer.setTool,
    onRotateLeft: viewer.rotation.rotateCounterclockwise,
    onRotateRight: viewer.rotation.rotateClockwise,
    onProperties: () => setPropertiesOpen(true),
    onReveal: system.reveal,
    onOpenWith: system.openWith,
  });

  return (
    <div className="flex h-full flex-col">
      <DocToolbar
        title={document.name}
        zoom={viewer.zoom}
        display={viewer.display}
        onDisplayChange={viewer.setDisplay}
        onRotate={viewer.rotation.rotateClockwise}
        onSearch={search.open}
        searchShortcut={DOCUMENT_SHORTCUTS.find}
        onPrint={print}
        printShortcut={DOCUMENT_SHORTCUTS.print}
        moreEntries={moreEntries}
      />
      {search.isOpen && <FindBar search={search} />}
      {system.error && <NoticeBar message={system.error} onDismiss={system.clearError} />}

      {/* `relative`: on phones the side panel is positioned over the pages. */}
      <div className="relative flex min-h-0 flex-1">
        <ToolsRail tool={viewer.tool} onToolChange={viewer.setTool} />
        <div className="min-w-0 flex-1 bg-canvas">
          <ViewerPages viewer={viewer} highlights={highlights} />
        </div>
        {panel && (
          <SidePanel panel={panel} onClose={closePanel}>
            {panel === "thumbnails" ? (
              <ThumbnailsPanel
                pdf={pdf}
                pageSizes={viewer.pageSizes.sizes}
                rotation={viewer.rotation.rotation}
                currentPage={viewer.navigation.currentPage}
                isActive={isActive}
                onSelect={selectPage}
              />
            ) : (
              <OutlinePanel pdf={pdf} onNavigate={navigateTo} />
            )}
          </SidePanel>
        )}
        <PanelRail active={panel} onToggle={togglePanel} />
      </div>

      <DocumentPropertiesDialog
        open={isPropertiesOpen}
        onClose={() => setPropertiesOpen(false)}
        pdf={pdf}
        document={document}
        pageSize={defaultPageSize}
      />
    </div>
  );
}
```

File: `src/app/components/TabContent.tsx`
```tsx
import { lazy, Suspense } from "react";
import { HomePage } from "@/modules/home/components/HomePage";
import { ToolsPage } from "@/modules/tools/components/ToolsPage";
import type { TabContentProps } from "../app.types";

// Loaded on first use: the document workspace pulls in pdf.js, most of the bundle,
// which the Home page doesn't need. The app shows sooner, especially on Android.
const DocumentWorkspace = lazy(() =>
  import("./DocumentWorkspace").then((module) => ({ default: module.DocumentWorkspace })),
);

/**
 * Maps a tab to its page. Lives in the app layer because it connects modules
 * (tabs, home, tools, viewer) that don't know about each other.
 */
export function TabContent({ tab, isActive, home }: TabContentProps) {
  switch (tab.kind) {
    case "home":
      return <HomePage {...home} />;
    case "tools":
      return <ToolsPage />;
    case "document":
      return (
        <Suspense>
          <DocumentWorkspace document={tab.document} isActive={isActive} />
        </Suspense>
      );
  }
}
```

- [ ] **Step 4: CLAUDE.md.** Replace the **Viewer** section's last bullets and add a **Workspace** paragraph describing: Workspace composition in `app/components/Workspace.tsx`; `useViewerState`; text layer CSS subset in `index.css`; search module flow (scan → `SearchMatch` → `groupHighlights` → `applyHighlights`); thumbnails/outline modules; print (`print.rs`, XDG Print portal, local `plugins/android-print` crate, fd handed to Kotlin); Acrobat zoom keys (Ctrl+0/1/2); plain-key shortcuts ignored while typing.

- [ ] **Step 5: Full verification.**

Run: `pnpm exec tsc --noEmit` → exit 0.
Run: `pnpm build` → succeeds; the main chunk stays small (workspace + pdf.js in the lazy chunk).
Run: `cd src-tauri && cargo clippy` and the Android clippy from Task 1 → no warnings.
Manual checklist for the user (desktop): toolbar zoom menu (all entries, check marks), Ctrl+0/1/2, rotate (button and ⋯), single page with arrows/PageUp/PageDown, thumbnails click + follows scrolling, bookmarks jump to the exact spot, Ctrl+F search with count, Enter/Shift+Enter, match case, whole words, Esc, select & copy text, hand tool drag, Document properties, Print (Ctrl+P) dialog and cancel, Show in file manager / Open with from ⋯.
Manual (Review Focus 3): in Single page display, search a word that appears on a later page; Enter flips to that page and centers the highlight.
Manual (Review Focus 5, Android): open a PDF via "Open with…" from Files, switch apps and back, print it; open thumbnails, tap a page → panel closes and the page shows.

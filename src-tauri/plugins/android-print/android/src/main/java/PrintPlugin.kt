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

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

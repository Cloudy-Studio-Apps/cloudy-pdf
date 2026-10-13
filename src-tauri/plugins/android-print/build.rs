// Packages the Kotlin project in `android/` with the app (used by Android builds only).
fn main() {
    tauri_plugin::Builder::new(&[]).android_path("android").build();
}

// Entry point for desktop builds; all setup lives in lib.rs so mobile can share it.
// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    cloudy_pdf_lib::run()
}

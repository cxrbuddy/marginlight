use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::{
    fs,
    path::PathBuf,
};
use tauri::{
    image::Image,
    menu::{Menu, MenuItem, PredefinedMenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    AppHandle, Emitter, Manager, PhysicalPosition, PhysicalSize, Position, Size,
};
use walkdir::WalkDir;

#[derive(Debug, Serialize)]
struct MarkdownFile {
    path: String,
    name: String,
    content: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct IslandFrame {
    width_percent: f64,
    height: f64,
}

fn json_path(app: &AppHandle, name: &str) -> Result<PathBuf, String> {
    if !name.ends_with(".json")
        || name.contains('/')
        || name.contains('\\')
        || name.contains("..")
        || name.trim().is_empty()
    {
        return Err("Invalid JSON storage name.".to_string());
    }

    let dir = app
        .path()
        .app_data_dir()
        .map_err(|error| format!("Could not find app data directory: {error}"))?;

    fs::create_dir_all(&dir)
        .map_err(|error| format!("Could not create app data directory: {error}"))?;

    Ok(dir.join(name))
}

#[tauri::command]
fn read_app_json(app: AppHandle, name: String) -> Result<Value, String> {
    let path = json_path(&app, &name)?;

    if !path.exists() {
        return Ok(Value::Null);
    }

    let raw = fs::read_to_string(&path)
        .map_err(|error| format!("Could not read {}: {error}", path.display()))?;

    serde_json::from_str(&raw).map_err(|error| format!("Could not parse {}: {error}", path.display()))
}

#[tauri::command]
fn write_app_json(app: AppHandle, name: String, value: Value) -> Result<(), String> {
    let path = json_path(&app, &name)?;
    let raw = serde_json::to_string_pretty(&value)
        .map_err(|error| format!("Could not serialize {name}: {error}"))?;

    fs::write(&path, raw).map_err(|error| format!("Could not write {}: {error}", path.display()))
}

#[tauri::command]
fn scan_markdown_folder(folder: String) -> Result<Vec<MarkdownFile>, String> {
    let root = PathBuf::from(folder);

    if !root.exists() || !root.is_dir() {
        return Err("The selected Markdown quote folder could not be found.".to_string());
    }

    let mut files = Vec::new();

    for entry in WalkDir::new(&root)
        .follow_links(false)
        .into_iter()
        .filter_map(Result::ok)
    {
        if !entry.file_type().is_file() {
            continue;
        }

        let path = entry.path();
        let is_markdown = path
            .extension()
            .and_then(|extension| extension.to_str())
            .map(|extension| extension.eq_ignore_ascii_case("md"))
            .unwrap_or(false);

        if !is_markdown {
            continue;
        }

        match fs::read_to_string(path) {
            Ok(content) => files.push(MarkdownFile {
                path: path.to_string_lossy().to_string(),
                name: path
                    .file_name()
                    .and_then(|name| name.to_str())
                    .unwrap_or("Untitled.md")
                    .to_string(),
                content,
            }),
            Err(error) => eprintln!("Marginlight skipped {}: {error}", path.display()),
        }
    }

    Ok(files)
}

#[tauri::command]
fn write_export_png(path: String, bytes: Vec<u8>) -> Result<(), String> {
    let destination = PathBuf::from(path);

    if destination
        .extension()
        .and_then(|extension| extension.to_str())
        .map(|extension| !extension.eq_ignore_ascii_case("png"))
        .unwrap_or(true)
    {
        return Err("Quote cards must be saved as PNG files.".to_string());
    }

    fs::write(&destination, bytes)
        .map_err(|error| format!("Could not write {}: {error}", destination.display()))
}

#[tauri::command]
fn position_island(app: AppHandle, frame: IslandFrame) -> Result<(), String> {
    let window = app
        .get_webview_window("island")
        .ok_or_else(|| "Floating island window is not available.".to_string())?;

    let monitor = window
        .current_monitor()
        .map_err(|error| format!("Could not read current monitor: {error}"))?
        .or(app
            .primary_monitor()
            .map_err(|error| format!("Could not read primary monitor: {error}"))?)
        .ok_or_else(|| "No display was found for the floating island.".to_string())?;

    let monitor_size = monitor.size();
    let monitor_position = monitor.position();
    let scale_factor = monitor.scale_factor();
    let width_percent = frame.width_percent.clamp(60.0, 75.0) / 100.0;
    let min_width = (520.0 * scale_factor) as u32;
    let max_width = (1240.0 * scale_factor) as u32;
    let width = ((monitor_size.width as f64 * width_percent) as u32).clamp(min_width, max_width);
    let height = ((frame.height.clamp(96.0, 280.0)) * scale_factor) as u32;
    let x = monitor_position.x + ((monitor_size.width.saturating_sub(width)) / 2) as i32;
    let y = monitor_position.y + (38.0 * scale_factor) as i32;

    window
        .set_size(Size::Physical(PhysicalSize { width, height }))
        .map_err(|error| format!("Could not resize island: {error}"))?;
    window
        .set_position(Position::Physical(PhysicalPosition { x, y }))
        .map_err(|error| format!("Could not position island: {error}"))?;

    Ok(())
}

#[tauri::command]
fn set_always_on_top(app: AppHandle, enabled: bool) -> Result<(), String> {
    let window = app
        .get_webview_window("island")
        .ok_or_else(|| "Floating island window is not available.".to_string())?;

    window
        .set_always_on_top(enabled)
        .map_err(|error| format!("Could not update always-on-top behavior: {error}"))
}

#[tauri::command]
fn set_island_click_through(app: AppHandle, enabled: bool) -> Result<(), String> {
    let window = app
        .get_webview_window("island")
        .ok_or_else(|| "Floating island window is not available.".to_string())?;

    window
        .set_ignore_cursor_events(enabled)
        .map_err(|error| format!("Could not update click-through behavior: {error}"))
}

#[tauri::command]
fn show_settings(app: AppHandle) -> Result<(), String> {
    let window = app
        .get_webview_window("settings")
        .ok_or_else(|| "Settings window is not available.".to_string())?;

    window
        .show()
        .map_err(|error| format!("Could not show settings: {error}"))?;
    window
        .set_focus()
        .map_err(|error| format!("Could not focus settings: {error}"))?;

    Ok(())
}

#[tauri::command]
fn show_island(app: AppHandle) -> Result<(), String> {
    let window = app
        .get_webview_window("island")
        .ok_or_else(|| "Floating island window is not available.".to_string())?;

    window
        .show()
        .map_err(|error| format!("Could not show floating island: {error}"))
}

#[tauri::command]
fn hide_island(app: AppHandle) -> Result<(), String> {
    let window = app
        .get_webview_window("island")
        .ok_or_else(|| "Floating island window is not available.".to_string())?;

    window
        .hide()
        .map_err(|error| format!("Could not hide floating island: {error}"))
}

#[tauri::command]
fn quit_app(app: AppHandle) {
    app.exit(0);
}

fn create_tray(app: &AppHandle) -> tauri::Result<()> {
    let toggle_item = MenuItem::with_id(app, "toggle_island", "Show / hide island", true, None::<&str>)?;
    let today_item = MenuItem::with_id(app, "today_quote", "Today's quote", true, None::<&str>)?;
    let refresh_item = MenuItem::with_id(app, "refresh_quote", "Refresh quote", true, None::<&str>)?;
    let copy_item = MenuItem::with_id(app, "copy_quote", "Copy quote", true, None::<&str>)?;
    let settings_item = MenuItem::with_id(app, "open_settings", "Open settings", true, None::<&str>)?;
    let quit_item = MenuItem::with_id(app, "quit", "Quit Marginlight", true, None::<&str>)?;
    let separator_one = PredefinedMenuItem::separator(app)?;
    let separator_two = PredefinedMenuItem::separator(app)?;

    let menu = Menu::with_items(
        app,
        &[
            &toggle_item,
            &today_item,
            &separator_one,
            &refresh_item,
            &copy_item,
            &settings_item,
            &separator_two,
            &quit_item,
        ],
    )?;

    TrayIconBuilder::with_id("marginlight-tray")
        .tooltip("Marginlight")
        .icon(tray_icon_image())
        .menu(&menu)
        .show_menu_on_left_click(true)
        .on_menu_event(|app, event| match event.id().as_ref() {
            "toggle_island" => {
                let _ = app.emit("marginlight://toggle-island", ());
            }
            "today_quote" => {
                let _ = app.emit("marginlight://show-today", ());
            }
            "refresh_quote" => {
                let _ = app.emit("marginlight://refresh-quote", ());
            }
            "copy_quote" => {
                let _ = app.emit("marginlight://copy-quote", ());
            }
            "open_settings" => {
                let _ = show_settings(app.clone());
            }
            "quit" => app.exit(0),
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                let _ = tray.app_handle().emit("marginlight://show-today", ());
            }
        })
        .build(app)?;

    Ok(())
}

fn tray_icon_image() -> Image<'static> {
    let size = 64_u32;
    let center = size as f32 / 2.0;
    let mut rgba = Vec::with_capacity((size * size * 4) as usize);

    for y in 0..size {
        for x in 0..size {
            let dx = x as f32 + 0.5 - center;
            let dy = y as f32 + 0.5 - center;
            let distance = (dx * dx + dy * dy).sqrt();
            let mut pixel = [0_u8, 0_u8, 0_u8, 0_u8];

            if distance <= 28.0 {
                pixel = [25, 29, 34, 255];
            }

            let vertical = dx.abs() < 2.2 && dy.abs() < 18.0;
            let horizontal = dy.abs() < 2.2 && dx.abs() < 18.0;
            let diagonal_one = (dx.abs() - dy.abs()).abs() < 1.9 && dx.abs() > 7.0 && dx.abs() < 17.0;

            if distance <= 23.0 && (vertical || horizontal || diagonal_one) {
                pixel = [246, 222, 139, 255];
            }

            rgba.extend_from_slice(&pixel);
        }
    }

    Image::new_owned(rgba, size, size)
}

fn show_onboarding_if_needed(app: &AppHandle) -> Result<(), String> {
    let settings_path = json_path(app, "settings.json")?;
    if settings_path.exists() {
        return Ok(());
    }

    if let Some(settings) = app.get_webview_window("settings") {
        settings
            .show()
            .map_err(|error| format!("Could not show first-launch setup: {error}"))?;
        settings
            .set_focus()
            .map_err(|error| format!("Could not focus first-launch setup: {error}"))?;
    }

    Ok(())
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            Some(vec![]),
        ))
        .invoke_handler(tauri::generate_handler![
            read_app_json,
            write_app_json,
            scan_markdown_folder,
            write_export_png,
            position_island,
            set_always_on_top,
            set_island_click_through,
            show_settings,
            show_island,
            hide_island,
            quit_app
        ])
        .setup(|app| {
            let handle = app.handle().clone();
            create_tray(&handle)?;
            if let Err(error) = position_island(
                handle.clone(),
                IslandFrame {
                    width_percent: 68.0,
                    height: 126.0,
                },
            ) {
                eprintln!("Marginlight could not position the island on launch: {error}");
            }

            if let Some(island) = handle.get_webview_window("island") {
                if let Err(error) = island.set_ignore_cursor_events(true) {
                    eprintln!("Marginlight could not enable click-through on launch: {error}");
                }
            }

            if let Err(error) = show_onboarding_if_needed(&handle) {
                eprintln!("Marginlight could not show first-launch setup: {error}");
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running Marginlight");
}

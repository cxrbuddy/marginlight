# Marginlight

Marginlight is your MacBook's daily wisdom island.

It shows one meaningful quote per day in a small floating capsule near the top of your screen. It is not a notes app, not a quote library, and not a distracting widget. It is a calm, always-present reflection layer for readers, writers, students, founders, and creators.

Your quotes stay on your Mac. No account. No cloud. Marginlight works offline.

## Download Marginlight

The easiest public-download path is the GitHub Releases page for this project.

1. Open the latest release.
2. Download the signed and notarized `.dmg` file.
3. Open the `.dmg`, drag Marginlight to Applications, then launch it.

If macOS asks for confirmation because the app came from the internet, choose **Open**. Your quotes still stay on your Mac.

## What You Get

- A beautiful floating quote island above your normal Mac apps
- One stable quote per calendar day
- Built-in public-domain quote collection
- Optional personal Markdown quote folder
- Built-in, custom-only, or mixed quote mode
- Hover controls for copy, favorite, refresh, settings, export, and hide
- Menu bar controls
- Square PNG quote-card export for X, Instagram, LinkedIn, or notes

## Run It Locally

You need three things installed on your Mac:

1. Node.js
2. Rust
3. Xcode Command Line Tools

Open Terminal in the Marginlight folder, then run:

```bash
npm install
npm run dev
```

The floating island appears near the top center of your screen. On first launch, Marginlight also opens a small setup window.

If Rust is missing, install it from [rustup.rs](https://rustup.rs/), then reopen Terminal and run the commands again.

## Start With Built-In Quotes

On the welcome screen, choose **Start with built-in quotes**.

Marginlight ships with more than 100 built-in quotes from older public-domain authors and works. These are enough to use the app immediately without adding files.

## Add Personal Markdown Quote Files

On the welcome screen or in Settings, choose **Choose Markdown Quotes Folder**.

Marginlight scans `.md` files in that folder. You can use simple formats like this:

```md
# Atomic Habits
Author: James Clear

> You do not rise to the level of your goals. You fall to the level of your systems.

Tags: habits, productivity, identity

---

> Every action you take is a vote for the type of person you wish to become.

Tags: identity, habits
```

This also works:

```md
Book: Deep Work
Author: Cal Newport

Quote:
The ability to perform deep work is becoming increasingly rare.

Tags: focus, work, attention
```

If a book title is missing, Marginlight uses the filename. If an author is missing, it shows `Unknown`.

## Switch Quote Modes

Open Settings from the island controls or the menu bar.

Under **Quote Source**, choose:

- **Built-in**: only the included quote collection
- **My Markdown**: only your personal quote folder
- **Mixed**: built-in quotes plus your personal quotes

Use **Rescan quotes** after editing or adding Markdown files.

## Use the Floating Island

- Hover over the island to expand it.
- Single-click to expand or collapse.
- Double-click to copy the current quote.
- Right-click for the context menu.
- Use **Hide for today** when you want a clear screen.
- Use **Refresh today's quote** if today's quote is not the one you want.
- By default, the island lets clicks pass through to the app underneath, so it does not block buttons, tabs, documents, or browser controls. Use the menu bar or Settings for actions, or turn off **Pass clicks through** if you want direct hover controls.

Marginlight keeps the same quote for the whole day. At midnight, it chooses the next quote.

## Copy and Share

Use the hover controls, context menu, Settings window, or menu bar to copy the quote.

**Copy as X post** uses this format:

```text
“{quote}”

— {author}, {book}

#books #reading #quotes
```

Missing author or book details are omitted cleanly.

## Export Quote Images

Choose **Export image** to create a 1080 x 1080 PNG quote card using the current theme. It is designed for X, Instagram, LinkedIn, or sharing with friends.

## Package the App for macOS

After testing locally, run:

```bash
npm run build
```

The packaged Mac app will be created by Tauri inside:

```text
src-tauri/target/release/bundle/
```

For selling or distributing the app, you should also sign and notarize it with an Apple Developer account.

For the full public-release flow, see [DISTRIBUTION.md](DISTRIBUTION.md).

## License

Marginlight is released under the MIT License. See [LICENSE](LICENSE).

## Troubleshooting

**The island does not appear**

Open Marginlight from Terminal with `npm run dev`, then open Settings from the menu bar. Make sure **Show island** and **Always on top** are enabled.

**My Markdown quotes are not showing**

Open Settings, confirm the selected folder path, and click **Rescan quotes**. Make sure your files end in `.md`.

**The quote is too long**

Marginlight allows long quotes, but the island intentionally stays compact. Hover to expand, or export the quote as an image to see more space.

**Launch at login does not work**

Launch-at-login depends on macOS permissions and the Tauri autostart plugin. Try turning it off and on again in Settings.

**Build fails because Rust is missing**

Install Rust from [rustup.rs](https://rustup.rs/), then run `npm run build` again.

**The app looks different in development**

The floating behavior is controlled by Tauri. Run `npm run dev`, not only the web preview, when testing the real Mac app behavior.

# Marginlight Distribution

This guide is for sharing Marginlight publicly outside the Mac App Store, for example from an X post, Gumroad, Lemon Squeezy, GitHub Releases, Google Drive, or a landing page.

## What You Need

- Apple Developer account
- Xcode installed
- Developer ID Application certificate in Keychain
- Apple notarization credentials saved in Keychain

Marginlight uses a floating transparent macOS window. This release path is for direct download, not Mac App Store submission.

## 1. Install The Signing Certificate

Open Xcode.

Go to:

```text
Xcode -> Settings -> Accounts
```

Select your Apple Developer account.

Click:

```text
Manage Certificates...
```

Add:

```text
Developer ID Application
```

Then return to Terminal and run:

```bash
npm run release:check
```

If the certificate is installed correctly, the check will show your Developer ID Application identity.

## 2. Create An App-Specific Password

Go to:

```text
https://account.apple.com/account/manage
```

Create an app-specific password for notarization.

You only need this once.

## 3. Store Notarization Credentials

Run:

```bash
npm run release:notary-setup
```

It will ask for:

- Apple ID email
- Apple Developer Team ID
- App-specific password

The password is stored in your Mac Keychain. It is not saved in the project.

## 4. Build, Sign, Notarize, And Staple

Run:

```bash
npm run release:mac
```

When it succeeds, your public DMG will be here:

```text
release/Marginlight_0.1.0_aarch64_notarized.dmg
```

Upload that file wherever you want people to download it.

## 5. Post On X

Upload the notarized DMG to a public download location first. Then post the public link on X.

Example:

```text
I built Marginlight.

A tiny floating wisdom island for MacBook.

One quote per day.
Always above your work.
Private. Offline. Calm.

Download for Mac:
[your public link]
```

## Troubleshooting

If `release:check` says no Developer ID Application certificate was found, install it from Xcode first.

If notarization fails, run:

```bash
xcrun notarytool history --keychain-profile MarginlightNotaryProfile
```

If the app opens locally but users see a warning, make sure you are sharing the notarized DMG from:

```text
release/Marginlight_0.1.0_aarch64_notarized.dmg
```

# MigraineEase

A migraine tracker. All data stays on your device; there is no account and no server.

## iPhone (and any browser)

Open https://wild-cs.github.io/migraineease/ in Safari, then choose Share → Add to Home Screen.

## Android

Download `MigraineEase.apk` from the [latest release](https://github.com/wild-cs/migraineease/releases/latest) on your phone and open it to install.
Direct link: https://github.com/wild-cs/migraineease/releases/latest/download/MigraineEase.apk

The Android app (`android/`) bundles the same web files from this repo and needs no internet permission.
Every push to `main` builds the APK, tests it on an Android 15 emulator and publishes a new release
(see `.github/workflows/android.yml`).

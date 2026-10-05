# Mobile Fastlane Framework

A config-driven Fastlane setup for React Native / native mobile apps. It covers:

- **Android:** build and distribute through **Firebase App Distribution**, with optional **Firebase App Testing Agent** (AI) tests.
- **iOS:** build a signed IPA and upload it to **TestFlight**, signing with an App Store Connect API key or `match`.
- **Reports:** a Microsoft Teams Adaptive Card and an e-mail test report after every run.
- **Environments:** `development`, `staging`, `uat` and `production`. Production has a safety guard.
- **CI:** ready-to-use GitHub Actions workflows.

You don't edit the `Fastfile`. Everything project-specific lives in `fastlane/config/*.yml` and `.env`.

---

## What's inside

```
.github/workflows/       GitHub Actions: android-distribution.yml, ios-distribution.yml
docs/                    SETUP.md (detailed setup), FAQ.md
fastlane/
  Fastfile               Lanes (do not edit)
  config/
    environments.yml     App identity, Gradle tasks, iOS scheme, Firebase app IDs per environment
    testing.yml          App Testing Agent devices, blocking mode, e-mail report
    test_case_ids.yml    Firebase App Testing Agent test case IDs
  lib/                   Helpers (config, notifications, e-mail, test parsing, ...)
  FRAMEWORK.md           Full reference documentation
.env.example             Every environment variable the framework reads
.ruby-version            Ruby 3.4.1
Gemfile / Gemfile.lock   fastlane + Firebase App Distribution plugin
```

---

## Quick start

### 1. Copy the framework into your app

Run these from your **mobile project's root folder** (the one with `android/` and `ios/`).

**macOS / Linux**
```sh
git clone --depth 1 https://github.com/Sujay-Dynamisch/Mobile-Fastlane-Framework.git .fastlane-framework
cp -R .fastlane-framework/{fastlane,.github,docs,.env.example,.ruby-version,Gemfile,Gemfile.lock} .
rm -rf .fastlane-framework
```

**Windows (PowerShell)**
```powershell
git clone --depth 1 https://github.com/Sujay-Dynamisch/Mobile-Fastlane-Framework.git .fastlane-framework
"fastlane",".github","docs",".env.example",".ruby-version","Gemfile","Gemfile.lock" | ForEach-Object { Copy-Item ".fastlane-framework\$_" . -Recurse -Force }
Remove-Item .fastlane-framework -Recurse -Force
```

> React Native projects already ship a `Gemfile`. The one here is a superset of the default React Native Gemfile (CocoaPods pins plus fastlane), so you can replace it safely. If you've customised yours, merge in the `fastlane` gem, the `Pluginfile` block and the Ruby 3.4 stdlib gems.

### 2. Install Ruby dependencies

You need Ruby 3.4.x (see `.ruby-version`). The Firebase plugin needs Ruby 3.2 or newer.

```sh
gem install bundler
bundle install
```

### 3. Create your `.env`

```sh
cp .env.example .env      # Windows: Copy-Item .env.example .env
```

Fill in the values you need:

| Purpose | Variables |
|---|---|
| Android → Firebase | `FIREBASE_SERVICE_CREDENTIALS_FILE` or `FIREBASE_TOKEN`, `FIREBASE_ANDROID_<ENV>_APP_ID`, `FIREBASE_ANDROID_<ENV>_GROUPS` |
| AI tests (optional) | `FIREBASE_TOKEN` (from `firebase login:ci`), `FIREBASE_TEST_USERNAME`, `FIREBASE_TEST_PASSWORD` |
| iOS → TestFlight | `APPLE_TEAM_ID`, `APP_STORE_CONNECT_KEY_ID`, `APP_STORE_CONNECT_ISSUER_ID`, `APP_STORE_CONNECT_KEY_FILE` |
| iOS signing via match (optional) | `MATCH_GIT_URL`, `MATCH_GIT_BRANCH`, `MATCH_PASSWORD` |
| Teams report | `TEAMS_WEBHOOK_URL` (Teams **Workflows** webhook) |
| E-mail report | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`, `SMTP_FROM`, `TEST_ALERT_EMAIL_RECIPIENTS` |

### 4. Point the config at your app

Edit `fastlane/config/environments.yml` and replace the `MyApp` placeholders:

- `project.name`, `project.identifier`, `project.organization`
- Android: `use_flavors`, `gradle_task`, `artifact.glob` per environment. No flavors? Use `assembleRelease`.
- iOS: `workspace` (`ios/<YourApp>.xcworkspace`), `scheme` (it must be **Shared** in Xcode), `bundle_identifier`

If you use the App Testing Agent, also edit `fastlane/config/test_case_ids.yml` and `fastlane/config/testing.yml`.

### 5. Keep secrets out of git

Add these lines to your app's `.gitignore`:

```gitignore
.env
fastlane/report.xml
fastlane/firebase-service-account*.json
*.p8
dist/
```

### 6. Validate, then ship

```sh
bundle exec fastlane android doctor                          # check config and credentials
bundle exec fastlane android distribute environment:development

bundle exec fastlane ios doctor                              # macOS + Xcode only
bundle exec fastlane ios distribute environment:development
```

Shortcut lanes: `fastlane android development|staging|uat|production` and the same set for `ios`.

---

## CI (GitHub Actions)

The workflows in `.github/workflows/` run the same lanes. Add the variables from `.env.example` as **repository secrets**. Upload file-based secrets, such as the service-account JSON and the `.p8` key, as base64 secrets, as described in the workflow files and `fastlane/FRAMEWORK.md` § CI/CD.

---

## Documentation

- [docs/SETUP.md](docs/SETUP.md): step-by-step setup for Android (with and without flavors), Firebase and iOS
- [fastlane/FRAMEWORK.md](fastlane/FRAMEWORK.md): full reference covering configuration, lanes, App Testing Agent, notifications and troubleshooting
- [docs/FAQ.md](docs/FAQ.md): common questions

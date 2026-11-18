---
name: fastlane-setup
description: Set up the Mobile Distribution Framework (Fastlane) in a React Native or native Android/iOS project in one go - copy the framework, install gems, generate fastlane/config/*.yml from the real Gradle/Xcode project, prepare .env, run doctor, and finish with a numbered list of the manual steps only a human can do (Firebase console, Apple keys, tokens, CI secrets). Use when the user asks to add, install, set up, onboard or configure fastlane / the mobile distribution framework / Firebase App Distribution / TestFlight for an app.
argument-hint: "[android|ios|both] [env1,env2,...] [--ai-tests] [--ci]"
---

# Fastlane setup (Mobile Distribution Framework)

You are setting up the **Mobile Distribution Framework** in the user's app repository, end to end, in one run.
Framework source: https://github.com/Sujay-Dynamisch/Mobile-Fastlane-Framework (branch `main`).
Documentation: https://github.com/Sujay-Dynamisch/Mobile-Fastlane-Framework (see `fastlane/FRAMEWORK.md` after copying).

The goal: when you finish, the only things left are steps that **need a human** (console clicks, browser logins,
secrets, Apple/Google account actions). You finish with a numbered, step-by-step list of exactly those steps.

## Arguments

`$ARGUMENTS` may contain, in any order:

| Argument | Meaning | Default |
|---|---|---|
| `android`, `ios`, `both` | Platforms to configure | Every platform folder that exists (`android/`, `ios/`). iOS is only *enabled* on macOS. |
| `env1,env2,...` | Environment names | `development,staging,uat,production` |
| `--ai-tests` | Keep the Firebase App Testing agent (AI tests) enabled | Disabled until test case IDs exist |
| `--ci` | Also prepare GitHub Actions (workflows + secrets list, `gh secret set` if allowed) | Workflows copied, secrets only listed |

If nothing is passed, use the defaults and say which ones you used. Do not stop to ask questions you can answer
from the repository. Ask only when a choice is genuinely the user's (for example overwriting an existing `fastlane/`).

## Ground rules

1. **Never invent, print or commit secrets.** Do not echo `.env` values, tokens, `.p8` contents or service-account JSON.
   When you mention a secret, name the variable, never the value.
2. **Never run interactive lanes** (`fastlane init_project`, `fastlane setup`, `firebase login`, `firebase login:ci`):
   your shell cannot answer their prompts and they will hang. You produce what `init_project` would produce yourself.
3. **Never upload.** Do not run `distribute`, `firebase`, `development`/`staging`/`uat`/`production` lanes or the
   GitHub workflows unless the user explicitly asks. `doctor`, `info` and (if asked) `build` are safe.
4. **Don't overwrite user files silently.** If `fastlane/`, `Gemfile`, `.env` or workflows already exist, merge;
   if a merge is not obvious, ask once.
5. **Always use `bundle exec fastlane …`**, never plain `fastlane`.
6. Work from the **repository root** (the folder with `package.json` / `android/` / `ios/`).
7. Keep a running list of **manual steps** (see the catalog at the end) while you work: add a step whenever you hit
   something only the user can do, and remove it if you manage to do it yourself.

## Step 1 - Inspect the project and the machine

Detect, without changing anything:

- OS (`uname` / `$env:OS`), shell, whether this is a git repo, current branch, uncommitted changes
  (warn if the tree is dirty: the setup touches many files).
- Project shape: `package.json` (React Native / Expo version), `app.json`, `android/app/build.gradle(.kts)`,
  `ios/*.xcworkspace`, `ios/*.xcodeproj`, `ios/Podfile`, `android/app/google-services.json`,
  `ios/**/GoogleService-Info.plist`. Expo managed project without `android/`/`ios/` -> tell the user to run
  `npx expo prebuild` first (manual step) and continue with what exists.
- Tools and versions: `ruby -v` (3.4.x recommended), `bundle -v`, `git --version`, `java -version` (17),
  `node -v`, `npm -v`, `firebase --version`, `gh --version`; on macOS also `xcodebuild -version`, `pod --version`.
- Logged-in CLIs (read-only checks): `firebase login:list`, `gh auth status`.

Print a short table: tool, found version, OK / missing. Missing **Ruby/Bundler** blocks everything after step 2:
add the install as manual step and stop after step 3 with the report. Missing Java/Xcode only blocks that platform's `doctor`.
You may offer to run `npm i -g firebase-tools` or `gem install bundler`; do not install system packages
(Ruby, JDK, Xcode, Homebrew) yourself.

## Step 2 - Copy the framework

Clone into a temporary folder **outside** the project, then copy:

```bash
git clone --depth 1 https://github.com/Sujay-Dynamisch/Mobile-Fastlane-Framework.git "$TMPDIR/fastlane-framework"
```

| Source | Destination | Rule |
|---|---|---|
| `fastlane/` | `fastlane/` | Copy everything. Never copy `firebase-service-account*.json`, `*.p8`, `report.xml`. If `fastlane/` exists, keep the user's `Fastfile` customisations: ask before replacing it. |
| `Gemfile` | `Gemfile` | If the project has no Gemfile, copy it. If it has one (React Native ships one with `cocoapods`, `activesupport`, `xcodeproj`), **keep those lines** and add: `gem "fastlane", "2.240.1"`, the `eval_gemfile` Pluginfile block, and the Ruby 3.4 default-gem lines (`bigdecimal`, `logger`, `benchmark`, `mutex_m`, `nkf`, `net-smtp`, `fiddle`) if missing. Do not copy `Gemfile.lock` over an existing one. |
| `fastlane/Pluginfile` | same | Must contain `gem "fastlane-plugin-firebase_app_distribution", "1.0.0"`. |
| `.env.example` | `.env.example` | Copy; if one exists, append missing keys only. |
| `.ruby-version` | `.ruby-version` | Only if missing. |
| `.github/workflows/android-distribution.yml`, `ios-distribution.yml` | same | Only for the platforms being set up; never overwrite an existing workflow with the same name without asking. |

Delete the temporary clone afterwards. Do **not** run `fastlane init`.

## Step 3 - .gitignore

Append any missing entries (keep existing ones, keep order, one block with a comment header):

```gitignore
# Mobile Distribution Framework
.env
.env.*
!.env.example
dist/
vendor/bundle/
fastlane/report.xml
fastlane/test_output
fastlane/screenshots
fastlane/Preview.html
fastlane/.setup_state.yml
firebase-service-account*.json
service-account*.json
*.p8
fastlane/match
```

Then check that nothing secret is already tracked: `git ls-files | grep -Ei '\.env$|service-account.*\.json|\.p8$'`.
If something is tracked, **do not rewrite history** - tell the user (manual step: rotate that secret, then `git rm --cached`).

## Step 4 - Install gems and verify

```bash
bundle config set --local path vendor/bundle
bundle install
bundle exec fastlane --version                       # expect fastlane 2.240.1
bundle exec fastlane action firebase_app_distribution # expect the parameter table, not "Could not find action"
```

Typical fixes you can apply yourself: Ruby 3.4 `LoadError` for `bigdecimal`/`logger`/`mutex_m`/... -> add the gem to the
Gemfile; Windows `ffi`/native-extension errors -> confirm the RubyInstaller DevKit is present (`ridk version`; if not,
manual step). Re-run until both checks pass.

## Step 5 - Generate `fastlane/config/environments.yml`

Produce the same structure `fastlane init_project` writes (see `fastlane/lib/project_bootstrap.rb` in the copied
framework - read it, it is the source of truth for keys and defaults). Detect values instead of asking:

**Project**
- `project.name`: `app.json` `displayName`/`name` -> `android/app/src/main/res/values/strings.xml` `app_name` -> `package.json` `name`.
- `project.identifier`: lower-case name without spaces. `organization`: from git remote owner or leave `"Your Company"`.
- `project.default_environment`: first environment.

**Android** (if `android/` exists and Android is selected)
- Read `android/app/build.gradle` or `build.gradle.kts`: `applicationId`, `productFlavors { … }`, `buildTypes { … }`.
- For each environment pick the flavor whose name matches (case-insensitive, or same first 3 letters: `dev`->`development`,
  `prod`->`production`, `stg`/`staging`, `qa`/`uat`). No flavors -> no-flavor mode.
- Derive the exact Gradle task and output glob:

  | Flavor | Artifact | `gradle_task` | `artifact.glob` |
  |---|---|---|---|
  | none | APK | `assembleRelease` | `android/app/build/outputs/apk/release/*.apk` |
  | none | AAB | `bundleRelease` | `android/app/build/outputs/bundle/release/*.aab` |
  | `<flavor>` | APK | `assemble<Flavor>Release` | `android/app/build/outputs/apk/<flavor>/release/*.apk` |
  | `<flavor>` | AAB | `bundle<Flavor>Release` | `android/app/build/outputs/bundle/<flavor>Release/*.aab` |

  Use APK for every non-production environment (Firebase testers install APKs) and AAB for production.
  With multiple flavor dimensions, combine them in declaration order (e.g. `assembleClientADevRelease`) and
  confirm the task exists with `./gradlew tasks --all` (Windows: `gradlew.bat`) if Java is available.
- `use_flavors: true` when flavors exist.
- Firebase per environment: `enabled: true`, `app_id: "${FIREBASE_ANDROID_<KEY>_APP_ID}"`,
  `groups: "${FIREBASE_ANDROID_<KEY>_GROUPS}"`, `testers: ""`, where `<KEY>` is the upper-case environment name with
  `DEVELOPMENT`->`DEV` and `PRODUCTION`->`PROD`.
- `app_testing.enabled`: `true` only with `--ai-tests`, otherwise `false` (add the AI-tests manual steps as optional).

**iOS** (if `ios/` exists and iOS is selected)
- `enabled: true` only on macOS; on Windows/Linux write the section with `enabled: false` and add
  "enable iOS on a Mac" as a manual step.
- `workspace`: `ios/<Name>.xcworkspace` (it appears after `pod install`; derive from the `.xcodeproj` name if absent).
- `scheme`: from `ios/<Name>.xcodeproj/xcshareddata/xcschemes/*.xcscheme`. No shared scheme -> use the project name
  and add the "make the scheme Shared" manual step.
- `bundle_identifier`: `PRODUCT_BUNDLE_IDENTIFIER` from `project.pbxproj` (Release config of the app target).
- `signing.method: automatic`, `team_id: "${APPLE_TEAM_ID}"` (use `match` only if the user asks or a `Matchfile` with a URL exists).
- Per environment: `export_method: app-store`, `versioning.auto_increment_build_number: true`,
  `testflight.enabled: true`, `groups: []`; Firebase Ad Hoc block with `app_id: "${FIREBASE_IOS_<KEY>_APP_ID}"`,
  `groups: "${FIREBASE_IOS_<KEY>_GROUPS}"`, enabled for every environment except production.

**Global**
- `notifications.teams/slack.enabled: false` unless `TEAMS_WEBHOOK_URL` / `SLACK_WEBHOOK_URL` already exist in `.env`.
- `release_notes: { enabled: true, source: git, commit_count: 10 }` (20 for production).
- Production environment gets `safety: { require_confirmation: true, require_ci: false, allowed_branches: ["main"] }`
  (use the repo's real default branch name).

Rules: never put a secret or a real app ID in YAML - only `${VAR}` placeholders. Keep the explanatory comments from the
framework's template where they still apply. Validate the YAML parses: `ruby -ryaml -e 'YAML.safe_load_file("fastlane/config/environments.yml")'`.

Also:
- `fastlane/config/testing.yml`: set `app_testing.enabled` to match the decision above.
- `fastlane/config/test_case_ids.yml`: leave the template unless the user gave test case IDs.

## Step 6 - Prepare `.env`

1. Make sure `.env.example` contains every `${VAR}` used in the YAML files (append missing keys under
   `# Added by fastlane-setup`), plus `FIREBASE_SERVICE_CREDENTIALS_FILE` when Firebase is used and
   `APP_STORE_CONNECT_KEY_ID/ISSUER_ID/KEY_FILE` when iOS is enabled.
2. If `.env` does not exist, copy `.env.example` to `.env`. Never overwrite an existing `.env`.
3. Fill **only non-secret values you can prove** from the repo:
   - `FIREBASE_ANDROID_<KEY>_APP_ID` from `google-services.json` -> `client[].client_info.mobilesdk_app_id` whose
     `android_client_info.package_name` matches the environment's package (flavors may use suffixed ids).
   - `FIREBASE_IOS_<KEY>_APP_ID` from `GoogleService-Info.plist` `GOOGLE_APP_ID`.
   - If `firebase login:list` shows a logged-in account: `firebase apps:list --project <id>` (project id from
     `google-services.json` `project_info.project_id`) and `firebase appdistribution:groups:list --project <id>` to fill
     app IDs and group aliases. Ask before creating anything in Firebase.
4. Every value still empty is a manual step. List them by name.

## Step 7 - Platform fixes you can make yourself

Make these edits only when the condition is detected; mention each one in the report.

- **iOS `Info.plist`**: if `CFBundleShortVersionString` / `CFBundleVersion` are hard-coded, switch them to
  `$(MARKETING_VERSION)` / `$(CURRENT_PROJECT_VERSION)`. If `ITSAppUsesNonExemptEncryption` is missing, do **not** add it
  silently - it is a legal declaration; add it to the manual list.
- **iOS `Podfile`** when `@react-native-firebase/*` is a dependency: add `$RNFirebaseDisableSPM = true` above the target,
  `pod 'GoogleUtilities', :modular_headers => true` and `pod 'FirebaseCore', :modular_headers => true` inside it, and the
  `IPHONEOS_DEPLOYMENT_TARGET >= 15.0` loop in `post_install` after `react_native_post_install(...)`.
- **Android**: if the release build type signs with the debug keystore, leave it (fine for Firebase testers) and add the
  "release keystore before Google Play" manual step.

## Step 8 - Validate

Run `doctor` for every enabled platform and the first (non-production) environment, then `info`:

```bash
bundle exec fastlane android doctor environment:development
bundle exec fastlane android info   environment:development
bundle exec fastlane ios doctor     environment:development   # macOS only
```

For each failure decide:
- **You can fix it** (wrong Gradle task, wrong glob, missing gem, YAML typo, scheme name) -> fix and re-run.
- **It needs the user** (missing credential, Firebase app not registered, no Apple account) -> add/keep the manual step.

Expected while credentials are missing: doctor reports the missing Firebase app id / groups / credentials. That is fine;
it means the config itself is valid. Run `doctor` for the remaining environments too and summarise them in one line each.

Only if the user asked: `bundle exec fastlane android build environment:development` (local build, no upload).

## Step 9 - CI (only when the platform workflows were copied)

- Verify the workflow files reference the environments you generated.
- Build the list of GitHub **secrets** (names only) and optional **variables** the user must add:
  Android: `FIREBASE_TOKEN` or `FIREBASE_SERVICE_ACCOUNT_JSON`, `FIREBASE_ANDROID_<KEY>_APP_ID`, `FIREBASE_ANDROID_<KEY>_GROUPS`,
  optional `FIREBASE_TEST_USERNAME`, `FIREBASE_TEST_PASSWORD`, `TEAMS_WEBHOOK_URL`, `SMTP_*`.
  iOS: `APP_STORE_CONNECT_KEY_ID`, `APP_STORE_CONNECT_ISSUER_ID`, `APP_STORE_CONNECT_KEY_CONTENT`, `APPLE_TEAM_ID`,
  `FIREBASE_IOS_<KEY>_APP_ID`, `FIREBASE_IOS_<KEY>_GROUPS`, `MATCH_*` (match only).
  Variables: `ANDROID_AUTO_ENVIRONMENT`, `IOS_AUTO_DISTRIBUTE`, `IOS_AUTO_ENVIRONMENT`, `IOS_FIREBASE`, `IOS_TESTFLIGHT`, `VERSION_NAME`.
- With `--ci` and `gh auth status` OK: **ask once** before running `gh secret set NAME < value-source` for values that
  are already in `.env` (never print them). Everything else stays a manual step.

## Step 10 - Final report (always in this format)

```
## Fastlane setup - result

Project: <name> · Platforms: <android/ios> · Environments: <list>

### Done automatically
| # | What | Where |
|---|------|-------|
| 1 | Copied framework (fastlane 2.240.1, firebase plugin 1.0.0) | fastlane/, Gemfile, .env.example |
| … | … | … |

### Validation
| Check | Result |
|-------|--------|
| bundle exec fastlane --version | ✅ 2.240.1 |
| android doctor (development) | ⚠️ waiting for FIREBASE_TOKEN (manual step 3) |

### Manual steps (do these in order)
1. **<Title>** - <why it can't be automated, one line>
   1. <exact click path / command>
   2. <…>
   -> Put the result in `<VARIABLE>` in `.env` (and GitHub secret `<NAME>` for CI).
2. …

### When the manual steps are done
Run: `bundle exec fastlane android doctor environment:development`, then
`bundle exec fastlane setup` (interactive, in your own terminal) or
`bundle exec fastlane android distribute environment:development`.
Tell me "continue fastlane setup" and I will re-run doctor and fix what is left.
```

Only list manual steps that are **still open** for this project, in dependency order, numbered, each with sub-steps,
the console link, and the exact variable/file the result goes into. Mark optional steps with *(optional)*.
Do not list steps you already completed.

When the user later says "continue fastlane setup" (or re-runs this skill), skip steps 2-4 if already done, re-read
`.env` presence (not values), re-run step 8 and re-issue the report with the remaining steps only.

---

## Manual steps catalog

Pick the relevant entries, in this order, and adapt names/environments to the project.

### A. Machine (only if missing)
- **Install Ruby 3.4 + Bundler** - Windows: RubyInstaller 3.4 *with DevKit* (keep "Run ridk install"), then `gem install bundler`.
  macOS: `brew install rbenv ruby-build && rbenv install 3.4.1 && rbenv local 3.4.1 && gem install bundler`.
- **Install JDK 17 + Android SDK** (Android Studio) and set `JAVA_HOME` / `ANDROID_HOME`.
- **macOS only for iOS** - Xcode from the App Store, `xcode-select --install`, `export LANG=en_US.UTF-8` in `~/.zshrc`.
- **Firebase CLI** - `npm i -g firebase-tools`.
- **Expo managed project** - `npx expo prebuild` to create `android/` and `ios/`, then re-run the skill.

### B. Firebase App Distribution (Android) - https://console.firebase.google.com
1. Create or choose the Firebase project.
2. Project settings -> Your apps -> **Add app -> Android**; package name must equal `applicationId` exactly
   (one app per flavor/package). Download `google-services.json` into `android/app/`.
   -> Copy the **App ID** (`1:…:android:…`) into `FIREBASE_ANDROID_<KEY>_APP_ID`.
3. **App Distribution -> Get started**, then **Testers & Groups -> Add group** (e.g. `testers`), add tester e-mails.
   -> Put the group **alias** into `FIREBASE_ANDROID_<KEY>_GROUPS` (comma-separated for several).
4. **Authentication** (pick one):
   - Token (required for AI tests): in your own terminal run `firebase login:ci`, sign in in the browser, copy the
     `1//…` token -> `FIREBASE_TOKEN`. Treat it like a password.
   - Service account (upload only): Google Cloud console -> IAM & Admin -> Service accounts -> Create
     (`fastlane-distribution`), roles *Firebase App Distribution Admin*, *Service Usage Consumer* (+ *Firebase Test Lab Admin*,
     *Gemini for Google Cloud User* for AI tests) -> Keys -> Add key -> JSON -> save as
     `fastlane/firebase-service-account.json` (git-ignored) -> `FIREBASE_SERVICE_CREDENTIALS_FILE=fastlane/firebase-service-account.json`.
5. Google Cloud console -> APIs & Services -> enable **Firebase App Distribution API** (and for AI tests: Cloud Testing API,
   Cloud Tool Results API, Gemini for Google Cloud API).
6. *(before Google Play)* Create a release keystore and configure `signingConfigs.release` in `android/app/build.gradle`.

### C. AI tests - Firebase App Testing agent *(optional)*
1. Project owner: Firebase console -> App Distribution -> app -> **Test cases** -> accept the App Testing / Gemini terms.
2. Create test cases (goal, hints, success criteria). Copy each **test case ID** into `fastlane/config/test_case_ids.yml`.
3. Pick devices in `fastlane/config/testing.yml`; set `app_testing.enabled: true`.
4. Use `FIREBASE_TOKEN` of the account that opted in (service accounts get 403).
5. If a test signs in: `FIREBASE_TEST_USERNAME` / `FIREBASE_TEST_PASSWORD`. Disable `FLAG_SECURE` on test builds.
   Quota: 200 tests / month / project (1 test = 1 test case x 1 device).

### D. iOS - Xcode and Apple
1. Open `ios/<Name>.xcworkspace` in Xcode -> Settings -> **Accounts** -> sign in with an Apple ID on the team.
2. Product -> Scheme -> **Manage Schemes** -> tick **Shared** for the app scheme -> commit `xcshareddata/`.
3. Developer account -> Membership -> copy the 10-character **Team ID** -> `APPLE_TEAM_ID`.
4. App Store Connect -> Apps -> **+ New App** with the same bundle id (TestFlight only).
5. App Store Connect -> Users and Access -> Integrations -> **App Store Connect API** -> Generate key (role **Admin**,
   or App Manager with cloud-managed certificates). Download `AuthKey_XXXX.p8` once and store it **outside the repo**.
   -> `APP_STORE_CONNECT_KEY_ID`, `APP_STORE_CONNECT_ISSUER_ID`, `APP_STORE_CONNECT_KEY_FILE=/absolute/path/AuthKey_XXXX.p8`.
6. `Info.plist`: add `ITSAppUsesNonExemptEncryption = NO` if the app only uses standard HTTPS; make sure every used
   permission has an `NS…UsageDescription`; App Store icon 1024x1024 without transparency.
7. *(Firebase Ad Hoc channel)* Firebase -> Add app -> **iOS** with the bundle id -> `GOOGLE_APP_ID` into
   `FIREBASE_IOS_<KEY>_APP_ID`; create a tester group -> `FIREBASE_IOS_<KEY>_GROUPS`; register tester device UDIDs in the
   Apple Developer portal (Ad Hoc builds install only on registered devices).
8. After the first `bundle exec fastlane ios development`: App Store Connect -> TestFlight -> wait for *Ready to Test*
   (10-30 min), answer *Missing Compliance* if shown, add internal testers, install via the TestFlight app.

### E. Notifications *(optional)*
- **Microsoft Teams**: Teams -> channel -> Workflows -> "Post to a channel when a webhook request is received" -> copy URL -> `TEAMS_WEBHOOK_URL`; set `notifications.teams.enabled: true`.
- **Slack**: create an Incoming Webhook -> `SLACK_WEBHOOK_URL`; set `notifications.slack.enabled: true`.
- **E-mail AI test reports**: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD` (app password), `SMTP_FROM`, `TEST_ALERT_EMAIL_RECIPIENTS`.

### F. GitHub Actions *(optional)*
1. GitHub repo -> Settings -> Secrets and variables -> Actions -> **New repository secret** for each name from step 9
   (paste full JSON / `.p8` content for multi-line values).
2. Actions -> **Android Distribution** / **iOS Distribution** -> Run workflow -> pick `development` / `staging`.
3. Only after a manual run passes, set variables such as `IOS_AUTO_DISTRIBUTE=true`.

### G. First distribution (always last)
1. `bundle exec fastlane android doctor environment:development` -> all green.
2. `bundle exec fastlane setup` in your own terminal (interactive) **or**
   `bundle exec fastlane android distribute environment:development`.
3. Check Firebase console -> App Distribution -> Releases, and the tester e-mail.
4. Commit: `fastlane/`, `Gemfile`, `Gemfile.lock`, `.env.example`, `.gitignore`, `.ruby-version`, `.github/workflows/` - never `.env`.

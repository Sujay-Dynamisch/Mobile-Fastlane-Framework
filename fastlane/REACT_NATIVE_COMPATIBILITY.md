# React Native compatibility

Which React Native (RN) versions the Mobile Distribution Framework works with, what each version range needs, and how to check a project before the first run.

> **Short answer:** the framework is **not tied to a React Native version**. It drives the native tool chains (the Gradle wrapper in `android/`, CocoaPods + Xcode in `ios/`), and it reads only a few stable files. Any RN project from **0.60 onward**, including Expo after `npx expo prebuild`, is supported. Older ranges need the small adjustments listed below. Projects **before 0.60** are not supported.

---

## 1. Support matrix

| React Native | Android | iOS | What you need to do |
|---|---|---|---|
| **0.73 – 0.87** (latest) | ✅ Supported | ✅ Supported | Nothing beyond the normal setup. JDK 17. |
| **0.71 – 0.72** | ✅ Supported | ✅ Supported | Use the JDK your RN version requires (see [§3](#3-tool-chain-per-react-native-version)). |
| **0.60 – 0.70** | ⚠️ Supported with notes | ⚠️ Supported with notes | Upgrade the project's Ruby to ≥ 3.2 and add `cocoapods` to the Gemfile ([§4](#4-ruby-gemfile-and-cocoapods)). Check the Info.plist version placeholders ([§5](#5-ios-versioning-placeholders)). |
| **< 0.60** | ❌ Not supported | ❌ Not supported | No CocoaPods/autolinking in the template, and the Gradle/AGP versions can't run on current JDKs. Upgrade RN first. |
| **Expo – bare / after `expo prebuild`** | ✅ Supported | ✅ Supported | Run `npx expo prebuild` so `android/` and `ios/` exist ([§6](#6-expo)). |
| **Expo – managed only (no native folders)** | ❌ | ❌ | Run `npx expo prebuild` in CI before fastlane, or use EAS Build instead. |

### What has actually been run

| Setup | Status |
|---|---|
| RN **0.87.1** (this repo) · Android · Windows 11 + GitHub Actions | ✅ Verified end-to-end: build → Firebase upload → testers → App Testing agent → Teams/e-mail |
| RN 0.87.1 · iOS | ⚠️ Implemented and reviewed, not yet run on a Mac (see [FRAMEWORK.md §11](FRAMEWORK.md#11-ios-first-run-checklist-mac)) |
| All other rows above | Based on analysing what the framework reads (§2) against each RN template generation, not on test runs. Run `doctor` on the project to confirm. |

---

## 2. Why the RN version barely matters

The framework never calls React Native APIs or the RN CLI. It only touches these things:

| What the framework uses | Where | Stable since | Notes |
|---|---|---|---|
| Gradle wrapper (`gradlew` / `gradlew.bat`) | `android/` | all RN versions | Run through fastlane's `gradle` action. `doctor` restores the executable bit on macOS/Linux. |
| Exact Gradle task (`gradle_task`) | `environments.yml` | — | Never guessed. `doctor` checks it exists with `gradlew tasks --all`. |
| Output folders `build/outputs/apk/<flavor>/<type>/` and `bundle/<variant>/` | `android/app/build/` | Android Gradle Plugin 3.x+ | Same layout for every RN version since 0.60. |
| `applicationId` / `namespace` (auto-detect) | `android/app/build.gradle` or `build.gradle.kts` | — | Groovy (`applicationId "x"`) and Kotlin DSL (`applicationId = "x"`) are both read. |
| App name (auto-detect) | `app.json` → `strings.xml` → `package.json` | — | Expo's `{"expo": {"name"}}` is supported. |
| Product flavors / build types (interactive setup) | `android/app/build.gradle(.kts)` | — | Groovy and Kotlin DSL. |
| `Podfile` → `pod install` → `.xcworkspace` | `ios/` | RN 0.60 (CocoaPods by default) | Uses `bundle exec pod` when cocoapods is in `Gemfile.lock`, otherwise the system `pod`. |
| Shared Xcode scheme | `ios/*.xcodeproj/xcshareddata` | — | Mark it **Shared** in Xcode. |
| `$(MARKETING_VERSION)` / `$(CURRENT_PROJECT_VERSION)` | `ios/<App>/Info.plist` | template-dependent | Needed for version/build-number injection. `ios doctor` warns if they are hard-coded. |

Features that change between RN versions have no effect on the framework: the New Architecture (Fabric/TurboModules), Bridgeless mode, Hermes or JSC, the Kotlin `MainApplication`, and Gradle-plugin autolinking (0.75+). They happen inside the Gradle/Xcode build that the framework simply runs.

---

## 3. Tool chain per React Native version

The framework needs whatever your RN version needs to build from the command line. If `./gradlew assembleRelease` (or an Xcode archive) works on the machine, the framework works too.

| React Native | JDK (Android) | Notes |
|---|---|---|
| 0.73 and newer | **17** | Android Gradle Plugin 8 requires JDK 17. Set `JAVA_HOME`. |
| 0.67 – 0.72 | **11** (17 often works with 0.72) | Follow the "Setting up the environment" page for that RN version. |
| 0.60 – 0.66 | **8 or 11** | Old AGP/Gradle versions fail on JDK 17 with "Unsupported class file major version". |

Also needed for every version:

- **Node.js on the `PATH`** of the machine running fastlane. The RN Gradle plugin / `react.gradle` runs Node during the release build to bundle JavaScript. In CI, run `npm ci` (or `yarn install`) before fastlane.
- **Xcode version**: App Store Connect only accepts builds made with recent Xcode/SDK versions. Very old RN versions may not compile with that Xcode, and that's an RN upgrade issue, not a framework one. See the [React Native upgrade helper](https://react-native-community.github.io/upgrade-helper/).

Official references: [React Native: set up your environment](https://reactnative.dev/docs/set-up-your-environment) · [Android: build from the command line](https://developer.android.com/build/building-cmdline) · [Android Gradle Plugin release notes (JDK requirements)](https://developer.android.com/build/releases/gradle-plugin).

---

## 4. Ruby, Gemfile and CocoaPods

| Requirement | Why |
|---|---|
| **Ruby ≥ 3.2** | `fastlane-plugin-firebase_app_distribution 1.0.0` requires ≥ 3.2 (fastlane 2.240.1 itself requires ≥ 3.1). |
| **Bundler 2.4 – 4.x** | Required by fastlane 2.240.1. |
| **`cocoapods` in the Gemfile** (iOS) | So `pod install` uses the pinned version. Without it the framework falls back to the system `pod` and logs a warning. |

How each RN template generation's Gemfile combines with the framework:

| RN template | What the template ships | What to change |
|---|---|---|
| 0.74 and newer | `Gemfile` with `ruby ">= 2.6.10"`, cocoapods ≥ 1.13 (≠ 1.15.0/1.15.1), activesupport, xcodeproj < 1.26, concurrent-ruby < 1.3.4 | Nothing. Add the fastlane lines from [FRAMEWORK.md](FRAMEWORK.md) below them. |
| ~0.68 – 0.73 | `Gemfile` + `.ruby-version` pinned to Ruby 2.7.x | Change `.ruby-version` to `3.4.1` (or any ≥ 3.2). If `pod install` then fails, raise cocoapods to `>= 1.13` and activesupport to `>= 6.1.7.5, != 7.1.0`, as newer templates do. |
| older than ~0.68 | No Gemfile/`.ruby-version` | Create the Gemfile from [FRAMEWORK.md](FRAMEWORK.md) and add `gem "cocoapods", ">= 1.13"`. |

On Ruby 3.4+ these gems must be listed explicitly (they left the default gems). The framework Gemfile already does this: `bigdecimal logger benchmark mutex_m nkf net-smtp fiddle`.

---

## 5. iOS versioning placeholders

The framework sets the version and build number with `MARKETING_VERSION=` / `CURRENT_PROJECT_VERSION=` build settings. `Info.plist` must reference them:

```xml
<key>CFBundleShortVersionString</key>
<string>$(MARKETING_VERSION)</string>
<key>CFBundleVersion</key>
<string>$(CURRENT_PROJECT_VERSION)</string>
```

Older templates hard-code `1.0` / `1`. The build then still succeeds, but every upload carries the same build number and TestFlight rejects it ("bundle version already used"). `bundle exec fastlane ios doctor` now warns about this:

```
[!] ios/MyApp/Info.plist: CFBundleVersion is hard-coded to '1'. Set it to $(CURRENT_PROJECT_VERSION) so build numbers/versions from the framework apply.
```

---

## 6. Expo

| Expo workflow | Works? | How |
|---|---|---|
| Bare workflow (native folders committed) | ✅ | Same as RN CLI. |
| Continuous Native Generation (native folders generated, often git-ignored) | ✅ | Run `npx expo prebuild --platform android` (and/or `ios`) before fastlane, locally and in CI. |
| Managed workflow with EAS Build only | ❌ | No native project to build. Keep using EAS, or adopt prebuild. |

If `android/` is missing, `android doctor` stops with *"Android project directory (Expo: run `npx expo prebuild` first)"*.

```yaml
# GitHub Actions excerpt for an Expo (CNG) project
- run: npm ci
- run: npx expo prebuild --platform android --no-install
- run: bundle exec fastlane android distribute environment:staging
```

Official reference: [Expo: Continuous Native Generation](https://docs.expo.dev/workflow/continuous-native-generation/).

---

## 7. Other project shapes

| Project shape | Works? | Configuration |
|---|---|---|
| Monorepo (Yarn/npm/pnpm workspaces, Nx) | ✅ | Set `android.project_dir` / `ios.project_dir` (e.g. `apps/mobile/android`) and use matching `artifact.glob` paths. Run fastlane from the folder that contains the `fastlane/` directory and the Gemfile. |
| Product flavors / multiple app IDs | ✅ | One `gradle_task` per environment, or pick per run with `fastlane setup`. |
| Kotlin DSL (`build.gradle.kts`) | ✅ | Detected for flavors, build types and the package name. |
| Brownfield (RN inside an existing native app) | ✅ | Point `project_dir` at the native project, set the exact `gradle_task`, `workspace` and `scheme`. |
| Fully native Android / iOS (no RN) | ✅ | The framework never requires React Native. |
| Windows | Android only | iOS lanes need macOS + Xcode. |

---

## 8. Check a project in 2 minutes

```bash
npx react-native --version          # or: cat node_modules/react-native/package.json | grep '"version"'
java -version                       # JDK matches §3
ruby --version                      # ≥ 3.2
bundle exec fastlane android doctor environment:development
bundle exec fastlane ios doctor environment:development     # macOS only
```

When both `doctor` lanes pass, the project is compatible. Every failure message names the file or value to fix.

---

## 9. Changes made for compatibility (2026-10-07)

- `lib/config_loader.rb`: package detection reads `build.gradle.kts` and Kotlin DSL `applicationId = "…"`. App-name detection reads Expo's `app.json` (`expo.name`).
- `Fastfile` → `ios_install_pods!`: uses `bundle exec pod` only when cocoapods is in `Gemfile.lock`. Otherwise it uses the system `pod`, with a warning (older RN templates have no cocoapods pin).
- `Fastfile` → `ios doctor`: warns when `Info.plist` hard-codes `CFBundleShortVersionString` / `CFBundleVersion`.
- `Fastfile` → `android doctor`: the missing `android/` message now tells Expo users to run `npx expo prebuild`.

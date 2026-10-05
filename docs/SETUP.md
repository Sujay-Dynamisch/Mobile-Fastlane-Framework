# Setup Guide

## 1. Ruby and Bundler

Use Ruby 3.4.x for the reference project. The Firebase Fastlane plugin requires Ruby >= 3.2.

```powershell
ruby --version
gem --version
gem install bundler
bundle --version
```

## 2. Dependencies

From project root:

```powershell
bundle install
bundle exec fastlane --version
bundle exec fastlane action firebase_app_distribution
```

## 3. Project configuration

Copy the `fastlane` directory and `Gemfile` into the project. Adjust only `fastlane/config/environments.yml` during onboarding.

## 4. Android no-flavor project

If Gradle exposes only tasks such as:

```text
assembleDebug
assembleRelease
bundleRelease
```

keep:

```yaml
android:
  use_flavors: false
```

Configure the exact task:

```yaml
staging:
  gradle_task: "assembleRelease"
```

## 5. Android flavor project

If the project exposes tasks such as:

```text
assembleDevRelease
assembleStagingRelease
assembleProdRelease
```

set:

```yaml
android:
  use_flavors: true
```

Then configure the exact task for every environment:

```yaml
staging:
  flavor: "Staging"
  build_type: "Release"
  gradle_task: "assembleStagingRelease"
```

The explicit task remains authoritative.

## 6. Firebase

Create a Firebase Android app for each truly separated environment, or reuse one app when the project intentionally uses the same application identity.

Create a service account with the Firebase App Distribution Admin role and keep the JSON key outside Git.

Set:

```powershell
$env:FIREBASE_SERVICE_CREDENTIALS_FILE="C:\secure\firebase-service-account.json"
$env:FIREBASE_ANDROID_STAGING_APP_ID="1:123456789:android:abcdef"
$env:FIREBASE_ANDROID_STAGING_GROUPS="staging-qa"
```

The Firebase Fastlane plugin supports APK/AAB, service-account authentication, tester groups, tester emails and release notes.

## 7. Doctor

Run:

```powershell
bundle exec fastlane android doctor environment:staging
```

The doctor verifies the configuration and the real Gradle task before the build.

## 8. Build

```powershell
bundle exec fastlane android build environment:staging
```

## 9. Distribute

```powershell
bundle exec fastlane android distribute environment:staging
```

## 10. iOS

Enable iOS in `environments.yml`, then configure:

```text
APP_STORE_CONNECT_KEY_ID
APP_STORE_CONNECT_ISSUER_ID
APP_STORE_CONNECT_KEY_FILE
MATCH_GIT_URL
MATCH_GIT_BRANCH
MATCH_PASSWORD
```

Run on macOS:

```bash
bundle exec fastlane ios doctor environment:staging
bundle exec fastlane ios distribute environment:staging
```

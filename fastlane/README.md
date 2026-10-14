fastlane documentation
----

# Installation

Make sure you have the latest version of the Xcode command line tools installed:

```sh
xcode-select --install
```

For _fastlane_ installation instructions, see [Installing _fastlane_](https://docs.fastlane.tools/#installing-fastlane)

# Available Actions

### init_project

```sh
[bundle exec] fastlane init_project
```

Interactive one-time project setup: generates fastlane/config/environments.yml

### setup

```sh
[bundle exec] fastlane setup
```

Interactive build setup: reuse a saved setup or create a new one, then run it

### run_profile

```sh
[bundle exec] fastlane run_profile
```

Run a saved setup profile without prompts (CI friendly). Options: name:<profile> dry_run:true

### profiles

```sh
[bundle exec] fastlane profiles
```

List saved setup profiles

----


## Android

### android doctor

```sh
[bundle exec] fastlane android doctor
```

Validate the Android Fastlane distribution configuration

### android info

```sh
[bundle exec] fastlane android info
```

Display the resolved Android configuration without secret values

### android build

```sh
[bundle exec] fastlane android build
```

Build the Android artifact for an environment

### android distribute

```sh
[bundle exec] fastlane android distribute
```

Build and distribute the Android application using Firebase App Distribution

### android development

```sh
[bundle exec] fastlane android development
```



### android staging

```sh
[bundle exec] fastlane android staging
```



### android uat

```sh
[bundle exec] fastlane android uat
```



### android production

```sh
[bundle exec] fastlane android production
```



----


## iOS

### ios doctor

```sh
[bundle exec] fastlane ios doctor
```

Validate the iOS Fastlane distribution configuration

### ios info

```sh
[bundle exec] fastlane ios info
```

Display the resolved iOS configuration without secret values

### ios build

```sh
[bundle exec] fastlane ios build
```

Build a signed iOS IPA without uploading it

### ios distribute

```sh
[bundle exec] fastlane ios distribute
```

Build and upload the iOS application to TestFlight

### ios development

```sh
[bundle exec] fastlane ios development
```



### ios staging

```sh
[bundle exec] fastlane ios staging
```



### ios uat

```sh
[bundle exec] fastlane ios uat
```



### ios production

```sh
[bundle exec] fastlane ios production
```



### ios firebase

```sh
[bundle exec] fastlane ios firebase
```

Build an Ad Hoc IPA and upload it to Firebase App Distribution

Signs with the Apple ID signed in to Xcode; no App Store Connect API key needed

----

This README.md is auto-generated and will be re-generated every time [_fastlane_](https://fastlane.tools) is run.

More information about _fastlane_ can be found on [fastlane.tools](https://fastlane.tools).

The documentation of _fastlane_ can be found on [docs.fastlane.tools](https://docs.fastlane.tools).

# FAQ

## Do I need Android flavors?

No. A project with only `assembleRelease` can use the framework with `use_flavors: false`.

## How do I support a custom MNC Gradle task?

Set the exact task in the environment configuration, for example:

```yaml
gradle_task: "assembleInternalQaRelease"
```

Do not change the Fastfile.

## Can I upload AAB instead of APK?

Yes. Set `artifact.type` to `AAB`, use a `bundle...` Gradle task and configure the correct `.aab` output path. Firebase App Distribution supports AAB distribution, subject to its documented Google Play linkage requirements.

## Why use groups instead of tester email lists?

Groups are easier to manage as a QA population grows and allow the Fastlane configuration to remain stable while membership changes in Firebase.

## Can Teams be enabled without changing the Fastfile?

Yes. Configure the webhook and enable the Teams integration. Notification failures are intentionally non-blocking by default.

## Can production be protected?

Yes. The configuration supports allowed branches, CI-only execution and local confirmation.

## Why are production and staging both allowed to use `assembleRelease`?

The framework treats environment as a distribution concern. The project may choose to use one binary for multiple destinations, although truly isolated environments should normally use separate application identities/flavors/schemes.

## Does iOS use Firebase App Distribution in this implementation?

No. The reference iOS path is Xcode -> TestFlight.

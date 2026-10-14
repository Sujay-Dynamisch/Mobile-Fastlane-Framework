import { CardGrid, Callout, CodeBlock, DocLink, Ext, Flow, OfficialDocs, ParamTable, Steps, Step, Terminal } from "@/components/docs/ui";
import { C, H2, H3, type DocPage } from "./helpers";
import { L } from "./links";

const SetupOverview = () => (
  <>
    <p>
      The interactive setup turns the framework into a guided CLI. You don't need to memorise lane options such as{" "}
      <C>environment:staging gradle_flags:…</C> or edit YAML before every build. Answer a few questions, and the framework builds
      the right variant and remembers your answers for next time.
    </p>
    <ParamTable head={["Command", "When you use it", "Interactive?"]} rows={[
      ["bundle exec fastlane init_project", <>Once per project. Generates <C>fastlane/config/environments.yml</C>.</>, "Yes"],
      ["bundle exec fastlane setup", "Every local build. Reuse a previous setup or create a new one.", "Yes"],
      ["bundle exec fastlane run_profile name:<profile>", "CI, scripts, or when you already know the profile.", "No"],
      ["bundle exec fastlane profiles", "List saved profiles and the last one used.", "No"],
    ]} />

    <H2>What the wizard asks</H2>
    <Flow steps={[
      "Use last / saved setup, or create a new one",
      "Platform: Android, iOS or both",
      "Environment: development, staging, uat, production or your own",
      "Android: flavor → build type → APK or AAB → Gradle task & output path",
      "iOS: scheme → (distribute) Firebase (Ad Hoc) or TestFlight; (build only) export method",
      "Action: build only, or build + distribute (Firebase / TestFlight)",
      "Testers, AI testing, release notes",
      "Summary → confirm → save as profile → doctor → build / distribute",
    ]} />

    <H2>How it fits with the existing lanes</H2>
    <p>
      The wizard does not replace the platform lanes. It produces a <strong>profile</strong>: a small YAML file that uses the same
      keys as an environment block in <C>environments.yml</C>. At run time the profile is deep-merged over that environment, and
      the normal <C>android doctor</C> / <C>build</C> / <C>distribute</C> (or <C>ios …</C>) lanes run. Validation, production
      guards and notifications therefore behave exactly as before.
    </p>
    <Callout type="note">the framework uses the prompt helpers built into fastlane (<C>UI.select</C>, <C>UI.input</C>, <C>UI.confirm</C>), so it adds no extra gems. See <Ext href={L.fastlaneLanes.href}>fastlane lanes</Ext> for how platform lanes and options work.</Callout>

    <CardGrid cards={[
      { icon: "construction", title: "Initialize a project", desc: "fastlane init_project, step by step.", to: "setup/init-project" },
      { icon: "terminal", title: "Run the setup wizard", desc: "Pick env, flavor and APK/AAB per run.", to: "setup/wizard" },
      { icon: "bookmarks", title: "Profiles & CI", desc: "Reuse setups locally and in GitHub Actions.", to: "setup/profiles" },
    ]} cols={3} />
    <OfficialDocs links={[L.fastlaneLanes, L.fastlaneFastfile, L.androidVariants]} />
  </>
);

const InitProject = () => (
  <>
    <p>
      <C>init_project</C> is a one-time wizard that inspects your native projects and writes <C>fastlane/config/environments.yml</C>{" "}
      for you. Use it when you onboard a new app, or when you want to regenerate the configuration from scratch.
    </p>
    <H2>Before you begin</H2>
    <ul>
      <li>Complete <DocLink to="get-started/install">Install &amp; verify dependencies</DocLink>.</li>
      <li>Make sure <C>android/app/build.gradle</C> (or <C>build.gradle.kts</C>) and/or your <C>ios/*.xcodeproj</C> are present.</li>
      <li>For iOS, mark the schemes as <strong>Shared</strong> in Xcode so they can be detected (<Ext href={L.xcodeSchemes.href}>Apple: build schemes</Ext>).</li>
    </ul>

    <H2>Step 1: Start the wizard</H2>
    <Terminal title="my-app — zsh" lines={`
$ bundle exec fastlane init_project
~ [10:12:03]: Starting Fastlane lane: init_project
~ [10:12:03]: --- Project setup ---
? App name [MyApp]:
? App identifier / package [com.example.myapp]:
? Organization [Default]: Example Inc.`} caption="Press Enter to accept a detected value shown in [brackets]." />
    <p>Defaults are detected from <C>app.json</C>, <C>strings.xml</C>, <C>package.json</C>, <C>google-services.json</C> and <C>build.gradle</C>.</p>

    <H2>Step 2: Choose environments and platforms</H2>
    <Terminal title="my-app — zsh" lines={`
~ Default environments: development, staging, uat, production
? Environments (comma separated) [development,staging,uat,production]: development,staging,uat,production
? Default environment:
> development
? Enable Android? (y/n) y
? Enable iOS? (y/n) n`} />
    <p>You can use any names, for example <C>qa,preprod,production</C>. Names are lower-cased and become the keys under <C>android.environments</C> and <C>ios.environments</C>.</p>

    <H2>Step 3: Configure each Android environment</H2>
    <p>The wizard reads <C>productFlavors</C> and <C>buildTypes</C> from Gradle (Groovy and Kotlin DSL). See <Ext href={L.androidVariants.href}>Configure build variants</Ext> for what these are. For each environment it suggests the matching flavor:</p>
    <Terminal title="my-app — zsh" lines={`
? Android project dir [android]:
~ Detected flavors: dev, staging, prod
~ --- Android · staging ---
? Flavor for staging:
> staging
? Build type for staging:
> release
? Default artifact for staging:
> AAB
? Distribute staging via Firebase App Distribution? (y/n) y`} />
    <p>From those answers it derives the Gradle task and the output path. These follow the naming rules described in <Ext href={L.androidCmdline.href}>Build your app from the command line</Ext>:</p>
    <ParamTable codeFirst={false} head={["Flavor", "Build type", "Artifact", "gradle_task", "artifact.glob"]} rows={[
      ["(none)", "release", "APK", <C>assembleRelease</C>, <C>android/app/build/outputs/apk/release/*.apk</C>],
      ["(none)", "release", "AAB", <C>bundleRelease</C>, <C>android/app/build/outputs/bundle/release/*.aab</C>],
      ["staging", "release", "APK", <C>assembleStagingRelease</C>, <C>android/app/build/outputs/apk/staging/release/*.apk</C>],
      ["staging", "release", "AAB", <C>bundleStagingRelease</C>, <C>android/app/build/outputs/bundle/stagingRelease/*.aab</C>],
    ]} />

    <H2>Step 4: Notifications and output</H2>
    <Terminal title="my-app — zsh" lines={`
? Send Microsoft Teams notifications? (y/n) y
? Send Slack notifications? (y/n) n
+ [10:14:41]: Wrote /Users/you/my-app/fastlane/config/environments.yml
~ [10:14:41]: Added 9 key(s) to .env.example: FIREBASE_ANDROID_DEVELOPMENT_APP_ID, FIREBASE_ANDROID_DEVELOPMENT_GROUPS, ...
~ [10:14:41]: Next: fill .env, then run \`fastlane android doctor\` / \`fastlane setup\`.
+ [10:14:41]: Fastlane completed successfully: init_project`} />
    <p>The generated file never contains secrets. App IDs and groups are written as <C>{"${FIREBASE_ANDROID_<ENV>_APP_ID}"}</C> placeholders, which the loader resolves from <C>.env</C> or CI secrets at run time.</p>
    <CodeBlock language="yaml" filename="fastlane/config/environments.yml (excerpt)" code={`android:
  enabled: true
  project_dir: android
  use_flavors: true
  environments:
    staging:
      description: Staging Android distribution
      flavor: staging
      build_type: release
      gradle_task: bundleStagingRelease
      artifact:
        type: AAB
        glob: android/app/build/outputs/bundle/stagingRelease/*.aab
      firebase:
        enabled: true
        app_id: "\${FIREBASE_ANDROID_STAGING_APP_ID}"
        groups: "\${FIREBASE_ANDROID_STAGING_GROUPS}"
        testers: ''
      app_testing:
        enabled: false        # AI tests need an APK`} />

    <Callout type="caution">if <C>environments.yml</C> already exists, the wizard asks before replacing it and keeps a backup at <C>environments.yml.bak</C>. Hand-written comments are not carried over, so compare the two files before committing.</Callout>
    <Callout type="note"><C>init_project</C> refuses to run in CI (<C>CI=true</C>), because it needs a person to answer.</Callout>

    <H2>Step 5: Validate</H2>
    <Steps>
      <Step title="Fill .env">Copy the new keys from <C>.env.example</C> into <C>.env</C> and fill in the values (<DocLink to="configure/env-vars">reference</DocLink>).</Step>
      <Step title="Run doctor"><CodeBlock language="bash" code="bundle exec fastlane android doctor environment:staging" /></Step>
    </Steps>
    <OfficialDocs links={[L.androidVariants, L.androidCmdline, L.androidBundle, L.xcodeSchemes, L.yaml]} />
  </>
);

const Wizard = () => (
  <>
    <p><C>fastlane setup</C> is the command you run for everyday builds. It starts with a menu: reuse what you did last time, or answer a few questions to build something different.</p>

    <H2>Step 1: Start</H2>
    <Terminal title="my-app — zsh" lines={`
$ bundle exec fastlane setup
~ [11:02:15]: Starting Fastlane lane: setup
? What do you want to do?
  1. Use last setup (staging-aab: android · staging · AAB · distribute)
  2. Use a saved setup
  3. Create new setup
  4. Edit a saved setup
  5. Delete a saved setup
> 3`} caption="The first menu. When no profiles exist yet, the wizard goes straight to “Create new setup”." />
    <ParamTable codeFirst={false} head={["Option", "What happens"]} rows={[
      ["Use last setup", "Runs the most recently used profile without further questions."],
      ["Use a saved setup", <>Pick any profile from <C>fastlane/config/profiles/</C>.</>],
      ["Create new setup", "Asks every question, then offers to save the result."],
      ["Edit a saved setup", "Asks every question with the profile's values pre-selected, then saves over it."],
      ["Delete a saved setup", "Removes a profile file after confirmation, then returns to the menu."],
    ]} />

    <H2>Step 2: Platform and environment</H2>
    <Terminal title="my-app — zsh" lines={`
~ --- New build setup ---
? Platform:
> android
? Environment:
> staging
? What should this run do?
> distribute`} />
    <p>Only platforms with <C>enabled: true</C> are offered. When a single platform is enabled, the wizard selects it automatically. When you choose <strong>both</strong>, only the environments that both platforms define are listed.</p>

    <H2>Step 3: Android variant</H2>
    <Terminal title="my-app — zsh" lines={`
? Android flavor:
> staging
? Build type:
> release
? Artifact:
> AAB
~ Gradle task:   bundleStagingRelease
~ Artifact glob: android/app/build/outputs/bundle/stagingRelease/*.aab
? Use this Gradle task and glob? (y/n) y`} />
    <ParamTable codeFirst={false} head={["Choice", "Pick this when", "Official reference"]} rows={[
      [<strong>APK</strong>, "Testers install directly from Firebase App Distribution, or you want AI tests (the App Testing agent needs an APK).", <Ext href={L.appDistFastlane.href}>Firebase + fastlane</Ext>],
      [<strong>AAB</strong>, "You are preparing a Play Store build. Firebase can distribute AABs only when the Firebase project is linked to Google Play.", <Ext href={L.androidBundle.href}>About App Bundles</Ext>],
    ]} />
    <Callout type="tip">answer <strong>n</strong> to “Use this Gradle task and glob?” for custom variants such as <C>assembleInternalQaRelease</C>, then type the exact task and output path.</Callout>

    <H2>Step 4: Distribution options</H2>
    <Terminal title="my-app — zsh" lines={`
? Firebase tester groups (comma separated, blank = from config): qa-team
? Firebase tester emails (comma separated, optional):
! Firebase AI App Testing needs an APK — it will be off for this AAB build.
? Release notes:
> git
? Number of commits [15]: 10`} />
    <ul>
      <li><strong>Groups / testers</strong>: leave blank to use the values from <C>environments.yml</C> / <C>.env</C> (<Ext href={L.appDistTesters.href}>manage testers and groups</Ext>).</li>
      <li><strong>Release notes</strong>: <C>git</C> (last N commit subjects), <C>manual</C> (text you type now) or <C>file</C> (a path such as <C>fastlane/release_notes.txt</C>).</li>
      <li>For iOS the wizard instead asks for the <strong>scheme</strong>. To distribute, it asks <strong>Distribute to: firebase / testflight</strong> when Firebase is enabled for that environment (otherwise TestFlight is used), then the Firebase groups and tester e-mails, or the TestFlight groups. It warns if the TestFlight API key is missing from <C>.env</C>. For a build-only run it asks for the <strong>export method</strong>.</li>
      <li><C>init_project</C> asks, for each non-production iOS environment, whether to distribute via Firebase (Ad Hoc). It writes the <C>firebase</C> block with <C>FIREBASE_IOS_&lt;ENV&gt;_*</C> variables and adds them to <C>.env.example</C>.</li>
    </ul>

    <H2>Step 5: Review, save and run</H2>
    <Terminal title="my-app — zsh" lines={`
~ --- Setup summary ---
Platforms           android
Environment         staging
Action              distribute
Android flavor      staging
Android build type  release
Artifact            AAB
Gradle task         bundleStagingRelease
Artifact glob       android/app/build/outputs/bundle/stagingRelease/*.aab
Firebase groups     qa-team
AI App Testing      off
Release notes       git
? Use this setup? (y/n) y
? Save this setup for next time? (y/n) y
? Profile name [staging-aab]:
+ Saved fastlane/config/profiles/staging-aab.yml
~ Cruising over to lane 'android doctor' 🚖
+ Android staging configuration is valid.
~ Cruising over to lane 'android distribute' 🚖`} caption="Answer n to “Use this setup?” to discard it and return to the menu." />
    <Callout type="note"><strong>Build only</strong> runs never upload. The wizard switches Firebase upload and AI tests off for that run, so <C>doctor</C> doesn't ask for Firebase credentials.</Callout>
    <Callout type="warning">production environments still go through the <DocLink to="configure/production-safety">production guard</DocLink> (allowed branches, confirmation). The wizard does not bypass it.</Callout>

    <H3>Dry run</H3>
    <p>Add <C>dry_run:true</C> to run only <C>doctor</C> and <C>info</C> for the chosen setup, without building:</p>
    <CodeBlock language="bash" code="bundle exec fastlane setup dry_run:true" />
    <OfficialDocs links={[L.androidVariants, L.androidBundle, L.appDistTesters, L.fastlaneLanes]} />
  </>
);

const Profiles = () => (
  <>
    <p>A profile is a saved setup. Profiles are committed to the repository, so the whole team and CI can run exactly the same build with one command.</p>

    <H2>Where profiles live</H2>
    <ParamTable head={["Path", "Committed?", "Contents"]} rows={[
      ["fastlane/config/profiles/<name>.yml", "Yes", "Platforms, environment, action and the per-platform overrides"],
      ["fastlane/.setup_state.yml", "No (git-ignored)", "Name of the last profile you used on this machine"],
    ]} />

    <H2>Profile format</H2>
    <p>A profile uses the same keys as an environment block in <C>environments.yml</C>. Anything a profile doesn't set falls back to that environment.</p>
    <CodeBlock language="yaml" filename="fastlane/config/profiles/staging-aab.yml" code={`# Saved by \`fastlane setup\`. Run with: fastlane run_profile name:staging-aab
platforms:
- android
environment: staging
action: distribute          # build | distribute
android:
  flavor: staging
  build_type: release
  gradle_task: bundleStagingRelease
  artifact:
    type: AAB
    glob: android/app/build/outputs/bundle/stagingRelease/*.aab
  firebase:
    enabled: true
    groups: qa-team
  app_testing:
    enabled: false
  release_notes:
    enabled: true
    source: git
    commit_count: 10
name: staging-aab`} />
    <Callout type="warning">profiles are committed. Never put tokens, passwords or webhook URLs in them. Use <C>{"${ENV_VAR}"}</C> placeholders or leave the value blank so it comes from <C>.env</C>.</Callout>

    <H2>Run a profile without prompts</H2>
    <Terminal title="my-app — zsh" lines={`
$ bundle exec fastlane profiles
~ dev-apk — android · development · APK · build
~ staging-aab (last used) — android · staging · staging · AAB · distribute
$ bundle exec fastlane run_profile name:dev-apk dry_run:true
~ Cruising over to lane 'android doctor' 🚖
~ Flavor mode: disabled
+ Android development configuration is valid.
~ Cruising over to lane 'android info' 🚖
~ Gradle task: assembleRelease
~ Artifact type: APK
~ Firebase enabled: false
+ Fastlane completed successfully: run_profile`} caption="Captured from a real dry run: the profile's overrides are applied to the existing doctor and info lanes." />
    <ParamTable head={["Option", "Effect"]} rows={[
      ["name:<profile>", "Required in CI. Locally it defaults to the last used profile."],
      ["dry_run:true", <>Runs <C>doctor</C> and <C>info</C> only. Nothing is built or uploaded.</>],
    ]} />

    <H2>Use profiles in GitHub Actions</H2>
    <p>Because <C>run_profile</C> never prompts, it can replace hand-written lane options in a workflow. Let the person running the workflow pick a profile through a <Ext href={L.ghDispatch.href}>workflow_dispatch</Ext> input:</p>
    <CodeBlock language="yaml" filename=".github/workflows/android-distribution.yml (excerpt)" code={`on:
  workflow_dispatch:
    inputs:
      profile:
        description: "Saved setup profile"
        required: true
        default: "staging-aab"

jobs:
  distribute:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: ruby/setup-ruby@v1
        with:
          bundler-cache: true
      - run: bundle exec fastlane run_profile name:\${{ inputs.profile }}
        env:
          FIREBASE_TOKEN: \${{ secrets.FIREBASE_TOKEN }}
          FIREBASE_ANDROID_STAGING_APP_ID: \${{ secrets.FIREBASE_ANDROID_STAGING_APP_ID }}`} />
    <Terminal title="GitHub Actions · run_profile" lines={`
$ CI=true bundle exec fastlane setup
x [!] \`fastlane setup\` is interactive. In CI use: fastlane run_profile name:<profile>`} caption="setup and init_project stop immediately in CI instead of hanging on a prompt." />
    <OfficialDocs links={[L.fastlaneGithubActions, L.ghDispatch, L.setupRuby, L.ghSecrets]} />
  </>
);

export const setupPages: DocPage[] = [
  { slug: "setup", title: "Interactive setup overview", description: "A guided CLI to generate configuration and pick environment, flavor and APK/AAB per run.", body: SetupOverview },
  { slug: "setup/init-project", title: "Initialize a project (init_project)", description: "Generate environments.yml by detecting flavors, build types and schemes.", body: InitProject },
  { slug: "setup/wizard", title: "Run the setup wizard (setup)", description: "Reuse a previous setup or create a new one, then build or distribute.", body: Wizard },
  { slug: "setup/profiles", title: "Profiles & CI (run_profile)", description: "Saved setups, their format, and running them without prompts in CI.", body: Profiles },
];

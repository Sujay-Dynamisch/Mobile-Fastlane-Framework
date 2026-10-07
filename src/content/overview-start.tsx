import { Callout, CodeBlock, DocLink, Ext, FileTree, Flow, NextSteps, OfficialDocs, ParamTable, Ph, PlatformTabs, StatusIcon, StatusTable, Steps, Step, Terminal, Cmd } from "@/components/docs/ui";
import { ConsoleButtons, ToolDownloads } from "@/components/docs/downloads";
import { C, H2, H3, type DocPage } from "./helpers";
import { L } from "./links";

/* ============================== Overview ============================== */

const Intro = () => (
  <>
    <p>
      The Mobile Fastlane Framework is a reusable, configuration-driven <Ext href={L.fastlaneDocs.href}>fastlane</Ext> setup.
      It builds, distributes and AI-tests React Native apps, as well as fully native Android and iOS apps. You drop the same{" "}
      <C>Fastfile</C> and <C>lib/</C> folder into every project. All project-specific details live in YAML and environment
      variables, so onboarding a new app never means editing Ruby.
    </p>
    <ul>
      <li><strong>Android</strong> → Gradle build (APK or AAB) → <Ext href={L.appDistribution.href}>Firebase App Distribution</Ext>, plus the optional Firebase App Testing agent for AI-driven tests on real devices.</li>
      <li><strong>iOS</strong> → Xcode archive (IPA) → <Ext href={L.testflight.href}>TestFlight</Ext> via App Store Connect.</li>
      <li><strong>Interactive CLI</strong>: <C>fastlane init_project</C> generates the configuration for a new project, and <C>fastlane setup</C> lets you pick the environment, flavor, APK/AAB and target for each run, then saves those choices as reusable profiles.</li>
      <li><strong>Reporting</strong>: Microsoft Teams Adaptive Cards, Slack and HTML e-mail reports for every run.</li>
    </ul>

    <H2>Who this documentation is for</H2>
    <p>
      These pages are written for mobile and DevOps engineers who need a repeatable release pipeline. You don't need to know
      Ruby. If you have used Gradle or Xcode from the command line, you have enough background. Every page links to the
      official documentation of the tool it relies on (fastlane, Firebase, Apple, Android, GitHub), so you can check each
      step against the source.
    </p>

    <H2>Status</H2>
    <StatusTable head={["Platform", "", "Status"]} rows={[
      { label: "Android", cells: ["ok", "Verified end-to-end (build → upload → manual testers → AI tests → report)"] },
      { label: "Interactive setup", cells: ["ok", <>Verified on Windows: <C>init_project</C>, <C>setup</C>, <C>run_profile</C> and the CI guard</>] },
      { label: "iOS", cells: ["warn", <>Implemented and reviewed, not yet run on a Mac. Follow the <DocLink to="ios/first-run">First run on a Mac</DocLink> checklist.</>] },
    ]} />

    <H2>The 60-second tour</H2>
    <Terminal title="my-app — zsh" lines={`
# 1. One-time: generate fastlane/config/environments.yml for this project
$ bundle exec fastlane init_project
# 2. Every run: choose (or reuse) a setup and build/distribute
$ bundle exec fastlane setup
? What do you want to do?
> Use last setup (staging-aab: android · staging · AAB · distribute)
+ Android development configuration is valid.
+ Firebase App Distribution — STAGING: release 1.4.0 (57) distributed to "qa-team"
# 3. In CI: replay the same profile without prompts
$ bundle exec fastlane run_profile name:staging-aab`} caption="The three commands you use day to day." />

    <Callout type="success" title="Design rule">the <C>Fastfile</C> and <C>lib/</C> are generic. To onboard a new app you change only <C>fastlane/config/*.yml</C> and <C>.env</C> (or CI secrets). Never fork the Fastfile per project.</Callout>

    <NextSteps cards={[
      { icon: "rocket_launch", title: "Prerequisites", desc: "What you need installed before you start.", to: "get-started/prerequisites" },
      { icon: "bolt", title: "Quickstart", desc: "Add the framework to an existing project.", to: "get-started/quickstart" },
    ]} />
    <OfficialDocs links={[L.fastlaneDocs, L.appDistribution, L.testflight]} />
  </>
);

const Y = <StatusIcon s="ok" />;
const Capabilities = () => (
  <>
    <p>A summary of everything the framework handles for each platform. Each capability relies on a standard fastlane action or official vendor API. No undocumented behaviour is involved.</p>
    <ParamTable codeFirst={false} head={["Capability", "Android", "iOS"]} rows={[
      [<>Interactive project setup (<C>init_project</C>)</>, "Detects flavors and build types", "Detects shared schemes"],
      [<>Interactive per-run setup with saved profiles (<C>setup</C>, <C>run_profile</C>)</>, Y, Y],
      [<>Validate config before building (<C>doctor</C>)</>, Y, Y],
      [<>Show resolved config without secrets (<C>info</C>)</>, Y, Y],
      ["Build release artifact", <>APK / AAB via <Ext href={L.fastlaneGradle.href}>gradle</Ext></>, <>IPA via <Ext href={L.fastlaneBuildApp.href}>build_app (gym)</Ext></>],
      ["Multiple environments (development / staging / uat / production / custom)", Y, Y],
      ["Product flavors / custom Gradle tasks", Y, "Schemes"],
      ["Distribute", "Firebase App Distribution (groups / e-mails)", <><Ext href={L.fastlaneTestflight.href}>upload_to_testflight</Ext> (internal / external groups)</>],
      ["AI tests on real devices", "Firebase App Testing agent", "–"],
      ["Automatic release notes", "git commits / text / file", "git commits / text / file"],
      ["Build-number handling", "–", <><C>BUILD_NUMBER</C> or latest TestFlight + 1</>],
      ["Code signing", <>Gradle <C>signingConfigs</C></>, <>Xcode automatic signing or <Ext href={L.fastlaneMatch.href}>match</Ext></>],
      ["Microsoft Teams Adaptive Card report (success, failure, AI test report)", Y, Y],
      ["E-mail report of AI test results", Y, "–"],
      ["Production guard (branch, confirmation, CI-only)", Y, Y],
    ]} />
    <NextSteps cards={[
      { icon: "account_tree", title: "How a distribution run works", desc: "The pipeline each lane executes.", to: "overview/how-it-works" },
      { icon: "terminal", title: "Interactive setup", desc: "Pick env, flavor and APK/AAB from a CLI wizard.", to: "setup" },
    ]} />
    <OfficialDocs links={[L.fastlaneGradle, L.fastlaneBuildApp, L.fastlaneTestflight, L.appDistFastlane]} />
  </>
);

const HowItWorks = () => (
  <>
    <p>Each <C>distribute</C> lane runs a fixed pipeline. Every step either succeeds or stops the lane with a clear error, and a failure notification is sent. Pick a platform to see its steps.</p>
    <H2>Distribution pipeline</H2>
    <PlatformTabs
      android={<>
        <p className="text-muted-foreground"><C>android distribute</C></p>
        <Flow steps={[
          "Validate config → production guard → Gradle build → find APK/AAB → copy to dist/",
          "Release notes (file → text → git commits)",
          { label: <strong className="font-medium">Are AI tests enabled AND groups/testers set?</strong>, branch: [
            { title: "Yes", steps: ["Upload and distribute to manual testers without test options", <>Re-upload the same APK (Firebase reuses the release: <C>RELEASE_UNMODIFIED</C>), start AI tests and wait for results (blocking)</>] },
            { title: "No", steps: ["Single upload (+ AI tests if enabled) + distribute"] },
          ] },
          "AI test report e-mail (if enabled) → Teams App Testing Agent Report card → the lane fails if tests failed",
        ]} />
        <Callout type="note" title="Why two uploads?">the Firebase plugin only distributes to groups after AI tests pass. Splitting the call means manual testers always receive the build, while failing AI tests still fail the lane.</Callout>
        <Terminal title="my-app — zsh" lines={`
$ bundle exec fastlane android distribute environment:staging
~ [14:02:11]: Starting Fastlane lane: distribute
~ [14:02:11]: --- Android Build — STAGING ---
~ [14:02:11]: Gradle task: assembleRelease
~ [14:06:40]: BUILD SUCCESSFUL in 4m 29s
+ [14:06:41]: Android build completed.
~ [14:06:41]: Artifact: dist/MyApp-staging-v1.4.0-57.apk
~ [14:06:41]: --- Firebase App Distribution — STAGING ---
~ [14:06:58]: ✅ Uploaded the APK.
~ [14:06:59]: ✅ Distributed to "qa-team".
~ [14:07:00]: --- Firebase App Testing Agent ---
~ [14:10:12]: login-flow  · Galaxy A54 · Android 14   PASSED
+ [14:10:13]: Fastlane completed successfully: distribute`} caption="A successful Android distribution (output shortened)." />
      </>}
      ios={<>
        <p className="text-muted-foreground"><C>ios distribute</C></p>
        <Flow steps={[
          "Validate config → production guard → App Store Connect API key",
          <>Signing: automatic (<C>-allowProvisioningUpdates</C> + API key) or match (<C>sync_code_signing</C>)</>,
          <>Build number: <C>BUILD_NUMBER</C> / <C>GITHUB_RUN_NUMBER</C>, or latest TestFlight build + 1</>,
          <><Cmd>pod install</Cmd> → <C>build_app</C> (<C>CURRENT_PROJECT_VERSION</C> / <C>MARKETING_VERSION</C> via xcargs) → IPA</>,
          <><C>upload_to_testflight</C> (changelog = release notes; external groups if configured) → Teams notification</>,
        ].map((label) => ({ label }))} />
        <Callout type="note">the Xcode project is not modified for versioning. <C>Info.plist</C> uses <C>$(CURRENT_PROJECT_VERSION)</C> / <C>$(MARKETING_VERSION)</C>, which are overridden at build time.</Callout>
      </>}
    />
    <OfficialDocs links={[L.appDistFastlane, L.appTestingAgent, L.fastlaneBuildApp, L.fastlaneTestflight]} />
  </>
);

const FolderStructure = () => (
  <>
    <p>The files the framework adds to <Ph>&lt;project-root&gt;</Ph>. Files marked ★ are the ones you edit. Everything else is generic and identical across projects.</p>
    <FileTree tree={`
<project-root>/
├── Gemfile / Gemfile.lock        # fastlane 2.240.1 + firebase_app_distribution plugin 1.0.0
├── .ruby-version                 # 3.4.1
├── .env                          # local secrets (git-ignored)
├── .env.example                  # template of every variable the framework reads
├── .github/workflows/
│   ├── android-distribution.yml  # manual "Run workflow" → Firebase
│   └── ios-distribution.yml      # manual "Run workflow" → TestFlight
└── fastlane/
    ├── Fastfile                  # all lanes (generic – do not edit per project)
    ├── Appfile / Matchfile       # intentionally empty; identity comes from config
    ├── Pluginfile                # firebase_app_distribution plugin
    ├── FRAMEWORK.md              # full reference
    ├── README.md                 # auto-generated by fastlane on every run (lane list)
    ├── release_notes.txt         # used when RELEASE_NOTES_FILE points to it
    ├── .setup_state.yml          # "last used" profile pointer (git-ignored)
    ├── config/
    │   ├── environments.yml      # ★ project / platform / environment configuration
    │   ├── testing.yml           # ★ App Testing agent: on/off, devices, e-mail reports
    │   ├── test_case_ids.yml     # ★ which Firebase test cases to run
    │   └── profiles/             # ★ saved setups from \`fastlane setup\` (committed)
    └── lib/
        ├── config_loader.rb      # loads YAML, expands \${ENV_VARS}, profile overrides
        ├── validation_helper.rb  # required values, files, Gradle task, production guard
        ├── artifact_helper.rb    # finds APK/AAB, copies a nicely named file into dist/
        ├── release_notes.rb      # git / manual / file release notes
        ├── notification_helper.rb# Teams Adaptive Cards / Slack webhooks
        ├── app_testing_agent.rb  # builds the test_devices / test_case_ids plugin options
        ├── test_result_parser.rb # turns the test outcome into report data
        ├── email_notifier.rb     # SMTP e-mail with the AI test report
        ├── project_detector.rb   # detects flavors, build types, iOS schemes
        ├── project_bootstrap.rb  # \`fastlane init_project\` wizard
        ├── setup_wizard.rb       # \`fastlane setup\` wizard
        └── profile_store.rb      # saves / loads fastlane/config/profiles/*.yml`} />
    <Callout type="note">generated output (<C>dist/</C>, Fastlane reports) is git-ignored. See <DocLink to="get-started/gitignore">Configure .gitignore</DocLink>.</Callout>
    <OfficialDocs links={[L.fastlaneFastfile, L.fastlanePlugins, L.fastlaneSourceControl]} />
  </>
);

/* ============================== Get started ============================== */

const Prereqs = () => (
  <>
    <p>Install and verify these tools before you add the framework to a project. Each section has download buttons for your operating system and copyable install commands, so you don't need to search anywhere else. Prefer one list? Open <DocLink to="get-started/downloads">Downloads &amp; tools</DocLink>.</p>

    <H2>All platforms</H2>
    <ParamTable codeFirst={false} head={["Tool", "Version", "Why it's needed", "Official guide"]} rows={[
      ["Ruby", "3.4.x (≥ 3.2)", "fastlane is a Ruby gem; the Firebase plugin requires Ruby ≥ 3.2", <><Ext href={L.rubyInstall.href}>ruby-lang.org</Ext></>],
      ["Bundler", "≥ 2.4, < 5", <>Pins the exact fastlane version through <C>Gemfile.lock</C></>, <Ext href={L.bundler.href}>bundler.io</Ext>],
      ["Git", "any recent", "Release notes are read from git history; branch checks for production", <Ext href="https://git-scm.com/downloads">git-scm.com</Ext>],
      ["Node.js", "LTS", <>React Native projects only (<Cmd>npm ci</Cmd> before building)</>, <Ext href={L.nodejs.href}>nodejs.org</Ext>],
    ]} />
    <ToolDownloads ids={["rubyWindows", "rubyMac", "bundler", "git", "node"]} />
    <p>Prefer step-by-step Ruby setup? See <DocLink to="get-started/ruby-windows">Install Ruby (Windows)</DocLink> or <DocLink to="get-started/ruby-macos">Install Ruby (macOS)</DocLink>.</p>

    <H2>Android</H2>
    <ParamTable codeFirst={false} head={["Requirement", "Notes", "Official guide"]} rows={[
      ["JDK 17", <>Required by current Android Gradle Plugin versions. Set <C>JAVA_HOME</C>.</>, <Ext href={L.temurin.href}>Eclipse Temurin</Ext>],
      ["Android SDK + build tools", <>Installed with Android Studio; set <C>ANDROID_HOME</C>.</>, <Ext href={L.androidStudio.href}>Android Studio</Ext>],
      [<>A working <C>android/gradlew</C></>, <>Must build from the command line: <Cmd>./gradlew assembleRelease</Cmd>.</>, <Ext href={L.androidCmdline.href}>Build from the command line</Ext>],
      ["Firebase project with the Android app registered", "The package name must match applicationId exactly.", <Ext href={L.firebaseAndroidSetup.href}>Add Firebase to Android</Ext>],
      ["Firebase CLI", <>Needed once, to create <C>FIREBASE_TOKEN</C> (<Cmd>npm i -g firebase-tools</Cmd>).</>, <Ext href={L.firebaseCli.href}>Firebase CLI</Ext>],
    ]} />
    <ToolDownloads ids={["jdk17", "androidStudio", "firebaseCli"]} />
    <ConsoleButtons ids={["firebase", "firebaseSettings"]} />

    <H2>iOS</H2>
    <ParamTable codeFirst={false} head={["Requirement", "Notes", "Official guide"]} rows={[
      ["macOS with Xcode and command-line tools", <>Install Xcode from the App Store, then run <Cmd>xcode-select --install</Cmd>.</>, <Ext href={L.xcode.href}>Xcode</Ext>],
      ["CocoaPods", <>It's installed through the Gemfile, and the framework runs <Cmd>pod install</Cmd> itself.</>, <Ext href={L.cocoapods.href}>CocoaPods guide</Ext>],
      ["Apple Developer Program membership", "Required to sign and upload to TestFlight.", <Ext href={L.appleProgram.href}>Apple Developer Program</Ext>],
      ["App record in App Store Connect", "Create the app with the same bundle identifier.", <Ext href={L.ascAddApp.href}>Add a new app</Ext>],
      [<>App Store Connect API key (<C>.p8</C>, Key ID, Issuer ID)</>, "Used for signing, build numbers and upload, so no 2FA prompts.", <Ext href={L.ascApiKeys.href}>Creating API keys</Ext>],
    ]} />
    <ToolDownloads ids={["xcode", "homebrew", "cocoapods"]} />
    <ConsoleButtons ids={["appleAccount", "appStoreConnect", "ascApiKeys"]} />

    <H2>Verify your machine</H2>
    <p>Run these commands in a new terminal. Every command should print a version and none should print "not found".</p>
    <PlatformTabs
      android={<Terminal os="windows" title="Windows PowerShell" lines={`
PS> ruby --version
ruby 3.4.1 (2024-12-25 revision 48d4efcb85) +PRISM [x64-mingw-ucrt]
PS> bundle --version
Bundler version 2.6.2
PS> java -version
openjdk version "17.0.12" 2024-07-16
OpenJDK Runtime Environment Temurin-17.0.12+7 (build 17.0.12+7)
PS> git --version
git version 2.47.1.windows.1
PS> node --version
v22.12.0
PS> firebase --version
13.29.1`} caption="Android tool chain verified on Windows." />}
      ios={<Terminal title="my-app — zsh" lines={`
$ ruby --version
ruby 3.4.1 (2024-12-25 revision 48d4efcb85) +PRISM [arm64-darwin24]
$ bundle --version
Bundler version 2.6.2
$ xcodebuild -version
Xcode 16.2
Build version 16C5032a
$ xcode-select -p
/Applications/Xcode.app/Contents/Developer
$ git --version
git version 2.39.5 (Apple Git-154)`} caption="iOS tool chain verified on macOS." />}
    />
    <Callout type="tip">the exact version numbers on your machine will differ. What matters is that the major versions match the table above.</Callout>

    <NextSteps cards={[
      { icon: "desktop_windows", title: "Install Ruby (Windows)", desc: "RubyInstaller with DevKit.", to: "get-started/ruby-windows" },
      { icon: "laptop_mac", title: "Install Ruby (macOS)", desc: "Homebrew, rbenv and ruby-build.", to: "get-started/ruby-macos" },
    ]} />
    <OfficialDocs links={[L.fastlaneAndroidSetup, L.fastlaneIosSetup, L.rnEnvironment, L.temurin, L.xcode, L.ascApiKeys]} />
  </>
);

const Downloads = () => (
  <>
    <p>Everything you need to download, in one place. Each card has the official download page for your operating system (highlighted as <em>your OS</em>), a one-line install command you can copy, and the command that checks it worked. Links open in a new tab.</p>
    <Callout type="tip">on Windows, the install commands use <strong>winget</strong>, which is built into Windows 10 and 11. On macOS they use <strong>Homebrew</strong>, so install that first (see the iOS section). Open a <em>new</em> terminal after installing, so the updated <C>PATH</C> is picked up.</Callout>

    <H2>Everyone</H2>
    <ToolDownloads ids={["git", "node", "rubyWindows", "rubyMac", "bundler"]} title={null} />

    <H2>Android</H2>
    <ToolDownloads ids={["jdk17", "androidStudio", "firebaseCli", "gcloud"]} title={null} />
    <ConsoleButtons ids={["firebase", "firebaseSettings", "appDistribution", "gcpApis", "gcpServiceAccounts"]} />

    <H2>iOS (macOS only)</H2>
    <ToolDownloads ids={["homebrew", "xcode", "cocoapods"]} title={null} />
    <ConsoleButtons ids={["appleAccount", "appStoreConnect", "ascApiKeys"]} />

    <H2>Notifications</H2>
    <ToolDownloads ids={["teams", "slack"]} title={null} />
    <ConsoleButtons ids={["teamsWeb", "slackApps"]} />

    <H2>Check everything at once</H2>
    <PlatformTabs
      android={<CodeBlock tabs={[
        { label: "Windows PowerShell", language: "powershell", code: `git --version; node --version; ruby --version; bundle --version
java -version; adb --version; firebase --version` },
        { label: "macOS / Linux", language: "bash", code: `git --version && node --version && ruby --version && bundle --version
java -version && adb --version && firebase --version` },
      ]} />}
      ios={<CodeBlock language="bash" code={`git --version && node --version && ruby --version && bundle --version
brew --version && xcodebuild -version && xcode-select -p && bundle exec pod --version`} />}
    />
    <p>If a command says <em>not recognized</em> or <em>command not found</em>, the tool isn't installed or isn't on the <C>PATH</C>. Reinstall it from the card above, then open a new terminal.</p>
    <NextSteps cards={[
      { icon: "desktop_windows", title: "Install Ruby (Windows)", desc: "RubyInstaller with DevKit, step by step.", to: "get-started/ruby-windows" },
      { icon: "description", title: "Create the Gemfile", desc: "Pin fastlane and its plugins.", to: "get-started/gemfile" },
    ]} />
  </>
);

const RnCompat = () => (
  <>
    <p>
      The framework is <strong>not tied to a React Native version</strong>. It never calls React Native APIs or the RN CLI. It drives the native
      tool chains (the Gradle wrapper in <C>android/</C>, CocoaPods and Xcode in <C>ios/</C>) and reads a few stable files. Any project from
      <strong> React Native 0.60</strong> onward is supported, including Expo after <Cmd>npx expo prebuild</Cmd>. Older ranges need the small
      adjustments below.
    </p>

    <H2>Support matrix</H2>
    <StatusTable head={["React Native", "", "Android", "iOS", "What you need to do"]} rows={[
      { label: "0.73 – 0.87 (latest)", cells: ["ok", "Supported", "Supported", "Nothing beyond the normal setup. JDK 17."] },
      { label: "0.71 – 0.72", cells: ["ok", "Supported", "Supported", <>Use the JDK your RN version requires (<a href="#tool-chain-per-version">see below</a>).</>] },
      { label: "0.60 – 0.70", cells: ["warn", "With notes", "With notes", <>Ruby ≥ 3.2, add <C>cocoapods</C> to the Gemfile, check the Info.plist version placeholders.</>] },
      { label: "< 0.60", cells: ["none", "Not supported", "Not supported", "No CocoaPods/autolinking in the template, and old Gradle can't run on current JDKs. Upgrade React Native first."] },
      { label: "Expo (bare or after prebuild)", cells: ["ok", "Supported", "Supported", <>Run <Cmd>npx expo prebuild</Cmd> so <C>android/</C> and <C>ios/</C> exist.</>] },
      { label: "Expo managed only", cells: ["none", "Not supported", "Not supported", "No native project to build. Use prebuild in CI, or EAS Build."] },
    ]} />

    <H3>What has actually been run</H3>
    <StatusTable head={["Setup", "", "Result"]} rows={[
      { label: "RN 0.87.1 · Android · Windows 11 + GitHub Actions", cells: ["ok", "Verified end-to-end: build → Firebase upload → testers → App Testing agent → Teams/e-mail"] },
      { label: "RN 0.87.1 · iOS", cells: ["warn", <>Implemented and reviewed, not yet run on a Mac. See <DocLink to="ios/first-run">First run on a Mac</DocLink>.</>] },
      { label: "Other rows of the matrix", cells: ["warn", <>Based on what the framework reads (next section) compared against each RN template generation, not test runs. Run <C>doctor</C> to confirm.</>] },
    ]} />

    <H2>Why the RN version barely matters</H2>
    <ParamTable codeFirst={false} head={["What the framework uses", "Where", "Notes"]} rows={[
      ["Gradle wrapper (gradlew / gradlew.bat)", <C>android/</C>, <>Run through fastlane's <Ext href={L.fastlaneGradle.href}>gradle</Ext> action. <C>doctor</C> restores the executable bit on macOS/Linux.</>],
      [<>Exact <C>gradle_task</C></>, <C>environments.yml</C>, <>Never guessed. <C>doctor</C> checks it with <C>gradlew tasks --all</C>.</>],
      ["Output folders apk/<flavor>/<type>/ and bundle/<variant>/", <C>android/app/build/outputs</C>, "Same layout for every RN version since 0.60 (Android Gradle Plugin 3+)."],
      [<><C>applicationId</C> / <C>namespace</C> (auto-detect)</>, <><C>build.gradle</C> or <C>build.gradle.kts</C></>, <>Groovy (<C>applicationId "x"</C>) and Kotlin DSL (<C>applicationId = "x"</C>).</>],
      ["App name (auto-detect)", <><C>app.json</C> → <C>strings.xml</C> → <C>package.json</C></>, <>Expo's <C>{'{"expo": {"name"}}'}</C> is supported.</>],
      [<><C>Podfile</C> → <C>pod install</C> → <C>.xcworkspace</C></>, <C>ios/</C>, <>Uses <C>bundle exec pod</C> when cocoapods is in <C>Gemfile.lock</C>, otherwise the system <C>pod</C> (with a warning).</>],
      ["Shared Xcode scheme", <C>xcshareddata/xcschemes</C>, <>Mark it <strong>Shared</strong> in Xcode (<Ext href={L.xcodeSchemes.href}>Apple: build schemes</Ext>).</>],
      [<><C>$(MARKETING_VERSION)</C> / <C>$(CURRENT_PROJECT_VERSION)</C></>, <C>ios/&lt;App&gt;/Info.plist</C>, <><C>ios doctor</C> warns if the version values are hard-coded.</>],
    ]} />
    <Callout type="success" title="Not affected">the New Architecture (Fabric/TurboModules), Bridgeless mode, Hermes or JSC, Kotlin <C>MainApplication</C> and Gradle-plugin autolinking (0.75+). These happen inside the Gradle/Xcode build that the framework simply runs.</Callout>

    <H2 id="tool-chain-per-version">Tool chain per React Native version</H2>
    <p>If <Cmd>./gradlew assembleRelease</Cmd> (or an Xcode archive) works on the machine, the framework works too.</p>
    <ParamTable codeFirst={false} head={["React Native", "JDK (Android)", "Notes"]} rows={[
      ["0.73 and newer", <strong>17</strong>, <>Android Gradle Plugin 8 requires JDK 17 (<Ext href={L.agpReleaseNotes.href}>AGP release notes</Ext>).</>],
      ["0.67 – 0.72", <strong>11</strong>, "17 often works with 0.72. Follow that RN version's environment page."],
      ["0.60 – 0.66", <strong>8 or 11</strong>, <>Old Gradle fails on JDK 17 with <em>“Unsupported class file major version”</em>.</>],
    ]} />
    <ul>
      <li><strong>Node.js on the PATH</strong> of the machine running fastlane: the React Native Gradle plugin runs Node during the release build. In CI run <Cmd>npm ci</Cmd> before fastlane.</li>
      <li><strong>Xcode</strong>: App Store Connect only accepts builds from recent Xcode versions. Very old React Native versions may not compile with it, which is an RN upgrade issue (<Ext href={L.rnUpgradeHelper.href}>Upgrade Helper</Ext>).</li>
    </ul>
    <ToolDownloads ids={["jdk17", "node"]} title="Download the JDK and Node.js" />

    <H2>Ruby, Gemfile and CocoaPods</H2>
    <ParamTable codeFirst={false} head={["Requirement", "Why"]} rows={[
      [<strong>Ruby ≥ 3.2</strong>, "fastlane-plugin-firebase_app_distribution 1.0.0 requires ≥ 3.2 (fastlane 2.240.1 itself requires ≥ 3.1)."],
      [<strong>Bundler 2.4 – 4.x</strong>, "Required by fastlane 2.240.1."],
      [<><strong>cocoapods</strong> in the Gemfile (iOS)</>, <>Pins <C>pod install</C>. Without it the framework uses the system <C>pod</C> and logs a warning.</>],
    ]} />
    <ParamTable codeFirst={false} head={["RN template", "What it ships", "What to change"]} rows={[
      ["0.74 and newer", <><C>ruby "&gt;= 2.6.10"</C>, cocoapods ≥ 1.13 (≠ 1.15.0/1.15.1), activesupport, xcodeproj &lt; 1.26, concurrent-ruby &lt; 1.3.4</>, <>Nothing. Add the fastlane lines from <DocLink to="get-started/gemfile">Create the Gemfile</DocLink>.</>],
      ["~0.68 – 0.73", <>Gemfile + <C>.ruby-version</C> pinned to Ruby 2.7.x</>, <>Set <C>.ruby-version</C> to <C>3.4.1</C>. If <C>pod install</C> fails, raise cocoapods to <C>&gt;= 1.13</C> and activesupport to <C>&gt;= 6.1.7.5, != 7.1.0</C>.</>],
      ["older than ~0.68", "No Gemfile", <>Create the Gemfile and add <C>gem "cocoapods", "&gt;= 1.13"</C>.</>],
    ]} />
    <ToolDownloads ids={["rubyWindows", "rubyMac", "cocoapods"]} title="Upgrade Ruby / add CocoaPods" />

    <H2>iOS versioning placeholders</H2>
    <p>The framework sets the version and build number through Xcode build settings, so <C>Info.plist</C> must reference them:</p>
    <CodeBlock language="text" filename="ios/MyApp/Info.plist" code={`<key>CFBundleShortVersionString</key>
<string>$(MARKETING_VERSION)</string>
<key>CFBundleVersion</key>
<string>$(CURRENT_PROJECT_VERSION)</string>`} />
    <p>Older templates hard-code <C>1.0</C> / <C>1</C>. The build still succeeds, but every upload has the same build number and TestFlight rejects it. <C>ios doctor</C> warns about this:</p>
    <Terminal title="my-app — zsh" lines={`
$ bundle exec fastlane ios doctor environment:development
! [!] ios/MyApp/Info.plist: CFBundleVersion is hard-coded to '1'. Set it to $(CURRENT_PROJECT_VERSION) so build numbers/versions from the framework apply.`} />

    <H2>Expo</H2>
    <ParamTable codeFirst={false} head={["Expo workflow", "Works?", "How"]} rows={[
      ["Bare workflow (native folders committed)", "✅", "Same as React Native CLI."],
      ["Continuous Native Generation (native folders generated)", "✅", <>Run <Cmd>npx expo prebuild --platform android --no-install</Cmd> (and/or <C>ios</C>) before fastlane, locally and in CI.</>],
      ["Managed workflow with EAS Build only", "❌", "No native project to build. Keep EAS, or adopt prebuild."],
    ]} />
    <CodeBlock language="yaml" filename=".github/workflows/android-distribution.yml (Expo excerpt)" code={`- run: npm ci
- run: npx expo prebuild --platform android --no-install
- run: bundle exec fastlane android distribute environment:staging`} />
    <p>If <C>android/</C> is missing, <C>android doctor</C> stops with <em>“Android project directory (Expo: run `npx expo prebuild` first)”</em>.</p>

    <H2>Other project shapes</H2>
    <ParamTable codeFirst={false} head={["Project shape", "Works?", "Configuration"]} rows={[
      ["Monorepo (Yarn/npm/pnpm workspaces, Nx)", "✅", <>Set <C>android.project_dir</C> / <C>ios.project_dir</C> (e.g. <C>apps/mobile/android</C>) and matching <C>artifact.glob</C> paths.</>],
      ["Product flavors / multiple app IDs", "✅", <>One <C>gradle_task</C> per environment, or pick per run with <DocLink to="setup/wizard">fastlane setup</DocLink>.</>],
      ["Kotlin DSL (build.gradle.kts)", "✅", "Detected for flavors, build types and the package name."],
      ["Brownfield (RN inside an existing native app)", "✅", <>Point <C>project_dir</C> at the native project; set the exact task, workspace and scheme.</>],
      ["Fully native Android / iOS (no RN)", "✅", "The framework never requires React Native."],
      ["Windows", "Android only", "iOS lanes need macOS + Xcode."],
    ]} />

    <H2>Check a project in 2 minutes</H2>
    <Terminal title="my-app — zsh" lines={`
$ npx react-native --version
$ java -version
$ ruby --version
$ bundle exec fastlane android doctor environment:development
+ Android development configuration is valid.
$ bundle exec fastlane ios doctor environment:development
+ iOS development configuration is valid.`} caption="When both doctor lanes pass, the project is compatible. Every failure names the file or value to fix." />

    <NextSteps cards={[
      { icon: "download", title: "Downloads & tools", desc: "JDK, Node.js, Ruby and more.", to: "get-started/downloads" },
      { icon: "bolt", title: "Add the framework", desc: "Copy it into your project.", to: "get-started/quickstart" },
    ]} />
    <OfficialDocs links={[L.rnEnvironment, L.rnUpgradeHelper, L.agpReleaseNotes, L.expoCng, L.cocoapods, L.androidCmdline]} />
  </>
);

const RubyWindows = () => (
  <>
    <p>Set up Ruby, DevKit and Bundler on Windows so you can run fastlane locally. This follows the approach the <Ext href={L.rubyInstall.href}>official Ruby installation guide</Ext> recommends for Windows: RubyInstaller.</p>

    <H2>Step 1: Install Ruby with DevKit</H2>
    <ToolDownloads ids={["rubyWindows"]} title={null} />
    <p>Download <strong>Ruby+Devkit 3.4.x (x64)</strong> from <Ext href={L.rubyInstaller.href}>rubyinstaller.org</Ext>. Choose the <em>with DevKit</em> package, not the plain one. Many gems that fastlane depends on contain native C extensions, and DevKit (based on MSYS2) provides the compiler toolchain to build them.</p>
    <Steps>
      <Step title="Run the installer">Accept the license, keep <strong>Add Ruby executables to your PATH</strong> and <strong>Associate .rb files</strong> checked.</Step>
      <Step title="Keep the MSYS2 component selected">On the component page, leave <strong>MSYS2 development toolchain</strong> ticked.</Step>
      <Step title="Run ridk install">On the last page, keep <strong>Run 'ridk install'</strong> checked and click <strong>Finish</strong>. A console window opens. Press <kbd>Enter</kbd> to accept the default option.</Step>
    </Steps>
    <Terminal os="windows" title="C:\Ruby34-x64\bin\ridk.cmd" lines={`
 _____       _           _____           _        _ _         _
|  __ \\     | |         |_   _|         | |      | | |       | |
| |__) |   _| |__  _   _  | |  _ __  ___| |_ __ _| | | ___ _ __
|  _  / | | | '_ \\| | | | | | | '_ \\/ __| __/ _\` | | |/ _ \\ '__|
| | \\ \\ |_| | |_) | |_| |_| |_| | | \\__ \\ || (_| | | |  __/ |
|_|  \\_\\__,_|_.__/ \\__, |_____|_| |_|___/\\__\\__,_|_|_|\\___|_|
                    __/ |           _
                   |___/          _|_ _  __   | | o __  _| _     _
                                   | (_)|     |^| | | |(_|(_)\\^/_>

   1 - MSYS2 base installation
   2 - MSYS2 system update (optional)
   3 - MSYS2 and MINGW development toolchain

? Which components shall be installed? If unsure press ENTER [1,3]
> 1,3
+ MSYS2 seems to be properly installed
+ Install MINGW development toolchain succeeded`} caption="The ridk install prompt shown at the end of RubyInstaller. Press Enter to accept [1,3]." />

    <H2>Step 2: Verify Ruby</H2>
    <p>Close every open PowerShell / Command Prompt window, so the new <C>PATH</C> is picked up. Then open a new PowerShell:</p>
    <Terminal os="windows" title="Windows PowerShell" lines={`
PS> ruby --version
ruby 3.4.1 (2024-12-25 revision 48d4efcb85) +PRISM [x64-mingw-ucrt]
PS> gem --version
3.6.2
PS> where.exe ruby
C:\\Ruby34-x64\\bin\\ruby.exe`} />
    <Callout type="note">if <C>where.exe ruby</C> lists more than one path, the first one wins. Remove older Ruby installations from <C>PATH</C> so Windows uses the Ruby you just installed.</Callout>

    <H2>Step 3: Verify DevKit/MSYS2</H2>
    <Terminal os="windows" title="Windows PowerShell" lines={`
PS> ridk version
---
ruby:
  path: C:/Ruby34-x64
  version: 3.4.1
  platform: x64-mingw-ucrt
msys2:
  path: C:\\Ruby34-x64\\msys64
cc: gcc (Rev2, Built by MSYS2 project) 14.2.0
PS> ridk exec pacman --version
 .--.                  Pacman v7.0.0 - libalpm v15.0.0`} />
    <p>You don't need to install extra MSYS2 packages at this point. If a gem later fails with <em>"Failed to build gem native extension"</em>, run <Cmd>ridk install</Cmd> again and choose option 3.</p>

    <H2>Step 4: Update RubyGems</H2>
    <Terminal os="windows" title="Windows PowerShell" lines={`
PS> gem update --system
~ Updating rubygems-update
~ Successfully installed rubygems-update-3.6.2
+ RubyGems system software updated`} />

    <H2>Step 5: Install Bundler</H2>
    <p>fastlane recommends running through Bundler and a Gemfile, so every developer and every CI machine uses exactly the same versions (<Ext href={L.fastlaneBundler.href}>fastlane: use a Gemfile</Ext>).</p>
    <Terminal os="windows" title="Windows PowerShell" lines={`
PS> gem install bundler
+ Successfully installed bundler-2.6.2
~ 1 gem installed
PS> bundle --version
Bundler version 2.6.2`} />
    <Callout type="note">fastlane 2.240.1 requires Bundler &gt;= 2.4 and &lt; 5.0.</Callout>

    <H2>Step 6: Add a .ruby-version file</H2>
    <p>Add a <C>.ruby-version</C> file in your project root. Version managers (rbenv, asdf) and CI actions such as <Ext href={L.setupRuby.href}>ruby/setup-ruby</Ext> read it to select the same Ruby.</p>
    <CodeBlock language="text" filename=".ruby-version" code="3.4.1" />
    <NextSteps cards={[{ icon: "description", title: "Create the Gemfile", desc: "Pin fastlane and its plugins.", to: "get-started/gemfile" }]} />
    <OfficialDocs links={[L.rubyInstaller, L.rubyInstall, L.bundler, L.fastlaneBundler]} />
  </>
);

const RubyMac = () => (
  <>
    <p>Install Ruby on macOS with a version manager. macOS ships a system Ruby, but it is outdated and owned by the OS. Installing gems into it needs <C>sudo</C> and can break system tools, as noted in the <Ext href={L.fastlaneIosSetup.href}>fastlane iOS setup guide</Ext>.</p>
    <Steps>
      <Step title="Install Homebrew (if needed)">
        <ToolDownloads ids={["homebrew"]} title={null} />
        <p>Follow <Ext href={L.homebrew.href}>brew.sh</Ext>, then confirm with <Cmd>brew --version</Cmd>.</p>
      </Step>
      <Step title="Install rbenv and Ruby 3.4.1">
        <Terminal title="my-app — zsh" lines={`
$ brew install rbenv ruby-build
$ rbenv init
# Follow the printed instruction (adds rbenv to ~/.zshrc), then open a new terminal
$ rbenv install 3.4.1
~ ==> Installed ruby-3.4.1 to /Users/you/.rbenv/versions/3.4.1
$ rbenv local 3.4.1
# writes .ruby-version in the project root`} />
      </Step>
      <Step title="Install Bundler">
        <Terminal title="my-app — zsh" lines={`
$ gem install bundler
+ Successfully installed bundler-2.6.2`} />
      </Step>
      <Step title="Verify">
        <Terminal title="my-app — zsh" lines={`
$ which ruby
/Users/you/.rbenv/shims/ruby
$ ruby --version
ruby 3.4.1 (2024-12-25 revision 48d4efcb85) +PRISM [arm64-darwin24]
$ bundle --version
Bundler version 2.6.2`} caption="which ruby must point to ~/.rbenv/shims, not /usr/bin/ruby." />
      </Step>
    </Steps>
    <Callout type="caution">don't use the macOS system Ruby (<C>/usr/bin/ruby</C>) and never run <C>sudo gem install</C>.</Callout>
    <NextSteps cards={[{ icon: "description", title: "Create the Gemfile", desc: "Pin fastlane and its plugins.", to: "get-started/gemfile" }]} />
    <OfficialDocs links={[L.rbenv, L.homebrew, L.rubyInstall, L.fastlaneIosSetup]} />
  </>
);

const Gemfile = () => (
  <>
    <p>The Gemfile declares exactly which gems the project uses. Bundler resolves them once and writes the result to <C>Gemfile.lock</C>, so everyone runs the same fastlane. Create <Ph>&lt;project-root&gt;</Ph><C>/Gemfile</C>:</p>
    <CodeBlock language="ruby" filename="Gemfile" highlight={[3]} code={`source "https://rubygems.org"

gem "fastlane", "2.240.1"

plugins_path = File.join(File.dirname(__FILE__), "fastlane", "Pluginfile")
eval_gemfile(plugins_path) if File.exist?(plugins_path)

# Ruby 3.4 removed these from the default standard library
gem "bigdecimal"; gem "logger"; gem "benchmark"; gem "mutex_m"; gem "nkf"; gem "net-smtp"; gem "fiddle"`} />
    <H2>Why this structure?</H2>
    <ParamTable codeFirst={false} head={["Line", "Purpose"]} rows={[
      [<C>gem "fastlane", "2.240.1"</C>, "Pins fastlane to the version the framework is tested with. Upgrade deliberately, not by accident."],
      [<C>eval_gemfile(plugins_path)</C>, <>Loads <C>fastlane/Pluginfile</C>, where fastlane manages plugins. This is the layout from <Ext href={L.fastlanePlugins.href}>Using fastlane plugins</Ext>.</>],
      [<>bigdecimal, logger, …</>, "Ruby 3.4 moved these out of the default gems. Without them fastlane fails to load with a LoadError."],
    ]} />
    <Callout type="tip">React Native projects already ship a Gemfile with CocoaPods pins (<C>cocoapods</C>, <C>activesupport</C>, <C>xcodeproj</C>). Keep those lines and add the fastlane lines below them.</Callout>
    <OfficialDocs links={[L.gemfile, L.fastlaneBundler, L.fastlanePlugins]} />
  </>
);

const FastlaneDir = () => (
  <>
    <p>Create the <C>fastlane</C> directory and register the Firebase App Distribution plugin. The plugin provides the <C>firebase_app_distribution</C> action that the Android lanes call.</p>
    <H2>Step 1: Create the directory and Pluginfile</H2>
    <CodeBlock tabs={[
      { label: "PowerShell", language: "powershell", code: `New-Item -ItemType Directory -Path fastlane
New-Item -ItemType File -Path fastlane\\Pluginfile` },
      { label: "macOS / Linux", language: "bash", code: "mkdir -p fastlane && touch fastlane/Pluginfile" },
    ]} />
    <H2>Step 2: Add the Firebase plugin</H2>
    <p>Add the plugin to <C>fastlane/Pluginfile</C>. Pinning the version keeps upload behaviour stable across machines:</p>
    <CodeBlock language="ruby" filename="fastlane/Pluginfile" code={`gem "fastlane-plugin-firebase_app_distribution", "1.0.0"`} />
    <p>Your project now looks like this:</p>
    <FileTree tree={`
<project-root>/
├── android/
├── ios/
├── package.json
├── fastlane/
│   └── Pluginfile
├── Gemfile
└── .ruby-version`} />
    <Callout type="note">don't run <C>fastlane init</C> and don't create the Fastfile by hand. The Fastfile and <C>lib/</C> come from the framework (see <DocLink to="get-started/quickstart">Quickstart</DocLink>).</Callout>
    <OfficialDocs links={[L.fastlanePlugins, L.fastlaneFirebasePlugin, L.appDistFastlane]} />
  </>
);

const Install = () => (
  <>
    <p>Install the pinned gems and confirm that fastlane and the plugin load.</p>
    <p>Need Ruby or Bundler first?</p>
    <ToolDownloads ids={["bundler"]} title={null} />
    <H2>Step 1: Install</H2>
    <p>From the project root:</p>
    <Terminal title="my-app — zsh" lines={`
$ bundle config set path vendor/bundle
$ bundle install
~ Fetching gem metadata from https://rubygems.org/.........
~ Resolving dependencies...
~ Fetching fastlane 2.240.1
~ Installing fastlane 2.240.1
~ Fetching fastlane-plugin-firebase_app_distribution 1.0.0
~ Installing fastlane-plugin-firebase_app_distribution 1.0.0
+ Bundle complete! 12 Gemfile dependencies, 108 gems now installed.
+ Bundled gems are installed into \`./vendor/bundle\``} caption="bundle install creates Gemfile.lock. Commit it." />
    <p>This installs fastlane, its dependencies, and the Firebase App Distribution plugin with its dependencies. The optional <Cmd>bundle config set path vendor/bundle</Cmd> keeps the gems inside the project instead of the global gem directory.</p>

    <H2>Step 2: Always use bundle exec</H2>
    <Callout type="warning">from now on, never run plain <C>fastlane …</C> for this project. Always run <Cmd>bundle exec fastlane …</Cmd>. A plain <C>fastlane</C> may pick up a different global version.</Callout>
    <Flow horizontal steps={["Project", "Gemfile", "Gemfile.lock", "exact fastlane version", "same environment locally and in CI"]} />
    <Terminal title="my-app — zsh" lines={`
$ bundle exec fastlane --version
~ fastlane installation at path:
~ ./vendor/bundle/ruby/3.4.0/gems/fastlane-2.240.1/bin/fastlane
~ -----------------------------
+ [✔] 🚀
fastlane 2.240.1`} />

    <H2>Step 3: Check that the Firebase plugin loads</H2>
    <Terminal title="my-app — zsh" lines={`
$ bundle exec fastlane action firebase_app_distribution
~ Loading documentation for firebase_app_distribution:
+------------------------------------------------------------------+
|                    firebase_app_distribution                     |
+------------------------------------------------------------------+
| Release your beta builds with Firebase App Distribution          |
+------------------------------------------------------------------+
| app                      | Your app's Firebase App ID            |
| android_artifact_type    | Android artifact type. Set to 'APK'   |
|                          | or 'AAB'. Defaults to 'APK'           |
| groups                   | Group aliases used for distribution   |
| ...                      | ...                                   |
+------------------------------------------------------------------+`} caption="You should see the action's parameters, not “Could not find action”." />
    <StatusTable head={["Checkpoint", ""]} rows={["Ruby", "Bundler", "fastlane", "Plugin"].map((l) => ({ label: l, cells: ["ok"] }))} />

    <H2>Step 4: Commit the lock file</H2>
    <p><Cmd>bundle install</Cmd> creates <C>Gemfile.lock</C>. Commit both <C>Gemfile</C> and <C>Gemfile.lock</C>. Do not commit <C>vendor/bundle</C>.</p>
    <OfficialDocs links={[L.bundler, L.fastlaneBundler, L.fastlaneFirebasePlugin]} />
  </>
);

const Gitignore = () => (
  <>
    <p>Keep secrets and generated output out of the repository. These entries extend the list from <Ext href={L.fastlaneSourceControl.href}>fastlane's source-control guide</Ext> with the framework's own outputs.</p>
    <CodeBlock language="ignore" filename=".gitignore" code={`.env
.env.*
!.env.example
dist/
vendor/bundle/

# Fastlane generated files
fastlane/report.xml
fastlane/test_output
fastlane/screenshots
fastlane/Preview.html
fastlane/.setup_state.yml

# Credentials
firebase-service-account*.json
service-account*.json
*.p8

# Local match data
fastlane/match`} />
    <Callout type="success" title="Commit these">
      <C>fastlane/config/profiles/*.yml</C> (saved setups), <C>Gemfile.lock</C> and <C>.env.example</C>. They contain no secrets.
    </Callout>
    <Callout type="warning">never put Firebase credentials, <C>.p8</C> keys or tokens in the repository. If one is ever committed, rotate it. Removing the file does not remove it from git history.</Callout>
    <Terminal title="my-app — zsh" lines={`
$ git check-ignore -v .env fastlane/firebase-service-account.json dist/MyApp.apk
.gitignore:1:.env	.env
.gitignore:13:firebase-service-account*.json	fastlane/firebase-service-account.json
.gitignore:4:dist/	dist/MyApp.apk`} caption="git check-ignore confirms which rule ignores each file." />
    <OfficialDocs links={[L.gitignore, L.fastlaneSourceControl, L.fastlaneKeys]} />
  </>
);

const Quickstart = () => (
  <>
    <p>Copy the framework into an existing app, configure it and run your first distribution. Expect about 30 minutes for Android, most of it spent on Firebase setup.</p>
    <H2>Before you begin</H2>
    <p>Complete the <DocLink to="get-started/prerequisites">prerequisites</DocLink> and install Ruby and Bundler.</p>

    <H2>Step 1: Copy the framework</H2>
    <p>From the project root:</p>
    <CodeBlock tabs={[
      { label: "macOS / Linux", language: "bash", code: `git clone --depth 1 https://github.com/Sujay-Dynamisch/Mobile-Fastlane-Framework.git .fastlane-framework
cp -R .fastlane-framework/{fastlane,.github,docs,.env.example,.ruby-version,Gemfile,Gemfile.lock} .
rm -rf .fastlane-framework` },
      { label: "PowerShell", language: "powershell", code: `git clone --depth 1 https://github.com/Sujay-Dynamisch/Mobile-Fastlane-Framework.git .fastlane-framework
"fastlane",".github","docs",".env.example",".ruby-version","Gemfile","Gemfile.lock" | ForEach-Object { Copy-Item ".fastlane-framework\\$_" . -Recurse -Force }
Remove-Item .fastlane-framework -Recurse -Force` },
    ]} />

    <H2>Step 2: Install dependencies</H2>
    <CodeBlock language="bash" code="bundle install" />

    <H2>Step 3: Generate the configuration</H2>
    <p>Run the interactive project wizard. It detects your Android flavors and build types and your iOS schemes, then writes <C>fastlane/config/environments.yml</C>:</p>
    <Terminal title="my-app — zsh" lines={`
$ bundle exec fastlane init_project
? App name [MyApp]:
? Environments (comma separated) [development,staging,uat,production]:
? Enable Android? (y/n) y
Detected flavors: dev, staging, prod
...
+ Wrote fastlane/config/environments.yml
~ Added 9 key(s) to .env.example: FIREBASE_ANDROID_DEVELOPMENT_APP_ID, ...`} caption="Full walkthrough: Interactive setup → Initialize a project." />
    <p>Prefer editing by hand? See <DocLink to="android/environments">Configure Android environments</DocLink>.</p>

    <H2>Step 4: Create your .env</H2>
    <CodeBlock tabs={[
      { label: "macOS / Linux", language: "bash", code: "cp .env.example .env" },
      { label: "PowerShell", language: "powershell", code: "Copy-Item .env.example .env" },
    ]} />
    <p>Fill in the values. See <DocLink to="configure/env-vars">Environment variables &amp; secrets</DocLink>.</p>

    <H2>Step 5: Set up Firebase</H2>
    <p>Follow <DocLink to="android/firebase">Set up Firebase App Distribution</DocLink>. AI tests are optional: either follow the <DocLink to="android/app-testing-agent">App Testing agent</DocLink> page, or set <C>app_testing.enabled: false</C>.</p>

    <H2>Step 6: Validate, then distribute</H2>
    <Terminal title="my-app — zsh" lines={`
$ bundle exec fastlane android doctor environment:development
~ [14:47:49]: --- Android Distribution Doctor ---
~ [14:48:03]: Flavor mode: disabled
~ [14:48:03]: Firebase App Testing Agent: ENABLED (1 test case ID(s) configured)
+ [14:48:03]: Android development configuration is valid.
$ bundle exec fastlane setup
? What do you want to do?
> Create new setup`} caption="doctor checks everything before the first real build; setup then runs it." />
    <Callout type="success" title="Auto-detected values">when left empty, the framework detects:
      <ul className="mt-2">
        <li>the app name (<C>app.json</C> → <C>strings.xml</C> → <C>package.json</C>)</li>
        <li>the package/bundle id (<C>google-services.json</C> → <C>build.gradle</C>)</li>
        <li>the Firebase app id (<C>google-services.json</C>)</li>
        <li>the iOS workspace (<C>ios/*.xcworkspace</C>)</li>
        <li>the iOS scheme (project name)</li>
      </ul>
    </Callout>
    <NextSteps cards={[
      { icon: "terminal", title: "Interactive setup", desc: "Profiles, flavors and APK/AAB per run.", to: "setup" },
      { icon: "android", title: "Android overview", desc: "Gradle → Firebase → AI tests.", to: "android" },
    ]} />
    <OfficialDocs links={[L.fastlaneAndroidSetup, L.appDistFastlane, L.fastlaneIosSetup]} />
  </>
);

void H3;

export const overviewPages: DocPage[] = [
  { slug: "", title: "Introduction", description: "A reusable, configuration-driven Fastlane setup that builds, distributes and AI-tests mobile apps.", body: Intro },
  { slug: "overview/capabilities", title: "What the framework does", description: "Capabilities of the framework for Android and iOS.", body: Capabilities },
  { slug: "overview/how-it-works", title: "How a distribution run works", description: "The Android and iOS distribution pipelines step by step.", body: HowItWorks },
  { slug: "overview/folder-structure", title: "Folder structure", description: "Every file the framework adds to your project.", body: FolderStructure },
];

export const startPages: DocPage[] = [
  { slug: "get-started/prerequisites", title: "Prerequisites", description: "Tools you need for Android and iOS builds, with official installation guides.", body: Prereqs },
  { slug: "get-started/react-native-compatibility", title: "React Native compatibility", description: "Which React Native and Expo versions work, and what older projects need.", body: RnCompat },
  { slug: "get-started/downloads", title: "Downloads & tools", description: "Every installer, install command and console you need, in one place.", body: Downloads },
  { slug: "get-started/ruby-windows", title: "Install Ruby (Windows)", description: "Install Ruby 3.4 with DevKit, RubyGems and Bundler on Windows.", body: RubyWindows },
  { slug: "get-started/ruby-macos", title: "Install Ruby (macOS)", description: "Install Ruby 3.4 with Homebrew and rbenv on macOS.", body: RubyMac },
  { slug: "get-started/gemfile", title: "Create the Gemfile", description: "Pin fastlane and load plugins from the Pluginfile.", body: Gemfile },
  { slug: "get-started/fastlane-directory", title: "Create the fastlane directory & plugin", description: "Create fastlane/Pluginfile with the Firebase plugin.", body: FastlaneDir },
  { slug: "get-started/install", title: "Install & verify dependencies", description: "Run bundle install and verify fastlane and the plugin.", body: Install },
  { slug: "get-started/gitignore", title: "Configure .gitignore", description: "Keep secrets and build output out of git.", body: Gitignore },
  { slug: "get-started/quickstart", title: "Add the framework to your project", description: "Copy the framework, configure it and run your first distribution.", body: Quickstart },
];

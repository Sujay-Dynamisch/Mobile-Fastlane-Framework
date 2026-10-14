import { Badge, Callout, CardGrid, CodeBlock, DocLink, Ext, Icon, NextSteps, OfficialDocs, ParamTable, Ph, StatusTable, Steps, Step, Terminal, Cmd } from "@/components/docs/ui";
import { ConsoleButtons, ToolDownloads } from "@/components/docs/downloads";
import { AppleRegisterDevicesShot, AscApiKeysShot, AscNewAppShot, AscTestflightBuildsShot, FirebaseIosAppShot, FirebaseTestersShot, XcodeAccountsShot, XcodeSharedSchemeShot } from "@/components/docs/ios-mockups";
import { C, H2, H3, type DocPage } from "./helpers";
import { L } from "./links";

/* ============================== Android ============================== */

const AndroidOverview = () => (
  <>
    <p>Gradle build → <Ext href={L.appDistribution.href}>Firebase App Distribution</Ext> → optional App Testing agent → Teams/e-mail report. The Android lanes use the Gradle wrapper in your project and the official <Ext href={L.fastlaneFirebasePlugin.href}>firebase_app_distribution</Ext> fastlane plugin.</p>
    <CardGrid cards={[
      { icon: "tune", title: "Configure Android environments", desc: "Gradle tasks, flavors, APK/AAB and Firebase targets.", to: "android/environments" },
      { icon: "cloud_upload", title: "Set up Firebase App Distribution", desc: "Register the app, groups and authentication.", to: "android/firebase" },
      { icon: "smart_toy", title: "App Testing agent (AI tests)", desc: "Natural-language tests on real devices.", to: "android/app-testing-agent" },
      { icon: "send", title: "Build and distribute", desc: "doctor, info, build and distribute lanes.", to: "android/distribute" },
    ]} />
    <H2>Lane map</H2>
    <ParamTable head={["Lane", "Builds?", "Uploads?", "Typical use"]} rows={[
      ["android doctor", "No", "No", "Validate configuration and credentials before anything else"],
      ["android info", "No", "No", "Print the resolved configuration (no secrets)"],
      ["android build", "Yes", "No", <>Produce a signed APK/AAB in <C>dist/</C></>],
      ["android distribute", "Yes", "Yes", "Build → Firebase → AI tests → notifications"],
      ["setup / run_profile", "Yes", "Optional", <>Same lanes, with choices from the <DocLink to="setup">interactive setup</DocLink></>],
    ]} />
    <Callout type="caution">the <C>release</C> build type in many React Native templates is signed with the debug keystore. That is fine for Firebase testers but not for Google Play. Configure a real <C>signingConfigs.release</C> before production or Play distribution (<Ext href={L.rnSignedApk.href}>React Native: signed APK/AAB</Ext>, <Ext href={L.androidSigning.href}>Android: sign your app</Ext>).</Callout>
    <OfficialDocs links={[L.appDistFastlane, L.fastlaneAndroidSetup, L.androidCmdline, L.androidSigning]} />
  </>
);

const AndroidEnv = () => (
  <>
    <p>The <C>android</C> block of <C>fastlane/config/environments.yml</C> defines how each environment is built and where it is distributed. You can generate it with <DocLink to="setup/init-project"><C>fastlane init_project</C></DocLink> or write it by hand.</p>
    <CodeBlock language="yaml" filename="fastlane/config/environments.yml" highlight={[10]} code={`android:
  enabled: true
  project_dir: "android"
  use_flavors: false            # true when build.gradle defines productFlavors
  build:
    clean_before_build: false   # run \`gradle clean\` first
    gradle_options: ""          # e.g. "--no-daemon --stacktrace"
  environments:
    development:
      gradle_task: "assembleRelease"   # ★ source of truth – exact Gradle task
      artifact:
        type: "APK"                    # APK or AAB
        glob: "android/app/build/outputs/apk/release/*.apk"
      firebase:
        enabled: true
        app_id: "\${FIREBASE_ANDROID_DEV_APP_ID}"   # empty → read from google-services.json
        groups: "\${FIREBASE_ANDROID_DEV_GROUPS}"   # tester group aliases, comma-separated
        testers: ""                                # or tester e-mails, comma-separated
      app_testing:
        enabled: true                  # AI tests for this environment
      release_notes: { enabled: true, source: "git", commit_count: 10 }
      notifications: { teams: { enabled: true }, slack: { enabled: false } }`} />

    <H2>Key reference</H2>
    <ParamTable head={["Key", "Required", "Description"]} rows={[
      ["gradle_task", "Yes", <>Exact Gradle task to run. The framework never guesses this: it is the source of truth.</>],
      ["artifact.type", "Yes", <><C>APK</C> or <C>AAB</C>. Passed to Firebase as <C>android_artifact_type</C>.</>],
      ["artifact.glob", "Yes", "Glob, relative to the project root, that matches the file Gradle produces."],
      ["flavor / build_type", "No", <>Informational (shown by <C>doctor</C>/<C>info</C>), and used by the interactive setup.</>],
      ["firebase.app_id", "When enabled", <>Firebase App ID (<C>1:123…:android:abc…</C>). Detected from <C>google-services.json</C> when empty.</>],
      ["firebase.groups / testers", "One of them", "Group aliases or e-mail addresses, comma-separated."],
      ["app_testing.enabled", "No", <>Runs the <DocLink to="android/app-testing-agent">App Testing agent</DocLink> after upload (APK only).</>],
    ]} />

    <H2>No-flavor project</H2>
    <p>If Gradle only exposes <C>assembleDebug</C>, <C>assembleRelease</C> and <C>bundleRelease</C>, keep <C>use_flavors: false</C> and set <C>gradle_task: "assembleRelease"</C>.</p>
    <Callout type="note">in that case development, staging and production can all ship the same Release APK, and only the Firebase destination or group differs. That is intentional. For truly isolated environments (separate app IDs and backends), add product flavors.</Callout>

    <H2>Flavor project</H2>
    <p>If <C>android/app/build.gradle</C> defines <Ext href={L.androidVariants.href}>product flavors</Ext>, Gradle creates one task per flavor and build type combination:</p>
    <CodeBlock language="text" filename="android/app/build.gradle" code={`android {
    flavorDimensions "env"
    productFlavors {
        dev     { dimension "env"; applicationIdSuffix ".dev" }
        staging { dimension "env"; applicationIdSuffix ".staging" }
        prod    { dimension "env" }
    }
}`} />
    <p>Set <C>use_flavors: true</C> and configure each environment with the matching task:</p>
    <CodeBlock language="yaml" code={`staging:
  flavor: "staging"
  build_type: "release"
  gradle_task: "assembleStagingRelease"
  artifact:
    type: "APK"
    glob: "android/app/build/outputs/apk/staging/release/*.apk"`} />
    <p>The explicit <C>gradle_task</C> always wins. To see every task your project actually has, ask Gradle:</p>
    <Terminal title="my-app/android — zsh" lines={`
$ ./gradlew tasks --all | grep -E "^(assemble|bundle).*Release "
assembleDevRelease - Assembles main output for variant devRelease
assembleProdRelease - Assembles main output for variant prodRelease
assembleStagingRelease - Assembles main output for variant stagingRelease
bundleDevRelease - Assembles bundle for variant devRelease
bundleProdRelease - Assembles bundle for variant prodRelease
bundleStagingRelease - Assembles bundle for variant stagingRelease`} caption="On Windows use .\gradlew.bat tasks --all | Select-String Release." />

    <H2>Common Gradle task / glob combinations</H2>
    <ParamTable codeFirst={false} head={["Project type", "gradle_task", "artifact.glob"]} rows={[
      ["No flavors, APK", <C>assembleRelease</C>, <C>android/app/build/outputs/apk/release/*.apk</C>],
      ["No flavors, AAB", <C>bundleRelease</C>, <C>android/app/build/outputs/bundle/release/*.aab</C>],
      ["Flavor dev, APK", <C>assembleDevRelease</C>, <C>android/app/build/outputs/apk/dev/release/*.apk</C>],
      ["Flavor prod, AAB", <C>bundleProdRelease</C>, <C>android/app/build/outputs/bundle/prodRelease/*.aab</C>],
      ["Custom variant", <>e.g. <C>assembleInternalQaRelease</C></>, "matching output folder"],
    ]} />

    <H2>APK or AAB?</H2>
    <ParamTable codeFirst={false} head={["", "APK", "AAB"]} rows={[
      ["Install directly from Firebase", "Yes", "Only if the Firebase project is linked to Google Play"],
      ["App Testing agent (AI tests)", "Yes", "No"],
      ["Google Play upload", "Legacy only", <>Required format (<Ext href={L.androidBundle.href}>About App Bundles</Ext>)</>],
    ]} />
    <Callout type="tip"><C>doctor</C> checks that the task really exists (<C>gradlew tasks --all</C>) before a long build starts.</Callout>
    <NextSteps cards={[{ icon: "cloud_upload", title: "Set up Firebase App Distribution", desc: "Register the app and testers.", to: "android/firebase" }]} />
    <OfficialDocs links={[L.androidVariants, L.androidCmdline, L.androidBundle, L.fastlaneGradle]} />
  </>
);

const AndroidFirebase = () => (
  <>
    <p>Connect your Android app to Firebase App Distribution so the framework can upload builds and notify testers. This page follows Google's guide <Ext href={L.appDistFastlane.href}>Distribute Android apps to testers using fastlane</Ext>.</p>

    <H2>Step 1: Register the app in Firebase</H2>
    <ConsoleButtons ids={["firebase", "firebaseSettings"]} />
    <Steps>
      <Step title="Open the Firebase console">Go to <Ext href="https://console.firebase.google.com/">console.firebase.google.com</Ext> and select (or create) your project.</Step>
      <Step title="Add an Android app">Click <strong>Add app → Android</strong> and enter the package name. It must match <C>applicationId</C> in <C>android/app/build.gradle</C> exactly, including any flavor suffix such as <C>.staging</C> (<Ext href={L.firebaseAndroidSetup.href}>Add Firebase to Android</Ext>).</Step>
      <Step title="Copy the App ID">Open <strong>Project settings → General → Your apps</strong>, copy the <strong>App ID</strong> (<C>1:1234567890:android:abc123…</C>) and put it in <C>FIREBASE_ANDROID_&lt;ENV&gt;_APP_ID</C>.</Step>
    </Steps>
    <Callout type="caution">registering the wrong package name is the most common setup error. Each flavor with its own <C>applicationIdSuffix</C> needs its own Firebase app.</Callout>

    <H2>Step 2: Create a tester group</H2>
    <ConsoleButtons ids={["appDistribution"]} />
    <p>In <strong>App Distribution → Testers &amp; Groups</strong>, create a group (e.g. <Ph>qa-team</Ph>) and add people. Then put the group <strong>alias</strong> (not the display name) in <C>FIREBASE_ANDROID_&lt;ENV&gt;_GROUPS</C>. See <Ext href={L.appDistTesters.href}>Manage testers and groups</Ext>.</p>

    <H2>Step 3: Authenticate</H2>
    <H3>Option A: User token (recommended)</H3>
    <ToolDownloads ids={["firebaseCli", "node"]} title="Install the Firebase CLI first" />
    <p>Required for AI tests. Install the <Ext href={L.firebaseCli.href}>Firebase CLI</Ext>, then sign in with the account that opted in to App Testing:</p>
    <Terminal title="my-app — zsh" lines={`
$ npm install -g firebase-tools
$ firebase login:ci
~ Visit this URL on this device to log in:
~ https://accounts.google.com/o/oauth2/auth?client_id=563584335869-...
~ Waiting for authentication...
+ ✔  Success! Use this token to login on a CI server:

1//0gXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

~ Example: firebase deploy --token "$FIREBASE_TOKEN"`} caption="Copy the printed 1//… value into FIREBASE_TOKEN in .env (or a CI secret)." />
    <Callout type="warning">treat the token like a password. It acts as your Google account for Firebase.</Callout>

    <H3>Option B: Service account</H3>
    <ConsoleButtons ids={["gcpServiceAccounts"]} />
    <p>Upload and distribution only (no AI tests). In <strong>Google Cloud → IAM &amp; Admin → Service accounts</strong>, create e.g. <Ph>fastlane-distribution</Ph> (<Ext href={L.gcpServiceAccount.href}>Create service accounts</Ext>) with these roles:</p>
    <ParamTable codeFirst={false} head={["Role", "Why"]} rows={[
      ["Firebase App Distribution Admin", "upload releases, manage testers/groups"],
      ["Firebase Test Lab Admin", "device runs"],
      ["Gemini for Google Cloud User", "App Testing agent runs on Gemini"],
      ["Service Usage Consumer", "call enabled APIs"],
    ]} />
    <p>Create a JSON key (<Ext href={L.gcpKeys.href}>Create service account keys</Ext>), save it as <C>fastlane/firebase-service-account-&lt;name&gt;.json</C> (git-ignored) and point <C>FIREBASE_SERVICE_CREDENTIALS_FILE</C> at it.</p>

    <H2>Step 4: Enable the APIs</H2>
    <ConsoleButtons ids={["gcpApis"]} />
    <p>In Google Cloud → <strong>APIs &amp; Services → Library</strong>, enable the following for the Firebase project (<Ext href={L.gcpEnableApis.href}>Enable an API</Ext>):</p>
    <ul>
      <li>Firebase App Distribution API</li>
      <li>Cloud Testing API</li>
      <li>Cloud Tool Results API</li>
      <li>Gemini for Google Cloud API</li>
    </ul>

    <H2>Step 5: Verify</H2>
    <Terminal title="my-app — zsh" lines={`
$ bundle exec fastlane android doctor environment:staging
~ [09:31:20]: --- Android Distribution Doctor ---
~ [09:31:34]: Flavor mode: disabled
~ [09:31:34]: Firebase App Testing Agent: ENABLED (1 test case ID(s) configured)
+ [09:31:34]: Android staging configuration is valid.`} />
    <NextSteps cards={[
      { icon: "smart_toy", title: "App Testing agent", desc: "Add AI tests on real devices.", to: "android/app-testing-agent" },
      { icon: "send", title: "Build and distribute", desc: "Run the lanes.", to: "android/distribute" },
    ]} />
    <OfficialDocs links={[L.appDistFastlane, L.firebaseAndroidSetup, L.appDistTesters, L.firebaseCli, L.gcpServiceAccount, L.gcpEnableApis]} />
  </>
);

function ReportCardMock() {
  const Stat = ({ k, v, cls }: { k: string; v: string; cls?: string }) => (
    <div className="rounded-lg bg-surface-variant px-3 py-2 text-center">
      <div className={`font-display text-[22px] ${cls ?? ""}`}>{v}</div>
      <div className="text-[12px] text-muted-foreground">{k}</div>
    </div>
  );
  return (
    <div className="my-6 max-w-xl overflow-hidden rounded-xl border bg-surface shadow-card text-[14px]">
      <div className="flex items-center justify-between gap-2 border-b bg-success-bg px-4 py-3">
        <div className="flex items-center gap-2 font-medium"><Icon name="smart_toy" /> App Testing Agent Report</div>
        <span className="font-medium text-success-text">✅ PASSED</span>
      </div>
      <div className="space-y-4 p-4">
        <div className="grid grid-cols-4 gap-2">
          <Stat k="Total" v="4" /><Stat k="Passed" v="4" cls="text-success-text" /><Stat k="Failed" v="0" /><Stat k="Duration" v="3m 12s" />
        </div>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
          {[["Platform", "Android"], ["Environment", "staging"], ["Version", "1.0.0"], ["Build", "42"], ["Artifact", "MyApp-staging-v1.0.0-42.apk"], ["Branch", "main"], ["Commit", "a1b2c3d"], ["Triggered by", "GitHub Actions"]].map(([k, v]) => (
            <div key={k} className="contents"><dt className="text-muted-foreground">{k}</dt><dd className="font-mono text-[13px] break-all">{v}</dd></div>
          ))}
        </dl>
        <div>
          <p className="mb-1! font-medium">Test cases</p>
          <ul className="list-none! pl-0!"><li>✅ first-test-case</li><li>✅ login-flow</li></ul>
        </div>
        <div>
          <p className="mb-1! font-medium">Test Devices (2)</p>
          <ul className="list-none! pl-0! text-muted-foreground"><li>Galaxy A54 · Android 14 · Portrait · Landscape</li><li>Pixel 9 · Android 16 · Portrait</li></ul>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-primary px-4 py-1.5 text-[13px] font-medium text-primary-foreground">View Firebase Results</span>
          <span className="rounded-full border px-4 py-1.5 text-[13px] font-medium text-primary">View CI Run</span>
        </div>
      </div>
    </div>
  );
}

const AppTestingAgent = () => (
  <>
    <p>The <Ext href={L.appTestingAgent.href}>App Testing agent</Ext> (preview, powered by Gemini in Firebase) runs natural-language test cases on real devices after each upload. You describe a goal such as "log in and open the patient list", and the agent drives the app to reach it.</p>
    <H2>Before you begin</H2>
    <p>Complete the <DocLink to="android/firebase">Firebase setup</DocLink> page and use <C>FIREBASE_TOKEN</C> authentication. The build must be an <strong>APK</strong>.</p>
    <H2>Step 1: Opt in</H2>
    <p>The project owner goes to <strong>Firebase Console → App Distribution → your app → Test cases</strong> and accepts the App Testing / Gemini in Firebase terms.</p>
    <H2>Step 2: Create test cases</H2>
    <p>Create test cases in the console, with a goal, a hint and success criteria for each step. Copy each test case ID into <DocLink to="configure/test-case-ids"><C>fastlane/config/test_case_ids.yml</C></DocLink>.</p>
    <H2>Step 3: Choose devices</H2>
    <p>Choose devices in <DocLink to="configure/testing-yml"><C>fastlane/config/testing.yml</C></DocLink>. Each test case runs once per device and orientation, and each run counts toward the quota.</p>
    <H2>Step 4: Use FIREBASE_TOKEN</H2>
    <p>Use <C>FIREBASE_TOKEN</C> from the account that opted in.</p>
    <Callout type="warning">service accounts are rejected with <C>403 PERMISSION_DENIED</C>, even with every IAM role.</Callout>
    <H2>Step 5: Test login (optional)</H2>
    <p>If a test signs in, set <C>FIREBASE_TEST_USERNAME</C> / <C>FIREBASE_TEST_PASSWORD</C>. Use a dedicated test account, never a real user's.</p>
    <H2>Step 6: Run and view results</H2>
    <Terminal title="my-app — zsh" lines={`
$ bundle exec fastlane android distribute environment:staging
~ [14:07:00]: --- Firebase App Testing Agent ---
~ [14:07:00]: Test cases: login-flow, first-test-case
~ [14:07:00]: Devices: Galaxy A54 (API 34, portrait, landscape), Pixel 9 (API 36, portrait)
~ [14:07:02]: Waiting for AI test results (blocking: true)...
+ [14:10:12]: ✅ login-flow       Galaxy A54 · Android 14 · Portrait   PASSED
+ [14:10:12]: ✅ login-flow       Galaxy A54 · Android 14 · Landscape  PASSED
+ [14:10:12]: ✅ first-test-case  Pixel 9 · Android 16 · Portrait      PASSED
~ [14:10:13]: Results: https://console.firebase.google.com/project/my-app/appdistribution/...
+ [14:10:14]: App Testing Agent report sent to Teams and e-mail.`} caption="With blocking: true, a failed test fails the lane." />
    <p>Each run produces a Teams "App Testing Agent Report" Adaptive Card with:</p>
    <ul>
      <li>a header with status (✅ PASSED / ❌ FAILED)</li>
      <li>Total / Passed / Failed / Duration stat tiles</li>
      <li>build details: platform, environment, version, build, artifact, branch, commit, triggered by</li>
      <li>a per-test-case ✅/❌ list</li>
      <li>a "Test Devices (N)" list with friendly names (e.g. Galaxy A54 · Android 14 · Portrait · Landscape)</li>
      <li>failure details, when there are any</li>
      <li>"View Firebase Results" and "View CI Run" buttons</li>
    </ul>
    <p>The same report is also sent as an HTML e-mail.</p>
    <ReportCardMock />
    <H2>Known limitations</H2>
    <Callout type="caution" title="Limitations">
      <ul className="mt-2">
        <li><strong>Quota:</strong> 200 tests / month / project during preview. One test = one test case × one device, so 10 devices × 1 test case = 10 tests per distribution.</li>
        <li><strong>Timeout:</strong> 5 minutes per test.</li>
        <li><C>FLAG_SECURE</C> blocks the agent, which then sees a blank screen. If your app sets <C>FLAG_SECURE</C>, disable it for dev/staging builds.</li>
        <li><strong>APK only:</strong> AAB builds skip AI tests.</li>
        <li><C>blocking: false</C> uploads and starts the tests, but doesn't wait for (or fail on) results.</li>
      </ul>
    </Callout>
    <p>Preview features and quotas change. Check the <Ext href={L.appTestingAgent.href}>official App Testing agent page</Ext> for current limits.</p>
    <OfficialDocs links={[L.appTestingAgent, L.appDistribution, L.firebaseCli]} />
  </>
);

const AndroidDistribute = () => (
  <>
    <p>Run the Android lanes through Bundler from the project root. Start with <C>doctor</C>: it catches configuration mistakes in seconds, before a multi-minute Gradle build.</p>
    <Steps>
      <Step title={<Cmd>bundle exec fastlane android doctor environment:staging</Cmd>}>
        Validates config, Gradle wrapper, Gradle task, artifact type, Firebase app id/groups/credentials and AI test setup.
        <Terminal title="my-app — zsh" lines={`
$ bundle exec fastlane android doctor environment:staging
~ [14:47:49]: --- Android Distribution Doctor ---
~ [14:48:03]: Flavor mode: disabled
~ [14:48:03]: Firebase App Testing Agent: ENABLED (1 test case ID(s) configured, devices: model=a54x,version=34,...)
+ [14:48:03]: Android staging configuration is valid.`} />
      </Step>
      <Step title={<Cmd>bundle exec fastlane android info environment:staging</Cmd>}>
        Prints the resolved configuration. Secrets are never printed.
        <Terminal title="my-app — zsh" lines={`
$ bundle exec fastlane android info environment:staging
~ [14:48:03]: --- Android Distribution Information ---
Project: MyApp
Environment: staging
Project directory: /Users/you/my-app/android
Flavor mode: false
Gradle task: assembleRelease
Artifact type: APK
Artifact glob: android/app/build/outputs/apk/release/*.apk
Firebase enabled: true
Firebase App Testing Agent: ENABLED`} />
      </Step>
      <Step title={<Cmd>bundle exec fastlane android build environment:staging</Cmd>}>
        Runs the Gradle build, finds the artifact and copies it to <C>dist/</C> under a readable name.
        <Terminal title="my-app — zsh" lines={`
$ bundle exec fastlane android build environment:staging
~ [14:02:11]: --- Android Build — STAGING ---
~ [14:02:11]: Gradle project: /Users/you/my-app/android
~ [14:02:11]: Gradle task: assembleRelease
~ [14:06:40]: BUILD SUCCESSFUL in 4m 29s
+ [14:06:41]: Android build completed.
~ [14:06:41]: Artifact: dist/MyApp-staging-v1.4.0-57.apk`} />
      </Step>
      <Step title={<Cmd>bundle exec fastlane android distribute environment:staging</Cmd>}>The full pipeline (see <DocLink to="overview/how-it-works">How it works</DocLink>).</Step>
    </Steps>
    <H2>Shortcuts and options</H2>
    <ParamTable head={["Option / lane", "Effect"]} rows={[
      ["android development | staging | uat | production", <>Shortcut for <C>distribute environment:&lt;name&gt;</C></>],
      ["environment:<name>", <>Selects the environment (default: <C>APP_ENV</C>, then <C>project.default_environment</C>)</>],
      ['gradle_flags:"--stacktrace"', <>Overrides <C>android.build.gradle_options</C> for one run</>],
    ]} />
    <CodeBlock language="bash" code={`bundle exec fastlane android staging
bundle exec fastlane android distribute environment:staging gradle_flags:"--stacktrace"`} />
    <Callout type="tip">prefer menus? <Cmd>bundle exec fastlane setup</Cmd> (see <DocLink to="setup/wizard">the setup wizard</DocLink>) asks for the environment, flavor and APK/AAB, then runs these same lanes.</Callout>
    <OfficialDocs links={[L.appDistFastlane, L.fastlaneGradle, L.androidCmdline]} />
  </>
);

/* ============================== iOS ============================== */

const IosOverview = () => (
  <>
    <p>Xcode → signed IPA → <Ext href={L.appDistribution.href}>Firebase App Distribution</Ext> (Ad Hoc) <strong>and/or</strong> <Ext href={L.testflight.href}>TestFlight</Ext> → Teams notification. The lanes use the standard fastlane actions <Ext href={L.fastlaneBuildApp.href}>build_app</Ext>, <Ext href={L.fastlaneFirebasePlugin.href}>firebase_app_distribution</Ext> and <Ext href={L.fastlaneTestflight.href}>upload_to_testflight</Ext>.</p>
    <H2>Two independent channels</H2>
    <ParamTable codeFirst={false} head={["", "Firebase App Distribution", "TestFlight"]} rows={[
      ["Lane", <C>ios firebase</C>, <><C>ios distribute</C> (or <C>ios development|staging|uat|production</C>)</>],
      ["Export method", <C>ad-hoc</C>, <C>app-store</C>],
      ["Who can install", "Testers whose device UDID is in the Ad Hoc profile", "Internal testers (no review) or external groups (beta review)"],
      ["Signing on a Mac", "Apple ID signed in to Xcode — no API key needed", "App Store Connect API key"],
      ["Signing on CI", "App Store Connect API key", "App Store Connect API key"],
      ["Needs an App Store Connect app record", "No", "Yes"],
      ["Production", "Never (disabled for production)", "Yes — the production channel"],
    ]} />
    <p><C>ios doctor</C> reports each channel as <strong>READY</strong> or <strong>NOT READY</strong> and only fails when neither is configured, so you can start with Firebase and add TestFlight later without touching code.</p>
    <H2>Status</H2>
    <StatusTable head={["Channel", "", "Status"]} rows={[
      { label: "Firebase App Distribution", cells: ["ok", "Verified on a Mac: build → Ad Hoc signing → upload → testers"] },
      { label: "TestFlight", cells: ["warn", <>Set up (app record + API key) on a real project; <strong>the first upload hasn't been verified yet</strong>. Use <DocLink to="ios/first-run">the first-run checklist</DocLink>.</>] },
      { label: "iOS on GitHub Actions", cells: ["warn", <>Workflow ready, not run yet. See <DocLink to="ci/github-actions">GitHub Actions</DocLink>.</>] },
    ]} />
    <CardGrid cards={[
      { icon: "tune", title: "Configure iOS environments", desc: "Workspace, scheme, bundle id, TestFlight and Firebase.", to: "ios/environments" },
      { icon: "verified_user", title: "Code signing", desc: "Xcode Apple ID, API key or match.", to: "ios/signing" },
      { icon: "cloud_upload", title: "Firebase App Distribution (Ad Hoc)", desc: "Register the iOS app, testers and devices.", to: "ios/firebase" },
      { icon: "checklist", title: "First run on a Mac", desc: "Mac setup, Podfile fixes and the first TestFlight upload.", to: "ios/first-run" },
      { icon: "send", title: "Build and distribute", desc: "doctor, info, build, firebase and distribute lanes.", to: "ios/distribute" },
    ]} />
    <Callout type="caution">iOS lanes need macOS with Xcode. On Windows/Linux they stop with "iOS lanes require macOS with Xcode installed".</Callout>
    <OfficialDocs links={[L.fastlaneIosSetup, L.appDistIosFastlane, L.fastlaneAscApi, L.testflight, L.appleDistribution]} />
  </>
);

const IosEnv = () => (
  <>
    <p>The <C>ios</C> block of <C>fastlane/config/environments.yml</C>. <Ph>MyApp</Ph> and <Ph>com.example.myapp</Ph> are placeholders. <DocLink to="setup/init-project"><C>fastlane init_project</C></DocLink> writes this block for you, and asks per environment whether to use TestFlight and/or Firebase.</p>
    <CodeBlock language="yaml" filename="fastlane/config/environments.yml" code={`ios:
  enabled: true                  # false on machines without Xcode
  project_dir: "ios"
  build:
    install_pods: true           # runs \`pod install\` (creates the .xcworkspace)
  signing:
    method: "automatic"          # automatic | match
    team_id: "\${APPLE_TEAM_ID}"
    type: "appstore"             # match only
    readonly_in_ci: true         # match only: never create certs from CI
    update_project_signing: false
  environments:
    development:
      workspace: "ios/MyApp.xcworkspace"
      scheme: "MyApp"            # must be a *Shared* scheme
      bundle_identifier: "com.example.myapp"
      export_method: "app-store" # TestFlight channel
      versioning:
        auto_increment_build_number: true
      testflight:
        enabled: true
        groups: []               # empty = internal testers only
        notify_external_testers: true
        skip_waiting_for_build_processing: true   # forced false when groups are set
      firebase:                  # \`fastlane ios firebase\` (Ad Hoc). Omit or enabled: false to skip
        enabled: true            # keep false for production
        export_method: "ad-hoc"
        app_id: "\${FIREBASE_IOS_DEV_APP_ID}"
        groups: "\${FIREBASE_IOS_DEV_GROUPS}"
        testers: ""`} />
    <H2>Key reference</H2>
    <ParamTable head={["Key", "Description"]} rows={[
      ["workspace", <>Path to the <C>.xcworkspace</C> created by CocoaPods (<Ext href={L.cocoapods.href}>CocoaPods guide</Ext>).</>],
      ["scheme", <>A <strong>shared</strong> scheme, so it exists in git under <C>xcshareddata</C> (<Ext href={L.xcodeSchemes.href}>Apple: build schemes</Ext>).</>],
      ["bundle_identifier", "Must match the App Store Connect app record and the Firebase iOS app."],
      ["export_method", <><C>app-store</C> for TestFlight. The Firebase channel uses <C>firebase.export_method</C> (<C>ad-hoc</C>) instead.</>],
      ["testflight.groups", "External tester groups. Empty = internal testers only (no beta review)."],
      ["firebase.enabled", <>Turns on <C>ios firebase</C> for this environment. Keep it <C>false</C> for production.</>],
      ["firebase.app_id", <><C>1:123…:ios:abc…</C> from Firebase → Project settings → your iOS app.</>],
      ["firebase.groups / testers", <>Tester group <strong>aliases</strong> or e-mails, comma-separated. If both are empty, the build uploads but goes to nobody.</>],
    ]} />
    <Callout type="tip">environments that share one bundle id (development, staging, uat) can share one Firebase iOS app. For truly isolated environments use separate schemes and bundle ids (<Ph>MyApp-Staging</Ph>, <Ph>com.example.myapp.staging</Ph>), each with its own Firebase app.</Callout>
    <OfficialDocs links={[L.xcodeSchemes, L.cocoapods, L.fastlaneBuildApp, L.fastlaneTestflight, L.appDistIosFastlane]} />
  </>
);

const IosSigning = () => (
  <>
    <p>Choose how the framework signs your IPA with <C>ios.signing.method</C>. If you are new to iOS signing, read fastlane's <Ext href={L.fastlaneCodesigning.href}>code signing guide</Ext> first.</p>
    <ParamTable head={["method", "What happens", "You need"]} rows={[
      [<><C>automatic</C> <Badge variant="optional">default</Badge></>, <><C>xcodebuild -allowProvisioningUpdates</C> creates/downloads the distribution certificate and profile. It uses the App Store Connect API key when set, otherwise the Apple ID signed in to Xcode.</>, <>API key with Admin (or App Manager + cloud-managed certificates) role and <C>APPLE_TEAM_ID</C>; for local Firebase builds an Apple ID in Xcode is enough</>],
      ["match", <><Ext href={L.fastlaneMatch.href}>sync_code_signing</Ext> installs certs/profiles from a private Git repo</>, <><C>MATCH_GIT_URL</C>, <C>MATCH_PASSWORD</C>, an initialised match repo (<Cmd>bundle exec fastlane match appstore</Cmd> once)</>],
    ]} />
    <H2>What each run needs</H2>
    <ParamTable codeFirst={false} head={["Where", "Firebase (Ad Hoc)", "TestFlight"]} rows={[
      ["Your Mac", <>Apple ID in Xcode (<strong>Settings → Accounts</strong>) that belongs to the team</>, "App Store Connect API key"],
      ["CI runner", "App Store Connect API key", "App Store Connect API key"],
    ]} />
    <Callout type="note">CI runners have no Apple ID signed in to Xcode, so on CI <strong>both</strong> channels sign with the API key. Without it the lane stops early with a clear message instead of an Xcode signing error.</Callout>
    <H2>Create the App Store Connect API key</H2>
    <ConsoleButtons ids={["ascApiKeys", "appleAccount"]} />
    <Steps>
      <Step>In App Store Connect open <strong>Users and Access → Integrations → App Store Connect API → Team Keys</strong> (<Ext href={L.ascApiKeys.href}>Apple guide</Ext>). Only the Account Holder or an Admin can create keys.</Step>
      <Step>Generate a key with the <strong>App Manager</strong> role, or <strong>Admin</strong> if automatic signing must create distribution certificates.</Step>
      <Step>Download <C>AuthKey_XXXXXXXXXX.p8</C>. It can be downloaded <strong>only once</strong>. Note the Key ID and the Issuer ID shown above the table. Share them securely and never commit them.</Step>
    </Steps>
    <AscApiKeysShot />
    <H2>Initialise match (match only)</H2>
    <Terminal title="my-app — zsh" lines={`
$ bundle exec fastlane match appstore
~ [✔] 🚀
~ Successfully loaded '/Users/you/my-app/fastlane/Matchfile' 📄
? Passphrase for Match storage:
~ Cloning remote git repo...
+ All required keys, certificates and provisioning profiles are installed 🙌`} caption="Run once from a trusted Mac. CI then uses readonly mode." />
    <OfficialDocs links={[L.fastlaneCodesigning, L.fastlaneMatch, L.fastlaneAscApi, L.ascApiKeys]} />
  </>
);

const IosFirebase = () => (
  <>
    <p>The Firebase channel sends an <strong>Ad Hoc</strong> IPA to <Ext href={L.appDistribution.href}>Firebase App Distribution</Ext>. It's the quickest way to get iOS builds to testers: no App Store Connect app record and, on a Mac, no API key. This channel has been verified end-to-end.</p>
    <ConsoleButtons ids={["firebase", "firebaseSettings", "appDistribution", "appleAccount"]} />
    <Steps>
      <Step>In the Firebase console, <Ext href={L.firebaseIosSetup.href}>add an iOS app</Ext> with the exact bundle id. Download <C>GoogleService-Info.plist</C> into <C>ios/</C> and copy the iOS <strong>App ID</strong> (<C>1:123…:ios:abc…</C>).<FirebaseIosAppShot /></Step>
      <Step>In <strong>App Distribution → Testers &amp; Groups</strong>, create a group and note its <strong>alias</strong> (case-sensitive) (<Ext href={L.appDistTesters.href}>Firebase: testers and groups</Ext>).<FirebaseTestersShot /></Step>
      <Step>Testers accept the invite on their iPhone and register the device. Click <strong>Export Apple UDIDs</strong> (<Ext href={L.appDistRegisterDevices.href}>Firebase guide</Ext>) and upload the file at developer.apple.com → Devices → <strong>Register Multiple Devices</strong> (<Ext href={L.appleRegisterDevices.href}>Apple guide</Ext>).<AppleRegisterDevicesShot /></Step>
      <Step title="Add these to .env:">
        <CodeBlock language="bash" filename=".env" code={`APPLE_TEAM_ID=XXXXXXXXXX
FIREBASE_SERVICE_CREDENTIALS_FILE=/absolute/path/service-account.json   # or FIREBASE_TOKEN
FIREBASE_IOS_DEV_APP_ID=1:123456789:ios:abcdef0123456789
FIREBASE_IOS_DEV_GROUPS=qa-team                                          # group alias(es)`} />
      </Step>
      <Step title="Validate and distribute">
        <Terminal title="my-app — zsh" lines={`
$ bundle exec fastlane ios doctor environment:development
~ [11:02:10]: Signing method: automatic
~ [11:02:10]: Team ID: ABCDE12345
! [11:02:10]: TestFlight: NOT READY — missing APP_STORE_CONNECT_KEY_ID
+ [11:02:10]: Firebase: READY (export method: ad-hoc)
+ [11:02:10]: iOS development configuration is valid.
$ bundle exec fastlane ios firebase environment:development
~ [11:14:31]: Successfully exported and signed the ipa file:
~ [11:14:31]: dist/ios/development/MyApp-development-firebase.ipa
~ [11:15:02]: ✅ Uploaded IPA successfully.
~ [11:15:03]: ✅ Distributed to "qa-team".
+ [11:15:03]: iOS development build uploaded to Firebase App Distribution.`} caption="Firebase is READY even without the TestFlight key (output shortened)." />
      </Step>
    </Steps>
    <Callout type="warning" title="Ad Hoc builds only install on registered devices">the provisioning profile is created when you build. A device registered <strong>after</strong> the build can't install it: register the UDID, then run <C>ios firebase</C> again. Apple allows 100 devices per type per membership year.</Callout>
    <Callout type="note">production never goes to Firebase. <C>init_project</C> doesn't offer it, and the CI workflow skips the Firebase channel for production with a notice.</Callout>
    <OfficialDocs links={[L.appDistIosFastlane, L.appDistTesters, L.appDistRegisterDevices, L.appleRegisterDevices, L.firebaseIosSetup]} />
  </>
);

const IosFirstRun = () => (
  <>
    <p>Do this once per project on a Mac. Firebase builds work after part A; TestFlight additionally needs part B. Check off part C after the first TestFlight upload, because a finished lane doesn't yet mean Apple accepted the build.</p>
    <ToolDownloads ids={["xcode", "homebrew", "rubyMac", "cocoapods", "node"]} title="Install these on the Mac first" />
    <ConsoleButtons ids={["appStoreConnect", "ascApiKeys", "appleAccount"]} />
    <H2>A. Mac, Podfile and Xcode</H2>
    <Steps>
      <Step title="Tooling">
        <CodeBlock language="bash" code={`xcode-select --install
echo 'export LANG=en_US.UTF-8' >> ~/.zshrc && source ~/.zshrc   # CocoaPods needs UTF-8
bundle config set path vendor/bundle && bundle install
npm ci`} />
        If <Cmd>pod install</Cmd> fails with <C>Could not find 'ffi'</C> after a Homebrew Ruby upgrade, run <Cmd>brew reinstall cocoapods</Cmd>.
      </Step>
      <Step title="Podfile (React Native + Firebase)">
        Inside <C>target '&lt;App&gt;' do</C>, if the app uses <C>@react-native-firebase/*</C>:
        <CodeBlock language="ruby" filename="ios/Podfile" code={`$RNFirebaseDisableSPM = true                  # above the target block
pod 'GoogleUtilities', :modular_headers => true
pod 'FirebaseCore', :modular_headers => true

# post_install, after react_native_post_install(...):
installer.pods_project.targets.each do |target|
  target.build_configurations.each do |build_config|
    if build_config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'].to_f < 15.0
      build_config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '15.0'
    end
  end
end`} />
        The first fixes <em>FirebaseCoreInternal depends upon GoogleUtilities, which does not define modules</em>; the second fixes archive errors about the deployment target range.
      </Step>
      <Step>Set <C>ios.enabled: true</C>, or run <DocLink to="setup/init-project"><C>fastlane init_project</C></DocLink>.</Step>
      <Step>In Xcode, make the app scheme <strong>Shared</strong> (Product → Scheme → Manage Schemes → Shared) and commit <C>xcshareddata</C>. Sign in under <strong>Settings → Accounts</strong> with an Apple ID on the team.<XcodeSharedSchemeShot /><XcodeAccountsShot /></Step>
      <Step>Make sure <C>Info.plist</C> uses <C>$(MARKETING_VERSION)</C> and <C>$(CURRENT_PROJECT_VERSION)</C>; <C>doctor</C> warns when they are hard-coded.</Step>
      <Step>Set up the <DocLink to="ios/firebase">Firebase channel</DocLink> and run <Cmd>bundle exec fastlane ios firebase</Cmd>.</Step>
    </Steps>
    <H2>B. TestFlight</H2>
    <Steps>
      <Step>In App Store Connect, <Ext href={L.ascAddApp.href}>create the app</Ext> with the same bundle id.<AscNewAppShot /></Step>
      <Step><DocLink to="ios/signing">Create an API key</DocLink> and add it to <C>.env</C>:
        <CodeBlock language="bash" filename=".env" code={`APP_STORE_CONNECT_KEY_ID=...
APP_STORE_CONNECT_ISSUER_ID=...
APP_STORE_CONNECT_KEY_FILE=/absolute/path/AuthKey_XXXX.p8   # outside the repo`} />
      </Step>
      <Step title="Check Info.plist before the first upload">
        <ParamTable codeFirst={false} head={["Check", "Why"]} rows={[
          [<><C>ITSAppUsesNonExemptEncryption</C> = <C>NO</C> (standard HTTPS only)</>, <>Otherwise every build waits in <strong>Missing Compliance</strong> (<Ext href={L.exportCompliance.href}>Apple</Ext>)</>],
          [<>An <C>NS…UsageDescription</C> for every permission the app or its libraries use (camera, photo library read/add, location, Face ID, microphone…)</>, <>Missing purpose strings fail Apple's upload check, <C>ITMS-90683</C> (<Ext href={L.protectedResources.href}>Apple</Ext>)</>],
          ["App Store icon 1024×1024 without transparency", <>Icons with an alpha channel are rejected, <C>ITMS-90717</C></>],
        ]} />
      </Step>
      <Step title="Validate and upload">
        <Terminal title="my-app — zsh" lines={`
$ bundle exec fastlane ios doctor environment:development
+ [09:10:41]: TestFlight: READY
+ [09:10:41]: Firebase: READY (export method: ad-hoc)
+ [09:10:41]: iOS development configuration is valid.
$ bundle exec fastlane ios development
~ [09:11:02]: Build number: 13 (latest TestFlight build 12 + 1)
~ [09:21:13]: Successfully exported and signed the ipa file
~ [09:23:40]: Successfully uploaded the new binary to App Store Connect
+ [09:23:41]: iOS development build uploaded to TestFlight successfully.`} caption="Expected output of the first TestFlight run (Apple's tool output is shortened)." />
      </Step>
    </Steps>
    <H2>C. Verify the first TestFlight build</H2>
    <Steps>
      <Step>App Store Connect → <strong>TestFlight</strong>: the build goes <strong>Processing</strong> → <strong>Ready to Test</strong>, usually within 10–30 minutes.<AscTestflightBuildsShot /></Step>
      <Step>If it shows <strong>Missing Compliance</strong>, answer the encryption question (or add <C>ITSAppUsesNonExemptEncryption</C>).</Step>
      <Step>Add yourself under <strong>Internal Testing</strong> (<Ext href={L.testflightInternal.href}>Apple guide</Ext>), install the build with the TestFlight app and smoke-test it. Push notifications now use the <strong>production</strong> APNs environment.</Step>
      <Step>Only after this, mark TestFlight as verified in your project notes and turn it on for CI.</Step>
    </Steps>
    <OfficialDocs links={[L.ascAddApp, L.ascApiKeys, L.exportCompliance, L.protectedResources, L.testflightInternal, L.fastlaneIosSetup]} />
  </>
);

const IosDistribute = () => (
  <>
    <p>Run the iOS lanes through Bundler from the project root on a Mac.</p>
    <ParamTable head={["Lane", "What it does"]} rows={[
      ["ios doctor", <><Cmd>pod install</Cmd>, workspace, shared scheme, signing; reports <strong>TestFlight</strong> and <strong>Firebase</strong> readiness separately</>],
      ["ios info", "Prints resolved iOS config (no secrets)"],
      ["ios build", <><Cmd>pod install</Cmd> → signing → build number → signed IPA in <C>dist/ios/&lt;env&gt;/</C>, no upload</>],
      ["ios firebase", <>Ad Hoc IPA (<C>&lt;Project&gt;-&lt;env&gt;-firebase.ipa</C>) → Firebase App Distribution → testers</>],
      ["ios distribute", "App Store IPA → TestFlight (+ external groups)"],
      ["ios development | staging | uat | production", <>Shortcuts for <C>ios distribute</C>; production only from allowed branches, with confirmation</>],
    ]} />
    <CodeBlock language="bash" code={`bundle exec fastlane ios firebase environment:staging
VERSION_NAME=1.2.0 BUILD_NUMBER=42 bundle exec fastlane ios firebase   # version shown to testers
bundle exec fastlane ios distribute environment:staging`} />
    <Terminal title="my-app — zsh" lines={`
$ bundle exec fastlane ios distribute environment:staging
~ [10:02:11]: Build number: 58 (latest TestFlight build 57 + 1)
~ [10:14:02]: Successfully exported and signed the ipa file
~ [10:14:03]: --- upload_to_testflight ---
~ [10:16:47]: Successfully uploaded the new binary to App Store Connect
~ [10:16:48]: Distributing to external groups: Beta Testers
+ [10:16:50]: iOS staging build uploaded to TestFlight successfully.`} caption="Build processing on Apple's side can take 10–30 minutes after the upload." />
    <Callout type="tip">prefer menus? <Cmd>bundle exec fastlane setup</Cmd> asks for iOS <strong>Distribute to: firebase / testflight</strong> when the environment has Firebase enabled, then runs these same lanes.</Callout>
    <OfficialDocs links={[L.fastlaneBuildApp, L.appDistIosFastlane, L.fastlaneTestflight, L.testflight]} />
  </>
);

export const androidPages: DocPage[] = [
  { slug: "android", title: "Android overview", description: "Gradle build to Firebase App Distribution with optional AI tests.", badge: "android", body: AndroidOverview },
  { slug: "android/environments", title: "Configure Android environments", description: "Gradle tasks, flavors, APK/AAB and Firebase targets per environment.", badge: "android", body: AndroidEnv },
  { slug: "android/firebase", title: "Set up Firebase App Distribution", description: "Register the app, create tester groups and authenticate.", badge: "android", body: AndroidFirebase },
  { slug: "android/app-testing-agent", title: "App Testing agent (AI tests)", description: "Run Gemini-powered natural-language tests on real devices after each upload.", badge: "preview", body: AppTestingAgent },
  { slug: "android/distribute", title: "Build and distribute", description: "Android doctor, info, build and distribute lanes.", badge: "android", body: AndroidDistribute },
];
export const iosPages: DocPage[] = [
  { slug: "ios", title: "iOS overview", description: "Xcode to signed IPA to Firebase App Distribution (Ad Hoc) and/or TestFlight.", badge: "ios", body: IosOverview },
  { slug: "ios/environments", title: "Configure iOS environments", description: "Workspace, scheme, bundle id, versioning, TestFlight and Firebase settings.", badge: "ios", body: IosEnv },
  { slug: "ios/signing", title: "Code signing", description: "Xcode Apple ID, the App Store Connect API key, or match.", badge: "ios", body: IosSigning },
  { slug: "ios/firebase", title: "Firebase App Distribution (Ad Hoc)", description: "Register the iOS app, testers and devices, then distribute with ios firebase.", badge: "ios", body: IosFirebase },
  { slug: "ios/first-run", title: "First run on a Mac (checklist)", description: "Mac setup, Podfile fixes, and the first TestFlight upload and verification.", badge: "ios", body: IosFirstRun },
  { slug: "ios/distribute", title: "Build and distribute", description: "iOS doctor, info, build, firebase and distribute lanes.", badge: "ios", body: IosDistribute },
];

import { CardGrid, Callout, ClaudePrompt, CodeBlock, CopyButton, DocLink, Ext, Flow, Icon, NextSteps, ParamTable, Steps, Step, Terminal, Cmd } from "@/components/docs/ui";
import { C, H2, H3, type DocPage } from "./helpers";
import skillSource from "./skills/fastlane-setup/SKILL.md?raw";

const SKILL_PATH = ".claude/skills/fastlane-setup/SKILL.md";

/** Download / copy card for the SKILL.md file shipped with the docs. */
function SkillFileCard() {
  const download = () => {
    const url = URL.createObjectURL(new Blob([skillSource], { type: "text/markdown" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: "SKILL.md" });
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <section className="no-prose my-6 overflow-hidden rounded-xl border bg-surface shadow-card">
      <div className="flex flex-wrap items-center gap-3 border-b px-4 py-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#d97757] text-white"><Icon name="smart_toy" className="text-[20px]" /></span>
        <div className="min-w-0 flex-1">
          <div className="font-medium">fastlane-setup</div>
          <div className="truncate font-mono text-[12px] text-muted-foreground">{SKILL_PATH}</div>
        </div>
        <div className="flex items-center gap-2">
          <CopyButton text={skillSource} label="Copy SKILL.md" />
          <button onClick={download} className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-[13px] font-medium text-primary-foreground hover:opacity-90">
            <Icon name="download" className="text-[16px]" /> Download
          </button>
        </div>
      </div>
      <details>
        <summary className="cursor-pointer px-4 py-2.5 text-[13px] text-muted-foreground hover:text-foreground">Show the full skill ({skillSource.split("\n").length} lines)</summary>
        <pre className="m-0 max-h-[480px] overflow-auto whitespace-pre-wrap border-t px-4 py-3 font-mono text-[12.5px] leading-[1.6]">{skillSource}</pre>
      </details>
    </section>
  );
}

const ONE_SHOT_PROMPT = `Set up the Mobile Distribution Framework (Fastlane) in this repository
by following the attached SKILL.md (fastlane-setup) exactly, with arguments: android development,staging,production

- copy the framework, install gems, generate fastlane/config/*.yml from my real Gradle/Xcode project
- prepare .env without inventing or printing secrets, run doctor, never upload anything
- finish with the report: what you did, validation results, and a numbered step-by-step
  list of the manual steps that are still open for this project`;

/* ---------------------------------------------------------------- */

const AgentOverview = () => (
  <>
    <p>
      An <strong>agent skill</strong> is a folder of instructions that Claude Code loads when you type a slash command. The{" "}
      <C>fastlane-setup</C> skill packs this whole documentation (copy the framework, Gemfile, <C>.gitignore</C>,{" "}
      <C>environments.yml</C>, <C>.env</C>, Podfile fixes, <C>doctor</C>) into <strong>one command</strong>:
    </p>
    <Terminal title="my-app — claude" lines={`
> /fastlane-setup android development,staging,production
~ Inspecting project… React Native 0.76 · android/ (flavors: dev, prod) · ios/
~ Copying framework, merging Gemfile, updating .gitignore
~ bundle install … fastlane 2.240.1 · firebase_app_distribution 1.0.0
~ Wrote fastlane/config/environments.yml (assembleDevRelease, bundleProdRelease)
~ android doctor environment:development → config valid, waiting for FIREBASE_TOKEN
+ Done. 9 things set up automatically · 4 manual steps left (see list)`} caption="Illustrative run. Claude stops before anything is uploaded." />

    <H2>What Claude does and what you do</H2>
    <ParamTable codeFirst={false} head={["Claude does automatically", "You do (needs your accounts)"]} rows={[
      ["Checks Ruby, Bundler, Java, Xcode, Firebase CLI", "Install missing system tools (Ruby, JDK, Xcode)"],
      [<>Copies <C>fastlane/</C>, merges your <C>Gemfile</C>, adds <C>.gitignore</C> rules</>, "Create the Firebase project and register the app"],
      [<>Runs <Cmd>bundle install</Cmd> and verifies fastlane + plugin</>, "Create a tester group in App Distribution"],
      [<>Reads flavors, build types, schemes and bundle ids, then writes <C>environments.yml</C></>, <>Run <Cmd>firebase login:ci</Cmd> or create a service-account key</>],
      [<>Creates <C>.env</C> and fills app IDs it can prove from <C>google-services.json</C></>, "Apple: Team ID, App Store Connect app, API key (.p8)"],
      [<>Fixes <C>Info.plist</C> version placeholders and React Native Firebase Podfile issues</>, "Xcode: sign in, mark the scheme Shared"],
      [<>Runs <C>doctor</C> / <C>info</C> and fixes config errors until only credentials are missing</>, "Add GitHub secrets, run the first distribution"],
    ]} />
    <Callout type="note" title="Safe by default">
      The skill never prints or invents secrets, never runs interactive lanes (<C>init_project</C>, <C>setup</C>) that would hang,
      and never runs <C>distribute</C> or uploads a build unless you ask.
    </Callout>

    <H2>How a run works</H2>
    <Flow steps={[
      "Inspect project & machine (tools, RN/Expo version, flavors, schemes)",
      "Copy framework · merge Gemfile · .gitignore",
      "bundle install · verify fastlane & Firebase plugin",
      "Generate environments.yml, testing.yml, .env.example",
      "Create .env, fill provable values, Podfile / Info.plist fixes",
      "doctor + info for every environment, fix what it can",
      "Report: done ✓ · validation · numbered manual steps",
    ]} />
    <p>When you've finished the manual steps, tell Claude <strong>“continue fastlane setup”</strong>. It skips the steps it already did, runs <C>doctor</C> again and lists only what's left.</p>

    <CardGrid cards={[
      { icon: "download", title: "Install & run the skill", desc: "Add SKILL.md to your project and run /fastlane-setup.", to: "agent/install" },
      { icon: "checklist", title: "Manual steps checklist", desc: "Everything only you can do, step by step.", to: "agent/manual-steps" },
    ]} />
  </>
);

/* ---------------------------------------------------------------- */

const AgentInstall = () => (
  <>
    <p>Add the skill to the app repository you want to set up (not to this framework repo), then run it from Claude Code.</p>

    <H2>Before you begin</H2>
    <ul>
      <li><Ext href="https://docs.claude.com/en/docs/claude-code/overview">Claude Code</Ext> (terminal, VS Code / JetBrains extension or desktop app).</li>
      <li>Ruby 3.4 + Bundler and Git. Claude checks everything else and lists what's missing. See <DocLink to="get-started/prerequisites">Prerequisites</DocLink>.</li>
      <li>A clean git working tree is recommended, so you can review every change in one diff.</li>
    </ul>

    <H2>Step 1: Get the skill file</H2>
    <SkillFileCard />

    <H2>Step 2: Put it in your project</H2>
    <p>Skills live in <C>.claude/skills/&lt;name&gt;/SKILL.md</C>. Commit the folder and everyone on the team gets the command.</p>
    <CodeBlock tabs={[
      { label: "macOS / Linux", language: "bash", code: `mkdir -p .claude/skills/fastlane-setup
mv ~/Downloads/SKILL.md .claude/skills/fastlane-setup/SKILL.md` },
      { label: "PowerShell", language: "powershell", code: `New-Item -ItemType Directory -Force .claude\\skills\\fastlane-setup | Out-Null
Move-Item "$HOME\\Downloads\\SKILL.md" .claude\\skills\\fastlane-setup\\SKILL.md` },
    ]} />
    <Callout type="tip">to use it in all your projects, put it in <C>~/.claude/skills/fastlane-setup/SKILL.md</C> instead.</Callout>

    <H2>Step 3: Run it</H2>
    <p>Open Claude Code in the project root and type:</p>
    <CodeBlock language="text" code="/fastlane-setup" />
    <ParamTable head={["Argument", "Effect", "Default"]} rows={[
      ["android | ios | both", "Platforms to configure", <>Every folder that exists. iOS is only <em>enabled</em> on a Mac.</>],
      ["dev,staging,production", "Environment names (any names work)", "development,staging,uat,production"],
      ["--ai-tests", "Keep the Firebase App Testing agent enabled", "Off until you have test case IDs"],
      ["--ci", <>Also prepare GitHub Actions and offer <C>gh secret set</C> for values already in <C>.env</C></>, "Workflows copied, secrets only listed"],
    ]} />
    <CodeBlock language="text" code={`/fastlane-setup android development,staging,production
/fastlane-setup both --ai-tests --ci`} />
    <p>Claude also starts the skill without the slash command if you ask, for example “set up fastlane for this app”.</p>

    <H3>Without installing (one-off)</H3>
    <p>Attach or paste the downloaded <C>SKILL.md</C> into the chat with this prompt:</p>
    <ClaudePrompt title="One-shot setup prompt" description="Use with Claude Code in the project root." prompt={ONE_SHOT_PROMPT} />

    <H2>Step 4: Read the report</H2>
    <p>Every run ends with the same three blocks:</p>
    <CodeBlock language="markdown" code={`### Done automatically      → table of every file created or changed
### Validation              → fastlane version, plugin, doctor per environment
### Manual steps (in order)  → numbered, with sub-steps, console links and the
                               exact .env variable / GitHub secret for each result`} />
    <p>Do the manual steps (see the <DocLink to="agent/manual-steps">checklist</DocLink>), then say <strong>“continue fastlane setup”</strong>. Claude runs <C>doctor</C> again and reports what's left.</p>

    <H2>Review and commit</H2>
    <Terminal title="my-app — zsh" lines={`
$ git status --short
 M .gitignore
 M Gemfile
?? .claude/skills/fastlane-setup/SKILL.md
?? .env.example
?? .github/workflows/android-distribution.yml
?? fastlane/
$ git check-ignore .env && echo ".env is ignored"
.env
.env is ignored`} caption="Commit everything except .env, keys and service-account JSON files." />
    <NextSteps cards={[{ icon: "checklist", title: "Manual steps checklist", desc: "Firebase, Apple and CI steps, in order.", to: "agent/manual-steps" }]} />
  </>
);

/* ---------------------------------------------------------------- */

const AgentManual = () => (
  <>
    <p>
      These are the steps the skill <strong>can't do for you</strong>: they need your browser sign-in, a console, or a secret.
      Claude's report lists only the ones still open for your project, in this order. Each step says where the result goes.
    </p>
    <ParamTable codeFirst={false} head={["Group", "Needed for", "Time"]} rows={[
      [<a href="#a-machine-only-if-missing">A. Machine</a>, "Only if a tool is missing", "10–30 min"],
      [<a href="#b-firebase-app-distribution-android">B. Firebase (Android)</a>, "Android distribution", "~15 min"],
      [<a href="#c-ai-tests-optional">C. AI tests</a>, <>Optional, <C>--ai-tests</C></>, "~15 min"],
      [<a href="#d-ios-xcode-and-apple">D. iOS</a>, "iOS on a Mac", "~30 min"],
      [<a href="#e-notifications-optional">E. Notifications</a>, "Optional", "5 min"],
      [<a href="#f-github-actions-optional">F. GitHub Actions</a>, "Optional, CI", "10 min"],
      [<a href="#g-first-distribution">G. First distribution</a>, "Always, last", "5–20 min"],
    ]} />

    <H2 id="a-machine-only-if-missing">A. Machine (only if missing)</H2>
    <Steps>
      <Step title="Ruby 3.4 + Bundler">Windows: <DocLink to="get-started/ruby-windows">RubyInstaller with DevKit</DocLink>. macOS: <DocLink to="get-started/ruby-macos">rbenv</DocLink>. Then <Cmd>gem install bundler</Cmd>.</Step>
      <Step title="JDK 17 + Android SDK">Install Android Studio, then set <C>JAVA_HOME</C> and <C>ANDROID_HOME</C>.</Step>
      <Step title="Xcode (iOS, macOS only)">Install Xcode from the App Store, run <Cmd>xcode-select --install</Cmd>, and add <C>export LANG=en_US.UTF-8</C> to <C>~/.zshrc</C>.</Step>
      <Step title="Firebase CLI"><Cmd>npm i -g firebase-tools</Cmd>. Claude can also run this for you.</Step>
      <Step title="Expo managed project">Run <Cmd>npx expo prebuild</Cmd> so <C>android/</C> and <C>ios/</C> exist, then run the skill again.</Step>
    </Steps>

    <H2 id="b-firebase-app-distribution-android">B. Firebase App Distribution (Android)</H2>
    <Steps>
      <Step title="Create or choose the Firebase project">Open the <Ext href="https://console.firebase.google.com">Firebase console</Ext>.</Step>
      <Step title="Register the Android app">
        Project settings → Your apps → <strong>Add app → Android</strong>. The package name must equal <C>applicationId</C> exactly (one app per flavor package).
        Download <C>google-services.json</C> into <C>android/app/</C>.
        <div className="mt-2">→ App ID (<C>1:…:android:…</C>) goes into <C>FIREBASE_ANDROID_&lt;ENV&gt;_APP_ID</C>. Claude fills this itself once <C>google-services.json</C> is present.</div>
      </Step>
      <Step title="Create a tester group">
        App Distribution → <strong>Testers &amp; Groups → Add group</strong>, then add tester e-mails.
        <div className="mt-2">→ The group <strong>alias</strong> goes into <C>FIREBASE_ANDROID_&lt;ENV&gt;_GROUPS</C>.</div>
      </Step>
      <Step title="Authenticate (choose one)">
        <ul>
          <li><strong>Token</strong> (required for AI tests): run <Cmd>firebase login:ci</Cmd> in <em>your own</em> terminal, sign in, copy the <C>1//…</C> token → <C>FIREBASE_TOKEN</C>.</li>
          <li><strong>Service account</strong> (upload only): create a key as described in <DocLink to="configure/firebase-values">Firebase values &amp; service account</DocLink>, save it as <C>fastlane/firebase-service-account.json</C> → <C>FIREBASE_SERVICE_CREDENTIALS_FILE</C>.</li>
        </ul>
      </Step>
      <Step title="Enable the APIs">In Google Cloud → APIs &amp; Services, enable the <strong>Firebase App Distribution API</strong>. For AI tests, also enable the Cloud Testing, Cloud Tool Results and Gemini for Google Cloud APIs.</Step>
      <Step title="(Before Google Play) Release keystore">Configure a real <C>signingConfigs.release</C>. The debug keystore is fine for Firebase testers.</Step>
    </Steps>

    <H2 id="c-ai-tests-optional">C. AI tests (optional)</H2>
    <Steps>
      <Step>As project owner, open Firebase → App Distribution → your app → <strong>Test cases</strong>, and accept the App Testing / Gemini terms.</Step>
      <Step>Create test cases, then copy each <strong>test case ID</strong> into <C>fastlane/config/test_case_ids.yml</C>.</Step>
      <Step>Pick devices in <C>fastlane/config/testing.yml</C> and set <C>app_testing.enabled: true</C>.</Step>
      <Step>Use the <C>FIREBASE_TOKEN</C> of the account that opted in. A service account gets a 403 error.</Step>
      <Step>If a test signs in, set <C>FIREBASE_TEST_USERNAME</C> / <C>FIREBASE_TEST_PASSWORD</C> and disable <C>FLAG_SECURE</C> on test builds. Details: <DocLink to="android/app-testing-agent">App Testing agent</DocLink>.</Step>
    </Steps>

    <H2 id="d-ios-xcode-and-apple">D. iOS: Xcode and Apple</H2>
    <Steps>
      <Step title="Sign in to Xcode">Open <C>ios/&lt;Name&gt;.xcworkspace</C> → Settings → <strong>Accounts</strong>, and add an Apple ID on the team.</Step>
      <Step title="Share the scheme">Product → Scheme → Manage Schemes → tick <strong>Shared</strong>, then commit <C>xcshareddata/</C>.</Step>
      <Step title="Team ID">Developer account → Membership → copy the 10-character Team ID → <C>APPLE_TEAM_ID</C>.</Step>
      <Step title="Create the app in App Store Connect">Apps → <strong>+ New App</strong> with the same bundle id (needed for TestFlight).</Step>
      <Step title="API key">
        Users and Access → Integrations → App Store Connect API → Generate (role <strong>Admin</strong>). Download <C>AuthKey_XXXX.p8</C> once and keep it <strong>outside the repo</strong>.
        <CodeBlock language="bash" filename=".env" code={`APP_STORE_CONNECT_KEY_ID=...
APP_STORE_CONNECT_ISSUER_ID=...
APP_STORE_CONNECT_KEY_FILE=/absolute/path/AuthKey_XXXX.p8`} />
      </Step>
      <Step title="Info.plist declarations">Set <C>ITSAppUsesNonExemptEncryption = NO</C> if the app only uses standard HTTPS. Add an <C>NS…UsageDescription</C> for every permission the app uses. Use a 1024×1024 icon without transparency.</Step>
      <Step title="(Firebase Ad Hoc channel)">Register the iOS app in Firebase → <C>FIREBASE_IOS_&lt;ENV&gt;_APP_ID</C>. Create a group → <C>FIREBASE_IOS_&lt;ENV&gt;_GROUPS</C>. Register tester device UDIDs. See <DocLink to="ios/firebase">iOS Firebase</DocLink>.</Step>
      <Step title="Verify the first TestFlight build">After <Cmd>bundle exec fastlane ios development</Cmd>, wait for <strong>Ready to Test</strong>, answer Missing Compliance if it appears, and add internal testers. See <DocLink to="ios/first-run">First run on a Mac</DocLink>.</Step>
    </Steps>

    <H2 id="e-notifications-optional">E. Notifications (optional)</H2>
    <Steps>
      <Step><strong>Teams:</strong> in the channel, open Workflows → “Post to a channel when a webhook request is received” → copy the URL → <C>TEAMS_WEBHOOK_URL</C>. See <DocLink to="configure/notifications">Notifications</DocLink>.</Step>
      <Step><strong>Slack:</strong> create an Incoming Webhook → <C>SLACK_WEBHOOK_URL</C>.</Step>
      <Step><strong>E-mail reports:</strong> set <C>SMTP_HOST</C>, <C>SMTP_PORT</C>, <C>SMTP_USERNAME</C>, <C>SMTP_PASSWORD</C>, <C>SMTP_FROM</C> and <C>TEST_ALERT_EMAIL_RECIPIENTS</C>.</Step>
    </Steps>

    <H2 id="f-github-actions-optional">F. GitHub Actions (optional)</H2>
    <Steps>
      <Step>In the repository, open Settings → Secrets and variables → Actions, and add each secret from Claude's list (full list: <DocLink to="ci/github-actions">GitHub Actions</DocLink>).</Step>
      <Step>Open Actions → <strong>Android Distribution</strong> / <strong>iOS Distribution</strong> → Run workflow → <C>development</C>.</Step>
      <Step>Only after a manual run passes, turn on automatic runs (<C>IOS_AUTO_DISTRIBUTE=true</C> and similar).</Step>
    </Steps>

    <H2 id="g-first-distribution">G. First distribution</H2>
    <Steps>
      <Step><Cmd>bundle exec fastlane android doctor environment:development</Cmd> passes with no errors. Or ask Claude to “continue fastlane setup”.</Step>
      <Step>Run <Cmd>bundle exec fastlane setup</Cmd> (interactive, in your own terminal) or <Cmd>bundle exec fastlane android distribute environment:development</Cmd>.</Step>
      <Step>Check Firebase → App Distribution → Releases, and the tester e-mail.</Step>
      <Step>Commit <C>fastlane/</C>, <C>Gemfile</C>, <C>Gemfile.lock</C>, <C>.env.example</C>, <C>.gitignore</C>, <C>.ruby-version</C> and <C>.github/workflows/</C>. Never commit <C>.env</C>.</Step>
    </Steps>
    <Callout type="success" title="Stuck?">paste the failing output into Claude Code with “continue fastlane setup”, or see <DocLink to="help/troubleshooting">Troubleshooting</DocLink>.</Callout>
  </>
);

export const agentPages: DocPage[] = [
  { slug: "agent", title: "Agent skills overview", description: "Set up the whole framework with one Claude Code command: /fastlane-setup.", body: AgentOverview },
  { slug: "agent/install", title: "Install & run /fastlane-setup", description: "Download SKILL.md, add it to .claude/skills and run it.", body: AgentInstall },
  { slug: "agent/manual-steps", title: "Manual steps checklist", description: "Every step only you can do (Firebase, Apple, secrets, CI), in order.", body: AgentManual },
];

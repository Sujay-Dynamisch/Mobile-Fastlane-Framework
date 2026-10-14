import { useState, type ReactNode } from "react";
import { ConsoleButtons, ToolDownloads } from "@/components/docs/downloads";
import { Accordion, Callout, CodeBlock, DocLink, EnvVarTable, Ext, Icon, OfficialDocs, ParamTable, Ph, Steps, Step, Terminal, Cmd, ClaudePrompt, CopyButton } from "@/components/docs/ui";
import { C, H2, type DocPage } from "./helpers";
import { L } from "./links";
import { GithubRunIosWorkflowShot, GithubVariablesShot } from "@/components/docs/ios-mockups";
import { EmailReportShot, ImageShot, Screenshot, SlackMessageShot, TeamsFailureCard, TeamsSuccessCard, TeamsTestReportCard } from "@/components/docs/mockups";

const EnvYml = () => (
  <>
    <p>Project-wide defaults in <C>fastlane/config/environments.yml</C>. The platform blocks are documented under <DocLink to="android/environments">Android</DocLink> and <DocLink to="ios/environments">iOS</DocLink>.</p>
    <Callout type="note">any string can reference an environment variable as <C>{"${NAME}"}</C>. A value that's still <C>{"${NAME}"}</C> after loading is treated as empty.</Callout>
    <CodeBlock language="yaml" filename="fastlane/config/environments.yml" code={`project:
  name: "MyApp"                       # used in artifact names, e-mails, Teams cards
  identifier: "myapp"
  organization: "Your Company"
  default_environment: "development"  # used when no environment: option and no APP_ENV

notifications:        # defaults, overridable per environment
  teams: { enabled: true,  webhook_url: "\${TEAMS_WEBHOOK_URL}" }
  slack: { enabled: false, webhook_url: "\${SLACK_WEBHOOK_URL}" }
release_notes:
  enabled: true
  source: "git"       # git | manual | file
  commit_count: 10
  prefix: "Automated Mobile Distribution"
ci:
  build:
    clean_before_build: true
security:
  production_requires_ci: false
artifact:
  naming:
    enabled: true
    pattern: "{project}-{environment}-v{version}-{build}.{extension}"   # also {commit}, {platform}`} />
    <H2>How values are resolved</H2>
    <ol>
      <li>The YAML file is loaded (safe <Ext href={L.yaml.href}>YAML 1.2</Ext>, no Ruby objects).</li>
      <li>Every <C>{"${NAME}"}</C> is replaced from <C>.env</C> or the process environment.</li>
      <li>Global sections (<C>notifications</C>, <C>release_notes</C>) are deep-merged with the environment's own overrides.</li>
      <li>When a <DocLink to="setup/profiles">profile</DocLink> runs, its values are deep-merged last.</li>
    </ol>
    <Terminal title="my-app — zsh" lines={`
$ bundle exec fastlane android info environment:staging
~ [14:48:03]: --- Android Distribution Information ---
Project: MyApp
Environment: staging
Gradle task: assembleRelease
Firebase enabled: true`} caption="android info / ios info print the fully resolved result, without secrets." />
    <OfficialDocs links={[L.yaml, L.fastlaneKeys]} />
  </>
);

const TestingYml = () => (
  <>
    <p>Controls the App Testing agent: on/off, devices and e-mail reports.</p>
    <CodeBlock language="yaml" filename="fastlane/config/testing.yml" code={`app_testing:
  enabled: true      # global switch (environment app_testing.enabled overrides it)
  blocking: true     # true = wait for AI results; a failed test fails the lane
test_devices:        # each entry = one device run per test case
  - { model: "a54x", version: "34", locale: "en", orientation: "portrait" }
notifications:
  email:
    enabled: true
    notify_on_success: true
    notify_on_failure: true
    recipients: "\${TEST_ALERT_EMAIL_RECIPIENTS}"`} />
    <ul>
      <li>The file contains a commented catalog of Firebase devices. Uncomment entries to enable them.</li>
      <li>You can override settings per environment under <C>android.environments.&lt;env&gt;.app_testing</C>.</li>
    </ul>
    <Callout type="success" title="Precedence">environment <C>app_testing</C> → <C>testing.yml</C> → built-in default (Pixel 8 / API 34).</Callout>
    <H2>Devices</H2>
    <ParamTable head={["Model code", "Device", "API", "Android"]} rows={[
      ["a54x", "Galaxy A54", "34", "14"], ["o1q", "Galaxy S21", "34", "14"], ["pa3q", "Galaxy S25 Ultra", "35", "15"],
      ["oriole", "Pixel 6", "33", "13"], ["tokay", "Pixel 9", "36", "16"], ["TB370FU", "Lenovo Tab P12", "35", "15"],
      ["MediumPhone.arm", "Medium Phone (emulator)", "30", "11"],
    ]} />
    <p>To list every model and API level that Firebase supports, use the gcloud CLI:</p>
    <ToolDownloads ids={["gcloud"]} title={null} />
    <Terminal title="my-app — zsh" lines={`
$ gcloud firebase test android models list --filter=form=PHYSICAL
┌──────────┬─────────┬───────────────┬──────────┬────────────────┐
│ MODEL_ID │  MAKE   │  MODEL_NAME   │   FORM   │ OS_VERSION_IDS │
├──────────┼─────────┼───────────────┼──────────┼────────────────┤
│ a54x     │ Samsung │ Galaxy A54 5G │ PHYSICAL │ 34             │
│ oriole   │ Google  │ Pixel 6       │ PHYSICAL │ 31,32,33       │
│ tokay    │ Google  │ Pixel 9       │ PHYSICAL │ 34,35,36       │
└──────────┴─────────┴───────────────┴──────────┴────────────────┘`} caption="Use MODEL_ID as model and one of OS_VERSION_IDS as version (output shortened)." />
    <OfficialDocs links={[L.appTestingAgent, { source: "Firebase", title: "Test Lab: available devices", href: "https://firebase.google.com/docs/test-lab/android/available-testing-devices" }]} />
  </>
);

const TestCaseIds = () => (
  <>
    <p>Lists the Firebase test cases the App Testing agent runs.</p>
    <CodeBlock language="yaml" filename="fastlane/config/test_case_ids.yml" code={`test_case_ids:
  - first-test-case   # ID shown in Firebase Console → App Distribution → Test cases`} />
    <p>Every ID listed runs on every configured device after each upload. The number of tests per distribution is <strong>test cases × devices × orientations</strong>, which matters for the preview quota.</p>
    <OfficialDocs links={[L.appTestingAgent]} />
  </>
);

const EnvVars = () => (
  <>
    <p>Local runs read <C>&lt;project-root&gt;/.env</C> automatically (via the <C>dotenv</C> gem that ships with fastlane). In CI, set them as <Ext href={L.ghSecrets.href}>encrypted secrets</Ext>. This follows fastlane's guidance on <Ext href={L.fastlaneKeys.href}>keys and secrets</Ext>.</p>
    <Callout type="warning">never commit secrets or put them in YAML or <DocLink to="setup/profiles">profiles</DocLink>.</Callout>
    <Terminal title="my-app — zsh" lines={`
$ cp .env.example .env
$ grep -c "=" .env
24
$ git check-ignore .env
.env`} caption="Create .env from the template and confirm git ignores it." />
    <H2>Android / Firebase</H2>
    <EnvVarTable rows={[
      ["FIREBASE_TOKEN", "Required when AI tests are on", <>Token from <Cmd>firebase login:ci</Cmd>. Takes priority over the service account.</>],
      ["FIREBASE_SERVICE_CREDENTIALS_FILE", "Required if no token", "Path to service-account JSON (upload/distribution only)"],
      ["FIREBASE_STORAGE_BUCKET", "Optional", <>e.g. <C>your-project-id.appspot.com</C></>],
      ["FIREBASE_ANDROID_<ENV>_APP_ID", "Required (or google-services.json)", <><C>1:123…:android:abc…</C> per env (DEV, STAGING, UAT, PROD)</>],
      ["FIREBASE_ANDROID_<ENV>_GROUPS", "One of groups/testers", "Tester group aliases, comma-separated"],
      ["FIREBASE_TEST_USERNAME / FIREBASE_TEST_PASSWORD", "Optional", "Login the AI agent uses"],
    ]} />
    <H2>iOS / App Store Connect</H2>
    <EnvVarTable rows={[
      ["APP_STORE_CONNECT_KEY_ID", "TestFlight; CI", "API key ID"],
      ["APP_STORE_CONNECT_ISSUER_ID", "TestFlight; CI", "Issuer ID"],
      ["APP_STORE_CONNECT_KEY_FILE", "One of file/content", <>Path to <C>AuthKey_XXXX.p8</C> (outside the repo)</>],
      ["APP_STORE_CONNECT_KEY_CONTENT", "One of file/content", <>Raw <C>.p8</C> content (use this on CI)</>],
      ["APPLE_TEAM_ID", "Recommended", "10-character team ID"],
      ["MATCH_GIT_URL, MATCH_PASSWORD, MATCH_GIT_BRANCH", "match only", "Certificates repo"],
    ]} />
    <Callout type="note">the <C>APP_STORE_CONNECT_*</C> variables are needed for <strong>TestFlight</strong>, and for <strong>both</strong> iOS channels on CI. Local Firebase (Ad Hoc) builds on a Mac sign with the Apple ID in Xcode instead.</Callout>
    <H2>iOS / Firebase App Distribution</H2>
    <EnvVarTable rows={[
      ["FIREBASE_IOS_<ENV>_APP_ID", "Required for ios firebase", <><C>1:123…:ios:abc…</C> per env (DEV, STAGING, UAT)</>],
      ["FIREBASE_IOS_<ENV>_GROUPS", "One of groups/testers", "Tester group aliases, comma-separated. Empty = uploads but goes to nobody"],
      ["FIREBASE_SERVICE_CREDENTIALS_FILE / FIREBASE_TOKEN", "Required", "Same credentials as Android"],
    ]} />
    <H2>Release metadata and notifications</H2>
    <EnvVarTable showRequired={false} rows={[
      ["APP_ENV", <>Default environment when <C>environment:</C> is not passed</>],
      ["VERSION_NAME", <>Version shown in names/messages; iOS also sets <C>MARKETING_VERSION</C></>],
      ["BUILD_NUMBER", <>Build number (falls back to <C>GITHUB_RUN_NUMBER</C>); iOS sets <C>CURRENT_PROJECT_VERSION</C></>],
      ["RELEASE_NOTES", "Fixed release-notes text (overrides git)"],
      ["RELEASE_NOTES_FILE", "Path to a release-notes file (overrides everything)"],
      ["TEAMS_WEBHOOK_URL", "Teams Workflows webhook (Adaptive Cards)"],
      ["SLACK_WEBHOOK_URL", "Slack webhook"],
      ["SMTP_HOST, SMTP_PORT, SMTP_USERNAME, SMTP_PASSWORD, SMTP_FROM, TEST_ALERT_EMAIL_RECIPIENTS", "AI test report e-mail"],
    ]} />
    <OfficialDocs links={[L.fastlaneKeys, L.ghSecrets, L.firebaseCli, L.ascApiKeys]} />
  </>
);

const ReleaseNotes = () => (
  <>
    <p>How release notes, version numbers and artifact names are chosen.</p>
    <H2>Release notes priority</H2>
    <ol>
      <li><C>RELEASE_NOTES_FILE</C> (file contents)</li>
      <li><C>RELEASE_NOTES</C> (literal text)</li>
      <li><C>release_notes.source</C> in config: <C>git</C> (last n commit subjects with a prefix), <C>manual</C> or <C>file</C></li>
    </ol>
    <Callout type="caution">if <C>.env</C> sets <C>RELEASE_NOTES_FILE</C>, git-based notes are never used until you remove that line.</Callout>
    <H2>Versioning</H2>
    <ul>
      <li><strong>Android:</strong> <C>versionName</C> / <C>versionCode</C> stay in <C>android/app/build.gradle</C>.</li>
      <li><strong>iOS:</strong> the build number comes from <C>BUILD_NUMBER</C> → <C>GITHUB_RUN_NUMBER</C> → latest TestFlight + 1, and the version from <C>VERSION_NAME</C>.</li>
    </ul>
    <H2>Artifacts</H2>
    <p>The original output is never renamed. A copy named by <C>artifact.naming.pattern</C> goes to <C>dist/</C>, e.g. <C>dist/MyApp-development-v1.0.0-42.apk</C>.</p>
    <Terminal title="my-app — zsh" lines={`
$ RELEASE_NOTES="Fixes login crash on Android 14" BUILD_NUMBER=43 \\
  bundle exec fastlane android build environment:development
~ [12:40:02]: Release notes: Fixes login crash on Android 14
+ [12:44:31]: Android build completed.
~ [12:44:31]: Artifact: dist/MyApp-development-v1.0.0-43.apk`} caption="One-off release notes and build number from the command line." />
    <OfficialDocs links={[L.androidCmdline, L.fastlaneTestflight]} />
  </>
);

const Notifications = () => (
  <>
    <p>Every run tells the team what happened, so nobody has to watch the terminal or the CI log. The framework posts a card to <strong>Microsoft Teams</strong> (and/or a message to <strong>Slack</strong>) for each distribution, and e-mails an <strong>HTML report</strong> after each AI test run.</p>

    <H2>What you will receive</H2>
    <ParamTable codeFirst={false} head={["Message", "Sent when", "Channel", "Configured in"]} rows={[
      [<b>Build Distributed</b>, <><C>distribute</C> finished successfully</>, "Teams card / Slack text", <><C>notifications</C> in <C>environments.yml</C></>],
      [<b>Distribution Failed</b>, "any step of a distribution fails (build, upload, testers…)", "Teams card / Slack text", "same"],
      [<b>App Testing Agent Report</b>, "the App Testing agent finished (passed or failed)", "Teams card / Slack text", "same"],
      [<b>AI test report e-mail</b>, "the App Testing agent finished", "E-mail (HTML + plain text)", <><C>notifications.email</C> in <C>testing.yml</C> + <C>SMTP_*</C></>],
    ]} />
    <p>Pick a message to see exactly what it looks like:</p>
    <ShotTabs tabs={[
      { label: "Build Distributed", body: <Screenshot app="Microsoft Teams — MyApp › General" caption="Success card: build facts plus “Open Release” (Firebase) and “View CI Run” (GitHub Actions only)."><TeamsSuccessCard /></Screenshot> },
      { label: "Distribution Failed", body: <Screenshot app="Microsoft Teams — MyApp › General" caption="Failure card: the error message (first 800 characters) is shown in the red box."><TeamsFailureCard /></Screenshot> },
      { label: "AI test report", body: <Screenshot app="Microsoft Teams — MyApp › General" caption="App Testing Agent Report: stat tiles, each test case, and every device with its orientations."><TeamsTestReportCard /></Screenshot> },
      { label: "E-mail", body: <Screenshot app="Outlook — Inbox" caption="HTML e-mail sent after every AI test run. Mail clients that block HTML show the plain-text version."><EmailReportShot /></Screenshot> },
      { label: "Slack", body: <Screenshot app="Slack — #mobile-releases" caption="Slack receives the plain-text version of the same message."><SlackMessageShot /></Screenshot> },
    ]} />
    <Callout type="note">“View CI Run” appears only on GitHub Actions, where <C>GITHUB_SERVER_URL</C>, <C>GITHUB_REPOSITORY</C> and <C>GITHUB_RUN_ID</C> exist. Local runs show “Triggered By: Local run”.</Callout>

    <H2>Step 1: Create a Teams Workflows webhook</H2>
    <ToolDownloads ids={["teams"]} title={null} />
    <ConsoleButtons ids={["teamsWeb"]} />
    <p>Microsoft retired Office 365 connectors in favour of <strong>Workflows</strong> (Power Automate). The framework posts to a Workflows webhook URL, as described in <Ext href={L.teamsWorkflows.href}>Microsoft: create incoming webhooks with Workflows</Ext>.</p>
    <p>The screenshots below are from the Teams desktop app. Pink numbered boxes mark what to click, in order.</p>
    <Steps>
      <Step title="Open the Workflows app">
        In the left rail select <strong>⋯ (View more apps)</strong> <b>①</b>, type <C>Workflows</C> and open it <b>②</b>.
        <ImageShot src="/images/teams/1-open-workflows.png" alt="Teams left rail: View more apps, then the Workflows app in search results" width={528} caption="View more apps → search “Workflows” → open it." />
      </Step>
      <Step title="Open the templates">
        On the Workflows <strong>Home</strong> tab, select <strong>Templates</strong> <b>①</b>. If you want to post to a <em>team channel</em>, you can also start straight from the <strong>Send webhook alerts to a channel</strong> card.
        <ImageShot src="/images/teams/2-workflows-home.png" alt="Workflows home with the Templates tab and the Send webhook alerts to a channel card highlighted" caption="Templates tab, or the channel template directly from Home." />
      </Step>
      <Step title="Choose where the alerts should go">
        Pick <strong>Send webhook alerts to a chat</strong> to post into a group chat (or your own chat while testing), or <strong>Send webhook alerts to a channel</strong> to post into a team channel. Older tenants call the channel template <em>Post to a channel when a webhook request is received</em>.
        <ImageShot src="/images/teams/3-pick-template.png" alt="Workflows templates with the chat and channel webhook templates highlighted" caption="Chat = a group chat; Channel = a team channel. Both give the same kind of webhook URL." />
      </Step>
      <Step title="Select the chat (or team and channel), then Save">
        Open the <strong>Chat</strong> drop-down <b>①</b> and pick the conversation that should receive release cards. Then select <strong>Save</strong> <b>②</b>. For the channel template you pick a <strong>Team</strong> and a <strong>Channel</strong> instead.
        <ImageShot src="/images/teams/4-choose-chat-save.png" alt="Untitled workflow: chat picker and Save button highlighted; chat names are blurred" caption="Names in the list are blurred for privacy." />
      </Step>
      <Step title="Copy the webhook link">
        Teams shows <em>“Workflow created”</em> and opens <strong>Workflow details</strong>. Select <strong>Copy webhook link</strong> <b>①</b>. You can come back to this page any time from Workflows → Home → <em>Your workflows</em>.
        <ImageShot src="/images/teams/5-copy-webhook-link.png" alt="Workflow details page with Copy webhook link highlighted" caption="The link is copied to your clipboard. Hovering it shows the full URL. Never screenshot or share that URL." />
      </Step>
      <Step title="Save it as TEAMS_WEBHOOK_URL">
        <CodeBlock language="bash" filename=".env" code={`TEAMS_WEBHOOK_URL=https://prod-12.westeurope.logic.azure.com:443/workflows/.../invoke?api-version=2016-06-01&sp=...&sv=1.0&sig=...`} />
        On GitHub Actions, add the same value as a repository secret (<Ext href={L.ghSecrets.href}>GitHub: using secrets</Ext>).
      </Step>
    </Steps>
    <Callout type="warning">the <C>sig=</C> part of the URL is a secret: anyone with the URL can post to your channel. Keep it in <C>.env</C> or CI secrets only. If it leaks, delete the workflow and create a new one.</Callout>

    <H2>Step 2: Enable it in environments.yml</H2>
    <p>Set the global defaults once, then switch channels on or off per environment:</p>
    <CodeBlock language="yaml" filename="fastlane/config/environments.yml" highlight={[2, 9]} code={`notifications:                       # global defaults
  teams: { enabled: true,  webhook_url: "\${TEAMS_WEBHOOK_URL}" }
  slack: { enabled: false, webhook_url: "\${SLACK_WEBHOOK_URL}" }

android:
  environments:
    development:
      notifications:
        teams: { enabled: false }      # keep dev builds quiet
    production:
      notifications:
        teams: { enabled: true }`} />
    <p>An environment's <C>notifications</C> block is deep-merged over the global one, so you only write what changes.</p>

    <H2>Step 3: Test the webhook</H2>
    <p>Send a test card before your first real run. A Workflows webhook accepts <strong>only Adaptive Card payloads</strong>. Plain <C>{'{ "text": … }'}</C> fails with “Property 'type' must be 'AdaptiveCard'”. The framework always sends cards.</p>
    <Terminal os="windows" title="Windows PowerShell" lines={`
# Load the URL into this session (PowerShell does not read .env)
PS> $env:TEAMS_WEBHOOK_URL = "https://prod-12.westeurope.logic.azure.com:443/workflows/..."
PS> $card = @{ type="message"; attachments=@(@{ contentType="application/vnd.microsoft.card.adaptive"; content=@{ type="AdaptiveCard"; version="1.4"; body=@(@{ type="TextBlock"; text="Fastlane webhook test"; weight="Bolder" }) } }) } | ConvertTo-Json -Depth 10
PS> Invoke-RestMethod -Uri $env:TEAMS_WEBHOOK_URL -Method Post -ContentType "application/json; charset=utf-8" -Body ([Text.Encoding]::UTF8.GetBytes($card))
# No output = HTTP 202 Accepted. The card appears in the channel within a few seconds.`} caption="A silent Invoke-RestMethod means success." />
    <CodeBlock tabs={[
      { label: "macOS / Linux (curl)", language: "bash", code: `curl -sS -o /dev/null -w "%{http_code}\\n" -X POST "$TEAMS_WEBHOOK_URL" \\
  -H "Content-Type: application/json" \\
  -d '{"type":"message","attachments":[{"contentType":"application/vnd.microsoft.card.adaptive","content":{"type":"AdaptiveCard","version":"1.4","body":[{"type":"TextBlock","text":"Fastlane webhook test","weight":"Bolder"}]}}]}'
# → 202` },
    ]} />
    <p>During a real run the result is logged right after the lane finishes:</p>
    <Terminal title="my-app — zsh" lines={`
$ bundle exec fastlane android distribute environment:staging
~ ...
+ [14:07:01]: Microsoft Teams notification sent (HTTP 202).
+ [14:07:01]: Fastlane completed successfully: distribute`} />
    <Callout type="note">notification failures never fail the build. A broken webhook is logged as a warning, and the build and upload result stay as they were.</Callout>
    <Terminal title="my-app — zsh" lines={`
! [16:08:34]: Notification integration failed: Microsoft Teams webhook returned 401: ... — the webhook URL's signature (sig=) was rejected: the URL is incomplete or outdated. Copy the full URL again from the Power Automate trigger and update the webhook secret/env value.`} caption="A 401 usually means the URL was cut off when copying. Copy the whole URL again." />

    <H2>Step 4 (optional): Slack</H2>
    <ConsoleButtons ids={["slackApps"]} />
    <p>Create a Slack app with an <Ext href={L.slackWebhooks.href}>incoming webhook</Ext> for your channel, put its URL in <C>SLACK_WEBHOOK_URL</C> and set <C>notifications.slack.enabled: true</C>. Slack receives the plain-text version of each message (see the <em>Slack</em> tab above).</p>

    <H2>Step 5: E-mail the AI test report</H2>
    <p>After every App Testing agent run, the framework e-mails the HTML report shown above. It uses plain SMTP, so any provider works: Microsoft 365, Gmail (with an app password), Amazon SES or SendGrid.</p>
    <EnvVarTable rows={[
      ["SMTP_HOST", "Required", <>e.g. <C>smtp.office365.com</C>, <C>smtp.gmail.com</C>. If empty, e-mail is skipped with a warning.</>],
      ["SMTP_PORT", "Optional", <><C>587</C> (STARTTLS, default) or <C>465</C> (implicit TLS)</>],
      ["SMTP_USERNAME / SMTP_PASSWORD", "Usually", "SMTP login. For Gmail and Microsoft 365 use an app password."],
      ["SMTP_FROM", "Recommended", "Sender address, e.g. Fastlane CI <ci@example.com>"],
      ["TEST_ALERT_EMAIL_RECIPIENTS", "Required", "Comma-separated recipients"],
    ]} />
    <CodeBlock language="yaml" filename="fastlane/config/testing.yml" code={`notifications:
  email:
    enabled: true
    notify_on_success: true    # set false to e-mail only failures
    notify_on_failure: true
    recipients: "\${TEST_ALERT_EMAIL_RECIPIENTS}"`} />
    <Terminal title="my-app — zsh" lines={`
~ [14:10:13]: [EmailNotifier] Test report email sent to qa-lead@example.com, dev-team@example.com
! [14:10:13]: [EmailNotifier] SMTP_HOST not set; skipping email alert.`} caption="The first line is a successful send; the second is what you see when SMTP is not configured." />
    <Callout type="tip">to see a failure e-mail without breaking a real build, temporarily add a test case ID that does not exist to <C>test_case_ids.yml</C>. The agent fails, and a red “Tests Failed” e-mail and card are sent.</Callout>
    <Screenshot app="Outlook — Inbox" caption="The same e-mail when a test fails: red header, failure reason and failed devices."><EmailReportShot passed={false} /></Screenshot>

    <H2>Troubleshooting</H2>
    <ParamTable codeFirst={false} head={["Symptom", "Fix"]} rows={[
      ["“Property 'type' must be 'AdaptiveCard'”", "You are posting plain text to a Workflows URL. Use the Adaptive Card payload above. The framework already does."],
      ["Teams webhook returned 401", <>The URL is incomplete or the workflow was recreated. Copy the full URL again, including <C>sig=</C>.</>],
      ["“Teams webhook URL is not configured.”", <><C>TEAMS_WEBHOOK_URL</C> is empty, or the variable isn't set in CI secrets.</>],
      ["Card arrives, but no “View CI Run” button", "Expected for local runs. The button needs GitHub Actions variables."],
      ["No e-mail", <>Check <C>SMTP_HOST</C>, the recipients, and <C>notifications.email.enabled</C>; look for <C>[EmailNotifier]</C> lines in the log.</>],
      ["Gmail: 535 Authentication failed", <>Use an <Ext href="https://support.google.com/accounts/answer/185833">app password</Ext>, not the account password.</>],
    ]} />
    <OfficialDocs links={[L.teamsWorkflows, L.adaptiveCards, L.slackWebhooks, L.ghSecrets]} />
  </>
);

function ShotTabs({ tabs }: { tabs: { label: string; body: ReactNode }[] }) {
  const [active, setActive] = useState(0);
  return (
    <div className="my-4">
      <div className="flex flex-wrap gap-1 border-b" role="tablist">
        {tabs.map((t, i) => (
          <button key={t.label} role="tab" aria-selected={i === active} onClick={() => setActive(i)}
            className={i === active ? "-mb-px border-b-2 border-primary px-3 py-2 text-[14px] font-medium text-primary" : "px-3 py-2 text-[14px] text-muted-foreground hover:text-foreground"}>
            {t.label}
          </button>
        ))}
      </div>
      {tabs[active]!.body}
    </div>
  );
}

const ProdSafety = () => (
  <>
    <p>Guard production distributions with branch rules, confirmation and CI-only execution.</p>
    <CodeBlock language="yaml" code={`safety:
  require_confirmation: true   # interactive "Continue?" prompt (skipped on CI)
  require_ci: false            # true = refuse to run outside CI
  allowed_branches: ["main"]   # wildcards allowed, e.g. "release/*"`} />
    <Terminal title="my-app — zsh" lines={`
$ git branch --show-current
feature/login
$ bundle exec fastlane android production
x [!] Current Git branch 'feature/login' is not allowed. Allowed: main
$ git switch main && bundle exec fastlane android production
? You are about to distribute a PRODUCTION build. Continue? (y/n) y`} caption="The guard applies to the platform lanes, to setup and to run_profile alike." />
    <OfficialDocs links={[L.fastlaneCi]} />
  </>
);

const GithubActions = () => (
  <>
    <p>There are two workflows, <strong>Android Distribution</strong> and <strong>iOS Distribution</strong>. Each runs <C>doctor</C>, then distributes, and uploads the APK/IPA as a build artifact (kept 14 days). Run them from <strong>Actions → &lt;workflow&gt; → Run workflow</strong> and pick an environment.</p>
    <H2>When they run</H2>
    <ParamTable codeFirst={false} head={["Event", "Android", "iOS"]} rows={[
      ["Pull request into main merged", <>Runs (environment <C>ANDROID_AUTO_ENVIRONMENT</C>, default development)</>, <>Only if variable <C>IOS_AUTO_DISTRIBUTE=true</C> (environment <C>IOS_AUTO_ENVIRONMENT</C>, default staging). Otherwise the run shows as <strong>skipped</strong>.</>],
      ["PR opened / updated / closed without merge", "—", "—"],
      [<>Only <C>*.md</C>, <C>docs/**</C> or <C>functions/**</C> changed</>, "—", "—"],
      ["Actions → Run workflow (manual)", "Any environment", "Any environment, with channel checkboxes"],
    ]} />
    <H2>iOS channels</H2>
    <ParamTable codeFirst={false} head={["Channel", "Manual run (checkbox)", "Merged PR (repository variable)", "Lane"]} rows={[
      ["Firebase App Distribution (Ad Hoc)", <><C>firebase</C>, on by default</>, <><C>IOS_FIREBASE</C>, default <C>true</C></>, <C>ios firebase</C>],
      ["TestFlight", <><C>testflight</C>, off by default</>, <><C>IOS_TESTFLIGHT</C>, default <C>false</C></>, <C>ios distribute</C>],
    ]} />
    <ul>
      <li>Each selected channel builds its own IPA (Ad Hoc and App Store), so selecting both takes about twice as long.</li>
      <li>Production never goes to Firebase: the workflow skips that channel with a notice. The job fails if no channel is left.</li>
      <li><strong>Firebase fallback:</strong> when the environment's <C>FIREBASE_IOS_&lt;ENV&gt;_APP_ID</C> and Firebase credentials are set, the build goes to Firebase if no channel is selected, or if the TestFlight upload fails (for example, the app is not in App Store Connect yet). A fallback run ends with a warning.</li>
      <li><strong>The App Store Connect API key is required for both channels on CI</strong>, because runners have no Apple ID signed in to Xcode.</li>
    </ul>
    <Callout type="tip" title="Turning on iOS CI">add the iOS secrets, run the workflow manually for <C>staging</C> with Firebase ticked, then with TestFlight ticked. Only after both pass, set <C>IOS_AUTO_DISTRIBUTE=true</C> (and <C>IOS_TESTFLIGHT=true</C> if merged PRs should go to TestFlight).</Callout>
    <GithubRunIosWorkflowShot />
    <GithubVariablesShot />
    <H2>Secrets</H2>
    <ParamTable codeFirst={false} head={["Android", "iOS"]} rows={[
      [<><C>FIREBASE_TOKEN</C> (needed for AI tests)</>, <C>APP_STORE_CONNECT_KEY_ID</C>],
      [<><C>FIREBASE_SERVICE_ACCOUNT_JSON</C> (full JSON, written to a temp file)</>, <C>APP_STORE_CONNECT_ISSUER_ID</C>],
      [<><C>FIREBASE_ANDROID_&lt;ENV&gt;_APP_ID</C>, <C>FIREBASE_ANDROID_&lt;ENV&gt;_GROUPS</C></>, <><C>APP_STORE_CONNECT_KEY_CONTENT</C> (raw .p8)</>],
      [<><C>FIREBASE_TEST_USERNAME</C>, <C>FIREBASE_TEST_PASSWORD</C> (optional)</>, <C>APPLE_TEAM_ID</C>],
      [<><C>TEAMS_WEBHOOK_URL</C>, <C>SMTP_*</C> (optional)</>, <><C>MATCH_GIT_URL</C>, <C>MATCH_GIT_BRANCH</C>, <C>MATCH_PASSWORD</C> (match only)</>],
      ["", <><strong>Firebase channel:</strong> <C>FIREBASE_SERVICE_ACCOUNT_JSON</C> (or <C>FIREBASE_TOKEN</C>), <C>FIREBASE_IOS_&lt;ENV&gt;_APP_ID</C>, <C>FIREBASE_IOS_&lt;ENV&gt;_GROUPS</C></>],
    ]} />
    <Callout type="note">repository variables (all optional): <C>ANDROID_AUTO_ENVIRONMENT</C>, <C>IOS_AUTO_DISTRIBUTE</C>, <C>IOS_AUTO_ENVIRONMENT</C>, <C>IOS_FIREBASE</C>, <C>IOS_TESTFLIGHT</C>, <C>VERSION_NAME</C>. <C>GITHUB_RUN_NUMBER</C> is used as the build number automatically.</Callout>
    <H2>Add the secrets</H2>
    <Steps>
      <Step>In GitHub open <strong>Settings → Secrets and variables → Actions → New repository secret</strong> (<Ext href={L.ghSecrets.href}>GitHub: using secrets</Ext>).</Step>
      <Step>Add each value from the table. For multi-line values (service-account JSON, <C>.p8</C>), paste the whole content.</Step>
      <Step>Run the workflow from <strong>Actions → Run workflow</strong> (<Ext href={L.ghDispatch.href}>workflow_dispatch</Ext>).</Step>
    </Steps>
    <H2>Minimal workflow</H2>
    <CodeBlock language="yaml" filename=".github/workflows/android-distribution.yml (excerpt)" code={`on:
  workflow_dispatch:
    inputs:
      environment:
        type: choice
        options: [development, staging, uat, production]

jobs:
  android:
    runs-on: ubuntu-latest
    timeout-minutes: 90
    steps:
      - uses: actions/checkout@v4
        with: { fetch-depth: 50 }        # git release notes need history
      - uses: actions/setup-java@v4
        with: { distribution: temurin, java-version: 17 }
      - uses: ruby/setup-ruby@v1
        with: { bundler-cache: true }    # reads .ruby-version + Gemfile.lock
      - run: npm ci
      - run: bundle exec fastlane android doctor environment:\${{ inputs.environment }}
      - run: bundle exec fastlane android distribute environment:\${{ inputs.environment }}
        env:
          FIREBASE_TOKEN: \${{ secrets.FIREBASE_TOKEN }}
          TEAMS_WEBHOOK_URL: \${{ secrets.TEAMS_WEBHOOK_URL }}`} />
    <Callout type="tip">to run a saved setup instead, replace the last two steps with <Cmd>bundle exec fastlane run_profile name:&lt;profile&gt;</Cmd>. See <DocLink to="setup/profiles">Profiles &amp; CI</DocLink>.</Callout>
    <OfficialDocs links={[L.fastlaneGithubActions, L.ghActions, L.ghSecrets, L.ghDispatch, L.setupRuby]} />
  </>
);

const Lanes = () => (
  <>
    <p>Always run through Bundler from the project root. Pass the environment as <C>environment:&lt;name&gt;</C>, or set <C>APP_ENV</C>.</p>
    <ParamTable head={["Command", "What it does"]} rows={[
      ["bundle exec fastlane init_project", <>Interactive: generates <C>fastlane/config/environments.yml</C></>],
      ["bundle exec fastlane setup", "Interactive: reuse or create a setup (platform, env, flavor, APK/AAB…), then run it"],
      ["bundle exec fastlane run_profile name:<profile>", <>Runs a saved profile without prompts (<C>dry_run:true</C> = doctor + info only)</>],
      ["bundle exec fastlane profiles", "Lists saved profiles and the last one used"],
      ["bundle exec fastlane android doctor environment:staging", "Validates config, Gradle wrapper, Gradle task, artifact type, Firebase app id/groups/credentials, AI test setup"],
      ["bundle exec fastlane android info environment:staging", "Prints resolved config (no secrets)"],
      ["bundle exec fastlane android build environment:staging", <>Gradle build → finds artifact → copies named file to <C>dist/</C></>],
      ["bundle exec fastlane android distribute environment:staging", "Full pipeline"],
      ["bundle exec fastlane android development / staging / uat / production", "Shortcuts for distribute"],
      ["bundle exec fastlane ios doctor environment:staging", "pod install, workspace, shared scheme, signing; reports TestFlight and Firebase readiness separately"],
      ["bundle exec fastlane ios info environment:staging", "Prints resolved iOS config"],
      ["bundle exec fastlane ios build environment:staging", <>pod install → signing → build number → signed IPA in <C>dist/ios/&lt;env&gt;/</C></>],
      ["bundle exec fastlane ios firebase environment:staging", "Ad Hoc IPA → Firebase App Distribution (no API key needed on a Mac signed in to Xcode)"],
      ["bundle exec fastlane ios distribute environment:staging", "Build + upload to TestFlight (+ external groups)"],
      ["bundle exec fastlane ios development / staging / uat / production", "Shortcuts for distribute"],
      ["bundle exec fastlane lanes", "List all lanes"],
    ]} />
    <Terminal title="my-app — zsh" lines={`
$ bundle exec fastlane lanes
~ --------- general---------
----- fastlane init_project
Interactive one-time project setup: generates fastlane/config/environments.yml
----- fastlane setup
Interactive build setup: reuse a saved setup or create a new one, then run it
----- fastlane run_profile
Run a saved setup profile without prompts (CI friendly). Options: name:<profile> dry_run:true
~ --------- android---------
----- fastlane android doctor
Validate the Android Fastlane distribution configuration
----- fastlane android distribute
Build and distribute the Android application using Firebase App Distribution`} caption="fastlane lanes prints every lane with its description (shortened)." />
    <OfficialDocs links={[L.fastlaneLanes, L.fastlaneFastfile]} />
  </>
);

const troubles: [string, string][] = [
  ['403 PERMISSION_DENIED → "App Testing Agent test execution failed: Invalid request"', "The App Testing agent rejects service accounts. Use FIREBASE_TOKEN from firebase login:ci with the account that opted in; confirm the owner opted in and the Tool Results API is enabled."],
  ["Manual testers didn't receive the build", "The group alias in FIREBASE_ANDROID_<ENV>_GROUPS must exactly match the alias in Firebase. With AI tests on, the framework distributes first."],
  ["Test Case <id> not found", "The ID in test_case_ids.yml must match the console ID and belong to the same Firebase app."],
  ["AI test fails after login / sees a blank screen", "FLAG_SECURE is enabled for that screen."],
  ["AI test quota exceeded", "The limit is 200 tests/month; reduce devices or test cases."],
  ["R8: Missing class com.gemalto.jp2.JP2Decoder", "Add -dontwarn com.gemalto.jp2.** to android/app/proguard-rules.pro (optional JPEG2000 decoder used by pdfbox-android)."],
  ["Gradle task 'X' was not found", "Fix gradle_task (exact task name, flavors included)."],
  ["No APK artifact found", "artifact.glob doesn't match the Gradle output folder."],
  ["Missing required configuration: …", "The YAML value is empty or the ${ENV_VAR} isn't set."],
  ["Teams: \"Property 'type' must be 'AdaptiveCard'\"", "The webhook needs an Adaptive Card payload; update to the latest notification_helper.rb."],
  ["Invoke-RestMethod: Uri … null or empty", "PowerShell doesn't load .env; set $env:TEAMS_WEBHOOK_URL first."],
  ["iOS lanes require macOS with Xcode installed", "Expected on Windows/Linux."],
  ["iOS workspace … does not exist", "pod install failed; run cd ios && bundle exec pod install."],
  ["iOS scheme '…' was not found", "Mark the scheme as Shared and commit xcshareddata."],
  ["TestFlight: bundle version already used", "Set BUILD_NUMBER or keep auto_increment_build_number: true."],
  ["TestFlight build stuck on Missing Compliance", "Answer the encryption question in App Store Connect, or add ITSAppUsesNonExemptEncryption (NO for standard HTTPS only) to Info.plist."],
  ["ITMS-90683: Missing purpose string in Info.plist", "Add the named NS…UsageDescription key (camera, photo library, location, Face ID…) to Info.plist and upload again."],
  ["No suitable application records were found", "Create the app in App Store Connect, or fix ios bundle_identifier so it matches the app record exactly."],
  ["App Store Connect: Authentication credentials are missing or invalid (401)", "Wrong APP_STORE_CONNECT_KEY_ID or ISSUER_ID, a revoked key, or a .p8 that belongs to another key."],
  ["Missing required configuration: APP_STORE_CONNECT_KEY_ID", "A TestFlight lane ran without the API key. Use ios firebase, or add the key."],
  ["⏩ No testers or groups passed in. Skipping this step. (iOS Firebase)", "Not an error: the build uploaded but went to nobody. Set FIREBASE_IOS_<ENV>_GROUPS to a group alias (case-sensitive)."],
  ["Tester can't install an iOS Firebase build (Unable to install)", "Their device isn't in the Ad Hoc profile. Export UDIDs from Firebase, register them at developer.apple.com, then run ios firebase again."],
  ["The Swift pod FirebaseCoreInternal depends upon GoogleUtilities, which does not define modules", "Add pod 'GoogleUtilities' and pod 'FirebaseCore' with :modular_headers => true to the Podfile (see iOS → First run)."],
  ["Archive fails: IPHONEOS_DEPLOYMENT_TARGET … supported range 15.0 to …", "Add the Podfile post_install fix that raises pod deployment targets to 15.0, then pod install."],
  ["No Account for Team / requires a development team", "Sign in to Xcode (Settings → Accounts) with an Apple ID on the team, or set the API key."],
  ["iOS Distribution workflow run shows skipped", "Merged PRs only run it when the repository variable IOS_AUTO_DISTRIBUTE=true. Run it manually until iOS CI is verified."],
  ["iOS signing on CI needs the App Store Connect API key", "Add the APP_STORE_CONNECT_KEY_ID, _ISSUER_ID and _KEY_CONTENT repository secrets. CI needs them for both iOS channels."],
  ["`fastlane setup` is interactive. In CI use: fastlane run_profile name:<profile>", "setup and init_project need a person to answer. In CI, run bundle exec fastlane run_profile name:<profile>."],
  ["Profile '<name>' not found", "Check fastlane/config/profiles/<name>.yml exists and is committed; names are lower-case with dashes. List them with bundle exec fastlane profiles."],
  ["No product flavors detected", "init_project / setup read productFlavors from android/app/build.gradle(.kts). If flavors come from a plugin or script, answer n to “Use this Gradle task and glob?” and type the task."],
  ["No shared environments for android + ios", "When both platforms are chosen, only environment names that exist under both android.environments and ios.environments are offered."],
  ["E-mail report not received", "Check SMTP_*, TEST_ALERT_EMAIL_RECIPIENTS and notifications.email.enabled. Errors are logged, not fatal."],
];

const FRAMEWORK_CONTEXT = `I use the Mobile Fastlane Framework: a configuration-driven fastlane setup with a generic Fastfile + fastlane/lib/*.rb (do not fork per project). Project settings live in fastlane/config/environments.yml, testing.yml, test_case_ids.yml and saved setups in fastlane/config/profiles/*.yml; secrets come from .env or CI secrets. Android builds with Gradle and distributes via the firebase_app_distribution plugin (optional Firebase App Testing agent); iOS builds with build_app and distributes either as an Ad Hoc IPA to Firebase App Distribution (fastlane ios firebase) or to TestFlight with upload_to_testflight (fastlane ios distribute). fastlane 2.240.1, run with bundle exec.`;

const ASK_RULES = `Please:
1. Explain the root cause in plain words.
2. Tell me exactly which value or setting to change (environments.yml, a profile, .env, Firebase console, App Store Connect, Teams…). Only suggest editing the Fastfile or lib/ if it is clearly a framework bug.
3. Give me the command to verify the fix, preferring \`bundle exec fastlane <platform> doctor environment:<env>\` or \`bundle exec fastlane run_profile name:<profile> dry_run:true\` before a full build.`;

const GENERAL_PROMPT = `${FRAMEWORK_CONTEXT}

My run failed. Details:
- Platform: <android | ios>
- Environment / profile: <e.g. staging, or profile development-apk>
- Command I ran: <e.g. bundle exec fastlane android distribute environment:staging>
- OS / CI: <Windows 11 local | macOS | GitHub Actions>
- What I expected: <…>

Error output (include the "Called from Fastfile at line …" block, the fastlane summary table and the first lines of the Ruby backtrace):
\`\`\`
<paste the log here>
\`\`\`

Relevant config (secrets removed):
\`\`\`yaml
<paste the environment block from environments.yml and/or the profile file>
\`\`\`

${ASK_RULES}`;

const issuePrompt = (symptom: string, fix: string) => `${FRAMEWORK_CONTEXT}

I'm getting this error: "${symptom}"
The framework docs suggest: ${fix}

Help me confirm whether that applies to my case and fix it. My details:
- Platform / environment / command: <…>
- Log excerpt:
\`\`\`
<paste the log around the error>
\`\`\`
- Relevant config (secrets removed):
\`\`\`yaml
<paste>
\`\`\`

${ASK_RULES}`;

const Troubleshooting = () => {
  const [q, setQ] = useState("");
  const list = troubles.filter(([s, f]) => (s + f).toLowerCase().includes(q.toLowerCase()));
  return (
    <>
      <p>Common symptoms and how to fix them. If your error isn't listed, or the fix doesn't help, ask Claude with the prompt below.</p>
      <H2>Ask Claude</H2>
      <p>Copy the prompt, open Claude, and fill in the <C>&lt;…&gt;</C> placeholders. The prompt gives Claude the framework's structure, so it can point to the exact config value instead of suggesting Fastfile edits.</p>
      <ClaudePrompt description="General troubleshooting prompt: works for any failed lane." prompt={GENERAL_PROMPT} />
      <Callout type="warning">remove secrets before pasting: <C>FIREBASE_TOKEN</C>, service-account JSON, <C>.p8</C> keys, passwords and webhook URLs (anything containing <C>sig=</C>). Replace them with <C>&lt;redacted&gt;</C>. Group aliases, app IDs and lane output are fine to share.</Callout>

      <H2>Known issues</H2>
      <label className="my-4 flex items-center gap-2 rounded-full border bg-surface-variant px-4 py-2">
        <Icon name="search" className="text-muted-foreground" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter by error message…" className="w-full bg-transparent text-[15px] outline-none" />
      </label>
      <Accordion icon="error" items={list.map(([s, f]) => ({
        q: <code className="font-mono text-[14px] font-normal">{s}</code>,
        a: (
          <>
            <p className="mb-3!"><strong className="font-medium">Fix:</strong> {f}</p>
            <CopyButton text={issuePrompt(s, f)} label="Copy Claude prompt for this error" />
          </>
        ),
      }))} />
      {list.length === 0 && <p className="text-muted-foreground">No matching issues. Use the general prompt above.</p>}
    </>
  );
};

const faqs: [string, string][] = [
  ["Do I need Android flavors?", "No. A project with only assembleRelease works with use_flavors: false."],
  ["How do I support a custom Gradle task?", 'Set the exact task, e.g. gradle_task: "assembleInternalQaRelease". Don\'t change the Fastfile.'],
  ["Can I upload AAB instead of APK?", "Yes. Set artifact.type: AAB, use a bundle… task and the .aab output path. This is subject to Firebase's Google Play linkage requirements."],
  ["Why groups instead of tester e-mails?", "Groups scale better, and the config stays stable while membership changes in Firebase."],
  ["Can Teams be enabled without changing the Fastfile?", "Yes. Set TEAMS_WEBHOOK_URL and notifications.teams.enabled: true. Notification failures are non-blocking."],
  ["Can production be protected?", "Yes, with allowed branches, CI-only execution and local confirmation."],
  ["Why can staging and production both use assembleRelease?", "The environment is a distribution concern. Truly isolated environments should use separate app ids, flavors or schemes."],
  ["Does iOS use Firebase App Distribution?", "Yes, as an optional channel: fastlane ios firebase uploads an Ad Hoc IPA to Firebase (testers' devices must be registered). TestFlight (ios distribute) is the other channel and the only one used for production."],
  ["Do I need the App Store Connect API key for iOS?", "For TestFlight, yes. For Firebase builds on a Mac, no: they sign with the Apple ID in Xcode. On CI, both channels need the key."],
  ["How do I choose APK or AAB per build without editing YAML?", "Run bundle exec fastlane setup and pick the artifact, or save the choice as a profile and run it with run_profile."],
  ["Are saved profiles safe to commit?", "Yes, as long as they contain no secrets. Profiles hold choices (env, flavor, artifact, groups); credentials stay in .env or CI secrets."],
  ["Does the interactive setup replace the platform lanes?", "No. It produces overrides and then calls the same doctor, build and distribute lanes, so validation and production guards still apply."],
];
const Faq = () => (
  <>
    <p>Answers to common questions about the framework.</p>
    <Accordion items={faqs.map(([q, a]) => ({ q, a }))} />
  </>
);

export const configurePages: DocPage[] = [
  { slug: "configure/environments-yml", title: "environments.yml reference", description: "Project, notifications, release notes, security and artifact naming settings.", body: EnvYml },
  { slug: "configure/testing-yml", title: "testing.yml reference", description: "App Testing agent switches, devices and e-mail reports.", body: TestingYml },
  { slug: "configure/test-case-ids", title: "test_case_ids.yml", description: "Which Firebase test cases run after each upload.", body: TestCaseIds },
  { slug: "configure/env-vars", title: "Environment variables & secrets", description: "Every environment variable the framework reads.", body: EnvVars },
  { slug: "configure/release-notes", title: "Release notes, versioning, artifacts", description: "Release-note priority, version numbers and artifact naming.", body: ReleaseNotes },
  { slug: "configure/notifications", title: "Notifications (Teams & e-mail)", description: "Teams Adaptive Cards, Slack and AI test report e-mails.", body: Notifications },
  { slug: "configure/production-safety", title: "Production safety", description: "Branch rules, confirmation and CI-only execution for production.", body: ProdSafety },
];
export const ciPages: DocPage[] = [
  { slug: "ci/github-actions", title: "GitHub Actions", description: "Manual Android and iOS distribution workflows and their secrets.", body: GithubActions },
];
export const referencePages: DocPage[] = [
  { slug: "reference/lanes", title: "Lanes and commands", description: "Every Fastlane lane and what it does.", body: Lanes },
];
export const helpPages: DocPage[] = [
  { slug: "help/troubleshooting", title: "Troubleshooting", description: "Symptoms and fixes for common errors.", body: Troubleshooting },
  { slug: "help/faq", title: "FAQ", description: "Frequently asked questions.", body: Faq },
];

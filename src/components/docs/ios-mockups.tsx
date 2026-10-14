import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Screenshot } from "./mockups";
import { Icon } from "./ui";

/*
 * Illustrations of the vendor screens used in the iOS setup (Firebase console, Apple Developer,
 * App Store Connect, Xcode, GitHub). Labels follow the real UIs; IDs and names are placeholders.
 * Orange numbered markers show what to click and match the numbered steps next to them.
 * Replace any of them with a real, redacted screenshot (ImageShot) when one is available.
 */

/** Orange numbered marker. */
function N({ n, className }: { n: number; className?: string }) {
  return (
    <span className={cn("inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#e8710a] text-[11px] font-bold text-white shadow", className)} aria-label={`Step ${n}`}>
      {n}
    </span>
  );
}

/** Wraps the element the reader has to click / read. */
function Hi({ n, children, className }: { n?: number; children: ReactNode; className?: string }) {
  return (
    <span className={cn("relative inline-flex items-center rounded-md ring-2 ring-[#e8710a] ring-offset-2 ring-offset-white", className)}>
      {children}
      {n !== undefined && <N n={n} className="absolute -right-3 -top-3" />}
    </span>
  );
}

function Btn({ children, primary, className }: { children: ReactNode; primary?: boolean; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded px-2.5 py-1 text-[12px] font-medium", primary ? "bg-[#1a73e8] text-white" : "border border-slate-300 bg-white text-slate-700", className)}>
      {children}
    </span>
  );
}

function Field({ label, value, mono, hi }: { label: string; value: ReactNode; mono?: boolean; hi?: number }) {
  const v = <span className={cn("text-[13px] text-slate-800", mono && "font-mono text-[12px]")}>{value}</span>;
  return (
    <div className="grid grid-cols-[130px_1fr] items-center gap-2 py-1">
      <span className="text-[12px] text-slate-500">{label}</span>
      <span>{hi !== undefined ? <Hi n={hi} className="px-1">{v}</Hi> : v}</span>
    </div>
  );
}

/** Console page: optional left nav, breadcrumb/title row, content. */
function Console({ nav, active, title, crumbs, children, accent = "#1a73e8" }: { nav?: string[]; active?: string; title: ReactNode; crumbs?: string; children: ReactNode; accent?: string }) {
  return (
    <div className="flex min-h-[200px] overflow-hidden rounded-md border border-slate-200 bg-white text-[13px]">
      {nav && (
        <div className="hidden w-[150px] shrink-0 border-r border-slate-200 bg-slate-50 py-2 sm:block">
          {nav.map((item) => (
            <div key={item} className={cn("truncate px-3 py-1.5 text-[12px]", item === active ? "font-semibold" : "text-slate-600")} style={item === active ? { color: accent, background: `${accent}14` } : undefined}>
              {item}
            </div>
          ))}
        </div>
      )}
      <div className="min-w-0 flex-1 p-3 sm:p-4">
        {crumbs && <div className="mb-1 text-[11px] text-slate-500">{crumbs}</div>}
        <div className="mb-3 text-[16px] font-semibold text-slate-900">{title}</div>
        {children}
      </div>
    </div>
  );
}

const ILL = "Illustration";

/* ------------------------------ Firebase console ------------------------------ */

/** Project settings → General → Your apps → iOS app. */
export function FirebaseIosAppShot() {
  return (
    <Screenshot app="Firebase console — Project settings" caption={<>{ILL}. <strong>1</strong> copy the iOS <strong>App ID</strong> into <code>FIREBASE_IOS_&lt;ENV&gt;_APP_ID</code>; <strong>2</strong> check the bundle id; <strong>3</strong> download <code>GoogleService-Info.plist</code> into <code>ios/</code>.</>}>
      <Console nav={["Project Overview", "Project settings", "App Distribution", "Analytics"]} active="Project settings" crumbs="Project settings › General" title="Your apps" accent="#f57c00">
        <div className="mb-2 flex gap-2 text-[12px]">
          <span className="rounded-full border border-slate-300 px-2 py-0.5 text-slate-500">Android apps</span>
          <span className="rounded-full bg-[#fff3e0] px-2 py-0.5 font-medium text-[#e65100]">Apple apps</span>
        </div>
        <div className="rounded border border-slate-200 p-3">
          <div className="mb-2 flex items-center gap-2 font-medium"><Icon name="phone_iphone" className="text-[18px] text-slate-500" />MyApp (iOS)</div>
          <Field label="App ID" value="1:123456789012:ios:a1b2c3d4e5f6a7b8" mono hi={1} />
          <Field label="App nickname" value="MyApp (iOS)" />
          <Field label="Bundle ID" value="com.example.myapp" mono hi={2} />
          <div className="mt-3"><Hi n={3}><Btn><Icon name="download" className="text-[16px]" />GoogleService-Info.plist</Btn></Hi></div>
        </div>
      </Console>
    </Screenshot>
  );
}

/** App Distribution → Testers & Groups. */
export function FirebaseTestersShot() {
  return (
    <Screenshot app="Firebase console — App Distribution" caption={<>{ILL}. <strong>1</strong> open <strong>Testers &amp; Groups</strong>; <strong>2</strong> the group <strong>alias</strong> (not the display name) goes into <code>FIREBASE_IOS_&lt;ENV&gt;_GROUPS</code>; <strong>3</strong> <strong>Export Apple UDIDs</strong> downloads the device list for Apple.</>}>
      <Console nav={["Project Overview", "App Distribution", "Crashlytics"]} active="App Distribution" title="App Distribution" accent="#f57c00">
        <div className="mb-3 flex flex-wrap items-center gap-3 border-b border-slate-200 pb-2 text-[12px] text-slate-600">
          <span>Releases</span><span>Invite links</span>
          <Hi n={1}><span className="px-1 font-semibold text-[#e65100]">Testers &amp; Groups</span></Hi>
          <span>Feedback</span>
          <span className="ml-auto"><Hi n={3}><Btn><Icon name="download" className="text-[16px]" />Export Apple UDIDs</Btn></Hi></span>
        </div>
        <div className="rounded border border-slate-200">
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-3 py-2">
            <div><div className="font-medium">QA Team</div><div className="text-[12px] text-slate-500">Alias: <Hi n={2} className="px-1"><code className="text-[12px] text-slate-800">qa-team</code></Hi></div></div>
            <span className="text-[12px] text-slate-500">3 testers</span>
          </div>
          {[["anita@example.com", "Accepted · iPhone 15 registered"], ["rahul@example.com", "Accepted · iPhone 13 registered"], ["new.tester@example.com", "Invited"]].map(([e, s]) => (
            <div key={e} className="flex justify-between border-b border-slate-100 px-3 py-1.5 text-[12px] last:border-0"><span>{e}</span><span className="text-slate-500">{s}</span></div>
          ))}
        </div>
      </Console>
    </Screenshot>
  );
}

/* ------------------------------ Apple Developer ------------------------------ */

/** Certificates, Identifiers & Profiles → Devices → Register Multiple Devices. */
export function AppleRegisterDevicesShot() {
  return (
    <Screenshot app="Apple Developer — Certificates, Identifiers & Profiles" caption={<>{ILL}. <strong>1</strong> Devices → <strong>+</strong>; <strong>2</strong> choose <strong>Register Multiple Devices</strong>; <strong>3</strong> upload the file exported from Firebase, then <strong>Continue</strong>. Rebuild with <code>ios firebase</code> afterwards.</>}>
      <Console nav={["Certificates", "Identifiers", "Devices", "Profiles", "Keys"]} active="Devices" title={<span className="flex items-center gap-2">Register a New Device <Hi n={1}><span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#0071e3] text-white"><Icon name="add" className="text-[16px]" /></span></Hi></span>} accent="#0071e3">
        <div className="space-y-2 text-[13px]">
          <label className="flex items-center gap-2 text-slate-500"><span className="h-3.5 w-3.5 rounded-full border border-slate-400" />Register a Device</label>
          <Hi n={2}><label className="flex items-center gap-2 px-1 font-medium"><span className="flex h-3.5 w-3.5 items-center justify-center rounded-full border-4 border-[#0071e3]" />Register Multiple Devices</label></Hi>
          <div className="pt-2">
            <div className="mb-1 text-[12px] text-slate-500">Device List</div>
            <Hi n={3}><Btn>Choose File</Btn><span className="px-2 text-[12px] text-slate-600">firebase-udids.txt</span></Hi>
          </div>
          <div className="flex justify-end pt-2"><Btn primary className="bg-[#0071e3]">Continue</Btn></div>
        </div>
      </Console>
    </Screenshot>
  );
}

/* ------------------------------ Xcode ------------------------------ */

/** Xcode → Settings → Accounts. */
export function XcodeAccountsShot() {
  return (
    <Screenshot app="Xcode — Settings › Accounts" caption={<>{ILL}. <strong>1</strong> sign in with <strong>+</strong> → Apple ID; <strong>2</strong> the account must list the team that owns the app. Local <code>ios firebase</code> builds sign with this account. Copy the Team ID (developer.apple.com → Membership) into <code>APPLE_TEAM_ID</code>.</>}>
      <div className="rounded-md border border-slate-200 bg-white text-[13px]">
        <div className="flex justify-center gap-5 border-b border-slate-200 py-2 text-[12px] text-slate-500">
          <span>General</span><span className="font-semibold text-[#0071e3]">Accounts</span><span>Behaviors</span><span>Locations</span><span>Platforms</span>
        </div>
        <div className="grid grid-cols-[180px_1fr]">
          <div className="border-r border-slate-200 p-2">
            <div className="rounded bg-[#0071e3] px-2 py-1 text-[12px] text-white">you@example.com</div>
            <div className="mt-24 flex gap-2 text-slate-600"><Hi n={1}><span className="px-1.5">+</span></Hi><span>−</span></div>
          </div>
          <div className="p-3">
            <div className="mb-2 font-medium">Apple ID: you@example.com</div>
            <div className="text-[12px] text-slate-500">Teams</div>
            <div className="mt-1 rounded border border-slate-200">
              <div className="grid grid-cols-[1fr_120px] border-b border-slate-200 bg-slate-50 px-2 py-1 text-[11px] text-slate-500"><span>Name</span><span>Role</span></div>
              <Hi n={2} className="w-full"><div className="grid w-full grid-cols-[1fr_120px] px-2 py-1 text-[12px]"><span>Example Company Pvt Ltd</span><span>App Manager</span></div></Hi>
              <div className="grid grid-cols-[1fr_120px] px-2 py-1 text-[12px] text-slate-500"><span>You (Personal Team)</span><span>User</span></div>
            </div>
          </div>
        </div>
      </div>
    </Screenshot>
  );
}

/** Product → Scheme → Manage Schemes… → Shared. */
export function XcodeSharedSchemeShot() {
  return (
    <Screenshot app="Xcode — Product › Scheme › Manage Schemes…" caption={<>{ILL}. <strong>1</strong> tick <strong>Shared</strong> for the app scheme, then commit <code>ios/MyApp.xcodeproj/xcshareddata/</code>. <code>ios doctor</code> fails with "scheme … was not found" until this is done.</>}>
      <div className="rounded-md border border-slate-200 bg-white text-[13px]">
        <div className="grid grid-cols-[50px_1fr_1fr_70px] border-b border-slate-200 bg-slate-50 px-2 py-1 text-[11px] text-slate-500"><span>Show</span><span>Scheme</span><span>Container</span><span>Shared</span></div>
        {[["MyApp", "MyApp project", true], ["MyApp-tvOS", "MyApp project", false]].map(([s, c, on]) => (
          <div key={String(s)} className="grid grid-cols-[50px_1fr_1fr_70px] items-center border-b border-slate-100 px-2 py-1.5 last:border-0">
            <span className="text-[#0071e3]">☑</span><span>{s}</span><span className="text-slate-500">{c}</span>
            <span>{on ? <Hi n={1}><span className="px-1 text-[#0071e3]">☑</span></Hi> : <span className="text-slate-400">☐</span>}</span>
          </div>
        ))}
      </div>
    </Screenshot>
  );
}

/* ------------------------------ App Store Connect ------------------------------ */

const ascNav = ["Apps", "Users and Access", "Business", "Sales and Trends"];

/** Users and Access → Integrations → App Store Connect API → Team Keys. */
export function AscApiKeysShot() {
  return (
    <Screenshot app="App Store Connect — Users and Access" caption={<>{ILL}. <strong>1</strong> Integrations → <strong>App Store Connect API</strong> → <strong>Team Keys</strong>; <strong>2</strong> the <strong>Issuer ID</strong> → <code>APP_STORE_CONNECT_ISSUER_ID</code>; <strong>3</strong> <strong>+</strong> generates a key (name it, role App Manager or Admin); <strong>4</strong> its <strong>Key ID</strong> → <code>APP_STORE_CONNECT_KEY_ID</code>; <strong>5</strong> <strong>Download</strong> the <code>.p8</code> — possible only once.</>}>
      <Console nav={["People", "Sandbox", "Integrations"]} active="Integrations" crumbs="Users and Access" title="App Store Connect API" accent="#0071e3">
        <div className="mb-3 flex gap-4 border-b border-slate-200 pb-2 text-[12px]">
          <Hi n={1}><span className="px-1 font-semibold text-[#0071e3]">Team Keys</span></Hi><span className="text-slate-500">Individual Keys</span>
        </div>
        <Field label="Issuer ID" value="69a6de70-0000-47e3-e053-5b8c7c11a4d1" mono hi={2} />
        <div className="mt-3 flex items-center gap-2 font-medium">Active <Hi n={3}><span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#0071e3] text-white"><Icon name="add" className="text-[14px]" /></span></Hi></div>
        <div className="mt-2 overflow-hidden rounded border border-slate-200 text-[12px]">
          <div className="grid grid-cols-[1fr_110px_110px_80px] bg-slate-50 px-2 py-1 text-[11px] text-slate-500"><span>Name</span><span>Key ID</span><span>Access</span><span /></div>
          <div className="grid grid-cols-[1fr_110px_110px_80px] items-center px-2 py-1.5">
            <span>fastlane</span><Hi n={4} className="px-1"><code>2X9R4HXF34</code></Hi><span>App Manager</span><Hi n={5}><span className="px-1 text-[#0071e3]">Download</span></Hi>
          </div>
        </div>
      </Console>
    </Screenshot>
  );
}

/** Apps → + → New App. */
export function AscNewAppShot() {
  return (
    <Screenshot app="App Store Connect — Apps › New App" caption={<>{ILL}. Apps → <strong>+</strong> → <strong>New App</strong>. <strong>1</strong> platform iOS; <strong>2</strong> pick the <strong>exact</strong> bundle id from <code>bundle_identifier</code> (it must already be registered — the first Firebase build does that); <strong>3</strong> any unique SKU. Only TestFlight needs this record.</>}>
      <div className="mx-auto max-w-[460px] rounded-lg border border-slate-200 bg-white p-4 text-[13px] shadow">
        <div className="mb-3 text-[15px] font-semibold">New App</div>
        <div className="mb-2"><div className="text-[12px] text-slate-500">Platforms</div><Hi n={1}><span className="px-1">☑ iOS</span></Hi> <span className="ml-2 text-slate-400">☐ macOS ☐ tvOS</span></div>
        <Field label="Name" value="MyApp" />
        <Field label="Primary Language" value="English (U.S.)" />
        <Field label="Bundle ID" value={<>MyApp – com.example.myapp ▾</>} hi={2} />
        <Field label="SKU" value="myapp-ios" hi={3} />
        <Field label="User Access" value="Full Access" />
        <div className="mt-3 flex justify-end gap-2"><Btn>Cancel</Btn><Btn primary className="bg-[#0071e3]">Create</Btn></div>
      </div>
    </Screenshot>
  );
}

/** Apps → MyApp → TestFlight builds. */
export function AscTestflightBuildsShot() {
  return (
    <Screenshot app="App Store Connect — MyApp › TestFlight" caption={<>{ILL}. After <code>ios distribute</code>: <strong>1</strong> a new build shows <strong>Processing</strong> (10–30 min); <strong>2</strong> <strong>Missing Compliance</strong> → click <strong>Manage</strong> and answer the encryption question (or set <code>ITSAppUsesNonExemptEncryption</code>); <strong>3</strong> add testers under <strong>Internal Testing</strong>.</>}>
      <Console nav={["Builds: iOS", "Internal Testing", "External Testing", "Test Information"]} active="Builds: iOS" crumbs="Apps › MyApp › TestFlight" title="iOS Builds" accent="#0071e3">
        <div className="overflow-hidden rounded border border-slate-200 text-[12px]">
          <div className="grid grid-cols-[90px_1fr_1fr] bg-slate-50 px-2 py-1 text-[11px] text-slate-500"><span>Build</span><span>Status</span><span>Groups</span></div>
          <div className="grid grid-cols-[90px_1fr_1fr] items-center border-b border-slate-100 px-2 py-1.5"><span>1.0.1 (14)</span><Hi n={1} className="w-fit px-1"><span className="text-slate-600">⏳ Processing</span></Hi><span className="text-slate-400">—</span></div>
          <div className="grid grid-cols-[90px_1fr_1fr] items-center border-b border-slate-100 px-2 py-1.5"><span>1.0.1 (13)</span><Hi n={2} className="w-fit px-1"><span className="text-[#c77c02]">⚠ Missing Compliance · <span className="text-[#0071e3]">Manage</span></span></Hi><span className="text-slate-400">—</span></div>
          <div className="grid grid-cols-[90px_1fr_1fr] items-center px-2 py-1.5"><span>1.0.0 (12)</span><span className="text-[#1e8e3e]">● Testing</span><Hi n={3} className="w-fit px-1"><span>Internal Testing (4)</span></Hi></div>
        </div>
      </Console>
    </Screenshot>
  );
}

/* ------------------------------ GitHub ------------------------------ */

/** Actions → iOS Distribution → Run workflow. */
export function GithubRunIosWorkflowShot() {
  return (
    <Screenshot app="GitHub — Actions › iOS Distribution" caption={<>{ILL}. <strong>1</strong> Actions → <strong>iOS Distribution</strong> → <strong>Run workflow</strong>; <strong>2</strong> pick the environment; <strong>3</strong> tick the channels (Firebase is on by default, TestFlight off); <strong>4</strong> run. Try Firebase first, then TestFlight.</>}>
      <div className="grid gap-3 rounded-md border border-slate-200 bg-white p-3 text-[13px] sm:grid-cols-[150px_1fr]">
        <div className="space-y-1 text-[12px]">
          <div className="font-semibold text-slate-500">Actions</div>
          <div className="text-slate-600">Android Distribution</div>
          <div className="rounded bg-[#ddf4ff] px-1.5 py-0.5 font-semibold text-[#0969da]">iOS Distribution</div>
        </div>
        <div>
          <div className="mb-2 flex items-center justify-between"><span className="font-semibold">iOS Distribution</span><Hi n={1}><Btn>Run workflow ▾</Btn></Hi></div>
          <div className="ml-auto w-full max-w-[300px] rounded-md border border-slate-300 bg-white p-3 text-[12px] shadow-lg">
            <div className="mb-1 text-slate-500">Use workflow from</div><Btn className="mb-2">Branch: main ▾</Btn>
            <div className="mb-1 font-medium">Distribution environment *</div>
            <Hi n={2} className="mb-3 w-full"><span className="block w-full rounded border border-slate-300 px-2 py-1">staging ▾</span></Hi>
            <Hi n={3} className="mb-3 block"><span className="block px-1 py-0.5">☑ Firebase App Distribution (Ad Hoc)<br />☐ TestFlight (needs the app in App Store Connect)</span></Hi>
            <Hi n={4}><span className="inline-flex rounded bg-[#1f883d] px-2.5 py-1 font-medium text-white">Run workflow</span></Hi>
          </div>
        </div>
      </div>
    </Screenshot>
  );
}

/** Settings → Secrets and variables → Actions → Variables. */
export function GithubVariablesShot() {
  return (
    <Screenshot app="GitHub — Settings › Secrets and variables › Actions" caption={<>{ILL}. Only after manual runs pass: <strong>1</strong> open the <strong>Variables</strong> tab; <strong>2</strong> <strong>New repository variable</strong> <code>IOS_AUTO_DISTRIBUTE</code> = <code>true</code> so merged PRs build iOS. Secrets (the API key, Firebase IDs) go in the <strong>Secrets</strong> tab.</>}>
      <Console nav={["General", "Collaborators", "Branches", "Actions", "Secrets and variables"]} active="Secrets and variables" crumbs="Settings › Secrets and variables › Actions" title="Actions secrets and variables" accent="#0969da">
        <div className="mb-3 flex items-center gap-4 border-b border-slate-200 pb-2 text-[12px]">
          <span className="text-slate-500">Secrets</span>
          <Hi n={1}><span className="px-1 font-semibold text-[#0969da]">Variables</span></Hi>
          <span className="ml-auto"><Hi n={2}><span className="inline-flex rounded bg-[#1f883d] px-2.5 py-1 font-medium text-white">New repository variable</span></Hi></span>
        </div>
        <div className="overflow-hidden rounded border border-slate-200 text-[12px]">
          {[["IOS_AUTO_DISTRIBUTE", "true"], ["IOS_AUTO_ENVIRONMENT", "staging"], ["IOS_TESTFLIGHT", "false"]].map(([k, v]) => (
            <div key={k} className="grid grid-cols-[1fr_120px] border-b border-slate-100 px-2 py-1.5 last:border-0"><code>{k}</code><code className="text-slate-600">{v}</code></div>
          ))}
        </div>
      </Console>
    </Screenshot>
  );
}

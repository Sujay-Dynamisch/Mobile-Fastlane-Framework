import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteFooter } from "@/components/docs/shell";
import { CardGrid, Icon, IosIcon, StatusTable } from "@/components/docs/ui";
import { GITHUB_URL, sections } from "@/content/nav";

const title = "Mobile Fastlane Framework · Ship Android & iOS builds with one config file";
const desc = "A reusable, configuration-driven Fastlane framework that builds, distributes and AI-tests your mobile apps.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: desc },
      { property: "og:title", content: title },
      { property: "og:description", content: desc },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const sectionDesc: Record<string, string> = {
  overview: "What the framework does and how a run works.",
  "get-started": "Install Ruby, Bundler and add the framework.",
  android: "Gradle → Firebase App Distribution → AI tests.",
  ios: "Xcode → signed IPA → TestFlight.",
  configure: "YAML reference, secrets and notifications.",
  ci: "Manual GitHub Actions workflows.",
  reference: "Every lane and command.",
  help: "Troubleshooting and FAQ.",
};

function Terminal() {
  const ok = ["Config validated (doctor)", "Gradle assembleRelease", "Copied dist/MyApp-staging-v1.0.0-42.apk", "Uploaded to Firebase App Distribution", "Distributed to group: tester", "AI tests passed (4/4)", "Teams report sent"];
  return (
    <div className="overflow-hidden rounded-xl bg-terminal text-terminal-fg shadow-card">
      <div className="flex items-center gap-1.5 border-b border-terminal-fg/10 px-4 py-3">
        <span className="h-3 w-3 rounded-full bg-warning-border" /><span className="h-3 w-3 rounded-full bg-caution-border" /><span className="h-3 w-3 rounded-full bg-success-border" />
        <span className="ml-3 font-mono text-[12px] opacity-60">terminal</span>
      </div>
      <pre className="overflow-x-auto p-5 font-mono text-[13px] leading-[1.9]">
        <div><span className="text-accent">$</span> bundle exec fastlane android distribute environment:staging</div>
        {ok.map((l) => <div key={l}><span className="text-success-border">✓</span> {l}</div>)}
        <div className="mt-1 text-accent">fastlane.tools finished successfully 🎉</div>
      </pre>
    </div>
  );
}

function Landing() {
  return (
    <>
      <section className="border-b">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-16 lg:grid-cols-[1.1fr_1fr] lg:py-24">
          <div>
            <h1 className="font-display text-[40px] font-normal leading-[1.15] tracking-tight sm:text-[52px]">Ship Android &amp; iOS builds with one config file</h1>
            <p className="mt-5 max-w-xl text-[18px] text-muted-foreground">A reusable, configuration-driven Fastlane framework that builds, distributes and AI-tests your mobile apps.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/docs/$" params={{ _splat: "get-started/prerequisites" }} className="inline-flex h-11 items-center rounded-full bg-primary px-6 text-[15px] font-medium text-primary-foreground hover:shadow-card">Get started</Link>
              <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="inline-flex h-11 items-center gap-1.5 rounded-full border px-6 text-[15px] font-medium text-primary hover:bg-primary-container">View on GitHub <Icon name="open_in_new" className="text-[18px]" /></a>
            </div>
          </div>
          <Terminal />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid gap-4 md:grid-cols-3">
          {([
            ["android", "Android", "Firebase App Distribution", "android"],
            ["apple", "iOS", "TestFlight", "ios"],
            ["smart_toy", "AI tests", "Firebase App Testing agent", "android/app-testing-agent"],
          ] as const).map(([ic, t, d, to]) => (
            <Link key={t} to="/docs/$" params={{ _splat: to }} className="group rounded-xl border p-6 hover:shadow-card">
              {ic === "apple" ? <IosIcon className="h-8 w-8 text-primary" /> : <Icon name={ic} className="text-[32px] text-primary" />}
              <p className="mt-3 font-display text-[20px]">{t} <span className="text-muted-foreground">→</span></p>
              <p className="text-muted-foreground">{d}</p>
            </Link>
          ))}
        </div>

        <h2 className="mt-16 font-display text-[24px]">How it works</h2>
        <div className="mt-5 flex flex-wrap items-center gap-2">
          {([["tune", "Configure YAML"], ["terminal", "Run lane"], ["build", "Build"], ["cloud_upload", "Distribute"], ["smart_toy", "AI test"], ["mail", "Teams/e-mail report"]] as const).map(([ic, l], i, a) => (
            <div key={l} className="flex items-center gap-2">
              <div className="flex items-center gap-2 rounded-full bg-surface-variant px-4 py-2 text-[14px]"><Icon name={ic} className="text-[18px] text-primary" />{l}</div>
              {i < a.length - 1 && <Icon name="arrow_forward" className="text-muted-foreground" />}
            </div>
          ))}
        </div>

        <h2 className="mt-16 font-display text-[24px]">Status</h2>
        <StatusTable head={["Platform", "", "Status"]} rows={[
          { label: "Android", cells: ["ok", "Verified end-to-end"] },
          { label: "iOS", cells: ["warn", "Implemented, first Mac run pending"] },
        ]} />

        <h2 className="mt-16 font-display text-[24px]">Explore the docs</h2>
        <CardGrid cols={3} cards={sections.map((s) => ({ icon: s.icon, title: s.label, desc: sectionDesc[s.id] ?? "", to: s.pages[0]!.slug }))} />
      </section>
      <SiteFooter />
    </>
  );
}

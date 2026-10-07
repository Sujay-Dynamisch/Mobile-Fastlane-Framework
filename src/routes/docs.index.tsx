import { createFileRoute } from "@tanstack/react-router";
import { DocView } from "@/components/docs/DocView";
import { findPage } from "@/content/nav";

export const Route = createFileRoute("/docs/")({
  head: () => ({
    meta: [
      { title: "Introduction · Mobile Fastlane Framework docs" },
      { name: "description", content: "A reusable, configuration-driven Fastlane setup that builds, distributes and AI-tests React Native and native mobile apps." },
      { property: "og:title", content: "Introduction · Mobile Fastlane Framework docs" },
      { property: "og:description", content: "A reusable, configuration-driven Fastlane setup that builds, distributes and AI-tests React Native and native mobile apps." },
    ],
  }),
  component: Intro,
});

function Intro() {
  const r = findPage("")!;
  return <DocView page={r.page} prev={r.prev} next={r.next} />;
}

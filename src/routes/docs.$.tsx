import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { DocView } from "@/components/docs/DocView";
import { findPage } from "@/content/nav";

export const Route = createFileRoute("/docs/$")({
  loader: ({ params }) => {
    const r = findPage(params._splat ?? "");
    if (!r) throw notFound();
    return { slug: r.page.slug, title: r.page.title, description: r.page.description };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Page not found · Mobile Fastlane Framework" }, { name: "robots", content: "noindex" }] };
    const title = `${loaderData.title} · Mobile Fastlane Framework docs`;
    return {
      meta: [
        { title },
        { name: "description", content: loaderData.description },
        { property: "og:title", content: title },
        { property: "og:description", content: loaderData.description },
      ],
    };
  },
  notFoundComponent: DocNotFound,
  component: DocRoute,
});

function DocRoute() {
  const { slug } = Route.useLoaderData();
  const r = findPage(slug)!;
  return <DocView page={r.page} prev={r.prev} next={r.next} />;
}

function DocNotFound() {
  return (
    <div className="px-10 py-16">
      <h1 className="font-display text-[32px]">Page not found</h1>
      <p className="mt-2 text-muted-foreground">This doc page doesn't exist.</p>
      <Link to="/docs" className="mt-4 inline-block text-primary">Back to the docs</Link>
    </div>
  );
}

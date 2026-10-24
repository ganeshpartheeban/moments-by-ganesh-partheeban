import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { rewriteForLocale, type SiteLocale } from "./lib/locale-path";
import { init as initAnalytics, trackPageView } from "./lib/analytics";

export const getRouter = () => {
  const queryClient = new QueryClient();

  // Per-router (so per-request on the server) record of the URL locale.
  let urlLocale: SiteLocale = "en";

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    rewrite: rewriteForLocale(
      () => urlLocale,
      (l) => {
        urlLocale = l;
      },
    ),
  });

  if (typeof window !== "undefined") {
    initAnalytics();
    // Fires after the initial load and after every client navigation.
    router.subscribe("onResolved", () => trackPageView());
    trackPageView(); // initial load (deduped against onResolved)
  }

  return router;
};

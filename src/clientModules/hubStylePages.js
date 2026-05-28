// Apply the `nd-hub-page` body class on routes whose path matches one of
// the prefixes below. Runs on every navigation - both initial page load
// and client-side route changes.

const HUB_PREFIXES = [
  // Add path prefixes here for doc pages (MDX) that should adopt
  // the hub style without being converted to React. Empty by default.
];

function shouldApply(pathname) {
  return HUB_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function apply(label) {
  if (typeof document === "undefined" || !document.body) return;
  const match = shouldApply(window.location.pathname);
  if (match) {
    document.body.classList.add("nd-hub-page");
  } else {
    document.body.classList.remove("nd-hub-page");
  }
  // eslint-disable-next-line no-console
  console.log(
    `[hubStylePages] ${label} pathname=${window.location.pathname} match=${match} bodyClass=${document.body.className}`
  );
}

if (typeof window !== "undefined") {
  // Run as early as possible
  apply("module-load");
  // Run again after DOM/React settles, in case something stripped the class
  if (typeof document !== "undefined") {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => apply("DOMContentLoaded"));
    }
    setTimeout(() => apply("setTimeout-0"), 0);
    setTimeout(() => apply("setTimeout-500"), 500);
  }
}

export function onRouteDidUpdate() {
  apply("onRouteDidUpdate");
}

(function () {
  // Tracks clicks on the "sign up for educational content" CTAs that appear across
  // the tutorials (e.g. the Nexus sync Java tutorial) and reports them to Amplitude.
  //
  // Implementation notes:
  // - Uses event delegation on `document`, so it survives Docusaurus client-side
  //   navigation and automatically covers every current and future page that
  //   contains the CTA -- no per-page wiring required.
  // - Targets the CTAs by their destination URL, so it catches both the inline
  //   ":::tip" CTA and the end-of-page CTA without needing custom CSS classes.
  //
  // The Amplitude Browser SDK is loaded site-wide via Google Tag Manager (the
  // `amplitude` global is already present at runtime), so no SDK loader or API
  // key is needed here. Every track call is still guarded, so this safely no-ops
  // if the `amplitude` global is ever unavailable.
  var CTA_URL_FRAGMENT = "pages.temporal.io/get-updates-education";

  document.addEventListener(
    "click",
    function (event) {
      var target = event.target;
      if (!target || typeof target.closest !== "function") return;

      var link = target.closest('a[href*="' + CTA_URL_FRAGMENT + '"]');
      if (!link) return;

      if (
        typeof window.amplitude === "undefined" ||
        !window.amplitude ||
        typeof window.amplitude.track !== "function"
      ) {
        return;
      }

      // The inline CTA lives inside a Docusaurus admonition (the ":::tip" box);
      // the end-of-page "What's Next" CTA is a plain paragraph.
      var ctaLocation = link.closest(".theme-admonition") ? "inline" : "bottom";

      window.amplitude.track("CTA Clicked", {
        cta_text: (link.textContent || "").trim(),
        page_path: window.location.pathname,
        cta_destination: link.href,
        cta_location: ctaLocation,
      });
    },
    true
  );
})();

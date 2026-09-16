window.dataLayer = window.dataLayer || [];
window.gtag =
  window.gtag ||
  function () {
    window.dataLayer.push(arguments);
  };
window.gtag("js", new Date());

window.gtag("consent", "default", {
  analytics_storage: "denied",
  ad_storage: "denied",
  ad_user_data: "denied",
  ad_personalization: "denied",
});

(function () {
  var match = document.cookie.match(/(?:^|;\s*)consent=([^;]*)/);
  if (!match) return;

  try {
    var consent = JSON.parse(decodeURIComponent(match[1]));
    if (
      typeof consent.analytics !== "boolean" ||
      typeof consent.advertising !== "boolean"
    ) {
      return;
    }

    var advertisingConsent = consent.advertising ? "granted" : "denied";
    window.gtag("consent", "update", {
      analytics_storage: consent.analytics ? "granted" : "denied",
      ad_storage: advertisingConsent,
      ad_user_data: advertisingConsent,
      ad_personalization: advertisingConsent,
    });
  } catch {
    // Keep the denied defaults when the shared consent cookie is malformed.
  }
})();

(function (w, d, s, l, i) {
  w[l] = w[l] || [];
  w[l].push({"gtm.start": new Date().getTime(), event: "gtm.js"});
  var f = d.getElementsByTagName(s)[0],
    j = d.createElement(s),
    dl = l != "dataLayer" ? "&l=" + l : "";
  j.async = true;
  j.src = "https://www.googletagmanager.com/gtm.js?id=" + i + dl;
  f.parentNode.insertBefore(j, f);
})(window, document, "script", "dataLayer", "GTM-TSXFPF2");

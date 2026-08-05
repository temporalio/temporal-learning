// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const { themes: prismThemes } = require("prism-react-renderer");
const lightCodeTheme = prismThemes.github;
const darkCodeTheme = prismThemes.dracula;
const {
  AEONIK_REGULAR_FILENAME,
  AEONIK_BOLD_FILENAME,
  AEONIK_LIGHT_FILENAME,
  POPPINS_REGULAR_FILENAME,
  POPPINS_MEDIUM_FILENAME,
  POPPINS_SEMIBOLD_FILENAME,
  POPPINS_BOLD_FILENAME,
} = require("./src/constants/preloadFonts");

function fontPreloadTag(filename, type) {
  return {
    tagName: "link",
    attributes: {
      rel: "preload",
      href: `/assets/fonts/${filename}`,
      as: "font",
      type,
      crossorigin: "anonymous",
    },
  };
}

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: "Learn Temporal",
  tagline: "Build invincible applications",
  url: "https://learn.temporal.io",
  baseUrl: "/",
  onBrokenLinks: "throw",
  onBrokenMarkdownLinks: "throw",
  favicon: "img/favicon.png",
  headTags: [
    {
      tagName: "link",
      attributes: {
        rel: "icon",
        type: "image/svg+xml",
        href: "/img/favicon.svg",
      },
    },
    // webpack-font-preload-plugin used to inject these automatically, but it
    // silently no-ops under Docusaurus 3's SSG build (it patches a webpack
    // HtmlWebpackPlugin asset that the per-page static renderer no longer
    // consumes). Preloading these fonts explicitly here preserves prior
    // behavior. bin/check-font-preload-hash.js fails the build if these
    // filenames drift from what the build actually produces.
    fontPreloadTag(AEONIK_REGULAR_FILENAME, "font/woff"),
    fontPreloadTag(AEONIK_BOLD_FILENAME, "font/woff"),
    fontPreloadTag(AEONIK_LIGHT_FILENAME, "font/woff"),
    fontPreloadTag(POPPINS_REGULAR_FILENAME, "font/ttf"),
    fontPreloadTag(POPPINS_MEDIUM_FILENAME, "font/ttf"),
    fontPreloadTag(POPPINS_SEMIBOLD_FILENAME, "font/ttf"),
    fontPreloadTag(POPPINS_BOLD_FILENAME, "font/ttf"),
  ],
  trailingSlash: true,
  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: "temporal", // Usually your GitHub org/user name.
  projectName: "temporal-learning", // Usually your repo name.
  i18n: {
    defaultLocale: "en",
    locales: ["en"],
  },
  themeConfig: {
    // announcementBar: {
    //   id: "replay_announcement",
    //   content:
    //     'Help shape how we teach Temporal! Take this <a href="https://docs.google.com/forms/d/e/1FAIpQLScvXtr039tv9V_m4C2F147FFhXrUC7CFnIMULA8Bm16KHdnVQ/viewform">survey</a> for an Amazon gift card (US only).',
    //   backgroundColor: "#C039C0",
    //   textColor: "#ffffff",
    //   isCloseable: true,
    // },
    colorMode: {
      respectPrefersColorScheme: true,
      disableSwitch: false,
      // switchConfig: {
      //   darkIcon: "🌙",
      //   darkIconStyle: {
      //     content: `url(/img/moon.svg)`,
      //     transform: "scale(2)",
      //     margin: "0 0.2rem",
      //   },
      //   lightIcon: "☀️",
      //   lightIconStyle: {
      //     content: `url(/img/sun.svg)`,
      //     transform: "scale(2)",
      //   },
      // },
    },
    image: "/img/open-graph-shiny.png",
    prism: {
      theme: prismThemes.nightOwlLight,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ["java", "ruby", "php", "csharp"],
    },
    docs: {
      sidebar: {
        hideable: true,
        autoCollapseCategories: true,
      },
    },
    navbar: {
      hideOnScroll: false,
      logo: {
        alt: "Temporal logo",
        src: "img/temporal-logo-dark.svg",
        srcDark: "img/temporal-logo.svg",
        href: "https://temporal.io",
      },
      items: [
        {to: "/", label: "Home", position: "left", activeBasePath: "none"},
        {to: "/getting_started", label: "Get started", position: "left"},
        { to: "/courses", label: "Courses", position: "left" },
        {href: "https://temporal.io/code-exchange", label: "Code Exchange", position: "left"},
        {
          href: "https://docs.temporal.io",
          label: "Documentation",
        },
      ],
    },
    footer: {
      logo: {
        alt: "Temporal logo",
        src: "img/favicon.svg",
        href: "https://temporal.io",
        width: 24,
      },
      copyright: `Copyright © ${new Date().getFullYear()} Temporal Technologies Inc.<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-TSXFPF2"
      height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>`,
      links: [
        {
          items: [
            {
              label: "Github",
              href: "https://github.com/temporalio",
            },
            {
              label: "Twitter",
              href: "https://twitter.com/temporalio",
            },
            {
              label: "YouTube",
              href: "https://www.youtube.com/channel/UCGovZyy8OfFPNlNV0i1fI1g",
            },
            {
              label: "Join our Slack group",
              href: "https://temporal.io/slack",
            },
          ],
        },
        {
          items: [
            {
              label: "Temporal Cloud",
              href: "https://temporal.io/cloud",
            },
            {
              label: "Meetups",
              href: "https://temporal.io/community#events",
            },
            {
              label: "Workshops",
              href: "https://temporal.io/community#workshops",
            },
            {
              label: "Support Forum",
              href: "https://community.temporal.io/",
            },
            {
              label: "Ask an expert",
              href: "https://pages.temporal.io/ask-an-expert",
            },
          ],
        },
        {
          items: [
            {
              label: "Documentation",
              href: "https://docs.temporal.io",
            },
            {
              label: "Use Cases",
              href: "https://temporal.io/use-cases",
            },
            {
              label: "Blog",
              href: "https://docs.temporal.io/blog",
            },
            {
              label: "Newsletter Signup",
              href: "https://pages.temporal.io/newsletter-subscribe",
            },
          ],
        },
        {
          items: [
            {
              label: "Security",
              href: "https://docs.temporal.io/security",
            },
            {
              label: "Privacy Policy",
              href: "https://docs.temporal.io/privacy-policy",
            },
            {
              label: "Terms of Service",
              href: "https://docs.temporal.io/pdf/temporal-tos-2021-07-24.pdf",
            },
            {
              label: "We're Hiring",
              href: "https://temporal.io/careers",
            },
          ],
        },
        {
          items: [],
        },
      ],
    },
    algolia: {
      apiKey: "4a2fa646f476d7756a7cdc599b625bec",
      indexName: "temporal",
      externalUrlRegex: "temporal\\.io",
      appId: "T5D6KNJCQS",
      searchPagePath: false, // Disable default search page - using custom implementation at src/pages/search.tsx
      insights: true,
      searchParameters: {
        attributesToRetrieve: [
          "hierarchy",
          "content",
          "anchor",
          "url",
          "url_without_anchor",
          "type",
          "sdk_language",
        ],
      },
    },
  },
  presets: [
    [
      "classic",
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        blog: false,
        docs: {
          routeBasePath: "/", // Serve the docs at the site's root
          sidebarPath: require.resolve("./sidebars.js"),
          /*editUrl: "https://github.com/temporalio/temporal-learning/blob/main", */
          exclude: [
            "**/_*.{js,jsx,ts,tsx,md,mdx}", // Exclude files starting with an underscore
            "**/_*/**", // Exclude directories starting with an underscore
            "**/*.test.{js,jsx,ts,tsx}", // Exclude test files
            "**/__tests__/**", // Exclude test directories
            "**/code/**/*.md", // Exclude Markdown docs in code folders.
          ],
          showLastUpdateAuthor: false,
          /**
           * Whether to display the last date the doc was updated.
           */
          showLastUpdateTime: true,
        },
        theme: {
          customCss: require.resolve("./src/css/custom.css"),
        },
        // gtag: {
        // trackingID: "UA-163137879-1",
        // // Optional fields.
        // anonymizeIP: true, // Should IPs be anonymized?
        // },
        // Will be passed to @docusaurus/plugin-content-sitemap
        sitemap: {
          // Per v2.0.0-alpha.72 cacheTime is now deprecated
          //cacheTime: 600 * 1000, // 600 sec - cache purge period
          changefreq: "weekly",
          priority: 0.5,
        },
      }),
    ],
  ],
  scripts: [
    {
      src: "/scripts/googletag.js",
      async: true,
      defer: true,
    },
    {
      src: "/scripts/amplitude-cta-tracking.js",
      async: true,
      defer: true,
    },
    {
      src: "https://widget.kapa.ai/kapa-widget.bundle.js",
      "data-website-id": "13e12f4a-b295-4cb5-9470-783dc6b98f68",
      "data-project-name": "Temporal",
      "data-project-color": "#000000",
      "data-mcp-enabled": "true",
      "data-mcp-server-url": "https://temporal.mcp.kapa.ai",
      "data-project-logo":
        "https://avatars.githubusercontent.com/u/56493103?s=280&v=4",
      "data-modal-title": "Temporal's AI developer assistant",
      "data-modal-disclaimer":
        "I am Temporal's AI developer assistant. I can access developer docs, forum posts, product blogs, and SDK references. Responses are generated by combining various sources to provide the best possible answer, however I may not be fully accurate, so please use your best judgement. If you have feedback please give a thumbs up or down as I continue to improve.",
      "data-modal-example-questions": [
        "What is Temporal?",
        "How do I get started using Temporal?",
        "I need a Workflow written in TypeScript",
        "How do Signals work?",
      ],
      async: true,
    },
    // {
    //   src: "/scripts/feedback.js",
    //   async: true,
    //   defer: true,
    // },
    // {
    //   src: "/scripts/fullstory.js",
    //   async: true,
    //   defer: true,
    // },
  ],
  markdown: {
    mdx1Compat: {
      // Required for snipsync HTML comment markers (<!--SNIPSTART-->, <!--SNIPEND-->)
      comments: true,
      admonitions: true,
      // Required: this repo (unlike ../documentation) uses Docusaurus's
      // legacy `## Heading {#custom-id}` syntax in ~13 files. Under MDX v3 +
      // future.v4 (which disables mdx1Compat by default), the `{#custom-id}`
      // gets parsed as an MDX/JS expression by acorn and fails to build.
      headingIds: true,
    },
  },
  future: {
    v4: true,
    faster: true,
  },
};

module.exports = config;

// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const path = require("path");
const visit = require("unist-util-visit");
const lightCodeTheme = require("prism-react-renderer/themes/github");
const darkCodeTheme = require("prism-react-renderer/themes/dracula");
const FontPreloadPlugin = require("webpack-font-preload-plugin");

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: "Learn Temporal",
  tagline: "Build invincible applications",
  url: "https://learn.temporal.io",
  baseUrl: "/",
  onBrokenLinks: "throw",
  onBrokenMarkdownLinks: "throw",
  favicon: "img/favicon.png",
  trailingSlash: true,
  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: "temporal", // Usually your GitHub org/user name.
  projectName: "temporal-learning", // Usually your repo name.
  i18n: {
    defaultLocale: "en",
    locales: ["en"],
  },
  plugins: [
    function preloadFontPlugin() {
      return {
        name: "preload-font-plugin",
        configureWebpack() {
          return {
            plugins: [new FontPreloadPlugin()],
          };
        },
      };
    },
  ],
  themeConfig: {
    announcementBar: {
      id: "replay_announcement",
      content:
        'Replay is live this week! Join us September 18-20 in Seattle.',
      backgroundColor: "#141414",
      textColor: "#ffffff",
      isCloseable: true,
    },
    colorMode: {
      defaultMode: "light",
      disableSwitch: false,
      // switchConfig: {
      //   darkIcon: "🌙",
      //   darkIconStyle: {
      //     content: `url(/img/moon.svg)`,
      //     transform: "scale(2)",
      //     margin: "0 0.2rem",
      //   },
      //   lightIcon: "\u{1F602}",
      //   lightIconStyle: {
      //     content: `url(/img/sun.svg)`,
      //     transform: "scale(2)",
      //   },
      // },
    },
    prism: {
      theme: require("prism-react-renderer/themes/nightOwlLight"),
      darkTheme: require("prism-react-renderer/themes/dracula"),
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
        {to: "/courses", label: "Courses", position: "left"},
        {to: "/tutorials", label: "Project-based tutorials", position: "left"},
        {to: "/examples", label: "Example applications", position: "left"},
        {
          href: "https://docs.temporal.io",
          label: "Documentation",
        },
      ],
    },
    footer: {
      logo: {
        alt: "Temporal logo",
        src: "img/favicon.png",
        href: "https://temporal.io",
        width: 24,
      },
      copyright: `Copyright © ${new Date().getFullYear()}</span> Temporal Technologies Inc.</div><noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-TSXFPF2"
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
              href: "https://temporal.us17.list-manage.com/subscribe/post?u=2334a0f23e55fd1840613755d&id=3475f910fc",
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
      // contextualSearch: true, // Optional, If you have different version of docs etc (v1 and v2) doesn't display dup results
      appId: "T5D6KNJCQS", // Optional, if you run the DocSearch crawler on your own
      // algoliaOptions: {}, // Optional, if provided by Algolia
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
          // // below remark plugin disabled until we can figure out why it is not transpiling to ESNext properly - swyx
          // // original PR https://github.com/temporalio/documentation/pull/496/files
          remarkPlugins: [
            [
              () =>
                function addTSNoCheck(tree) {
                  // Disable TS type checking for any TypeScript code blocks.
                  // This is because imports are messy with snipsync: we don't
                  // have a way to pull in a separate config for every example
                  // snipsync pulls from.
                  function visitor(node) {
                    if (!/^ts$/.test(node.lang)) {
                      return;
                    }
                    node.value = "// @ts-nocheck\n" + node.value.trim();
                  }

                  visit(tree, "code", visitor);
                },
              {},
            ],
            [
              require("remark-typescript-tools").transpileCodeblocks,
              {
                compilerSettings: {
                  tsconfig: path.join(__dirname, "docs", "tsconfig.json"),
                  externalResolutions: {},
                },
                fileExtensions: [".md", ".mdx"],
                // remark-typescript-tools automatically running prettier with a custom config that doesn't
                // line up with ours. This disables any post processing, including the default prettier step.
                postProcessTs: (files) => files,
                postProcessTranspiledJs: (files) => files,
              },
            ],
            [
              () =>
                function removeTSNoCheck(tree) {
                  function visitor(node) {
                    if (!/^ts$/.test(node.lang) && !/^js$/.test(node.lang)) {
                      return;
                    }
                    if (node.value.startsWith("// @ts-nocheck\n")) {
                      node.value = node.value.slice("// @ts-nocheck\n".length);
                    }
                    // If TS compiled output is empty, replace it with a more helpful comment
                    if (
                      node.lang === "js" &&
                      node.value.trim() === "export {};"
                    ) {
                      node.value = "// Not required in JavaScript";
                    } else if (node.lang === "js") {
                      node.value = convertIndent4ToIndent2(node.value).trim();
                    }
                  }
                  visit(tree, "code", visitor);
                },
              {},
            ],
          ],
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
      src: "https://widget.kapa.ai/kapa-widget.bundle.js",
      "data-website-id": "91a88508-9cdc-441f-b1df-37aa9329e6bc",
      "data-project-name": "Temporal",
      "data-project-color": "#000000",
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
};

module.exports = config;

function convertIndent4ToIndent2(code) {
  // TypeScript always outputs 4 space indent. This is a workaround.
  // See https://github.com/microsoft/TypeScript/issues/4042
  return code.replace(/^( {4})+/gm, (match) => {
    return "  ".repeat(match.length / 4);
  });
}

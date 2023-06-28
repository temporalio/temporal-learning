// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const path = require("path");
const visit = require("unist-util-visit");
const lightCodeTheme = require('prism-react-renderer/themes/github');
const darkCodeTheme = require('prism-react-renderer/themes/dracula');
const FontPreloadPlugin = require("webpack-font-preload-plugin");

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Learn Temporal',
  tagline: "Build invincible applications",
  url: 'https://learn.temporal.io',
  baseUrl: '/',
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'throw',
  favicon: "img/favicon.png",
  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'temporal', // Usually your GitHub org/user name.
  projectName: 'temporal-learning', // Usually your repo name.
  headTags: [
    {
      tagName: 'link',
      attributes: {
        rel: 'preload',
        href: 'https://iq.temporal.io',
        as: 'document',
      },
    },
  ],
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
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
      id: 'in_progress',
      content: 'Get your tickets for <a href="https://temporal.io/replay">Replay 2023</a>!',
      backgroundColor: '#1d1d24',
      textColor: '#f9fafb',
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
      additionalLanguages: ["java", "ruby", "php"],
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
        {to: '/', label: 'Home', position: 'left', activeBasePath: "none"},
        {to: '/getting_started', label: 'Get started', position: 'left'},
        {to: '/courses', label: 'Courses', position: 'left'},
        {to: '/tutorials', label: 'Project-based tutorials', position: 'left'},
        {to: '/examples', label: 'Example applications', position: 'left'},
        {
          href: 'https://docs.temporal.io',
          label: 'Documentation',
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
              href: "https://github.com/temporalio/temporal",
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
              href: "https://lu.ma/temporal",
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
              label: 'Ask an expert',
              href: 'https://pages.temporal.io/ask-an-expert'
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
            }
          ],
        },
        {
          items: [
          ],
        },
      ],
    },
  },
  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        blog: false,
        docs: {
          routeBasePath: '/', // Serve the docs at the site's root
          sidebarPath: require.resolve('./sidebars.js'),
          /*editUrl: "https://github.com/temporalio/temporal-learning/blob/main", */
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
                  tsconfig: path.join(
                    __dirname,
                    "docs",
                    "tsconfig.json"
                  ),
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
          customCss: require.resolve('./src/css/custom.css'),
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

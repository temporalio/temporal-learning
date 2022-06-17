// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const lightCodeTheme = require('prism-react-renderer/themes/github');
const darkCodeTheme = require('prism-react-renderer/themes/dracula');
const FontPreloadPlugin = require("webpack-font-preload-plugin");

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Temporal Learning',
  tagline: 'Build Invinciple Apps',
  url: 'https://learn.temporal.io',
  baseUrl: '/',
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'throw',
  favicon: "img/favicon.png",
  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'temporal', // Usually your GitHub org/user name.
  projectName: 'temporal-learning', // Usually your repo name.

  // Even if you don't use internalization, you can use this field to set useful
  // metadata like html lang. For example, if your site is Chinese, you may want
  // to replace "en" with "zh-Hans".
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
  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        blog: false,
        docs: {
          routeBasePath: '/', // Serve the docs at the site's root
          sidebarPath: require.resolve('./sidebars.js'),
          editUrl: "https://github.com/temporalio/temporal-learning/blob/master",
          showLastUpdateAuthor: false,
          /**
           * Whether to display the last date the doc was updated.
           */
          showLastUpdateTime: true,
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
  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      navbar: {
        title: 'Temporal Learning',
        logo: {
          alt: "Temporal logo",
          src: "img/temporal-logo-dark.svg",
          srcDark: "img/temporal-logo.svg",
        },
        items: [
          {to: '/getting_started', label: 'Getting Started', position: 'left'},
          {to: '/courses', label: 'Courses', position: 'left'},
          {to: '/tutorials', label: 'Tutorials', position: 'left'},
          {to: '/examples', label: 'Example Applications', position: 'left'},
          {
            href: 'https://docs.temporal.com',
            label: 'Docs',
            position: 'right',
          },
          {
            href: 'https://docs.temporal.com/blog',
            label: 'Blog',
            position: 'right',
          },
          {
            href: "https://temporal.io/use-cases",
            label: 'Use cases',
            position: 'right',
          },
          {
            href: "https://temporal.io/community",
            label: 'Community',
            position: 'right',
          }
        ],
      },
      footer: {
        logo: {
          alt: "Temporal logo",
          src: "img/favicon.png",
          href: "https://temporal.io",
          width: 24,
        },
        copyright: `Copyright © ${new Date().getFullYear()}</span> Temporal Technologies Inc.</div>`,
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
            ],
          },
          {
            items: [
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
            ],
          },
          {
            items: [
              {
                label: "Use Cases",
                href: "https://temporal.io/use-cases",
              },
              {
                label: "Case Studies",
                href: "https://docs.temporal.io/blog/tags/case-study/",
              },
              {
                label: "Blog",
                href: "https://docs.temporal.io/blog",
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
            ],
          },
          {
            items: [
              {
                label: "Join the Cloud Waitlist",
                href: "https://us17.list-manage.com/survey?u=2334a0f23e55fd1840613755d&id=f1895b6f4a",
              },
              {
                label: "Subscribe to the Newsletter",
                href: "https://temporal.us17.list-manage.com/subscribe/post?u=2334a0f23e55fd1840613755d&id=3475f910fc",
              },
              {
                label: "We're Hiring",
                href: "https://temporal.io/careers",
              }
            ],
          },
        ],
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
    }),
};

module.exports = config;

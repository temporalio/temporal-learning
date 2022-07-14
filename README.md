# Temporal Learning

Web site for <learn.temporal.io>

This website is built using [Docusaurus 2](https://docusaurus.io/), a modern static website generator.

### Installation

Download files with

```
$ yarn
```

### Local Development

Get code snippets from repositories with

```
$ npx snipsync
```

Run the local server with:

```gg
$ yarn start
```

This command starts a local development server and opens up a browser window. Most changes are reflected live without having to restart the server.

### Updating Course pages

Do not edit the course pages.

Run 

```
node get_course_pages_from_lms.js
```

to pull course pages from the LMS. 

### Committing changes

Build the site first to ensure all links are correct and everything compiles:

```
$ yarn build
```

This command generates static content into the `build` directory and can be served using any static contents hosting service.

Test everything:

```
$ yarn run serve
```

Remove snippets:

```
$ npx snipsync --clear
```

Then make your commits to a new branch.


### Theme customizations

The default docusaurus theme doesn't let us put author and date info at the top of the article. We swizzled the `DocItem` component and placed
the items into the header:

```
src/theme/
└── DocItem
    ├── index.d.ts
    ├── index.js
    └── styles.module.css
```

To update this, swizzle the followiung components and **extract**, rather than **wrap** them:

* DocItem
* DocItemFooter

Copy the relevant bits out and test.




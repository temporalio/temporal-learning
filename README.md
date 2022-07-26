# Temporal Learning

Web site for <learn.temporal.io>

This website is built using [Docusaurus 2](https://docusaurus.io/), a modern static website generator.

### Installation

Download files with

```
$ yarn
```

### Local Development


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

### Getting snippets

Get code snippets from repositories with Snipsync, which will pull in code and inject it into the right locations:

```
$ yarn getsnips
```

Be sure to run

```
$ yarn clearsnips
```

to remove snippets prior to making a commit.


### Committing changes

Build the site first to ensure all links are correct and everything compiles:

```
$ yarn build
```

This command fetches snippets with Snipsync and then generates static content into the `build` directory and can be served using any static contents hosting service.

Test everything with the local server:

```
$ yarn serve
```

Remove snippets:

```
$ yarn clearsnips
```

Review your work for style and tone using the style guide in `STYLE.md`.

Then make your commits to a new branch.

### Theme customizations

The default docusaurus theme doesn't let us put author and date info at the top of the article. We swizzled the `DocItem/Content` component and placed
the items into the header.

To update this, swizzle the followiung components and **extract**, rather than **wrap** them:

* DocItem/Content
* DocItem/Footer

Do a `diff` on  the relevant bits and test. Then remove the `DocItem/Footer` node.







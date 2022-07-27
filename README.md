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


### Getting snippets


Get code snippets from repositories with Snipsync, which will pull in code and inject it into the right locations in the Markdown files.

```
$ yarn getsnips
```

Be sure to run

```
$ yarn clearsnips
```

to remove snippets prior to making a commit.

### Checking for broken links

Use Lychee to scan links quickly.

Install Lychee:

```
brew install lychee
```

Check links in the markdown files with:

```
yarn check_links
```


To do a comprehensive scan on the generated site, run the following command which:
* pull in snippets
* build the site and ensure all local links work
* scan the generated build files with lychee
* clear the snippets out

```
yarn scan
```

This should catch most of the issues.

### Updating Course pages

Course content comes from an external LMS.  Do not edit the course pages directly.

Run 

```
node get_course_pages_from_lms.js
```

to regenerate the course pages from the LMS. 


### Committing changes

Build the site first to ensure all internal links are correct and everything compiles:

```
$ yarn build
```

This command fetches snippets with Snipsync and then generates static content into the `build` directory and can be served using any static contents hosting service.

Test links.

```
$ yarn check_links
```


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







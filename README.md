# learn.temporal.io

This is the code and content for [learn.temporal.io](https://learn.temporal.io).

This website uses [Docusaurus v2](https://docusaurus.io/), a modern static website generator.

Follow this guide for steps on contributing to this site.

# Get Started

Clone the repository to download the files to your local machine.

Switch into the working directory and then download the dependencies with the following command:

```command
$ yarn
```

This downloads and installs all the development dependencies for the project.

## Import code snippets

Code snippets in tutorials live in external Git repositories. When the site is built, the [Snipsync](https://github.com/temporalio/snipsync) utility injects the code from these repositories into the Markdown files.
You will also want to inject the code snippets when you do local testing and content creation.

The following command pulls in code and injects it into the right locations in the Markdown files.

```
$ yarn getsnips
```

You can now view the code in the Markdown documents.

**Note**:  This pulls in **all** the code snippets from **all repositories** and updates **all Markdown documents** across the site.

As such, you should run the following command to remove all snippets from the Markdown files before you make a commit:

```
$ yarn clearsnips
```

Don't commit files with snippets.

### A note about TypeScript code

TypeScript code gets transpiled to JavaScript code during the build process. Any snippets with the `ts` language get automatically rendered in a two-tab display that shows the TypeScript and JavaScript versions side-by-side.

As a result, all code you include needs to be complete, or the site will fail to build.

## Run the development server

To preview the site, run the local server with the following command:

```command
$ yarn start
```

This command starts a local development server and opens up a browser window. Most changes appear without having to restart the server.


# Create or work with content

Most of your work will happen in the `docs` folder. This is where the Markdown files for tutorials and courses live.


- Create a new folder for the tutorial under `docs/tutorials/[language]` where `[language]` is the programming language you're using.
- Within that folder, add an `images` folder.
- Within that folder, add `index.md` to hold the tutorial content.

In the tutorial, add the following front matter:

```markdown
---
id: unique-slug-id
sidebar_position: 1
description: Meta description goes here
keywords: [keywords, go here]
tags: [tags, go here]
last_update:
  date: 2023-03-27
title: Your tutorial title
image: /img/temporal-logo-twitter-card.png
---
```

Change the Markdown to fit your needs.

- `id`: Unique slug for your content.
- `sidebar_position`: where the item sits in the table of contents within the section.
- `description`: The meta description you'll use for SEO.
- `keywords`: Keywords for SEO.
- `tags`: Tags for categorizing the content.
- `last_update`: The date the file was last changed. Overrides the default in Git.
- `title`: The title of the document.
- `image`: The image that gets used when someone shares the document on social media.

After that front matter, add your content.

## Integrate code snippets into your content

Code for your tutorial should come from an external repository on GitHub. You use Snipsync to inject that content into your document.

First, add the repository to the `snipsync.config.yaml` file under the `origins` key:

```yaml
  - owner: temporalio
    repo: email-subscription-project-python
```

Save the file.

Within your code repository, you'll add markers to your file around the code you want to pull into your content. 
- You'll use `@@@SNIPSTART some-unique-name-for-the-part` to denote the start of a snippet.
- You'll use `@@@SNIPEND` to denote the end of a snippet.

In your tutorial, you'll use comments to reference the snippet:

```markdown
<!--SNIPSTART some-unique-name-for-the-part -->
<!--SNIPEND -->
```

The snippet gets injected between those comments, along with a link back to the specific file so readers can see the full file if they wish.

For example, assuming you have a file in a GitHub repository that you want to bring in, you add the markers to the file:

```python
# @@@SNIPSTART email-subscription-project-python-run_worker
import asyncio

from temporalio.client import Client
from temporalio.worker import Worker

from activities import send_email
from shared_objects import task_queue_name
from workflows import SendEmailWorkflow


async def main():
    client = await Client.connect("localhost:7233")

    worker = Worker(
        client,
        task_queue=task_queue_name,
        workflows=[SendEmailWorkflow],
        activities=[send_email],
    )
    await worker.run()


if __name__ == "__main__":
    asyncio.run(main())
# @@@SNIPEND

```

Then, in the corresponding tutorial's Markdown, you'll add this comment where you want to inject the code:

```
<!--SNIPSTART email-subscription-project-python-run_worker -->
<!--SNIPEND-->
```

Save the file and then use Snipsync to bring in the content:

```
$ yarn getsnips
```

Remember that this pulls in snippets for all files in the site, which means multiple files will be changed.

Clear snippets before committing with `yarn clearsnips`.

## Build the site

Once you have everything in place, it's a good idea to run a full build.

Use the following command:

```
$ yarn build
```

This will pull down the snippets and generate the site, creating or populating the `build/` directory. 

Use the following command to run a web server to view the `build/` directory's output:

```
$ yarn serve
```

Once you've verified that things build correctly, run the following command to remove the embedded code from Markdown documents prior to committing:

```
$ yarn clearsnips
```

Do not check in files with snippets embedded.

# Other tasks

There are some other tasks you may need to perform when working with this repository.

## Use Vale to check for style issues.

Review your content with Vale to look for style compliance, including capitalization, passive voice, and other word usage issues, as well as some structural things.

**Note**: Vale is not perfect. Use it as a guide to better writing, not as a true linter.

Install Vale with your package manager. On macOS, use Homebrew:

```
$ brew install vale
```

Check your Markdown doc with Vale:

```
vale docs/path/to/your/file.md
```

You can also scan the entire site:

```
vale docs/
```

Vim and Visual Studio Code can check documents as you write, as long as you've installed Vale on your system.

## Check for broken links

Docusaurus can scan for internal links, but you should use Lychee to scan links to external documents.

Install Lychee system-wide using your package manager. On macOS you can use Homebrew:

```
brew install lychee
```

Check links in the Markdown files with:

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

## Update course pages

Course content comes from an external LMS. Don't edit the course pages directly.

Run the following command to generate the course pages from the LMS: 

```command
node get_course_pages_from_lms.js
```

This script generates new pages with new datestamps, which means Git will see them as updates. Don't check in unncessary changes. Use `git checkout [file]` to unstage a changed file and revert it.

## Explore and maintain theme customizations

The default Docusaurus theme doesn't display author and date info at the top of the article. We swizzled the `DocItem/Content` component and placed these items into the header.

To update this, swizzle the followiung components and **extract**, rather than **wrap** them:

* DocItem/Content
* DocItem/Footer

Do a `diff` on  the relevant bits and test. Then remove the `DocItem/Footer` node.

# Commit changes and make a pull request

Before committing code, build the site one more time to ensure all internal links are correct and everything compiles:

```
$ yarn build
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

Then make your commits to a new branch, adding only the files relevant to the work you're doing:

- Use `git status` to see what you're about to stage.
- Use `git add` and add only the files you intended to change. 

Push your changes to GitHub and verify the preview before making a PR.

Once the build succeeds, make a PR and ask for review.





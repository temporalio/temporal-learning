# Style guidance

In general, Temporal content follows the [Google developer documentation style guide](https://developers.google.com/style).
When the Google guide is silent about an issue, we follow the [Microsoft Writing Style Guide](https://docs.microsoft.com/en-us/style-guide/welcome/).

## Temporal-specific style guidance

We have a few Temporal-specific style guidelines that override the Google and Microsoft guides.

### Capitalization of core terms

Many of Temporal's core terms can be used in a generic way.
To differentiate one of Temporal's core terms from a generic instance of a term, always treat the Temporal term as a proper noun in documentation.
Generic versions of the same term should not be capitalized and should be used sparingly to avoid confusion.

- Correct: "Next, register the Activity within the Workflow."
- Incorrect: "Next, register the activity within the workflow."

### Abbreviation of "identifier"

In text, do not abbreviate the word "identifier" as "ID", "Id", or "id" unless it is part of a Temporal core term, such as "Workflow Id" or "Activity Id".

- Correct: "You can provide an order identifier or customer identifier as a Workflow Id."
- Incorrect: "You can provide an order ID or customer id as a Workflow Id."

In code (and when quoting or referring to code in text), follow the conventions of each language.

### En dashes in ranges

Using an en dash (`&ndash;` or the character `–`) in a range of numbers is acceptable.
Even better is to use words such as _from_, _to_, and _through_.

Be consistent.

If you use an en dash in one range, use en dashes in all ranges.
Do not mix words and en dashes (or hyphens, for that matter).

- Correct: "5 to 10 GB"
- Correct: "5–10 GB"
- Correct: "5-10 GB"
- Incorrect: "from 5-10 GB"

## Headings

Although the following guidance is provided by both the Google and Microsoft guides, we want to emphasize how we style headings.

### Infinitive verb forms in headings

Titles and headings should use infinitive verb forms whenever possible. People tend to search by using infinitive verb forms, so using them helps SEO.

- Correct: "Install Temporal"
- Incorrect: "Installing Temporal"

### Sentence casing in headings

Use sentence casing for titles and headings.
Sentence casing means that only the first letter of the first word and proper nouns are capitalized.

- Correct: "How to get started with Temporal"
- Incorrect: "How To Get Started With Temporal"

### Use "You/your" or the Imperative instead of "We/our"

Keep focus on the reader.

- Correct: In the next step you'll add the Workflow.
- Incorrect: In the next step we'll add the Workflow.

In most cases when providing direct instruction, the imperative works better.

- Correct: Next, add the following code:
- Incorrect: Next, we add the following code:

### Focus on specific outcomes rather than "Learn to/Learn how to" language

Focus on the skill the learner will gain rather than the act of gaining the skill. Look for "learn to/learn how to" and remove them and you'll have tighter sentences.

- Correct: In this tutorial you will build a Workflow
- Incorrect: In this tutorial you will learn how to build a workflow

## Tutorial structure

Tutorials should follow this structure:

### Introduction

Explain the problem, explain the solution, and explicitly state what the learner will do.

### Prerequisites

List other tutorials or documentation the learner needs to have done prior to this tutorial.

### Section headings

Level 2 headings that start with a verb. Sentence case, but capitalize all Temporal terms.

Examples:

  * Create the Workflow
  * Define the Activity
  * Test the application

### Conclusion

Wrap up the tutorial. Recap what the learner accomplished and provide next steps for them.

Optionally add a review activity.


## Formatting

### Function/class/method/object/variable names

Use code font for functions, classes, methods, objects, and other variable names.

### Code blocks

Code should be stored in repositories and linked through Snipsync whenever possible. Otherwise, place code in code fences and specify the programming language so it's properly highlighted.

### CLI commands

Use the `command` language and do **not** include a prompt character:

```command
go mod tidy
```

The command will be displayed with the prompt character.

### Terminal output

Display terminal output with an unlabeled code block. 

**Do not** use screenshots to show terminal output.

### Screen shots

Screen shots are encouraged, especially when showing parts of the UI.

Follow these guidelines for your images:

* Use PNGs for screenshots.
* Use JPGs for photographs.
* Avoid showing any sensitive data like keys, customer usernames, IP addresses, payment information, addresses, etc.  Replace them before taking the screen shot or obscure them in the screenshot.
* Avoid showing dates when possible. Dates can make content look outdated quickly.
* Crop your screenshots as tight to the subject as possible so learners focus only on the components that matter.
* Include descriptive alternative text. Avoid using "screenshot of" or "image of" in the alternative text, as screen readers will identify these as images anyway.

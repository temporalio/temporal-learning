---
title: "Building Deep Research Agents with the OpenAI Agents SDK"
sidebar_position: 1
---

This three-part tutorial series will walk you through building a durable, multi-agent deep research application with human-in-the-loop capabilities using Temporal and the OpenAI Agents SDK.

<div className="card padding--lg margin-vert--lg" style={{textAlign: 'center'}}>
  <h2 className="margin-bottom--sm">Never miss a new tutorial</h2>
  <p className="margin-bottom--md">Be the first to know when we ship new tutorials, courses, and hands-on guides. No spam, unsubscribe anytime.</p>
  <Link className="button button--primary button--lg" to="https://pages.temporal.io/get-updates-education">
    Join the Temporal education list →
  </Link>
</div>

- **Part 1: Setting the Stage**: Clone the template repository (a non-durable research agent), run it, and understand how the multi-agent pipeline works.

- **Part 2: Creating the Workflow**: Build the research manager to orchestrate agents and the workflow to manage state and human-in-the-loop interactions.

- **Part 3: Running Your Application**: Create the Temporal Worker with the OpenAI Agents plugin, and test durability by surviving crashes.

import Link from '@docusaurus/Link';
import DocCardList from '@theme/DocCardList';
import {useCurrentSidebarCategory} from '@docusaurus/theme-common';

<DocCardList items={useCurrentSidebarCategory().items}/>

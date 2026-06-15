---
title: "Building Durable AI Applications with Temporal"
sidebar_position: 1
---

This two-part tutorial series will walk you through building understanding how to create durable AI applications with Temporal.

<div className="card padding--lg margin-vert--lg" style={{textAlign: 'center'}}>
  <h2 className="margin-bottom--sm">Never miss a new tutorial</h2>
  <p className="margin-bottom--md">Be the first to know when we ship new tutorials, courses, and hands-on guides. No spam, unsubscribe anytime.</p>
  <Link className="button button--primary button--lg" to="https://pages.temporal.io/get-updates-education">
    Join the Temporal education list →
  </Link>
</div>

- **Tutorial 1**: Transform a simple LLM app (that does some research then generates PDFs) into a resilient system that handles crashes, rate limits, and outages using Temporal workflows.

- **Tutorial 2**: Add durable human-in-the-loop capabilities to your research application to review, refine, and query research results interactively

import Link from '@docusaurus/Link';
import DocCardList from '@theme/DocCardList';
import {useCurrentSidebarCategory} from '@docusaurus/theme-common';

<DocCardList items={useCurrentSidebarCategory().items}/>

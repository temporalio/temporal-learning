---
title: "Building Durable AI Applications with Temporal"
sidebar_position: 1
---

import {TutorialCta} from '@site/src/components';

This two-part tutorial series will walk you through building understanding how to create durable AI applications with Temporal.

<TutorialCta />

- **Tutorial 1**: Transform a simple LLM app (that does some research then generates PDFs) into a resilient system that handles crashes, rate limits, and outages using Temporal workflows.

- **Tutorial 2**: Add durable human-in-the-loop capabilities to your research application to review, refine, and query research results interactively

import DocCardList from '@theme/DocCardList';
import {useCurrentSidebarCategory} from '@docusaurus/theme-common';

<DocCardList items={useCurrentSidebarCategory().items}/>

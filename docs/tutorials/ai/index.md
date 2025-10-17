---
title: "AI tutorials"
sidebar_position: 6
keywords: [ai,tutorial,temporal,workflows]
description: "Build AI tools with Temporal using these tutorials"
image: /img/temporal-logo-twitter-card.png
---

This four-part tutorial series will walk you through building a durable AI application that performs research and create reports using Temporal.

- **Tutorial 1**: Start by building a simple chain workflow that performs some research for you and outputs it into a PDF. Learn about the importance of durability in GenAI applications.
- **Tutorial 2**: You'll now build upon the chain workflow you created in tutorial 1, and learn to add durability to your research application. Your application will be fail-proof against network outages, rate-limitting, and more.
- **Tutorial 3**: Add durable human-in-the-loop capabilities so you can query for your research results or edit the research prompt
- **Tutorial 4**: Build an agentic loop

import DocCardList from '@theme/DocCardList';
import {useCurrentSidebarCategory} from '@docusaurus/theme-common';

<DocCardList items={useCurrentSidebarCategory().items}/>

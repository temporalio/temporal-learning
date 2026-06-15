---
title: "Building Durable MCP Tools with Temporal"
sidebar_position: 1
---

Learn how to build durable MCP (Model Context Protocol) tools using Temporal Workflows for reliable AI integrations.

<div className="card padding--lg margin-vert--lg" style={{textAlign: 'center'}}>
  <h2 className="margin-bottom--sm">Never miss a new tutorial</h2>
  <p className="margin-bottom--md">Be the first to know when we ship new tutorials, courses, and hands-on guides. No spam, unsubscribe anytime.</p>
  <Link className="button button--primary button--lg" to="https://pages.temporal.io/get-updates-education">
    Join the Temporal education list →
  </Link>
</div>

- **Tutorial 1**: Build a weather forecast MCP server that Claude Desktop can use to fetch real-time weather data from the National Weather Service API. You'll implement the tool using Temporal Workflows, which handle the API calls, retries, and state management automatically.

- **Tutorial 2**: Add **durable human-in-the-loop capabilities to a long-running invoice processing MCP tool** with Temporal. 

import Link from '@docusaurus/Link';
import DocCardList from '@theme/DocCardList';
import {useCurrentSidebarCategory} from '@docusaurus/theme-common';

<DocCardList items={useCurrentSidebarCategory().items}/>

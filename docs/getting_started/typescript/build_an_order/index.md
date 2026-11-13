---
id: build-an-order-typescript
title: Build an Order That Can't Get Stuck
sidebar_position: 1
description: Break a food delivery app on purpose, then make it durable by writing your first Temporal Workflow in TypeScript, in a hands-on Instruqt lab with nothing to install.
keywords: [typescript, temporal, sdk, tutorial, workflow, activity, worker, retry policy, idempotency, getting started, instruqt]
tags: [TypeScript, SDK]
last_update:
  date: 2026-11-13
  author: Angela Zhou
code_repo: https://github.com/temporalio/edu-getting-started/tree/main/typescript/first-workflow
image: /img/temporal-logo-twitter-card.png
---

import Link from '@docusaurus/Link';

<img className="banner" src="/img/sdk_banners/banner_typescript.png" alt="Temporal TypeScript SDK" />

:::note Tutorial information

- **Level**: Temporal beginner
- **Time**: ~1 hour
- **What you'll build**: A food delivery order that rides out a kitchen outage, never holds a customer's card twice, and stops right away on a declined card.

:::

Avery orders a $24.50 pizza. The delivery app puts a hold on Avery's card, then sends the order to the kitchen, but the kitchen's ordering system is down, so the call fails. The app gives up there. The $24.50 is held on Avery's card, the kitchen never heard about the order, and nothing in the app remembers that the order stopped halfway.

The obvious fix is to run the order again, but that makes things worse. The app starts over from the first step, places a second $24.50 hold, and fails at the kitchen again. Avery now has $49.00 tied up and no food on the way.

![Step 1 holds the funds and succeeds, step 2 sending the order to the kitchen fails, and step 3 capturing the payment never runs](images/broken-order.png)

In this lab, we'll make that app fail in a real sandbox, then rebuild it with Temporal so the order remembers how far it got, keeps retrying the kitchen until it comes back, and never charges the card twice. Temporal calls this **durable execution**. We'll write the Temporal pieces ourselves: a Worker, a client, a Workflow, and the retry rules for each step.

## Prerequisites

- Comfortable reading TypeScript. No Temporal experience needed.

## Run the lab in your browser (recommended)

Everything runs in the sandbox: the Temporal Service, the Web UI, a code editor, and the two backend services the order calls. You don't need a Temporal Cloud account or anything installed locally.

<div style={{textAlign: 'center', marginBottom: '8px'}}>
  <span style={{
    display: 'inline-block',
    background: 'linear-gradient(135deg, #f97316, #fb923c)',
    color: '#fff',
    fontWeight: 800,
    fontSize: '14px',
    padding: '6px 18px',
    borderRadius: '20px',
    letterSpacing: '0.5px',
    boxShadow: '0 0 12px rgba(249,115,22,0.5), 0 0 24px rgba(249,115,22,0.2)',
    animation: 'tryMePulse 2s ease-in-out infinite',
  }}>Try the Free Interactive Lab. No setup.</span>
</div>
<style>{`
  @keyframes tryMePulse {
    0%, 100% { box-shadow: 0 0 12px rgba(249,115,22,0.5), 0 0 24px rgba(249,115,22,0.2); }
    50% { box-shadow: 0 0 20px rgba(249,115,22,0.8), 0 0 40px rgba(249,115,22,0.4); }
  }
`}</style>

<iframe
    width="100%"
    height="472"
    sandbox="allow-forms allow-modals allow-popups allow-same-origin allow-scripts allow-popups-to-escape-sandbox"
    src="https://play.instruqt.com/embed/temporal/invite/sqi7kbshmuba"
    style={{border: 0}}
    allowFullScreen
></iframe>

## Next Steps

From here, our free [Temporal 101 with TypeScript](/courses/temporal_101/typescript) course goes deeper into Workflows, Activities, and the Event History. Thanks for building along with us.

Have feedback on this tutorial? [Share your thoughts in our quick form](https://docs.google.com/forms/d/e/1FAIpQLSc3EhkNSJ7M73evqLehgdOW787Gnmg5ZdJpNvdW4owRXf0zpQ/viewform?usp=header). It helps us improve.

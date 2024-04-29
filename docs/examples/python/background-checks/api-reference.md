---
id: api-reference
sidebar_position: 13
keywords: [python, temporal, sdk, tutorial]
title: Background Checks API reference
tags: [Python, SDK]
image: /img/temporal-logo-twitter-card.png
---

## `/checks` GET

Returns a list of all Workflow Executions.

## `/checks` POST

Starts a new Workflow Execution.

## `/checks/{email}` GET

Returns a list of metadata from Workflow Executions that have the associated email address as a Search Attribute.

## `/checks/{email}/cancel` POST

Cancels the Workflow Execution.

## `/checks/{email}/report` GET

Queries the state of the associated Workflow Execution.

## `/checks/{id}/accept` POST

Sends a Signal with accept data to the Workflow Execution that has the specified Run Id.

## `/checks/{id}/decline` POST

Sends a Signal with decline data to the Workflow Execution that has the specified Run Id.

## `/checks/{id}/employmentverify` POST

Sends a Signal with verify data to the Workflow Execution that has the specified Run Id.

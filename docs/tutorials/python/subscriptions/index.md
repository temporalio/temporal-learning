---
id: subscription-tutorial
sidebar_position: 3
keywords: [Python, temporal, sdk, tutorial]
tags: [Python, SDK]
last_update:
  date: 2023-03-01
title: Build a subscription workflow with Temporal and Python

description: In this tutorial, we will tour all of the Workflow APIs you should know, primarily Signals, Queries, by building a realistic monthly subscription payments Workflow that can be canceled.
image: /img/temporal-logo-twitter-card.png
---


## Introduction

### Goals

Throughout the Python Subscription tutorial, you will accomplish the following:

- Use Activities to mock sending emails.
- Use Queries to retrieve the status of the email subscription.
- Use a Cancellation to end the subscription.

### Tasks

To accomplish these goals, you will need to build the following:

- Temporal Enviroment for the Flask Web application
- Implement fucntionalitlies of subscribing and caneclating the emails, as well as fetching informaiton.


### Working sample

To see a working sample, see the [temporalio-subscription-example-py](#) tutorial on GitHub.

## Setting up the environment

Before you can get started, view the following requirements:

- Temporal Server
- Temporal Library
- Flask Sever

### Project requirements

- Temporal
- Flask

```python
pip install temporalio
pip install "Flask[asyinco]"
```

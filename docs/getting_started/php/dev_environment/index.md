---
id: php-dev-env
sidebar_position: 1
description: Set up a local development environment for developing Temporal applications using the TypeScript programming language.
keywords: [php, composer, roadrunner, temporal, sdk, development environment]
tags: [PHP, SDK, development environment]
last_update:
  date: 2022-07-22
title: Set up a Local Development Environment for Temporal and PHP
---

To follow the PHP SDK tutorials and build your own Temporal applications with PHP, you'll need the PHP SDK, the [RoadRunner application server](https://github.com/roadrunner-server/roadrunner), and a Temporal development server.

## Install the PHP SDK

Install the PHP SDK using Composer:

```command
composer require temporal/sdk
```

## Download RoadRunner

See the [RoadRunner README file](https://github.com/roadrunner-server/roadrunner) for installation instructions.


## Set up a Temporal development server

Download and install the Temporal Server locally using Docker Compose by following [How to run a Temporal Cluster for local development using Docker Compose](https://docs.temporal.io/clusters/quick-install/#docker-compose).

You'll run this server in the background while you develop your applications.

Once you have everything installed, you're ready to build apps with Temporal on your local machine.

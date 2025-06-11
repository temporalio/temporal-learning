---
id: php-dev-env
sidebar_position: 1
description: Set up a local development environment for developing Temporal applications using the TypeScript programming language.
keywords: [php, composer, roadrunner, temporal, sdk, development environment]
tags: [PHP, SDK, development environment]
last_update:
  date: 2023-03-27
title: Set up a local development environment for Temporal and PHP
image: /img/temporal-logo-twitter-card.png
---

<img className="banner" src="/img/sdk_banners/banner_php.png" alt="Temporal PHP SDK" />

To follow the PHP SDK tutorials and build your own Temporal applications with PHP, you'll need the PHP SDK, the [RoadRunner application server](https://github.com/roadrunner-server/roadrunner), and a Temporal development server.

## Install the PHP SDK

Install the PHP SDK using [Composer](http://getcomposer.org):

```command
composer require temporal/sdk
```

## Download RoadRunner

You can download RoadRunner in your project using the following command:

```command
vendor/bin/rr get
```

See [RoadRunner installation instructions](https://docs.roadrunner.dev/docs/general/install) to learn about other installation methods.

To configure RoadRunner Temporal plugin create or open the `.rr.yaml` file in your project directory and make sure it contains the following:

```yaml
rpc:
  listen: tcp://127.0.0.1:6001

server:
  command: "php worker.php"

temporal:
  address: "127.0.0.1:7233"

logs:
  level: info
```

Next, you'll configure a local Temporal Service for development.

## Set up a local Temporal Service for development with Temporal CLI

import TemporalService from '@site/docs/getting_started/_temporal_service.md'

<TemporalService />

Once you have everything installed, you're ready to build apps with Temporal on your local machine.

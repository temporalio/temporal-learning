---
id: ruby-dev-env
title: Set up a local development environment for Temporal and Ruby
sidebar_position: 1
description: Set up a local development environment for developing Temporal Applications using the Ruby programming language.
keywords: [ruby, temporal, sdk, development environment]
tags: [Ruby, SDK, development environment]
last_update:
  date: 2023-03-27
image: /img/temporal-logo-twitter-card.png
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

<img className="banner" src="/img/sdk_banners/banner_ruby.png" alt="Temporal Ruby SDK" />

### Introduction

Follow these instructions to configure a development environment for building Temporal Applications with Ruby.

:::caution

The Temporal Ruby SDK is only supported on macOS ARM/x64 and Linux ARM/x64. and the platform-specific gem chosen is based on when the gem/bundle install is performed. 
A source gem is published but cannot be used directly and will fail to build if tried. 
MinGW-based Windows is not currently supported. There are caveats with the Google Protobuf dependency on musl-based Linux. 
See the [Platform Support](https://github.com/temporalio/sdk-ruby#platform-support) section for more information.

:::

## Install Ruby

Make sure you have [Ruby](https://www.ruby-lang.org/en/downloads/) installed. These tutorials use Ruby 3.4.3.

Check your version of Ruby with the following command:

```command
ruby -v
```

You'll see the version printed to the screen, along with other data about the version and system architecture:

```
ruby 3.4.3 ...
```

## Install the Temporal Ruby SDK

You should install the Temporal Ruby SDK in your project using a virtual environment.

Create a directory for your Temporal project:

```command
mkdir temporal-project
```

Switch to the new directory:

```command
cd temporal-project
```

Create the Gemfile using [Bundler](https://bundler.io/):

```command
bundle init
```

Add the Temporal SDK to the Gemfile:

```command
bundle add temporalio
```

You'll see an output similar to the following:

```output
Fetching gem metadata from https://rubygems.org/.....
Resolving dependencies...
```

Next, install the Temporal SDK from the Gemfile:

```command
bundle install 
```

You'll see an output similar to the following:

```output
Installing temporalio 0.4.0 (arm64-darwin)
Bundle complete! 1 Gemfile dependency, 6 gems now installed.
Use `bundle info [gemname]` to see where a bundled gem is installed.
```

Next, you'll configure a local Temporal Service for development.

## Set up a local Temporal Service for development with Temporal CLI

import TemporalService from '@site/docs/getting_started/_temporal_service.md'

<TemporalService />

Once you have everything installed, you're ready to build Temporal Applications with Ruby on your local machine.


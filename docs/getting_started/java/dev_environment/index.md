---
id: java-dev-env
sidebar_position: 1
description: Set up a local development environment for developing Temporal applications using the Java programming language.
tags: [Java, SDK, development environment]
keywords: [Java, JRE, Temporal, IntelliJ, Gradle, development environment]
last_update:
  date: 2023-03-27
title: Set up a local development environment for Temporal and Java
image: /img/temporal-logo-twitter-card.png
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

![Temporal Java SDK](/img/sdk_banners/banner_java.png)

Before engaging with the Java SDK tutorials and building Temporal applications, confirm you have all the required components. You'll need a Java Development Kit (JDK) and the Temporal Java SDK. You'll also establish and run a Temporal Cluster--a group of services that provides Temporal Platform features. The following sections help you locate each required piece.

## Get the Java JDK

If you haven't done so already, install a JDK. Download from [Oracle](https://www.oracle.com/ca-en/java/technologies/javase-downloads.html) or [select any OpenJDK distribution from any vendor](https://adoptium.net/marketplace/?os=any&arch=any&package=jdk). To check the JDK version of your current Java installation, issue the version command.

```command
java --version
```

We developed and tested this tutorial with Java 21. It should work with all JDKs version 8 or higher.

## Install the Temporal Java SDK

Our tutorials use [Apache Maven](https://maven.apache.org/) to manage dependencies and build applications. You can also use [Gradle](https://gradle.org) or any other preferred build automation tool.

<Tabs groupId="build-tool" queryString>
  <TabItem value="maven" label="Maven">
  
### Configure Maven

To install [Apache Maven](https://maven.apache.org/), follow the [instructions](https://maven.apache.org/install.html) at Apache.org. Configure Maven for Temporal, by adding the following lines to `settings.xml`, your Maven configuration file. Match the version of `temporal-sdk` and `temporal-testing` to the server version installed on your system. Issue `temporal --version` after installing the tools.

```xml
<dependencies>
  <dependency>
    <groupId>io.temporal</groupId>
    <artifactId>temporal-sdk</artifactId>
    <version>1.22.2</version>
  </dependency>

  <dependency>
    <groupId>io.temporal</groupId>
    <artifactId>temporal-testing</artifactId>
    <version>1.22.2</version>
    <scope>test</scope>
  </dependency>  
</dependencies>
```
By default, this file is placed in the user's home (in `.m2/settings.xml`) or the Maven install (in `conf/settings.xml`). Create a new file if a Maven settings file does not already exist on your system.

  </TabItem>
  <TabItem value="gradle" label="Gradle">

### Configure Gradle

Gradle is bundled with [IntelliJ IDEA](https://www.jetbrains.com/idea/). To install it separately from IntelliJ, follow the [instructions](https://gradle.org/install/) at the Gradle.org site.

Add the following lines to `build.gradle`, your Gradle configuration file. This lets your installation works with the Temporal SDK. This file is normally placed at your project root. You can customize it to live elsewhere.

```groovy
implementation 'io.temporal:temporal-sdk:1.22.2' 
testImplementation 'io.temporal:temporal-testing:1.22.2'
```

Match the version of `temporal-sdk` and `temporal-testing` to the server version installed on your system. Issue `temporal --version` after installing the tools.

  </TabItem>
</Tabs>

Now that you have a JDK and a Java build automation tool, you'll configure a local Temporal Cluster for development.

## Set up a local Temporal development Cluster with Temporal CLI

import Cluster  from '@site/docs/getting_started/_temporal_cluster.md'

<Cluster />

With everything installed, you're ready to build Temporal apps on your local machine.

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

To follow the Java SDK tutorials and build your own Temporal applications with Java, you'll need a JDK and the Temporal Java SDK. You will also install and run a Temporal Cluster, a group of services that provide Temporal platform features.

## Get the Java JDK

If you haven't done so already, install the [Java JDK](https://www.oracle.com/java/technologies/downloads/) or [OpenJDK](https://openjdk.org/install/). To check the version of your current Java installation, issue the version command:

```command
java --version
```

We developed these tutorials using Java SE 19.0.2. 

## Install the Temporal Java SDK

Our tutorials use the [Apache Maven](https://maven.apache.org/) software project management tool. You can use Maven, [Gradle](https://gradle.org), or any other tool you prefer to build and package your Temporal applications.

<Tabs groupId="build-tool" queryString>
  <TabItem value="maven" label="Maven">

### Configure Maven

[Apache Maven](https://maven.apache.org/) is popular build and dependency management tool. Install Maven by following the [instructions](https://maven.apache.org/install.html) at Apache.org.

To configure Maven for Temporal, add the following lines to your Maven configuration file. By default, this file is located in the user's home (in `.m2/settings.xml`) or the Maven install (in `conf/settings.xml`). If a Maven settings file does not already exist on your system, create one.

```xml
<dependencies>
  <dependency>
    <groupId>io.temporal</groupId>
    <artifactId>temporal-sdk</artifactId>
    <version>1.19.0</version>
  </dependency>

  <dependency>
    <groupId>io.temporal</groupId>
    <artifactId>temporal-testing</artifactId>
    <version>1.19.0</version>
    <scope>test</scope>
  </dependency>  
</dependencies>
```

  </TabItem>
  <TabItem value="gradle" label="Gradle">

### Configure Gradle

Like Maven, [Gradle](https://gradle.org) is a dependency management and build tool for Java projects. It enables you to build the projects in these tutorials.

Gradle is bundled with [IntelliJ IDEA](https://www.jetbrains.com/idea/). To install it separately, follow the [instructions](https://gradle.org/install/) at the Gradle.org site.

Configure your installation to work with the Temporal SDK by adding by adding the following lines to your Gradle configuration file, `build.gradle`. This file is normally placed at your project root or you can customize it to live elsewhere.

```groovy
implementation 'io.temporal:temporal-sdk:1.19.0' 
testImplementation 'io.temporal:temporal-testing:1.19.0'
```

  </TabItem>
</Tabs>

Next, you'll configure a local Temporal Cluster for development.

## Set up a local Temporal development Cluster with Temporal CLI

import Cluster  from '@site/docs/getting_started/_temporal_cluster.md'

<Cluster />

Once you have everything installed, you're ready to build apps with Temporal on your local machine.

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

Ensure you have all the components necessary to start building Temporal Apps before diving into Java SDK tutorials or creating new applications. The following sections help you set up your development tools.

You'll need a [Java Development Kit](https://www.oracle.com/java/technologies/downloads/) (JDK), a build system  (like [IntelliJ](https://www.jetbrains.com/idea/)) or stand-alone build tool (like [Apache Maven](https://maven.apache.org)), and the [Temporal Java SDK](https://github.com/temporalio/sdk-java). You'll use these with a Temporal Cluster--a group of services that provides the Temporal Platform's features--to explore how Java and Temporal work together to build amazing orchestrated services.

## Get the Java JDK

If you haven't done so already, install a JDK. Either download a copy directly from [Oracle](https://www.oracle.com/java/technologies/downloads) or select an [OpenJDK distribution](https://adoptium.net/marketplace/?os=any&arch=any&package=jdk) from your preferred vendor. 

Check the version of your current JDK installation by issuing `java --version` from the command line. We developed and tested these Java tutorials with Java 21, but they should work with JDKs version 8 or higher.

## Install the Temporal Java SDK

Our Java tutorials use [Apache Maven](https://maven.apache.org/) to manage dependencies and build applications. You can also use [Gradle](https://gradle.org) or other build automation tools.

Follow these steps to configure Maven or Gradle for Temporal.

<Tabs groupId="build-tool" queryString>
  <TabItem value="maven" label="Maven">
  
### Configure Maven

To install [Apache Maven](https://maven.apache.org/), [download a copy](https://maven.apache.org/download.cgi) and follow the [instructions](https://maven.apache.org/install.html) at Apache.org. 

Add the following dependencies to your Maven Project Object Model (POM) configuration file (`pom.xml`) to compile, build, test, and run Temporal's Java SDK.

```xml
  <dependencies>
    <!-- 
     | Temporal dependencies needed to compile, build, 
     | test, and run Temporal's Java SDK
    -->
    
    <!--
     | SDK
    -->
    <dependency>
      <groupId>io.temporal</groupId>
      <artifactId>temporal-sdk</artifactId>
      <version>1.22.2</version>
    </dependency>

    <dependency>
      <!--
       | Testing
      -->
      <groupId>io.temporal</groupId>
      <artifactId>temporal-testing</artifactId>
      <version>1.22.2</version>
      <scope>test</scope>
    </dependency>  
  </dependencies>
```

Match the version of `temporal-sdk` and `temporal-testing` to the Temporal server version installed on your system. Issue `temporal --version` after installing the Temporal tools so you know which version to use in `settings.xml`.

  </TabItem>
  <TabItem value="gradle" label="Gradle">

### Configure Gradle

The [Gradle](https://gradle.org) build tool is bundled with [IntelliJ IDEA](https://www.jetbrains.com/idea/). To download and install it separately from IntelliJ, follow the [instructions](https://gradle.org/install/) at the Gradle.org site.

Add the following lines to `build.gradle`, your Gradle configuration file. This lets your installation works with the Temporal SDK. This file is normally placed at your project root. You can customize it to live elsewhere.

```groovy
implementation 'io.temporal:temporal-sdk:1.22.2' 
testImplementation 'io.temporal:temporal-testing:1.22.2'
```

Match the version of `temporal-sdk` and `temporal-testing` to the Temporal server version installed on your system. Issue `temporal --version` after installing the Temporal tools, so you know which version to set in your `build.gradle` configuration.

  </TabItem>
</Tabs>

Now that you have a JDK and a Java build automation tool, you'll configure a local Temporal Cluster for development.

## Set up a local Temporal development Cluster with Temporal CLI

import Cluster  from '@site/docs/getting_started/_temporal_cluster.md'

<Cluster />

With your tooling installed, you're now ready to build Temporal apps on your local machine.

---
id: java-dev-env
sidebar_position: 1
description: Set up a local development environment for developing Temporal applications using the Java programming language.
tags: [Java, SDK, development environment]
keywords: [Java, JRE, Temporal, IntelliJ, Gradle, development environment]
last_update:
  date: 2024-02-23
title: Set up a local development environment for Temporal and Java
image: /img/temporal-logo-twitter-card.png
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

![Temporal Java SDK](/img/sdk_banners/banner_java.png)

Ready to dive into the Java SDK or to start building Temporal Apps? Ensure you have all your components in place. The following sections help you set up your development environment.

You'll need a [Java Development Kit](https://www.oracle.com/java/technologies/downloads/) (JDK) and the [Temporal Java SDK](https://github.com/temporalio/sdk-java), a library that provides support for building Temporal applications. You'll also need a build tool, such as [Apache Maven](https://maven.apache.org/), which can either be a stand-alone installation or one bundled with IntelliJ IDEA or similar IDE.

You'll use these with a Temporal Cluster--a group of services that provides the Temporal Platform's features--to explore how Java and Temporal work together to build amazing orchestrated services.

## Install the Java JDK

If you haven't done so already, install a JDK. Either download a copy directly from [Oracle](https://www.oracle.com/java/technologies/downloads) or select an [OpenJDK distribution](https://adoptium.net/marketplace/?os=any&arch=any&package=jdk) from your preferred vendor. 

Check the version of your current JDK installation by executing `java --version` at a command prompt. We developed and tested these Java tutorials with Java 21, but they should work with JDKs version 8 or higher.

## Add Temporal Java SDK Dependencies

Our Java tutorials use [Apache Maven](https://maven.apache.org/) to manage dependencies and build applications. You can also use [Gradle](https://gradle.org) or other build automation tools.

Follow these steps to configure Maven or Gradle for Temporal.

<Tabs groupId="build-tool" queryString>
  <TabItem value="maven" label="Maven">
  
### Configure Maven

To install [Apache Maven](https://maven.apache.org/), [download a copy](https://maven.apache.org/download.cgi) and follow the [instructions](https://maven.apache.org/install.html) at Apache.org. 

Add the following dependencies to your Maven Project Object Model (POM) configuration file (`pom.xml`) to compile, build, test, and run a Temporal Application in Java.

```xml
  <dependencies>
    <!-- 
      Temporal dependencies needed to compile, build, 
      test, and run Temporal's Java SDK
    -->
    
    <!--
      SDK
    -->
    <dependency>
      <groupId>io.temporal</groupId>
      <artifactId>temporal-sdk</artifactId>
      <version>1.22.4</version>
    </dependency>

    <dependency>
      <!--
        Testing
      -->
      <groupId>io.temporal</groupId>
      <artifactId>temporal-testing</artifactId>
      <version>1.22.4</version>
      <scope>test</scope>
    </dependency>  
  </dependencies>
```

  </TabItem>
  <TabItem value="gradle" label="Gradle">

### Configure Gradle

The [Gradle](https://gradle.org) build tool is bundled with [IntelliJ IDEA](https://www.jetbrains.com/idea/). To download and install it separately from IntelliJ, follow the [instructions](https://gradle.org/install/) at the Gradle.org site.

Add the following lines to `build.gradle`, your Gradle configuration file. This lets your installation works with the Temporal SDK so you can compile, build, test, and run a Temporal Application in Java.


```groovy
implementation 'io.temporal:temporal-sdk:1.22.4' 
testImplementation 'io.temporal:temporal-testing:1.22.4'
```

  </TabItem>
</Tabs>

Now that you have a JDK and a Java build automation tool, you'll configure a local Temporal Cluster for development.

## Set up a local Temporal development Cluster with Temporal CLI

import Cluster  from '@site/docs/getting_started/_temporal_cluster.md'

<Cluster />

With your tooling installed, you're now ready to build Temporal apps on your local machine.

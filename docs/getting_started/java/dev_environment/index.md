---
id: java-dev-env
sidebar_position: 1
description: Set up a local development environment for developing Temporal applications using the Java programming language.
tags: [Java, SDK, development environment]
keywords: [Java, JRE, Temporal, IntelliJ, Gradle, development environment]
last_update:
  date: 2021-10-01
title: Set up a local development environment for Temporal and Java
image: /img/temporal-logo-twitter-card.png
---

![Temporal Java SDK](/img/sdk_banners/banner_java.png)

To follow the Java SDK tutorials and build your own Temporal applications with Java, you'll need the JDK, the Temporal Java SDK  and a Temporal development server.


## Get the Java JDK

Make sure you have the [Java JDK](https://www.oracle.com/ca-en/java/technologies/javase-downloads.html) installed. These tutorials were produced using Java SE 14.0.1. You can check which version you have installed using this command:

```command
java -version
```

## Get the Temporal SDK for Java

You can use Gradle or Maven for your projects, although we recommend Gradle.


### Configure Gradle

[Gradle](https://gradle.org) is a dependency management and build tool for Java projects. You'll need it installed to work with the projects in these tutorials.

You can install Gradle separately, or use [IntelliJ IDEA](https://www.jetbrains.com/idea/), which comes packaged with Gradle.

Install Gradle by following the [installation instructions](https://gradle.org/install/).

Add the following lines to your Gradle configuration to configure the Temporal SDK.

```groovy
implementation 'io.temporal:temporal-sdk:1.19.0' 
testImplementation 'io.temporal:temporal-testing:1.19.0'
```


### Configure Maven

Apache Maven is another popular Java build tool. 

Install Maven following the [official installation instructions](https://maven.apache.org/install.html).

Add the following lines to your Maven configuration:

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

Next, you'll configure a local Temporal cluster for development.


## Set up a Temporal development cluster

import Cluster  from '@site/docs/getting_started/_temporal_cluster.md'

<Cluster />

Once you have everything installed, you're ready to build apps with Temporal on your local machine.

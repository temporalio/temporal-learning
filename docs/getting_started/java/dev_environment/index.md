---
id: java-dev-env
sidebar_position: 1
description: Set up a local development environment for developing Temporal applications using the Java programming language.
tags: [Java, SDK, development environment]
keywords: [Java, JRE, Temporal, IntelliJ, Gradle, development environment]
last_update:
  date: 2021-10-01
title: Set up a local development environment for Temporal and Java
---

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
implementation 'io.temporal:temporal-sdk:1.11.0' 
implementation 'io.temporal:temporal-sdk:1.12.0'test 
implementation 'io.temporal:temporal-testing:1.12.0'
```


### Configure Maven

Apache Maven is another popular Java build tool. 

Install Maven following the [official installation instructions](https://maven.apache.org/install.html).

Add the following lines to your Maven configuration:

```xml
<dependency>
  <groupId>io.temporal</groupId>
  <artifactId>temporal-sdk</artifactId>
  <version>1.11.0</version>
</dependency>
```



## Set up a Temporal development cluster

Download and install the Temporal development cluster locally using Docker Compose. You'll run this server in the background while you develop your applications.

You must have [Docker](https://docs.docker.com/engine/install) and [Docker Compose](https://docs.docker.com/compose/install) installed.

Then clone the [temporalio/docker-compose](https://github.com/temporalio/docker-compose) repository and run `docker-compose up` from the root of that repository:

```command
git clone https://github.com/temporalio/docker-compose.git
```

```command
cd  docker-compose
```

```command
docker-compose up
```

When the Temporal Cluster is running, the Temporal Web UI becomes available in your browser: [localhost:8080](http://localhost:8080/)

Review other methods in the [Run a dev Cluster](https://docs.temporal.io/application-development/foundations#run-a-dev-cluster) section in Temporal's documentation.

Once you have everything installed, you're ready to build apps with Temporal on your local machine.

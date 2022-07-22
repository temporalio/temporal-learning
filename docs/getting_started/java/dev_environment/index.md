---
id: java-dev-env
sidebar_position: 1
description: Set up a local development environment for developing Temporal applications using the Java programming language.
tags: [Java, SDK, development environment]
keywords: [Java, JRE, Temporal, IntelliJ, Gradle, development environment]
last_update:
  date: 2021-10-01
title: Set up a Local Development Environment for Temporal and Java
---

To follow the Java SDK tutorials we recommend that you have the following environments set up.

## Java JDK

Make sure you have the [Java JDK](https://www.oracle.com/ca-en/java/technologies/javase-downloads.html) installed. These tutorials were produced using Java SE 14.0.1. You can check which version you have installed using this command:

```
java -version
```

## Install Gradle

[Gradle](https://gradle.org) is a dependency management and build tool for Java projects. You'll need it installed to work with the projects in these tutorials.

You can install Gradle separately, or use [IntelliJ IDEA](https://www.jetbrains.com/idea/), which comes packaged with Gradle.

Install Gradle by following the [installation instructions](https://gradle.org/install/).


## Set up a Temporal development server

Download and install the Temporal Server locally using Docker Compose by following [How to run a Temporal Cluster for local development using Docker Compose](https://docs.temporal.io/clusters/quick-install/#docker-compose).

You'll run this server in the background while you develop your applications.

Once you have everything installed, you're ready to build apps with Temporal on your local machine.

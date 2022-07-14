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

## Either Gradle or IntelliJ IDEA

Either download and install the [IntelliJ IDEA](https://www.jetbrains.com/idea/), install [Gradle](https://gradle.org/install/), or do both. The IDE comes packaged with Gradle, which is a dependency management and build tool that we use for Java projects.

## Temporal server

Download, install, and run the [Temporal server](https://docs.temporal.io/clusters/quick-install) via docker-compose. It is easy to do and you can keep it running in the background while you build applications.

---
id: audiobook-tutorial
keywords: [Java, temporal, sdk, tutorial, entity workflow, audiobook, text to speech, OpenAI]
tags: [Java, SDK]
last_update:
  date: 2024-07-16
title: Create audiobooks from text with OpenAI and Java
description: Learn to build your own audiobooks from text using OpenAI Web APIs and Temporal. Step-by-step guide for hassle-free MP3 creation with robust failure mitigation.
sidebar_label: Create audiobooks from text with OpenAI and Java
image: /img/temporal-logo-twitter-card.png
---

![Temporal Java SDK](/img/sdk_banners/banner_java.png)

## Introduction

For many people, audiobooks provide a staple of daily life.
Whether stuck in traffic, out jogging, or tidying up at home, listening to audio helps people pass the time.
You can learn new things, enjoy stories, and stay entertained without being tied to a screen or a book.
There's a real demand for fluent and well-narrated audio experiences.
Despite the availability of podcasts and commercial audiobooks, people are still looking for flexible ways to bring all kinds of text to life.

Text-to-speech (TTS) isn't new.
For years, TTS has served the assistive community, transforming words on the page into an immersive and accessible engagement.
Unfortunately, the user experience hasn't been the best.
A heteronym means a word that with one spelling and different meanings and pronunciation.
The word 'bow' is both a weapon and bending at the waist or neck.
TTS apps struggled with these kinds of words.
From robotic voices and unnatural rhythms to odd ways of speaking, if you didn't need text-to-speech, you probably wouldn't have used text-to-speech.

That changed when companies like [OpenAI](https://openai.com/api/) developed state-of-the-art speech synthesis that sounded like humans speaking.
Large language models (LLMs) produced realistic voices that felt warm and nuanced.
Voices could be localized by language and region for the right rhythms and inflections.
LLMs allowed people to lose themselves in spoken content and not think about about the delivery technology.
In a nutshell, "digital assistant"-style voices are yesterday's tech and high-quality narration is ready.

### Build something great

Wouldn't it be great if you could turn any text into an audiobook?
There's so much text to choose from: a webpage, an email, a work report, and books on sites like [Project Gutenberg](https://gutenberg.org).
Combine text-to-speech APIs with Temporal error mitigation, and you can build great solutions that focus on your data and API calls.
Temporal's open source fault tolerant SDKs means hassle-free reliable results.
You don't have to perform the traditional "check-the-status", "check-for-errors", "check-for-data", "pass completion closures" dance.
And if your Web connection goes down or you experience a power outage, Temporal persists your progress, ready to resume working when more favorable conditions prevail.

This tutorial shows how to use OpenAI Web APIs and Temporal's "just focus on your business logic" tooling to effortlessly create MP3 files from text files.
You can build the project by following this tutorial or grab the ready-to-go source from its [GitHub repo](https://github.com/temporalio/build-audiobook-java).
You'll be set to listen to whatever you want, whenever you want.

## Prerequisites

Before starting this tutorial:

- **Install**: [Set up a local development environment](/getting_started/java/dev_environment/index.md) for developing Temporal applications using Java.
  Ensure a local Temporal Service is running, and that you can access the Temporal Web UI from port `8233`.
- **Review**: Review the [Hello World in Java](/getting_started/java/hello_world_in_java/index.md) tutorial to understand the basics of getting a Temporal Java SDK project up and running.
- **Get credentialed**: You'll need an active [OpenAI API developer account](https://openai.com/api/) and bearer token to use the OpenAI services with this project.
- **Peek**: We placed a full [reference repo](https://github.com/temporalio/build-audiobook-java) on GitHub if you want to skip straight to the good stuff.

## Overview

In this tutorial, you will:

- [Create a project structure and your build file](#create-your-project).
  This project uses Gradle because it's quick and simple to use.
  Feel free to use Maven if you prefer.
- [Build two data types](#build-data-types). You'll add a payload to help kick off the conversion and a status that tracks your progress.
- [Build your Workflow](#build-your-workflow). Your Workflow sets the steps that process text into audio.
  You'll add some policies to make sure your app knows how to handle errors and a query method to peek at the current task status.
- [Code up the conversion logic](#code-the-conversion).
  This is the heart of your project and it's the fun part.
  You'll be amazed at how much this code _doesn't_ worry about errors.
- [Add basic file and data handling](#add-file-and-data-handling).
  You'll want to make sure your input file exists, isn't empty, and can be read -- and other file basics.
  This is the part that reads your input file and breaks it down into chunks.
  As your conversion works, you'll be able to check in and see which chunk is currently being processed.
- [Implement the conversion Activity](#implement-the-conversion-activity).
  Automatically retry your work when it encounters API availability issues by embedding it into a Temporal Activity.
- [Add an file and data manipulation activity](#implement-the-file-activity).
  This Activity brings your file and data handling into compliance with the Temporal system.
- [Code up your Worker](#code-your-worker).
  A Temporal Worker handles the processing of your Workflow tasks and initiating the execution of your code.

And, that's it! 
By the end of this tutorial you'll have learned how to use OpenAI and Temporal to create audio from text.
You'll discover how Temporal abstracts away error management and retries for remote services and you'll see how to integrate non-retryable local system tasks into your Temporal work. 

Now that you know what you'll be doing, it's time to build your personal audio narration system.
Start by building your project structure and create your Gradle build file.

## Create your project {#create-your-project}

Create a new project folder and set up the following folder structure inside it.

```
src
└── main
    └── java
        └── TTSProject
            ├── model
            ├── temporal
            └── utility
```

For this tutorial, you'll add your build file to the main folder and your Java sources to the TTSProject subfolders.

Go ahead and create your Gradle build file (or Maven if that's your preferred approach) in the TTSProject folder.
With this, you can `gradle build` your project and `gradle run` your Temporal Worker app.
This build file is minimal because the project is simple.
You use Temporal's [Java SDK](https://github.com/temporalio/sdk-java), and a few dependencies to handle calling APIs:

<!--SNIPSTART audiobook-project-java-Gradle-build-file-->
[build.gradle](https://github.com/temporalio/build-audiobook-java/blob/main/build.gradle)
```gradle
group 'ttspackage'; version '0.0.1'
repositories { mavenCentral() }
apply plugin: 'java'
sourceSets.main.java.srcDirs 'src'

dependencies {
    implementation 'io.temporal:temporal-sdk:1.22.2'
    implementation 'org.slf4j:slf4j-nop:2.0.6' // logging suppression
    implementation 'commons-io:commons-io:2.11.0'
    implementation 'com.squareup.okhttp3:okhttp:4.9.3'
    implementation 'org.json:json:20210307'
}

// Run the App
task run(type: JavaExec) {
    classpath = sourceSets.main.runtimeClasspath
    mainClass = 'ttspackage.TTSWorkerApp'
    standardOutput = System.out
}
```
<!--SNIPEND-->

### Create an optional bearer.sh file

This 'bearer.sh' script sets your OpenAI bearer token as an environment variable.
When you use a script like this, you must `source /path/to/bearer.sh` to set the variable in your current shell.
Environment variables let you skip hard coding your bearer token into projects.
Store the shell script wherever you keep similar secure items:

```
#! /bin/sh

setenv OPEN_AI_BEARER_TOKEN 'your-secret-bearer-token'
```

:::note Important

You must add your bearer environment variable in the _same_ shell as your Temporal Worker.
The Worker checks for the token and if it's not set, it will error.

:::


## Build data types {#build-data-types}

This project uses two data type classes: a payload and a conversion status.
These classes store the data needed to kick off the conversion and track your work progress.
The `InputPayload` is a deserialized version of data that's passed to this project's Workload as its created.
It has one field, a string `path`.

<!--SNIPSTART audiobook-project-java-InputPayload-data-type {"selectedLines": ["6-8", "14-14"]}-->
[src/main/java/ttsworker/model/InputPayload.java](https://github.com/temporalio/build-audiobook-java/blob/main/src/main/java/ttsworker/model/InputPayload.java)
```java
// ...
public class InputPayload {
    public String path;

// ...
}
```
<!--SNIPEND-->

The `ConversionStatus` class has three groups of fields:

<!--SNIPSTART audiobook-project-java-Conversion-Status-data-type {"selectedLines": ["9-16"]}-->
[src/main/java/ttsworker/model/ConversionStatus.java](https://github.com/temporalio/build-audiobook-java/blob/main/src/main/java/ttsworker/model/ConversionStatus.java)
```java
// ...
    public String inputPathString; // Provided by Workflow input
    public Path inputPath; // Source file path
    public Path tempOutputPath; // Work file Path
    public Path outputPath; // Results file Path
    public List<String> chunks; // Batched input text
    public int chunkCount; // Number of text chunks
    public int count; // Number of chunks processed
    public String message; // User-facing Query text
```
<!--SNIPEND-->

The first group stores several path items.
These allow the Workflow to retain references to each file path, even if work is interrupted or processing changes from one Worker process to another.
The second group includes the data related to processing text, specifically the text chunks.
Finally, the third is a String message.
This provides a user-facing message for Temporal [Queries](https://docs.temporal.io/encyclopedia/workflow-message-passing#queries).
The Workflow updates this message during its lifetime, providing progress snapshots.

**![](/img/icons/download.png) Build It**
Create two files in src/main/java/ttsworker/model named 'InputPayload.java' and 'ConversionStatus.java`.
Add the sources here to each file.

<details>

<summary>
Data Type Sources
</summary>

<Tabs groupId="datatypesources" queryString>
  <TabItem value="conversionstatus" label="ConversionStatus.java">

### Conversion Status data type

<!--SNIPSTART audiobook-project-java-Conversion-Status-data-type-->
[src/main/java/ttsworker/model/ConversionStatus.java](https://github.com/temporalio/build-audiobook-java/blob/main/src/main/java/ttsworker/model/ConversionStatus.java)
```java
package ttspackage;

import java.nio.file.Path;
import java.util.List;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;

@JsonDeserialize(as = ConversionStatus.class)
public class ConversionStatus {
    public String inputPathString; // Provided by Workflow input
    public Path inputPath; // Source file path
    public Path tempOutputPath; // Work file Path
    public Path outputPath; // Results file Path
    public List<String> chunks; // Batched input text
    public int chunkCount; // Number of text chunks
    public int count; // Number of chunks processed
    public String message; // User-facing Query text

    public ConversionStatus() {} // Jackson

    public ConversionStatus(String inputPath) {
        this.inputPathString = inputPath;
        this.tempOutputPath = null;
        this.inputPath = null;
        this.outputPath = null;
        this.chunks = null;
        this.chunkCount = 1;
        this.count = 0;
        this.message = "Text to speech request received";
    }

}
```
<!--SNIPEND-->

  </TabItem>
  <TabItem value="inputpayload" label="InputPayload.java">

### Input Payload data type

<!--SNIPSTART audiobook-project-java-InputPayload-data-type-->
[src/main/java/ttsworker/model/InputPayload.java](https://github.com/temporalio/build-audiobook-java/blob/main/src/main/java/ttsworker/model/InputPayload.java)
```java
package ttspackage;

import com.fasterxml.jackson.databind.annotation.JsonDeserialize;

@JsonDeserialize(as = InputPayload.class)
public class InputPayload {
    public String path;

    public InputPayload() { } // support Jackson deserialization

    public InputPayload(String path) {
        this.path = path;
    }
}
```
<!--SNIPEND-->

  </TabItem>
</Tabs>

</details>

## Build your Workflow {#build-your-workflow}

a

## Code the conversion {#code-the-conversion}

b

## Add file and data handling {#add-file-and-data-handling}

c

## Implement the conversion Activity {#implement-the-conversion-activity}

d

## Implement the file Activity {#implement-the-file-activity}

e

## Code your Worker {#code-your-worker}

f

## Conclusions {#wrap-up}

g

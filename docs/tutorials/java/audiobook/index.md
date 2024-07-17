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

### Introduction

For many folk, audiobooks are a staple in their daily lives.
Whether stuck in traffic, out jogging, or just tidying up at home, listening to audio helps pass the time, letting you enjoy stories, learn new things, and keep you entertained without being tied to a screen or a book.
The demand for fluent and well-narrated audio experiences led to the rise of companies like Audible.
At the same time, both individuals and authors have looked for more flexible ways to bring text to life.

Text-to-speech isn't new.
For years, it's served the assistive community in transforming words on the page into an immersive and accessible experience.
Unfortunately, the user experience hasn't been the best.
Voices that sounded like robots, unnatural rhythms and odd ways of speaking (should "bow" be pronounced like the weapon or the courtesy) meant that if you didn't _need_ text-to-speech, you probably wouldn't _use_ text-to-speech.

That changed when companies like [OpenAI](https://openai.com/api/) developed state-of-the-art speech synthesis that sounded like humans speaking.
The results were realistic voices that feel warm and nuanced
They could be localized by language and region to pick up the rhythms and inflections that allowed people to lose themselves in spoken content and not think about about the delivery technology.

Because OpenAI offers easy-to-use APIs, transforming text into speech has reached new heights.
Old digital assistant voices are out and high-quality narration is ready for you to use.
Wouldn't it be great if you could turn any text into an audiobook?
By combining OpenAI text processing with Temporal error mitigation, you can build your own audiobook content.
There's minimum overhead and maximum reliability.
Temporal's open source fault tolerant SDKs mean you can just break down text files, convert them to speech, and build up your narrated results.

You don't have to perform the traditional "check-the-status", "check-for-errors", "check-for-data", "pass completion closures" dance.
If your Web connection goes down or you experience a power outage, Temporal will persist your progress and retry your work until more favorable conditions prevail.

This tutorial shows how to use OpenAI Web APIs and Temporal's "just focus on the business logic" tooling to effortlessly create MP3 files from text files.
Build the project by following this tutorial or grab the ready-to-go source from its [GitHub repo](https://github.com/temporalio/build-audiobook-java) and you're set to listen to whatever you want, whenever you want.

## Prerequisites

Before starting this tutorial:

- **Install**: [Set up a local development environment](/getting_started/java/dev_environment/index.md) for developing Temporal applications using Java. Ensure a local Temporal Service is running, and that you can access the Temporal Web UI from port `8233`.
- **Review**: Review the [Hello World in Java tutorial](/getting_started/java/hello_world_in_java/index.md) to understand the basics of getting a Temporal Java SDK project up and running.
- **Get credentialed**: You'll need an active [OpenAI API developer account](https://openai.com/api/) and bearer token to use the OpenAI services with this project.
- **Refer**: The already-built [GitHub repo](https://github.com/temporalio/build-audiobook-java) for this project is at [https://github.com/temporalio/build-audiobook-java](https://github.com/temporalio/build-audiobook-java).

## Create your project

This project uses Gradle because it's fast and easy and simple.
You can easily port to Maven if that works better for you.

Create a new project folder and then build the following folder structure inside it.
During this tutorial, you'll add your build file to the main folder and your Java sources to the TTSProject subfolders.

```
src
└── main
    └── java
        └── TTSProject
            ├── model
            ├── temporal
            └── utility
```

### Add a Gradle build file

Create 'TTSProject/build.gradle' and add these contents.
This build file is simple because the project is simple.
You use Temporal's [Java SDK](https://github.com/temporalio/sdk-java), and a few dependencies to handle calling APIs.

```groovy
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

With this, you can `gradle build` your project and `gradle run` your Temporal Worker app.

### (Optional) Create a bearer.sh file

A 'bearer.sh' scripts sets your OpenAI bearer token as an environment variable.
Remember: if you use a script like this, you must `source /path/to/bearer.sh` for the variable to be passed to your current shell.
Using an environment variable means you don't have to hard code your bearer token into your project.
You can store the shell script wherever you keep similar secure items:

```
#! /bin/sh

setenv OPEN_AI_BEARER_TOKEN 'your-secret-bearer-token'
```

You must set this token in the same shell as the Temporal Worker, which you'll build in this tutorial.
The Worker checks for the token.
If it's not set, it will error.

## Define your business logic with Temporal

You'll use Temporal to power a one-step text-to-speech operation.
A Temporal Workflow will process each conversion.

[Workflows](https://docs.temporal.io/workflows) define the overall flow of your business process.
Conceptually, a Workflow is a sequence of steps written in your programming language.

Workflows orchestrate [Activities](https://docs.temporal.io/activities), which is how you interact with the outside world in Temporal.
You use Activities to make API requests, access the file system, or perform other non-deterministic operations.

The Workflow you'll create in this tutorial uses three activities:

- `setupStatus`: Initializes a process status data type and prepares the data to begin the process.
- `process`: Processes a single chunk of text into audio.
- `moveAudio`: Moves audio from your system's temporary work directory to its destination.

### Explore the Workflow code

Here is the main Workflow code. It creates the status data type using the payload passed to the Workflow. It then converts each chunk and finishes by moving the new audio file into place.

```java
// Workflow entry point
public String startWorkflow(InputPayload payload) {
    // Create the conversion elements
    ConversionStatus status = fileStub.setupStatus(payload.path);

    // Process them
    for (int index = 0; index < status.chunkCount; index += 1) {
        status.count = index;
        status.message = "Processing part " + (index + 1) + " of " + status.chunkCount; // for Queries
        logger.info(status.message);
        encodingStub.process(status.chunks.get(index), status.tempOutputPath);
    }

    // Move the results into place from the temporary folder
    status = fileStub.moveAudio(status);
    logger.info("Output file: " + status.outputPath.toString());
    return status.outputPath.toString();
}
```

### Set the Retry Policy

Because this is a Temporal solution, each Activity uses a stub (a Temporal-controlled dynamic point of invocation) to run its code. This Workflow creates two stubs, `encodingStub` and `fileStub`.

- `encodingStub`: responsible for handling retryable API requests.
- `fileStub`: responsible for handling non-retryable local file system requests.

```java
// Allow up to two minutes for each chunk to process.
private TTSActivities encodingStub = TemporalUtility.buildActivityStub(TTSActivities.class, 0, Duration.ofSeconds(120));

// Local utility work requires very little time so it uses a shorter timeout
private FileActivities fileStub = TemporalUtility.buildActivityStub(FileActivities.class, 0, Duration.ofSeconds(10));
```

As you see here, these two stubs implement different policies, which are set with a utility class called `TemporalUtility`.
These calls set a maximum activity time of 2 minutes for outbound API calls and 10 seconds for local file work.
The time it takes to convert your text varies by the size of your text content.
The project "chunk" size is fairly small and under normal circumstances only takes a fraction of a minute to process.
Using a higher duration allows "spike" processing when the API is busy and responses are slower.
The local file system turn-around is very short and doesn't need a long watchdog timeout.

Having seen the invocation of `TemporalUtility.buildActivityStub`, next you'll look at its implementation.

### Create 'TemporalUtility.java'

Create a file and add the following code to 'src/main/java/ttsworker/utility/TemporalUtility.java':

<!--snipstart audiobook-project-java-Temporal-utility-class-->
<!--snipend-->

The `TemporalUtility` class moves some boilerplate code into its own file and out of the Workflow, mainly for readability.
Here you see how the [maximum attempts](https://docs.temporal.io/encyclopedia/retry-policies#maximum-attempts) and ['schedule-to-close' limits](https://docs.temporal.io/glossary#schedule-to-close-timeout) are set and a new Activity stub is returned.

Next, you'll create your Activities.

### Create the text-to-speech Activity



### Create the text-to-speech Workflow

Create 'TTSWorkflow.java' and 'TTSWorkflowImpl.java' in the 'src/main/java/ttsworker/temporal' folder.

<details>
<summary>
Workflow Source
</summary>
<Tabs groupId="workflow-sources" queryString>
  <TabItem value="interface" label="Interface">

### Source Interface

<!--SNIPSTART audiobook-project-java-Workflow-interface-->
<!--SNIPEND-->

  </TabItem>
  <TabItem value="interface" label="Implementation">

### Source Implementation

<!--SNIPSTART audiobook-project-java-Workflow-implementation-->
<!--SNIPEND-->

  </TabItem>
</Tabs>




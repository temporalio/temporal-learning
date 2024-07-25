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

For many people, audiobooks are a staple of their daily life.
Spoken content helps people pass the time when they're stuck in traffic, out jogging, or tidying up at home, .
You can learn new things or just stay entertained without being tied to a screen or a book.

For years, text-to-speech solutions (TTS) served the assistive community, transforming words on the page into an immersive and accessible engagement.
Until recently, robotic voices and unnatural rhythms meant that if you didn't need TTS, you probably wouldn't use TTS.
Now companies like [OpenAI](https://openai.com/api/) have developed speech synthesis that sound like humans.
Their large language models (LLMs) produce realistic voices with warm and nuanced narration.
So, wouldn't it be great if you could use this kind of tech to transform any text to an audiobook?

In this tutorial, you'll build a text-to-speech system using OpenAI APIs.
You'll create tooling that works with plain text input files, breaking your text source down into batches, and converting them sequentially.
Your project uses Temporal error mitigation so you can focus on input, conversion, and output, and not on handling error conditions.
You won't have to perform the traditional "check-the-status", "check-for-errors", "check-for-data", "pass completion closures" dance.

After completing this project, your new tool lets you create plain text files and transform them to audiobooks in minutes. 
You can grab text from emails, from the web, from [Project Gutenberg](https://gutenberg.org), or even that report you need to "read" for work.
Temporal's open source fault tolerant SDKs means hassle-free reliable audio output.
You'll be set to listen to whatever you want, whenever you want.

Ready to get started? Preflight the requirements for this tutorial.

## Prerequisites

You can build the project by following this tutorial or grab the ready-to-go source from its [GitHub repo](https://github.com/temporalio/build-audiobook-java).

Before starting this tutorial:

- **Install**: [Set up a local development environment](/getting_started/java/dev_environment/index.md) for developing Temporal applications using Java.
  Ensure a local Temporal Service is running, and that you can access the Temporal Web UI from port `8233`.
- **Review**: Review the [Hello World in Java](/getting_started/java/hello_world_in_java/index.md) tutorial to understand the basics of getting a Temporal Java SDK project up and running.
- **Get credentialed**: You'll need an active [OpenAI API developer account](https://openai.com/api/) and bearer token to use OpenAI services for this project.
- **Peek**: You'll find a full [reference repo](https://github.com/temporalio/build-audiobook-java) on GitHub if you want to skip straight to the good stuff.

If you're good on the prerequisites, it's time to build out your Java project directory.

## Create your Java project structure

Set up your source code folder hierarchy by issuing these directory creation commands:  

```
mkdir -p TTSWorker/src/main/java/ttsworker/model
mkdir -p TTSWorker/src/main/java/ttsworker/utility
mkdir -p TTSWorker/src/main/java/ttsworker/temporal
``` 

Your directory structure should now look like this:

```
TTSWorker
└── src
    └── main
        └── java
            └── ttsworker
                ├── model
                ├── temporal
                └── utility
```

In your root folder, create a Gradle build file.
This project chose Gradle because it's quick and uncomplicated to use.
Feel free to swap in Maven if you prefer.
This is a also good time to set up your version control if you want to use it with this project.

Create build.gradle and add these contents.

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

This build file is minimal because the project is minimal.
The `run` task starts your TTS application (`gradle run`).  
Your dependencies include Temporal's [Java SDK](https://github.com/temporalio/sdk-java), and a few basic libraries:

- **com.squareup.okhttp3:okhttp:4.9.3**: OkHttp is a basic HTTP client for network requests.
- **org.json:json:20210307**: Parse and manipulate JSON data.
- **commons-io:commons-io:2.11.0**: Perform file tasks with common input/output routines.
- **org.slf4j:slf4j-nop:2.0.6**: Minimizes unnecessary output with logging suppression.
- **io.temporal:temporal-sdk:1.22.2**: Add error mitigation.

Optionally create a `bearer.sh` utility and make it executable with `chmod +x`.
Store this wherever you keep similar secure items:

```
#! /bin/sh

setenv OPEN_AI_BEARER_TOKEN 'your-secret-bearer-token'
```

This 'bearer.sh' script sets your OpenAI bearer token as an environment variable.
You must `source /path/to/bearer.sh` to set the variable into your current shell.
Environment variables let you skip hard coding your bearer token into projects.

:::note Your Bearer Token

When using your application, you must set your `OPEN_AI_BEARER_TOKEN` environment variable in the same shell before execution.
The application checks for the token and if it's not set, it will error.

:::

## Create your OpenAI conversion code

Your TTSUtility.java file will live in 'src/main/java/ttsworker/utility'.
Its job is to perform conversion from strings to audio.
Create the file and add the following code:

<!--SNIPSTART audiobook-project-java-tts-utility-class-->
[src/main/java/ttsworker/utility/TTSUtility.java](https://github.com/temporalio/build-audiobook-java/blob/main/src/main/java/ttsworker/utility/TTSUtility.java)
```java
package ttspackage;

import okhttp3.*;
import org.json.JSONObject;
import java.io.IOException;

/**
 * Utility class to convert text to speech using the OpenAI API.
 */
public class TTSUtility {
    private static final String TTS_API_URL = "https://api.openai.com/v1/audio/speech";

    /**
     * Converts the given text to speech and returns the audio as a byte array.
     *
     * @param text the text to convert to speech.
     * @return a byte array containing the audio data in MP3 format.
     * @throws IOException if an error occurs while making the API request or processing the response.
     * @throws IllegalArgumentException if the Bearer token is not set in the environment variables.
     */
    public static byte[] textToSpeech(String text) throws IOException {

        // Fetch and clean up Bearer token from environment
        String bearerToken = System.getenv("OPEN_AI_BEARER_TOKEN");
        if (bearerToken != null) {
            bearerToken = bearerToken.trim();
            bearerToken = bearerToken.replaceAll("[\\P{Print}]", "");
        } else {
            throw new IllegalArgumentException("Bearer token is not set");
        }

        OkHttpClient client = new OkHttpClient();

        // Create API request payload
        JSONObject json = new JSONObject();
        json.put("model", "tts-1");
        json.put("input", text);
        json.put("voice", "nova"); // see https://platform.openai.com/docs/guides/text-to-speech/voice-options
        json.put("response_format", "mp3");

        RequestBody body = RequestBody.create(
                json.toString(), MediaType.get("application/json; charset=utf-8"));

        Request request = new Request.Builder()
                .url(TTS_API_URL)
                .post(body)
                .addHeader("Authorization", "Bearer " + bearerToken)
                .build();

        // Fetch and return response body
        try (Response response = client.newCall(request).execute()) {
            if (!response.isSuccessful()) throw new IOException("Unexpected code " + response);
            return response.body().bytes();
        }
    }
}
```
<!--SNIPEND-->

This class uses Open AI to convert text to audio.
Your request won't work without your OpenAI bearer token so make sure to set your environment variable before running this app.

Your `textToSpeech` method calls out to OpenAI to convert a `String` into a `byte[]` array.
It creates the request body, and performs a POST operation to the OpenAI endpoint defined at the class level.   

When creating the HTTP request body, customizable [endpoint options](https://platform.openai.com/docs/api-reference/audio/createSpeech) shape the way your audio is built:

- **model** (required): You use the basic low-latency 'tts-1' model in this project.
  Visit [OpenAI TTS](https://platform.openai.com/docs/models/tts) to read about the currently available models, which include both standard and high quality options.
- **input** (required): The maximum length of this string is set at 4096 characters.
- **voice** (required): The 'nova' voice has a high energy "lively tone".
  You can listen to samples of other voices at the [OpenAI Voice Options](https://platform.openai.com/docs/guides/text-to-speech/voice-options) page.
- **response_format**: You'll use the highly portable mp3 output format.

You may want to tweak the request body further.
Some people like to speed up their audio so they get through it quicker.
An optional **speed** parameter (from 0.5 to 4.0, defaults to 1) lets you speed up or slow down the output.
To tune the results to a specific languge so the model takes advantage of native inflections.
Set **language** to an [ISO-639](https://en.wikipedia.org/wiki/List_of_ISO_639_language_codes) code.
OpenAI offers over fifty [supported languages](https://platform.openai.com/docs/guides/text-to-speech/supported-languages).   

With the conversion class created, next you'll build two support classes for managing file access and reading and writing data.

## Create file and data handling utility classes

To use your TTS class, you'll need to manage routine tasks of reading and writing data.
For example, you'll want to make sure your input file exists, isn't empty, and can be read.
Also, your project will build your output in a temporary folder using a system-supplied temporary file.
These and other kinds of basic file and data management are handled by your project utility classes.

Create two utility files named FileUtility.java and DataUtility.java in 'src/main/java/ttsworker/utility' and add the content below in the folded Utility Sources.

<details>

<summary>
Utility Sources
</summary>

<Tabs groupId="utiltysources" queryString>
  <TabItem value="fileutilityjava" label="FileUtility.java">

<br />
Hover your cursor over the code block to reveal the copy-code option.
<br />

<!--SNIPSTART audiobook-project-java-file-utility-class-->
[src/main/java/ttsworker/utility/FileUtility.java](https://github.com/temporalio/build-audiobook-java/blob/main/src/main/java/ttsworker/utility/FileUtility.java)
```java
package ttspackage;

import java.io.IOException;

import java.nio.file.Files;
import java.nio.file.InvalidPathException;
import java.nio.file.LinkOption;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;

import java.util.Optional;

import org.apache.commons.io.FilenameUtils;

public class FileUtility {

    /**
     * Validate the input file path as a readable text file.
     *
     * - Creates a canonical path, bypassing symbolic links and file system shortcut symbols.
     * - Checks for `.txt` file extension.
     * - Checks that the file exists and is readable.
     * - Checks that the file is not empty.
     *
     * @param inputPath A String pointing to a text input file.
     * @return An `Optional<Path>` with the validated path, otherwise empty
     */
    public static Optional<Path> validateInputFile(String inputPath) {
        Path filePath;

        if (inputPath == null || inputPath.isEmpty()) {
            return Optional.empty();
        }

        // Resolve ~ and symbolic links if used
        try {
            if (inputPath.startsWith("~")) {
                String home = System.getProperty("user.home");
                inputPath = home + inputPath.substring(1);
            }

            filePath = Paths.get(inputPath)
            .toAbsolutePath().normalize()
            .toRealPath(LinkOption.NOFOLLOW_LINKS);

        } catch (InvalidPathException | IOException e) {
            return Optional.empty();
        }

        // Ensure this is a 'txt' file, exists, and can be read
        if (!inputPath.endsWith(".txt") ||
            !Files.exists(filePath) ||
            !Files.isReadable(filePath)) {
            return Optional.empty();
        }

        // Don't process empty files
        try {
            if (Files.size(filePath) == 0) {
                return Optional.empty();
            }
        } catch (IOException e) {
            return Optional.empty();
        }

        return Optional.of(filePath);
    }

    /**
     * Fetch the content of a text file.
     *
     * - Reads and returns the file contents as a `String`.
     *
     * @param inputPath A `Path` pointing to a text input file.
     * @return An `Optional<String>` with the file contents, otherwise empty.
     */
    public static Optional<String> fetchFileContent(Path inputPath) {
        try {
            String content = Files.readString(inputPath);
            return Optional.of(content);
        } catch (IOException e) {
            return Optional.empty();
        }
    }

    /**
     * Create a temporary file
     *
     * - Uses the System's default temporary-file directory.
     *
     * @return If successful, an `Optional<Path>`, otherwise an empty `Optional`.
     */
    public static Optional<Path> createTemporaryFile() {
        try {
            Path tempFile = Files.createTempFile(null, null);
            return Optional.of(tempFile);
        } catch (IOException e) {
            e.printStackTrace(); // Log the exception if needed
            return Optional.empty();
        }
    }

    /**
     * Replace a `Path` extension with a new extension
     *
     * - Assumes a pre-normalized path.
     *
     * @param inputPath The source file path.
     * @param newExtension The new extension to use.
     * @return An `Optional<Path>` pointing to the updated file, otherwise empty.
     */
    public static Optional<Path> replaceExtension(Path inputPath, String newExtension) {
        try {
            // Get the parent directory
            Path parentDir = inputPath.getParent();

            // Extract the file name without extension
            String baseName = FilenameUtils.getBaseName(inputPath.toString());

            // Create the new file name with the new extension
            String newFileName = baseName + newExtension;

            // Create the new path
            Path newPath = parentDir.resolve(newFileName);
            return Optional.of(newPath);
        } catch (InvalidPathException e) {
            return Optional.empty();
        }
    }

    /**
     * Returns a unique file name by appending a numeric suffix if the proposed path already exists.
     *
     * @param proposedPath The proposed file path as a Path object.
     * @param extension The file extension to use.
     * @return An Optional containing the unique Path if successful, otherwise an empty Optional.
     */
    public static Optional<Path> findUniqueName(Path proposedPath, String extension) {
        if (proposedPath == null || extension == null) {
            return Optional.empty();
        }

        try {
            int suffixCounter = 1;
            String baseName = FilenameUtils.getBaseName(proposedPath.toString());
            Path parentDir = proposedPath.getParent();
            Path newPath = parentDir.resolve(Paths.get(baseName + extension));

            while (Files.exists(newPath)) {
                String newFileName = baseName + "-" + suffixCounter + extension;
                newPath = parentDir.resolve(newFileName);
                suffixCounter += 1;
            }

            return Optional.of(newPath);
        } catch (Exception e) {
            return Optional.empty();
        }
    }

    /**
     * Move a file from the source path to the destination path.
     *
     * @param source the `Path` of the file to be moved.
     * @param destination the `Path` where the file should be moved to.
     * @throws IOException if an error occurs while moving the file.
     */
    public static void moveFile(Path source, Path destination) throws IOException {
        Files.move(source, destination, StandardCopyOption.REPLACE_EXISTING);
    }

}
```
<!--SNIPEND-->

  </TabItem>
  <TabItem value="datautilityjava" label="DataUtility.java">

<br />
Hover your cursor over the code block to reveal the copy-code option.
<br />

<!--SNIPSTART audiobook-project-java-data-utility-class-->
[src/main/java/ttsworker/utility/DataUtility.java](https://github.com/temporalio/build-audiobook-java/blob/main/src/main/java/ttsworker/utility/DataUtility.java)
```java
package ttspackage;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.StringJoiner;

/**
 * Utility class for chunking and appending data.
 */
public class DataUtility {
    /**
     * The maximum number of tokens allowed in a single text chunk for OpenAI text-to-speech processing.
     *
     * This constant defines the upper limit on the number of tokens that a single chunk of text can contain.
     * This relatively low value reduces the size of the returned audio data.
     */
    private static final int MAX_TOKENS = 512;

    /**
     * The average number of tokens per word used for estimating the size of text chunks.
     *
     * This constant provides an estimate of the average number of tokens per word in the text.
     * This approximates the number of tokens in a given text chunk, helping to split the text efficiently
     * without exceeding the token limit defined by {@code MAX_TOKENS}.
     */
    private static final float AVERAGE_TOKENS_PER_WORD = 1.33f;

    /**
     * Splits the given text into chunks, each chunk not exceeding the max token limit.
     *
     * - Uses an average token per word estimate to split text appropriately.
     * - Ensures that no chunk exceeds the specified max tokens limit.
     *
     * @param text The text to be split into chunks.
     * @return A list of text chunks.
     */
    public static List<String> splitText(String text) {
        List<String> chunks = new ArrayList<>();
        String[] words = text.split("\\s+");
        StringJoiner chunk = new StringJoiner(" ");

        for (String word : words) {
            if ((chunk.length() + word.length()) * AVERAGE_TOKENS_PER_WORD <= MAX_TOKENS) {
                chunk.add(word);
            } else {
                chunks.add(chunk.toString());
                chunk = new StringJoiner(" ");
                chunk.add(word);
            }
        }

        if (chunk.length() > 0) {
            chunks.add(chunk.toString());
        }

        return chunks;
    }

    /**
     * Appends the given data to the specified file.
     *
     * - Uses Path and Files classes for file handling.
     * - Ensures that data is appended to the file.
     *
     * @param data The data to append to the file.
     * @param filePath The path of the file to append to.
     * @throws IOException If an I/O error occurs.
     */
    public static void appendToFile(byte[] data, Path filePath) throws IOException {
        Files.write(filePath, data, java.nio.file.StandardOpenOption.CREATE, java.nio.file.StandardOpenOption.APPEND);
    }
}
```
<!--SNIPEND-->

  </TabItem>
</Tabs>

</details>

The two utility classes have different responsibilities. 

- `FileUtility` manages file-system specific tasks. It can:
  - Check if a file exists and can be read
  - Fetch a file's contents
  - Create a temporary system file to store intermediate results
  - Work with file extensions so the input file and the output file share the same base name, such as mytext.txt and mytext.mp3
  - Apply name versioning so you don't overwrite files when you move them
  - Move files so you can take the temporary file and move it next to the input file 
- `DataUtility` handles task-specific chores:
  - It breaks down a source string into a list of string chunks of smaller size 
  - It knows how to append binary data to an output file

Each of these methods plays into the cycle of processing the text into audio.
Here's an overview of what that process looks like:

![Read a text file, break it into chunks, send each chunk to OpenAI to be processed into audio, and append each result to the output file](images/process.png) 

The routines in the classes you just created help you read in a text file, divide it into chunks, send them to OpenAI, and append the audio data results to a file.

As a rule-of-thumb, a typical English word uses 1.33 OpenAI tokens, which is why your code defines that constant.
When working with other languages, you'll want to adjust that value.
Tokens quantify the data processed by OpenAI requests.
All OpenAI endpoints have token limits.
The `DataUtility` class's `splitText` method creates chunks with approximately 512 token for each API request.
Although the OpenAI token limit is higher than this, a conservative approach helps reduce risk:

```java
private static final float AVERAGE_TOKENS_PER_WORD = 1.33f;

public static List<String> splitText(String text) {
    List<String> chunks = new ArrayList<>();
    String[] words = text.split("\\s+");
    StringJoiner chunk = new StringJoiner(" ");

    for (String word : words) {
        if ((chunk.length() + word.length()) * AVERAGE_TOKENS_PER_WORD <= MAX_TOKENS) {
            chunk.add(word);
        } else {
            chunks.add(chunk.toString());
            chunk = new StringJoiner(" ");
            chunk.add(word);
        }
    }

    if (chunk.length() > 0) {
        chunks.add(chunk.toString());
    }

    return chunks;
}
```

Although you haven't yet built the actual flow, all the pieces that power your business logic are in place and ready to be used.
Before you create that flow, you'll need to build two small data classes for your input payload and your process status.
You'll start with the payload.

## Create your input payload data type

Your "payload" for this project is the path to a text file.
This simple datatype is used to start your conversion tasks. 
Create InputPayload.java in 'src/main/java/ttsworker/model' and add the following contents:

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


// Single-page tutorial: Create audiobooks from text with OpenAI and Java.

import React from "react";
import Link from "@docusaurus/Link";
import Layout from "@theme/Layout";
import CodeBlock from "@theme/CodeBlock";
import Admonition from "@theme/Admonition";
import NotifyBanner from "@site/src/components/hub/NotifyBanner/NotifyBanner";
import PathBreadcrumb from "@site/src/components/hub/PathBreadcrumb/PathBreadcrumb";
import DevEnvironmentToc from "@site/src/components/DevEnvironment/Toc";
import MetaChips from "@site/src/components/DevEnvironment/MetaChips";
import styles from "@site/src/components/DevEnvironment/styles.module.css";

const TOC_ITEMS = [
  { id: "introduction", label: "Introduction" },
  { id: "prerequisites", label: "Prerequisites" },
  { id: "create-project", label: "Create your Java project structure" },
  { id: "openai-code", label: "Create your OpenAI conversion code" },
  { id: "workflow", label: "Define your Workflow" },
  { id: "worker", label: "Create your Worker" },
  { id: "run-worker", label: "Run the Worker" },
  { id: "submit-jobs", label: "Submit narration jobs" },
  { id: "conclusion", label: "Conclusion" },
];

const IMG_BASE = "/img/tutorials/java/audiobook";

const MKDIR_CMD = `mkdir -p TTSWorker/src/main/java/ttsworker`;

const DIR_STRUCTURE = `TTSWorker
└── src
    └── main
        └── java
            └── ttsworker`;

const BUILD_GRADLE = `group 'ttspackage'; version '0.0.1'
repositories { mavenCentral() }
apply plugin: 'java'
sourceSets.main.java.srcDirs 'src'

dependencies {
    implementation 'io.temporal:temporal-sdk:1.31.0'
    implementation 'org.slf4j:slf4j-nop:2.0.17' // logging suppression
    implementation 'commons-io:commons-io:2.20.0'
    implementation 'com.squareup.okhttp3:okhttp:5.2.0'
    implementation 'org.json:json:20250517'
}

// Run the App
task run(type: JavaExec) {
    classpath = sourceSets.main.runtimeClasspath
    mainClass = 'ttspackage.TTSWorkerApp'
    standardOutput = System.out
}`;

const TTS_ACTIVITIES_INTERFACE = `package ttspackage;

import io.temporal.activity.ActivityInterface;
import java.nio.file.Path;
import java.util.List;

@ActivityInterface
public interface TTSActivities {
    public List<String> readFile(String inputPath);
    public Path createTemporaryFile();
    public void process(String chunk, Path outputPath);
    public String moveOutputFileToPlace(Path tempPath, String inputPath);
}`;

const TTS_ACTIVITIES_IMPL = `package ttspackage;

import io.temporal.activity.ActivityInterface;
import io.temporal.failure.ApplicationFailure;
import java.io.*;
import java.nio.file.*;
import java.util.*;
import java.util.List;
import java.util.logging.Logger;
import okhttp3.*;
import org.apache.commons.io.FilenameUtils;
import org.json.JSONObject;

public class TTSActivitiesImpl implements TTSActivities {
    private String bearerToken = null;

    TTSActivitiesImpl(String bearerToken) {
        this.bearerToken = bearerToken;
    }

    ApplicationFailure fail(String reason, String issue) {
        return ApplicationFailure.newFailure(reason, issue);
    }

    @Override
    public List<String> readFile(String inputPath) {
        Path canonicalPath;

        try {

            if (inputPath == null || inputPath.isEmpty() || !inputPath.endsWith(".txt")) {
                throw fail("Invalid path", "MALFORMED_INPUT");
            }

            if (inputPath.startsWith("~")) {
                String home = System.getProperty("user.home");
                inputPath = home + inputPath.substring(1);
            }

            canonicalPath = Paths.get(inputPath)
                .toAbsolutePath().normalize()
                .toRealPath(LinkOption.NOFOLLOW_LINKS);

            if (!Files.exists(canonicalPath) ||
                !Files.isReadable(canonicalPath) ||
                Files.size(canonicalPath) == 0) {
                throw fail("Invalid path", "MALFORMED_INPUT");
            }

        } catch (InvalidPathException | IOException e) {
            throw fail("Invalid path", "MALFORMED_INPUT");
        }

        String content;
        try {
            content = Files.readString(canonicalPath).trim();
        } catch (IOException e) {
            throw fail("Invalid content", "MISSING_CONTENT");
        }

        int MAX_TOKENS = 512;
        float AVERAGE_TOKENS_PER_WORD = 1.33f;

        List<String> chunks = new ArrayList<>();
        String[] words = content.split("\\\\s+");
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

    @Override
    public Path createTemporaryFile() {
        try {
            Path tempFile = Files.createTempFile(null, null);
            return tempFile;
        } catch (IOException | IllegalArgumentException | SecurityException e) {
            fail("Unable to create temporary work file", "FILE_ERROR");
        }
        return null;
    }

    byte[] textToSpeech(String text) throws IOException {
        String apiEndpoint = "https://api.openai.com/v1/audio/speech";

        OkHttpClient client = new OkHttpClient();

        JSONObject json = new JSONObject();
        json.put("model", "tts-1");
        json.put("input", text);
        json.put("voice", "nova"); // see https://platform.openai.com/docs/guides/text-to-speech/voice-options
        json.put("response_format", "mp3");

        MediaType mediaType = MediaType.get("application/json; charset=utf-8");
        RequestBody body = RequestBody.create(json.toString(), mediaType);

        Request request = new Request.Builder()
            .url(apiEndpoint)
            .post(body)
            .addHeader("Authorization", "Bearer " + bearerToken)
            .build();

        try (Response response = client.newCall(request).execute()) {
            if (!response.isSuccessful()) {
                throw new IOException("Unexpected code " + response);
            }
            return response.body().bytes();
        }
    }

    @Override
    public void process(String chunk, Path outputPath) {
        byte[] audio;

        try {
            audio = textToSpeech(chunk);
        } catch (IOException e) {
            throw new RuntimeException(e);
        }

        try {
            Files.write(outputPath, audio,
                            java.nio.file.StandardOpenOption.CREATE,
                            java.nio.file.StandardOpenOption.APPEND);
        } catch (IOException e) {
            throw fail("Unable to write to output file", "FILE_ERROR");
        }
    }

    @Override
    public String moveOutputFileToPlace(Path tempPath, String inputPath) {
        Path newPath = null;
        String extension = ".mp3";
        try {
            Path canonicalPath = Paths.get(inputPath)
                .toAbsolutePath().normalize()
                .toRealPath(LinkOption.NOFOLLOW_LINKS);
            String baseName = FilenameUtils.getBaseName(canonicalPath.toString());
            Path parentDir = canonicalPath.getParent();
            newPath = parentDir.resolve(Paths.get(baseName + extension));
            int suffixCounter = 1;
            while (Files.exists(newPath)) {
                String newFileName = baseName + "-" + suffixCounter + extension;
                newPath = parentDir.resolve(newFileName);
                suffixCounter += 1;
            }
            Files.move(tempPath, newPath, StandardCopyOption.REPLACE_EXISTING);
        } catch (InvalidPathException | IOException e) {
            throw fail("Unable to move output file to destination", "FILE_ERROR");
        }
        return newPath.toString();
    }
}`;

const CHUNK_LOGIC = `// ...
        int MAX_TOKENS = 512;
        float AVERAGE_TOKENS_PER_WORD = 1.33f;

        List<String> chunks = new ArrayList<>();
        String[] words = content.split("\\\\s+");
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

        return chunks;`;

const CREATE_TEMP_FILE = `// ...
    public Path createTemporaryFile() {
        try {
            Path tempFile = Files.createTempFile(null, null);
            return tempFile;
        } catch (IOException | IllegalArgumentException | SecurityException e) {
            fail("Unable to create temporary work file", "FILE_ERROR");
        }
        return null;
    }`;

const PROCESS_METHOD = `// ...
    public void process(String chunk, Path outputPath) {
        byte[] audio;

        try {
            audio = textToSpeech(chunk);
        } catch (IOException e) {
            throw new RuntimeException(e);
        }

        try {
            Files.write(outputPath, audio,
                            java.nio.file.StandardOpenOption.CREATE,
                            java.nio.file.StandardOpenOption.APPEND);
        } catch (IOException e) {
            throw fail("Unable to write to output file", "FILE_ERROR");
        }
    }`;

const TEXT_TO_SPEECH = `// ...
    byte[] textToSpeech(String text) throws IOException {
        String apiEndpoint = "https://api.openai.com/v1/audio/speech";

        OkHttpClient client = new OkHttpClient();

        JSONObject json = new JSONObject();
        json.put("model", "tts-1");
        json.put("input", text);
        json.put("voice", "nova"); // see https://platform.openai.com/docs/guides/text-to-speech/voice-options
        json.put("response_format", "mp3");

        MediaType mediaType = MediaType.get("application/json; charset=utf-8");
        RequestBody body = RequestBody.create(json.toString(), mediaType);

        Request request = new Request.Builder()
            .url(apiEndpoint)
            .post(body)
            .addHeader("Authorization", "Bearer " + bearerToken)
            .build();

        try (Response response = client.newCall(request).execute()) {
            if (!response.isSuccessful()) {
                throw new IOException("Unexpected code " + response);
            }
            return response.body().bytes();
        }
    }`;

const MOVE_OUTPUT = `// ...
    public String moveOutputFileToPlace(Path tempPath, String inputPath) {
        Path newPath = null;
        String extension = ".mp3";
        try {
            Path canonicalPath = Paths.get(inputPath)
                .toAbsolutePath().normalize()
                .toRealPath(LinkOption.NOFOLLOW_LINKS);
            String baseName = FilenameUtils.getBaseName(canonicalPath.toString());
            Path parentDir = canonicalPath.getParent();
            newPath = parentDir.resolve(Paths.get(baseName + extension));
            int suffixCounter = 1;
            while (Files.exists(newPath)) {
                String newFileName = baseName + "-" + suffixCounter + extension;
                newPath = parentDir.resolve(newFileName);
                suffixCounter += 1;
            }
            Files.move(tempPath, newPath, StandardCopyOption.REPLACE_EXISTING);
        } catch (InvalidPathException | IOException e) {
            throw fail("Unable to move output file to destination", "FILE_ERROR");
        }
        return newPath.toString();
    }`;

const WORKFLOW_INTERFACE = `package ttspackage;

import io.temporal.workflow.QueryMethod;
import io.temporal.workflow.WorkflowInterface;
import io.temporal.workflow.WorkflowMethod;

@WorkflowInterface
public interface TTSWorkflow {
    @WorkflowMethod
    public String startWorkflow(String filePathString);

    @QueryMethod
    public String fetchMessage();
}`;

const WORKFLOW_IMPL = `package ttspackage;

import io.temporal.activity.ActivityOptions;
import io.temporal.common.RetryOptions;
import io.temporal.client.WorkflowStub;
import io.temporal.workflow.*;
import java.io.IOException;
import java.nio.file.Path;
import java.time.Duration;
import java.util.List;
import org.slf4j.Logger;

public class TTSWorkflowImpl implements TTSWorkflow {
    public TTSWorkflowImpl() { }

    private static final Logger logger = Workflow.getLogger(TTSWorkflowImpl.class);
    private String message = "Conversion request received";

    private ActivityOptions activityOptions = ActivityOptions.newBuilder().setScheduleToCloseTimeout(Duration.ofSeconds(120)).build();
    private TTSActivities encodingStub = Workflow.newActivityStub(TTSActivities.class, activityOptions);

    public String fetchMessage() {
        return message;
    }

    public String startWorkflow(String fileInputPath) {
        List<String> chunks = encodingStub.readFile(fileInputPath);
        int chunkCount = chunks.size();
        logger.info("File content has " + chunkCount + " chunk(s) to process.");

        Path tempOutputPath = encodingStub.createTemporaryFile();
        logger.info("Created temporary file for processing: " + tempOutputPath.toString());

        for (int index = 0; index < chunkCount; index += 1) {
            message = "Processing part " + (index + 1) + " of " + chunkCount;
            logger.info(message);
            encodingStub.process(chunks.get(index), tempOutputPath);
        }
        String outputPath = encodingStub.moveOutputFileToPlace(tempOutputPath, fileInputPath);
        message = "Processing of file is done " + outputPath;
        logger.info("Output file: " + outputPath);
        return outputPath;
    }
}`;

const WORKER_APP = `package ttspackage;

import io.temporal.client.WorkflowClient;
import io.temporal.serviceclient.WorkflowServiceStubs;
import io.temporal.worker.Worker;
import io.temporal.worker.WorkerFactory;
import java.util.logging.Logger;

public class TTSWorkerApp {
    public static String sharedTaskQueue = "tts-task-queue";
    private static final Logger logger = Logger.getLogger(TTSWorkerApp.class.getName());

    public static void main(String[] args) {
        String bearerToken = System.getenv("OPEN_AI_BEARER_TOKEN");
        if (bearerToken == null || bearerToken.isEmpty()) {
            logger.severe("Environment variable OPEN_AI_BEARER_TOKEN not found");
            System.exit(1);
        }
        bearerToken = bearerToken.trim();
        bearerToken = bearerToken.replaceAll("[\\\\P{Print}]", "");

        WorkflowServiceStubs service = WorkflowServiceStubs.newLocalServiceStubs();
        WorkflowClient client = WorkflowClient.newInstance(service);
        WorkerFactory factory = WorkerFactory.newInstance(client);
        Worker worker = factory.newWorker(sharedTaskQueue);
        worker.registerWorkflowImplementationTypes(TTSWorkflowImpl.class);
        worker.registerActivitiesImplementations(new TTSActivitiesImpl(bearerToken));
        factory.start();
    }
}`;

const FINAL_STRUCTURE = `TTSWorker
├── build.gradle
└── src
    └── main
        └── java
            └── ttsworker
                ├── TTSActivities.java
                ├── TTSActivitiesImpl.java
                ├── TTSWorkerApp.java
                ├── TTSWorkflow.java
                └── TTSWorkflowImpl.java`;

const START_DEV_SERVER = `temporal server start-dev \\
    --ui-port 8080 \\
    --db-filename /path/to/your/temporal.db`;

const EXECUTE_WORKFLOW = `temporal workflow execute \\
    --type TTSWorkflow \\
    --task-queue tts-task-queue \\
    --input '"/path/to/your/text-file.txt"' \\
    --workflow-id "your-workflow-id"`;

const EXECUTE_EXAMPLE = `temporal workflow execute \\
    --type TTSWorkflow \\
    --task-queue tts-task-queue \\
    --input '"~/Desktop/chapter-1.txt"' \\
    --workflow-id "chapter-1-tts"`;

const QUERY_CMD = `temporal workflow query \\
    --type fetchMessage \\
    --workflow-id "your-workflow-id"`;

const QUERY_OUTPUT = `% workflow query --type fetchMessage --workflow-id chapter-1
Query result:
  QueryResult  "Processing part 8 of 47"
%`;

const MPCK_OUTPUT = `$ mpck -v chapter-1.mp3

SUMMARY: chapter-1.mp3
    version                       MPEG v2.0
    layer                         3
    bitrate                       160000 bps
    samplerate                    24000 Hz
    frames                        23723
    time                          9:29.352
    unidentified                  0 b (0%)
    stereo                        yes
    size                          11120 KiB
    ID3V1                         no
    ID3V2                         no
    APEV1                         no
    APEV2                         no
    last frame
        offset                    11386560 b (0xadbec0)
        length                    480
    errors                        none
    result                        Ok`;

export default function AudiobookTutorial() {
  return (
    <Layout
      title="Create audiobooks from text with OpenAI and Java"
      description="Build audiobooks from text using OpenAI APIs and Temporal. Step-by-step guide for hassle-free MP3 creation with robust failure mitigation."
    >
      <div className="nd-hub-page">
        <div className={styles.heroBanner}>
          <img
            src="/img/sdk_banners/banner_java.png"
            alt="Temporal Java SDK"
            className={styles.heroBannerImg}
          />
        </div>

        <div className={styles.pageLayout}>
          <aside className={styles.pageSidebar}>
            <DevEnvironmentToc items={TOC_ITEMS} />
          </aside>

          <main className={styles.pageMain}>
            <div className={styles.breadcrumbWrap}>
              <PathBreadcrumb
                items={[
                  { label: "Learn Temporal", href: "/" },
                  { label: "Tutorials", href: "/tutorials" },
                  { label: "Java", href: "/tutorials/java" },
                  { label: "Create audiobooks with OpenAI" },
                ]}
              />
            </div>

            <h1 className={styles.title}>
              Create audiobooks from text with OpenAI and Java
            </h1>

            <MetaChips items={["~60 minutes", "Intermediate", "Java"]} />

            <p className={styles.intro}>
              Build a robust text-to-speech system with OpenAI APIs and
              Temporal's error mitigation. Forget about manually checking
              statuses or handling errors. Just focus on converting text while
              Temporal makes sure everything runs smoothly. When complete,
              you'll be able to reliably convert any plain text file into an
              audiobook.
            </p>

            <section className={styles.section} id="introduction">
              <h2 className={styles.sectionTitle}>Introduction</h2>
              <p>
                For many people, audiobooks are a staple of daily life.
                Imagine turning your daily commute, workout sessions, or
                household chores into opportunities to catch up on{" "}
                <em>all</em> your reading - not just books. You can grab text
                from emails, from the web, or even that report you need to
                "read" for work. With the rise of advanced text-to-speech
                (TTS) technology, it's not just possible, it's quick to build
                in Java with simple APIs.
              </p>
              <p>
                Companies like{" "}
                <a
                  href="https://openai.com/api/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  OpenAI
                </a>{" "}
                have revolutionized speech synthesis. They created voices that
                sound like humans and not androids and released affordable
                APIs. Using these large language models (LLMs), you can enjoy
                warm, nuanced narration.
              </p>
              <p>
                In this tutorial, you'll use LLM voices to transform any text
                into audiobooks. You'll build a robust text-to-speech system
                with OpenAI APIs and Temporal's error mitigation.
              </p>
            </section>

            <section className={styles.section} id="prerequisites">
              <h2 className={styles.sectionTitle}>Prerequisites</h2>
              <p>
                You can build the project by following this tutorial, or just
                grab the ready-to-go source from its{" "}
                <a
                  href="https://github.com/temporalio/build-audiobook-java"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  GitHub repo
                </a>
                . Here's what you need to get going:
              </p>
              <ol>
                <li>
                  <strong>A local Java development environment</strong>:
                  Follow{" "}
                  <Link to="/getting_started/java/dev_environment/">
                    "Set up a local development environment"
                  </Link>{" "}
                  so you're ready to build Temporal applications with Java.
                  Ensure a local Temporal Service is running and that you can
                  access the Temporal Web UI from port <code>8080</code>.
                </li>
                <li>
                  <strong>Basic understanding of the Temporal Java SDK</strong>:
                  Work through the{" "}
                  <Link to="/getting_started/java/hello_world_in_java/">
                    Hello World in Java
                  </Link>{" "}
                  tutorial. This covers the basics of getting a Temporal Java
                  SDK project up and running.
                </li>
                <li>
                  <strong>OpenAI API access</strong>: Sign up for your{" "}
                  <a
                    href="https://openai.com/api/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    OpenAI API developer account
                  </a>{" "}
                  and create a bearer token. You need this token to access
                  OpenAI services for text-to-speech conversion.
                </li>
              </ol>

              <Admonition type="info" title="Cautions">
                <p>
                  This tutorial is written to be run on a single system, with
                  a single Worker, using the local file system. This is a
                  tutorial project and its implementation is suited for
                  personal and hobbyist use. In production, you wouldn't read
                  or write from a single database file or system.
                </p>
                <p>
                  Durable execution refers to maintaining state and progress
                  even in the face of failures, crashes, or server outages.
                  For durable execution, you must be able to rebuild progress
                  state and store information somewhere more reliable. If you
                  expand on this project, consider an API-based Cloud storage
                  solution.
                </p>
                <p>
                  For single-host work, check out{" "}
                  <a
                    href="https://github.com/temporalio/samples-java/tree/main/core/src/main/java/io/temporal/samples/fileprocessing"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    this sample
                  </a>
                  , which shows how to pick up work off a shared Task Queue
                  to start a Workflow, and then use a host-specific Task
                  Queue for the following Activity tasks.
                </p>
              </Admonition>
            </section>

            <section className={styles.section} id="create-project">
              <h2 className={styles.sectionTitle}>
                Create your Java project structure
              </h2>
              <p>
                Set up your source code folder hierarchy with this directory
                creation command:
              </p>
              <CodeBlock language="bash">{MKDIR_CMD}</CodeBlock>
              <p>Your directory structure should now look like this:</p>
              <CodeBlock>{DIR_STRUCTURE}</CodeBlock>
              <p>
                You can check it with the Unix <code>tree</code> command. In
                your project root folder, create a <code>build.gradle</code>{" "}
                file and add the following contents. Feel free to swap in
                Maven if you prefer:
              </p>
              <CodeBlock language="groovy" title="build.gradle">
                {BUILD_GRADLE}
              </CodeBlock>
              <p>
                Your dependencies include Temporal's{" "}
                <a
                  href="https://github.com/temporalio/sdk-java"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Java SDK
                </a>
                , and a few basic libraries:
              </p>
              <ul>
                <li>
                  <strong>com.squareup.okhttp3</strong>: Basic HTTP client for
                  network requests
                </li>
                <li>
                  <strong>org.json:json</strong>: Parse and manipulate JSON
                  data
                </li>
                <li>
                  <strong>commons-io</strong>: Perform file tasks with common
                  input/output routines
                </li>
                <li>
                  <strong>slf4j-nop</strong>: Minimizes unnecessary log output
                </li>
                <li>
                  <strong>temporal-sdk</strong>: Provides support for building
                  Temporal applications in Java
                </li>
              </ul>
              <p>The run task starts your TTS application.</p>
            </section>

            <section className={styles.section} id="openai-code">
              <h2 className={styles.sectionTitle}>
                Create your OpenAI conversion code
              </h2>
              <p>
                Create an interface-implementation pair of files named{" "}
                <code>TTSActivities.java</code> and{" "}
                <code>TTSActivitiesImpl.java</code> in{" "}
                <code>src/main/java/ttsworker</code>. This class is
                responsible for the text-to-speech work in your project.
              </p>
              <CodeBlock
                language="java"
                title="src/main/java/ttsworker/TTSActivities.java"
              >
                {TTS_ACTIVITIES_INTERFACE}
              </CodeBlock>
              <CodeBlock
                language="java"
                title="src/main/java/ttsworker/TTSActivitiesImpl.java"
              >
                {TTS_ACTIVITIES_IMPL}
              </CodeBlock>
              <p>
                <a
                  href="https://docs.temporal.io/activities"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Activities
                </a>
                , like the <code>TTSActivities</code> class, handle
                potentially unreliable parts of your code, such as calling
                APIs or working with file systems. Temporal uses Activities for
                any action that is prone to failure, allowing them to be
                retried. Activities add check-in points for your application
                state in your{" "}
                <a
                  href="https://docs.temporal.io/workflows#event-history"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Event History
                </a>
                . When retried, an Activity picks up state from just before it
                was first called, so it's like the failed attempt never
                happened.
              </p>
              <p>
                The <code>TTSActivities</code> class handles text-to-speech
                operations with the following methods:
              </p>
              <ul>
                <li>
                  <code>readFile</code>: Reads from the specified{" "}
                  <code>fileInputPath</code> and returns the contents as a
                  chunked list of strings, for well-sized API calls.
                </li>
                <li>
                  <code>createTemporaryFile</code>: Creates a temporary file
                  for audio output in a designated folder that is typically
                  cleaned up on system reboots.
                </li>
                <li>
                  <code>process</code>: Sends a text chunk to OpenAI for
                  processing, retrieves the TTS audio segment, and appends it
                  to the output file.
                </li>
                <li>
                  <code>moveOutputFileToPlace</code>: Moves an audio file to a
                  safe, versioned location in the same folder as the original
                  text file.
                </li>
              </ul>
              <p>Here is how the Activities help the conversion process:</p>
              <p>
                <img
                  src={`${IMG_BASE}/highlevelprocess.png`}
                  alt="After reading a text file and dividing it into chunks, each chunk is sent to OpenAI to be converted to audio and the results appended to the output file"
                  className={styles.diagramImage}
                />
              </p>

              <h3>
                Prepare your text with <code>readFile</code>
              </h3>
              <p>
                The <code>readFile</code> Activity reads and processes text
                from a file. Before and during the read, it performs a series
                of safety checks. If it encounters any file system issues, it
                throws an application error.
              </p>
              <p>
                The following code appears at the end of the Activity. It
                splits the text into "chunks", each containing part of the
                source material:
              </p>
              <CodeBlock
                language="java"
                title="src/main/java/ttsworker/TTSActivitiesImpl.java"
              >
                {CHUNK_LOGIC}
              </CodeBlock>
              <p>
                A typical English word uses 1.33 OpenAI tokens, which is how
                this code defines the <code>AVERAGE_TOKENS_PER_WORD</code>{" "}
                constant. This code creates chunks with approximately 512
                tokens for each API request.
              </p>

              <h3>
                Build a temporary file with <code>createTemporaryFile</code>
              </h3>
              <p>
                The <code>createTemporaryFile</code> Activity requests that
                the system create a new temporary file. This file stores
                intermediate results so your work won't affect the main file
                system:
              </p>
              <CodeBlock
                language="java"
                title="src/main/java/ttsworker/TTSActivitiesImpl.java"
              >
                {CREATE_TEMP_FILE}
              </CodeBlock>

              <h3>
                Convert text to audio with <code>process</code>
              </h3>
              <p>
                The <code>process</code> Activity handles text-to-speech work.
                Each time it's called, it sends a chunk of text to the{" "}
                <code>textToSpeech</code> method and appends those results to
                your output file. Should the text-to-speech conversion
                request fail, Temporal can retry the request:
              </p>
              <CodeBlock
                language="java"
                title="src/main/java/ttsworker/TTSActivitiesImpl.java"
              >
                {PROCESS_METHOD}
              </CodeBlock>
              <p>
                The conversion code lives in its own method. It uses the
                bearer token, stored within the <code>TTSActivities</code>{" "}
                class. The <code>textToSpeech</code> method calls out to
                OpenAI to convert a <code>String</code> into a{" "}
                <code>byte[]</code> array. It creates the request body, and
                performs a POST operation to an OpenAI endpoint:
              </p>
              <CodeBlock
                language="java"
                title="src/main/java/ttsworker/TTSActivitiesImpl.java"
              >
                {TEXT_TO_SPEECH}
              </CodeBlock>
              <p>
                When creating the HTTP request body, customizable{" "}
                <a
                  href="https://platform.openai.com/docs/api-reference/audio/createSpeech"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  endpoint options
                </a>{" "}
                shape the way your audio gets built:
              </p>
              <ul>
                <li>
                  <strong>model</strong> (required): You'll use the basic
                  low-latency 'tts-1' model in this project.
                </li>
                <li>
                  <strong>input</strong> (required): The maximum length of
                  this string is set at 4096 characters.
                </li>
                <li>
                  <strong>voice</strong> (required): The 'nova' voice has a
                  high energy "lively tone".
                </li>
                <li>
                  <strong>response_format</strong>: You'll use the highly
                  portable mp3 output format.
                </li>
              </ul>

              <h3>Find a location for your output file</h3>
              <p>
                The <code>moveOutputFileToPlace</code> Activity handles this
                process by versioning the output path to prevent overwriting
                an existing file:
              </p>
              <CodeBlock
                language="java"
                title="src/main/java/ttsworker/TTSActivitiesImpl.java"
              >
                {MOVE_OUTPUT}
              </CodeBlock>
              <p>
                The code iterates through potential new paths, adding suffix
                counters (<code>-1</code>, <code>-2</code>, etc.) as needed to
                avoid path conflicts. Once found, it uses <code>File.move</code>{" "}
                to bring the file out of the temporary folder and into place.
              </p>
            </section>

            <section className={styles.section} id="workflow">
              <h2 className={styles.sectionTitle}>Define your Workflow</h2>
              <p>
                You've seen the pieces that perform the conversion work but
                you haven't tied the process together. In this section,
                you'll build a Temporal Workflow to process a text-to-speech
                conversion from start to finish.{" "}
                <a
                  href="https://docs.temporal.io/workflows"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Workflows
                </a>{" "}
                create the overall flow of your application's business
                process.
              </p>
              <p>
                Create an interface-implementation pair of files named{" "}
                <code>TTSWorkflow.java</code> and{" "}
                <code>TTSWorkflowImpl.java</code> in{" "}
                <code>src/main/java/ttsworker</code>:
              </p>
              <CodeBlock
                language="java"
                title="src/main/java/ttsworker/TTSWorkflow.java"
              >
                {WORKFLOW_INTERFACE}
              </CodeBlock>
              <CodeBlock
                language="java"
                title="src/main/java/ttsworker/TTSWorkflowImpl.java"
              >
                {WORKFLOW_IMPL}
              </CodeBlock>
              <p>
                The <code>TTSWorkflow</code> class defines a complete business
                logic flow, in this case transforming the text within a file
                pointed to by the input path parameter, into spoken audio.
                This code reads the source file, creates the temporary file,
                processes each chunk, and finally moves the output file into
                place. The function returns the file output path for the
                generated mp3 results.
              </p>
              <p>
                Workflows coordinate Activities, which are the methods you
                created in the previous section. You use Activities to make
                API requests, access the file system, invoke LLMs and other
                AI services, or perform other non-deterministic operations.
                Every Workflow{" "}
                <a
                  href="https://docs.temporal.io/workflows#deterministic-constraints"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  must be deterministic
                </a>{" "}
                so you perform all your non-deterministic work in Activities.
                This separation is also what makes Temporal a strong fit for
                AI applications: LLM calls, tool use, and agent steps are
                non-deterministic by nature, so you place them in Activities
                while the Workflow reliably orchestrates the sequence.
              </p>
              <p>
                This class creates <code>ActivityOptions</code>, which set
                the policies Temporal uses for retrying failed Activities.
                Then it builds the <code>encodingStub</code>, which allows
                your application to run Activities as they are managed by the
                Temporal system.
              </p>
              <ul>
                <li>
                  <strong>
                    <code>fetchMessage</code>
                  </strong>
                  : This is a Temporal Query method. Queries can "peek" at
                  running processes and fetch information about how that
                  work is proceeding. This method returns the status, stored
                  in the <code>message</code> instance variable.
                </li>
                <li>
                  <strong>
                    <code>startWorkflow</code>
                  </strong>
                  : Every Workflow has one entry point, annotated with{" "}
                  <code>@WorkflowMethod</code> in the class interface. It
                  defines a complete business logic flow.
                </li>
              </ul>
            </section>

            <section className={styles.section} id="worker">
              <h2 className={styles.sectionTitle}>Create your Worker</h2>
              <p>
                Add <code>TTSWorkerApp.java</code> in{" "}
                <code>src/main/java/ttsworker</code> with the following file
                contents:
              </p>
              <CodeBlock
                language="java"
                title="src/main/java/ttsworker/TTSWorkerApp.java"
              >
                {WORKER_APP}
              </CodeBlock>
              <p>
                Every Worker polls{" "}
                <a
                  href="https://docs.temporal.io/workers#task-queue"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Task Queues
                </a>{" "}
                to pick up Workflow and Activity Tasks. The Task Queue for
                this project is named <code>tts-task-queue</code>. You'll use
                this queue to submit conversion requests.
              </p>
              <p>A few more things about this code:</p>
              <ul>
                <li>
                  As a standalone application, this Worker has a{" "}
                  <code>main</code> method.
                </li>
                <li>
                  The app starts by checking for an OpenAI bearer token and
                  stores it as a static member of the{" "}
                  <code>TTSActivitiesImpl</code> class.
                </li>
                <li>
                  It builds a{" "}
                  <a
                    href="https://docs.temporal.io/develop/java/temporal-clients"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Client
                  </a>
                  , a class that can communicate with the Temporal service,
                  and passes it to a{" "}
                  <a
                    href="https://docs.temporal.io/develop/java/core-application#run-a-dev-worker"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    WorkerFactory
                  </a>
                  . The factory builds a Worker and the code runs the
                  factory, bringing the Worker online and ready to start
                  processing Tasks.
                </li>
              </ul>
              <p>Your complete project structure will now look like this:</p>
              <CodeBlock>{FINAL_STRUCTURE}</CodeBlock>
            </section>

            <section className={styles.section} id="run-worker">
              <h2 className={styles.sectionTitle}>Run the Worker</h2>
              <p>Follow these steps to get your Worker up and running.</p>

              <h3>Run the Development Server</h3>
              <p>
                Make sure the Temporal development server is running and
                using a persistent store. Interrupted work can be picked up
                and continued without repeating steps, even if you experience
                server interruptions:
              </p>
              <CodeBlock language="bash">{START_DEV_SERVER}</CodeBlock>
              <p>
                Once running, connect to the{" "}
                <a
                  href="http://localhost:8080/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Temporal Web UI
                </a>{" "}
                and verify that the server is working.
              </p>

              <h3>Instantiate Your Bearer Token</h3>
              <p>
                Create an environment variable called{" "}
                <code>OPEN_AI_BEARER_TOKEN</code> to configure your OpenAI
                credentials. If you set this value using a shell script, make
                sure to <code>source</code> the script so the variable
                carries over past the script execution.
              </p>

              <Admonition type="note" title="Your Bearer Token">
                <p>
                  When using your application, you must set your{" "}
                  <code>OPEN_AI_BEARER_TOKEN</code> environment variable in
                  the same shell before execution. The application checks for
                  the token and if it's not set, it will error.
                </p>
              </Admonition>

              <h3>Run the Worker application</h3>
              <ol>
                <li>
                  Build the Worker app:
                  <CodeBlock language="bash">gradle build</CodeBlock>
                </li>
                <li>
                  Start the app running:
                  <CodeBlock language="bash">gradle run</CodeBlock>
                </li>
              </ol>
              <p>
                If the Worker can't fetch a bearer token from the shell
                environment, it will fail loudly at launch. This early check
                prevents you from running jobs and waiting to find out that
                you forgot to set the bearer token.
              </p>
            </section>

            <section className={styles.section} id="submit-jobs">
              <h2 className={styles.sectionTitle}>Submit narration jobs</h2>
              <p>
                Use the Temporal CLI tool to build audio from text files. Open
                a new terminal window. You'll use the Workflow{" "}
                <code>execute</code> subcommand to watch the execution in real
                time from your command line:
              </p>
              <CodeBlock language="bash">{EXECUTE_WORKFLOW}</CodeBlock>
              <ul>
                <li>
                  <strong>type</strong>: The name of this text-to-speech
                  Workflow is <code>TTSWorkflow</code>.
                </li>
                <li>
                  <strong>task-queue</strong>: This Worker polls the
                  "tts-task-queue" Task Queue.
                </li>
                <li>
                  <strong>input</strong>: Pass a quoted JSON string with a{" "}
                  <code>/path/to/your/input/text-file</code>.
                </li>
                <li>
                  <strong>workflow-id</strong>: Set a descriptive name for
                  your Workflow Id.
                </li>
              </ul>
              <p>For example, you might run:</p>
              <CodeBlock language="bash">{EXECUTE_EXAMPLE}</CodeBlock>

              <h3>Find your output file</h3>
              <p>
                Your output is collected in a system-provided temporary file.
                Your generated MP3 audio is moved into the same folder as
                your input text file. It uses the same name replacing the{" "}
                <code>txt</code> extension with <code>mp3</code>. If an output
                file already exists, the project versions it to prevent name
                collisions.
              </p>
              <p>
                The <code>TTSWorkflow</code> returns a string, the{" "}
                <code>/path/to/your/output/audio-file</code>. Check the Web
                UI Input and Results section after the Workflow completes.
              </p>

              <Admonition type="tip" title="Cautions and notes">
                <ul>
                  <li>
                    Do not modify your input or output files while the
                    Workflow is running.
                  </li>
                  <li>
                    The Workflow fails if you don't pass a valid text file
                    named with a <code>txt</code> extension.
                  </li>
                </ul>
              </Admonition>

              <h3>Check your progress</h3>
              <p>
                This project includes a Query to check progress during long
                processes. Run it in a separate terminal window or tab:
              </p>
              <CodeBlock language="bash">{QUERY_CMD}</CodeBlock>
              <p>
                The Query returns a status reporting how many chunks have
                completed. For example:
              </p>
              <CodeBlock>{QUERY_OUTPUT}</CodeBlock>
              <p>This Workflow has completed about 17% of its work.</p>

              <h3>Validate your audio output</h3>
              <p>
                The open source{" "}
                <a
                  href="https://github.com/Sjord/checkmate"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  checkmate
                </a>{" "}
                app validates MP3 files for errors.
              </p>
              <CodeBlock>{MPCK_OUTPUT}</CodeBlock>
              <p>
                With no errors found, your audio is ready to use. Fire up
                your favorite player and listen to your creation.
              </p>
            </section>

            <section className={styles.section} id="conclusion">
              <h2 className={styles.sectionTitle}>Conclusion</h2>
              <p>
                In this tutorial, you created an OpenAI solution that
                converts text files into audio. You used Temporal error
                mitigation to make sure that failed API requests could be
                retried and catastrophic events could be recovered. With just
                a few source files, you created a complete working solution,
                building a durable, reliable system that builds audiobooks
                from simple text files.
              </p>

              <Admonition type="info" title="What's next?">
                <p>
                  Now that you've completed this tutorial, check out some
                  other great <Link to="/tutorials/java/">Temporal Java projects</Link>{" "}
                  or learn more about Temporal by taking our{" "}
                  <Link to="/courses">free courses</Link>. We provide hands-on
                  projects for supported SDK languages including Java, Go,
                  Python, TypeScript, and PHP.
                </p>
              </Admonition>
            </section>
          </main>
        </div>

        <NotifyBanner />
      </div>
    </Layout>
  );
}

// Canonical code lives at https://github.com/temporalio/build-audiobook-go.
// Update the *_GO constants here when the upstream repo changes.

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
  { id: "project-structure", label: "Create your Go project structure" },
  { id: "openai-code", label: "Create your OpenAI conversion code" },
  { id: "workflow", label: "Define your Workflow" },
  { id: "worker", label: "Create your Worker" },
  { id: "run-worker", label: "Run the Worker" },
  { id: "submit-jobs", label: "Submit narration jobs" },
  { id: "conclusion", label: "Conclusion" },
];

const IMG_BASE = "/img/tutorials/go/audiobook";

const DIR_TREE_INIT = `TTSWorker
└── worker`;

const GO_MOD_INIT_OUTPUT = `module audiobook/app

go 1.22.2`;

const GO_MOD_WITH_REQUIRES = `module audiobook/app

go 1.22.2

require (
    go.temporal.io/sdk v1.17.0
    github.com/stretchr/testify v1.8.0
)`;

const TTS_ACTIVITIES_GO = `package app

import (
\t"context"
\t"fmt"
\t"io"
\t"net/http"
\t"os"
\t"path/filepath"
\t"strings"
\t"sync"
\t"time"

\t"go.temporal.io/sdk/temporal"
)

type Activities struct {
\tBearerToken string
\tfileMutex   sync.Mutex
}

const (
\tapiEndpoint          = "https://api.openai.com/v1/audio/speech"
\tcontentType          = "application/json"
\trequestTimeout       = 30 * time.Second
\tmaxTokens            = 512
\taverageTokensPerWord = 1.33
\tfileExtension        = ".mp3"
)

func (a *Activities) ReadFile(ctx context.Context, inputPath string) ([]string, error) {
\tif inputPath == "" || !strings.HasSuffix(inputPath, ".txt") {
\t\treturn nil, temporal.NewApplicationError("Invalid path", "MALFORMED_INPUT", nil)
\t}

\tif strings.HasPrefix(inputPath, "~") {
\t\thome, err := os.UserHomeDir()
\t\tif err != nil {
\t\t\treturn nil, temporal.NewApplicationError("Unable to determine home directory", "HOME_DIR_ERROR", err)
\t\t}
\t\tinputPath = filepath.Join(home, inputPath[1:])
\t}

\tcanonicalPath, err := filepath.Abs(inputPath)
\tif err != nil {
\t\treturn nil, temporal.NewApplicationError("Invalid path", "MALFORMED_INPUT", err)
\t}

\tfileInfo, err := os.Stat(canonicalPath)
\tif err != nil || fileInfo.IsDir() || !fileInfo.Mode().IsRegular() {
\t\treturn nil, temporal.NewApplicationError("Invalid path", "MALFORMED_INPUT", err)
\t}

\tcontent, err := os.ReadFile(canonicalPath)
\tif err != nil {
\t\treturn nil, temporal.NewApplicationError("Invalid content", "MISSING_CONTENT", err)
\t}

\ttrimmedContent := strings.TrimSpace(string(content))
\twords := strings.Fields(trimmedContent)
\tchunks := []string{}
\tchunk := strings.Builder{}

\tfor _, word := range words {
\t\tif float64(chunk.Len()+len(word))*averageTokensPerWord <= maxTokens {
\t\t\tif chunk.Len() > 0 {
\t\t\t\tchunk.WriteString(" ")
\t\t\t}
\t\t\tchunk.WriteString(word)
\t\t} else {
\t\t\tchunks = append(chunks, chunk.String())
\t\t\tchunk.Reset()
\t\t\tchunk.WriteString(word)
\t\t}
\t}

\tif chunk.Len() > 0 {
\t\tchunks = append(chunks, chunk.String())
\t}

\treturn chunks, nil
}

func (a *Activities) CreateTemporaryFile(ctx context.Context) (string, error) {
\ttempFile, err := os.CreateTemp("", "*.tmp")
\tif err != nil {
\t\treturn "", temporal.NewApplicationError("Unable to create temporary work file", "FILE_ERROR", err)
\t}

\tif err := tempFile.Close(); err != nil {
\t\treturn "", temporal.NewApplicationError("Unable to close temporary work file", "FILE_ERROR", err)
\t}

\treturn tempFile.Name(), nil
}

func (a *Activities) Process(ctx context.Context, chunk, outputPath string) error {
\treqBody := fmt.Sprintf(\`{
        "model": "tts-1",
        "input": %q,
        "voice": "nova",
        "response_format": "mp3"
    }\`, chunk)

\tclient := &http.Client{
\t\tTimeout: requestTimeout,
\t}

\treq, err := http.NewRequestWithContext(ctx, "POST", apiEndpoint, strings.NewReader(reqBody))
\tif err != nil {
\t\treturn temporal.NewApplicationError("Failed to create request", "REQUEST_ERROR", err)
\t}

\treq.Header.Set("Authorization", "Bearer "+a.BearerToken)
\treq.Header.Set("Content-Type", contentType)

\tresp, err := client.Do(req)
\tif err != nil {
\t\treturn temporal.NewApplicationError("Failed to execute request", "REQUEST_ERROR", err)
\t}
\tdefer resp.Body.Close()

\tif resp.StatusCode != http.StatusOK {
\t\treturn temporal.NewApplicationError(fmt.Sprintf("Received Unexpected status code: %d", resp.StatusCode), "REQUEST_ERROR", nil)
\t}

\tif resp.Header.Get("Content-Type") != "audio/mpeg" {
\t\treturn temporal.NewApplicationError("Received unexpected content type", "RESPONSE_ERROR", nil)
\t}

\tbody, err := io.ReadAll(resp.Body)
\tif err != nil {
\t\treturn temporal.NewApplicationError("Failed to read response body", "RESPONSE_ERROR", err)
\t}

\tif len(body) == 0 {
\t\treturn temporal.NewApplicationError("Received empty response body", "RESPONSE_ERROR", nil)
\t}

\tfile, err := os.OpenFile(outputPath, os.O_APPEND|os.O_WRONLY, 0644)
\tif err != nil {
\t\treturn temporal.NewApplicationError("Unable to open file for appending", "FILE_ERROR", err)
\t}
\tdefer file.Close()

\t_, err = file.Write(body)
\tif err != nil {
\t\treturn temporal.NewApplicationError("Unable to write data to file", "FILE_ERROR", err)
\t}

\treturn nil
}

func (a *Activities) MoveOutputFileToPlace(ctx context.Context, tempPath, originalPath string) (string, error) {
\tbaseName := strings.TrimSuffix(filepath.Base(originalPath), filepath.Ext(originalPath))
\tparentDir := filepath.Dir(originalPath)
\tnewPath := filepath.Join(parentDir, baseName+fileExtension)

\ta.fileMutex.Lock()
\tdefer a.fileMutex.Unlock()

\tfor i := 1; ; i++ {
\t\tif _, err := os.Stat(newPath); os.IsNotExist(err) {
\t\t\tbreak
\t\t}
\t\tnewPath = filepath.Join(parentDir, fmt.Sprintf("%s-%d%s", baseName, i, fileExtension))
\t}

\ttempFile, err := os.Open(tempPath)
\tif err != nil {
\t\treturn "", temporal.NewApplicationError("Unable to open temporary file", "FILE_ERROR", err)
\t}
\tdefer tempFile.Close()

\tfileInfo, err := tempFile.Stat()
\tif err != nil {
\t\treturn "", temporal.NewApplicationError("Unable to get file info", "FILE_ERROR", err)
\t}

\terr = os.Rename(tempPath, newPath)
\tif err != nil {
\t\treturn "", temporal.NewApplicationError("Unable to move output file to destination", "FILE_ERROR", err)
\t}

\terr = os.Chmod(newPath, fileInfo.Mode())
\tif err != nil {
\t\treturn "", temporal.NewApplicationError("Unable to set file permissions", "FILE_ERROR", err)
\t}

\treturn newPath, nil
}`;

const READFILE_CHUNK_SNIPPET = `const (
    apiEndpoint          = "https://api.openai.com/v1/audio/speech"
    contentType          = "application/json"
    requestTimeout       = 30 * time.Second
    maxTokens            = 512
    averageTokensPerWord = 1.33
    fileExtension        = ".mp3"
)

...

trimmedContent := strings.TrimSpace(string(content))
words := strings.Fields(trimmedContent)
chunks := []string{}
chunk := strings.Builder{}

for _, word := range words {
    if float64(chunk.Len()+len(word))*averageTokensPerWord <= maxTokens {
        if chunk.Len() > 0 {
            chunk.WriteString(" ")
        }
        chunk.WriteString(word)
    } else {
        chunks = append(chunks, chunk.String())
        chunk.Reset()
        chunk.WriteString(word)
    }
}

if chunk.Len() > 0 {
    chunks = append(chunks, chunk.String())
}

return chunks, nil`;

const CREATE_TEMP_FILE_SNIPPET = `func (a *Activities) CreateTemporaryFile(ctx context.Context) (string, error) {
    tempFile, err := os.CreateTemp("", "*.tmp")
    if err != nil {
        return "", temporal.NewApplicationError("Unable to create temporary work file", "FILE_ERROR", err)
    }

    if err := tempFile.Close(); err != nil {
        return "", temporal.NewApplicationError("Unable to close temporary work file", "FILE_ERROR", err)
    }

    return tempFile.Name(), nil
}`;

const PROCESS_SNIPPET = `func (a *Activities) Process(ctx context.Context, chunk, outputPath string) error {
    reqBody := fmt.Sprintf(\`{
        "model": "tts-1",
        "input": %q,
        "voice": "nova",
        "response_format": "mp3"
    }\`, chunk)

    client := &http.Client{
        Timeout: requestTimeout,
    }

    req, err := http.NewRequestWithContext(ctx, "POST", apiEndpoint, strings.NewReader(reqBody))
    if err != nil {
        return temporal.NewApplicationError("Failed to create request", "REQUEST_ERROR", err)
    }

    req.Header.Set("Authorization", "Bearer "+a.BearerToken)
    req.Header.Set("Content-Type", contentType)

    resp, err := client.Do(req)
    if err != nil {
        return temporal.NewApplicationError("Failed to execute request", "REQUEST_ERROR", err)
    }
    defer resp.Body.Close()

    if resp.StatusCode != http.StatusOK {
        return temporal.NewApplicationError(fmt.Sprintf("Received Unexpected status code: %d", resp.StatusCode), "REQUEST_ERROR", nil)
    }

    if resp.Header.Get("Content-Type") != "audio/mpeg" {
        return temporal.NewApplicationError("Received unexpected content type", "RESPONSE_ERROR", nil)
    }

    body, err := io.ReadAll(resp.Body)
    if err != nil {
        return temporal.NewApplicationError("Failed to read response body", "RESPONSE_ERROR", err)
    }

    if len(body) == 0 {
        return temporal.NewApplicationError("Received empty response body", "RESPONSE_ERROR", nil)
    }

    file, err := os.OpenFile(outputPath, os.O_APPEND|os.O_WRONLY, 0644)
    if err != nil {
        return temporal.NewApplicationError("Unable to open file for appending", "FILE_ERROR", err)
    }
    defer file.Close()

    _, err = file.Write(body)
    if err != nil {
        return temporal.NewApplicationError("Unable to write data to file", "FILE_ERROR", err)
    }

    return nil
}`;

const MOVE_OUTPUT_SNIPPET = `func (a *Activities) MoveOutputFileToPlace(ctx context.Context, tempPath, originalPath string) (string, error) {
    baseName := strings.TrimSuffix(filepath.Base(originalPath), filepath.Ext(originalPath))
    parentDir := filepath.Dir(originalPath)
    newPath := filepath.Join(parentDir, baseName+fileExtension)

    a.fileMutex.Lock()
    defer a.fileMutex.Unlock()

    for i := 1; ; i++ {
        if _, err := os.Stat(newPath); os.IsNotExist(err) {
            break
        }
        newPath = filepath.Join(parentDir, fmt.Sprintf("%s-%d%s", baseName, i, fileExtension))
    }

    tempFile, err := os.Open(tempPath)
    if err != nil {
        return "", temporal.NewApplicationError("Unable to open temporary file", "FILE_ERROR", err)
    }
    defer tempFile.Close()

    fileInfo, err := tempFile.Stat()
    if err != nil {
        return "", temporal.NewApplicationError("Unable to get file info", "FILE_ERROR", err)
    }

    err = os.Rename(tempPath, newPath)
    if err != nil {
        return "", temporal.NewApplicationError("Unable to move output file to destination", "FILE_ERROR", err)
    }

    err = os.Chmod(newPath, fileInfo.Mode())
    if err != nil {
        return "", temporal.NewApplicationError("Unable to set file permissions", "FILE_ERROR", err)
    }

    return newPath, nil
}`;

const TTS_WORKFLOW_GO = `package app

import (
\t"fmt"
\t"time"

\t"go.temporal.io/sdk/workflow"
)

func TTSWorkflow(ctx workflow.Context, fileInputPath string) (string, error) {
\tlogger := workflow.GetLogger(ctx)
\tvar a *Activities
\tvar message = "Conversion request received"
\tqueryType := "fetchMessage"

\terr := workflow.SetQueryHandler(ctx, queryType, func() (string, error) {
\t\treturn message, nil
\t})

\tif err != nil {
\t\tmessage = "Failed to register query handler"
\t\treturn "", err // Return an empty string and the error
\t}

\tao := workflow.ActivityOptions{
\t\tStartToCloseTimeout: 120 * time.Second,
\t}
\tctx = workflow.WithActivityOptions(ctx, ao)

\tvar chunks []string
\t// This sample only works if all the activities are run on the same worker, if you have multiple workers they will need to use a sessions or per worker task queue.
\terr = workflow.ExecuteActivity(ctx, a.ReadFile, fileInputPath).Get(ctx, &chunks)
\tif err != nil {
\t\treturn "", fmt.Errorf("failed to read file: %w", err)
\t}

\tchunkCount := len(chunks)
\tlogger.Info("File content has %d chunk(s) to process.", chunkCount)

\tvar tempOutputPath string

\terr = workflow.ExecuteActivity(ctx, a.CreateTemporaryFile).Get(ctx, &tempOutputPath)
\tif err != nil {
\t\treturn "", fmt.Errorf("failed to create temporary file: %w", err)
\t}
\tlogger.Info("Created temporary file for processing: %s", tempOutputPath)

\tfor index := 0; index < chunkCount; index++ {
\t\tlogger.Info("Processing part %d of %d", index+1, chunkCount)
\t\tmessage = fmt.Sprintf("Processing part %d of %d", index+1, chunkCount)
\t\terr = workflow.ExecuteActivity(ctx, a.Process, chunks[index], tempOutputPath).Get(ctx, nil)
\t\tif err != nil {
\t\t\treturn "", fmt.Errorf("failed to process chunk %d: %w", index+1, err)
\t\t}
\t}

\tvar outputPath string
\terr = workflow.ExecuteActivity(ctx, a.MoveOutputFileToPlace, tempOutputPath, fileInputPath).Get(ctx, &outputPath)
\tif err != nil {
\t\treturn "", fmt.Errorf("failed to move output file: %w", err)
\t}

\tlogger.Info("Output file: %s", outputPath)
\treturn outputPath, nil
}`;

const WORKER_GO = `package main

import (
\t"audiobook/app"
\t"log"
\t"os"
\t"strings"

\t"go.temporal.io/sdk/client"
\t"go.temporal.io/sdk/worker"
)

const TaskQueue = "tts-task-queue"

func main() {
\tbearerToken := os.Getenv("OPEN_AI_BEARER_TOKEN")
\tif bearerToken == "" {
\t\tlog.Fatalln("Environment variable OPEN_AI_BEARER_TOKEN not found")
\t}

\tbearerToken = strings.TrimSpace(bearerToken)
\tbearerToken = strings.Map(func(r rune) rune {
\t\tif r >= 32 && r <= 126 { // Printable characters range
\t\t\treturn r
\t\t}
\t\treturn -1
\t}, bearerToken)

\tc, err := client.Dial(client.Options{})
\tif err != nil {
\t\tlog.Fatalln("unable to create Temporal client", err)
\t}
\tdefer c.Close()

\tw := worker.New(c, TaskQueue, worker.Options{})

\tw.RegisterWorkflow(app.TTSWorkflow)
\tw.RegisterActivity(&app.Activities{BearerToken: bearerToken})

\terr = w.Run(worker.InterruptCh())
\tif err != nil {
\t\tlog.Fatalln("unable to start Worker", err)
\t}
}`;

const PROJECT_TREE_FINAL = `.
├── TTSActivities.go
├── TTSWorkflow.go
├── go.mod
└── worker
    └── main.go`;

const TEMPORAL_SERVER_CMD = `temporal server start-dev \\
    --ui-port 8080 \\
    --db-filename /path/to/your/temporal.db`;

const WORKFLOW_EXECUTE_CMD = `temporal workflow execute \\
    --type TTSWorkflow \\
    --task-queue tts-task-queue \\
    --input '"/path/to/your/text-file.txt"' \\
    --workflow-id "your-workflow-id"`;

const WORKFLOW_EXECUTE_EXAMPLE = `temporal workflow execute \\
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

export default function AudiobookTutorialPage() {
  return (
    <Layout
      title="Create audiobooks from text with OpenAI and Go"
      description="Build your own audiobooks from text using OpenAI Web APIs and Temporal. Step-by-step guide for hassle-free MP3 creation with robust failure mitigation."
    >
      <div className="nd-hub-page">
        <div className={styles.heroBanner}>
          <img
            src="/img/sdk_banners/banner_go.png"
            alt="Temporal Go SDK"
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
                  { label: "Temporal University", href: "/" },
                  { label: "Tutorials", href: "/tutorials" },
                  { label: "Go", href: "/tutorials/go" },
                  { label: "Create audiobooks with OpenAI" },
                ]}
              />
            </div>

            <h1 className={styles.title}>
              Create audiobooks from text with OpenAI and Go
            </h1>

            <MetaChips items={["~60 minutes", "Beginner", "Go"]} />

            <section className={styles.section} id="introduction">
              <h2 className={styles.sectionTitle}>Introduction</h2>
              <p>
                For many people, audiobooks are a staple of daily life. Spoken
                content helps people pass time, learn new things, and stay
                entertained without tying themselves to a screen or a book.
                Imagine turning your daily commute, workout sessions, or
                household chores into opportunities to catch up on <em>all</em>{" "}
                your reading - not just books. You can grab text from emails,
                from the web, or even that report you need to "read" for
                work. With the rise of advanced text-to-speech (TTS)
                technology, it's not just possible, it's quick to build in Go
                with simple APIs.
              </p>
              <p>
                For years, text-to-speech solutions have supported the
                assistive community by transforming words on the page into
                accessible engagement. However, until recently, robotic voices
                and unnatural rhythms made TTS unappealing for casual
                listeners. If you didn't need TTS, you probably wouldn't have
                used TTS. Now, companies like{" "}
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
                warm, nuanced narration. So, wouldn't it be great to use this
                kind of tech to transform any text into an audiobook?
              </p>
              <p>
                In this tutorial, you'll use LLM voices to transform any text
                into audiobooks. You'll build a robust text-to-speech system
                with OpenAI APIs and Temporal Technology's error mitigation.
                Forget about manually checking statuses or handling errors.
                Just focus on converting text while Temporal makes sure
                everything runs smoothly. When complete, you'll be able to
                reliably convert any plain text file into an audiobook.
              </p>
              <p>
                Ready to transform your text into immersive audiobooks? Get
                started by checking that you have the necessary understanding,
                tools, and environment set up.
              </p>
            </section>

            <section className={styles.section} id="prerequisites">
              <h2 className={styles.sectionTitle}>Prerequisites</h2>
              <p>
                You can build the project by following this tutorial, or just
                grab the ready-to-go source from its{" "}
                <a
                  href="https://github.com/temporalio/build-audiobook-go"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  GitHub repo
                </a>
                . This repository has the full source code and can serve as a
                guide or a fallback if you encounter issues when working
                through this tutorial. If you want to play first and explore
                later, you can come back and read through the how-to and
                background. Here's what you need to get going:
              </p>
              <ol>
                <li>
                  <strong>A local Go development environment</strong>: Follow{" "}
                  <Link to="/getting_started/go/dev_environment/">
                    "Set up a local development environment"
                  </Link>{" "}
                  so you're ready to build Temporal applications with Go.
                  Ensure a local Temporal Service is running and that you can
                  access the Temporal Web UI from port <code>8080</code>.
                  These services are necessary for you to build and run this
                  project.
                </li>
                <li>
                  <strong>Basic understanding of the Temporal Go SDK</strong>:
                  Work through the{" "}
                  <Link to="/getting_started/go/hello_world_in_go/">
                    Hello World in Go
                  </Link>{" "}
                  tutorial. This covers the basics of getting a Temporal Go
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
                  OpenAI services for text-to-speech conversion in your
                  project.
                </li>
              </ol>
              <p>
                Once caught up with prerequisites, you can build out your Go
                project directory.
              </p>

              <Admonition type="info" title="Cautions">
                <p>
                  This tutorial is written to be run on a single system, with
                  a single Worker, using the local file system. This is a
                  tutorial project and its implementation is suited for
                  personal and hobbyist use. In production, you wouldn't read
                  or write from a single database file or system. This
                  approach isn't durable so you wouldn't develop durable
                  software with them.
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
                    href="https://github.com/temporalio/samples-go/tree/main/fileprocessing"
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

            <section className={styles.section} id="project-structure">
              <h2 className={styles.sectionTitle}>Create your Go project structure</h2>
              <ol>
                <li>
                  <p>
                    Set up your project directory. Set up your source code
                    folder hierarchy by issuing this directory creation
                    command:
                  </p>
                  <CodeBlock language="bash">mkdir -p TTSWorker/worker</CodeBlock>
                  <p>Your directory structure should now look like this:</p>
                  <CodeBlock>{DIR_TREE_INIT}</CodeBlock>
                </li>
                <li>
                  <p>Move to the root directory:</p>
                  <CodeBlock language="bash">cd TTSWorker</CodeBlock>
                </li>
                <li>
                  <p>
                    Create <code>go.mod</code> by entering:
                  </p>
                  <CodeBlock language="bash">go mod init audiobook/app</CodeBlock>
                  <p>The file contents are initialized to:</p>
                  <CodeBlock>{GO_MOD_INIT_OUTPUT}</CodeBlock>
                </li>
                <li>
                  <p>
                    Edit your new <code>go.mod</code> file to add two
                    requirements:
                  </p>
                  <CodeBlock language="go" title="go.mod">{GO_MOD_WITH_REQUIRES}</CodeBlock>
                  <p>Your dependencies include:</p>
                  <ul>
                    <li>
                      <strong>go.temporal.io/sdk v1.17.0</strong>: Temporal's
                      open source failure mitigation Go SDK.
                    </li>
                    <li>
                      <strong>github.com/stretchr/testify v1.8.0</strong>:
                      Write tests with assertions and mocks.
                    </li>
                  </ul>
                </li>
              </ol>
            </section>

            <section className={styles.section} id="openai-code">
              <h2 className={styles.sectionTitle}>Create your OpenAI conversion code</h2>
              <p>
                Create <code>TTSActivities.go</code> in your root folder and
                include the following file contents. This interface is
                responsible for the text-to-speech work in your project:
              </p>

              <details>
                <summary>TTSActivities Source</summary>
                <CodeBlock language="go" title="TTSActivities.go">
                  {TTS_ACTIVITIES_GO}
                </CodeBlock>
              </details>

              <p>
                Now that you've built the Activities file, you'll explore
                some of its functionality and how these pieces work together.
              </p>
              <p>
                <a
                  href="https://docs.temporal.io/activities"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Activities
                </a>{" "}
                handle potentially unreliable parts of your code, such as
                calling APIs or working with file systems. Temporal uses
                Activities for any action that is prone to failure, allowing
                them to be retried. Imagine that the network goes down or
                your service provider (OpenAI in this case) is temporarily
                doing maintenance. Temporal provides a Retry Policy to
                support "do-overs" for error mitigation. Activities add
                check-in points for your application state in your{" "}
                <a
                  href="https://docs.temporal.io/workflows#event-history"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Event History
                </a>
                . When retried, an Activity picks up state from just before
                it was first called, so it's like the failed attempt never
                happened.
              </p>
              <p>
                The <code>TTSActivities</code> interface handles
                text-to-speech operations with the following methods:
              </p>
              <ul>
                <li>
                  <strong>
                    <code>ReadFile</code>
                  </strong>
                  : Reads from the specified <code>fileInputPath</code> and
                  returns the contents as a chunked array of strings, for
                  well-sized API calls.
                </li>
                <li>
                  <strong>
                    <code>CreateTemporaryFile</code>
                  </strong>
                  : Creates a temporary file for audio output in a designated
                  folder that is typically cleaned up on system reboots.
                </li>
                <li>
                  <strong>
                    <code>Process</code>
                  </strong>
                  : Sends a text chunk to OpenAI for processing, retrieves
                  the TTS audio segment, and appends it to an output file.
                </li>
                <li>
                  <strong>
                    <code>MoveOutputFileToPlace</code>
                  </strong>
                  : Moves an audio file to a safe, versioned location in the
                  same folder as the original text file.
                </li>
              </ul>
              <p>Here is how the Activities help in the overall conversion process:</p>
              <p>
                <img
                  src={`${IMG_BASE}/highlevelprocess.png`}
                  alt="After reading a text file and dividing it into chunks, each chunk is sent to OpenAI to be converted to audio and the results appended to the output file"
                  className={styles.diagramImage}
                />
              </p>

              <h3>
                Prepare your text with <code>ReadFile</code>
              </h3>
              <p>
                The <code>ReadFile</code> Activity reads and processes text
                from a file. Before and during the read, it performs a series
                of safety checks, such as making sure the file exists and it's
                readable. If it encounters any file system issues, it returns
                an application error. A corrupt file system can't be
                reasonably retried.
              </p>
              <p>
                The <code>ReadFile</code> Activity reads and processes text
                from a file. It performs safety checks to ensure the file
                exists and is readable. If file system issues are
                encountered, it returns an error. Errors related to file
                system issues indicate fundamental issues that can't be
                resolved through retries.
              </p>
              <p>
                The following code appears at the end of the Activity. It
                splits the text into "chunks", each containing part of the
                source material:
              </p>
              <CodeBlock language="go">{READFILE_CHUNK_SNIPPET}</CodeBlock>
              <p>
                Tokens quantify the data processed by OpenAI requests and all
                OpenAI endpoints use token limits. This code creates chunks
                with approximately 512 tokens for each API request. Although
                the OpenAI token limit is higher than this, this code is
                conservative to reduce bandwidth for the returned audio
                bytes.
              </p>
              <p>
                As a rule-of-thumb, a typical English word uses 1.33 OpenAI
                tokens, which is how this code defines the{" "}
                <code>AVERAGE_TOKENS_PER_WORD</code> constant. When working
                with other languages, adjust that value to fit with typical
                word lengths.
              </p>
              <p>
                After building a method to process string data, you'll add
                code to build an output file in the next steps.
              </p>

              <h3>
                Build a temporary file to store output with{" "}
                <code>CreateTemporaryFile</code>
              </h3>
              <p>
                The <code>CreateTemporaryFile</code> Activity requests that
                the system create a new temporary file. This file stores
                intermediate results so your work won't affect the main file
                system:
              </p>
              <CodeBlock language="go">{CREATE_TEMP_FILE_SNIPPET}</CodeBlock>

              <h3>
                Convert text to audio with <code>Process</code>
              </h3>
              <p>
                The <code>Process</code> Activity handles text-to-speech
                work. Each time it's called, it sends a chunk of text to the
                OpenAI and appends those results to your output file. You
                call it with a <code>string</code> to process and the output
                destination. Should the text-to-speech conversion request
                fail, Temporal can retry the request:
              </p>
              <CodeBlock language="go">{PROCESS_SNIPPET}</CodeBlock>
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
                  low-latency 'tts-1' model in this project. Visit{" "}
                  <a
                    href="https://platform.openai.com/docs/models/tts"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    OpenAI TTS
                  </a>{" "}
                  to read about its available models, which include both
                  standard and high quality options.
                </li>
                <li>
                  <strong>input</strong> (required): The maximum length of
                  this string is set at 4096 characters.
                </li>
                <li>
                  <strong>voice</strong> (required): The 'nova' voice has a
                  high energy "lively tone". You can listen to samples of
                  other voices at the{" "}
                  <a
                    href="https://platform.openai.com/docs/guides/text-to-speech/voice-options"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    OpenAI Voice Options
                  </a>{" "}
                  page.
                </li>
                <li>
                  <strong>response_format</strong>: You'll use the highly
                  portable mp3 output format.
                </li>
              </ul>
              <p>
                You may want to set additional options by further tweaking
                the request body. An optional <strong>speed</strong>{" "}
                parameter (from 0.5 to 4.0, defaults to 1) lets you speed up
                or slow down the output so the results can be shorter to
                listen to or elongated for those with audio processing
                issues. To tune the results to a specific language so the
                model takes advantage of native inflections, set{" "}
                <strong>language</strong> to an{" "}
                <a
                  href="https://en.wikipedia.org/wiki/List_of_ISO_639_language_codes"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  ISO-639
                </a>{" "}
                code. OpenAI offers over fifty{" "}
                <a
                  href="https://platform.openai.com/docs/guides/text-to-speech/supported-languages"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  supported languages
                </a>
                .
              </p>
              <p>
                After fully processing your data, you'll need to move the
                complete audio file from the temporary folder.
              </p>

              <h3>Find a location for your output file</h3>
              <p>
                In this project, you'll move your output audio file to the
                same directory as your input text. The{" "}
                <code>MoveOutputFileToPlace</code> Activity handles this
                process by versioning the output path to prevent overwriting
                an existing file:
              </p>
              <CodeBlock language="go">{MOVE_OUTPUT_SNIPPET}</CodeBlock>
              <p>
                The code iterates through potential new paths, adding suffix
                counters (<code>-1</code>, <code>-2</code>, etc) as needed to
                avoid path conflicts. Once found, it uses <code>File.move</code>{" "}
                to bring the file out of the temporary folder and into place.
              </p>
              <p>
                This section talked about Activities, the individual and
                potentially unreliable processes that perform work that might
                fail. Next, you'll create a Workflow, which sets the overall
                business logic for your application.
              </p>
            </section>

            <section className={styles.section} id="workflow">
              <h2 className={styles.sectionTitle}>Define your Workflow with Temporal</h2>
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
                process. It's essentially a sequence of steps written in your
                programming language.
              </p>
              <p>
                <a
                  href="https://docs.temporal.io/workflows"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Workflows
                </a>{" "}
                coordinate{" "}
                <a
                  href="https://docs.temporal.io/activities"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Activities
                </a>
                , which are the methods you created in the previous section.
                You use Activities to make API requests, access the file
                system, invoke LLMs and other AI services, or perform other
                non-deterministic operations. In contrast, every Workflow{" "}
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
                Create <code>TTSWorkflow.go</code> in your root folder and
                add the following code. This is the complete business logic
                code for this application:
              </p>
              <CodeBlock language="go" title="TTSWorkflow.go">
                {TTS_WORKFLOW_GO}
              </CodeBlock>
              <p>
                The <code>TTSWorkflow</code> function defines a complete
                business logic flow, in this case transforming the text
                within a file pointed to by the <code>fileInputPath</code>{" "}
                parameter into spoken audio. As you see, this code reads the
                source file, creates the temporary file, processes each
                chunk, and finally moves the output file into place. The
                function returns the file output path for the generated mp3
                results.
              </p>
              <p>
                <code>ActivityOptions</code> set the policies Temporal uses
                for retrying failed Activities. This function uses these to
                build the Workflow context, which allows your application to
                run Activities as they are managed by the Temporal system.
                Temporal management (called "orchestration") enables the
                Temporal Service to track Workflow and Activity progress and
                state, and to manage Activities when they encounter errors.
              </p>
              <p>
                This progress is stored centrally on the Temporal Service, so
                it can resume if interrupted. That means you can always find
                ways to fix problems and keep going and reliably deliver your
                results. Temporal calls this Durable Execution. It allows
                your application to mitigate errors and keep going without
                repeating work you've already done. That makes your apps
                both reliable and efficient.
              </p>
              <p>
                A Query handler called <code>fetchMessage</code> returns the
                current <code>message</code> string. Some conversion tasks
                take a while to complete. Queries can "peek" at running
                processes and fetch information about how that work is
                proceeding. This handler returns the status stored in the{" "}
                <code>message</code> variable. This message is updated at
                each stage of the conversion process.
              </p>
              <p>
                With your Workflows and Activities in place, you can now
                write a{" "}
                <a
                  href="https://docs.temporal.io/workers#worker-program"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Worker application
                </a>
                . A{" "}
                <a
                  href="https://docs.temporal.io/workers"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Worker
                </a>{" "}
                hosts your Activities and Workflows and polls a Temporal
                Service-provided Task Queue looking for work to do.
              </p>
            </section>

            <section className={styles.section} id="worker">
              <h2 className={styles.sectionTitle}>Create your Worker</h2>
              <p>
                Add the following file contents to a new{" "}
                <code>worker/main.go</code> file:
              </p>
              <CodeBlock language="go" title="worker/main.go">
                {WORKER_GO}
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
                this queue to submit conversion requests. Normally you'd
                build a dedicated full stack solution that submits requests
                to the Temporal Service and retrieves the results when they're
                complete. For this project, you issue your request through
                the command-line.
              </p>
              <p>A few more things about this code:</p>
              <ul>
                <li>
                  As a standalone application, this Worker has a{" "}
                  <code>main</code> method.
                </li>
                <li>
                  The app starts by checking for an OpenAI bearer token and
                  stores it as a static variable in the <code>app</code>{" "}
                  package.
                </li>
                <li>
                  Next, it builds a{" "}
                  <a
                    href="https://docs.temporal.io/develop/go/temporal-clients"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Client
                  </a>
                  , a class that can communicate with the Temporal service.
                </li>
                <li>
                  It uses the client and the Task Queue to create a new
                  Worker, which registers the Workflow and Activities it can
                  manage.
                </li>
                <li>Finally, it runs the Worker, which starts polling for Tasks.</li>
              </ul>
              <p>Your complete project structure will now look like this:</p>
              <CodeBlock>{PROJECT_TREE_FINAL}</CodeBlock>
              <p>
                After creating this project, it's time to try it out. Start
                by running the Worker application.
              </p>
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
              <CodeBlock language="bash">{TEMPORAL_SERVER_CMD}</CodeBlock>
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

              <h3>Run the Worker application</h3>
              <p>
                Assuming you're running Bash, enter this at the command
                line. Substitute in your bearer token for{" "}
                <code>YOUR-BEARER-TOKEN</code>:
              </p>
              <CodeBlock language="bash">
                OPEN_AI_BEARER_TOKEN=YOUR-BEARER-TOKEN go run worker/main.go
              </CodeBlock>
              <p>
                Otherwise set the <code>OPEN_AI_BEARER_TOKEN</code> in your
                shell and run the app. Now that the Worker is running, you
                can submit jobs for text-to-speech processing.
              </p>

              <Admonition type="note" title="Your Bearer Token">
                <p>
                  The application checks for the{" "}
                  <code>OPEN_AI_BEARER_TOKEN</code> token environment
                  variable. If not set, the application will error.
                </p>
              </Admonition>
            </section>

            <section className={styles.section} id="submit-jobs">
              <h2 className={styles.sectionTitle}>Submit narration jobs</h2>
              <p>
                For this tutorial, use the Temporal CLI tool to build audio
                from text files. Open a new terminal window. You'll use the
                Workflow <code>execute</code> subcommand to watch the
                execution in real time from your command line:
              </p>
              <CodeBlock language="bash">{WORKFLOW_EXECUTE_CMD}</CodeBlock>
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
                  your Workflow Id. This makes it easier to track your
                  Workflow Execution in the Web UI. The identifier you set
                  doesn't affect the input text file or the output audio
                  file names.
                </li>
              </ul>
              <p>For example, you might run:</p>
              <CodeBlock language="bash">{WORKFLOW_EXECUTE_EXAMPLE}</CodeBlock>

              <h3>Find your output file</h3>
              <p>
                Your output is collected in a system-provided temporary
                file. After, your generated MP3 audio is moved into the same
                folder as your input text file. It uses the same name
                replacing the <code>txt</code> extension with <code>mp3</code>
                . If an output file already exists, the project versions it
                to prevent name collisions.
              </p>
              <p>
                The <code>TTSWorkflow</code> returns a string, the{" "}
                <code>/path/to/your/output/audio-file</code>. Check the Web
                UI Input and Results section after the Workflow completes.
                The results path is also displayed as part of the CLI's{" "}
                <code>workflow execute</code> command output and in the
                Worker logs.
              </p>

              <Admonition type="tip" title="Cautions and notes">
                <ul>
                  <li>Do not modify your input or output files while the Workflow is running.</li>
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
                retried and catastrophic events could be recovered. With
                just a few source files, you created a complete working
                solution, building a durable, reliable system that builds
                audiobooks from simple text files.
              </p>

              <Admonition type="info" title="What's next?">
                <p>
                  Now that you've completed this tutorial, check out some
                  other great{" "}
                  <Link to="/tutorials/go/">Temporal Go projects</Link> or
                  learn more about Temporal by taking our{" "}
                  <Link to="/courses/">free courses</Link>. We provide
                  hands-on projects for supported SDK languages including
                  Go, Java, Python, TypeScript, and PHP.
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

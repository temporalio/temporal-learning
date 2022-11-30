# Hello World: Java project template

This project can be used as a template to start building your own Temporal Workflow application.

Follow the [Build a "Hello World!" app from scratch tutorial](https://docs.temporal.io/docs/java/hello-world-tutorial) to learn more.

This project uses [Snipsync](https://github.com/temporalio/snipsync) comment wrappers to automatically keep code snippets up to date within our documentation.

## How to use the template

To use the template, either download it as a zip file or click "Use Template" to make a copy of it in your own Github account.

## Build the project

Either open the project in IntelliJ, which will automatically build it, or in the project's root directory run:

```
./gradlew build
```

## Run the Workflow

First, make sure the [Temporal server](https://docs.temporal.io/docs/server/quick-install) is running.

To start the Workflow, either run the InitiateHelloWorld class from IntelliJ or from the project root run:

```
./gradlew sayHello
```

To start the Worker, either run the HelloWorldWorker class from IntelliJ or from the project root run:

```
./gradlew startWorker
```

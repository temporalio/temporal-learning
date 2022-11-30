# Activities Dependency Injection

This sample shows how to [share dependencies](https://docs.temporal.io/typescript/activities#sharing-dependencies-in-activity-functions) between Activities: for example, when you need to initialize a database connection once and then pass it to multiple Activities.

[`src/worker.ts`](./src/worker.ts)

### Running this sample

1. Make sure Temporal Server is running locally (see the [quick install guide](https://docs.temporal.io/server/quick-install/)).
2. `npm install` to install dependencies.
3. `npm run start.watch` to start the Worker.
4. In another shell, `npm run workflow` to run the Workflow.

The Workflow should return:

```
Hello: Temporal
Hola: Temporal
```

using BookingSaga;
using Temporalio.Client;
using Temporalio.Worker;


var client = await TemporalClient.ConnectAsync(new("localhost:7233"));

// Run the Worker
async Task RunWorkerAsync()
{
    using var tokenSource = new CancellationTokenSource();
    Console.CancelKeyPress += (_, eventArgs) =>
    {
        tokenSource.Cancel();
        eventArgs.Cancel = true;
    };

    var activities = new Activities();

    using var worker = new TemporalWorker(
        client,
        new TemporalWorkerOptions("my-booking-queue")
            .AddAllActivities(typeof(Activities), activities)
            .AddWorkflow<BookingWorkflow>()
    );

    Console.WriteLine("Running worker");
    try
    {
        await worker.ExecuteAsync(tokenSource.Token);
    }
    catch (OperationCanceledException)
    {
        Console.WriteLine("Worker cancelled");
    }
}

// Run Workflow
async Task ExecuteWorkflowAsync()
{
    var workflowId = "my-workflow-id-" + Guid.NewGuid();
    var input = new BookVacationInput(
        BookUserId: "Temporal User",
        BookCarId: "Jeep",
        BookHotelId: "CitizenM",
        BookFlightId: "SQ333",
        Attempts: 5
    );

    var result = await client.ExecuteWorkflowAsync(
        (BookingWorkflow wf) => wf.RunAsync(input),
        new(id: workflowId, taskQueue: "my-booking-queue"));

    Console.WriteLine("Workflow result: {0}", result);
}

// Command-line arguments to decide which method to run (worker or workflow)
switch (args.ElementAtOrDefault(0))
{
    case "worker":
        await RunWorkerAsync();
        break;
    case "workflow":
        await ExecuteWorkflowAsync();
        break;
    default:
        throw new ArgumentException("Must pass 'worker' or 'workflow' as the first argument");
}

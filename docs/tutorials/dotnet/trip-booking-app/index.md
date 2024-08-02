---
id: build-trip-booking-app
sidebar_position: 4
keywords: [.NET, temporal, sdk, tutorial, saga, saga pattern, rollback, compensating actions]
tags: [.NET, SDK]
last_update:
  date: 2024-07-17
title: Build a trip booking application in .NET
description: Implement the Saga Pattern in .NET using Temporal.
image: /img/temporal-logo-twitter-card.png
---

# Build a Trip Booking Application in .NET

_Last updated on August 2nd, 2024_

## Introduction

When dealing with distributed systems, a failure in one service can lead to a domino effect, compromising the entire transaction. The Saga pattern offers a solution to this problem by allowing distributed transactions to be broken into smaller, manageable transactions, each with its own compensation logic in case of failure.

The Saga pattern is a design pattern that provides a mechanism to manage long-running transactions and ensure data consistency across multiple services. Instead of a single monolithic transaction, the Saga pattern breaks the transaction into smaller, manageable steps (Activities), each step is executed sequentially, and if a step fails, previous steps are undone with a compensating step.

Temporal orchestrates long-running transactions, automatically compensating for failures. The compensation, combined with the guarantee that the method will complete execution, makes this method a reliable, long-running transaction.

With this guide, you'll build a .NET application that uses Temporal to manage the booking process for cars, hotels, and flights. This approach ensures that even if one part of the booking fails, the system can gracefully handle the rollback of previous steps, maintaining data consistency.

When you're finished, you'll be able to handle complex distributed transactions with ease and reliability using Temporal.

## Prerequisites

Before you begin, make sure you have the following:


- Familiarity with asynchronous programming in C#
- Basic understanding of microservices and distributed systems
- .NET SDK installed on your machine

## Create the Booking Functions

You will start by creating the Activities for the booking process. These Activities form the core tasks your Workflow will perform, including interacting with external services and handling potential failures. Specifically, you'll create the booking Activities for cars, hotels, and flights. These Activities are used to interact with external services, but for this tutorial, you will not be making any actual service calls. Instead, you will stub these out and simulate failures by raising exceptions if a service is unavailable.

First, create a new file named `Activities.cs`. This file will contain the definitions of the Activities needed for the booking process.

### BookingActivities.cs

```csharp
namespace BookingSaga;

using Temporalio.Activities;

public class Activities
{
    public static readonly Activities Ref = new Activities();

    [Activity]
    public string BookCar(BookVacationInput input)
    {
        System.Console.WriteLine($"Booking car: {input.BookCarId}");
        return $"Booked car: {input.BookCarId}";
    }

    [Activity]
    public string BookHotel(BookVacationInput input)
    {
        System.Console.WriteLine($"Booking hotel: {input.BookHotelId}");
        return $"Booked hotel: {input.BookHotelId}";
    }

    [Activity]
    public string BookFlight(BookVacationInput input)
    {
        if (ActivityExecutionContext.Current.Info.Attempt < input.Attempts)
        {
            ActivityExecutionContext.Current.Heartbeat($"Invoking activity, attempt number {ActivityExecutionContext.Current.Info.Attempt}");
            Thread.Sleep(1000);
            throw new System.Exception("Service is down");
        }
        else if (ActivityExecutionContext.Current.Info.Attempt > 3)
        {
            throw new System.Exception("Too many retries, flight booking not possible at this time!");
        }

        System.Console.WriteLine($"Booking flight: {input.BookFlightId}");
        return $"Booking flight: {input.BookFlightId}";
    }

    [Activity]
    public string UndoBookCar(BookVacationInput input)
    {
        System.Console.WriteLine($"Undoing booking of car: {input.BookCarId}");
        return $"Undoing booking of car: {input.BookCarId}";
    }

    [Activity]
    public string UndoBookHotel(BookVacationInput input)
    {
        System.Console.WriteLine($"Undoing booking of hotel: {input.BookHotelId}");
        return $"Undoing booking of hotel: {input.BookHotelId}";
    }

    [Activity]
    public string UndoBookFlight(BookVacationInput input)
    {
        System.Console.WriteLine($"Undoing booking of flight: {input.BookFlightId}");
        return $"Undoing booking of flight: {input.BookFlightId}";
    }
}
```

## Define Shared Data Classes and Constants

Shared data classes and constants are used to pass data between Activities and Workflows. Common mistakes include using mutable data types such as lists or dictionaries, which can cause unexpected behavior.

Also, Task Queues are shared resources that can be used by multiple Workflows and Workers.

Create a new file named BookVacationInput.cs:

```csharp
namespace BookingSaga;

public record BookVacationInput(string BookUserId, string BookCarId, string BookHotelId, string BookFlightId, int Attempts);

```

## Create the Workflow
This Workflow coordinates the execution of Activities and handles compensations to maintain consistency in case of failure.

Create a new file named BookingWorkflow.cs. This file will define your Workflow, which is responsible for executing your Activities in the correct order and handling compensation if necessary.

BookingWorkflow.cs

```csharp
namespace BookingSaga;

public record BookVacationInput(string BookUserId, string BookCarId, string BookHotelId, string BookFlightId, int Attempts);
```

## Set Up the Worker
To make your booking logic functional and integrated into your application, you need to set up a Worker. The Worker is responsible for executing the defined Workflows and Activities.

Create a new file named Program.cs.

Program.cs
```csharp
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
```
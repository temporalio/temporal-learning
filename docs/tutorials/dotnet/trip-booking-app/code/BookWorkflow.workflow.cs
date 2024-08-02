namespace BookingSaga;

using Temporalio.Workflows;
using Temporalio.Activities;
using Temporalio.Common;

[Workflow]
public class BookingWorkflow
{
    [WorkflowRun]
    public async Task<WorkflowResult> RunAsync(BookVacationInput input)
    {
        List<Func<Task>> compensations = new List<Func<Task>>();
        Dictionary<string, string> results = new Dictionary<string, string>();

        try
        {
            // Book car
            compensations.Add(() => UndoBookCarAsync(input));
            string carResult = await Workflow.ExecuteActivityAsync(
                (Activities activities) => activities.BookCar(input),
                new ActivityOptions { ScheduleToCloseTimeout = TimeSpan.FromSeconds(10) }
            );
            results["booked_car"] = carResult;

            // Book hotel
            compensations.Add(() => UndoBookHotelAsync(input));
            string hotelResult = await Workflow.ExecuteActivityAsync(
                (Activities activities) => activities.BookHotel(input),
                new ActivityOptions
                {
                    ScheduleToCloseTimeout = TimeSpan.FromSeconds(10),
                    RetryPolicy = new RetryPolicy
                    {
                        MaximumAttempts = input.Attempts,
                        NonRetryableErrorTypes = new List<string> { "ValueError" }
                    }
                }
            );
            results["booked_hotel"] = hotelResult;

            // Book flight
            compensations.Add(() => UndoBookFlightAsync(input));
            string flightResult = await Workflow.ExecuteActivityAsync(
                (Activities activities) => activities.BookFlight(input),
                new ActivityOptions
                {
                    ScheduleToCloseTimeout = TimeSpan.FromSeconds(10),
                    RetryPolicy = new RetryPolicy
                    {
                        InitialInterval = TimeSpan.FromSeconds(1),
                        MaximumInterval = TimeSpan.FromSeconds(1)
                    }
                }
            );
            results["booked_flight"] = flightResult;

            return new WorkflowResult { Status = "success", Message = results };
        }
        catch (Exception ex)
        {
            foreach (var compensation in compensations)
            {
                await compensation();
            }
            return new WorkflowResult { Status = "failure", Message = ex.Message };
        }
    }

    private Task UndoBookCarAsync(BookVacationInput input)
    {
        return Workflow.ExecuteActivityAsync(
            (Activities activities) => activities.UndoBookCar(input),
            new ActivityOptions { ScheduleToCloseTimeout = TimeSpan.FromSeconds(10) }
        );
    }

    private Task UndoBookHotelAsync(BookVacationInput input)
    {
        return Workflow.ExecuteActivityAsync(
            (Activities activities) => activities.UndoBookHotel(input),
            new ActivityOptions { ScheduleToCloseTimeout = TimeSpan.FromSeconds(10) }
        );
    }

    private Task UndoBookFlightAsync(BookVacationInput input)
    {
        return Workflow.ExecuteActivityAsync(
            (Activities activities) => activities.UndoBookFlight(input),
            new ActivityOptions { ScheduleToCloseTimeout = TimeSpan.FromSeconds(10) }
        );
    }
}
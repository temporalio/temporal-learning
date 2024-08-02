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

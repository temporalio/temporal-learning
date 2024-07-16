"""
Module containing activity implementations for the booking process.
"""
# @@@SNIPSTART saga-py-activities-import
import asyncio

from temporalio import activity

from shared import BookVacationInput

# @@@SNIPEND


# @@@SNIPSTART saga-py-activities-book-car
@activity.defn
async def book_car(book_input: BookVacationInput) -> str:
    """
    Books a car.

    Args:
        book_input (BookVacationInput): Input data for booking the car.

    Returns:
        str: Confirmation message.
    """
    print(f"Booking car: {book_input.book_car_id}")
    return f"{book_input.book_car_id}"


# @@@SNIPEND
# @@@SNIPSTART saga-py-activities-book-hotel
@activity.defn
async def book_hotel(book_input: BookVacationInput) -> str:
    """
    Books a hotel.

    Args:
        book_input (BookVacationInput): Input data for booking the hotel.

    Returns:
        str: Confirmation message.
    """
    await asyncio.sleep(1)
    attempt_info = f"Invoking activity, attempt number {activity.info().attempt}"
    if activity.info().attempt < 2:
        activity.heartbeat(attempt_info)
        await asyncio.sleep(1)
        raise RuntimeError("Hotel service is down. Retrying...")

    if "invalid" in book_input.book_hotel_id:
        raise ValueError("Invalid hotel booking, rolling back!")

    print(f"Booking hotel: {book_input.book_hotel_id}")
    return f"{book_input.book_hotel_id}"


# @@@SNIPEND
# @@@SNIPSTART saga-py-activities-book-flight
@activity.defn
async def book_flight(book_input: BookVacationInput) -> str:
    """
    Books a flight.

    Args:
        book_input (BookVacationInput): Input data for booking the flight.

    Returns:
        str: Confirmation message.
    """
    print(f"Booking flight: {book_input.book_flight_id}")
    return f"{book_input.book_flight_id}"


# @@@SNIPEND
# @@@SNIPSTART saga-py-activities-undo-book
@activity.defn
async def undo_book_car(book_input: BookVacationInput) -> str:
    """
    Undoes the car booking.

    Args:
        book_input (BookVacationInput): Input data for undoing the car booking.

    Returns:
        str: Confirmation message.
    """
    print(f"Undoing booking of car: {book_input.book_car_id}")
    return f"{book_input.book_car_id}"


@activity.defn
async def undo_book_hotel(book_input: BookVacationInput) -> str:
    """
    Undoes the hotel booking.

    Args:
        book_input (BookVacationInput): Input data for undoing the hotel booking.

    Returns:
        str: Confirmation message.
    """
    print(f"Undoing booking of hotel: {book_input.book_hotel_id}")
    return f"{book_input.book_hotel_id}"


@activity.defn
async def undo_book_flight(book_input: BookVacationInput) -> str:
    """
    Undoes the flight booking.

    Args:
        book_input (BookVacationInput): Input data for undoing the flight booking.

    Returns:
        str: Confirmation message.
    """
    print(f"Undoing booking of flight: {book_input.book_flight_id}")
    return f"{book_input.book_flight_id}"


# @@@SNIPEND

"""
Module for defining saga workflows.
"""
# @@@SNIPSTART saga-py-workflows-import
from datetime import timedelta

from temporalio import workflow
from temporalio.common import RetryPolicy

with workflow.unsafe.imports_passed_through():
    from activities import (
        BookVacationInput,
        book_car,
        book_flight,
        book_hotel,
        undo_book_car,
        undo_book_flight,
        undo_book_hotel,
    )


# @@@SNIPEND
# @@@SNIPSTART saga-py-workflows-run
@workflow.defn
class BookingWorkflow:
    """
    Workflow class for booking a vacation.
    """

    @workflow.run
    async def run(self, book_input: BookVacationInput):
        """
        Executes the booking workflow.

        Args:
            book_input (BookVacationInput): Input data for the workflow.

        Returns:
            str: Workflow result.
        """
        compensations = []
        results = {}
        try:
            compensations.append(undo_book_car)
            car_result = await workflow.execute_activity(
                book_car,
                book_input,
                start_to_close_timeout=timedelta(seconds=10),
            )
            results["booked_car"] = car_result

            # Book hotel
            compensations.append(undo_book_hotel)
            hotel_result = await workflow.execute_activity(
                book_hotel,
                book_input,
                start_to_close_timeout=timedelta(seconds=10),
                maximum_attempts=book_input.attempts,
                retry_policy=RetryPolicy(non_retryable_error_types=["ValueError"]),
            )
            results["booked_hotel"] = hotel_result

            # Book flight
            compensations.append(undo_book_flight)
            flight_result = await workflow.execute_activity(
                book_flight,
                book_input,
                start_to_close_timeout=timedelta(seconds=10),
                retry_policy=RetryPolicy(
                    initial_interval=timedelta(seconds=1),
                    maximum_interval=timedelta(seconds=1),
                ),
            )
            results["booked_flight"] = flight_result

            return {"status": "success", "message": results}

        except Exception as ex:
            for compensation in reversed(compensations):
                await workflow.execute_activity(
                    compensation,
                    book_input,
                    start_to_close_timeout=timedelta(seconds=10),
                )
            return {"status": "failure", "message": str(ex)}


# @@@SNIPEND

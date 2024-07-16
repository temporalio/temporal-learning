"""
Module for shared data structures and constants.
"""
# @@@SNIPSTART saga-py-shared
from dataclasses import dataclass


@dataclass
class BookVacationInput:
    attempts: int
    book_user_id: str
    book_car_id: str
    book_hotel_id: str
    book_flight_id: str


TASK_QUEUE_NAME = "saga-task-queue"
# @@@SNIPEND

"""
Module to run the workflow.
"""
# @@@SNIPSTART saga-py-starter-import
import asyncio
import uuid

from flask import Flask, jsonify, request
from temporalio.client import Client

from shared import TASK_QUEUE_NAME, BookVacationInput
from workflows import BookingWorkflow
# @@@SNIPEND
# @@@SNIPSTART saga-py-starter-initialize
def create_app(temporal_client: Client):
    app = Flask(__name__)

    def generate_unique_username(name):
        return f'{name.replace(" ", "-").lower()}-{str(uuid.uuid4().int)[:6]}'
    # @@@SNIPEND
    # @@@SNIPSTART saga-py-starter-post
    @app.route("/book", methods=["POST"])
    async def book_vacation():
        """
        Endpoint to book a vacation.

        Returns:
            Response: JSON response with booking details or error message.
        """
        user_id = generate_unique_username(request.json.get("name"))
        attempts = request.json.get("attempts")
        car = request.json.get("car")
        hotel = request.json.get("hotel")
        flight = request.json.get("flight")

        input_data = BookVacationInput(
            attempts=int(attempts),
            book_user_id=user_id,
            book_car_id=car,
            book_hotel_id=hotel,
            book_flight_id=flight,
        )

        result = await temporal_client.execute_workflow(
            BookingWorkflow.run,
            input_data,
            id=user_id,
            task_queue=TASK_QUEUE_NAME,
        )

        response = {"user_id": user_id, "result": result}

        if result == "Voyage cancelled":
            response["cancelled"] = True

        return jsonify(response)

    return app
# @@@SNIPEND


# @@@SNIPSTART saga-py-starter-main
async def main():
    temporal_client = await Client.connect("localhost:7233")
    app = create_app(temporal_client)
    app.run(host="0.0.0.0", debug=True)


if __name__ == "__main__":
    asyncio.run(main())
# @@@SNIPEND
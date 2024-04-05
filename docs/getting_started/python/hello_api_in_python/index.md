---
id: hello-api-tutorial-python
title: Integrate your API with a Temporal Application in Python
sidebar_position: 4
keywords: [python,temporal, sdk, tutorial, hello world, temporal application, workflow, activity, test temporal workflows, mock temporal activities, pytest]
last_update:
  date: 2024-01-01
description: In this tutorial you will build a Temporal Application that calls a web API using the Python SDK. You'll write a Workflow, an Activity, tests, and define a Worker.
tags: [Python, SDK]
image: /img/temporal-logo-twitter-card.png
pagination_next: courses/temporal_101/python
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

![Temporal Python SDK](/img/sdk_banners/banner_python.png)

:::note Tutorial information

- **Level:** ⭐ Temporal beginner
- **Time:** ⏱️ ~25 minutes
- **Goals:** 🙌
  - Build and test a Temporal Application with [Python SDK](https://github.com/temporalio/sdk-python).
  - Implement a client for Workflow Management.
  - Integrate external Web API.
  - Understand Durable Executions.

:::


### Introduction

When writing business logic, guaranteeing a consistent response involving an API can be challenging. APIs are often subject to issues like traffic-induced throttling, unexpected downtimes, or other external disruptions. These challenges require a robust approach to maintain reliable and performant applications.

Temporal lets you write durable executions with the programming languages you’re already familiar with, handling unpredictable API communications effectively. Mechanism like state, retries, and error handling integrate seamlessly into the Temporal Workflow, ensuring your API calls are made in a resilient manner. This approach enhances your application ability to deal with inherently unreliable external services.

The aim of this tutorial is to progressively integrate a weather forecasting API into your web application. This journey will demonstrate how durable functions can effectively mitigate the challenges posed by APIs, ensuring your applications remains robust and responsive.

## Overview

Following the foundational guide [Build a Temporal Application from scratch in Python](/getting_started/python/hello_world_in_python/), you'll elevate your skills in developing Temporal Applications using the Python SDK.
You'll write a Temporal Application with a web application for weather forecasting, connecting a frontend client to the backend process.

Here's what you'll explore and accomplish:

1. **Workflow:** You'll delve deep into the Workflow Class, the central orchestrator of your Temporal Application. This class meticulously outlines the sequence of operations, directing the call to the weather API.
2. **Activity:** The Activity is where the action happens. This functional unit is key to performing tasks like fetching and processing data, bridging the gap between your Workflow's instructions and the external API's responses.
3. **Worker:** Workers are the powerhouse of the Temporal framework, executing the code of your Workflows and Activities. This section will enlighten you on how Workers function, hosting and running various pieces of your application’s logic.
4. **Testing with Pytest:** Testing is an integral part of software development, particularly for robust applications. This tutorial includes a segment on writing tests using `pytest`, enabling you to verify the successful execution of your Activities.
5. **Client Configuration:** A pivotal aspect of any Temporal Application is configuring the client. You'll go through the process of setting up and customizing the client, which acts as a conduit between your frontend (like a web application) and the Temporal backend.

Upon completing this tutorial, you'll Temporal application and gain comprehensive understanding of the interactions between its various components.
This experience will prove invaluable as you continue to build sophisticated, scalable web applications using Temporal.

All necessary code and resources are available in the `hello-weather-python-template` repository.


## Prerequisites

Before starting this tutorial:

- Build a Temporal Application from scratch in Python

This tutorial was written using:

- Temporal Python SDK 1.4
- Python 3.12
- Flask 2.2.3 with the `async` extra
  - `pip install "Flask[async]"`
- National Weather Service (NWS) [API](https://www.weather.gov/documentation/services-web-api) accessed January 01, 2024: https://api.weather.gov

:::note

The National Weather Service API was chosen for this project as frictionless developer experience, in terms of getting access to an API without needing additional sign up.
The API is not intended to be used for commercial purposes.


:::

---

## Modify the Workflow

In Temporal, a Workflow orchestrates Activities.
The Workflow defines the logic and sequencing of tasks, while Activities perform the actual work.
The Workflow executes Activities based on their defined order and dependencies.

To demonstrate a more complex use case, transition from the simple `SayHello` Workflow to a more advanced `WeatherWorkflow`.
This Workflow will allow you to call a weather service API for forecasting.

### Update Workflow imports

First, you'll need to prepare the essential tools.
Create a `workflows.py` file and add the following import statements:

<!--SNIPSTART hello-weather-workflow-imports-->
<!--SNIPEND-->


By importing these classes, you're equipping the `WeatherWorkflow` with capabilities to fetch and process weather data.
The `WeatherActivities` and `WeatherParams` classes, imported from the `activities.py` file, will play a key role in the subsequent steps.

### Define Workflow class

Now, you define the `WeatherWorkflow` class.
This class is responsible for orchestrating the execution of the `get_weather` Activity from the `WeatherActivities` class.
It takes in a `WeatherParams` object containing location information.
The Workflow then passes this information to the Activity, which calls the weather API and returns the forecast data.

<!--SNIPSTART hello-weather-workflow-run-->
<!--SNIPEND-->

After executing the Activity, the Workflow processes the result and returns the final weather forecast periods list.
`WeatherWorkflow` not only defines the Workflow logic for retrieving weather data but also coordinates the sequencing of the Activity execution.

Moreover, it's important to consider error handling and retries.
The [Retry Policy](https://docs.temporal.io/retry-policies) is crucial in this context.
The default policy is:

```text
Initial Interval     = 1 second
Backoff Coefficient  = 2.0
Maximum Interval     = 100 × Initial Interval
Maximum Attempts     = ∞
Non-Retryable Errors = []
```

This policy, set on the Workflow options, is applied to all Activities.

:::note

This is particularly useful when dealing with rate limits or throttling issues from APIs. 
For instance, the [NWS API documentation](https://www.weather.gov/documentation/services-web-api) states:

> The rate limit is not public information, but allows a generous amount for typical use. If the rate limit is exceeded a request will return with an error, and may be retried after the limit clears (typically within 5 seconds).

Therefore, in cases where the API's rate limit affects your Activity, the Workflow will automatically retry the Activity, in line with the defined Retry Policy.

:::

If you wanted to modify the default Retry Policy, you'd set the `RetryPolicy()` from within the Workflow Options:

```python
        return await workflow.execute_activity_method(
            WeatherActivities.get_weather,
            weather_params,
            schedule_to_close_timeout=timedelta(seconds=10),
            retry_policy=RetryPolicy(
                    backoff_coefficient=3.0,
                    maximum_attempts=5,
                    # initial_interval=timedelta(seconds=1),
                    # maximum_interval=timedelta(seconds=2),
                    # non_retryable_error_types=["ValueError"],
                ),
        )
```

With these modifications in place, you're now ready to update and refine the Activity as well.


## Modify the Activity

Activities in a Temporal application represent the actual work units.
They encapsulate business logic for performing specific tasks.
In the [Build a Temporal Application: Create an Activity](/getting_started/python/hello_world_in_python/#create-an-activity) section, you created a simple `SayHello` Activity.

Let's expand the scope of this Activity to include the functionality to fetch weather data from the National Weather Service API.
In this section, you'll create a dataclass for handling parameters for the weather API and then define a class for managing the Activity itself, including the logic to call the weather API and process its response.

### Update Activity imports

Before diving into the Activity's business logic, consider the role of the Activity file.
It's where you execute operations that are prone to failure, such as network calls.

:::note
While this tutorial uses `aiohttp`, you can use any HTTP client library you like; however, you should choose frameworks the supports your asynchronous or synchronous calls.

For more information, see [Asynchronous vs. Synchronous Activity implementations](https://docs.temporal.io/dev-guide/python/async-vs-sync).
:::

Import the following modules into your file:

<!--SNIPSTART hello-weather-activities-imports-->
<!--SNIPEND-->

The `aiohttp` modules are used to make asynchronous network calls to the weather API.
The `dataclass` module is used to futureproof arguments sent to the Workflow.
The `activity` module is used to define the Activity class.

### Define the dataclass

Transitioning to data management, Temporal promotes the use of data classes in Python for several reasons, including compatibility, flexibility, and ease of serialization.

The `WeatherParams` dataclass represents the input parameters for the weather-related activities, such as office location and grid coordinates.

The `ForecastPeriod` dataclass represents the response from the weather API.

<!--SNIPSTART hello-weather-activity-dataclass-->
<!--SNIPEND-->

Temporal encourages the use of data classes in Python for several reasons:
- **Compatibility**: Data classes allow you to add fields without breaking compatibility.
This is particularly useful when defining parameters and return types for your Temporal workflows.
- **Flexibility**: Temporal Workflows can have any number of custom parameters.
Using objects (like data classes) as parameters allows individual fields to be altered without breaking the signature of the workflow.
- **Serialization**: All Workflow definition parameters must be serializable.
Dataclasses in Python, when properly type-annotated, can be easily serialized and deserialized, making them a good fit for this requirement.

With the dataclass in place, you can now focus on defining the Activity itself.

### Define the Activity class

Shifting our attention to the core of the execution, Activities can be either functions or methods within a class.
In this case, you'll encapsulate them within a class to efficiently manage connections to the weather API.

The `WeatherActivities` class will contain the Activity `get_weather`, which is responsible for making the API call and returning the forecast data.

<!--SNIPSTART hello-weather-activity-class-->
<!--SNIPEND-->

Through these methods, the Activity class manages API interactions and data processing.
Activities in Temporal can have multiple parameters, and all passed values are recorded in the Workflow's Event History.
This structure ensures a clear separation between Activities and Workflows.

Using `async` in Temporal's Activity code is crucial for non-blocking operations, particularly for network calls like API requests.
Asynchronous Activities allow for efficient and scalable handling of multiple tasks, improving overall performance by avoiding idle resource usage during waiting periods.

Implementing Activities within a class, provides organized and maintainable code by encapsulating related functionalities.
This approach allows for efficient shared state management across Activity invocations and simplifies adding new functionalities, making the codebase more extensible and manageable.

:::info Weather Forecast API

Forecasts are created at each [NWS Weather Forecast Office (WFO)](https://www.weather.gov/srh/nwsoffices) on their own grid definition.

To obtain the grid forecast for a point location, use the `/points` endpoint to retrieve the current grid forecast endpoint by coordinates:

`https://api.weather.gov/points/{latitude},{longitude}`

For example: `https://api.weather.gov/points/39.7456,-97.0892`

This will provide the grid forecast endpoints for three format options in these properties:

- `forecast` - forecast for 12h periods over the next seven days
- `forecastHourly` - forecast for hourly periods over the next seven days
- `forecastGridData` - raw forecast data over the next seven days

:::

Now that you have defined the Activity class, it's time to update the Worker where these Activities will be executed.

## Modify the Worker

In Temporal applications, the Worker plays a crucial role as the execution engine for Workflows and Activities.
It's responsible not only for executing the defined tasks but also for maintaining continuous communication with the Temporal service.
This ensures that Workflows and Activities are handled efficiently and reliably.
In this section, you'll update the Worker to integrate the `WeatherActivities` and `WeatherWorkflow`.
This integration is vital for enabling the Worker to recognize and execute the specific tasks associated with our Weather Forecasting Service, thereby bridging the gap between the task definitions and their execution.

### Update Worker imports

To start, you need to prepare the Worker.
Update the import statements to incorporate `WeatherActivities` and `WeatherWorkflow` into your Worker.
This step ensures that the Worker has access to the necessary components to execute the Weather Forecasting logic.

<!--SNIPSTART hello-weather-worker-imports-->
<!--SNIPEND-->

Now that you have imported the necessary libraries, you can proceed to configure the Worker.

### Update the Worker

With the imports in place, focus on configuring the Worker itself. While the core structure of the Worker remains the same, crucial updates are made to instantiate the Activity class and register the method on the Worker.

This allows the Worker to recognize and execute the specific `WeatherActivities` and `WeatherWorkflow` when called upon.

<!--SNIPSTART hello-weather-worker-->
<!--SNIPEND-->

Here's an overview of the Worker's updated functionality:

- The `WeatherWorkflow` is set up to be recognized and executed by the Worker.
- The `get_weather` activity from `WeatherActivities` is similarly registered.
- The Worker listens on the "my-task-queue" to receive and process new tasks.
- It executes the appropriate Workflow or Activity based on the task received from the Temporal service.

Essentially, the Worker functions as the heart of the application's runtime.
It continuously listens for and executes tasks, bridging the gap between the Temporal service's scheduling and the actual task execution.
This continuous operation persists until the Worker is shut down.

Upon shutdown, an important cleanup process occurs.
The Worker ensures that the `WeatherActivities` session is properly closed.

This setup also allows for the distribution of work across multiple Workers, ensuring robust handling of tasks in diverse environments.

With the Worker now ready, the next step is to modify the Client, setting the stage for launching and interacting with your Weather Forecasting Service.

## Modify the Client

In a Temporal application, the Client plays a pivotal role in initiating and managing Workflow Executions.
It serves as the bridge between the user-facing interface and the backend Workflow logic.
In this section, you'll integrate the Client with a Flask application to start the Workflow and serve both the UI and API from a `/weather` endpoint.
This setup allows for an interactive and responsive way to interact with the Temporal service, providing an accessible point of contact for users to request and receive weather forecasts.

### Update Clients imports

The Weather Forecasting Service integrates Temporal's Client class to connect with the Temporal service and uses Flask to serve the UI and API.
This configuration facilitates a smooth interaction between the user interface and the Workflow management system.

Change the name of the `run_workflow.py` file to `app.py` to help integrate the Flask application with the Client.

:::note

While this tutorial uses Flask as the web framework, the Client can be used with any web framework.

:::

Add the following imports to your `app.py` file.

<!--SNIPSTART hello-weather-client-imports-->
<!--SNIPEND-->

Now that you have imported the necessary libraries, you can proceed to configure the Client.

### Configure the Client

The Client's primary role is to connect to the Temporal service and provide an API for Workflow management.
It acts as the intermediary, enabling the Flask application to trigger and control Workflow Executions.
Initialize the Client and create a route as entry point to your application.

<!--SNIPSTART hello-weather-client-init-->
<!--SNIPEND-->

Now write your `/weather` route and connect to the Temporal Client.


<!--SNIPSTART hello-weather-client-->
<!--SNIPEND-->

Here's what happens when a user accesses the `/weather` endpoint:

- The Flask route `/weather` is dedicated to processing weather forecast requests.
- It initializes the Temporal Client, preparing for interaction with the Temporal service.
- A `WeatherParams` object is created, carrying essential data for the weather query.
- The `WeatherWorkflow.run` is executed via the Client, with the provided parameters.
- Following execution, the Workflow returns weather data, which is then processed and organized.
- Flask's `render_template()` function then renders the forecast data in a user-friendly format.

Through this process, the Flask app, acting as the frontend client, interacts seamlessly with the Temporal backend. It delegates the execution of Workflows and Activities to the Worker, while it focuses on handling user requests and presenting data.

Following the successful integration of the Flask application with the Temporal backend, it's vital to shift our focus to the testing phase.

## Test the Activity

Testing your Temporal application is an essential step to ensure the reliability and correctness of its Workflows and Activities.
This section guides you through writing tests using `pytest` to confirm the functionality of your Weather Forecasting Service with Temporal's [ActivityEnvironment](https://python.temporal.io/temporalio.testing.ActivityEnvironment.html) package.

The Activity Environment is used for testing Activity code that can access the functions in the `temporalio.activity` module.
Use `run` to run an Activity function within an Activity context.

These tests are crucial for validating both the integration with a mock weather service and the behavior of your Temporal Activities.

### Set up the testing environment

The first step in testing is to establish a testing environment that mirrors your production setup as closely as possible.
This step is critical for ensuring that your tests accurately reflect the real-world behavior of your application.

The setup involves two main components:

- creating a mock weather service
- configuring `pytest` fixtures

Create a folder called `tests`, and inside that folder create a new file called `test_activity.py`.

Add the following imports to the `test_activity.py` file.

<!--SNIPSTART hello-weather-test-imports-->
<!--SNIPEND-->

Now you're ready to begin mocking the Weather Service API.

### Mock weather service

The mock weather service is a pivotal part of your testing setup.
It replicates the behavior of the external weather API, offering controlled responses to your application.
This controlled environment is invaluable for testing how your application responds to different scenarios, such as varying weather conditions or unexpected API failures.


<!--SNIPSTART mocked-weather-service-->
<!--SNIPEND-->

After establishing the mock service, the next step involves setting up `pytest` fixtures.

### Pytest fixtures

These fixtures are instrumental in both initiating and tearing down your testing environment for each test.
By ensuring each test starts with a fresh environment, `pytest` fixtures maintain the integrity and reliability of your entire test suite.

<!--SNIPSTART hello-weather-test-case-->
<!--SNIPEND-->

This fixture function is used in to set up a fake weather service for testing.
It creates a web application, adds a route to handle requests to the weather API endpoint and yields control back to the test function.
After the test function completes, it cleans up the resources used by the fake weather service.

### Activity test case

After establishing your testing environment, the next crucial step is to develop test cases.
This test is designed to validate the behavior of your Weather Forecasting Service with Temporal's [ActivityEnvironment](https://python.temporal.io/temporalio.testing.ActivityEnvironment.html) class.

<!--SNIPSTART hello-weather-test-fixtures-->
<!--SNIPEND-->


- `TEST_BASE_URL` sets the base URL for the mock weather service.
- The `weather_activities` fixture creates an instance of `WeatherActivities` configured to use the mock service.
- `yield` in the fixture ensures that the created instance is available for the duration of the test and then gracefully closes it.
- `test_get_weather` employs the `ActivityEnvironment` to run the `get_weather` method of `WeatherActivities`.
- This test passes `WeatherParams` as input and expects `ForecastPeriod` instances as output.
- The `assert` statement validates that the actual output matches the expected output.

The `test_get_weather` function evaluates the `get_weather` method of the `WeatherActivities` class, ensuring its output aligns with expected results.

This validation is made possible by employing two essential fixtures:

1. **start_fake_weather_service**: This fixture initializes a mock weather service, emulating the behavior of an external weather API. It's crucial for creating a realistic test scenario for the `get_weather` method.

2. **weather_activities**: This fixture provides a configured instance of the `WeatherActivities` class for testing. It ensures that the activities are tested in a consistent and isolated environment, separate from other application components.

These fixtures, by setting up a controlled testing environment, enable the `test_get_weather` function to effectively validate the functionality and resilience of the `get_weather` method under various simulated conditions.

### Execute tests

Finally, to run your tests, simply execute the `pytest` command in your project's root directory.
This command triggers the discovery and execution of all test cases defined in your test suite, and the results are displayed in your terminal.
It's important to carefully review these results, as they will reveal any potential issues or regressions in your application's functionality.

By following these steps, you can thoroughly test your Temporal application, ensuring its reliability and robustness in handling Weather Forecasting Service functionalities.

---

## Run the Temporal Application

To experience your Weather Forecasting Service in action, you'll need to run the Temporal application.
This involves starting both the Worker and the Flask app, each in its own terminal.
Here's how you can do it:

### Start the Worker

First, activate the Worker.
This is the component that will execute the Workflows and Activities you've defined.
Open a terminal window and run the following command:

```command
# MacOS users
python3 starter.py
# Windows users
# python starter.py
```

This command initiates the Worker, which will now listen for and execute tasks from the Temporal service.

### Start the Flask App

Next, launch the Flask application. The Flask app acts as the front-end interface of your service. Open a separate terminal from the one running the Worker and execute the following command:

```command
flask run
```

By starting the Flask server, you're setting up the `/weather` endpoint, which users can interact with to get weather forecasts.

### Access the Application

Finally, explore your application.
With both the Worker and Flask app running, your Temporal application is fully operational.

Open your web browser and navigate to the following URL:

[localhost:5000/weather](http://localhost:5000/weather)

This URL directs you to the `/weather` endpoint of your Flask application.

![Seattle Forecast](/img/weather_seattle.png)

Here, you can see the weather forecasts generated by your Temporal Workflows and Activities, showcasing the integration of your backend logic with the frontend interface.

## Conclusion

In this tutorial, you've successfully integrated a web API with a Temporal Application using the Python SDK.
You have learned how to set up, build, test, and enhance a Temporal Application by integrating it with a weather forecasting API.
This process involved defining a Workflow, creating an Activity, configuring a Worker, and implementing a Flask-based client to interact with the Temporal backend.

By completing this tutorial, you have achieved the following goals:

1. **Understanding Durable Executions:** You now know how to make your application's interactions with external APIs more resilient and reliable using Temporal's Workflow and Activity structures.
2. **Workflow and Activity Integration:** You've learned how to define and orchestrate Workflows and Activities to handle external API calls effectively.
3. **Client-Worker Communication:** You've seen how to configure a Worker to execute Workflow and Activity tasks and how a Flask client can trigger these Workflows.

This tutorial serves as a foundation for building robust, scalable applications with Temporal and Python, capable of handling complex Workflows and external service integrations.
The skills you've acquired here will be invaluable as you continue to explore and build distributed applications using Temporal.

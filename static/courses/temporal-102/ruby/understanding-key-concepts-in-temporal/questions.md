# Question 1
As a developer using a Temporal SDK to create an application 
that calls a remote service, which of the following would you 
be responsible for writing (pick two)?

1. Workflow Definition
2. Temporal Client
3. Worker
4. Activity Definition(s) 
 
**Feedback**
Temporal application developers are responsible for writing the 
Workflow Definition as well as any Activity Definitions required 
by the business logic. Although developers will also write code to
*configure* the Temporal Client and Worker, they would not need to 
*write* a Client or Worker themselves, since the SDK provides the 
implementation for both of these.


# Question 2
Which of the following best describes what happens, by default, 
when a Workflow throws an exception during its execution?

1. Temporal will reschedule the Workflow Execution with an exponential backoff
2. This is not possible because you can only throw an exception 
   from an Activity, not a Workflow
3. Temporal will fail the Workflow Execution
4. This will cause the Temporal Cluster to crash
 
**Feedback**
Throwing an exception during Workflow Execution will result in a Workflow Task
Failure. This will lead to the Workflow Task being rescheduled with exponential
backoff. 

Error-prone operations are best done in Activities, which are
retried by default. Unlike Activities, Workflow executions are
not associated with a Retry Policy by default. Although it is 
possible to specify a Retry Policy for a Workflow Execution, 
this is uncommon in practice, as is returning an error from a
Workflow. 

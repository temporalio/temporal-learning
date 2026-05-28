import React from "react";
import Link from "@docusaurus/Link";
import Layout from "@theme/Layout";
import CodeBlock from "@theme/CodeBlock";
import Admonition from "@theme/Admonition";
import NotifyBanner from "@site/src/components/hub/NotifyBanner/NotifyBanner";
import PathBreadcrumb from "@site/src/components/hub/PathBreadcrumb/PathBreadcrumb";
import DevEnvironmentToc from "@site/src/components/DevEnvironment/Toc";
import MetaChips from "@site/src/components/DevEnvironment/MetaChips";
import styles from "@site/src/components/DevEnvironment/styles.module.css";
import { OutdatedNotice } from "@site/src/components";

const TOC_ITEMS = [
  { id: "introduction", label: "Introduction" },
  { id: "prerequisites", label: "Prerequisites" },
  { id: "review-saga-pattern", label: "Review the Saga architecture pattern" },
  { id: "workflow-implementation", label: "Workflow implementation" },
  { id: "write-the-saga", label: "Write the Saga" },
  { id: "add-compensations", label: "Add compensations" },
  { id: "run-compensation-strategy", label: "Run the compensation strategy" },
  { id: "conclusion", label: "Conclusion" },
];

const WORKFLOW_SCAFFOLD = `class TripBookingWorkflow implements TripBookingWorkflowInterface
{
    /** @var \\Temporal\\Internal\\Workflow\\ActivityProxy|TripBookingActivitiesInterface */
    private $activities;

    public function __construct()
    {
        $this->activities = Workflow::newActivityStub(
            TripBookingActivitiesInterface::class,
            ActivityOptions::new()->withStartToCloseTimeout(CarbonInterval::hour(1))
        );
    }

    public function bookTrip(string $name)
    {

    }
}`;

const SAGA_SKELETON = `class TripBookingWorkflow implements TripBookingWorkflowInterface
{
    // ...

    public function bookTrip(string $name)
    {
        $saga = new Workflow\\Saga();

        try {

        } catch (\\Throwable $e) {

        }
    }
}`;

const SAGA_BOOK_STEPS = `public function bookTrip(string $name)
{
    $saga = new Workflow\\Saga();

    try {
        $carReservationID = yield $this->activities->reserveCar($name);
        $hotelReservationID = yield $this->activities->bookHotel($name);
        $flightReservationID = yield $this->activities->bookFlight($name);

        return [
            'car' => $carReservationID,
            'hotel' => $hotelReservationID,
            'flight' => $flightReservationID
        ];
    } catch (\\Throwable $e) {

    }
}`;

const SAGA_WITH_COMPENSATIONS = `public function bookTrip(string $name)
{
    $saga = new Workflow\\Saga();

    try {
        $carReservationID = yield $this->activities->reserveCar($name);
        $saga->addCompensation(fn() => yield $this->activities->cancelCar($carReservationID, $name));

        $hotelReservationID = yield $this->activities->bookHotel($name);
        $saga->addCompensation(fn() => yield $this->activities->cancelHotel($hotelReservationID, $name));

        $flightReservationID = yield $this->activities->bookFlight($name);
        $saga->addCompensation(fn() => yield $this->activities->cancelFlight($flightReservationID, $name));

        return [
            'car' => $carReservationID,
            'hotel' => $hotelReservationID,
            'flight' => $flightReservationID
        ];
    } catch (\\Throwable $e) {

    }
}`;

const SAGA_COMPLETE = `public function bookTrip(string $name)
{
    $saga = new Workflow\\Saga();

    try {
        $carReservationID = yield $this->activities->reserveCar($name);
        $saga->addCompensation(fn() => yield $this->activities->cancelCar($carReservationID, $name));

        $hotelReservationID = yield $this->activities->bookHotel($name);
        $saga->addCompensation(fn() => yield $this->activities->cancelHotel($hotelReservationID, $name));

        $flightReservationID = yield $this->activities->bookFlight($name);
        $saga->addCompensation(fn() => yield $this->activities->cancelFlight($flightReservationID, $name));

        return [
            'car' => $carReservationID,
            'hotel' => $hotelReservationID,
            'flight' => $flightReservationID
        ];
    } catch (\\Throwable $e) {
        yield $saga->compensate();
        throw $e;
    }
}`;

const IMG_BASE = "/img/tutorials/php/build_a_trip_booking_app";

export default function BuildTripBookingAppPage() {
  return (
    <Layout
      title="Build a trip booking system with PHP"
      description="Explore the different components that make up the Temporal Booking Saga code sample."
    >
      <div className="nd-hub-page">
        <div className={styles.heroBanner}>
          <img
            src="/img/sdk_banners/banner_php.png"
            alt="Temporal PHP SDK"
            className={styles.heroBannerImg}
          />
        </div>

        <div className={styles.pageLayout}>
          <aside className={styles.pageSidebar}>
            <DevEnvironmentToc items={TOC_ITEMS} />
          </aside>

          <main className={styles.pageMain}>
            <div className={styles.breadcrumbWrap}>
              <PathBreadcrumb
                items={[
                  { label: "Learn Temporal", href: "/" },
                  { label: "Tutorials", href: "/tutorials" },
                  { label: "PHP", href: "/tutorials/php" },
                  { label: "Build a trip booking system" },
                ]}
              />
            </div>

            <h1 className={styles.title}>
              Build a trip booking system with PHP
            </h1>

            <MetaChips items={["~30 minutes", "Beginner", "PHP"]} />

            <p className={styles.intro}>
              In this tutorial, you'll explore the different components that
              make up the Temporal Booking Saga code sample. You'll see how
              Temporal's native support for the Saga pattern lets you
              coordinate distributed transactions across multiple services
              with compensating actions when any step fails.
            </p>

            <OutdatedNotice />

            <section className={styles.section} id="introduction">
              <h2 className={styles.sectionTitle}>Introduction</h2>
              <p>
                Imagine that we provide a service where people can book a
                trip. Booking a regular trip often consists of several steps:
              </p>
              <ul>
                <li>Booking a car.</li>
                <li>Booking a hotel.</li>
                <li>Booking a flight.</li>
              </ul>
              <p>
                The customer either wants everything to be booked or nothing
                at all. There is no sense in booking a hotel without booking a
                plane. Also, imagine that each booking step in this
                transaction is represented via a dedicated service or
                microservice.
              </p>
              <p>
                All of these steps together make up a{" "}
                <strong>distributed transaction</strong> that crosses multiple
                services and databases. To ensure a successful booking, all
                three microservices must complete the individual local
                transactions. If any of the steps fail, all the completed
                preceding transactions should be reversed accordingly. We
                cannot simply "delete" the prior transactions or "go back in
                time" - particularly where money and bookings are concerned,
                it is important to have an immutable record of attempts and
                failures. Therefore, we should accumulate a list of
                compensating actions to execute when failure occurs.
              </p>
            </section>

            <section className={styles.section} id="prerequisites">
              <h2 className={styles.sectionTitle}>Prerequisites</h2>
              <ul>
                <li>
                  <Link to="/getting_started/php/dev_environment/">
                    Set up a local development environment for developing
                    Temporal applications using PHP
                  </Link>
                  .
                </li>
                <li>
                  Review the{" "}
                  <Link to="/getting_started/php/hello_world_in_php/">
                    Hello World in PHP tutorial
                  </Link>{" "}
                  to understand the basics of getting a Temporal PHP SDK
                  project up and running.
                </li>
              </ul>
            </section>

            <section className={styles.section} id="review-saga-pattern">
              <h2 className={styles.sectionTitle}>
                Review the Saga architecture pattern
              </h2>
              <p>
                Managing distributed transactions can be difficult to do well.
                Sagas are one of the most{" "}
                <a
                  href="https://www.cs.cornell.edu/andru/cs711/2002fa/reading/sagas.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  tried and tested
                </a>{" "}
                design patterns for long running work:
              </p>
              <ul>
                <li>
                  A Saga provides transaction management using a sequence of
                  local transactions.
                </li>
                <li>
                  A local transaction is the unit of work performed by a saga
                  participant, a microservice.
                </li>
                <li>
                  Every operation that is part of the Saga can be rolled back
                  by a compensating transaction.
                </li>
                <li>
                  The Saga pattern guarantees that either all operations are
                  completed successfully or the corresponding compensation
                  transactions are run to undo the previously completed work.
                </li>
              </ul>
              <p>
                Implementing the Saga pattern can be complex, but fortunately,
                Temporal provides native support for the Saga pattern. It
                means that handling all the rollbacks and running
                compensation transactions are performed internally by
                Temporal.
              </p>
              <p>
                <img
                  src={`${IMG_BASE}/booking-saga-flow.png`}
                  alt="Booking saga flow"
                  className={styles.diagramImage}
                />
              </p>
              <p>
                The above diagram shows how to visualize the Saga pattern for
                the previously discussed online trip booking scenario.
              </p>
            </section>

            <section className={styles.section} id="workflow-implementation">
              <h2 className={styles.sectionTitle}>Workflow implementation</h2>
              <p>
                The first thing we need to do is to write a business process -
                the high-level flow of the trip booking. Let's call it{" "}
                <code>TripBookingWorkflow</code>:
              </p>
              <CodeBlock language="php">{WORKFLOW_SCAFFOLD}</CodeBlock>
              <p>
                For simplicity, let's assume that all booking services (car,
                hotel, and flight) are managed under one single activity{" "}
                <code>TripBookingActivitiesInterface</code>. But it is not a
                requirement. Ok, now we need to tell Temporal that we are
                going to use Saga.
              </p>

              <Admonition type="info" title="Saga Orchestration Pattern">
                <p>
                  There are two implementations of Saga Pattern:{" "}
                  <strong>Choreography</strong> and{" "}
                  <strong>Orchestration</strong>. The first one is based on
                  events where{" "}
                  <strong>
                    each microservice that is part of the transaction
                    publishes an event that is processed by the next
                    microservice
                  </strong>
                  . Temporal uses Orchestration Pattern. In the Orchestration
                  pattern,{" "}
                  <strong>
                    a single orchestrator is responsible for managing the
                    overall transaction status
                  </strong>
                  . If any of the microservice encounters a failure, then the
                  orchestrator is responsible for invoking the necessary
                  compensating transactions. Temporal plays the role of such
                  an orchestrator.
                </p>
              </Admonition>
            </section>

            <section className={styles.section} id="write-the-saga">
              <h2 className={styles.sectionTitle}>Write the Saga</h2>
              <CodeBlock language="php">{SAGA_SKELETON}</CodeBlock>
              <p>
                We start with a new object <code>Workflow\Saga</code>, and
                then stub out an empty <code>try/catch</code> block.
              </p>
              <p>
                Consider everything inside <code>try</code> as a happy path.
                If some steps within a distributed transaction fail, we go
                into <code>catch</code> block and run compensations.
              </p>
              <p>
                Now, let's fill our saga with some logic. First, we add
                booking steps:
              </p>
              <CodeBlock language="php">{SAGA_BOOK_STEPS}</CodeBlock>
            </section>

            <section className={styles.section} id="add-compensations">
              <h2 className={styles.sectionTitle}>Add compensations</h2>
              <p>
                In the snippet above, we sequentially reserve a car, a hotel,
                and a flight. Each step here returns a corresponding ID.
                Later we will use this ID to make compensations:
              </p>
              <CodeBlock language="php">{SAGA_WITH_COMPENSATIONS}</CodeBlock>
              <p>
                To add a compensation, we use{" "}
                <code>Saga::addCompensation()</code> method and provide a
                callable that should be used, once we want to roll back a
                distributed transaction.
              </p>
            </section>

            <section className={styles.section} id="run-compensation-strategy">
              <h2 className={styles.sectionTitle}>
                Run the compensation strategy
              </h2>
              <p>
                Having that, we can finish our saga and fill <code>catch</code>{" "}
                block:
              </p>
              <CodeBlock language="php">{SAGA_COMPLETE}</CodeBlock>
              <p>
                Inside <code>catch()</code> we call the{" "}
                <code>compensate()</code> method, which starts the
                compensation strategy and runs all previously registered
                compensation callbacks. Once done, we rethrow the exception
                to understand what happened.
              </p>
              <p>
                By default,{" "}
                <strong>compensations will run sequentially</strong>. You can
                tell Saga to run them in parallel by calling{" "}
                <code>$saga-&gt;setParallelCompensation(true)</code>.
              </p>
            </section>

            <section className={styles.section} id="conclusion">
              <h2 className={styles.sectionTitle}>Conclusion</h2>
              <p>
                In this tutorial, we covered the Saga architecture pattern to
                implement distributed transactions in a microservice-based
                application. Writing Sagas correctly can be complex - Temporal
                allows us to focus only on application details. All the hard
                work with Saga orchestration: calling microservices and
                invoking the necessary compensating transactions - is managed
                by Temporal.
              </p>

              <Admonition type="note" title="Working example">
                <p>
                  We don't cover activity implementation details in this
                  tutorial. Activities may be written in different languages,
                  and the main Saga workflow doesn't depend on them. If you
                  want to test things you can find a fully working example in
                  our{" "}
                  <a
                    href="https://github.com/temporalio/samples-php/tree/master/app/src/BookingSaga"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Booking Saga Workflow repo
                  </a>
                  .
                </p>
              </Admonition>
            </section>

            <div className={styles.nextSection}>
              <h2 className={styles.nextHeading}>What's next?</h2>
              <div className={styles.nextGrid}>
                <Link
                  to="/tutorials/php/build-a-recurring-billing-app/"
                  className={styles.nextCard}
                >
                  <span className={styles.nextEyebrow}>Next tutorial</span>
                  <h3 className={styles.nextTitle}>
                    Build a recurring billing subscription system with PHP
                  </h3>
                  <p className={styles.nextBody}>
                    Build a realistic monthly subscription payments workflow
                    that can be canceled while it runs.
                  </p>
                  <span className={styles.nextCta}>
                    Start the tutorial <span aria-hidden="true">→</span>
                  </span>
                </Link>
                <Link to="/tutorials/php/" className={styles.nextCard}>
                  <span className={styles.nextEyebrow}>All PHP tutorials</span>
                  <h3 className={styles.nextTitle}>Back to PHP tutorials</h3>
                  <p className={styles.nextBody}>
                    Browse the rest of the PHP tutorials and continue building
                    Temporal applications with PHP.
                  </p>
                  <span className={styles.nextCta}>
                    View tutorials <span aria-hidden="true">→</span>
                  </span>
                </Link>
              </div>
            </div>
          </main>
        </div>

        <NotifyBanner />
      </div>
    </Layout>
  );
}

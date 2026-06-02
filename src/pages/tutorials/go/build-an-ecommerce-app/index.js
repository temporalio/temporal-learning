// Reference code lives at https://github.com/temporalio/temporal-ecommerce.

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

const TOC_ITEMS = [
  { id: "introduction", label: "Introduction" },
  { id: "cart-workflow", label: "Create the Shopping cart Workflow" },
  { id: "abandoned-cart", label: "Check for an abandoned cart" },
  { id: "activities", label: "Send emails from an Activity" },
  { id: "worker-starter", label: "Define a Worker and a Starter" },
  { id: "tests", label: "Write Workflow tests" },
  { id: "rest-api", label: "Create a REST API" },
  { id: "conclusion", label: "Conclusion" },
];

const IMG_BASE = "/img/tutorials/go/build-an-ecommerce-app";

const CART_WORKFLOW_STUB = `package app

import (
\t"go.temporal.io/sdk/workflow"
)

type (
\tCartItem struct {
\t\tProductId int
\t\tQuantity  int
\t}

\tCartState struct {
\t\tItems []CartItem
\t\tEmail string
\t}
)

func CartWorkflow(ctx workflow.Context, state CartState) error {
\tlogger := workflow.GetLogger(ctx)
}`;

const SIGNAL_HANDLING = `channel := workflow.GetSignalChannel(ctx, "cartMessages")
selector := workflow.NewSelector(ctx)

selector.AddReceive(channel, func(c workflow.ReceiveChannel, _ bool) {
\tvar signal interface{}
\tc.Receive(ctx, &signal)

\tvar routeSignal RouteSignal
\terr := mapstructure.Decode(signal, &routeSignal)
\tif err != nil {
\t\tlogger.Error("Invalid signal type %v", err)
\t\treturn
\t}

\tswitch {
\tcase routeSignal.Route == RouteTypes.ADD_TO_CART:
\t\tvar message AddToCartSignal
\t\terr := mapstructure.Decode(signal, &message)
\t\tif err != nil {
\t\t\tlogger.Error("Invalid signal type %v", err)
\t\t\treturn
\t\t}
\t\tAddToCart(&state, message.Item)

\tcase routeSignal.Route == RouteTypes.REMOVE_FROM_CART:
\t\tvar message RemoveFromCartSignal
\t\terr := mapstructure.Decode(signal, &message)
\t\tif err != nil {
\t\t\tlogger.Error("Invalid signal type %v", err)
\t\t\treturn
\t\t}
\t\tRemoveFromCart(&state, message.Item)
})

// Stop blocking once one condition is satisfied
for {
\tselector.Select(ctx)
}`;

const ADD_REMOVE_HELPERS = `func (state *CartState) AddToCart(item CartItem) {
\tfor i := range state.Items {
\t\tif state.Items[i].ProductId != item.ProductId {
\t\t\tcontinue
\t\t}

\t\tstate.Items[i].Quantity += item.Quantity
\t\treturn
\t}

\tstate.Items = append(state.Items, item)
}

func (state *CartState) RemoveFromCart(item CartItem) {
\tfor i := range state.Items {
\t\tif state.Items[i].ProductId != item.ProductId {
\t\t\tcontinue
\t\t}

\t\tstate.Items[i].Quantity -= item.Quantity
\t\tif state.Items[i].Quantity <= 0 {
\t\t\tstate.Items = append(state.Items[:i], state.Items[i+1:]...)
\t\t}
\t\tbreak
\t}
}`;

const QUERY_HANDLER = `  err := workflow.SetQueryHandler(ctx, "getCart", func(input []byte) (CartState, error) {
      return state, nil
  })
  if err != nil {
      logger.Info("SetQueryHandler failed.", "Error", err)
      return err
  }`;

const ABANDONED_CART_LOOP = `channel := workflow.GetSignalChannel(ctx, "cartMessages")
sentAbandonedCartEmail := false

for {
  // Create a new Selector on each iteration of the loop means Temporal will pick the first
  // event that occurs each time: either receiving a signal, or responding to the timer.
selector := workflow.NewSelector(ctx)
selector.AddReceive(channel, func(c workflow.ReceiveChannel, _ bool) {
\tvar signal interface{}
\tc.Receive(ctx, &signal)

\t// Move your existing signals for adding or removing items from the cart to here
})

  // If the user doesn't update the cart for \`abandonedCartTimeout\`, send an email
  // reminding them about their cart. Only send the email once.
if !sentAbandonedCartEmail && len(state.Items) > 0 {
\tselector.AddFuture(workflow.NewTimer(ctx, abandonedCartTimeout), func(f workflow.Future) {
\t\tsentAbandonedCartEmail = true
\t\tao := workflow.ActivityOptions{
\t\t\tStartToCloseTimeout:   10 * time.Second,
\t\t}

\t\tctx = workflow.WithActivityOptions(ctx, ao)

      // More on SendAbandonedCartEmail in the next section
\t\terr := workflow.ExecuteActivity(ctx, SendAbandonedCartEmail, state.Email).Get(ctx, nil)
\t\tif err != nil {
\t\t\tlogger.Error("Error sending email %v", err)
\t\t\treturn
\t\t}
\t})
}

selector.Select(ctx)
}`;

const SEND_EMAIL_ACTIVITY = `package app

import (
\t"context"
\t"fmt"
\t"github.com/mailgun/mailgun-go"
)

type Activities struct {
\tMailgunDomain string
\tMailgunKey    string
}

func (a *Activities) SendAbandonedCartEmail(_ context.Context, email string) error {
\tif email == "" {
\t\treturn nil
\t}
\tmg := mailgun.NewMailgun(a.MailgunDomain, a.MailgunKey)
\tm := mg.NewMessage(
\t\t"noreply@"+a.MailgunDomain,
\t\t"You've abandoned your shopping cart!",
\t\t"Go to http://localhost:8080 to finish checking out!",
\t\temail,
\t)
\t_, _, err := mg.Send(m)
\tif err != nil {
\t\tfmt.Println("Mailgun err: " + err.Error())
\t\treturn err
\t}

\treturn err
}`;

const CHECKOUT_SIGNAL = `selector.AddReceive(checkoutChannel, func(c workflow.ReceiveChannel, _ bool) {
\tvar signal interface{}
\tc.Receive(ctx, &signal)

\tvar message CheckoutSignal
\terr := mapstructure.Decode(signal, &message)
\tif err != nil {
\t\tlogger.Error("Invalid signal type %v", err)
\t\treturn
\t}

\tstate.Email = message.Email

\tao := workflow.ActivityOptions{
\t\tStartToCloseTimeout: time.Minute,
\t}

\tctx = workflow.WithActivityOptions(ctx, ao)

\terr = workflow.ExecuteActivity(ctx, a.CreateStripeCharge, state).Get(ctx, nil)
\tif err != nil {
\t\tlogger.Error("Error creating stripe charge: %v", err)
\t\treturn
\t}

\tcheckedOut = true
})`;

const ACTIVITIES_STRUCT_STRIPE = `type Activities struct {
\tStripeKey     string
\tMailgunDomain string
\tMailgunKey    string
}`;

const CREATE_STRIPE_CHARGE = `func (a *Activities) CreateStripeCharge(_ context.Context, cart CartState) error {
\tstripe.Key = a.StripeKey
\tvar amount float32 = 0
\tvar description string = ""
\tfor _, item := range cart.Items {
\t\tvar product Product
\t\tfor _, _product := range Products {
\t\t\tif _product.Id == item.ProductId {
\t\t\t\tproduct = _product
\t\t\t\tbreak
\t\t\t}
\t\t}
\t\tamount += float32(item.Quantity) * product.Price
\t\tif len(description) > 0 {
\t\t\tdescription += ", "
\t\t}
\t\tdescription += product.Name
\t}

\t_, err := charge.New(&stripe.ChargeParams{
\t\tAmount:       stripe.Int64(int64(amount * 100)),
\t\tCurrency:     stripe.String(string(stripe.CurrencyUSD)),
\t\tDescription:  stripe.String(description),
\t\tSource:       &stripe.SourceParams{Token: stripe.String("tok_visa")},
\t\tReceiptEmail: stripe.String(cart.Email),
\t})

\tif err != nil {
\t\tfmt.Println("Stripe err: " + err.Error())
\t}

\treturn err
}`;

const WORKER_MAIN = `package main

import (
\t"log"
\t"go.temporal.io/sdk/client"
\t"go.temporal.io/sdk/worker"
\t"os"
\t"temporal-ecommerce/app"
)

var (
\tstripeKey     = os.Getenv("STRIPE_PRIVATE_KEY")
\tmailgunDomain = os.Getenv("MAILGUN_DOMAIN")
\tmailgunKey    = os.Getenv("MAILGUN_PRIVATE_KEY")
)

func main() {
\t// Create the client object just once per process
\tc, err := client.NewClient(client.Options{})
\tif err != nil {
\t\tlog.Fatalln("unable to create Temporal client", err)
\t}
\tdefer c.Close()
\t// This worker hosts both Worker and Activity functions
\tw := worker.New(c, "CART_TASK_QUEUE", worker.Options{})

\tif stripeKey == "" {
\t\tlog.Fatalln("Must set STRIPE_PRIVATE_KEY environment variable")
\t}
\tif mailgunDomain == "" {
\t\tlog.Fatalln("Must set MAILGUN_DOMAIN environment variable")
\t}
\tif mailgunKey == "" {
\t\tlog.Fatalln("Must set MAILGUN_PRIVATE_KEY environment variable")
\t}

\ta := &app.Activities{
\t\tStripeKey: stripeKey,
\t\tMailgunDomain: mailgunDomain,
\t\tMailgunKey: mailgunKey,
\t}

\tw.RegisterActivity(a.CreateStripeCharge)
\tw.RegisterActivity(a.SendAbandonedCartEmail)

\tw.RegisterWorkflow(app.CartWorkflow)
\t// Start listening to the Task Queue
\terr = w.Run(worker.InterruptCh())
\tif err != nil {
\t\tlog.Fatalln("unable to start Worker", err)
\t}
}`;

const START_MAIN = `package main

import (
    "context"
    "fmt"
    "log"
    "time"

    "temporal-ecommerce/app"

    "go.temporal.io/sdk/client"
)

func main() {
    c, err := client.NewClient(client.Options{})
    if err != nil {
        log.Fatalln("unable to create Temporal client", err)
    }
    defer c.Close()

    workflowID := "CART-" + fmt.Sprintf("%d", time.Now().Unix())

    options := client.StartWorkflowOptions{
        ID:        workflowID,
        TaskQueue: "CART_TASK_QUEUE",
    }

    state := app.CartState{Items: make([]app.CartItem, 0)}
    we, err := c.ExecuteWorkflow(context.Background(), options, app.CartWorkflow, state)
    if err != nil {
        log.Fatalln("unable to execute workflow", err)
    }

    update := app.AddToCartSignal{Route: app.RouteTypes.ADD_TO_CART, Item: app.CartItem{ProductId:0, Quantity: 1}}
    err = c.SignalWorkflow(context.Background(), workflowID, "", "ADD_TO_CART_CHANNEL", update)

    resp, err := c.QueryWorkflow(context.Background(), workflowID, "", "getCart")
    if err != nil {
        log.Fatalln("Unable to query workflow", err)
    }
    var result interface{}
    if err := resp.Get(&result); err != nil {
        log.Fatalln("Unable to decode query result", err)
    }
    // Prints a message similar to:
    // 2021/03/31 15:43:54 Received query result Result map[Email: Items:[map[ProductId:0 Quantity:1]]]
    log.Println("Received query result", "Result", result)
}`;

const WEBAPP_MAIN = `package main

import (
\t"context"
\t"github.com/bojanz/httpx"
\t"github.com/gorilla/handlers"
\t"github.com/gorilla/mux"
\t"net/http"
\t"os"
)

func main() {
\tvar err error

\t// Set up CORS for frontend
\tvar cors = handlers.CORS(handlers.AllowedHeaders([]string{"X-Requested-With", "Content-Type", "Authorization"}), handlers.AllowedMethods([]string{"GET", "POST", "PUT", "HEAD", "OPTIONS"}), handlers.AllowedOrigins([]string{"*"}))

\thttp.Handle("/", cors(r))
\tserver := httpx.NewServer(":"+HTTPPort, http.DefaultServeMux)
\tserver.WriteTimeout = time.Second * 240

\terr = server.Start()
\tif err != nil {
\t\tlog.Fatal(err)
\t}
}`;

const ROUTES = `// Create a new cart
r.Handle("/cart", http.HandlerFunc(CreateCartHandler)).Methods("POST")
// Get the state of an existing cart
r.Handle("/cart/{workflowID}", http.HandlerFunc(GetCartHandler)).Methods("GET")

// Add a new item to the cart
r.Handle("/cart/{workflowID}/add", http.HandlerFunc(AddToCartHandler)).Methods("PUT")
// Remove an item from the cart
r.Handle("/cart/{workflowID}/remove", http.HandlerFunc(RemoveFromCartHandler)).Methods("PUT")
// Update the cart's associated email address
r.Handle("/cart/{workflowID}/email", http.HandlerFunc(UpdateEmailHandler)).Methods("PUT")
// Check out
r.Handle("/cart/{workflowID}/checkout", http.HandlerFunc(CheckoutHandler)).Methods("PUT")`;

const CREATE_CART_HANDLER = `func CreateCartHandler(w http.ResponseWriter, r *http.Request) {
  // In production you should use uuids or something similar, but the
  // current time is enough for this example. Make sure the Workflow ID
  // is unique every time the user creates a new cart!
\tworkflowID := "CART-" + fmt.Sprintf("%d", time.Now().Unix())

\toptions := client.StartWorkflowOptions{
\t\tID:        workflowID,
\t\tTaskQueue: "CART_TASK_QUEUE",
\t}

\tcart := app.CartState{Items: make([]app.CartItem, 0)}
\twe, err := temporal.ExecuteWorkflow(context.Background(), options, app.CartWorkflow, cart)
\tif err != nil {
\t\tWriteError(w, err)
\t\treturn
\t}

  // Return the \`workflowID\` so clients can use it with other endpoints
\tres := make(map[string]interface{})
\tres["cart"] = cart
\tres["workflowID"] = we.GetID()

\tw.WriteHeader(http.StatusCreated)
\tjson.NewEncoder(w).Encode(res)
}`;

const GET_CART_HANDLER = `func GetCartHandler(w http.ResponseWriter, r *http.Request) {
\tvars := mux.Vars(r)
\tresponse, err := temporal.QueryWorkflow(context.Background(), vars["workflowID"], "", "getCart")
\tif err != nil {
\t\tWriteError(w, err)
\t\treturn
\t}
\tvar res interface{}
\tif err := response.Get(&res); err != nil {
\t\tWriteError(w, err)
\t\treturn
\t}

\tw.WriteHeader(http.StatusOK)
\tjson.NewEncoder(w).Encode(res)
}`;

const ADD_TO_CART_TYPE = `type AddToCartSignal struct {
\tRoute string
\tItem  CartItem
}`;

const ADD_TO_CART_HANDLER = `func AddToCartHandler(w http.ResponseWriter, r *http.Request) {
\tvars := mux.Vars(r)
\tvar item app.CartItem
\terr := json.NewDecoder(r.Body).Decode(&item)
\tif err != nil {
\t\tWriteError(w, err)
\t\treturn
\t}

\tupdate := app.AddToCartSignal{Route: app.RouteTypes.ADD_TO_CART, Item: item}

\terr = temporal.SignalWorkflow(context.Background(), vars["workflowID"], "", "ADD_TO_CART_CHANNEL", update)
\tif err != nil {
\t\tWriteError(w, err)
\t\treturn
\t}

\tw.WriteHeader(http.StatusOK)
\tres := make(map[string]interface{})
\tres["ok"] = 1
\tjson.NewEncoder(w).Encode(res)
}`;

const UPDATE_EMAIL_HANDLER = `func UpdateEmailHandler(w http.ResponseWriter, r *http.Request) {
\tvars := mux.Vars(r)

\tvar body UpdateEmailRequest
\terr := json.NewDecoder(r.Body).Decode(&body)
\tif err != nil {
\t\tWriteError(w, err)
\t\treturn
\t}

\tupdateEmail := app.UpdateEmailSignal{Route: app.RouteTypes.UPDATE_EMAIL, Email: body.Email}

\terr = temporal.SignalWorkflow(context.Background(), vars["workflowID"], "", "UPDATE_CART_CHANNEL", updateEmail)
\tif err != nil {
\t\tWriteError(w, err)
\t\treturn
\t}

\tw.WriteHeader(http.StatusOK)
\tres := make(map[string]interface{})
\tres["ok"] = 1
\tjson.NewEncoder(w).Encode(res)
}`;

export default function EcommerceTutorialPage() {
  return (
    <Layout
      title="Build an eCommerce App With Go"
      description="Four-part tutorial series on building an eCommerce application with Temporal and Go."
    >
      <div className="nd-hub-page">
        <div className={styles.heroBanner}>
          <img
            src="/img/sdk_banners/banner_go.png"
            alt="Temporal Go SDK"
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
                  { label: "Temporal University", href: "/" },
                  { label: "Tutorials", href: "/tutorials" },
                  { label: "Go", href: "/tutorials/go" },
                  { label: "Build an eCommerce App" },
                ]}
              />
            </div>

            <h1 className={styles.title}>Build an eCommerce App With Go</h1>

            <MetaChips items={["~60 minutes", "Beginner", "Go"]} />

            <section className={styles.section} id="introduction">
              <h2 className={styles.sectionTitle}>Introduction</h2>
              <p>
                In this tutorial, you'll implement a web shopping cart using
                Temporal Workflows and Signals. The example patterns here
                use the{" "}
                <a
                  href="https://www.mailgun.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Mailgun
                </a>{" "}
                and{" "}
                <a
                  href="https://stripe.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Stripe
                </a>{" "}
                APIs, so you will need a developer account on both platforms
                to follow along.
              </p>

              <h3>Prerequisites</h3>
              <p>
                You can build the project by following this tutorial, or just
                grab the ready-to-go source from its{" "}
                <a
                  href="https://github.com/temporalio/temporal-ecommerce"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  GitHub repo
                </a>
                . This repository has the full source code and can serve as a
                guide or a fallback if you encounter issues when working
                through this tutorial. If you want to play first and explore
                later, you can come back and read through the how-to and
                background.
              </p>
              <p>
                If you're new to Temporal, follow{" "}
                <Link to="/getting_started/go/dev_environment/">
                  "Set up a local development environment"
                </Link>{" "}
                so you're ready to build Temporal applications with Go.
                Ensure a local Temporal Service is running (e.g. with{" "}
                <a
                  href="https://github.com/temporalio/cli"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  the Temporal CLI
                </a>
                ) and that you can access the Temporal Web UI from port{" "}
                <code>8233</code>. These services are necessary for you to
                build and run this project.
              </p>
            </section>

            <section className={styles.section} id="cart-workflow">
              <h2 className={styles.sectionTitle}>Create the Shopping cart Workflow</h2>
              <p>
                In a typical web app, a user's shopping cart would be stored
                as a row or document in a database. While you can store
                shopping carts in a separate database using Temporal, you
                have another option: you can represent a shopping cart as a{" "}
                <a
                  href="https://temporal.io/blog/very-long-running-workflows"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  long-lived Workflow
                </a>
                . This way, you get the benefits of state tracking without
                needing to sync from external storage.
              </p>
              <p>
                In the Go SDK, a Temporal Workflow is a function that takes
                2 parameters: a Temporal Workflow context <code>ctx</code>{" "}
                and an arbitrary <code>value</code>. Temporal can handle
                pausing and restarting the Workflow as needed - a Workflow
                is a durable construct. Begin by mocking out a{" "}
                <code>workflow.go</code> with <code>CartItem</code> and{" "}
                <code>CartState</code> structs, and a main Workflow function
                called <code>CartWorkflow</code>.
              </p>
              <CodeBlock language="go" title="workflow.go">
                {CART_WORKFLOW_STUB}
              </CodeBlock>
              <p>
                This will be your starting point. Next, you'll add some
                features to the <code>CartWorkflow</code>.
              </p>

              <h3>Add Signal Handling for your cart</h3>
              <p>
                To support adding and removing elements from the cart, the
                Workflow needs to respond to different types of{" "}
                <a
                  href="https://docs.temporal.io/encyclopedia/workflow-message-passing"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Signals
                </a>
                . Signals are a way to notify Workflows of external events.
                In the Go SDK, you use Signal channels to listen for messages
                that either add or remove items from a shopping cart. Add
                these to within your <code>CartWorkflow</code> block:
              </p>
              <CodeBlock language="go">{SIGNAL_HANDLING}</CodeBlock>
              <p>
                Using Signals with the Go SDK usually blocks a Workflow and
                waits for input. The use of a Go <code>selector</code>{" "}
                allows your Workflow to wait for any of several conditions -
                in this case, the <code>ADD_TO_CART</code> or{" "}
                <code>REMOVE_FROM_CART</code> Signals. All the{" "}
                <code>AddToCart()</code> and <code>RemoveFromCart()</code>{" "}
                functions need to do is modify the <code>state.Items</code>{" "}
                array. Temporal is responsible for persisting and
                distributing <code>state</code>.
              </p>
              <p>
                These Signal handlers call some helper functions called{" "}
                <code>AddToCart</code> and <code>RemoveFromCart</code>. Add
                these functions to <code>workflow.go</code>, someplace
                outside of the <code>CartWorkflow</code> block.
              </p>
              <CodeBlock language="go">{ADD_REMOVE_HELPERS}</CodeBlock>
              <p>
                Finally, you'll want to add a Query handler to your{" "}
                <code>CartWorkflow</code>. Queries are read-only operations
                that can be used to get Workflow state. Unlike Signals, they
                do not modify Workflow state. You can add this Query handler
                near the top of your <code>CartWorkflow</code>, right after
                instantiating the logger:
              </p>
              <CodeBlock language="go">{QUERY_HANDLER}</CodeBlock>
              <p>
                Next, you'll look at a case where Temporal's long-running
                Workflows shine: sending a reminder email if the user
                abandons their cart.
              </p>
            </section>

            <section className={styles.section} id="abandoned-cart">
              <h2 className={styles.sectionTitle}>Check for an abandoned cart</h2>
              <p>
                In eCommerce, an abandoned cart is a shopping cart that has
                items, but which the user hasn't added any new items to or
                checked out after a few hours. In a traditional web app
                architecture, abandoned cart notifications can be
                complicated.
              </p>
              <p>
                You might need to use a job queue like{" "}
                <a
                  href="https://en.wikipedia.org/wiki/Celery_(software)"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Celery
                </a>{" "}
                in Python or{" "}
                <a
                  href="https://github.com/RichardKnop/machinery"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Machinery
                </a>{" "}
                in Go. Then, you would schedule a job that checks if the
                cart is abandoned, and reschedule that job every time the
                cart is updated.
              </p>
              <p>
                With Temporal, you don't need a separate job queue. Instead,
                you define a selector with two event handlers: one that
                responds to a Workflow Signal and one that responds to a
                Timer.
              </p>
              <p>
                By creating a new selector on each iteration of the{" "}
                <code>for</code> loop, you're telling Temporal to handle the
                next update cart Signal it receives or send an abandoned
                cart email if it doesn't receive a Signal for{" "}
                <code>abandonedCartTimeout</code>. Wrap your existing Signal
                handling in a loop like this:
              </p>
              <CodeBlock language="go">{ABANDONED_CART_LOOP}</CodeBlock>
              <p>
                You do not need to implement a job queue, write a separate
                Worker, or handle rescheduling jobs. All you need to do is
                create a new Selector after every Signal and use{" "}
                <code>selector.AddFuture()</code> to defer code that needs
                to happen after the associated timeout is selected.
              </p>
              <p>
                Temporal does the hard work of persisting and distributing
                the state of your Workflow for you.
              </p>
              <p>
                Next, let's take a closer look at Activities and the{" "}
                <code>ExecuteActivity()</code> call above that's responsible
                for sending the abandoned cart email.
              </p>
            </section>

            <section className={styles.section} id="activities">
              <h2 className={styles.sectionTitle}>Send emails from an Activity</h2>
              <p>
                You can think of Activities as an abstraction for side
                effects in Temporal.{" "}
                <a
                  href="https://docs.temporal.io/workflows"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Workflows need to be deterministic functions
                </a>{" "}
                to enable Temporal to re-run a Workflow to recreate the
                Workflow's state. Any side effects, like HTTP requests to
                the Mailgun API, should be in an Activity.
              </p>
              <p>
                Create another file named <code>activities.go</code> and
                define a function called <code>SendAbandonedCartEmail</code>.
                The function takes two parameters: the Workflow context and
                the email as a string. You'll also add your{" "}
                <code>MailgunDomain</code> and <code>MailgunKey</code> API
                params here, since your Activity is what contacts the
                Mailgun API.
              </p>
              <CodeBlock language="go" title="activities.go">
                {SEND_EMAIL_ACTIVITY}
              </CodeBlock>
              <p>
                This way, when your Workflow calls{" "}
                <code>workflow.ExecuteActivity(ctx, SendAbandonedCartEmail, state.Email)</code>
                , you'll get all the benefits of Temporal{" "}
                <a
                  href="https://docs.temporal.io/activities"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Activities
                </a>
                , like a configurable{" "}
                <a
                  href="https://docs.temporal.io/encyclopedia/retry-policies"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Retry Policy
                </a>
                .
              </p>

              <h3>Add a Checkout function</h3>
              <p>
                Now that you've added an Activity that contacts the Mailgun
                API, you'll also want an activity that contacts the Stripe
                API upon checkout. Add another Signal{" "}
                <code>selector.AddReceive()</code> case to{" "}
                <code>workflow.go</code>:
              </p>
              <CodeBlock language="go">{CHECKOUT_SIGNAL}</CodeBlock>
              <p>
                This way, a <code>CheckoutSignal</code> will cause your
                Workflow to call a <code>CreateStripeCharge</code> Activity.
                Let's add that Activity to <code>activities.go</code>. First,
                add a <code>StripeKey</code> to the struct that contains
                your Mailgun API credentials:
              </p>
              <CodeBlock language="go">{ACTIVITIES_STRUCT_STRIPE}</CodeBlock>
              <p>
                Next, add that Activity. Of course, this is a minimal
                example, and you can refer to the Stripe API docs to add
                more functionality.
              </p>
              <CodeBlock language="go">{CREATE_STRIPE_CHARGE}</CodeBlock>
              <p>
                With this, you're almost done creating your application.
                You're just missing a couple of essential Temporal
                application components - a Worker and a Starter.
              </p>
            </section>

            <section className={styles.section} id="worker-starter">
              <h2 className={styles.sectionTitle}>Define a Worker and a Starter</h2>
              <p>
                Temporal Workers are the processes that actually execute
                your Workflow and Activity code. You can deploy them in a
                fleet, and there are many ways to{" "}
                <a
                  href="https://temporal.io/blog/scaling-temporal-the-basics"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  scale your Worker deployment
                </a>{" "}
                in different environments. You can define a Worker by
                creating a Temporal client and telling it which{" "}
                <a
                  href="https://docs.temporal.io/workers"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Task Queues
                </a>{" "}
                to listen on and which Workflows and Activities to execute.
                Workers should also bootstrap the various API secrets that
                your application needs access to, which is what you populate
                the struct in <code>activities.go</code> from. Define a
                Worker in a file called <code>worker/main.go</code>:
              </p>
              <CodeBlock language="go" title="worker/main.go">
                {WORKER_MAIN}
              </CodeBlock>
              <p>
                The last thing you need is a Workflow Starter. A Starter is
                the interface that actually kicks off your Workflow. Because
                this application models each shopping cart as its own
                Workflow, your Starter will run for every new session. You
                can also use it to bootstrap some aspects of each session,
                by running Signals or Queries upon creation. Create a
                Starter as <code>start/main.go</code>:
              </p>
              <CodeBlock language="go" title="start/main.go">
                {START_MAIN}
              </CodeBlock>
              <p>
                You now have a completed Temporal app. However, what you
                don't yet have are any tests, or a way for users to actually
                interface with this app. You'll complete those in the rest
                of this tutorial.
              </p>
            </section>

            <section className={styles.section} id="tests">
              <h2 className={styles.sectionTitle}>Write Workflow tests</h2>
              <p>
                Temporal Workflows also make your code easier to test.
                Temporal provides testing utilities that help you stub out
                external services and programmatically advance time, which
                lets you unit test your Workflows. For an example, take a
                look at how{" "}
                <a
                  href="https://temporal.io/case-studies/descript-case-study"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Descript uses Temporal
                </a>
                . Temporal's testing environment also provides utilities for
                mocking Activities and testing logic that executes after a
                delay. That makes it less complicated to unit test
                Workflows that depend on external services or Workflows
                that involve long timeouts.
              </p>
              <p>
                To learn how to implement tests for this application, you
                can refer to{" "}
                <a
                  href="https://github.com/temporalio/temporal-ecommerce/blob/main/workflow_test.go"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  workflow_test.go
                </a>{" "}
                and{" "}
                <a
                  href="https://github.com/temporalio/temporal-ecommerce?tab=readme-ov-file#notes-on-testing"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Notes on Testing
                </a>{" "}
                in the GitHub repo for this tutorial, or watch the{" "}
                <a
                  href="https://www.youtube.com/watch?v=-GKxFDQSlEU"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  walkthrough video
                </a>
                .
              </p>
              <p>
                Finally, you'll need some kind of public interface to your
                app, like a REST API in a web app.
              </p>
            </section>

            <section className={styles.section} id="rest-api">
              <h2 className={styles.sectionTitle}>Create a REST API</h2>
              <p>
                You can build a RESTful API on top of Temporal by making
                HTTP POST requests create Workflows, GET requests execute
                Queries, and PUT requests execute Signals.
              </p>
              <p>
                Because all of the work of updating your shopping cart
                happens in the Worker process, you can scale your API
                servers independently of your Worker processes, and rely on
                the Temporal server to handle the distributed computing.
              </p>

              <h3>API Setup</h3>
              <p>
                For this tutorial, you'll be using{" "}
                <a
                  href="https://github.com/bojanz/httpx"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  httpx
                </a>{" "}
                along with{" "}
                <a
                  href="https://github.com/gorilla/mux"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  mux
                </a>{" "}
                for routing and{" "}
                <a
                  href="https://github.com/gorilla/handlers"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  handlers
                </a>{" "}
                for CORS.
              </p>
              <p>
                Create another file called <code>webapp/main.go</code> and
                add some httpx routes:
              </p>
              <CodeBlock language="go" title="webapp/main.go">
                {WEBAPP_MAIN}
              </CodeBlock>
              <p>
                The API endpoints will be able to create Workflows and
                execute Signals and Queries. For the purposes of this app,
                HTTP GET requests execute Queries, HTTP PUT or PATCH
                requests send Signals, and HTTP POST requests create new
                Workflows.
              </p>
              <CodeBlock language="go">{ROUTES}</CodeBlock>
              <p>
                Your new Web API server and the{" "}
                <a
                  href="https://docs.temporal.io/workers"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Temporal Worker
                </a>{" "}
                are totally separate processes. Your API server is just an
                intermediary between the Temporal server and your API
                server's clients. The{" "}
                <a
                  href="https://docs.temporal.io/workflows#event-history"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Event History
                </a>{" "}
                representing the cart is stored in the Temporal server.
              </p>

              <h3>Handler Functions</h3>
              <p>
                Take a look at the <code>POST /cart</code> endpoint. Since
                an individual shopping cart is represented as a Workflow,
                the <code>CreateCartHandler()</code> function will create a
                new Workflow using <code>ExecuteWorkflow()</code>. For the
                purposes of this app, we need to make sure each{" "}
                <code>POST /cart</code> call creates a Workflow creates a
                unique <code>workflowID</code>.
              </p>
              <CodeBlock language="go">{CREATE_CART_HANDLER}</CodeBlock>
              <p>
                Now you have a <code>POST /cart</code> endpoint that creates
                a new empty cart, and returns the <code>workflowID</code>{" "}
                that uniquely identifies this Workflow.
              </p>
              <p>
                The next endpoint is <code>GET /cart/{`{workflowID}`}</code>,
                which returns the current state of the cart with the given{" "}
                <code>WorkflowID</code>. Below is the{" "}
                <code>GetCartHandler()</code> function, which gets the{" "}
                <code>workflowID</code> from the URL and executes a Query
                for the current state of the cart.
              </p>
              <CodeBlock language="go">{GET_CART_HANDLER}</CodeBlock>

              <h3>PUT Requests and Signals</h3>
              <p>
                For this app, HTTP PUT requests correspond to Temporal
                Signals. That means, in addition to the{" "}
                <code>workflowID</code>, you need to send Signal arguments.
              </p>
              <CodeBlock language="go">{ADD_TO_CART_TYPE}</CodeBlock>
              <p>
                The <code>PUT /cart/{`{workflowID}`}/add</code> handler
                needs to convert the HTTP request body into an{" "}
                <code>AddToCartSignal</code> as shown below.
              </p>
              <CodeBlock language="go">{ADD_TO_CART_HANDLER}</CodeBlock>
              <p>
                The <code>PUT /cart/{`{workflowID}`}/remove</code> and{" "}
                <code>PUT /cart/{`{workflowID}`}/email</code> handlers are
                almost identical, except they send{" "}
                <code>RemoveFromCartSignal</code> and{" "}
                <code>UpdateEmailSignal</code>, not{" "}
                <code>AddToCartSignal</code>.
              </p>
              <CodeBlock language="go">{UPDATE_EMAIL_HANDLER}</CodeBlock>
              <p>
                With that, you should have a complete REST API interface to
                your eCommerce application. From here, you can build a
                user-friendly frontend, or continue to add features. The{" "}
                <a
                  href="https://github.com/temporalio/temporal-ecommerce/tree/main/frontend"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  GitHub repo
                </a>{" "}
                for this tutorial contains an example of a frontend that
                you can take from here.
              </p>
              <p>
                <img
                  src={`${IMG_BASE}/frontend.png`}
                  alt="An example frontend for this application"
                  className={styles.diagramImage}
                />
              </p>
            </section>

            <section className={styles.section} id="conclusion">
              <h2 className={styles.sectionTitle}>Conclusion</h2>
              <p>
                In this tutorial, you created a shopping cart Workflow. You
                used Temporal Signals and Queries to handle state tracking
                without needing to write to an external database for each
                eCommerce session.
              </p>

              <Admonition type="info" title="What's next?">
                <p>
                  Now that you've completed this tutorial, check out some
                  other great{" "}
                  <Link to="/tutorials/go/">Temporal Go projects</Link> or
                  learn more about Temporal by taking our{" "}
                  <Link to="/courses/">free courses</Link>. We provide
                  hands-on projects for supported SDK languages including
                  Go, Java, Python, TypeScript, and PHP.
                </p>
              </Admonition>
            </section>
          </main>
        </div>

        <NotifyBanner />
      </div>
    </Layout>
  );
}

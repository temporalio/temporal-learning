
import React from 'react';

import Link from "@docusaurus/Link";

export default function Intro() {
  return (

  <div className="container">
    <div className="row">
      <div className="col col--12">
        <p>
          <a href="https://temporal.io/">Temporal</a> is a developer-first, open source platform that ensures the successful execution of services and applications. Build your next application with Temporal with hands-on tutorials and courses.
        </p>
      </div>
    </div>

    <div className="row">
      <div className="col col--6">
        <h2><Link to="getting_started" className="hover:underline" >Get started with Temporal</Link></h2>
        <p>
          New to Temporal? Start your journey here by setting up your development environment, running an existing Temporal app, and then building your first app from scratch using our SDKs.
        </p>
      </div>
      <div className="col col--6">
        <h2><Link to="courses" className="hover:underline" >Courses</Link></h2>
        <p>
          Learn and apply Temporal concepts in our free self-paced hands-on courses.
        </p>
      </div>
    </div>

    <div className="row">
      <div className="col col--6">
        <h2><Link to="tutorials" className="hover:underline" > Project-based tutorials</Link></h2>
        <p>
          Take what you've learned and build some real-world applications that use Temporal's features in hands-on tutorials.
        </p>
      </div>
      <div className="col col--6">
        <h2><Link to="examples" className="hover:underline" >Example applications</Link></h2>
        <p>
          Explore example applications that use Temporal and gain a clearer understanding of how everything fits together in a larger, more complex application.
        </p>
      </div>
    </div>
  </div>
  );
}

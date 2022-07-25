
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
        <h2><Link to="getting_started" className="hover:underline" >
          <a className="font-normal">Getting Started with Temporal</a>
        </Link></h2>
        <p>
          New to Temporal? Start your journey by running an existing Temporal app, and then and build your first app from scratch using our SDKs.
        </p>
      </div>
      <div className="col col--6">
        <h2><Link to="courses" className="hover:underline" >
          <a className="font-normal">Courses</a>
        </Link></h2>
        <p>
          Learn and apply Temporal concepts in our self-paced hands-on courses (coming soon.)
        </p>
      </div>
    </div>

    <div className="row">
      <div className="col col--6">
        <h2><Link to="tutorials" className="hover:underline" >
          <a className="font-normal">Project-based Tutorials</a>
        </Link></h2>
        <p>
          Take what you've learned and build some real-world applications that use Temporal's features in hands-on tutorials.
        </p>
      </div>
      <div className="col col--6">
        <h2><Link to="examples" className="hover:underline" >
          <a className="font-normal">Example Applications</a>
        </Link></h2>
        <p>
          Explore example applications that use Temporal and gain a clearer understanding of how everything fits together in a larger, more complex application.
        </p>
      </div>
    </div>
  </div>
  );
}

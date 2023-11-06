'use strict';
/*
 Script to generate course landing pages from TalentLMS API.
 For each course in the API, generates a course landing page
 with the link to the LMS.

 API token required. Set `LMS_API_TOKEN`


*/

const https = require('https');
const LMS_API_TOKEN = process.env.LMS_API_TOKEN;

const courseData = [
  {code: '101_go', language: "Go", banner: "![Temporal Go SDK](/img/sdk_banners/banner_go.png)", filename: "temporal_101/go.md", index: 1,
    keywords: "[Temporal, Workflows, Activities, Go SDK, external service, recovery, execution model, event history, Temporal Web UI, command-line tools, business process, application lifecycle]",
    description: "Discover the essentials of Temporal application development in this course, focusing on Workflows, Activities, and the Go SDK. You'll develop a small app, recover from failures, and use Temporal's execution model and tools to manage your application lifecycle effectively."
  },
  {code: '102_go', language: "Go", banner: "![Temporal Go SDK](/img/sdk_banners/banner_go.png)", filename: "temporal_102/go.md", index: 1,
    keywords: "[Temporal, application development, durable execution, development lifecycle, testing, debugging, deployment, best practices, automated testing, event history, workflow execution, production updates]",
    description: "Go beyond the basics and gain a deeper understand of how Temporal works as you explore Temporal's event history, application lifecycle, write tests, and explore Durable Execution.."
  },
  {code: '102_java', language: "Java", banner: "![Temporal Java SDK](/img/sdk_banners/banner_java.png)", filename: "temporal_102/java.md", index: 2,
    keywords: "[Temporal, application development, durable execution, development lifecycle, testing, debugging, deployment, best practices, automated testing, event history, workflow execution, production updates]",
    description: "Go beyond the basics and gain a deeper understand of how Temporal works as you explore Temporal's event history, application lifecycle, write tests, and explore Durable Execution.."
  },
  {code: '101_typescript', language: "TypeScript", banner: "![Temporal TypeScript SDK](/img/sdk_banners/banner_typescript.png)", filename: "temporal_101/typescript.md", index: 2,
    keywords: "[Temporal, Workflows, Activities, TypeScript SDK, external service, recovery, execution model, event history, Temporal Web UI, command-line tools, business process, application lifecycle]",
    description: "Discover the essentials of Temporal application development in this course, focusing on Workflows, Activities, and the TypeScript SDK. You'll develop a small app, recover from failures, and use Temporal's execution model and tools to manage your application lifecycle effectively."
  },
  {code: '101_java', language: "Java", banner: "![Temporal Java SDK](/img/sdk_banners/banner_java.png)", filename: "temporal_101/java.md", index: 3,
    keywords: "[Temporal, Workflows, Activities, Java SDK, external service, recovery, execution model, event history, Temporal Web UI, command-line tools, business process, application lifecycle]",
    description: "Discover the essentials of Temporal application development in this course, focusing on Workflows, Activities, and the Java SDK. You'll develop a small app, recover from failures, and use Temporal's execution model and tools to manage your application lifecycle effectively."
  },
  {code: '101_python', language: "Python", banner: "![Temporal Python SDK](/img/sdk_banners/banner_python.png)", filename: "temporal_101/python.md", index: 4,
    keywords: "[Temporal, Workflows, Activities, Python SDK, external service, recovery, execution model, event history, Temporal Web UI, command-line tools, business process, application lifecycle]",
    description: "Discover the essentials of Temporal application development in this course, focusing on Workflows, Activities, and the Python SDK. You'll develop a small app, recover from failures, and use Temporal's execution model and tools to manage your application lifecycle effectively."
  },
  {code: `intro2cld`, language: "Temporal Cloud", banner: "", filename: "intro_to_temporal_cloud/index.md", index: 1,
    keywords: '[Temporal Cloud, Web UI, Temporal Platform, Namespaces, user management, roles and permissions, custom Search Attribute, third-party observability tool, account-level usage, Namespace-level usage, evaluating Temporal Cloud]',
    description: "Master the essentials of Temporal Cloud with this comprehensive course. Dive into Web UI navigation, Namespace setup, user management, custom Search Attribute definition, and more. Perfect for newcomers, it simplifies onboarding and benefits even those evaluating Temporal Cloud's potential."
  }
]

const options = {
  hostname: 'temporal.talentlms.com',
  auth: `${LMS_API_TOKEN}:`,
  path: '/api/v1/courses',
  port: 443,
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
  },
};

const req = https.request(options, res => {
  // console.log(`statusCode: ${res.statusCode}`);

  let data = "";

  res.on('data', function (chunk) {
      data += chunk;
  });

  res.on('end', function() {
    const url = 'https://temporal.talentlms.com/catalog';
    const fs = require('fs');

    //console.log(data)
    let courses = JSON.parse(data);
    //console.log(courses)

    // only get the courses we care about.
    let allowlist = courseData.map(c => c.code)
    courses = courses.filter(course => allowlist.includes(course.code) );

    for (let course of courses) {

      let metadata = courseData.find(c => c.code === course.code);

      let md = generateMarkdown(course, metadata, url, metadata.index)

      let filename = metadata.filename;

      console.log(filename)

      fs.writeFileSync(`docs/courses/${filename}`, md);
    }
  });
});

req.on('error', error => {
  console.error(error);
});

req.end();


/* generate the markdown for the course.
 *
 * Takes the course data, the base url, and an index which specifies
 * the sidebar position.
 */
function generateMarkdown(course, metadata, base_url, index) {
  console.log(metadata)
  let today = (new Date()).toString().split(' ').splice(1,3).join(' ');

  let active = course.status === "active";
  let publicCourse = course.shared === 1;
  let url = `${base_url}/info/id:${course.id}`;
  let apidate = course.last_update_on;
  let dateparts = apidate.split(",")[0];
  let [dd,mm,yy] = dateparts.split("/");
  let date = `${yy}-${mm}-${dd}`

  let str = `---
title: "${course.name}"
sidebar_position: ${index}
sidebar_label: "${course.name}"
public: ${publicCourse}
draft: ${!active}
tags: [courses, ${metadata.language}]
keywords: ${metadata.keywords}
description: "${metadata.description}"
custom_edit_url: null
hide_table_of_contents: true
last_update:
  date: ${date}
image: /img/temporal-logo-twitter-card.png
---

<!-- Generated ${today} -->
<!-- DO NOT edit this file directly. -->

${metadata.banner}

`
if (!active) {
  str += `:::info Course coming soon!
We're still building this course. The course outcomes and content are subject to change.

<a className="button button--primary" href="https://pages.temporal.io/get-updates-education">Get notified when we launch this course!</a>

:::

`
}

str += course.description + '\n\n';

if (active) {
  str += ` <a className="button button--primary" href="${url}">Go to Course</a> `;
}else{
  str += "This course is coming soon.\n\n"
  str += ` <a className="button button--primary" href="https://pages.temporal.io/get-updates-education">Get notified when we launch this course!</a> `;
}

  return str;
}

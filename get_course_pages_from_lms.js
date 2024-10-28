'use strict';
/*
 Script to generate course landing pages from TalentLMS API.
 For each course in the API, generates a course landing page
 with the link to the LMS.

 API token required. Set `LMS_API_TOKEN`


*/

const https = require('https');
const LMS_API_TOKEN = process.env.LMS_API_TOKEN;

/*
 * This is the course data we care about. The LMS will have other courses. This is the detail about the courses
 * we need to display on the site.
 * We'll pull the courses from TalentLMS and pare that list down to this list.
 * The "code" field is the course code in the LMS - that's the "key" that maps this data to LMS data.
*/
const courseData = [
  {code: '101_go', main: true, language: "Go", banner: "![Temporal Go SDK](/img/sdk_banners/banner_go.png)", filename: "temporal_101/go.md", index: 1,
    keywords: "[Temporal, Workflows, Activities, Go SDK, external service, recovery, execution model, event history, Temporal Web UI, command-line tools, business process, application lifecycle]",
    metaDescription: "Discover the essentials of Temporal application development in this course, focusing on Workflows, Activities, and the Go SDK. You'll develop a small app, recover from failures, and use Temporal's execution model and tools to manage your application lifecycle effectively."
  },
  {code: '101_typescript', language: "TypeScript", banner: "![Temporal TypeScript SDK](/img/sdk_banners/banner_typescript.png)", filename: "temporal_101/typescript.md", index: 3,
    keywords: "[Temporal, Workflows, Activities, TypeScript SDK, external service, recovery, execution model, event history, Temporal Web UI, command-line tools, business process, application lifecycle]",
    metaDescription: "Discover the essentials of Temporal application development in this course, focusing on Workflows, Activities, and the TypeScript SDK. You'll develop a small app, recover from failures, and use Temporal's execution model and tools to manage your application lifecycle effectively."
  },
  {code: '101_java', language: "Java", banner: "![Temporal Java SDK](/img/sdk_banners/banner_java.png)", filename: "temporal_101/java.md", index: 2,
    keywords: "[Temporal, Workflows, Activities, Java SDK, external service, recovery, execution model, event history, Temporal Web UI, command-line tools, business process, application lifecycle]",
    metaDescription: "Discover the essentials of Temporal application development in this course, focusing on Workflows, Activities, and the Java SDK. You'll develop a small app, recover from failures, and use Temporal's execution model and tools to manage your application lifecycle effectively."
  },
  {code: '101_python', language: "Python", banner: "![Temporal Python SDK](/img/sdk_banners/banner_python.png)", filename: "temporal_101/python.md", index: 4,
    keywords: "[Temporal, Workflows, Activities, Python SDK, external service, recovery, execution model, event history, Temporal Web UI, command-line tools, business process, application lifecycle]",
    metaDescription: "Discover the essentials of Temporal application development in this course, focusing on Workflows, Activities, and the Python SDK. You'll develop a small app, recover from failures, and use Temporal's execution model and tools to manage your application lifecycle effectively."
  },
  {code: '102_go_r2', main: true, language: "Go", banner: "![Temporal Go SDK](/img/sdk_banners/banner_go.png)", filename: "temporal_102/go.md", index: 1,
    keywords: "[Temporal, application development, durable execution, development lifecycle, testing, debugging, deployment, best practices, automated testing, event history, workflow execution, production updates]",
    metaDescription: "Go beyond the basics and gain a deeper understand of how Temporal works as you explore Temporal's event history, application lifecycle, write tests, and explore Durable Execution."
  },
  {code: '102_java', language: "Java", banner: "![Temporal Java SDK](/img/sdk_banners/banner_java.png)", filename: "temporal_102/java.md", index: 2,
    keywords: "[Temporal, application development, durable execution, development lifecycle, testing, debugging, deployment, best practices, automated testing, event history, workflow execution, production updates]",
    metaDescription: "Go beyond the basics and gain a deeper understand of how Temporal works as you explore Temporal's event history, application lifecycle, write tests, and explore Durable Execution."
  },
  {code: '102_ts', language: "TypeScript", banner: "![Temporal TypeScript SDK](/img/sdk_banners/banner_typescript.png)", filename: "temporal_102/typescript.md", index: 3,
    keywords: "[Temporal, application development, durable execution, development lifecycle, testing, debugging, deployment, best practices, automated testing, event history, workflow execution, production updates]",
    metaDescription: "Go beyond the basics and gain a deeper understand of how Temporal works as you explore Temporal's event history, application lifecycle, write tests, and explore Durable Execution."
  },
  {code: '102_python', language: "Python", banner: "![Temporal Python SDK](/img/sdk_banners/banner_python.png)", filename: "temporal_102/python.md", index: 4,
    keywords: "[Temporal, application development, durable execution, development lifecycle, testing, debugging, deployment, best practices, automated testing, event history, workflow execution, production updates]",
    metaDescription: "Go beyond the basics and gain a deeper understand of how Temporal works as you explore Temporal's event history, application lifecycle, write tests, and explore Durable Execution."
  },
  {
    code: 'versioning_go', main: true, language: "Go", banner: "![Temporal Go SDK](/img/sdk_banners/banner_go.png)", filename: "versioning/go.md", index: 1,
    keywords: "[Temporal, application development, durable execution, development lifecycle, testing, debugging, deployment, best practices, automated testing, event history, workflow execution, production updates]",
    metaDescription: "In this course, you'll go beyond the fundamentals, learning how to safely evolve your Temporal application code in production. There are three primary approaches to versioning Temporal Workflows."
  },
  {
    code: 'versioning_java', language: "Java", banner: "![Temporal Java SDK](/img/sdk_banners/banner_java.png)", filename: "versioning/java.md", index: 2,
    keywords: "[Temporal, application development, durable execution, development lifecycle, testing, debugging, deployment, best practices, automated testing, event history, workflow execution, production updates]",
    metaDescription: "In this course, you'll go beyond the fundamentals, learning how to safely evolve your Temporal application code in production. There are three primary approaches to versioning Temporal Workflows."
  },
  {
    code: 'versioning_ts', language: "TypeScript", banner: "![Temporal TypeScript SDK](/img/sdk_banners/banner_typescript.png)", filename: "versioning/typescript.md", index: 3,
    keywords: "[Temporal, application development, durable execution, development lifecycle, testing, debugging, deployment, best practices, automated testing, event history, workflow execution, production updates]",
    metaDescription: "In this course, you'll go beyond the fundamentals, learning how to safely evolve your Temporal application code in production. There are three primary approaches to versioning Temporal Workflows."
  },
  {
    code: 'versioning_python', language: "Python", banner: "![Temporal Python SDK](/img/sdk_banners/banner_python.png)", filename: "versioning/python.md", index: 4,
    keywords: "[Temporal, application development, durable execution, development lifecycle, testing, debugging, deployment, best practices, automated testing, event history, workflow execution, production updates]",
    metaDescription: "In this course, you'll go beyond the fundamentals, learning how to safely evolve your Temporal application code in production. There are three primary approaches to versioning Temporal Workflows."
  },
  {
    code: 'appdatasec_go', main: true, language: "Go", banner: "![Temporal Go SDK](/img/sdk_banners/banner_go.png)", filename: "appdatasec/go.md", index: 1,
    keywords: "[Temporal, application development, security, converters, deployment, best practices, codecs, compression, encryption, encoding, decoding, serialization, key rotation]",
    metaDescription: "In this course, you'll implement Custom Data Conversion for your Temporal Workflows. By implementing Custom Data Converters and a Codec Server, you can expand this behavior to support a variety of complex input and output data."
  },
  {
    code: 'appdatasec_java', language: "Java", banner: "![Temporal Java SDK](/img/sdk_banners/banner_java.png)", filename: "appdatasec/java.md", index: 2,
    keywords: "[Temporal, application development, security, converters, deployment, best practices, codecs, compression, encryption, encoding, decoding, serialization, key rotation]",
    metaDescription: "In this course, you'll implement Custom Data Conversion for your Temporal Workflows. By implementing Custom Data Converters and a Codec Server, you can expand this behavior to support a variety of complex input and output data."
  },
  {
    code: 'appdatasec_ts', language: "TypeScript", banner: "![Temporal TypeScript SDK](/img/sdk_banners/banner_typescript.png)", filename: "appdatasec/typescript.md", index: 3,
    keywords: "[Temporal, application development, security, converters, deployment, best practices, codecs, compression, encryption, encoding, decoding, serialization, key rotation]",
    metaDescription: "In this course, you'll implement Custom Data Conversion for your Temporal Workflows. By implementing Custom Data Converters and a Codec Server, you can expand this behavior to support a variety of complex input and output data."
  },
  {
    code: 'appdatasec_python', language: "Python", banner: "![Temporal Python SDK](/img/sdk_banners/banner_python.png)", filename: "appdatasec/python.md", index: 4,
    keywords: "[Temporal, application development, security, converters, deployment, best practices, codecs, compression, encryption, encoding, decoding, serialization, key rotation]",
    metaDescription: "In this course, you'll implement Custom Data Conversion for your Temporal Workflows. By implementing Custom Data Converters and a Codec Server, you can expand this behavior to support a variety of complex input and output data."
  },
  {
    code: `intro2cld`, main: true, language: "Temporal Cloud", banner: "", filename: "intro_to_temporal_cloud/index.md", index: 3,
    keywords: '[Temporal Cloud, Web UI, Temporal Platform, Namespaces, user management, roles and permissions, custom Search Attribute, third-party observability tool, account-level usage, Namespace-level usage, evaluating Temporal Cloud]',
    metaDescription: "Master the essentials of Temporal Cloud with this comprehensive course. Dive into Web UI navigation, Namespace setup, user management, custom Search Attribute definition, and more. Perfect for newcomers, it simplifies onboarding and benefits even those evaluating Temporal Cloud's potential."
  },
  {
    code: `interactwf_ts`, main: true, language: "TypeScript", banner: "![Temporal TypeScript SDK](/img/sdk_banners/banner_typescript.png)", filename: "interacting_with_workflows/typescript.md", index: 3, keywords: '[Temporal, application development, best practices, signals, queries, asynchronous activity completion, async activity completion, cancellations, search attributes]', metaDescription: "In this course, you'll expand your ability to write dynamic Workflows by learning how to interact with them and enabling them to respond to external stimuli."
  },  
  {
    code: `interactwf_go`, main: true, language: "Go", banner: "![Temporal Go SDK](/img/sdk_banners/banner_go.png)", filename: "interacting_with_workflows/go.md", index: 3,keywords: '[Temporal, application development, best practices, signals, queries, asynchronous activity completion, async activity completion, cancellations, search attributes]', metaDescription: "In this course, you'll expand your ability to write dynamic Workflows by learning how to interact with them and enabling them to respond to external stimuli."
  },
  {
    code: `interactwf_java`, main: true, language: "Java", banner: "![Temporal Java SDK](/img/sdk_banners/banner_java.png)", filename: "interacting_with_workflows/java.md", index: 3,keywords: '[Temporal, application development, best practices, signals, queries, asynchronous activity completion, async activity completion, cancellations, search attributes]', metaDescription: "In this course, you'll expand your ability to write dynamic Workflows by learning how to interact with them and enabling them to respond to external stimuli."
  },
  {
    code: `interactwf_python`, main: true, language: "Python", banner: "![Temporal Python SDK](/img/sdk_banners/banner_python.png)", filename: "interacting_with_workflows/python.md", index: 3, keywords: '[Temporal, application development, best practices, signals, queries, asynchronous activity completion, async activity completion, cancellations, search attributes]', metaDescription: "In this course, you'll expand your ability to write dynamic Workflows by learning how to interact with them and enabling them to respond to external stimuli."
  },
  {
    code: `errstrat_typescript`, 
    main: true, 
    language: "TypeScript", 
    banner: "![Temporal TypeScript SDK](/img/sdk_banners/banner_typescript.png)", 
    filename: "errstrat/typescript.md", 
    index: 4, 
    keywords: '[Temporal, application development, best practices, failures, errors, timeouts, retry policies, heartbeats, saga pattern, non-retryable errors, idempotence]', 
    metaDescription: "In this course, you will design and implement effective error handling strategies that map your business logic to the Temporal platform. You will explore the nature of different types of failures and investigate the support that Temporal provides for addressing them. Along the way, you will learn essential concepts and techniques, such as idempotence, Heartbeating, and the Saga Pattern, which will help you to ensure the correctness and responsiveness of your application."
  },  
  {
    code: `errstrat_go`, 
    main: true, 
    language: "Go", 
    banner: "![Temporal Go SDK](/img/sdk_banners/banner_go.png)", 
    filename: "errstrat/go.md", 
    index: 1,
    keywords: '[Temporal, application development, best practices, failures, errors, timeouts, retry policies, heartbeats, saga pattern, non-retryable errors, idempotence]', 
    metaDescription: "In this course, you will design and implement effective error handling strategies that map your business logic to the Temporal platform. You will explore the nature of different types of failures and investigate the support that Temporal provides for addressing them. Along the way, you will learn essential concepts and techniques, such as idempotence, Heartbeating, and the Saga Pattern, which will help you to ensure the correctness and responsiveness of your application."
  },
  {
    code: `errstrat_java`, 
    main: true, 
    language: "Java", 
    banner: "![Temporal Java SDK](/img/sdk_banners/banner_java.png)", 
    filename: "errstrat/java.md", 
    index: 2,
    keywords: '[Temporal, application development, best practices, failures, errors, timeouts, retry policies, heartbeats, saga pattern, non-retryable errors, idempotence]', 
    metaDescription: "In this course, you will design and implement effective error handling strategies that map your business logic to the Temporal platform. You will explore the nature of different types of failures and investigate the support that Temporal provides for addressing them. Along the way, you will learn essential concepts and techniques, such as idempotence, Heartbeating, and the Saga Pattern, which will help you to ensure the correctness and responsiveness of your application."
  },
  {
    code: `errstrat_python`, 
    main: true, 
    language: "Python", 
    banner: "![Temporal Python SDK](/img/sdk_banners/banner_python.png)", 
    filename: "errstrat/python.md", 
    index: 3, 
    keywords: '[Temporal, application development, best practices, failures, errors, timeouts, retry policies, heartbeats, saga pattern, non-retryable errors, idempotence]', 
    metaDescription: "In this course, you will design and implement effective error handling strategies that map your business logic to the Temporal platform. You will explore the nature of different types of failures and investigate the support that Temporal provides for addressing them. Along the way, you will learn essential concepts and techniques, such as idempotence, Heartbeating, and the Saga Pattern, which will help you to ensure the correctness and responsiveness of your application."
  },
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
    const baseURL = 'https://temporal.talentlms.com/catalog';

    // console.log(data)

    let courses = JSON.parse(data);
    //console.log(courses)

    // only get the courses we care about.
    let allowlist = courseData.map(c => c.code)
    courses = courses.filter(course => allowlist.includes(course.code) );

    // iterate over courses and fill out metadata to generate individual pages.
    for (let course of courses) {
      let metadata = courseData.find(c => c.code === course.code);

      // push the fields from the LMS into the metadata
      metadata.hours = convertHours(course.custom_field_2);
      metadata.description = course.description;
      metadata.name = course.name;
      metadata.status = course.status;
      metadata.shared = course.shared;
      metadata.id = course.id;
      metadata.last_update_on = course.last_update_on;
      metadata.filepath = `docs/courses/${metadata.filename}`;

      generateCoursePage(metadata, baseURL)
    }


  });
});

req.on('error', error => {
  console.error(error);
});

req.end();


function convertHours(hours) {
  let result = "";
  if (parseInt(hours) > 1) {
    result = `⏱️ ${hours} hours`
  }else {
    result = `⏱️ ${hours} hour`
  }
  return(result);
}

/* generate the markdown for the course.
 *
 * Takes the course data and base URL.
 */
function generateCoursePage(metadata, baseURL) {
  const today = (new Date()).toString().split(' ').splice(1,3).join(' ');

  const active = metadata.status === "active";
  const url = `${baseURL}/info/id:${metadata.id}`;
  const apidate = metadata.last_update_on;
  const dateparts = apidate.split(",")[0];
  const [dd,mm,yy] = dateparts.split("/");
  const date = `${yy}-${mm}-${dd}`;
  const hours = metadata.hours;

  // parse text from LMS and massage
  const description = metadata.description.replace("Prerequisites:", "### Prerequisites:")

  let str = `---
title: "${metadata.name}"
sidebar_position: ${metadata.index}
sidebar_label: "${metadata.name}"
draft: ${!active}
tags: [courses, ${metadata.language}]
keywords: ${metadata.keywords}
description: "${metadata.metaDescription}"
custom_edit_url: null
hide_table_of_contents: true
last_update:
  date: ${date}
image: /img/temporal-logo-twitter-card.png
---

<!-- Generated ${today} -->
<!-- DO NOT edit this file directly. -->

${metadata.banner}

**Estimated time**: ~${hours}, self-paced.

**Cost**: Free

`
if (!active) {
  str += `:::info Course coming soon!
We're still building this course. The course outcomes and content are subject to change.

<a className="button button--primary" href="https://pages.temporal.io/get-updates-education">Get notified when we launch this course!</a>

:::

`
}

str += "## Description\n\n" + description + '\n\n';

if (active) {
  str += ` <a className="button button--primary" href="${url}">Go to Course</a> `;
}else{
  str += "This course is coming soon.\n\n"
  str += ` <a className="button button--primary" href="https://pages.temporal.io/get-updates-education">Get notified when we launch this course!</a> `;
}

// write it
  const fs = require('fs');
  console.log(metadata.filepath)
  fs.writeFileSync(metadata.filepath, str);
}



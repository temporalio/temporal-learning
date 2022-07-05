'use strict';
/*
 Script to generate course landing pages from TalentLMS API.
 For each course in the API, generates a course landing page
 with the link to the LMS.

 API token required. Set `LMS_API_TOKEN`


*/

const https = require('https');
const LMS_API_TOKEN = process.env.LMS_API_TOKEN;

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

  res.on('data', (data) => {
    const url = 'https://temporal.talentlms.com/catalog';
    const fs = require('fs');

    let courses = JSON.parse(data);

    for (let course of courses) {
      let md = generateMarkdown(course, url)

      let filename = course.name.replace(/[^a-z0-9]/gi, '_').toLowerCase() + ".md";
      console.log(filename)
      fs.writeFileSync(`docs/courses/${filename}`, md);
    }
  });
});

req.on('error', error => {
  console.error(error);
});

req.end();


function generateMarkdown(course, base_url) {
  let draft = course.status !== "active";
  let publicCourse = course.shared === 1;
  let url = `${base_url}/info/id:${course.id}`;
  let str = `---
title: ${course.name}
draft: ${draft}
public: ${publicCourse}
courseUrl: ${url}
custom_edit_url: null
---

${course.description}

<a className="button button--primary" href="${url}">Go to Course</a>
  `;

  return str;
}

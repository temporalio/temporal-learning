'use strict';

const URL = 'https://temporal.talentlms.com/catalog';
const fs = require('fs');

let rawdata = fs.readFileSync('data/courses.json');
let courses = JSON.parse(rawdata);

for (let course of courses) {
  let md = generateMarkdown(course)

  let filename = course.name.replace(/[^a-z0-9]/gi, '_').toLowerCase() + ".md";
  console.log(md)
  console.log(filename)
  fs.writeFileSync(`docs/courses/${filename}`, md);
}

function generateMarkdown(course) {
  let draft = course.status !== "active";
  let publicCourse = course.shared === 1;
  let url = `${URL}/info/id:${course.id}`;
  let str = `---
title: ${course.name}
draft: ${draft}
public: ${publicCourse}
courseUrl: ${url}
---

${course.description}
  `;

  return str;
}

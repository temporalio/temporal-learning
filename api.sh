#!/usr/bin/env bash

# TalentLMS uses API token as username and no password, so base64 the token + : + nothing to auth.
# cURL could use the -u option but we're going to use this because it's universal.
auth=$(base64 <<< "${LMS_API_TOKEN}:")


# get all courses
curl -XGET -H "Authorization: Basic ${auth}" 'https://temporal.talentlms.com/api/v1/courses' | jq '.'

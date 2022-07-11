#va!/usr/bin/env bash

# first_program
# go
mkdir -p docs/getting_started/go/first_program_in_go/images/
cp -r ~/dev/documentation/static/img/tutorials/go/run-your-first-app-tutorial/* docs/getting_started/go/first_program_in_go/images/
cp ~/dev/documentation/docs/go/run-your-first-app-tutorial.md docs/getting_started/go/first_program_in_go/index_tmp.md
sed -e '/^id\:/a\
sidebar_position: 1'\
    -e '/^id\:/a\
description: In this tutorial you will run your first Temporal app using the Go SDK' \
    -e '/^id\:/a\
keywords: [go, golang, temporal, sdk, tutorial]' \
    -e 's|/img/tutorials/go/run-your-first-app-tutorial/|images/|g' \
    -e 's|../../src/components|@site/src/components|g' \
    -e '/^sidebar_label/d' \
    -e '/Keep reading or follow along with this video walkthrough:/d' \
    -e '/<ResponsivePlayer/d' \
    -e 's|/activities|https://docs.temporal.io/activities|g' \
    -e 's|/concepts/|https://docs.temporal.io/concepts/|g' \
    -e 's|/tctl|https://docs.temporal.io/tctl|g' \
    -e 's|/clusters/|https://docs.temporal.io/clusters/|g' \
    -e 's|/application-development-guide/|https://docs.temporal.io/application-development-guide/|g' \
    -e 's|/go/|https://docs.temporal.io/go/|g' \
    -e 's|^##.*Lore check$|## Review|' \
  docs/getting_started/go/first_program_in_go/index_tmp.md > docs/getting_started/go/first_program_in_go/index.md
  rm docs/getting_started/go/first_program_in_go/index_tmp.md

# Java
mkdir -p docs/getting_started/java/first_program_in_java/images/
cp -r ~/dev/documentation/static/img/tutorials/java/run-your-first-app-tutorial/* docs/getting_started/java/first_program_in_java/images/
cp -r ~/dev/documentation/static/img/tutorials/go/run-your-first-app-tutorial/* docs/getting_started/java/first_program_in_java/images/
cp ~/dev/documentation/docs/java/run-your-first-app-tutorial.md docs/getting_started/java/first_program_in_java/index_tmp.md
# rewrite images
sed -e '/^id\:/a\
sidebar_position: 1' \
    -e '/^id\:/a\
description: In this tutorial you will run your first Temporal app using the Java SDK' \
    -e '/^id\:/a\
keywords: [ava, temporal, sdk, tutorial]' \
    -e '/^sidebar_label/d' \
    -e 's|../../src/components|@site/src/components|g' \
    -e '/Keep reading or follow along with this video walkthrough:/d' \
    -e '/<ResponsivePlayer/d' \
    -e 's|/img/tutorials/java/run-your-first-app-tutorial/|images/|g' \
    -e 's|/img/tutorials/go/run-your-first-app-tutorial/|images/|g' \
    -e 's|/concepts/|https://docs.temporal.io/concepts/|g' \
    -e 's|/application-development-guide/|https://docs.temporal.io/application-development-guide/|g' \
    -e 's|/tctl|https://docs.temporal.io/tctl|g' \
    -e 's|/clusters/|https://docs.temporal.io/clusters/|g' \
    -e 's|/java/|https://docs.temporal.io/java/|g' \
    -e 's|^##.*Lore check$|## Review|' \
  docs/getting_started/java/first_program_in_java/index_tmp.md > docs/getting_started/java/first_program_in_java/index.md
rm docs/getting_started/java/first_program_in_java/index_tmp.md

# hello world
# go
mkdir -p docs/getting_started/go/hello_world_in_go/images/
cp ~/dev/documentation/docs/go/hello-world-tutorial.md docs/getting_started/go/hello_world_in_go/index_tmp.md
sed -e '/^id\:/a\
sidebar_position: 1' \
    -e '/^id\:/a\
description: In this tutorial you will build your first Temporal app using the Go SDK' \
    -e '/^id\:/a\
keywords: [golang,go,temporal,sdk,tutorial]' \
    -e '/^sidebar_label/d' \
    -e 's|../../src/components|@site/src/components|g' \
    -e 's|/concepts/|https://docs.temporal.io/concepts/|g' \
    -e 's|/application-development-guide|https://docs.temporal.io/application-development-guide|g' \
    -e 's|/go/|https://docs.temporal.io/go/|g' \
    -e 's|^##.*Lore check$|## Review|' \
  docs/getting_started/go/hello_world_in_go/index_tmp.md > docs/getting_started/go/hello_world_in_go/index.md
rm docs/getting_started/go/hello_world_in_go/index_tmp.md

# java

mkdir -p docs/getting_started/java/hello_world_in_java/images/
cp ~/dev/documentation/docs/java/hello-world-tutorial.md docs/getting_started/java/hello_world_in_java/index_tmp.md
sed -e '/^id\:/a\
sidebar_position: 1' \
    -e '/^id\:/a\
description: In this tutorial you will build your first Temporal app using the Java SDK' \
    -e '/^id\:/a\
keywords: [Java,java,temporal,sdk,tutorial,learn]' \
    -e '/^sidebar_label/d' \
    -e 's|../../src/components|@site/src/components|g' \
    -e 's|/concepts/|https://docs.temporal.io/concepts/|g' \
    -e 's|/application-development-guide|https://docs.temporal.io/application-development-guide|g' \
    -e 's|/java/|https://docs.temporal.io/java/|g' \
    -e 's|^##.*Lore check$|## Review|' \
  docs/getting_started/java/hello_world_in_java/index_tmp.md > docs/getting_started/java/hello_world_in_java/index.md
rm docs/getting_started/java/hello_world_in_java/index_tmp.md

# typescript
mkdir -p docs/getting_started/typescript/hello_world_in_typescript/images/
cp ~/dev/documentation/docs/typescript/hello-world.md docs/getting_started/typescript/hello_world_in_typescript/index_tmp.md
sed -e '/^id\:/a\
sidebar_position: 1' \
    -e '/^id\:/a\
keywords: [typescript, javascript,temporal,sdk,tutorial,learn]' \
    -e '/^sidebar_label/d' \
    -e 's/^title:.*/title: Build a Temporal "Hello World!" app from scratch in TypeScript/g' \
    -e 's|{"enable_source_link": false}||g' \
    -e 's|../../src/components|@site/src/components|g' \
    -e 's|/concepts/|https://docs.temporal.io/concepts/|g' \
    -e 's|/application-development-guide|https://docs.temporal.io/application-development-guide|g' \
    -e 's|/typescript/|https://docs.temporal.io/typescript/|g' \
    -e 's|/typescript/nextjs-tutorial|/docs/tutorials/typescript/nextjs/index.md|g' \
  docs/getting_started/typescript/hello_world_in_typescript/index_tmp.md > docs/getting_started/typescript/hello_world_in_typescript/index.md
rm docs/getting_started/typescript/hello_world_in_typescript/index_tmp.md


mkdir -p docs/tutorials/typescript/nextjs/images
cp -r ~/dev/documentation/docs/typescript/nextjs.md docs/tutorials/typescript/nextjs/index.md2
sed -e '/^id\:/a\
sidebar_position: 2' \
    -e '/^sidebar_label/d' \
    -e 's|../../src/components|@site/src/components|g' \
    -e 's|/concepts/|https://docs.temporal.io/concepts/|g' \
    -e 's|/tctl/|https://docs.temporal.io/tctl/|g' \
    -e 's|/application-development-guide|https://docs.temporal.io/application-development-guide|g' \
    -e 's|/typescript/|https://docs.temporal.io/typescript/|g' \
    docs/tutorials/typescript/nextjs/index.md2 \
    > docs/tutorials/typescript/nextjs/index.md
rm docs/tutorials/typescript/nextjs/index.md2


mkdir -p docs/tutorials/typescript/subscriptions/
cp -r ~/dev/documentation/docs/typescript/tutorial-subscription.md docs/tutorials/typescript/subscriptions/index.md2
sed -e '/^id\:/a\
sidebar_position: 3' \
    -e '/^sidebar_label/d' \
    -e 's|../../src/components|@site/src/components|g' \
    -e 's|/concepts/|https://docs.temporal.io/concepts/|g' \
    -e 's|/application-development-guide|https://docs.temporal.io/application-development-guide|g' \
    -e 's|/typescript/|https://docs.temporal.io/typescript/|g' \
    -e 's|/typescript/nextjs-tutorial|/docs/tutorials/typescript/nextjs/index.md|g' \
    docs/tutorials/typescript/subscriptions/index.md2 \
    > docs/tutorials/typescript/subscriptions/index.md
rm docs/tutorials/typescript/subscriptions/index.md2

mkdir -p docs/tutorials/typescript/chatbot/
cp -r ~/dev/documentation/docs/typescript/tutorial-chatbot.md docs/tutorials/typescript/chatbot/index.md2
sed -e '/^id\:/a\
sidebar_position: 4' \
    -e '/^sidebar_label/d' \
    -e 's|../../src/components|@site/src/components|g' \
    -e 's|/concepts/|https://docs.temporal.io/concepts/|g' \
    -e 's|/application-development-guide|https://docs.temporal.io/application-development-guide|g' \
    -e 's|/typescript/|https://docs.temporal.io/typescript/|g' \
    docs/tutorials/typescript/chatbot/index.md2 \
    > docs/tutorials/typescript/chatbot/index.md
rm docs/tutorials/typescript/chatbot/index.md2

# PHP
mkdir -p docs/getting_started/php/hello_world_in_php/images/
cp ~/dev/documentation/docs/php/hello-world.md docs/getting_started/php/hello_world_in_php/index_tmp.md
sed -e '/^id\:/a\
sidebar_position: 1' \
    -e '/^id\:/a\
keywords: [Java,java,temporal,sdk,tutorial,learn]' \
    -e '/^sidebar_label/d' \
    -e 's/^title:.*/title: Build a Temporal "Hello World!" app from scratch in PHP/g' \
    -e 's|../../src/components|@site/src/components|g' \
    -e 's|/concepts/|https://docs.temporal.io/concepts/|g' \
    -e 's|/web-ui|https://docs.temporal.io/web-ui|g' \
    -e 's|/application-development-guide|https://docs.temporal.io/application-development-guide|g' \
    -e 's|/php/|https://docs.temporal.io/php/|g' \
    -e 's|Conclusion and Next Steps|Conclusion|' \
    -e '/longform workshops/d' \
  docs/getting_started/php/hello_world_in_php/index_tmp.md > docs/getting_started/php/hello_world_in_php/index.md
rm docs/getting_started/php/hello_world_in_php/index_tmp.md

# PHP
mkdir -p docs/tutorials/php/booking_saga/images/
cp ~/dev/documentation/static/img/tutorials/booking-saga-flow.png docs/tutorials/php/booking_saga/images/
cp ~/dev/documentation/docs/php/booking-saga-tutorial.md docs/tutorials/php/booking_saga/index_tmp.md
sed -e '/^id\:/a\
sidebar_position: 1' \
    -e '/^sidebar_label/d' \
    -e 's|/img/tutorials/|images/|g' \
    -e 's|../../src/components|@site/src/components|g' \
    -e 's|/concepts/|https://docs.temporal.io/concepts/|g' \
    -e 's|/application-development-guide|https://docs.temporal.io/application-development-guide|g' \
    -e 's|/php/|https://docs.temporal.io/php/|g' \
  docs/tutorials/php/booking_saga/index_tmp.md > docs/tutorials/php/booking_saga/index.md
rm docs/tutorials/php/booking_saga/index_tmp.md

mkdir -p docs/tutorials/php/subscriptions/images/
cp ~/dev/documentation/docs/php/subscription-tutorial.md docs/tutorials/php/subscriptions/index_tmp.md
sed -e '/^id\:/a\
sidebar_position: 1' \
    -e '/^sidebar_label/d' \
    -e 's|/php/|https://docs.temporal.io/php/|g' \
    -e 's|/php/hello-world|/getting_started/php/hello_world_in_php/|g' \
    -e 's|../../src/components|@site/src/components|g' \
    -e 's|/concepts/|https://docs.temporal.io/concepts/|g' \
    -e 's|/application-development-guide|https://docs.temporal.io/application-development-guide|g' \
  docs/tutorials/php/subscriptions/index_tmp.md > docs/tutorials/php/subscriptions/index.md
rm docs/tutorials/php/subscriptions/index_tmp.md

# background-check-app
mkdir -p docs/examples/background-checks/images
cp -r ~/dev/documentation/static/diagrams/background-checks/* docs/examples/background-checks/images


cp ~/dev/documentation/docs/learning-paths/background-checks/index.md docs/examples/background-checks/index.md2
sed -e '/^id\:/a\
sidebar_position: 1' \
    -e '/^sidebar_label/d' \
    -e 's|/learning-paths/background-checks/||g' \
    docs/examples/background-checks/index.md2 \
    > docs/examples/background-checks/index.md
rm docs/examples/background-checks/index.md2

# change paths
cp ~/dev/documentation/docs/learning-paths/background-checks/project-narrative.md docs/examples/background-checks/index.md2
sed -e '/^id\:/a\
sidebar_position: 1' \
    -e '/^sidebar_label/d' \
    -e 's|../../src/components|@site/src/components|g' \
    -e 's|/concepts/|https://docs.temporal.io/concepts/|g' \
    -e 's|/application-development-guide/|https://docs.temporal.io/application-development-guide/|g' \
    -e 's|/go/|https://docs.temporal.io/go/|g' \
    -e 's|/blog/|https://docs.temporal.io/blog/|g' \
    -e 's|/learning-paths/background-checks/||g' \
    -e 's/^title:.*/title: Background Check Application/' \
    -e '/^id\:/a\
keywords: [go, golang, temporal, sdk, tutorial]' \
    docs/examples/background-checks/index.md2 \
    > docs/examples/background-checks/index.md
rm docs/examples/background-checks/index.md2

cp ~/dev/documentation/docs/learning-paths/background-checks/how-to-use.md docs/examples/background-checks/how-to-use.md2
sed -e '/^id\:/a\
sidebar_position: 2' \
    -e '/^sidebar_label/d' \
    -e 's|../../src/components|@site/src/components|g' \
    -e 's|/concepts/|https://docs.temporal.io/concepts/|g' \
    -e 's|/application-development-guide/|https://docs.temporal.io/application-development-guide/|g' \
    -e 's|/go/|https://docs.temporal.io/go/|g' \
    -e 's|/learning-paths/background-checks/||g' \
    -e '/^id\:/a\
keywords: [go, golang, temporal, sdk, tutorial]' \
    docs/examples/background-checks/how-to-use.md2 \
    > docs/examples/background-checks/how-to-use.md
rm  docs/examples/background-checks/how-to-use.md2

cp ~/dev/documentation/docs/learning-paths/background-checks/application-requirements.md docs/examples/background-checks/application-requirements.md2
sed -e '/^id\:/a\
sidebar_position: 3' \
    -e '/^sidebar_label/d' \
    -e 's|../../src/components|@site/src/components|g' \
    -e 's|/learning-paths/background-checks/||g' \
    -e 's|/diagrams/background-checks/|images/|g' \
    -e '/^id\:/a\
keywords: [go, golang, temporal, sdk, tutorial]' \
    docs/examples/background-checks/application-requirements.md2 \
    > docs/examples/background-checks/application-requirements.md
rm  docs/examples/background-checks/application-requirements.md2

cp ~/dev/documentation/docs/learning-paths/background-checks/application-design-and-implementation.md docs/examples/background-checks/application-design-and-implementation.md2
sed -e '/^id\:/a\
sidebar_position: 4' \
    -e '/^sidebar_label/d' \
    -e 's|../../src/components|@site/src/components|g' \
    -e 's|/concepts/|https://docs.temporal.io/concepts/|g' \
    -e 's|/learning-paths/background-checks/||g' \
    -e 's|/diagrams/background-checks/|images/|g' \
    -e '/^id\:/a\
keywords: [go, golang, temporal, sdk, tutorial]' \
    docs/examples/background-checks/application-design-and-implementation.md2 \
    > docs/examples/background-checks/application-design-and-implementation.md
rm  docs/examples/background-checks/application-design-and-implementation.md2

cp ~/dev/documentation/docs/learning-paths/background-checks/main-background-check.md docs/examples/background-checks/main-background-check.md2
sed -e '/^id\:/a\
sidebar_position: 5' \
    -e '/^sidebar_label/d' \
    -e 's|../../src/components|@site/src/components|g' \
    -e 's|/concepts/|https://docs.temporal.io/concepts/|g' \
    -e 's|/application-development-guide/|https://docs.temporal.io/application-development-guide/|g' \
    -e 's|/go/|https://docs.temporal.io/go/|g' \
    -e 's|/learning-paths/background-checks/||g' \
    -e 's|/diagrams/background-checks/|images/|g' \
    -e '/^id\:/a\
keywords: [go, golang, temporal, sdk, tutorial]' \
    docs/examples/background-checks/main-background-check.md2 \
    > docs/examples/background-checks/main-background-check.md
rm docs/examples/background-checks/main-background-check.md2

cp ~/dev/documentation/docs/learning-paths/background-checks/candidate-acceptance.md docs/examples/background-checks/candidate-acceptance.md2
sed -e '/^id\:/a\
sidebar_position: 6' \
    -e '/^sidebar_label/d' \
    -e 's|/learning-paths/background-checks/||g' \
    -e 's|/diagrams/background-checks/|images/|g' \
    -e '/^id\:/a\
keywords: [go, golang, temporal, sdk, tutorial]' \
    docs/examples/background-checks/candidate-acceptance.md2 \
    > docs/examples/background-checks/candidate-acceptance.md
rm docs/examples/background-checks/candidate-acceptance.md2

cp ~/dev/documentation/docs/learning-paths/background-checks/ssn-trace.md docs/examples/background-checks/ssn-trace.md2
sed -e '/^id\:/a\
sidebar_position: 7' \
    -e '/^sidebar_label/d' \
    -e 's|/learning-paths/background-checks/||g' \
    -e 's|/diagrams/background-checks/|images/|g' \
    -e '/^id\:/a\
keywords: [go, golang, temporal, sdk, tutorial]' \
    docs/examples/background-checks/ssn-trace.md2 \
    > docs/examples/background-checks/ssn-trace.md
rm docs/examples/background-checks/ssn-trace.md2

cp ~/dev/documentation/docs/learning-paths/background-checks/federal-criminal.md docs/examples/background-checks/federal-criminal.md2
sed -e '/^id\:/a\
sidebar_position: 8' \
    -e '/^sidebar_label/d' \
    -e 's|/learning-paths/background-checks/||g' \
    -e 's|/diagrams/background-checks/|images/|g' \
    -e '/^id\:/a\
keywords: [go, golang, temporal, sdk, tutorial]' \
    docs/examples/background-checks/federal-criminal.md2 \
    > docs/examples/background-checks/federal-criminal.md
rm docs/examples/background-checks/federal-criminal.md2

cp ~/dev/documentation/docs/learning-paths/background-checks/state-criminal-search.md docs/examples/background-checks/state-criminal-search.md2
sed -e '/^id\:/a\
sidebar_position: 9' \
    -e '/^sidebar_label/d' \
    -e 's|/learning-paths/background-checks/||g' \
    -e 's|/diagrams/background-checks/|images/|g' \
    -e '/^id\:/a\
keywords: [go, golang, temporal, sdk, tutorial]' \
    docs/examples/background-checks/state-criminal-search.md2 \
    > docs/examples/background-checks/state-criminal-search.md
rm docs/examples/background-checks/state-criminal-search.md2

cp ~/dev/documentation/docs/learning-paths/background-checks/motor-vehicle-search.md docs/examples/background-checks/motor-vehicle-search.md2
sed -e '/^id\:/a\
sidebar_position: 10' \
    -e '/^sidebar_label/d' \
    -e 's|/learning-paths/background-checks/||g' \
    -e 's|/diagrams/background-checks/|images/|g' \
    -e '/^id\:/a\
keywords: [go, golang, temporal, sdk, tutorial]' \
    docs/examples/background-checks/motor-vehicle-search.md2 \
    > docs/examples/background-checks/motor-vehicle-search.md
rm docs/examples/background-checks/motor-vehicle-search.md2

cp ~/dev/documentation/docs/learning-paths/background-checks/employment-verification.md docs/examples/background-checks/employment-verification.md2
sed -e '/^id\:/a\
sidebar_position: 11' \
    -e '/^sidebar_label/d' \
    -e 's|/learning-paths/background-checks/||g' \
    -e 's|/diagrams/background-checks/|images/|g' \
    -e '/^id\:/a\
keywords: [go, golang, temporal, sdk, tutorial]' \
    docs/examples/background-checks/employment-verification.md2 \
    > docs/examples/background-checks/employment-verification.md
rm docs/examples/background-checks/employment-verification.md2

cp ~/dev/documentation/docs/learning-paths/background-checks/application-deployment.md docs/examples/background-checks/application-deployment.md2
sed -e '/^id\:/a\
sidebar_position: 12' \
    -e '/^sidebar_label/d' \
    -e 's|/learning-paths/background-checks/||g' \
    -e 's|/diagrams/background-checks/|images/|g' \
    -e '/^id\:/a\
keywords: [go, golang, temporal, sdk, tutorial]' \
    docs/examples/background-checks/application-deployment.md2 \
    > docs/examples/background-checks/application-deployment.md
rm docs/examples/background-checks/application-deployment.md2

cp ~/dev/documentation/docs/learning-paths/background-checks/api-reference.md docs/examples/background-checks/api-reference.md2
sed -e '/^id\:/a\
sidebar_position: 13' \
    -e '/^sidebar_label/d' \
    -e 's|/learning-paths/background-checks/||g' \
    -e '/^id\:/a\
keywords: [go, golang, temporal, sdk, tutorial]' \
    docs/examples/background-checks/api-reference.md2 \
    > docs/examples/background-checks/api-reference.md
rm docs/examples/background-checks/api-reference.md2

cp ~/dev/documentation/docs/learning-paths/background-checks/cli-reference.md docs/examples/background-checks/cli-reference.md2
sed -e '/^id\:/a\
sidebar_position: 14' \
    -e '/^sidebar_label/d' \
    -e 's|/learning-paths/background-checks/||g' \
    -e '/^id\:/a\
keywords: [go, golang, temporal, sdk, tutorial]' \
    docs/examples/background-checks/cli-reference.md2 \
    > docs/examples/background-checks/cli-reference.md
rm docs/examples/background-checks/cli-reference.md2


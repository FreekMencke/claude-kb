# AWS Lambda on the Node.js runtime

Prefix `LAMBDA`. This file covers small Node.js functions on AWS Lambda on 2026-10-18: the runtime identifiers and their deprecation dates, how Lambda's Node differs from upstream Node (`require(esm)`, callback handlers, Temporal), ESM handlers and bundling with esbuild, the AWS SDK the runtime includes, cold starts, Lambda Web Functions (launched 2026-10-12), cron triggers through EventBridge Scheduler or scheduled rules, retries, and what a small scheduled function costs. Nest on Lambda is NEST-014; agent access to AWS is in `kb-infra-agents.md`.

Research basis:
- Researched 2026-10-17 and 2026-10-18 (FreekMencke/claude-kb#187, part of roadmap #167) by an Opus 5.5 lead with two Sonnet 5.5 readers (cold starts, bundling and Web Functions; scheduling, retries and cost).
- docs.aws.amazon.com has no Markdown pages: each page was downloaded with `curl` and its tags stripped, then grepped. Prices come from the JSON the aws.amazon.com pricing pages load, read for US East (N. Virginia). What's New items come from the `whats-new/recent/feed/` RSS feed. AWS's GitHub repos (aws-cdk at `v2.273.0`, the runtime interface client, Powertools for TypeScript at `v2.36.0`) were read through `gh api` and raw.githubusercontent.com. Versions come from the npm registry.
- Behaviour was tested locally, never in an AWS account: AWS's public base images `public.ecr.aws/lambda/nodejs:22`, `:24` and `:26-preview` (built 2026-10-15) were run under their bundled Runtime Interface Emulator (`aws-lambda-rie`) with Docker 29.8.2, and handlers were bundled with esbuild 0.28.2 on Node 24.21.0.
- Our setup was read on 2026-10-17 through the read-only AWS MCP server and from the public repo that deploys the functions.

## Quick answers

| Question | Answer | Entries |
|---|---|---|
| Which Node runtime should a Lambda function use, and when do they go away? | `nodejs24.x` (deprecation 2028-04-30, update block 2028-07-01). `nodejs22.x` deprecates 2027-04-30; `nodejs20.x` was deprecated 2026-04-30 and blocks updates from 2027-08-31. `nodejs26.x` is a preview until its GA, targeted for November 2026. | LAMBDA-001 |
| How do I find functions still on a deprecated runtime? | `aws lambda list-functions --function-version ALL --region <r> --output text --query "Functions[?Runtime=='nodejs20.x'].FunctionArn"`, once per region and account; or Trusted Advisor's deprecated-runtimes check. | LAMBDA-002 |
| Can a CommonJS handler `require()` an ESM-only package on Lambda? | No: every Node runtime, the `nodejs26.x` preview included, starts Node with `--no-experimental-require-module`, so it throws `ERR_REQUIRE_ESM`. Bundle the package in, or write the handler as ESM. `NODE_OPTIONS=--experimental-require-module` works but voids the SLA and AWS Support. | LAMBDA-003 |
| Do callback handlers still work? | Not on `nodejs24.x` and later: init fails with `Runtime.CallbackHandlerDeprecated`. Use an `async` handler. `nodejs22.x` still runs them, with a warning. | LAMBDA-004 |
| ESM or CommonJS for a handler? | AWS recommends ESM (`.mjs` or `"type": "module"`) for top-level `await` during init. A bundled CommonJS file works just as well for a function that needs no init-time `await`. | LAMBDA-004, LAMBDA-005 |
| How should I bundle a small Node function? | esbuild, `--bundle --platform=node --target=node24`. `--format=cjs` needs nothing else; `--format=esm` with CommonJS dependencies needs the `createRequire` banner, or init fails with "Dynamic require of … is not supported". | LAMBDA-005 |
| Should I rely on the AWS SDK the runtime includes? | No: it's "a specific minor version", not the latest (3.1105.0 in the 2026-10-15 images, npm had 3.1152.0). AWS recommends bundling the clients you use. | LAMBDA-006 |
| What makes a Node function's cold start slow, and is SnapStart an option? | Package size, init work and connection setup; more memory buys more CPU for init. SnapStart doesn't support Node. Init has been billed on managed runtimes since 2025-08-01. | LAMBDA-007 |
| Can I run Express or Nest on Lambda without an adapter now? | Yes, as a Lambda Web Function (2026-10-12): your server listens on `AWS_LAMBDA_HTTP_ENDPOINT`. `nodejs24.x` on arm64 only, HTTP only, five regions at launch. | LAMBDA-008 |
| EventBridge Scheduler or an EventBridge rule for a cron job? | Scheduler: AWS calls scheduled rules "a legacy feature". Scheduler adds time zones, one-time `at()` schedules and a per-schedule retry policy; 14 million invocations a month are free. | LAMBDA-009 |
| Why does my scheduled function run three times when it fails? | Both trigger Lambda asynchronously, and Lambda retries a failed async invoke twice by default (after 1 and 2 minutes). Set `MaximumRetryAttempts` to 0 on a function that alerts or isn't idempotent. | LAMBDA-010 |
| What does a small scheduled function cost, and what makes it cost more? | Usually nothing beyond the free tier. The traps: log groups that keep logs forever (set retention), verbose logs at $0.50/GB, provisioned concurrency left on, and x86 instead of arm64 (20% dearer per GB-second). | LAMBDA-011 |

## Index

| ID | Title | Type | Tags |
|---|---|---|---|
| LAMBDA-001 | Node.js runtime identifiers and their deprecation, create-block and update-block dates | fact | runtimes, deprecation, nodejs24, nodejs26, preview |
| LAMBDA-002 | Finding functions on a deprecated runtime, and how runtime updates reach them | fact | deprecation, list-functions, runtime-updates, trusted-advisor |
| LAMBDA-003 | Lambda's Node isn't upstream Node: `require(esm)` and module detection off, Temporal missing on 26 | fact | require-esm, esm, nodejs26, experimental-flags, temporal |
| LAMBDA-004 | Handlers: ESM with top-level `await`, and callback handlers rejected from `nodejs24.x` | fact | handler, esm, callback, top-level-await, nodejs24 |
| LAMBDA-005 | Bundling a small function with esbuild: CJS or ESM output, and SAM and CDK defaults | pattern | esbuild, bundling, esm, create-require, cdk, sam |
| LAMBDA-006 | The runtime's AWS SDK is a pinned minor: bundle your own clients | recommendation | aws-sdk, bundling, runtime-sdk, cdk |
| LAMBDA-007 | Cold starts on Node: what moves them, no SnapStart, and init is billed | fact | cold-start, init, snapstart, memory, provisioned-concurrency |
| LAMBDA-008 | Lambda Web Functions: a Node HTTP server on Lambda without an adapter | fact | web-functions, express, http, nodejs24, pricing |
| LAMBDA-009 | EventBridge Scheduler or scheduled rules for cron triggers | comparison | eventbridge, scheduler, cron, time-zones, pricing |
| LAMBDA-010 | Retries for scheduled functions: two by default, and how to turn them off | fact | retries, async-invocation, event-invoke-config, alerts |
| LAMBDA-011 | Cost of a small scheduled function: logs, memory, architecture | fact | cost, cloudwatch-logs, retention, memory, arm64 |

## [LAMBDA-001] Node.js runtime identifiers and their deprecation, create-block and update-block dates
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-18
- Sources: [Lambda runtimes](https://docs.aws.amazon.com/lambda/latest/dg/lambda-runtimes.html), [Introducing public preview runtimes, starting with Node.js 26 and Python 3.15](https://aws.amazon.com/blogs/compute/introducing-public-preview-runtimes-on-aws-lambda-starting-with-node-js-26-and-python-3-15/), [Node.js 26 preview feedback issue](https://github.com/aws/aws-lambda-nodejs-runtime-interface-client/issues/198)
- Related: LAMBDA-002, LAMBDA-003, NODE-001

The runtimes table on 2026-10-18:

| ID | OS | Deprecation | Block create | Block update |
|---|---|---|---|---|
| `nodejs26.x` | AL2023 | Not scheduled | Not scheduled | Not scheduled |
| `nodejs24.x` | AL2023 | Apr 30, 2028 | Jun 1, 2028 | Jul 1, 2028 |
| `nodejs22.x` | AL2023 | Apr 30, 2027 | Jul 29, 2027 | Aug 31, 2027 |
| `nodejs20.x` (deprecated) | AL2023 | Apr 30, 2026 | Jul 29, 2027 | Aug 31, 2027 |
| `nodejs18.x` (deprecated) | AL2 | Sep 1, 2025 | Jul 29, 2027 | Aug 31, 2027 |

`nodejs26.x` is a public preview (issue opened 2026-07-24): "not covered by the Lambda SLA or Technical Support, and should not be used for production workloads". The page lists "Node.js 26 - November 2026" as its target launch; the preview blog (2026-08-15) says "nodejs26.x in preview is the same nodejs26.x at GA". Lambda adds a Node line only when it "reaches the Active LTS phase".

What the dates mean:
- Deprecation: no more security patches or support, and the console can't create or update such functions; the CLI, SAM and CloudFormation still can.
- Block create comes "At least 30 days after deprecation", block update "At least 60 days after". After that you can still move to a supported runtime, but "rolling back to the deprecated runtime may be blocked".
- "you can continue to invoke your functions indefinitely".
- Email and Health Dashboard notices come "at least 180 days before a runtime is deprecated" and list only `$LATEST` versions.

## [LAMBDA-002] Finding functions on a deprecated runtime, and how runtime updates reach them
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-18
- Sources: [Retrieve data about Lambda Event Functions that use a deprecated runtime](https://docs.aws.amazon.com/lambda/latest/dg/runtimes-list-deprecated.html), [Understanding how Lambda manages runtime version updates](https://docs.aws.amazon.com/lambda/latest/dg/runtimes-update.html), [Lambda runtimes](https://docs.aws.amazon.com/lambda/latest/dg/lambda-runtimes.html)
- Related: LAMBDA-001, INFRA-003, INFRA-008

AWS's command lists every version on a runtime in one region:

```bash
aws lambda list-functions --function-version ALL --region us-east-1 --output text \
  --query "Functions[?Runtime=='nodejs20.x'].FunctionArn"
```

"You'll need to repeat this command for each region in which your account has functions and for each of your AWS accounts." Drop `--function-version ALL` for `$LATEST` only. The command "doesn't return Lambda Web Functions" (LAMBDA-008). Trusted Advisor's deprecated-runtimes check and an AWS Config advanced query list them too; Config returns only `$LATEST`, but across regions and accounts. An agent with read-only AWS access can run the same `ListFunctions` call through the AWS MCP server (INFRA-003).

Moving a function is `aws lambda update-function-configuration --function-name <fn> --runtime nodejs24.x`, after testing the code on the new runtime (LAMBDA-003, LAMBDA-004 list what breaks).

Patch versions arrive without a deploy. Each function has a runtime update mode: "Auto (default)", rolled out in two phases (first on create and update, then to the rest); "Function update", applied when you deploy; and "Manual", pinned to a runtime version ARN, which AWS recommends only as "a temporary mitigation" and "against using … to try to achieve runtime consistency across deployments". The `INIT_START` log line names the runtime version ARN a cold start used.

## [LAMBDA-003] Lambda's Node isn't upstream Node: `require(esm)` and module detection off, Temporal missing on 26
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-18
- Sources: [Building with Node.js: Experimental Node.js features](https://docs.aws.amazon.com/lambda/latest/dg/lambda-nodejs.html), [Node.js 26 preview feedback issue](https://github.com/aws/aws-lambda-nodejs-runtime-interface-client/issues/198), `/var/runtime/bootstrap` in `public.ecr.aws/lambda/nodejs:22`, `:24` and `:26-preview`
- Related: NODE-010, NODE-011, NEST-003, NEST-014, LAMBDA-005

Upstream Node has loaded ES modules through `require()` by default since 20.19 and 22.12 (NODE-010). Lambda turns that off. Its docs list `--no-experimental-require-module` for "Node.js 20, Node.js 22, Node.js 24" and `--no-experimental-detect-module` for 22 and 24. The bootstrap script in each image adds both flags unless `NODE_OPTIONS` contains the re-enabling flag, because the feature "is not compatible with the RIC [runtime interface client]". The `nodejs26.x` preview does the same, which the docs' table doesn't say, and also adds `--no-experimental-ffi` ("on by default as of 26.9.0").

Re-enabling: `NODE_OPTIONS=--experimental-require-module`, and "Lambda detects this override and removes the corresponding disable flag". But "Functions that use experimental features aren't eligible for the Lambda Service Level Agreement (SLA) or AWS Support." A bundle (LAMBDA-005) or an ESM handler needs neither.

Users on issue #198 (2026-09-14, 2026-09-24) asked why `require_module` is off and Temporal absent on `nodejs26.x`. No AWS reply by 2026-10-17.

Tested 2026-10-17, AWS base images built 2026-10-15 (Node 22.23.3, 24.21.0, 26.11.1) under `aws-lambda-rie`: a CommonJS handler calling `require('./esm-dep.mjs')` failed init with `ERR_REQUIRE_ESM` on 24 and 26-preview, and returned with `NODE_OPTIONS=--experimental-require-module` (`process.features.require_module: true`). `typeof Temporal` was `undefined` on the 26-preview's Node; official Node 26 binaries have it (NODE-011).

## [LAMBDA-004] Handlers: ESM with top-level `await`, and callback handlers rejected from `nodejs24.x`
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-18
- Sources: [Define Lambda Event Function handler in Node.js](https://docs.aws.amazon.com/lambda/latest/dg/nodejs-handler.html), [Using Node.js ES modules and top-level await in AWS Lambda](https://aws.amazon.com/blogs/compute/using-node-js-es-modules-and-top-level-await-in-aws-lambda/)
- Related: LAMBDA-003, LAMBDA-007, NEST-014

"Lambda supports both ES module and CommonJS handlers" and "recommends using ES modules as it supports top-level await". Init work started with top-level `await` finishes during init; otherwise it "typically run[s] during the first function invoke", which "can cause unexpected behavior or errors". `.mjs` is ESM, `.cjs` CommonJS, and `.js` follows the nearest `package.json` `type`; automatic detection is off (LAMBDA-003). The handler setting `index.handler` names the file and its export.

"Callback-based function handlers are only supported up to Node.js 22." On `nodejs24.x` a handler declared as `(event, context, callback)` fails at init, so a move from 22 to 24 breaks it even if the code never calls `callback`. Write `export const handler = async (event, context) => { … }` and return or throw.

This settles the NEST-014 conflict: Nest's serverless example (`nodejs22.x`, a `callback` argument) can't move to `nodejs24.x` as written, and `@codegenie/serverless-express` 5.0.0, which needs Node 24, dropped callbacks.

Tested 2026-10-17, AWS base images built 2026-10-15 under `aws-lambda-rie`: a callback handler on `:24` failed init with `Runtime.CallbackHandlerDeprecated` ("AWS Lambda has removed support for callback-based function handlers starting with Node.js 24"). On `:22` it returned its result and logged a warning that `AWS_LAMBDA_NODEJS_DISABLE_CALLBACK_WARNING` silences. An `.mjs` handler with top-level `await` ran on `:24`.

## [LAMBDA-005] Bundling a small function with esbuild: CJS or ESM output, and SAM and CDK defaults
- Type: pattern
- Applies to: general
- Confidence: official-example
- Last verified: 2026-10-18
- Sources: [Deploy Node.js Lambda functions with .zip file archives](https://docs.aws.amazon.com/lambda/latest/dg/nodejs-package.html), [AWS SAM: building TypeScript with esbuild](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-using-build-typescript.html), [aws-cdk v2.273.0 `aws-lambda-nodejs/lib/bundling.ts`](https://github.com/aws/aws-cdk/blob/v2.273.0/packages/aws-cdk-lib/aws-lambda-nodejs/lib/bundling.ts), [Powertools for AWS Lambda (TypeScript) v2.36.0: Tracer](https://github.com/aws-powertools/powertools-lambda-typescript/blob/v2.36.0/docs/features/tracer.md), npm registry (`npm view esbuild dist-tags.latest`: 0.28.2)
- Related: JSTOOL-016, JSTOOL-021, NEST-004, LAMBDA-003, LAMBDA-006

AWS: "We recommend using this method to vend dependencies whenever possible", since bundling cuts "I/O operations". A bundle also sidesteps LAMBDA-003: esbuild turns ESM-only dependencies into plain code.

```bash
esbuild src/index.ts --bundle --platform=node --target=node24 --format=cjs --outfile=dist/index.js
```

ESM output (`--format=esm`, `index.mjs`) gives top-level `await`, but a bundled CommonJS dependency that calls `require()` fails at init with `Dynamic require of "node:crypto" is not supported`. The fix AWS's blog and Powertools' Tracer docs give is a banner: `--banner:js="import { createRequire } from 'module';const require = createRequire(import.meta.url);"`. esbuild's own docs don't mention it.

Tool defaults:
- SAM (`BuildMethod: esbuild`): `Minify` "The default value is true", `Target` "es2020", no stated `Format` default.
- CDK `NodejsFunction`: `format` defaults to CJS, `minify` and `sourceMap` to false, target `node<major>` from the runtime; `@aws-sdk/*` external unless `bundleAwsSDK` (LAMBDA-006).
- rspack: no AWS or rspack guide for Lambda found. For Nest bundles see NEST-004.

esbuild never type-checks and its minors break (JSTOOL-016): run `tsc --noEmit` and pin it.

Tested 2026-10-17, esbuild@0.28.2 with nanoid@5.1.16 (ESM-only) and a local CommonJS file requiring `node:crypto`, run in `public.ecr.aws/lambda/nodejs:24` (Node 24.21.0) under `aws-lambda-rie`: the CJS bundle ran; the ESM bundle failed with the error above; with the banner it ran.

## [LAMBDA-006] The runtime's AWS SDK is a pinned minor: bundle your own clients
- Type: recommendation
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-18
- Sources: [Building with Node.js: Runtime-included SDK versions](https://docs.aws.amazon.com/lambda/latest/dg/lambda-nodejs.html), [Lambda runtimes](https://docs.aws.amazon.com/lambda/latest/dg/lambda-runtimes.html), [aws-cdk v2.273.0 `aws-lambda-nodejs` README](https://github.com/aws/aws-cdk/blob/v2.273.0/packages/aws-cdk-lib/aws-lambda-nodejs/README.md), [Reduce Lambda cold start times: migrate to AWS SDK for JavaScript v3](https://aws.amazon.com/blogs/developer/reduce-lambda-cold-start-times-migrate-to-aws-sdk-for-javascript-v3/), npm registry (`npm view @aws-sdk/client-lambda dist-tags`)
- Related: LAMBDA-005, LAMBDA-007

Every Node runtime ships "a specific minor version of the AWS SDK for JavaScript v3, not the latest version", which "depends on the runtime version and your AWS Region", and Lambda updates it on its own schedule. AWS's recommendation: "to maintain full control of your dependencies, and to maximize backward compatibility during automatic runtime updates, we recommend that you always include the SDK modules your code uses … in your function's deployment package". The included copy is for console-edited or inline functions. SDK v2 isn't included at all.

Defaults pull the other way: CDK's `NodejsFunction` marks `@aws-sdk/*` external on SDK v3 runtimes (and `@smithy/*` behind a feature flag), so the function uses the runtime's copy unless you set `bundleAwsSDK: true` or `externalModules`.

Bundling only the clients you import is also what made v3 start faster in AWS's 2023 benchmark (Node 18.16.1, LAMBDA-007).

Tested 2026-10-17: `@aws-sdk/client-s3` in `/var/runtime/node_modules` of the `public.ecr.aws/lambda/nodejs:22`, `:24` and `:26-preview` images (built 2026-10-15) was 3.1105.0; `npm view @aws-sdk/client-lambda dist-tags.latest` the same day gave 3.1152.0.

## [LAMBDA-007] Cold starts on Node: what moves them, no SnapStart, and init is billed
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-18
- Sources: [Lambda execution environment lifecycle](https://docs.aws.amazon.com/lambda/latest/dg/lambda-runtime-environment.html), [Improving startup performance with Lambda SnapStart](https://docs.aws.amazon.com/lambda/latest/dg/snapstart.html), [AWS Lambda standardizes billing for INIT phase](https://aws.amazon.com/blogs/compute/aws-lambda-standardizes-billing-for-init-phase/), [Configure Lambda function memory](https://docs.aws.amazon.com/lambda/latest/dg/configuration-memory.html), [Reduce Lambda cold start times: migrate to AWS SDK for JavaScript v3](https://aws.amazon.com/blogs/developer/reduce-lambda-cold-start-times-migrate-to-aws-sdk-for-javascript-v3/)
- Related: LAMBDA-004, LAMBDA-005, LAMBDA-006, NEST-014, DOCKER-010

"Cold starts typically occur in under 1% of invocations" and take "from under 100 ms to over 1 second". AWS's three factors: "The size of the function package, in terms of imported libraries and dependencies, and Lambda layers", "The amount of code and initialization work", and "The performance of libraries and other services in setting up connections". Init "is limited to 10 seconds".

What helps a Node function:
- Bundle and import single SDK clients. AWS's 2023 benchmark (Node 18.16.1, p50 `init_duration`): 485.54 ms for SDK v3 from `node_modules`, 213.16 ms bundled with esbuild (91.53 KB). Bundling v2 whole didn't help (624.16 ms).
- More memory: "Lambda allocates CPU power in proportion to the amount of memory configured"; "At 1,769 MB, a function has the equivalent of one vCPU".
- Provisioned concurrency for "predictable function start times", billed while configured (LAMBDA-011).

SnapStart supports Java, Python 3.12+ and .NET 8+ only: "Other managed runtimes (such as nodejs24.x and ruby4.0) … are not supported."

Init costs money: "Effective August 1, 2025, AWS will standardize billing for the initialization (INIT) phase", which affects "Lambda functions packaged as ZIP files that use managed runtimes, for which the INIT phase duration was previously unbilled". A slow init now shows in `Billed Duration`.

## [LAMBDA-008] Lambda Web Functions: a Node HTTP server on Lambda without an adapter
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-18
- Sources: [AWS Lambda announces Lambda Web Functions](https://aws.amazon.com/about-aws/whats-new/2026/10/aws-lambda-web-functions/), [Lambda Web Functions](https://docs.aws.amazon.com/lambda/latest/dg/web-functions.html), [Web Functions runtimes](https://docs.aws.amazon.com/lambda/latest/dg/web-functions-runtimes.html), [Web Functions scaling](https://docs.aws.amazon.com/lambda/latest/dg/web-functions-scaling.html), [Announcing AWS Lambda Web Functions](https://aws.amazon.com/blogs/aws/announcing-aws-lambda-web-functions-for-fast-consistent-web-app-performance-anywhere/), [AWS Lambda pricing](https://aws.amazon.com/lambda/pricing/)
- Related: NEST-014, DOCKER-005, LAMBDA-002

Launched 2026-10-12: "Your code listens on a port and handles requests as it would on any HTTP server", using "frameworks you already know, such as Express or Hono, with no adapters". Existing functions were renamed "Lambda Event Functions", "a naming change only".

How it differs:
- The server must listen on the `host:port` in `AWS_LAMBDA_HTTP_ENDPOINT` "within 10 seconds"; the entry is `index.js` unless `AWS_LAMBDA_NODEJS_ENTRYPOINT` says otherwise.
- Runtime: only `nodejs24.x`, "on Arm64 at launch", 2 vCPUs and 2 GB per environment; "Runtime management controls are not supported".
- One environment serves many requests: `maxConcurrencyPerEnvironment` 1–128, default 64. It "scales from zero".
- Timeout 3–900 s, "The default is 30 seconds."
- HTTP/1.1 only. For "event-driven processing … use Lambda Event Functions instead", so it's no cron target (LAMBDA-009).
- Regions at launch: N. Virginia, Ohio, Oregon, Tokyo, Ireland.
- Pricing: per request, active vCPU time and memory held; "Each execution environment is billed for the memory it consumes, for as long as it runs, including time between requests". The page's US East Arm example: "$0.0000276944 per vCPU-second", "$0.0000036667 per GB-second", "$0.30 per million" requests.

For Nest (NEST-014) this removes the adapter and the per-request environment, but an always-busy API still compares against a container (DOCKER-005).

Not found: whether `require(esm)` is off here as well, and body size limits.

## [LAMBDA-009] EventBridge Scheduler or scheduled rules for cron triggers
- Type: comparison
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-18
- Sources: [Creating a rule that runs on a schedule](https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-create-rule-schedule.html), [Scheduler: schedule types](https://docs.aws.amazon.com/scheduler/latest/UserGuide/schedule-types.html), [Scheduler quotas](https://docs.aws.amazon.com/scheduler/latest/UserGuide/scheduler-quotas.html), [Scheduler: setting up](https://docs.aws.amazon.com/scheduler/latest/UserGuide/setting-up.html), [Invoke a Lambda function on a schedule](https://docs.aws.amazon.com/lambda/latest/dg/with-eventbridge-scheduler.html), [EventBridge pricing](https://aws.amazon.com/eventbridge/pricing/), [EventBridge: retries](https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-rule-retry-policy.html), [EventBridge: resource-based policies](https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-use-resource-based.html), [CloudFormation: `AWS::Scheduler::Schedule` RetryPolicy](https://docs.aws.amazon.com/AWSCloudFormation/latest/TemplateReference/aws-properties-scheduler-schedule-retrypolicy.html)
- Related: LAMBDA-010, LAMBDA-011, INFRA-026

"Scheduled rules are a legacy feature of EventBridge"; "We recommend that you use Scheduler to invoke targets on a schedule."

| | Scheduled rule | Scheduler |
|---|---|---|
| Time zone | "All scheduled events use UTC+0" | UTC or "the time zone that you specify" |
| Kinds | `cron()`, `rate()` | `cron()`, `rate()`, one-time `at()` |
| Permission | "either an IAM execution role or a resource-based policy" | an execution role with `lambda:InvokeFunction` |
| Delivery retries | "24 hours and up to 185 times" by default | retry policy per schedule, up to 185 and 86,400 s |
| Dead-letter | SQS | SQS |
| Quota | per event bus | "default 10,000,000 per Region" |
| Price (us-east-1) | not listed | 14 million a month free, then $1.00 per million |

Both invoke Lambda asynchronously ("EventBridge Scheduler invokes your Lambda Event Function asynchronously"), so a function error is retried by Lambda, not by the scheduler (LAMBDA-010). Delivery retries cover a failed invoke call, such as throttling. Minimum precision is one minute, with "a delay of several seconds" possible. One-time schedules count against the quota until deleted, unless `ActionAfterCompletion` deletes them.

For a few fixed UTC jobs, a working rule needs no migration. Choose Scheduler for local-time schedules (daylight saving), one-off runs, or a new setup.

## [LAMBDA-010] Retries for scheduled functions: two by default, and how to turn them off
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-18
- Sources: [Lambda: errors and retries with asynchronous invocation](https://docs.aws.amazon.com/lambda/latest/dg/invocation-async-error-handling.html), [Configuring asynchronous invocation](https://docs.aws.amazon.com/lambda/latest/dg/invocation-async-configuring.html), [Capturing records of asynchronous invocations](https://docs.aws.amazon.com/lambda/latest/dg/invocation-async-retain-records.html), [CloudFormation: `AWS::Lambda::EventInvokeConfig`](https://docs.aws.amazon.com/AWSCloudFormation/latest/TemplateReference/aws-resource-lambda-eventinvokeconfig.html), [Configure Lambda function timeout](https://docs.aws.amazon.com/lambda/latest/dg/configuration-timeout.html)
- Related: INFRA-026, INFRA-027, LAMBDA-009

"If the function returns an error, by default Lambda attempts to run it two more times, with a one-minute wait between the first two attempts, and two minutes between the second and third attempts." Errors include timeouts. Throttles and 500-series errors are retried "for up to 6 hours by default". A function that throws when it finds a problem (INFRA-026) alerts three times per run.

Turn it off per function:

```bash
aws lambda put-function-event-invoke-config --function-name <fn> --maximum-retry-attempts 0
```

`put-…` "overwrites any existing configuration"; `update-function-event-invoke-config` changes one field. Ranges: retries "between 0 and 2", event age 60–21,600 s. In CloudFormation it's `AWS::Lambda::EventInvokeConfig` with `Qualifier`.

To see failures without retries, add an on-failure destination (SQS, SNS, S3, Lambda or EventBridge), which receives "details about the request and response in JSON format"; a dead-letter queue gets only the event.

Retries don't make delivery exactly once: a function "can receive the same event from Lambda multiple times" without an error, so keep scheduled jobs idempotent.

Timeouts: "default value for this setting is 3 seconds", maximum "900 seconds (15 minutes)". A job that outgrows 3 s times out and then retries twice.

## [LAMBDA-011] Cost of a small scheduled function: logs, memory, architecture
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-18
- Sources: [AWS Lambda pricing](https://aws.amazon.com/lambda/pricing/), [Configure Lambda function memory](https://docs.aws.amazon.com/lambda/latest/dg/configuration-memory.html), [CloudWatch Logs: log groups and streams](https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/Working-with-log-groups-and-streams.html), [Lambda introduces tiered pricing for CloudWatch Logs](https://aws.amazon.com/blogs/compute/aws-lambda-introduces-tiered-pricing-for-amazon-cloudwatch-logs-and-additional-logging-destinations/), [CloudWatch Logs log classes](https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/CloudWatch_Logs_Log_Classes.html), [Lambda: recursive loop detection](https://docs.aws.amazon.com/lambda/latest/dg/invocation-recursion.html)
- Related: LAMBDA-007, LAMBDA-009, INFRA-016

Compute is rarely the bill. US East prices from the pricing JSON: $0.0000166667 per GB-second on x86, $0.0000133334 on arm64 (20% less), $0.20 per million requests, billed per 1 ms. "The free tier includes one million requests and 400,000 GB-seconds per month." A 256 MB job running 10 s every 10 minutes uses about 11,000 GB-seconds a month.

Where it grows:
- **Logs kept forever.** "By default, log data is stored in CloudWatch Logs indefinitely", and Lambda creates `/aws/lambda/<name>` on first invoke. Set retention on each group and delete groups when you delete functions.
- **Log volume.** Lambda logs are vended logs since 2025-05-01: "$0.50 per GB" for the first 10 TB in US East, $0.25 on Infrequent Access, which drops metric filters and subscriptions and can't be chosen after creation. Lambda's log-level filtering cuts volume; the JSON format "adds additional metadata".
- **Memory.** Default 128 MB, up to 10,240 MB. AWS suggests 128 MB "for simple Lambda functions"; for others, AWS Lambda Power Tuning finds the cheapest size, since more CPU can finish sooner for the same cost.
- **Provisioned concurrency** is billed for "the period of time you configure it", used or not.
- **Recursive loops**: Lambda stops a chain after "approximately 16 times"; a function writing to its own trigger is the risk.
- **Init** is billed (LAMBDA-007).

## Recommendations for our setup

Ranked by impact against effort. Checked 2026-10-17 through the read-only AWS MCP server and the public repo that deploys them: a handful of small Node functions, all on `nodejs24.x` and arm64, each bundled by esbuild into one minified CommonJS file under 500 KB, most triggered by EventBridge rules, with log retention set and no Scheduler schedules.

1. **Keep the runtime, architecture and bundling** (LAMBDA-001, LAMBDA-003, LAMBDA-005, LAMBDA-011). `nodejs24.x` is supported to 2028-04-30, arm64 is the cheaper architecture, and a CommonJS bundle doesn't depend on `require(esm)`, which Lambda keeps off.
2. **Keep each scheduled function's retry setting explicit, next to its deploy script** (LAMBDA-010, INFRA-026): `MaximumRetryAttempts` 0 for a function that alerts or isn't idempotent, so a failure alerts once, not three times. Check it when adding a function.
3. **Delete a function's log group with the function** (LAMBDA-011): a group Lambda created keeps its logs forever unless retention was set.
4. **Move to `nodejs26.x` at GA, not during the preview** (LAMBDA-001, LAMBDA-003): GA is targeted for November 2026; the preview has no SLA, and Temporal is missing from it. The bundles need no change for `require(esm)`. Recheck NODE's Node 26 checklist then.
5. **Won't do now: move the scheduled rules to EventBridge Scheduler** (LAMBDA-009). The jobs run on fixed UTC times, the rules work, and Scheduler would add an execution role per schedule for no gain. Use Scheduler for a new job that needs local time or a one-off run.
6. **Won't do now: Lambda Web Functions for our HTTP APIs** (LAMBDA-008). They run as containers on the cluster; Web Functions launched on 2026-10-12 with `nodejs24.x` only and one EU region, and our APIs are always on.

## Open questions

- **Scheduler retries and function errors** (LAMBDA-009, LAMBDA-010): no AWS page says whether EventBridge Scheduler's retry policy ever re-sends after a function error on an asynchronous invoke. From the async model it shouldn't (Lambda accepts the event, then retries itself), but it's inference. Checked: Scheduler's user guide pages on retries and dead-letter queues, the Lambda Scheduler page, CloudFormation's RetryPolicy.
- **Scheduler's default retry policy** (LAMBDA-009): the 185 attempts and 24 hours appear in the EventBridge rules guide and AWS's 2022 launch blog, not in a Scheduler guide page (its retry-policy page downloaded as an empty shell). Scheduler's console help gives them only as maximums.
- **Are scheduled rules billed?** EventBridge's pricing page has no line for them. Not found.
- **The default maximum event age**: the docs say retries run "for up to 6 hours by default" and the range is 60–21,600 s; no page names 21,600 as the default value.
- **`require(esm)` at `nodejs26.x` GA** (LAMBDA-003): the preview disables it and drops Temporal; whether GA keeps both is unanswered on issue #198. Nor whether Web Functions disable it (LAMBDA-008).
- **Web Functions limits** (LAMBDA-008): no request or response body limit was found in the developer guide's HTTP, scaling, revisions or troubleshooting pages.
- **SAM's esbuild `Format` and `External` defaults** (LAMBDA-005): the SAM page gives none; aws-sam-cli's source wasn't read.
- **Current cold-start numbers** (LAMBDA-007): AWS's published Node benchmarks are from 2022 and 2023 (Node 18). No Node 22 or 24 figures, and nothing on arm64 against x86 for cold starts.

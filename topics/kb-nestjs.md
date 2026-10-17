# NestJS 12 backends: Express 5, MongoDB driver 7

Prefix `NEST`. This file covers NestJS backends on 2026-10-17: what Nest 11 and 12 changed and what `nest upgrade` does, the Node floors, running the ESM-only Nest 12 packages from a CommonJS app, bundling `node_modules` into a Nest build, validation with Standard Schema against class-validator, Express 5 as it reaches a Nest app (route paths, query parsing, body, async errors, the pinned Express version), the MongoDB Node driver 7 and its minors, and Nest on Lambda against a container. `nest build`'s builders are in `kb-js-lint-build.md` (JSTOOL-018), Vitest or Jest for Nest in `kb-js-testing.md` (JSTEST-007, JSTEST-008), `require(esm)` itself in `kb-nodejs.md` (NODE-010), the Dockerfile in `kb-docker-node.md` (DOCKER-005), and Lambda runtimes in `kb-aws-lambda-node.md`.

Research basis:
- Researched 2026-10-17 (FreekMencke/claude-kb#183, part of roadmap #167) by an Opus 5.5 lead with three Sonnet 5.5 readers (Nest 11/12, `nest upgrade` and validation; Express 5; MongoDB driver 7 and Lambda).
- Docs read as raw Markdown from nestjs/docs.nestjs.com (`master`, and `bdefe85` for the Nest 11 guide), expressjs/expressjs.com (`dee32dd`) and mongodb.com `.md` pages; source at pinned tags (nestjs/nest `v12.1.3`, nestjs/nest-cli `12.0.8`, nestjs/schematics `12.0.7`, expressjs/express `v5.3.0`, mongodb/node-mongodb-native `v7.7.0`); release notes from the GitHub releases API; versions and dates from the npm registry.
- Tested with `@nestjs/core`, `common` and `platform-express` 12.1.3, `@nestjs/cli` 12.0.8, `@rspack/core` 2.2.9, zod 4.6.7 and TypeScript 6.0.3 on Node 24.21.0 (WSL2), installed with `npm install --ignore-scripts`. `nest upgrade` and the MongoDB driver weren't run.
- Our setup was read on 2026-10-17 from `main` of osrs-tracker-api.

## Quick answers

| Question | Answer | Entries |
|---|---|---|
| What breaks upgrading Nest 11 to 12? | Little at compile time: the packages are ESM-only (fine from CommonJS on Node 20.19+/22.12+), lifecycle hooks run by hierarchy level, `@Optional()` isn't inherited, structured logging params are on by default, pipe signatures and `@nestjs/config` validation (Standard Schema, Joi 18) change. `nest upgrade` reports what it can't migrate. | NEST-001, NEST-006 |
| Which Node does Nest 12 need? | Running: 20.19+ or 22.12+ (`require(esm)`), not the `>= 20` in `engines`. `nest new`, `generate` and `upgrade`: 22.22.3+, 24.15+ or 26+. | NEST-002 |
| Must my app switch to ESM for Nest 12? | No: a CommonJS app loads Nest 12 through `require(esm)`, and `nest upgrade` leaves the module format alone. It fails where `require(esm)` is off (Lambda, `ERR_REQUIRE_ESM`) and under Jest before Node 24.9. | NEST-003, JSTEST-009 |
| What does `nest upgrade` change, and what does it skip? | Bumps a fixed list of `@nestjs/*` packages to `^12.0.0`, TypeScript to 6, Jest to 30, `engines.node` to `>=20.19.0`; rewrites config, webpack, GraphQL and NATS settings. Skips other `@nestjs/*` packages (mongoose, terminus …), Express route syntax and ESM; refuses v10 apps. | NEST-006, JSUP-003 |
| Why does bundling `node_modules` into a Nest 12 build fail with "Can't resolve '@nestjs/websockets/socket-module.js'"? | The CLI's `IgnorePlugin` list lacks the `.js` specifiers Nest 12 imports. Add your own `IgnorePlugin` with the `.js` forms. | NEST-004 |
| class-validator or Zod for a new Nest 12 app? | Zod (any Standard Schema) through the `schema` option and `StandardSchemaValidationPipe`: no class metadata, coerces and strips. class-validator stays supported; pin `^0.15` since Nest's peer range allows vulnerable 0.13. Both pipes can run together. | NEST-007, NEST-008 |
| Why is my `{ schema }` on `@Body()` not validating? | The decorator only attaches metadata: register `StandardSchemaValidationPipe` (globally is safe; parameters without a schema pass through). | NEST-007 |
| Why does `@Get('users/*')` warn after upgrading? | Express 5's path-to-regexp 8 needs named wildcards; Nest's `LegacyRouteConverter` rewrites it to `{*path}` and warns. Write `users/{*path}`; `?` optionals become braces, regex characters are gone. | NEST-009 |
| Why is `req.query` no longer nested? | Express 5's default query parser is "simple": `filter[a]=1` is the key `filter[a]`. `app.set('query parser', 'extended')` restores it. | NEST-010 |
| Do I still need express-async-errors? | No: Express 5 forwards rejected promises to the error handler, and Nest catches controller errors anyway. | NEST-010 |
| Is Nest 12 stuck on an old Express? | `@nestjs/platform-express` 12.1.3 pins `express` 5.2.1, but 5.3.0's security fixes are in `qs`, `body-parser` and `proxy-addr`, which 5.2.1's caret ranges already pull in on a fresh install or `npm update`. | NEST-011 |
| What breaks going from MongoDB driver 6 to 7? | Node 20.19+, removed `useNewUrlParser`/`useUnifiedTopology` and other deprecated options, no default `getMore` `batchSize`, no cursor `transform`, AWS auth only through `@aws-sdk/credential-providers`, bson 7's `ObjectId(number)` gone. Upgrade to 6.21 first. | NEST-012 |
| Which MongoDB server versions does driver 7 support? | 4.4+ since 7.6.0 (2026-08-24), a minor release; it throws on 4.2. Mongoose 9.11.2 pins driver `~7.7`. | NEST-013 |
| Lambda or a container for a Nest API? | A container for a full HTTP API; Lambda only for small, bundled functions (standalone context), and a CommonJS Nest 12 app there needs `NODE_OPTIONS=--experimental-require-module`, which loses the Lambda SLA. | NEST-014 |

## Index

| ID | Title | Type | Tags |
|---|---|---|---|
| NEST-001 | Nest 12.0.0: what changed, and the behaviour changes `nest upgrade` can't migrate | fact | nestjs, nest-12, migration, lifecycle-hooks, logging |
| NEST-002 | Node floors: running Nest 12 needs 20.19 or 22.12, the CLI needs 22.22.3, 24.15 or 26 | fact | nestjs, node-version, require-esm, nest-cli |
| NEST-003 | A CommonJS app can stay CommonJS on ESM-only Nest 12 | fact | nestjs, esm, commonjs, require-esm |
| NEST-004 | Bundling `node_modules` into a Nest 12 build: the CLI's lazy-import list misses `.js` | fact | nestjs, rspack, webpack, bundling, ignore-plugin |
| NEST-005 | What Nest 11 changed (2025-01): Express 5, Node 20, hook order, Keyv, config precedence | fact | nestjs, nest-11, migration, express-5, cache-manager |
| NEST-006 | `nest upgrade`: what the v12 schematic bumps, rewrites, reports and refuses | fact | nestjs, nest-upgrade, schematics, migration |
| NEST-007 | Standard Schema validation: the `schema` option and `StandardSchemaValidationPipe` | fact | nestjs, standard-schema, zod, validation, pipes |
| NEST-008 | class-validator or a Standard Schema library for a Nest 12 app | comparison | nestjs, class-validator, zod, standard-schema, nestjs-config |
| NEST-009 | Express 5 route paths in Nest: `*` needs a name, and the converter that hides it | fact | express-5, path-to-regexp, routing, wildcards, nestjs |
| NEST-010 | Express 5 behaviour a Nest app notices: flat `req.query`, `req.body`, async errors | fact | express-5, query-parser, body-parser, async-errors, nestjs |
| NEST-011 | Which Express a Nest 12 app runs: pinned 5.2.1, and where 5.3.0's security fixes come from | fact | express-5, express-4, security, transitive-dependencies, nestjs |
| NEST-012 | MongoDB Node driver 7.0: Node 20.19, removed options, `batchSize`, AWS auth | fact | mongodb, mongodb-driver-7, migration, bson |
| NEST-013 | MongoDB driver 7.1 to 7.7: server 4.4 floor in a minor, ESM bundles, `close()`, Mongoose 9 | fact | mongodb, mongoose, server-version, esm, bundling |
| NEST-014 | Nest on Lambda or in a container | comparison | nestjs, lambda, serverless, containers, cold-start |

## [NEST-001] Nest 12.0.0: what changed, and the behaviour changes `nest upgrade` can't migrate
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [Nest migration guide](https://docs.nestjs.com/migration-guide) ([raw](https://raw.githubusercontent.com/nestjs/docs.nestjs.com/master/content/migration.md)), npm registry (`npm view @nestjs/core dist-tags`, `npm view @nestjs/core 'time[12.0.0]'`)
- Related: JSUP-003, JSTOOL-018, JSTEST-007

`@nestjs/core` 12.0.0 was published 2026-08-27; `latest` was 12.1.3 (2026-10-12) and the `legacy` tag 11.2.7 on 2026-10-17 (`npm view @nestjs/core dist-tags`). The guide: "Version 12 centers on ESM packages, updated CLI defaults, first-class support for Standard Schema-based validation and serialization, and native observability support."

Changes that keep compiling but behave differently, which `nest upgrade` only reports:
- **Lifecycle hooks** "are now called by component hierarchy level", which "can change the execution order" of `onModuleInit`, `onApplicationBootstrap` and the shutdown hooks.
- **`@Optional()` is no longer inherited**: a subclass without its own constructor now throws `UnknownDependenciesException` "where v11 resolved the parameter as `undefined`".
- **Structured logging params**: `ConsoleLogger` attaches plain objects after the message to the same entry; "on by default in v12; set `structuredParams: false` to restore the previous behavior."
- **Pipe signatures**: "`ArgumentMetadata` now takes a generic parameter. Custom pipes with hand-written signatures may need their types adjusted."
- **Express graceful shutdown**: "the Express adapter now drains in-flight requests on shutdown."
- **Removed**: Terminus's legacy `HealthIndicator`/`HealthCheckError` API, `subscriptions-transport-ws`, the `angular` schematic; NATS moves to v3.

Opt-in additions: `routeConflictPolicy` and `routeResolutionStrategy` ("Both default to the previous behavior"), an `errorCode` on HTTP exceptions, `@nestjs/observe`, `nest deploy`.

## [NEST-002] Node floors: running Nest 12 needs 20.19 or 22.12, the CLI needs 22.22.3, 24.15 or 26
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [Nest migration guide: Node.js requirements](https://docs.nestjs.com/migration-guide) ([raw](https://raw.githubusercontent.com/nestjs/docs.nestjs.com/master/content/migration.md)), npm registry (`npm view @nestjs/core@12.1.3 engines type`)
- Related: NODE-010, NEST-003, NEST-012

The guide's table: running a Nest 12 application needs "**v20.19+**, or **v22.12+** on the 22.x line"; `nest new`, `nest generate` and `nest upgrade` need "**v22.22.3+**, **v24.15+**, or **v26+**", a floor "inherited from the Angular devkit" that excludes "The 23.x and 25.x lines, as well as earlier 22.x and 24.x releases". 21.x "never received" `require(esm)` "and is not supported".

`@nestjs/core@12.1.3` still declares `engines.node` `">= 20"` with `"type": "module"`: the real floor comes from `require(esm)` (NODE-010), not the engines field, so npm won't warn on Node 20.0. "`nest upgrade` enforces exactly this and refuses to run on an older release."

So a CI image or Dockerfile on an old 22.x or 24.x patch release can run the built app but fail at `nest generate`. The guide's advice: "run the latest active LTS release".

## [NEST-003] A CommonJS app can stay CommonJS on ESM-only Nest 12
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [Nest migration guide: ESM packages, Switching your project to ESM](https://docs.nestjs.com/migration-guide) ([raw](https://raw.githubusercontent.com/nestjs/docs.nestjs.com/master/content/migration.md)), npm registry (`npm view @nestjs/core@12.1.3 type`)
- Related: NODE-010, NEST-002, NEST-004, JSTEST-007, JSTEST-009

"All core Nest packages now ship as ESM" (`"type": "module"` on `@nestjs/core` 12.1.3), but "Migrating **your own** application to ESM is entirely optional and **not** part of upgrading to v12": a CommonJS app loads them through `require(esm)`, and "`nest upgrade` deliberately leaves your module format alone."

Switching later is a separate pass: `"type": "module"` in `package.json`, `"module"`/`"moduleResolution": "nodenext"` in tsconfig (projects from `@nestjs/schematics` 11.0.6 or later already have them), `.js` on every relative import, and `import.meta.dirname` for `__dirname`. "Adding `"type": "module"` therefore changes how **every** `.ts` file in the project is emitted ... Expect to fix them in the same pass rather than incrementally." The docs' samples use ESM; in a CommonJS project "drop the `.js` extensions, keep `__dirname`, and call `bootstrap()` without `await`."

What still breaks a CommonJS app: a runtime with `require(esm)` off (Lambda, NEST-012), and Jest before Node 24.9 (JSTEST-009).

Tested 2026-10-17, `@nestjs/core`, `common` and `platform-express` 12.1.3, TypeScript 6.0.3 with `"module": "commonjs"`, Node 24.21.0: the compiled `require("@nestjs/common")` app started and served requests with no warning. With `node --no-experimental-require-module` it failed at that line with `ERR_REQUIRE_ESM`.

## [NEST-004] Bundling `node_modules` into a Nest 12 build: the CLI's lazy-import list misses `.js`
- Type: fact
- Applies to: general
- Confidence: official-example
- Last verified: 2026-10-17
- Sources: [nest-cli 12.0.8 `rspack-defaults.ts`](https://github.com/nestjs/nest-cli/blob/12.0.8/lib/compiler/defaults/rspack-defaults.ts), [nest-cli 12.0.8 `webpack-defaults.ts`](https://github.com/nestjs/nest-cli/blob/12.0.8/lib/compiler/defaults/webpack-defaults.ts), [nestjs/nest v12.1.3 `nest-application.ts`](https://github.com/nestjs/nest/blob/v12.1.3/packages/core/nest-application.ts)
- Related: JSTOOL-018, DOCKER-005, NEST-003

`nest build -b rspack` (and `-b webpack`) keeps `node_modules` external through `webpack-node-externals` by default, so the bundle needs `node_modules` at run time. A config that bundles everything (for a runtime stage with only `dist/`, DOCKER-005) hits a gap: the CLI's `IgnorePlugin` skips optional Nest packages that aren't installed, from a list of `'@nestjs/microservices/microservices-module'` and `'@nestjs/websockets/socket-module'`, while Nest 12.1.3's ESM code imports `'@nestjs/websockets/socket-module.js'` and `'@nestjs/microservices/microservices-module.js'`. The resource strings don't match, so those imports aren't ignored. Both default files at 12.0.8 have the same list, and `master` matched 12.0.8 on 2026-10-17.

Fix in your own `rspack.config.js`: add an `IgnorePlugin` whose list carries the `.js` forms (osrs-tracker-api does this).

Tested 2026-10-17, `@nestjs/cli` 12.0.8, `@rspack/core` 2.2.9, Nest 12.1.3, Node 24.21.0: with the default config the build compiled (7 KB `main.js`, dependencies external). With `externals: {}` it failed: "Module not found: Can't resolve '@nestjs/websockets/socket-module.js'" and the same for `microservices-module.js`. No upstream issue was found (`gh search issues` in nestjs/nest-cli and nestjs/nest for `socket-module.js`).

## [NEST-005] What Nest 11 changed (2025-01): Express 5, Node 20, hook order, Keyv, config precedence
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [Nest 11 migration guide, docs repo at `bdefe85`](https://raw.githubusercontent.com/nestjs/docs.nestjs.com/bdefe854568c2f679c45d1d6cea0ac76797a3553/content/migration.md), [nestjs/nest v11.0.0 release](https://github.com/nestjs/nest/releases/tag/v11.0.0), npm registry (`npm view @nestjs/core 'time[11.0.0]'`)
- Related: NEST-001, NEST-009, NEST-010

`@nestjs/core` 11.0.0 was published 2025-01-16. The v11 guide lives only in the docs repo's history now (the page was rewritten for v12): "While the update includes a few minor breaking changes, they are unlikely to impact most users." For a v10 app, do this before Nest 12, whose `nest upgrade` refuses anything below v11 (NEST-006):
- "NestJS 11 now requires **Node.js v20 or higher**"; "Express v5 is now the default version integrated into the framework" (routes: NEST-009; query parsing: NEST-010). Fastify 5 too.
- "Termination lifecycle hooks are now executed in the reverse order to their initialization counterparts"; global modules are "initialized first and destroyed last". (Nest 12 changes ordering again: NEST-001.)
- "middleware registered in global modules is now **executed first**".
- Dynamic modules: "we no longer generate predictable hashes"; tests can end up with two instances (`moduleIdGeneratorAlgorithm: 'deep-hash'` restores it).
- `Reflector.getAllAndOverride` returns `T | undefined`.
- `@nestjs/cache-manager` moves to Keyv (`stores: [new KeyvRedis(...)]`), and cached data becomes `{ value, expires }`.
- `@nestjs/config` 4: "internal configuration will now always take precedence over environment variables."

## [NEST-006] `nest upgrade`: what the v12 schematic bumps, rewrites, reports and refuses
- Type: fact
- Applies to: general
- Confidence: official-example
- Last verified: 2026-10-17
- Sources: [Nest CLI usages: nest upgrade](https://docs.nestjs.com/cli/usages) ([raw](https://raw.githubusercontent.com/nestjs/docs.nestjs.com/master/content/cli/usages.md)), [nest-cli 12.0.8 `upgrade.command.ts`](https://github.com/nestjs/nest-cli/blob/12.0.8/commands/upgrade.command.ts), [nestjs/schematics 12.0.7 `src/lib/upgrade/`](https://github.com/nestjs/schematics/tree/12.0.7/src/lib/upgrade)
- Related: JSUP-003, NEST-001, NEST-002, JSTEST-009

`nest upgrade` (alias `update`; flags `--dry-run`, `--skip-install`, `--tag`, `--observe`/`--no-observe`, `-c`) runs the `upgrade` schematic of `@nestjs/schematics`. Read at 12.0.7, not run:
- **Refuses** below Node 20.19 or 22.12, without `@nestjs/core` or `@nestjs/common`, and on v10 or older: "This schematic upgrades from v11 to v12 only. Please upgrade to v11 first" (NEST-005). On v12 it re-applies the migrations ("they are idempotent").
- **Bumps** a fixed list to `^12.0.0`: `common`, `core`, `testing`, the platform packages, `websockets`, `microservices`, `cli`, `schematics`, `swagger`, `config`; GraphQL packages to `^14.0.0`; TypeScript below 6 to `^6.0.0`; an existing `engines.node` to `>=20.19.0`; Jest to 30 with a Node 24.9 warning (JSTEST-009). Other `@nestjs/*` packages (mongoose, terminus, schedule, …) are "left untouched because their v12-compatible release is not known to this schematic", with an `npm-check-updates` hint.
- **Rewrites** `@nestjs/config` `validationOptions` into `libraryOptions` (and Joi to 18), `nest-cli.json` webpack options, GraphQL and NATS settings.
- **Reports only**: a `commonjs` tsconfig with legacy resolution, a `tsconfig.build.json` without `rootDir` (TS5011 on TypeScript 6), custom `PipeTransform` classes, logger calls with a trailing object, lifecycle hooks in two or more files.
- **Leaves alone**: Express 5 route syntax (NEST-009), the module format, Vitest and oxlint, and class-validator, class-transformer, zod, rxjs and reflect-metadata.

It installs with the package manager its lockfile implies. Upgrade a global CLI first: the command "only bumps the CLI dependency inside your project".

## [NEST-007] Standard Schema validation: the `schema` option and `StandardSchemaValidationPipe`
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [Nest docs: Validation](https://docs.nestjs.com/application/validation) ([raw](https://raw.githubusercontent.com/nestjs/docs.nestjs.com/master/content/application/validation.md)), [Nest migration guide: Route decorator schemas](https://docs.nestjs.com/migration-guide), [nestjs/nest v12.1.3 `standard-schema-validation.pipe.ts`](https://github.com/nestjs/nest/blob/v12.1.3/packages/common/pipes/standard-schema-validation.pipe.ts), [Nest docs: OpenAPI introduction](https://raw.githubusercontent.com/nestjs/docs.nestjs.com/master/content/openapi/introduction.md)
- Related: NEST-008, JSTEST-008

Nest 12 lets `@Body()`, `@Query()`, `@Param()`, `@RawBody()` (and `@MessageBody()`, `@Payload()`) take `{ schema }`, any Standard Schema object (Zod, Valibot, ArkType). The decorator "only attaches schema metadata"; nothing is validated until you register `StandardSchemaValidationPipe` (`app.useGlobalPipes(new StandardSchemaValidationPipe())`). Forget the pipe and the schema is silently ignored.

From the docs and the source:
- "By default, the pipe passes the schema's **output** to the handler, so coercion, defaults, and transformations take effect"; `transform: false` passes the input through.
- It "validates only the parameters that declare a schema and passes every other value through unchanged, so binding it globally is safe", and works beside `ValidationPipe`, which only validates class-typed parameters.
- "no class or reflection metadata is involved": no `emitDecoratorMetadata` dependence (compare JSTEST-008).
- Unknown keys follow the schema: "`z.object()` strips unknown properties, like the `whitelist` option of `ValidationPipe`"; `z.strictObject()` rejects them.
- Errors are 400 with `message: ["<path>: <issue>"]`; `errorHttpStatusCode` and `exceptionFactory` change that. Async schemas are awaited; `__proto__`, `prototype` and `constructor` keys are stripped first.
- `@nestjs/swagger` converts schemas exposing `~standard.jsonSchema` ("Zod 4.2 and later") itself.

Tested 2026-10-17, Nest 12.1.3, zod 4.6.7, CommonJS, Node 24.21.0: `@Param('id', { schema: z.coerce.number() })` gave the number 42; `abc` gave 400 "Invalid input: expected number, received NaN"; a body with `qty: "3"` and an extra key came back as `{"name":"xy","qty":3}`.

## [NEST-008] class-validator or a Standard Schema library for a Nest 12 app
- Type: comparison
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [Nest migration guide: class-validator and class-transformer, Config module](https://docs.nestjs.com/migration-guide), [Nest docs: Validation](https://raw.githubusercontent.com/nestjs/docs.nestjs.com/master/content/application/validation.md), [nestjs/nest v12.0.0 release](https://github.com/nestjs/nest/releases/tag/v12.0.0), [nestjs/nest v12.1.3 `validation.pipe.ts`](https://github.com/nestjs/nest/blob/v12.1.3/packages/common/pipes/validation.pipe.ts), [GHSA-fj58-h2fr-3pp2](https://github.com/advisories/GHSA-fj58-h2fr-3pp2), npm registry (`npm view class-validator 'time[0.15.1]'`, `npm view class-transformer dist-tags`)
- Related: NEST-007, NEST-006

Nest takes no side: "The decorator-based `class-validator` workflow remains fully supported, with no plan to remove it", and "Pick per use case" (v12.0.0 notes). The guide: `ValidationPipe` "when your DTOs are class-based and rely on decorators", `StandardSchemaValidationPipe` "when your validation library already exposes a Standard Schema-compatible schema". The docs' new examples use Zod, and for config: "we now recommend a modern Standard Schema library such as Zod for new projects".

What tips it:
- **Maintenance**: `class-validator` 0.15.1 (2026-02-26) followed a 16-month gap between 0.14.1 (2024-01-12) and 0.14.2 (2025-05-02); `class-transformer` is still 0.5.1 (2021). `ValidationPipe` needs both and calls `process.exit(1)` if either is missing.
- **Peer range**: `@nestjs/common` 12.1.3 peers `class-validator >=0.13.2`, which still allows versions below 0.14.0, affected by the critical CVE-2019-18413 (GHSA-fj58-h2fr-3pp2). Pin `^0.15`.
- **Metadata**: class DTOs depend on `emitDecoratorMetadata` (JSTEST-008); schemas don't.
- **OpenAPI**: class DTOs have the Swagger CLI plugin; schemas convert natively (NEST-007).

`@nestjs/config` 12 validates with Standard Schema too: Joi needs v18+, and its options move to `validationOptions.libraryOptions` (`nest upgrade` rewrites inline ones, NEST-006).

Recommendation: a new app or a new module uses Zod with `StandardSchemaValidationPipe`; an existing class-validator app keeps `ValidationPipe` and can add schemas route by route, since both pipes run together.

## [NEST-009] Express 5 route paths in Nest: `*` needs a name, and the converter that hides it
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [Express: Migrating to Express 5](https://expressjs.com/en/guide/migrating-5.html) ([raw at `dee32dd`](https://raw.githubusercontent.com/expressjs/expressjs.com/dee32dd56b459db85de61691934e28adfc6502f8/src/content/pages/en/guide/migrating-5.mdx)), [nestjs/nest v12.1.3 `legacy-route-converter.ts`](https://github.com/nestjs/nest/blob/v12.1.3/packages/core/router/legacy-route-converter.ts), [Nest docs: Middleware](https://raw.githubusercontent.com/nestjs/docs.nestjs.com/master/content/middlewares.md), [path-to-regexp v8.4.2 Readme](https://github.com/pillarjs/path-to-regexp/blob/v8.4.2/Readme.md)
- Related: NEST-005, NEST-010

Express 5 uses path-to-regexp 8 (`@nestjs/platform-express` 12.1.3 pins `path-to-regexp` 8.4.2): "The wildcard `*` must have a name ... use `/*splat` instead of `/*`"; "`*splat` matches any path without the root path ... you can use `/{*splat}`"; "The optional character `?` is no longer supported, use braces instead" (`/:file{.:ext}`); "Regexp characters are not supported"; `()[]?+!` are reserved.

Nest's `LegacyRouteConverter` rewrites some old forms at startup and logs a warning: a trailing `/*` or `/(.*)` becomes `{*path}`, a trailing `/+` becomes `/*path`, a `/*/` in the middle becomes `/*path<n>/`. A bare `*` (`forRoutes('*')`) converts silently. Anything else goes to path-to-regexp, whose `PathError` stops the app from booting. A mid-segment `ab*cd` isn't rejected: path-to-regexp reads it as `ab` plus a wildcard named `cd` (from its lexer; not run).

Write the new syntax and treat the warning as a to-do: `@Get('users/{*path}')`, `forRoutes('{*splat}')`, `exclude('cats/{*splat}')`. Wildcard values now arrive as arrays of segments.

Tested 2026-10-17, Nest 12.1.3, Node 24.21.0: `@Get('legacy/*')` logged "WARN [LegacyRouteConverter] Unsupported route path: "/legacy/*" ... Attempting to auto-convert to "/legacy/{*path}"..." and served `/legacy/a/b`. `forRoutes('*')` logged nothing and ran for `/items/7` and `/`.

## [NEST-010] Express 5 behaviour a Nest app notices: flat `req.query`, `req.body`, async errors
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [Express: Migrating to Express 5](https://expressjs.com/en/guide/migrating-5.html) ([raw at `dee32dd`](https://raw.githubusercontent.com/expressjs/expressjs.com/dee32dd56b459db85de61691934e28adfc6502f8/src/content/pages/en/guide/migrating-5.mdx)), [Nest 11 migration guide: Query parameters parsing](https://raw.githubusercontent.com/nestjs/docs.nestjs.com/bdefe854568c2f679c45d1d6cea0ac76797a3553/content/migration.md), [nestjs/nest v12.1.3 `express-adapter.ts`](https://github.com/nestjs/nest/blob/v12.1.3/packages/platform-express/adapters/express-adapter.ts), [express v5.3.0 `lib/utils.js`](https://github.com/expressjs/express/blob/v5.3.0/lib/utils.js)
- Related: NEST-009, NEST-011, NEST-007

- **Query strings**: "The default query parser has been changed from "extended" to "simple"", and `req.query` "is no longer a writable property". Nest's adapter doesn't set a parser, so `?filter[a]=1` arrives as the flat key `filter[a]`. To restore nesting: `app.set('query parser', 'extended')` on a `NestExpressApplication` (Nest 11 guide). Express's `true` means simple, not extended. A Standard Schema on `@Query()` (NEST-007) is the alternative to nested parsing.
- **Body**: "`req.body` property returns `undefined` when the body has not been parsed" (was `{}`). Nest registers JSON and urlencoded parsers itself, passing `{ extended: true }` for urlencoded, so Express 5's new `extended: false` default only applies through `app.useBodyParser('urlencoded', …)` without it. Other content types give `@Body()` `undefined`.
- **Async errors**: "handlers that return rejected promises are now handled by forwarding the rejected value as an `Error`". Nest's router already caught them for controllers; `express-async-errors` is now redundant for raw Express middleware too.
- **Other**: `res.status()` accepts only integers 100 to 999; `express.static` ignores dotfiles (`.well-known` returns 404); `res.redirect('back')` and `app.del()` are gone; "Node.js version 18 or higher". Express's codemods: `npx codemod@latest @expressjs/v5-migration-recipe`.

Tested 2026-10-17, Nest 12.1.3 (express 5.2.1), Node 24.21.0: `GET /query?a[b]=1&c=2&c=3` gave `{"a[b]":"1","c":["2","3"]}`, and an async handler that threw returned Nest's 500 JSON.

## [NEST-011] Which Express a Nest 12 app runs: pinned 5.2.1, and where 5.3.0's security fixes come from
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [express History.md](https://github.com/expressjs/express/blob/master/History.md), [Express: Version support](https://raw.githubusercontent.com/expressjs/expressjs.com/dee32dd56b459db85de61691934e28adfc6502f8/src/content/pages/en/support.mdx), [Express blog: 5.1.0 and the LTS timeline](https://expressjs.com/2025/03/31/v5-1-latest-release.html), npm registry (`npm view @nestjs/platform-express@12.1.3 dependencies`, `npm view express dist-tags`, `npm view express@5.2.1 dependencies`)
- Related: NEST-010, NPM-018, NPM-013

`@nestjs/platform-express` 12.1.3 depends on `express` `5.2.1` exactly, while `express` `latest` is 5.3.0 (2026-10-09). 5.3.0's security items are dependency bumps: `qs` `^6.16.0` (CVE-2026-2391 and others), `proxy-addr` `^2.0.8`, and `body-parser` `^2.3.0` (CVE-2026-12590, where an invalid `limit` "caused request body size enforcement to be silently disabled"). Express 5.2.1 already allows those through caret ranges (`qs ^6.14.0`, `body-parser ^2.2.1`, `proxy-addr ^2.0.7`), so a fresh install or `npm update` gets the fixed versions without an override. An old lockfile doesn't: check with `npm ls qs body-parser proxy-addr`. Only 5.3.0's own changes (Content-Length with Transfer-Encoding, the error handler) need an `overrides` entry (NPM-018).

Express 5.2.0 shipped a query-parser change for CVE-2024-51999 and 5.2.1 reverted it the same day (2025-12-01): "CVE-2024-51999 has been rejected".

Express 4 isn't end-of-life: the support page lists v4.x as "**ongoing**", 4.22.3 was published 2026-09-14, and the 2025-03-31 LTS plan put it in maintenance from 2025-04-01 with EOL "no sooner than 2026-10-01", goals "not commitments".

Tested 2026-10-17, `npm install` of `@nestjs/platform-express@12.1.3`: `express@5.2.1` with `body-parser@2.3.0`, `qs@6.16.1` and `proxy-addr@2.0.8`.

## [NEST-012] MongoDB Node driver 7.0: Node 20.19, removed options, `batchSize`, AWS auth
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [node-mongodb-native `etc/notes/CHANGES_7.0.0.md`](https://github.com/mongodb/node-mongodb-native/blob/main/etc/notes/CHANGES_7.0.0.md), [v7.0.0 release](https://github.com/mongodb/node-mongodb-native/releases/tag/v7.0.0), [js-bson v7.0.0 release](https://github.com/mongodb/js-bson/releases/tag/v7.0.0), npm registry (`npm view mongodb dist-tags`, `npm view mongodb@7.7.0 engines`, `npm view mongodb 'time[7.0.0]'`)
- Related: NEST-013, NODE-001

`mongodb` 7.0.0 was published 2025-11-06; `latest` was 7.7.0 and the `6x` tag 6.21.0 on 2026-10-17. The notes are "relative to v6.21.0 ... ALL changes listed below are BREAKING unless indicated otherwise", so upgrade to 6.21 first.

What an ordinary app hits:
- "The minimum supported Node.js version is now v20.19.0" (engines `>=20.19.0`); TypeScript target ES2023.
- Removed deprecated options and types fail to compile: `useNewUrlParser`, `useUnifiedTopology`, `autoIndexId`, `FindOneOptions.batchSize`/`limit`, `CommandOperationOptions.retryWrites` (a client option now), `ClientSession.transaction`, GridFS `contentType`/`aliases`.
- "cursors no longer provide a default `batchSize` when executing a `getMore`" (was 1000): round trips change for large cursors.
- Cursors and change streams "no longer accept a `transform` function": `cursor.stream().map(fn)`.
- Dropping a missing collection "returns false instead of throwing".
- `connect()` "will now run a handshake regardless of credentials being defined" (non-breaking), so bad hosts fail earlier.
- MONGODB-AWS needs `@aws-sdk/credential-providers` installed, and explicitly provided credentials are "no longer accepted": the SDK fetches them.
- bson 7: "ObjectId constructor no longer accepts a number" (`ObjectId.createFromTime()`).
- Optional peers move to `^7.0.0` (`kerberos`, `@mongodb-js/zstd`, `mongodb-client-encryption`).

`serverApi`, `findOneAndUpdate` results and TLS options didn't change in 7.0 (those were 6.0 changes, per MongoDB's upgrade page).

## [NEST-013] MongoDB driver 7.1 to 7.7: server 4.4 floor in a minor, ESM bundles, `close()`, Mongoose 9
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [node-mongodb-native releases](https://github.com/mongodb/node-mongodb-native/releases) (v7.1.0 to v7.7.0), [driver README at v7.7.0](https://github.com/mongodb/node-mongodb-native/blob/v7.7.0/README.md), [MongoDB Node driver: Upgrade guide](https://www.mongodb.com/docs/drivers/node/current/reference/upgrade/), npm registry (`npm view mongoose@9.11.2 dependencies`, `npm view @nestjs/mongoose@12.0.0 peerDependencies`)
- Related: NEST-012, NEST-004

The 7.x minors (release dates from the GitHub releases API) changed things a `^7` range picks up:
- **7.6.0 (2026-08-24)**: "Support for MongoDB 4.2 is removed": the driver "will now throw an error" against 4.2 or older. The README: "The driver currently supports 4.4+ servers." A minor, not a major, raised the server floor.
- **7.6.0** also fixed "Bundling the driver into ESM no longer throws `ReferenceError: require is not defined`", a break introduced in 7.2.0 by a runtime `require('os')`. A Nest app bundled to ESM output needs 7.6.0 or later; CommonJS builds weren't affected.
- **7.4.0**: "Explicit resource management is now stable" (`await using client = new MongoClient(…)`).
- **7.5.0**: `MongoClient.close()` has closed checked-out connections since 6.17.0, and from 7.5.0 on every server of a replica set or sharded cluster too; in-flight operations fail with `MongoClientClosedError`. Close the client in Nest's last shutdown hook, after the HTTP server drains.
- TypeScript: types are guaranteed to compile against "`typescript@5.6.0`" and later.

Mongoose 9.0.0 (2025-11-21) moved to driver 7 (`mongodb ~7.0`); 9.11.2 pins `~7.7`, so it inherits the 4.4 floor. Mongoose 8.24.5 stays on `~6.20.0`. `@nestjs/mongoose` 12.0.0 peers `mongoose ^7.0.0 || ^8.0.0 || ^9.0.0` and `@nestjs/core ^11.0.0 || ^12.0.0`, so it isn't a blocker for Nest 12.

## [NEST-014] Nest on Lambda or in a container
- Type: comparison
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [Nest docs: Serverless](https://docs.nestjs.com/faq/serverless) ([raw](https://raw.githubusercontent.com/nestjs/docs.nestjs.com/master/content/faq/serverless.md)), [Nest migration guide: Node.js requirements](https://docs.nestjs.com/migration-guide), [AWS Lambda: Building with Node.js, Experimental Node.js features](https://docs.aws.amazon.com/lambda/latest/dg/lambda-nodejs.html), [MongoDB Atlas: Manage connections with AWS Lambda](https://www.mongodb.com/docs/atlas/manage-connections-aws-lambda/), npm registry (`npm view @codegenie/serverless-express engines 'time[5.0.0]'`)
- Related: NEST-003, NEST-004, DOCKER-005, DOCKER-010

Nest's serverless page "doesn't cover the pros and cons of serverless functions", but says "Running a monolithic application as a serverless function rarely makes sense anyway". Its start times (a 2014 MacBook Pro, local script runs, not Lambda cold starts): Nest with Express 197.4 ms unbundled, 81.5 ms bundled with webpack; a standalone `createApplicationContext()` app 111.7 ms and 31.9 ms. A database connection at bootstrap adds its full time to every cold start.

Lambda specifics for Nest 12:
- Lambda passes `--no-experimental-require-module` on Node.js 20, 22 and 24, so a CommonJS Nest 12 app fails with `ERR_REQUIRE_ESM` (NEST-003) unless `NODE_OPTIONS=--experimental-require-module`; AWS: such functions "aren't eligible for the Lambda Service Level Agreement (SLA) or AWS Support". Bundling everything (NEST-004) or an ESM build avoids it.
- The adapter is `@codegenie/serverless-express`; 5.0.0 (2026-04-16) needs Node `>=24` and dropped callback handlers, while Nest's example still uses `nodejs22.x` and a `callback` argument.
- MongoDB: create the client outside the handler, `maxIdleTimeMS=60000` (Atlas page).

So: an HTTP API with many routes, long-lived connections or steady traffic stays a container (DOCKER-005), where `require(esm)` and connection pools need nothing special; a small event-driven function uses a standalone context, bundled. Lambda runtimes themselves: `kb-aws-lambda-node.md`.

## Recommendations for our setup

Ranked by impact against effort. Checked 2026-10-17 against `main` of osrs-tracker-api: Nest 12.1.2 with `@nestjs/cli` 12.0.8, a CommonJS app (`"module": "commonjs"`, no `"type"`) built with `nest build -b rspack` into a single bundle with its own `.js` lazy-import `IgnorePlugin` and a fork-ts-checker guard, `engines.node` `>=24`, the `mongodb` driver 7.7.0 used directly (no Mongoose) with `serverApi` `deprecationErrors`, hand-written pipes (no class-validator), `routeConflictPolicy` set, and a `node:24-alpine` container. Its lockfile already resolves `qs` 6.16.0, `body-parser` 2.3.0 and `proxy-addr` 2.0.8. No issue was opened: nothing below needs a change now.

1. **Keep the setup; it matches the sources** (NEST-003, NEST-004, NEST-011, NEST-012, NEST-013). Staying CommonJS is supported, the bundle avoids the CLI's lazy-import gap, and the driver is past 7.6.0's ESM and server-floor changes.
2. **When the API next validates a request body, use Zod with `StandardSchemaValidationPipe`, not class-validator** (NEST-007, NEST-008). Its hand-written pipes for route and query parameters are fine as they are.
3. **When `app.module.ts` is next touched, write `forRoutes('{*splat}')` instead of `forRoutes('*')`** (NEST-009). It converts silently today; the explicit form survives a future removal of the converter. Not worth its own PR.
4. **Won't do: move the API to Lambda** (NEST-014). It's an always-on HTTP API with a MongoDB pool, which Nest's own docs say rarely suits a function, and a CommonJS Nest 12 app there would run with an experimental flag outside the Lambda SLA.

## Open questions

- **`nest upgrade` not run** (NEST-006): the schematic's steps were read at 12.0.7, not executed; its GraphQL, NATS and Observe steps and most of `cli-config.step.ts` weren't read, nor the report's exact layout.
- **Upstream report for the lazy-import gap** (NEST-004): no issue was found in nestjs/nest-cli or nestjs/nest; whether to report it is the user's call.
- **path-to-regexp edge cases** (NEST-009): `ab*cd` read as a wildcard named `cd`, and `/:id?` failing at boot, come from reading path-to-regexp 8.4.2's source, not from a run.
- **`require(esm)` on Lambda's Node 26 runtime** (NEST-014): AWS's experimental-features table lists Node.js 20, 22 and 24 only; whether `nodejs26.x` enables `require(esm)` by default is for `kb-aws-lambda-node.md`.
- **`@codegenie/serverless-express` 5.0.0 on Node 22** (NEST-014): it declares `>=24` ("though earlier versions may work") while Nest's example uses `nodejs22.x` and a `callback`; not tested.
- **MongoDB compatibility matrix** (NEST-013): mongodb.com's driver compatibility page renders its tables client-side and wasn't readable raw; the 4.4 floor comes from the README, the upgrade page and the 7.6.0 release.
- **Atlas's Lambda MONGODB-AWS sample** (NEST-012, NEST-014) passes `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` as `auth` options, while the driver 7 notes say explicitly provided credentials are "no longer accepted" in "the URI or options". Not tested on 7.7.0; INDEX.md's Conflicts has the pair.

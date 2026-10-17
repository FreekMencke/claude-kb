# Docker images for Node apps

Prefix `DOCKER`. This file covers building container images for Node 24/26 servers on 2026-10-17: which base image (official `node` tags, Alpine and musl, distroless, Docker Hardened Images), a multi-stage Dockerfile for a bundled Angular SSR or NestJS server, npm inside the image, `.dockerignore` and build secrets, the non-root user and PID 1, pinning the base image, what image size does and doesn't change at startup, SBOM and provenance attestations, signing with cosign or GitHub artifact attestations, what Flux verifies, and building in GitHub Actions (cache backends, multi-arch). It stops at the pushed image: deploying it to a cluster is in `kb-kubernetes-flux.md` (KUBE). Node's release lines are in `kb-nodejs.md` (NODE), `npm ci` and install scripts in `kb-npm.md` (NPM), and Actions hardening in `kb-github-actions.md` (GHA).

Research basis:
- Researched 2026-10-17 (FreekMencke/claude-kb#185, part of roadmap #167) by an Opus 5.5 lead with three Sonnet 5.5 readers (base images and startup; attestations, signing and Flux; builds in GitHub Actions).
- Docs read as raw Markdown from `docs.docker.com/<page>.md`; GitHub files from `raw.githubusercontent.com` (nodejs/docker-node, docker-library/official-images, GoogleContainerTools/distroless, docker-hardened-images/catalog, nodejs/node at `v24.x` and `v26.x`, npm/cli, docker/build-push-action at `v7.4.0`, fluxcd controllers, github/docs); release notes from the GitHub releases API.
- No Docker engine ran in this session (Docker Desktop's daemon was off), so no image was built. Image tags, sizes, configs and attestations were read from the Docker Hub registry API with `curl` (anonymous pull token, `linux/amd64` manifests). npm and signal behaviour were tested with Node 24.21.0 and npm 11.19.0 on WSL2.
- Our setup was read on 2026-10-17 from `main` of osrs-tracker-web, osrs-tracker-api, freek-mencke-web and this repo's `mcp-server/Dockerfile`.

## Quick answers

| Question | Answer | Entries |
|---|---|---|
| Which base image for a Node 24 or 26 server? | `node:24-alpine` (or `26-alpine` once 26 is LTS on 2026-10-28), pinned by digest, for a bundled server with no glibc-only native modules; `node:24-trixie-slim` when a dependency needs glibc. Distroless or a Docker Hardened Image only when "no shell, no npm" in production is worth an extra registry or login. | DOCKER-004, DOCKER-001, DOCKER-002, DOCKER-003 |
| What does `node:24-alpine`, `node:24-slim` or `node:lts` point to? | `24-alpine` is Alpine 3.24, `24-slim` is Debian 12 (bookworm), not 13; `lts` is 24 until Node 26 becomes LTS on 2026-10-28. Compressed amd64 sizes: 62 MB alpine, 81 MB slim, 412 MB full. Node 26 images ship no Yarn. | DOCKER-001 |
| Is Alpine (musl) safe for production Node? | On amd64 for Node 26: Node lists x64 musl as Tier 2. For Node 24 it's "Experimental", and arm64 images are compiled from source in the image build, untested by Node. Native modules need musl prebuilds (sharp has them). | DOCKER-002 |
| Are Docker Hardened Images free, and how do I pull them? | Yes, the Community tier, under Apache 2.0 since 2025-12-17, from `dhi.io` after `docker login dhi.io`. The Node runtime image has no shell or npm and runs as `node` (UID 1000); `-dev` tags have npm. The 7-day CVE SLA is paid. | DOCKER-003 |
| What does a Dockerfile for an Angular SSR or NestJS app look like? | Two stages on the same pinned image: `npm ci` and the build in the first; only `dist` (plus any external native module) in the second, `USER` set, exec-form `CMD ["node", …]`. A bundled server needs no `node_modules` at run time. | DOCKER-005 |
| Why are my devDependencies missing in the Docker build? | `NODE_ENV=production` set before `npm ci` makes npm default to `--omit=dev`. Set it only in the runtime stage. npm 12 also skips dependencies' install scripts unless `allowScripts` approves them. | DOCKER-006 |
| How do I pass an npm token into a build without leaking it? | A secret mount (`RUN --mount=type=secret,id=npmrc,target=/root/.npmrc npm ci`), never `ARG` or `ENV`: those persist, and `mode=max` provenance publishes build-arg values. | DOCKER-007, DOCKER-011 |
| Why does my Node container ignore SIGTERM and wait to be killed? | Node as PID 1 ignores SIGTERM unless the app handles it (tested). Add a SIGTERM handler that closes the server, or run with an init (`--init`, tini, dumb-init). Also use a numeric `USER` so `runAsNonRoot` can verify it. | DOCKER-008 |
| Pin the base image by tag or by digest? | Digest, with the tag kept for reading (`node:24-alpine@sha256:…`), and Dependabot's `docker` ecosystem to bump it; ignore Node majors there and do them by hand. | DOCKER-009 |
| Does a smaller image start faster? | Only on a cold pull: cached layers aren't downloaded again. After that, start time is the app's: module loading (a bundle helps), the compile cache, and the heap sized from the cgroup limit. | DOCKER-010 |
| Does build-push-action add SBOM or provenance by default? | Provenance yes: `mode=max` in a public repo (it publishes the Dockerfile and build-arg values), `mode=min` in a private one; since BuildKit 0.28 as SLSA v1. No SBOM unless `sbom: true`. | DOCKER-011 |
| cosign or GitHub artifact attestations for signing an image? | cosign v3 keyless (`id-token: write`, `cosign sign --yes <image>@<digest>`) works with any registry and admission controller; `actions/attest` v4 stores signed provenance in GitHub's API (free plans: public repos only). Either needs a cluster-side check to matter. | DOCKER-012, DOCKER-013 |
| Can Flux refuse an unsigned image? | Not for workloads: Flux's `verify` covers its own sources (OCIRepository, OCI HelmChart), not images a Deployment runs. That takes an admission controller (Sigstore policy-controller, Kyverno). | DOCKER-013 |
| How do I cache Docker builds in GitHub Actions? | `cache-from: type=gha` and `cache-to: type=gha,mode=max,scope=<image>`; `mode=min` caches no builder-stage layers. Runs on `workflow_run`, `pull_request_target` or `issue_comment` get read-only cache, so export from a `push` run. Cache mounts aren't kept without buildkit-cache-dance. | DOCKER-014 |
| QEMU or native arm64 runners for a multi-arch image? | Native: Docker says QEMU "can be much slower". One `ubuntu-24.04-arm` job per platform, pushed by digest and merged, or Docker's GitHub Builder reusable workflow, which does that for you. | DOCKER-015 |

## Index

| ID | Title | Type | Tags |
|---|---|---|---|
| DOCKER-001 | Official `node` image tags on 2026-10-17: what each points to, and sizes | fact | node-image, alpine, slim, lts, image-size |
| DOCKER-002 | Alpine and musl: Node's support tier and native modules | fact | alpine, musl, native-modules, sharp, arm64 |
| DOCKER-003 | Distroless, Docker Hardened Images and Chainguard for Node | comparison | distroless, docker-hardened-images, chainguard, nonroot |
| DOCKER-004 | Choosing a base image for a Node 24/26 server | recommendation | base-image, alpine, slim, distroless |
| DOCKER-005 | Multi-stage Dockerfile for a bundled Angular SSR or NestJS server | pattern | dockerfile, multi-stage, angular-ssr, nestjs |
| DOCKER-006 | npm inside the image: `NODE_ENV`, `--omit=dev`, cache mounts, npm 12 scripts | fact | npm-ci, omit-dev, node-env, cache-mount |
| DOCKER-007 | `.dockerignore` and build secrets | fact | dockerignore, build-context, secrets, build-args |
| DOCKER-008 | Non-root user and PID 1: signals and `runAsNonRoot` | fact | non-root, pid-1, sigterm, tini |
| DOCKER-009 | Pin the base image by digest and let Dependabot bump it | recommendation | digest-pinning, dependabot, base-image |
| DOCKER-010 | Image size and startup: what actually changes start time | fact | image-size, startup, compile-cache, heap |
| DOCKER-011 | SBOM and provenance attestations: buildx and build-push-action defaults | fact | provenance, sbom, slsa, attestations, buildx |
| DOCKER-012 | Signing images: cosign keyless or GitHub artifact attestations | comparison | cosign, sigstore, artifact-attestations, signing |
| DOCKER-013 | What Flux verifies, and where a workload image check lives | fact | flux, verification, admission-controller, cosign |
| DOCKER-014 | Build cache in GitHub Actions: `type=gha`, its limits and read-only triggers | fact | build-cache, gha-cache, build-push-action, workflow-run |
| DOCKER-015 | Multi-arch images: QEMU, native arm64 runners or Docker's GitHub Builder | comparison | multi-arch, arm64, qemu, github-builder |

## [DOCKER-001] Official `node` image tags on 2026-10-17: what each points to, and sizes
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [docker-library/official-images: library/node](https://raw.githubusercontent.com/docker-library/official-images/master/library/node), [nodejs/docker-node README](https://raw.githubusercontent.com/nodejs/docker-node/main/README.md), [nodejs/docker-node versions.json](https://raw.githubusercontent.com/nodejs/docker-node/main/versions.json)
- Related: NODE-001, DOCKER-002, DOCKER-009

The floating tags hide which OS and Node line you get. From `library/node` on 2026-10-17:

| Tag | Resolves to | Architectures |
|---|---|---|
| `24-alpine`, `lts-alpine` | 24.22.0 on Alpine 3.24 | amd64, arm64v8, s390x |
| `24-slim`, `lts-slim` | 24.22.0 on Debian 12 `bookworm-slim` | amd64, arm64v8, ppc64le |
| `24`, `lts` | 24.22.0 on Debian 12 `bookworm` | amd64, arm64v8, ppc64le |
| `26-alpine`, `alpine` | 26.12.0 on Alpine 3.24 | amd64, arm64v8 |

- `-slim` is still Debian 12; Debian 13 needs `-trixie-slim` explicitly.
- `lts` follows Node's Active LTS, so `lts*` tags move to 26 when it becomes LTS on 2026-10-28 (`versions.json`). A major moving under a rebuild is a reason to name the major.
- "Yarn v1 is not bundled into `node` images as of Node.js 26.0.0" (README).
- The images run as root: the config's `User` is unset. They ship a `node` user with UID 1000 (DOCKER-008).

Tested 2026-10-17, Docker Hub registry API (no Docker engine), sum of compressed layers of the `linux/amd64` manifest: `24-alpine` 62.4 MB, `26-alpine` 62.9 MB, `24-slim` 81.0 MB, `26-slim` 85.8 MB, `24` 412.1 MB. Every index also carries an SPDX SBOM and SLSA v0.2 provenance per platform (DOCKER-011).

## [DOCKER-002] Alpine and musl: Node's support tier and native modules
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [nodejs/node BUILDING.md, v24.x](https://raw.githubusercontent.com/nodejs/node/v24.x/BUILDING.md), [nodejs/node BUILDING.md, v26.x](https://raw.githubusercontent.com/nodejs/node/v26.x/BUILDING.md), [nodejs/docker-node README](https://raw.githubusercontent.com/nodejs/docker-node/main/README.md), [docker-node 24/alpine3.24 Dockerfile](https://raw.githubusercontent.com/nodejs/docker-node/main/24/alpine3.24/Dockerfile), [sharp: installation](https://sharp.pixelplumbing.com/install), [npm config v11](https://docs.npmjs.com/cli/v11/using-npm/config)
- Related: NPM-017, DOCKER-004, DOCKER-015

Alpine uses musl, not glibc, and Node supports it less than Debian:
- Node 24's platform table: "GNU/Linux | x64 | kernel >= 3.10, musl >= 1.1.19 | Experimental". Experimental: "Test failures on experimental platforms do not block releases."
- Node 26's: "x64 | kernel >= 6.12, musl >= 1.2.5 | Tier 2", with `linux-x64-musl` an official binary. Node's advice: "For production applications, run Node.js on supported platforms only (Tier 1 or 2)."
- The `node:*-alpine` Dockerfiles download the official `linux-x64-musl` tarball on amd64 and compile Node from source on arm64 and s390x. docker-node: "`musl` builds for other architectures, including `arm64`, are not tested before release." Its README still calls amd64 musl "Experimental", which is stale for 26.

Native modules need a musl prebuild or a compiler in the build stage (`apk add python3 make g++`, docker-node's BestPractices). npm picks optional platform packages by `os`, `cpu` and `libc`, and `--os`, `--cpu` and `--libc` override them when the install host isn't the target. sharp ships musl prebuilds ("Linux x64 (glibc >= 2.28, musl >= 1.2.5, CPU with SSE4.2)", and arm64) and documents `npm install --cpu=x64 --os=linux --libc=musl sharp`. A glibc-only binary may run with `apk add --no-cache gcompat`; otherwise use a Debian image.

## [DOCKER-003] Distroless, Docker Hardened Images and Chainguard for Node
- Type: comparison
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [Docker press release, 2025-12-17](https://www.docker.com/press-release/docker-makes-hardened-images-free-open-and-transparent-for-everyone/), [Docker Hardened Images](https://docs.docker.com/dhi/), [Use a DHI](https://docs.docker.com/dhi/get-started/how-to/use/), [DHI catalog: node](https://github.com/docker-hardened-images/catalog/tree/main/image/node), [DHI migration checklist](https://docs.docker.com/dhi/migration/checklist/), [distroless README](https://raw.githubusercontent.com/GoogleContainerTools/distroless/main/README.md), [distroless common/variables.bzl](https://raw.githubusercontent.com/GoogleContainerTools/distroless/main/common/variables.bzl), [Chainguard container categories](https://edu.chainguard.dev/chainguard/containers/concepts/container-categories/)
- Related: DOCKER-004, DOCKER-012

Three runtime images without a shell or package manager:

| | Distroless | Docker Hardened Images (Community) | Chainguard (free) |
|---|---|---|---|
| Node image | `gcr.io/distroless/nodejs24-debian13` (22, 26 too) | `dhi.io/node:24-alpine`, Debian 12/13 too; `-dev` tags for building | `cgr.dev/chainguard/node` |
| Pull | anonymous | "You must authenticate to `dhi.io`" (`docker login dhi.io`, free account) | anonymous |
| Pinned versions | yes | yes | "limited to the latest build", tags `latest` and `latest-dev` only |
| Default user | `latest`: root; `nonroot` tag: UID 65532 | runtime: `node`, UID 1000; `-dev`: root | not checked |
| Signed | cosign keyless | signatures, SBOM, SLSA L3 provenance, VEX | not checked |

- DHI became free on 2025-12-17: "free and fully open source under the Apache 2.0 license", "No subscription required". The "Critical CVE fixes < 7 days with SLA-backed continuous patching" and FIPS/STIG variants are paid tiers.
- DHI's migration checklist says runtime images "run as nonroot (UID 65532)", but the Node image's catalog definition says `run-as: node`, `uid: 1000`; trust the per-image definition and inspect the image.
- No shell means no `docker exec sh`: distroless offers `debug` tags with busybox, DHI the `-dev` variant.

## [DOCKER-004] Choosing a base image for a Node 24/26 server
- Type: recommendation
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [Docker: building best practices](https://docs.docker.com/build/building/best-practices/), [nodejs/docker-node README](https://raw.githubusercontent.com/nodejs/docker-node/main/README.md), [nodejs/docker-node BestPractices](https://raw.githubusercontent.com/nodejs/docker-node/main/docs/BestPractices.md)
- Related: DOCKER-001, DOCKER-002, DOCKER-003, NODE-001

Docker's advice is a trusted source (an Official Image, Verified Publisher or hardened image) and "a minimal base image that matches your requirements", with one image for building and a slimmer one for production. For a Node server, in order:

1. **`node:<major>-alpine`**, pinned by digest (DOCKER-009), when the server is bundled or its native dependencies have musl prebuilds. Smallest official image (DOCKER-001). Prefer 26 once it's LTS (2026-10-28), where x64 musl is Tier 2 (DOCKER-002).
2. **`node:<major>-trixie-slim`** when a dependency is glibc-only, or for arm64 images, where Alpine's Node is compiled in the image build and untested upstream. Name the Debian release: plain `-slim` is still Debian 12.
3. **Distroless or a DHI runtime image** for the final stage when the attack surface matters more than debugging with a shell, and you can live with a second registry (DHI needs a login and pull secrets). Build in the matching `-dev` or official image.

docker-node's "Smaller images without npm/yarn" copies `/usr/local/bin/node` onto plain `alpine` or `debian:trixie-slim`, a do-it-yourself version of option 3. Never use `node:latest` or a bare `lts` tag for production: both change major on their own.

## [DOCKER-005] Multi-stage Dockerfile for a bundled Angular SSR or NestJS server
- Type: pattern
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [Docker: building best practices](https://docs.docker.com/build/building/best-practices/), [Docker: optimize cache usage](https://docs.docker.com/build/cache/optimize/), [nodejs/docker-node BestPractices](https://raw.githubusercontent.com/nodejs/docker-node/main/docs/BestPractices.md), [this repo's mcp-server/Dockerfile](https://github.com/FreekMencke/claude-kb/blob/main/mcp-server/Dockerfile)
- Related: DOCKER-006, DOCKER-007, DOCKER-008, NPM-016

Our three apps and this repo's MCP server use the same shape:

```dockerfile
FROM node:24-alpine@sha256:<digest> AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci                      # all dependencies: the build needs devDependencies
COPY . .
RUN npm run build               # Angular SSR or a bundler emits dist/ with dependencies inlined

FROM node:24-alpine@sha256:<digest> AS production
WORKDIR /app
COPY --from=build /app/dist ./dist
ENV NODE_ENV=production
USER 1000:1000
CMD ["node", "dist/<app>/server/server.mjs"]
```

- Copy the manifests and run `npm ci` before `COPY . .`, so a source change reuses the install layer.
- A bundled server (Angular's server build, NestJS through rspack or esbuild) needs no `node_modules` at run time. Otherwise install them in the runtime stage with `npm ci --omit=dev` (DOCKER-006), or copy a pruned tree.
- A dependency the bundle keeps external (osrs-tracker-api's `sharp`) is installed alone in the runtime stage, at the version `package.json` pins.
- Exec-form `CMD ["node", …]`, not `npm start`: docker-node says npm swallows "exit signals such as `SIGTERM` and `SIGINT`" (DOCKER-008).
- Both stages pin the same digest, so Dependabot bumps them together (DOCKER-009).

## [DOCKER-006] npm inside the image: `NODE_ENV`, `--omit=dev`, cache mounts, npm 12 scripts
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [npm/cli config definitions, v11.19.1](https://raw.githubusercontent.com/npm/cli/v11.19.1/workspaces/config/lib/definitions/definitions.js), [Docker: optimize cache usage](https://docs.docker.com/build/cache/optimize/), [nodejs.org dist index](https://nodejs.org/dist/index.json), [nodejs/docker-node BestPractices](https://raw.githubusercontent.com/nodejs/docker-node/main/docs/BestPractices.md)
- Related: NPM-004, NPM-016, NODE-015, DOCKER-014

- **`NODE_ENV` changes `npm ci`.** npm's `omit` defaults to "'dev' if the `NODE_ENV` environment variable is set to 'production'; otherwise, empty." An `ENV NODE_ENV=production` above the build stage's `npm ci` drops the devDependencies the build needs. Set it in the runtime stage only, or pass `--include=dev`.
- **`--omit=dev` for a runtime `node_modules`.** "If the resulting omit list includes 'dev', then the `NODE_ENV` environment variable will be set to 'production' for all lifecycle scripts."
- **Cache mounts.** `RUN --mount=type=cache,target=/root/.npm npm ci` keeps npm's download cache across local builds; as a non-root build user the cache is in that user's home. In CI it starts empty on each runner (DOCKER-014).
- **The image's npm.** `node:24.22.0` bundles npm 11.19.1 and `node:26.12.0` npm 11.20.0 (`nodejs.org/dist/index.json`). docker-node: to change it, `RUN npm install --global npm@<version>`. On npm 12 (NODE-015), `npm ci` skips dependencies' install scripts that `allowScripts` doesn't approve, and still exits 0 (NPM-004): a Docker build then succeeds with, for example, no native binary. `npm ci --ignore-scripts`, as `mcp-server/Dockerfile` does, is the explicit version for a bundle that needs none.

Tested 2026-10-17, npm 11.19.0, Node 24.21.0, WSL2: with `ms` as a dependency and `is-number` as a devDependency, `NODE_ENV=production npm ci --ignore-scripts` installed only `ms`; plain `npm ci` installed both.

## [DOCKER-007] `.dockerignore` and build secrets
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [Docker: build context, .dockerignore](https://docs.docker.com/build/concepts/context/#dockerignore-files), [Docker: build secrets](https://docs.docker.com/build/building/secrets/), [Docker: provenance attestations](https://docs.docker.com/build/metadata/attestations/slsa-provenance/), [docker/build-push-action README v7.4.0](https://raw.githubusercontent.com/docker/build-push-action/v7.4.0/README.md)
- Related: DOCKER-005, DOCKER-011, GHA-020

**`.dockerignore`.** The client removes matching files "from the build context before it's sent to the builder". Exclude `node_modules`, `dist`, `.git`, `.env*` and agent folders (`.claude`, `CLAUDE.md`): with `COPY . .`, anything left in the context reaches the build stage and busts its cache when it changes. A file named `<name>.Dockerfile.dockerignore` next to a Dockerfile "takes precedence over the `.dockerignore` file at the root of the build context"; this repo's `mcp-server/Dockerfile.dockerignore` uses that.

build-push-action defaults to the Git context, where "any file mutation in the steps that precede the build step will be ignored, including processing of the `.dockerignore` file"; `context: .` after `actions/checkout` sends the runner's files instead, which a step that generates files (sitemaps) needs.

**Secrets.** "Build arguments and environment variables are inappropriate for passing secrets to your build, because they persist in the final image." Use a secret mount:

```dockerfile
RUN --mount=type=secret,id=npmrc,target=/root/.npmrc npm ci
```

with `docker build --secret id=npmrc,src=$HOME/.npmrc .` (or build-push-action's `secrets`/`secret-files`). Provenance in `mode=max` "exposes the values of build arguments", while secret mounts "are never included in provenance attestations" (DOCKER-011).

## [DOCKER-008] Non-root user and PID 1: signals and `runAsNonRoot`
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [nodejs/docker-node BestPractices](https://raw.githubusercontent.com/nodejs/docker-node/main/docs/BestPractices.md), [docker-node docker-entrypoint.sh](https://raw.githubusercontent.com/nodejs/docker-node/main/24/alpine3.24/docker-entrypoint.sh), [Docker: building best practices, USER](https://docs.docker.com/build/building/best-practices/#user), [kubelet security_context_others.go](https://raw.githubusercontent.com/kubernetes/kubernetes/master/pkg/kubelet/kuberuntime/security_context_others.go)
- Related: DOCKER-005, DOCKER-003

**PID 1.** The `node` images' entrypoint ends in `exec "$@"`, so `node` becomes PID 1. docker-node: "Node.js was not designed to run as PID 1 … a Node.js process running as PID 1 will not respond to `SIGINT` (`CTRL-C`) and similar signals." A stop then waits until the runtime kills it: `docker stop`'s timeout, or the pod's termination grace period. Fix it in the app with `process.once('SIGTERM', …)` that closes the server and exits, or run under an init: `docker run --init`, tini, or `dumb-init` as in docker-node's examples.

**Non-root.** The images run as root unless told otherwise; they ship a `node` user "with uid 1000". Set `USER` in the runtime stage, and prefer the number (`USER 1000:1000`, or `10001:10001` as this repo's MCP server does): Docker says to "consider an explicit UID/GID", and Kubernetes' `runAsNonRoot` can't check a name. The kubelet refuses to start the pod with "container has runAsNonRoot and image has non-numeric user (node), cannot verify user is non-root" unless the pod also sets `runAsUser`.

Tested 2026-10-17, Node 24.21.0 as PID 1 of a new PID namespace (`unshare -rpf --mount-proc`, WSL2): with no handler, SIGTERM left it running 2 s later; with a `SIGTERM` handler it exited; outside a PID namespace the same no-handler script exited.

## [DOCKER-009] Pin the base image by digest and let Dependabot bump it
- Type: recommendation
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [Docker: building best practices, pin base image versions](https://docs.docker.com/build/building/best-practices/#pin-base-image-versions), [Docker: rebuild your images often](https://docs.docker.com/build/building/best-practices/#rebuild-your-images-often)
- Related: DOCKER-001, JSUP-012, GHA-012

"Image tags are mutable", so a rebuild of `FROM node:24-alpine` can produce a different image with no change in the repo. Docker: "To fully secure your supply chain integrity, you can pin the image version to a specific digest", at the cost of "opting out of automated security fixes", which it closes with "GitHub Dependabot with `package-ecosystem: "docker"`. Dependabot raises pull requests to update your base image tags and digests on a schedule. This is better than using a tag that changes the version automatically, because you're in control and you have an audit trail".

Write both: `FROM node:24-alpine@sha256:<digest>`. The tag stays readable and tells Dependabot which line to follow; the digest is what's pulled. Our apps do this, with a weekly `docker` entry that ignores `version-update:semver-major` for `node`, because a Node major also moves CI's setup-node, `engines` and `@types/node` (NODE-014).

Docker's other half: "rebuild your images regularly". A pinned digest is only as fresh as the last merged bump, and an app that isn't redeployed keeps the old base until its next build: a digest-pinned image keeps the Node patch it was built with, even after the tag it came from has moved on.

## [DOCKER-010] Image size and startup: what actually changes start time
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [Kubernetes: images](https://kubernetes.io/docs/concepts/containers/images/), [Node v24 module.md: compile cache](https://raw.githubusercontent.com/nodejs/node/v24.x/doc/api/module.md), [Node v24 src/api/environment.cc](https://raw.githubusercontent.com/nodejs/node/v24.x/src/api/environment.cc), [Node v24 cli.md](https://raw.githubusercontent.com/nodejs/node/v24.x/doc/api/cli.md)
- Related: DOCKER-001, DOCKER-005, NODE-001

No official source gives a size-to-startup figure. What the sources support:
- **Size matters on a cold pull.** The runtime "downloads any layers that are not already cached locally. If all layers are already present, the container runtime uses the cached image". Base layers shared by every app on a node are pulled once, so a 62 MB Alpine base costs little after the first app.
- **Module loading.** A bundled server reads one file instead of resolving `node_modules`. Node's startup snapshots expect that too: "Users can bundle their applications into a single script … before building a snapshot" (`--build-snapshot`, stable since v24.13.1).
- **Compile cache.** `module.enableCompileCache()` or `NODE_COMPILE_CACHE=dir` (stable since v24.15.0) reuses V8's code cache: "subsequent loads of the same module graph may get a significant speedup". It's written on exit to `os.tmpdir()` by default, so a fresh container with a read-only root starts without it unless the cache is generated at build time with the same Node version and paths (untested).
- **Heap.** Node 24 sizes V8's heap from `min(total memory, cgroup limit)`: "Tell V8 to configure the heap based on the actual physical memory". Set `--max-old-space-size` (or `--max-old-space-size-percentage`) only to leave room for off-heap memory.

## [DOCKER-011] SBOM and provenance attestations: buildx and build-push-action defaults
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [Docker: build attestations](https://docs.docker.com/build/metadata/attestations/), [Docker: provenance attestations](https://docs.docker.com/build/metadata/attestations/slsa-provenance/), [Docker: attestations in GitHub Actions](https://docs.docker.com/build/ci/github-actions/attestations/), [build-push-action src/context.ts v7.4.0](https://raw.githubusercontent.com/docker/build-push-action/v7.4.0/src/context.ts), [BuildKit releases](https://github.com/moby/buildkit/releases)
- Related: DOCKER-007, DOCKER-012, NPM-012, GHA-011

- **buildx:** "Provenance attestations with the `mode=min` level are added to images by default"; turn off with `--provenance=false` or `BUILDX_NO_DEFAULT_ATTESTATIONS`.
- **build-push-action v7:** "If the GitHub repository is public, provenance attestations with `mode=max` are automatically added", `mode=min` (inline-only) if private; none with `load: true` or the docker exporter. "SBOM attestations aren't automatically added": set `sbom: true` (BuildKit's Syft scanner; final stage only by default).
- **min or max.** `min` holds timestamps, frontend, materials, source repo and revision. `max` adds the LLB definition, the Dockerfile and source maps, and "exposes the values of build arguments" (DOCKER-007).
- **Format.** BuildKit v0.28.0 (2026-03-04): "The default provenance format has been switched to SLSA v1.0 from the previous v0.2." Docker's provenance page still says v0.2 (INDEX.md Conflicts). BuildKit v0.32.0 made attestations "default to OCI artifact descriptors".
- **Inspect** without pulling: `docker buildx imagetools inspect <image> --format '{{ json .Provenance.SLSA }}'` (`.SBOM.SPDX` for the SBOM). The classic image store can't hold them; `--load` needs the containerd store.

Provenance is unsigned metadata: it says how the image was built but proves nothing until signed (DOCKER-012).

Tested 2026-10-17, Docker Hub registry API: `node:24-alpine` carries `https://spdx.dev/Document` and `https://slsa.dev/provenance/v0.2` per platform (builder `https://github.com/docker-library`). Our web image, built by build-push-action v7.4.0 in a public repo with no attestation inputs, carries one `https://slsa.dev/provenance/v1` statement with the build definition (`mode=max`) and the workflow's `github_*` metadata, as an OCI artifact with a `subject`, and no SBOM.

## [DOCKER-012] Signing images: cosign keyless or GitHub artifact attestations
- Type: comparison
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [cosign CHANGELOG](https://raw.githubusercontent.com/sigstore/cosign/main/CHANGELOG.md), [cosign releases](https://github.com/sigstore/cosign/releases), [Sigstore: signing containers](https://docs.sigstore.dev/cosign/signing/signing_with_containers/), [cosign-installer README](https://github.com/sigstore/cosign-installer), [actions/attest README](https://github.com/actions/attest), [actions/attest-build-provenance README](https://github.com/actions/attest-build-provenance), [GitHub: using artifact attestations](https://docs.github.com/en/actions/how-tos/secure-your-work/use-artifact-attestations/use-artifact-attestations)
- Related: DOCKER-011, DOCKER-013, NPM-012

Both sign with a short-lived Sigstore certificate from the workflow's OIDC token (`permissions: id-token: write`); neither needs a key.

| | cosign v3 (v3.1.3, 2026-08-06) | `actions/attest` v4 |
|---|---|---|
| Step | `sigstore/cosign-installer`, then `cosign sign --yes <image>@<digest>` (digest from build-push-action's output) | `uses: actions/attest@v4` with `subject-name`, `subject-digest`, `push-to-registry: true` |
| Stored | in the registry, as an OCI 1.1 referrer in the Sigstore bundle format (v3's defaults) | GitHub's attestations API, plus the registry with `push-to-registry` |
| Verify | `cosign verify <image> --certificate-identity-regexp … --certificate-oidc-issuer https://token.actions.githubusercontent.com` | `gh attestation verify oci://<image> -R <owner>/<repo>` |
| Limits | any registry with referrers; "Some registries support deletion too (DockerHub does not)" | Free, Pro and Team plans: public repos only |

- `attest-build-provenance` is now "simply a wrapper on top of `actions/attest`… new implementations should use `actions/attest` instead". Permissions: `id-token: write`, `attestations: write`, `artifact-metadata: write`.
- cosign: "Cosign v3 is a minor change from Cosign v2.6.x, with all of the new capabilities of recent releases on by default". v3.1.3 and v2.6.5 fix a "verification bypass using an unexpected public key in a legacy bundle".
- GitHub's and cosign-installer's examples pin older action majors (build-push-action v5 and v6, setup-buildx v3): copy the steps, not the versions.

A signature only matters where something refuses unsigned images (DOCKER-013).

## [DOCKER-013] What Flux verifies, and where a workload image check lives
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [Flux: OCIRepository, verification](https://fluxcd.io/flux/components/source/ocirepositories/#verification), [Flux: HelmChart](https://fluxcd.io/flux/components/source/helmcharts/), [Flux: ImageRepository](https://fluxcd.io/flux/components/image/imagerepositories/), [GitHub: enforcing artifact attestations](https://docs.github.com/en/actions/how-tos/secure-your-work/use-artifact-attestations/enforce-artifact-attestations)
- Related: DOCKER-012, INFRA-013

Flux verifies its own sources, not the images its manifests run:
- OCIRepository: "`.spec.verify` is an optional field to enable the verification of Cosign or Notation signatures", keyless with `matchOIDCIdentity` (`issuer` and `subject` regexps, e.g. `^https://token.actions.githubusercontent.com$`). HelmChart from an OCI registry has the same field; GitRepository's `verify` checks commit and tag signatures.
- ImageRepository and ImagePolicy (image automation) have no verify field; their default `exclusionList` `"^.*\\.sig$"` only skips cosign's signature tags. An unsigned tag is picked up like any other.

So a Deployment applied from Git with a digest that CI wrote runs whatever that digest is. Refusing unsigned or unattested images takes an admission controller that checks each Pod: GitHub's guide uses the Sigstore Policy Controller with a `ClusterImagePolicy` (Kubernetes 1.27 or later, `push-to-registry` set); Kyverno's `verifyImages` is the common alternative. Not checked: whether either accepts cosign v3's bundle-format referrer signatures from Docker Hub. Cluster setup belongs to `kb-kubernetes-flux.md` (KUBE).

## [DOCKER-014] Build cache in GitHub Actions: `type=gha`, its limits and read-only triggers
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [Docker: GitHub Actions cache backend](https://docs.docker.com/build/cache/backends/gha/), [Docker: cache management with GitHub Actions](https://docs.docker.com/build/ci/github-actions/cache/), [Docker: cache storage backends](https://docs.docker.com/build/cache/backends/), [GitHub: dependency caching reference](https://docs.github.com/en/actions/reference/workflows-and-actions/dependency-caching)
- Related: GHA-019, GHA-008, DOCKER-006

A fresh runner has no layer cache: every build is cold unless it imports one.
- **`type=gha`** is "the recommended cache to use inside your GitHub Actions workflows, as long as your use case falls within the size and usage limits set by GitHub" (the backends overview still labels it beta). Use `cache-from: type=gha` and `cache-to: type=gha,mode=max`.
- **`mode=max`.** "In `min` cache mode (the default), only layers that are exported into the resulting image are cached": a multi-stage build's `npm ci` and build layers need `max`.
- **`scope`** defaults to `buildkit`; "If you build multiple images, each build will overwrite the cache of the previous". Set `scope=<image>`.
- **Limits.** "10 GB per repository" by default, entries unused "in over 7 days" removed, oldest-accessed evicted first. Only the v2 cache API works since 2025-04-15 (Buildx 0.21+, BuildKit 0.20+).
- **Read-only triggers.** Runs on `pull_request_target`, `issue_comment` and `workflow_run` get read-only cache (2026-06-26 change); `cache-to` then fails with "failed to reserve cache". Docker: keep `cache-from`, drop `cache-to`, and fill the cache from a `push` workflow. Granting write with `cache-mode` "reintroduces the risk of cache-poisoning" (GHA-019).
- **Cache mounts.** "BuildKit doesn't preserve cache mounts in the GitHub Actions cache by default"; Docker points to `reproducible-containers/buildkit-cache-dance`.
- **`type=registry`** (`ref=<image>:buildcache,mode=max`) fits caches above GitHub's limit or builds outside Actions; `type=inline` "only supports `min`".

## [DOCKER-015] Multi-arch images: QEMU, native arm64 runners or Docker's GitHub Builder
- Type: comparison
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [Docker: multi-platform builds](https://docs.docker.com/build/building/multi-platform/), [Docker: multi-platform image with GitHub Actions](https://docs.docker.com/build/ci/github-actions/multi-platform/), [Docker GitHub Builder: architecture](https://docs.docker.com/build/ci/github-actions/github-builder/architecture/), [Dockerfile reference: automatic platform ARGs](https://docs.docker.com/reference/dockerfile/#automatic-platform-args-in-the-global-scope), [npm config v11](https://docs.npmjs.com/cli/v11/using-npm/config)
- Related: GHA-002, DOCKER-002, NPM-017

Docker lists three ways: QEMU emulation, "a builder with multiple native nodes", and cross-compilation. "Emulation with QEMU can be much slower than native builds, especially for compute-heavy tasks like compilation and compression or decompression. Use multiple native nodes or cross-compilation instead, if possible." No official speed figure was found.

| Approach | How |
|---|---|
| QEMU | `docker/setup-qemu-action@v4`, then `platforms: linux/amd64,linux/arm64` in one job. No Dockerfile change. |
| Native runners | One job per platform (`ubuntu-24.04-arm` for arm64), each pushing by digest (`push-by-digest=true,name-canonical=true`), then a job running `docker buildx imagetools create` over the digests. Docker's page now leaves this to the GitHub Builder; the manual recipe is in earlier revisions of it. |
| Docker GitHub Builder | `uses: docker/github-builder/.github/workflows/build.yml@v1`: "With `distribute: true`, which is the default, the workflow splits the build into one platform per runner and assembles the final multi-platform image"; it maps `linux/arm64` to `ubuntu-24.04-arm` and needs GitHub-hosted Linux runners and `id-token: write`. Its own repo wasn't read. |
| Cross-compile | `FROM --platform=$BUILDPLATFORM` for the build stage, `ARG TARGETARCH` inside it. |

For Node, cross-compiling fits a pure-JS bundle; native dependencies installed on `$BUILDPLATFORM` need `npm ci --os=linux --cpu=<arch> --libc=<glibc|musl>`, and the runtime stage still runs on the target (untested). Alpine arm64 images carry Node compiled from source (DOCKER-002).

## Recommendations for our setup

Ranked by impact against effort. Checked 2026-10-17 against `main` of osrs-tracker-web, osrs-tracker-api and freek-mencke-web: two-stage Dockerfiles on `node:24-alpine` pinned by digest (both stages), Dependabot's `docker` ecosystem weekly with Node majors ignored, bundled servers with no runtime `node_modules` (osrs-tracker-api installs `sharp` alone), `USER node` with pod-level `runAsUser: 1000`, SIGTERM handlers in all three servers, and a deploy workflow on `workflow_run` that builds with build-push-action v7.4.0 (`context: .`, no cache, amd64 only, no attestation inputs) and pushes to Docker Hub. No issue was opened: nothing below needs a change now.

1. **Keep the setup; it matches the sources** (DOCKER-004, DOCKER-005, DOCKER-008, DOCKER-009). Digest pins with Dependabot, two stages, exec-form `CMD`, a non-root user and SIGTERM handlers are all in place.
2. **Move to `node:26-alpine` with the Node 26 move** (DOCKER-002, NODE-001): on 26, x64 musl is Tier 2 rather than Experimental. NODE's recommendation 1 already covers when; the Dockerfile's two `FROM` lines are part of that checklist.
3. **When a Dockerfile is next touched, write `USER 1000:1000` instead of `USER node`** (DOCKER-008). The pods set `runAsUser`, so nothing fails today; the number keeps `runAsNonRoot` working if that line is dropped. Not worth its own PR.
4. **Won't do: add `cache-to: type=gha` to the deploy workflows** (DOCKER-014). They run on `workflow_run`, which gets read-only cache since 2026-06-26, and granting write with `cache-mode` would let a poisoned cache reach a privileged deploy job. A `push`-triggered CI job would have to fill it; not worth it for a build that runs a few times a day.
5. **Won't do now: sign images or add SBOMs** (DOCKER-011, DOCKER-012, DOCKER-013). Public repos already publish `mode=max` SLSA v1 provenance; their build args hold no secrets. A signature or SBOM has no consumer until the cluster has an admission policy, which belongs to KUBE.
6. **Won't do now: switch to distroless or Docker Hardened Images** (DOCKER-003). The runtime stage only runs `node`, so it would fit, but DHI adds a registry login and pull secrets, and distroless a second registry, for a smaller CVE count on an already small image.

## Open questions

- **Startup cost by base image** (DOCKER-010): no measured start time for `node:24-alpine`, `-trixie-slim`, distroless or DHI on a cold node; no Docker engine ran in this session. Nor whether a compile cache generated at build time survives into a read-only container.
- **cosign v3 signatures in a cluster** (DOCKER-012, DOCKER-013): whether the Sigstore Policy Controller and Kyverno verify cosign v3's bundle-format referrer signatures on Docker Hub, and whether `gh attestation verify oci://docker.io/…` works (GitHub's examples use ghcr.io).
- **Git context and `.dockerignore`** (DOCKER-007): build-push-action's README says mutations before the build are ignored "including processing of the `.dockerignore` file"; whether a committed `.dockerignore` is honoured under the Git context wasn't tested.
- **Which npm release added `--libc`** (DOCKER-002, DOCKER-015): npm's config docs for v11 have it; the changelog line for the flag wasn't found.
- **DHI rebuild cadence and anonymous pulls** (DOCKER-003): the docs promise only "Upstream cadence for Docker-released patches"; no anonymous pull path was found. Chainguard's free Node image's user and signing weren't checked.
- **Not read:** the docker/github-builder repo itself, Ubuntu chiseled images, Docker Scout.

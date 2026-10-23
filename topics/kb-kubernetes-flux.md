# Small-cluster Kubernetes with Flux GitOps and Grafana/Prometheus observability

Prefix `KUBE`. This file covers running a small (single-node or few-node) Kubernetes cluster reconciled by Flux on 2026-10-17: what Flux 2.8 and 2.9 changed and how to upgrade across them, the Flux Operator against `flux bootstrap`, which Kubernetes minors Flux and cert-manager support, what replaces ingress-nginx (Gateway API or another Ingress controller), cert-manager with Gateway API and Let's Encrypt's shorter certificates, Prometheus 3 and Loki 3 upgrade points, Promtail's end of life and `alloy convert`, Alloy against the OpenTelemetry Collector, and Kubernetes' release cadence, version skew and upgrade order. Added 2026-10-22: running MongoDB on the cluster (mongod 8.0 on Ubuntu's 7.0 kernel, one-member replica sets, keyFiles, the exporter, a cutover from Atlas, `envFrom` precedence), Grafana Cloud's free series budget, the CrowdSec Traefik plugin, Flannel against Calico and a fresh Ubuntu 26.04 host. Agent access to clusters and the Flux MCP server are in `kb-infra-agents.md` (INFRA); building and signing images in `kb-docker-node.md` (DOCKER).

Research basis:
- Researched 2026-10-17 (FreekMencke/claude-kb#186, part of roadmap #167) by an Opus 5.5 lead with three Sonnet 5.5 readers (Flux 2.8/2.9 and the Operator; ingress-nginx, Gateway API and cert-manager; Prometheus, Loki, Alloy and the OpenTelemetry Collector).
- Docs read as raw Markdown from `raw.githubusercontent.com`: fluxcd/website, kubernetes/website, kubernetes-sigs/gateway-api, cert-manager/website, letsencrypt/website, prometheus/prometheus and prometheus/docs, grafana/loki, grafana/alloy, traefik/traefik (at `v3.7.15`), open-telemetry/opentelemetry.io; release dates and bodies from the GitHub releases API (`gh api repos/<owner>/<repo>/releases/tags/<tag>`); the Flux upgrade discussion through `gh api graphql`.
- Tested on Linux amd64 (WSL2) with official release binaries, checksums verified: the `flux` CLI 2.9.6 and `alloy` 1.20.1, against local files only. Nothing was applied to a cluster.
- Our setup was compared read-only against the docs; the recommendations describe it by pattern only.
- KUBE-017 to KUBE-028 added 2026-10-22 (FreekMencke/claude-kb#249) from our server move and MongoDB cutover (FreekMencke/fremen-cluster#20, #22, private), each checked against its upstream source: MongoDB's Jira through its REST API, MongoDB and Grafana Cloud docs as HTML stripped of tags, Kubernetes, Alloy, Grafana, Flannel, fwupd and systemd sources from `raw.githubusercontent.com`, the CrowdSec plugin's PR and releases through `gh`, image tags from Docker Hub's API. KUBE-021 tested with the official `alloy` v1.21.1 binary, checksum verified, against local files only.

## Quick answers

| Question | Answer | Entries |
|---|---|---|
| What changed in Flux 2.8 and 2.9, and what needs action? | 2.8 (2026-02-24): Helm v4 in helm-controller (server-side apply and kstatus health checks by default), `v1beta2`/`v2beta2` source, kustomize and helm APIs removed. 2.9 (2026-06-30): post-render default `combined`, image and notification `v1beta2` removed, GCR Receivers need `email` and `audience`. Latest 2.9.6 (2026-10-01). Existing HelmReleases keep client-side apply until `serverSideApply: enabled`; `UseHelm3Defaults` restores Helm 3 behaviour. | KUBE-001, KUBE-004 |
| How do I upgrade Flux to 2.9 without breaking on removed APIs? | `flux migrate -f .` in the Git repo (rewrites old `apiVersion`s; Alert goes to `v1beta3`, not `v1`), push, then `flux migrate` against the cluster to rewrite etcd, then upgrade the controllers (rerun `flux bootstrap`, or set the Operator's version). | KUBE-002 |
| Which Kubernetes versions does Flux 2.9 support? Can I go to 1.37? | 1.34, 1.35 and 1.36 only. Kubernetes 1.37 (2026-08-26) waits for Flux 2.10 ("mid Q4 2026", provisional); cert-manager 1.21 also stops at 1.36. | KUBE-003, KUBE-009 |
| Flux Operator or `flux bootstrap`? | fluxcd.io still calls bootstrap "the recommended way"; the Operator (ControlPlane, AGPL-3.0) is the documented alternative, with automatic upgrades through `FluxInstance` `distribution.version` and a zero-downtime migration from bootstrap. | KUBE-005 |
| ingress-nginx is retired: what does that mean, and what replaces it on a single node? | No releases or security fixes since March 2026; the Ingress API is frozen but GA, with no plan to remove it. Use any conformant Gateway API implementation (17 have v1.6 reports, Traefik, Envoy Gateway and NGINX Gateway Fabric among them), or Traefik's ingress-nginx provider (v3.6.2+) to keep Ingress objects and annotations. `ingress2gateway` 1.x converts 30+ annotations. | KUBE-006, KUBE-008 |
| What's in Gateway API's Standard channel now? | v1.6.3 (2026-10-06) `standard-install.yaml` ships 10 CRDs: Gateway, GatewayClass, HTTPRoute, GRPCRoute, TLSRoute, TCPRoute, UDPRoute, ListenerSet, ReferenceGrant, BackendTLSPolicy, plus a `safe-upgrades` admission policy that blocks downgrades. CRDs install separately from the controller. | KUBE-007 |
| Can cert-manager issue certificates for a Gateway, and do Let's Encrypt's shorter certificates need a change? | Yes: `cert-manager.io/cluster-issuer` on the Gateway, with `config.gatewayAPI.enabled: true`; HTTP-01 needs a port-80 listener. Shorter certificates (64-day default from 2027-02-10, 45-day from 2028-02-16) need nothing with the default 2/3 renewal; avoid a fixed `renewBefore`. | KUBE-009, KUBE-010 |
| What breaks moving from Prometheus 2 to 3? | Regex `.` matches newlines, range selectors are left-open, `le`/`quantile` values normalise to floats (`le="1"` breaks), scrapes without a valid Content-Type fail, Alertmanager v1 API is gone; downgrade only to 2.55. Alloy took the same changes in 1.11.0. | KUBE-011 |
| Loki 3 on a small setup? | Monolithic mode (`-target=all`) up to about 20 GB/day. 3.0 requires the `tsdb` index and `v13` schema for structured metadata and OTLP; simple scalable mode and the legacy index stores are removed in 4.0. | KUBE-012 |
| Promtail is EOL: how do I move to Alloy? | EOL since 2026-03-02. `alloy convert --source-format=promtail --output=out.alloy promtail.yaml`, with `--report`; tested on 1.20.1: Kubernetes discovery, pipeline stages, journal and positions file converted. Set `HOSTNAME` to the node name in the DaemonSet. | KUBE-013 |
| Alloy or the OpenTelemetry Collector for one small cluster? | Alloy's default engine for Prometheus scrapes and Loki logs (one binary, UI, the k8s-monitoring chart); the Collector, or Alloy's preview `alloy otel` engine, when the pipeline is OTLP end to end. | KUBE-014 |
| Why does mongod 8.0 exit at startup on Ubuntu 26.04? | 8.0.21+ refuses kernels from 6.19 (tcmalloc and rseq) and reads Ubuntu's `7.0.0-38` as 7.0.0, though it's upstream 7.0.14 with the fix. Fixed in 8.0.35 (unreleased 2026-10-22) and 9.0.4; until then start it through `setarch x86_64 --uname-2.6 docker-entrypoint.sh`. | KUBE-017 |
| How do I run a single MongoDB on Kubernetes? | One-member replica set; clients use `directConnection=true` (member names resolve only in-cluster); copy the keyFile in with an initContainer (0400, uid 999); exporter as its own Deployment, not a sidecar; for a second Secret overriding keys, `envFrom` takes the last one listed. | KUBE-018, KUBE-019, KUBE-020, KUBE-023 |
| How do I stay under Grafana Cloud's free 10k series? | Count live series with `count({__name__=~".+"})`, not the lagging `grafanacloud_instance_active_series`; drop what no dashboard reads in Alloy's relabel step. One MongoDB exporter offered 5.8k series; 58 kept. | KUBE-024, KUBE-025 |
| How often must a small cluster upgrade Kubernetes, and can it skip a minor? | Three minors a year, each patched about 14 months; kubeadm can't skip a minor, so plan one minor upgrade every four months or two a year at least. Check add-on support (Flux, cert-manager, CNI, ingress) before each. | KUBE-015, KUBE-016 |

## Index

| ID | Title | Type | Tags |
|---|---|---|---|
| KUBE-001 | Flux 2.8 and 2.9: what changed and what needs action | fact | flux, release-notes, upgrade, helm-v4 |
| KUBE-002 | Upgrading Flux across removed APIs with `flux migrate` | fact | flux, flux-migrate, api-versions, upgrade |
| KUBE-003 | Which Kubernetes minors Flux supports, and the 1.37 gap | fact | flux, kubernetes-versions, support-policy, release-cadence |
| KUBE-004 | helm-controller on Helm v4: server-side apply, kstatus and post-render defaults | fact | flux, helm-controller, helm-v4, server-side-apply |
| KUBE-005 | Flux Operator or `flux bootstrap` | comparison | flux, flux-operator, bootstrap, fluxinstance |
| KUBE-006 | ingress-nginx is retired; the Ingress API is frozen, not removed | fact | ingress-nginx, ingress, retirement, gateway-api |
| KUBE-007 | Gateway API 1.5 and 1.6: the Standard channel and how its CRDs install | fact | gateway-api, crds, listenerset, httproute |
| KUBE-008 | Replacing ingress-nginx on a single node: a Gateway API implementation or another Ingress controller | comparison | ingress-nginx, gateway-api, traefik, ingress2gateway |
| KUBE-009 | cert-manager with Gateway API, and its supported releases | fact | cert-manager, gateway-api, acme, http-01 |
| KUBE-010 | Let's Encrypt's 64- and 45-day certificates and other changes for cert-manager users | fact | lets-encrypt, cert-manager, certificate-lifetime, renewal |
| KUBE-011 | Prometheus 2 to 3: what breaks | fact | prometheus, migration, promql, lts |
| KUBE-012 | Loki 3 on a small setup: monolithic mode, TSDB and v13, and what 4.0 removes | fact | loki, upgrade, tsdb, monolithic |
| KUBE-013 | Promtail's end of life and `alloy convert` | fact | promtail, alloy, alloy-convert, logs |
| KUBE-014 | Alloy or the OpenTelemetry Collector for one small cluster | comparison | alloy, opentelemetry-collector, otlp, k8s-monitoring |
| KUBE-015 | Kubernetes release cadence, support period and version skew | fact | kubernetes-versions, version-skew, support-period, release-cadence |
| KUBE-016 | Upgrading a small kubeadm cluster: one minor at a time, gated by add-ons | pattern | kubeadm, upgrade, kubernetes-versions, add-ons |
| KUBE-017 | mongod 8.0 exits at startup on Ubuntu 26.04's 7.0 kernel until 8.0.35 | fact | mongodb, ubuntu-26-04, kernel, setarch |
| KUBE-018 | A one-member replica set behind a Service: `directConnection=true`, and when `authSource` matters | fact | mongodb, replica-set, connection-string, statefulset |
| KUBE-019 | A MongoDB keyFile from a Secret needs an initContainer to copy it | pattern | mongodb, keyfile, secrets, init-containers |
| KUBE-020 | Run a database's metrics exporter as its own Deployment, not a sidecar | pattern | mongodb, exporter, sidecar, labels |
| KUBE-021 | Alloy's `prometheus.exporter.mongodb`: a URI Go can't parse stops all of Alloy | fact | alloy, mongodb, exporter, config-errors |
| KUBE-022 | Moving a database from Atlas to the cluster with no data lost | pattern | mongodb, atlas, migration, flux-suspend |
| KUBE-023 | `envFrom`: when two Secrets set the same key, the last one listed wins | fact | envfrom, secrets, environment-variables, precedence |
| KUBE-024 | Grafana Cloud's free 10k series: one exporter can use most of them | pattern | grafana-cloud, active-series, alloy, relabel |
| KUBE-025 | `grafanacloud_instance_active_series` lags: count live series before cutting | fact | grafana-cloud, active-series, billing, promql |
| KUBE-026 | CrowdSec's Traefik bouncer 1.7.1 stops pulling bans on multi-CPU hosts; use 1.8.0 or later | fact | crowdsec, traefik, plugins, yaegi |
| KUBE-027 | Flannel or Calico on a single node | comparison | flannel, calico, cni, network-policy |
| KUBE-028 | A fresh Ubuntu 26.04 server: chrony, fwupd's hourly refresh and `adm` | fact | ubuntu-26-04, chrony, fwupd, journald |

## [KUBE-001] Flux 2.8 and 2.9: what changed and what needs action
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [Flux 2.8 GA blog](https://fluxcd.io/blog/2026/02/flux-v2.8.0/), [Flux 2.9 GA blog](https://fluxcd.io/blog/2026/06/flux-v2.9.0/), [flux2 v2.8.0 release](https://github.com/fluxcd/flux2/releases/tag/v2.8.0), [flux2 v2.9.0 release](https://github.com/fluxcd/flux2/releases/tag/v2.9.0), [flux2 v2.9.6 release](https://github.com/fluxcd/flux2/releases/tag/v2.9.6)
- Related: KUBE-002, KUBE-003, KUBE-004, DOCKER-013, INFRA-014

Release dates from `gh api repos/fluxcd/flux2/releases/tags/<tag>`: v2.7.0 2025-09-30, v2.8.0 2026-02-24, v2.9.0 2026-06-30, latest v2.9.6 2026-10-01 (no 2.10 or release candidate on 2026-10-17).

**2.8** brought Helm v4 to helm-controller ("Both server-side apply and kstatus health checking are the new defaults", KUBE-004), CEL readiness expressions and `.status.inventory` on HelmRelease, the opt-in `CancelHealthCheckOnNewRevision` gate, PR comments from notifications, and Cosign v3 for OCIRepository verification. Action: "The Flux APIs `v1beta2` and `v2beta2` (deprecated in 2024) have reached end-of-life and have been removed from the CRDs" (source, kustomize, helm).

**2.9** added a CLI plugin system (`flux plugin`), server-side apply field-ignore rules on Kustomizations, SOPS with Age post-quantum keys, SSH commit signing, OIDC-secured webhook Receivers and Helm post-render strategies. Actions, from the blog's "breaking changes": "The default Helm post-render strategy has changed from `nohooks` to `combined`" and "GCR `Receivers` now require the `email` and `audience` fields in their referenced Secret (CVE-2026-40109)"; and "`image.toolkit.fluxcd.io/v1beta2` and `notification.toolkit.fluxcd.io/v1beta2` have reached end-of-life and have been removed from the CRDs".

Patches carry behaviour fixes too: 2.9.6 "stops helm-controller from reapplying chart CRDs on every upgrade when server-side apply is enabled". Flux expects users "to be running the latest patch release of a given minor release".

## [KUBE-002] Upgrading Flux across removed APIs with `flux migrate`
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [Upgrade Procedure for Flux v2.7+](https://github.com/fluxcd/flux2/discussions/5572), [Flux: upgrade](https://fluxcd.io/flux/installation/upgrade/), [flux migrate](https://fluxcd.io/flux/cmd/flux_migrate/)
- Related: KUBE-001, KUBE-005, INFRA-014, INFRA-015

Flux removed its beta APIs over three minors (2.7: `v1beta1` and helm `v2beta1`; 2.8: source and kustomize `v1beta2`, helm `v2beta2`; 2.9: image and notification `v1beta2`). Objects still stored in etcd or committed in Git under a removed version break the upgrade, so migrate first. The maintainers' procedure (discussion 5572, updated 2026-07-23) for the CLI path:
1. With a CLI of 2.9.0 or later: `flux migrate -v 2.6 -f .` in the Git repo, commit, push and reconcile.
2. `flux migrate` against each cluster: rewrites stored objects to their latest versions; "idempotent and can be run multiple times".
3. Upgrade the controllers: rerun `flux bootstrap` "with the same parameters you used during the initial installation" (or `kubectl apply --server-side -f …/install.yaml` for a non-bootstrap install), then `flux check`.
4. `flux migrate -v 2.8 -f .` for the image automation APIs, push, and run `flux migrate` on the cluster again.

The Operator path: update the Operator to v0.53.0 or later, run step 1, then set `distribution.version: "2.9.x"`; "The operator will automatically upgrade the Flux components and migrate the APIs in-cluster."

Per `flux migrate --help` (2.9.6), cluster mode "requires cluster-admin permissions" and `--dry-run` works only with `-f`.

Tested 2026-10-17, flux CLI 2.9.6, Linux amd64: `flux migrate -f manifests --dry-run` on a file with old versions printed `GitRepository v1beta2 -> v1`, `HelmRelease v2beta2 -> v2`, `Alert v1beta2 -> v1beta3`, `ImagePolicy v1beta2 -> v1`, exit 0, file unchanged. Alert, Provider and Event stay on `v1beta3` until 2.10 promotes them (roadmap).

## [KUBE-003] Which Kubernetes minors Flux supports, and the 1.37 gap
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [Flux releases and support](https://fluxcd.io/flux/releases/), [Flux roadmap](https://fluxcd.io/roadmap/), [flux2 v2.9.0 release](https://github.com/fluxcd/flux2/releases/tag/v2.9.0), [Flux installation](https://fluxcd.io/flux/installation/)
- Related: KUBE-001, KUBE-015, KUBE-016

Flux keeps "release branches for the most recent three minor releases", and "the CNCF Flux project offers support only for the latest three minor versions of Kubernetes". The 2.9.0 release notes list Kubernetes `v1.34` (`>= 1.34.1`), `v1.35` and `v1.36`; 2.8.0 listed 1.33 to 1.35.

The releases page promises a Flux minor "approximately two weeks after Kubernetes", supporting "Kubernetes N-2 minor versions". Observed lags (release dates from `gh api`): Kubernetes 1.34.0 (2025-08-27) to Flux 2.7.0 34 days; 1.35.0 (2025-12-17) to 2.8.0 69 days; 1.36.0 (2026-04-22) to 2.9.0 69 days.

Kubernetes 1.37.0 shipped 2026-08-26. No 2.9.x patch lists it, and patches carry no "user-facing changes" by policy. The roadmap's next milestone is "v2.10 (mid Q4 2026)", "Status: Provisional", with "End-to-end testing for Kubernetes 1.37" unchecked and "End support for Kubernetes v1.34.x". The install page on `main` was already updated on 2026-10-01 for "Flux 2.10 (Kubernetes 1.37)" with 1.35 to 1.37.

So a cluster on Flux should stay on 1.36 until 2.10 is out. The install page says Flux "may work on older versions of Kubernetes", but "we don't recommend running EOL versions in production nor do we offer support for these versions". A newer-than-tested Kubernetes isn't covered either way. Kubernetes 1.34 reaches end of life on 2026-10-27 (KUBE-015).

## [KUBE-004] helm-controller on Helm v4: server-side apply, kstatus and post-render defaults
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [helm-controller CHANGELOG](https://github.com/fluxcd/helm-controller/blob/main/CHANGELOG.md), [HelmRelease API](https://fluxcd.io/flux/components/helm/helmreleases/), [Flux 2.8 GA blog](https://fluxcd.io/blog/2026/02/flux-v2.8.0/), [Flux 2.9 GA blog](https://fluxcd.io/blog/2026/06/flux-v2.9.0/)
- Related: KUBE-001, KUBE-002

helm-controller 1.5.0 (in Flux 2.8) moved to Helm v4. 1.6.4 reports Helm "now at v4.2.4". What changes for a HelmRelease:
- **Apply method:** new releases use server-side apply (`.spec.install.serverSideApply` defaults to `true`). `.spec.upgrade.serverSideApply` and `.spec.rollback.serverSideApply` default to `auto`, which reuses "the apply method used in the last successful release revision", so "existing HelmReleases will continue to use client-side apply until their `.spec` is updated with `.spec.{upgrade|rollback}.serverSideApply: enabled`".
- **Health checks:** `.spec.waitStrategy` defaults to `poller` (kstatus, as kustomize-controller uses) instead of Helm's `legacy` wait, for every release.
- **Post-render:** from 1.6.0 (Flux 2.9) `.spec.postRenderStrategy` defaults to `combined` ("Helm hooks are included in the post-rendering process"). Set `nohooks` on a release whose post-renderer can't handle hooks.
- **Back to Helm 3:** the `UseHelm3Defaults` feature gate restores client-side apply, `legacy` waits and `nohooks`.
- **Unchanged:** drift detection stays opt-in (`.spec.driftDetection.mode`); the changelog calls it "completely unrelated to Helm v4's server-side apply support".

Also: `.spec.upgrade.crds` defaults to `Create`, and from 1.6.5 (Flux 2.9.6) SSA no longer re-applies chart CRDs on each upgrade. `CancelHealthCheckOnNewRevision` needs the `poller` strategy; the 2.8 blog advises `DefaultToRetryOnFailure` with it. Not tested: no helm-controller ran in this session.

## [KUBE-005] Flux Operator or `flux bootstrap`
- Type: comparison
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [Flux installation](https://fluxcd.io/flux/installation/), [flux-operator README](https://github.com/controlplaneio-fluxcd/flux-operator), [FluxInstance API](https://github.com/controlplaneio-fluxcd/flux-operator/blob/main/docs/api/v1/fluxinstance.md), [Migrating from bootstrap](https://github.com/controlplaneio-fluxcd/flux-operator/blob/main/docs/guides/operator/operator-migration.md)
- Related: KUBE-002, INFRA-005, INFRA-014

| | `flux bootstrap` | Flux Operator |
|---|---|---|
| Status on fluxcd.io | "The recommended way of installing Flux" | "an alternative to the Flux CLI bootstrap procedure", listed in the Flux ecosystem |
| Maintainer | CNCF Flux project | ControlPlane (`controlplaneio-fluxcd`), AGPL-3.0, "a key component of the ControlPlane Enterprise offering"; v0.61.0 on 2026-10-01 |
| Upgrades | Rerun bootstrap (or merge the PR from Flux's GitHub Action), then `flux migrate` steps (KUBE-002) | `FluxInstance` `.spec.distribution.version`: "a valid semver range or an exact version"; `2.x` follows minors, `2.7.x` "restrict[s] the upgrade to patch versions only", an exact version disables upgrades. `.spec.migrateResources` defaults to `true` |
| Config | Kustomize patches in `flux-system/` | One `FluxInstance` (components, patches, sync source) |

The Operator can only install Flux minors "embedded in the running operator image", so a new Flux minor first needs a newer Operator. Migrating a bootstrapped cluster is documented as zero-downtime: install the Operator's Helm chart, apply a `FluxInstance` named `flux` in `flux-system` with the same settings (copy the kustomize patches), then delete the bootstrap directory from Git. The Flux MCP server's `get_flux_instance` reports the Operator's view (INFRA-005).

For a single small cluster, bootstrap adds nothing to run; the Operator saves the manual minor upgrade and API migration at the price of one more controller and a third-party dependency. Neither page gives a resource footprint.

## [KUBE-006] ingress-nginx is retired; the Ingress API is frozen, not removed
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [Ingress NGINX Retirement](https://kubernetes.io/blog/2025/11/11/ingress-nginx-retirement/), [Ingress NGINX: Statement from Steering and SRC](https://kubernetes.io/blog/2026/01/29/ingress-nginx-statement/), [kubernetes/ingress-nginx README](https://github.com/kubernetes/ingress-nginx), [Kubernetes: Ingress](https://kubernetes.io/docs/concepts/services-networking/ingress/)
- Related: KUBE-007, KUBE-008

The kubernetes.io blog of 2025-11-11: "Best-effort maintenance will continue until March 2026. Afterward, there will be no further releases, no bugfixes, and no updates to resolve any security vulnerabilities that may be discovered. Existing deployments of Ingress NGINX will continue to function and installation artifacts will remain available." It recommends "migrating to Gateway API, the modern replacement for Ingress", or, "If you must continue using Ingress", another Ingress controller. InGate, the planned successor, "will also be retired".

The last releases (controller v1.15.1, v1.14.5, v1.13.9; chart 4.15.1) are dated 2026-03-19, and `gh api repos/kubernetes/ingress-nginx` reports `archived: true` on 2026-10-17. The README: "If you are not already using ingress-nginx, you should not be deploying it". The committees' statement (2026-01-29): "None of the available alternatives are direct drop-in replacements." Find it with `kubectl get pods --all-namespaces --selector app.kubernetes.io/name=ingress-nginx`.

Ingress-NGINX (the Kubernetes project) and NGINX Ingress (F5's controller) are separate products; only the first is retired.

The Ingress API itself stays: "The Ingress API has been frozen", is "generally available", and "The Kubernetes project has no plans to remove Ingress from Kubernetes", but "will have no further changes or updates". An Ingress served by a maintained controller (Traefik, HAProxy, F5 NGINX and others) needs no migration.

## [KUBE-007] Gateway API 1.5 and 1.6: the Standard channel and how its CRDs install
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [Gateway API 1.5 changelog](https://github.com/kubernetes-sigs/gateway-api/blob/main/CHANGELOG/1.5-CHANGELOG.md), [Gateway API 1.6 changelog](https://github.com/kubernetes-sigs/gateway-api/blob/main/CHANGELOG/1.6-CHANGELOG.md), [Gateway API v1.6.3 release](https://github.com/kubernetes-sigs/gateway-api/releases/tag/v1.6.3)
- Related: KUBE-006, KUBE-008, KUBE-009

Releases (`gh api`): v1.5.0 2026-02-27, v1.6.0 2026-06-29, v1.6.3 2026-10-06.
- **1.5** moved to Standard: "Gateway Client Certificate validation", "Certificate selection for Gateway TLS origination", "ListenerSet support", "HTTPRoute CORS filter", "TLSRoute `v1`"; ReferenceGrant moved to `v1`. TLSRoute's CEL validation "requires Kubernetes 1.31 or higher".
- **1.6**: "UDPRoute has graduated to GA" (TCPRoute too; `v1alpha2` deprecated). Breaking: "`tls` must be configured for `protocol: HTTPS`" on Gateway and ListenerSet listeners.
- BackendTLSPolicy went Standard in 1.4.0.

Gateway API is CRDs, installed apart from the controller that implements them, from a release asset: `kubectl apply --server-side -f https://github.com/kubernetes-sigs/gateway-api/releases/download/v1.6.3/standard-install.yaml`. Since 1.5 the bundle includes a ValidatingAdmissionPolicy, `safe-upgrades.gateway.networking.k8s.io`, that blocks installing Experimental CRDs over Standard ones and downgrading below 1.5; delete it first to do either. Manage the CRDs in Git like any other manifest, at the version the controller supports.

Tested 2026-10-17, Gateway API v1.6.3 `standard-install.yaml` (downloaded, grepped): 10 CRDs (BackendTLSPolicy, Gateway, GatewayClass, GRPCRoute, HTTPRoute, ListenerSet, ReferenceGrant, TCPRoute, TLSRoute, UDPRoute) plus one ValidatingAdmissionPolicy and its binding.

## [KUBE-008] Replacing ingress-nginx on a single node: a Gateway API implementation or another Ingress controller
- Type: comparison
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [Gateway API conformance reports v1.6](https://github.com/kubernetes-sigs/gateway-api/tree/main/conformance/reports/v1.6), [Traefik: Kubernetes Gateway provider](https://doc.traefik.io/traefik/reference/install-configuration/providers/kubernetes/kubernetes-gateway/), [Traefik: migrate from NGINX](https://doc.traefik.io/traefik/migrate/nginx-to-traefik/), [Ingress2Gateway 1.0](https://kubernetes.io/blog/2026/03/20/ingress2gateway-1-0-release/), [ingress2gateway](https://github.com/kubernetes-sigs/ingress2gateway), [Five surprising Ingress-NGINX behaviors](https://kubernetes.io/blog/2026/02/27/ingress-nginx-before-you-migrate/)
- Related: KUBE-006, KUBE-007, KUBE-009

Two routes off ingress-nginx:
- **Gateway API:** 17 implementations have v1.6 conformance reports, among them Traefik (v3.7.10), Envoy Gateway (v1.9.0), NGINX Gateway Fabric (2.8.0), Cilium, Istio and kgateway. `ingress2gateway` (v1.0.0 on 2026-03-20, latest v1.2.0 on 2026-07-07) converts "over 30 common annotations"; others, such as `custom-headers`, are "Recognized but not converted" with a warning, and capture groups in `rewrite-target` aren't supported. It is "a migration assistant, not a one-shot replacement".
- **Another Ingress controller:** Traefik's `kubernetesIngressNGINX` provider reads Ingresses of class `k8s.io/ingress-nginx` and "many of the ingress-nginx annotations"; it "requires Traefik v3.6.2 or later" (experimental from v3.5.0). It "discovers all Ingresses in the cluster by default", so routers can duplicate alongside the plain Ingress provider.

Either way, test the five behaviours the kubernetes.io post lists: ingress-nginx regex paths are prefix and case-insensitive, `use-regex` spreads to every path of a host, `rewrite-target` implies regex, missing trailing slashes get a 301, URLs are normalised. "Conformant Gateway API implementations do not silently configure any kind of redirects."

On one node, a controller with both an Ingress and a Gateway API provider lets routes move one at a time: Traefik v3.7.15's Gateway provider "supports Standard version v1.6.3" next to its Ingress providers. No official page gives a resource footprint for any of them.

## [KUBE-009] cert-manager with Gateway API, and its supported releases
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [cert-manager: Gateway API](https://cert-manager.io/docs/usage/gateway/), [cert-manager: HTTP01](https://cert-manager.io/docs/configuration/acme/http01/), [cert-manager supported releases](https://cert-manager.io/docs/releases/), [Upgrading 1.20 to 1.21](https://cert-manager.io/docs/releases/upgrading/upgrading-1.20-1.21/)
- Related: KUBE-007, KUBE-010, KUBE-016

**Gateway support:** "FEATURE STATE: cert-manager 1.15 [beta]"; "Since cert-manager 1.15, the Gateway API support is no longer gated behind a feature flag, but you still need to enable the Gateway API support": Helm `--set config.gatewayAPI.enabled=true`. Install the Gateway API CRDs first or restart cert-manager afterwards: "some of the cert-manager components only perform the Gateway API check on startup". The annotation `cert-manager.io/cluster-issuer` (or `issuer`) "tell cert-manager to create a Certificate for a Gateway". 1.21 renamed the config fields `enableGatewayAPI` to `gatewayAPI.enabled`; the old ones still work.

**HTTP-01 through a Gateway:** the `gatewayHTTPRoute` solver "creates a temporary HTTPRoute"; its `parentRefs` "must match a Gateway that contains a listener on port 80", and "cert-manager does not edit Gateway resources".

**ListenerSet:** "cert-manager 1.20 [alpha]", needs Gateway API v1.5+, `config.gatewayAPI.enableListenerSet: true` and the `ListenerSets` feature gate.

**Supported releases** (cert-manager.io, 2026-10-17): 1.21 (2026-07-08, Kubernetes "1.33 → 1.36") and 1.20 (2026-03-10, "1.32 → 1.35"); 1.22 "~Nov 2026". "All cert-manager releases are supported at least until the release of a second subsequent version." Latest: v1.21.2 (2026-09-11), v1.20.4 (2026-09-16).

**1.21 breaking changes:** the chart no longer grants the controller `serviceaccounts/token: create` on its own ServiceAccount (affects `serviceAccountRef` to it); `cert-manager-edit` loses create on Challenges and Orders; `prometheus.servicemonitor.targetPort`/`path` and `prometheus.podmonitor.path` values are removed, so "`helm upgrade` will fail" with them set.

## [KUBE-010] Let's Encrypt's 64- and 45-day certificates and other changes for cert-manager users
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [64-Day Certificate Lifetimes Coming Feb 2027](https://letsencrypt.org/2026/10/07/64-day-certs/), [Decreasing Certificate Lifetimes to 45 Days](https://letsencrypt.org/2025/12/02/from-90-to-45/), [OCSP Service Has Reached End of Life](https://letsencrypt.org/2025/08/06/ocsp-service-has-reached-end-of-life/), [Ending expiration emails](https://letsencrypt.org/2025/01/22/ending-expiration-emails/), [Ending TLS client authentication](https://letsencrypt.org/2025/05/14/ending-tls-client-authentication/), [Challenge types](https://letsencrypt.org/docs/challenge-types/), [cert-manager: Certificate](https://cert-manager.io/docs/usage/certificate/)
- Related: KUBE-009

Let's Encrypt changes:
- **Lifetimes:** "On February 10, 2027, all Let's Encrypt subscribers will move to certificates with 64 day lifetimes by default" (staging from 2026-10-14; authorization reuse from 30 to 10 days); "February 16, 2028: … 45-day certificates with a 7 hour authorization reuse period". "If your renewals are hard-coded to a date from expiration you should update them to renew at approximately ⅔ of the lifetime instead."
- **Expiry emails** ended 2025-06-04; **OCSP** turned off 2025-08-06 (CRLs only); the **client-auth EKU** was scheduled to leave the default `classic` profile on 2026-02-11.

cert-manager already renews where Let's Encrypt asks: "By default this will be 2/3 through the X.509 certificate's duration." An explicit `spec.renewBefore` overrides that; the docs recommend `spec.renewBeforePercentage` "to prevent renewal loops in case the actual duration is less than expected". The default `spec.duration` of 90 days is a request the issuer may shorten. With expiry emails gone, nothing warns of a failed renewal unless you alert on it. cert-manager 1.21 adds ACME Renewal Info behind the experimental `ACMEUseARI` gate.

Challenge choice: "The HTTP-01 challenge can only be done on port 80" and "cannot be used to issue wildcard certificates"; DNS-01 "is harder to configure" but allows wildcards and hosts without public port 80.

## [KUBE-011] Prometheus 2 to 3: what breaks
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [Prometheus 3 migration guide](https://prometheus.io/docs/prometheus/latest/migration/), [Prometheus release cycle and LTS](https://prometheus.io/docs/introduction/release-cycle/), [Alloy CHANGELOG](https://github.com/grafana/alloy/blob/main/CHANGELOG.md)
- Related: KUBE-014

Prometheus 3.0.0 was published 2024-11-14; the latest minor is v3.15.0 (2026-09-25). LTS releases get "selected bug fixes for an extended period of one year": 3.13 (2026-07-01) until 2027-07-31; 3.5 ended 2026-07-31. Points from the migration guide that break queries, alerts or scrapes:
- "The `.` pattern in regular expressions in PromQL matches newline characters", in queries and relabel configs; use `[^\n]` for the old behaviour.
- "Lookback and range selectors are now left-open and right-closed": a subquery such as `foo[1m:1m]` may return one point and no `rate`; widen it (`foo[2m:1m]`).
- `le` and `quantile` values "will always be normalized to a float like representation": `le="1"` in alerts, rules and dashboards "will stop working".
- Scrapes with a missing or unknown Content-Type now fail; set `fallback_scrape_protocol`.
- "Prometheus 3 no longer supports Alertmanager's v1 API" (Alertmanager 0.16.0 or later, `api_version: v2`).
- Feature flags folded into defaults (`--enable-feature=agent` is now `--agent`; `remote-write-receiver` is `--web.enable-remote-write-receiver`); `scrape_classic_histograms` is now `always_scrape_classic_histograms`; native histograms need `scrape_native_histograms` (3.8+).
- "a Prometheus v3 TSDB can only be read by a Prometheus v2.55 or newer": upgrade through 2.55 to keep a way back.
- UTF-8 metric names are accepted; `metric_name_validation_scheme: legacy` restores the old check.

Alloy, which embeds Prometheus code, took the same changes in v1.11.0 ("Prometheus dependency had a major version upgrade from v2.55.1 to v3.4.2"), so the regex and `le` points apply to Alloy pipelines too.

## [KUBE-012] Loki 3 on a small setup: monolithic mode, TSDB and v13, and what 4.0 removes
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [Loki: upgrade](https://grafana.com/docs/loki/latest/setup/upgrade/), [Loki: deployment modes](https://grafana.com/docs/loki/latest/get-started/deployment-modes/)
- Related: KUBE-013, KUBE-014

Loki 3.0.0 was published 2024-04-08; on 2026-10-17 the release lines are v3.7.8 (2026-09-17) and v3.6.18 (2026-10-15).

**For one small cluster:** "Monolithic mode is useful for getting started quickly to experiment with Loki, as well as for small read/write volumes of up to approximately 20GB per day" (`-target=all`, one process). The Loki Helm chart installs simple scalable mode by default, which "is being deprecated and will be removed with the Loki 4.0 release", so pick monolithic explicitly. The chart moved to grafana-community/helm-charts, renumbered from 6.x to 18.x, with its own upgrade guide.

**2.x to 3.0:**
- "Structured metadata is enabled by default and requires `tsdb` and `v13` schema or Loki won't start"; "If you have not yet migrated to TSDB, do so before you upgrade". OTLP ingestion depends on structured metadata.
- Limits: "max line size of 256KB", "max label limit of 15 labels per series, down from 30".
- Loki fills a `service_name` label from labels such as `app`, `container` or `job`, or `unknown_service`.
- Check a config before upgrading with `-verify-config=true`.

**Later 3.x:** from 3.5.8 the image has no `busybox`, so `kubectl exec … sh` fails; use `kubectl debug`. On `main` (4.0), BoltDB and other legacy index stores are removed ("Loki will fail to start if a deprecated and removed storage backend is referenced"), and `use_thanos_objstore` defaults to `true`; v13 "remains the recommended schema".

## [KUBE-013] Promtail's end of life and `alloy convert`
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [Promtail](https://grafana.com/docs/loki/latest/send-data/promtail/), [Alloy: migrate from Promtail](https://grafana.com/docs/alloy/latest/set-up/migrate/from-promtail/), [alloy convert](https://grafana.com/docs/alloy/latest/reference/cli/convert/), [alloy run](https://grafana.com/docs/alloy/latest/reference/cli/run/), [Kubernetes: container environment](https://kubernetes.io/docs/concepts/containers/container-environment/)
- Related: KUBE-012, KUBE-014

"Promtail is end of life (EOL) as of March 2, 2026. Commercial support has ended. No future support or updates will be provided. All future feature development will occur in Grafana Alloy." (`lambda-promtail` is excluded.) Grafana Agent reached end of life on 2025-11-01.

Convert: `alloy convert --source-format=promtail --output=<out.alloy> <promtail.yaml>`, with `--report=<file>` for warnings and `--bypass-errors` to write output despite non-critical errors ("the behavior of the converted configuration may not match"). It targets Promtail v2.8.x and supports "Nearly all Promtail features". `alloy run --config.format=promtail` loads a Promtail file directly, as a "temporary transition step". Both are marked public preview.

Tested 2026-10-17, alloy v1.20.1, Linux amd64: a Promtail file with `kubernetes_sd_configs`, `cri`/`json`/`labels` stages, relabel rules, a `journal` job and basic auth converted with exit 0, with or without `--bypass-errors`. Output: `discovery.kubernetes`, `discovery.relabel`, `loki.process`, `loki.source.file` (with `legacy_positions_file`, so read positions carry over), `loki.source.journal` and `loki.write`. The report warned that tracing isn't migrated and that Alloy's own metrics differ from Promtail's (update alerts and dashboards).

The converter limits discovery to the local node with `field = "spec.nodeName=" + coalesce(sys.env("HOSTNAME"), constants.hostname)`. In a pod, `HOSTNAME` is "the name of the Pod", so set it from `spec.nodeName` in the DaemonSet, as Promtail's chart did, or discovery finds no pods.

## [KUBE-014] Alloy or the OpenTelemetry Collector for one small cluster
- Type: comparison
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [Alloy README](https://github.com/grafana/alloy), [Alloy: OpenTelemetry Engine and Default Engine](https://github.com/grafana/alloy/blob/main/docs/sources/introduction/otel_alloy.md), [loki.source.kubernetes](https://grafana.com/docs/alloy/latest/reference/components/loki/loki.source.kubernetes/), [Alloy: estimate resource usage](https://grafana.com/docs/alloy/latest/set-up/estimate-resource-usage/), [OTel Collector Helm chart](https://opentelemetry.io/docs/platforms/kubernetes/helm/collector/), [Collector distributions](https://github.com/open-telemetry/opentelemetry-collector-releases), [k8s-monitoring Helm chart](https://github.com/grafana/k8s-monitoring-helm)
- Related: KUBE-011, KUBE-012, KUBE-013, TOK-012

Alloy is "an open source OpenTelemetry Collector distribution with built-in Prometheus pipelines" (v1.20.1, 2026-09-28; a minor "every three weeks"). One binary, two engines: `alloy run` (Default Engine, Alloy syntax) and `alloy otel` (OpenTelemetry Engine, Collector YAML, public preview, a curated subset of contrib components, no UI).

| | Alloy Default Engine | OpenTelemetry Collector |
|---|---|---|
| Fits | "Prometheus exporters and pull-based scrapes", Grafana's Kubernetes integrations, Loki logs | "push-based, OpenTelemetry-native signals through OTLP" |
| Kubernetes install | Grafana's k8s-monitoring chart (4.5.3, 2026-10-07) wires Alloy collectors, kube-state-metrics and Node Exporter; "this chart does not deploy a storage backend" | Collector Helm chart presets `logsCollection` (filelog on `/var/log/pods`, daemonset) and `kubernetesAttributes`; needs the contrib or k8s distribution |
| Backends | Prometheus remote write, Loki, OTLP | OTLP; the `otelcol-k8s` distribution allows "Only exporters that use OTLP" |

Grafana's own guidance: the Default Engine "remains the stable, most polished experience"; use the OTel Engine to reuse existing Collector YAML. `alloy convert --source-format=otelcol` moves a Collector config across.

Logs: `loki.source.kubernetes` tails through the API, "without a privileged container", root or node filesystem, so "one Alloy could collect logs for the whole cluster", but "uses more network traffic and CPU consumption of Kubelets than `loki.source.file`". On one node either works.

Sizing: logs "approximately: 1 CPU core, 120 MiB of memory" per 1 MiB/s ingested; metrics "0.4 CPU cores, 11 GiB of memory" per million active series. No idle figure for either tool was found.

## [KUBE-015] Kubernetes release cadence, support period and version skew
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [Kubernetes releases](https://kubernetes.io/releases/), [Patch releases: support period](https://kubernetes.io/releases/patch-releases/), [Version skew policy](https://kubernetes.io/releases/version-skew-policy/), [Release cycle](https://kubernetes.io/releases/release/)
- Related: KUBE-003, KUBE-016

"Kubernetes releases currently happen approximately three times per year": 1.34.0 2025-08-27, 1.35.0 2025-12-17, 1.36.0 2026-04-22, 1.37.0 2026-08-26 (`gh api`); 1.38.0-alpha.2 is tagged.

Support period, from two official pages that word it differently: the patch-releases page gives "roughly fourteen (14) months": twelve months standard, then a two-month "maintenance mode" with fixes only for CVEs, dependency issues and critical bugs. The skew policy and release-cycle pages say "approximately 1 year of patch support" (`release-X.Y` "maintained … for approximately 12 months"). The schedule data matches 14 months:

| Minor | Released | Maintenance mode | End of life |
|---|---|---|---|
| 1.34 | 2025-08-27 | 2026-08-27 | 2026-10-27 |
| 1.35 | 2025-12-17 | 2026-12-28 | 2027-02-28 |
| 1.36 | 2026-04-22 | 2027-04-28 | 2027-06-28 |
| 1.37 | 2026-08-26 | 2027-08-28 | 2027-10-28 |

Patches are "monthly", faster right after a minor. The schedule targeted 1.36.6 and 1.37.2 for 2026-10-13; neither was tagged by 2026-10-17 (latest 1.36.5 and 1.37.1, 2026-09-23).

Skew: `kubelet` "must not be newer than `kube-apiserver`" and "may be up to three minor versions older" (two before 1.25); `kube-proxy` the same; `kubectl` "within one minor version (older or newer)". The deprecation guide lists no built-in API removed after v1.32, so recent upgrades break through add-ons and feature changes, not core API removals.

## [KUBE-016] Upgrading a small kubeadm cluster: one minor at a time, gated by add-ons
- Type: pattern
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [Upgrading kubeadm clusters](https://kubernetes.io/docs/tasks/administer-cluster/kubeadm/kubeadm-upgrade/), [Version skew policy: upgrade order](https://kubernetes.io/releases/version-skew-policy/#supported-component-upgrade-order), [Changing the Kubernetes package repository](https://kubernetes.io/docs/tasks/administer-cluster/kubeadm/change-package-repository/)
- Related: KUBE-003, KUBE-009, KUBE-015, INFRA-015

kubeadm: "Skipping MINOR versions when upgrading is unsupported", and the skew policy requires "`kube-apiserver` to not skip minor versions when upgrading, even in single-instance clusters". With three minors a year and 14 months of support, a cluster that upgrades twice a year falls behind; plan one minor per release, a few weeks after it ships.

Per minor:
1. **Check add-ons first.** Every controller with a Kubernetes support table must list the target: Flux (KUBE-003), cert-manager (KUBE-009), the CNI, the ingress or Gateway controller. On 2026-10-17 Flux 2.9 and cert-manager 1.21 both stop at 1.36.
2. **Patch first:** "Ensure that components are on the most recent patch version of your current minor version", then go to the newest patch of the target.
3. **Packages:** with `pkgs.k8s.io`, each minor has its own repository; switch it before installing the new kubeadm.
4. `kubeadm upgrade plan`, then `kubeadm upgrade apply v1.X.Y` on the control plane. It also renews the certificates kubeadm manages.
5. **Drain, upgrade kubelet and kubectl, restart, uncordon.** On a single node, draining evicts every workload, so the upgrade is downtime; plan a window, or skip the drain and accept restarts.
6. "Manually upgrade your CNI provider plugin" on the control plane, following the CNI's own upgrade instructions; kubeadm doesn't do it.

A failed upgrade can be retried with `kubeadm upgrade apply --force` at the current version. k3s ships matching lines (`v1.37.1+k3s1`, 2026-09-30) and has its own upgrade controller; not covered here.

## [KUBE-017] mongod 8.0 exits at startup on Ubuntu 26.04's 7.0 kernel until 8.0.35
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-22
- Sources: [SERVER-121912](https://jira.mongodb.org/browse/SERVER-121912), [SERVER-125742](https://jira.mongodb.org/browse/SERVER-125742), [SERVER-131779](https://jira.mongodb.org/browse/SERVER-131779) (read through Jira's REST API), [Ubuntu: identifying a kernel](https://ubuntu.com/kernel), [setarch(8)](https://github.com/util-linux/util-linux/blob/master/sys-utils/setarch.8.adoc), [mongo 8.0 Dockerfile](https://github.com/docker-library/mongo/blob/master/8.0/Dockerfile), [mongo tags on Docker Hub](https://hub.docker.com/_/mongo/tags), FreekMencke/fremen-cluster `cluster/mongodb/mongodb.yaml` (private)
- Related: KUBE-018, KUBE-019, KUBE-028, NEST-013

Linux 6.19 changed rseq behaviour in a way that breaks tcmalloc: MongoDB 8.0.0–8.0.20 there "crashes after ~60 seconds, potential corruption", so 8.0.21 and later exit at startup on kernels from 6.19 (SERVER-121912). "Linux kernel versions 7.0.14+ and 7.1.0+ (inclusive) restore previous userspace behavior", and 8.0.30 and 8.3.9 stop exiting on them (SERVER-125742).

Ubuntu's kernel version isn't upstream's. Ubuntu 26.04's `7.0.0-38-generic` reads as 7.0.0; `/proc/version_signature` names the upstream base (Ubuntu's example: `Ubuntu 5.4.0-12.15-generic 5.4.8`), here 7.0.14. So 8.0.34 still exits on it. SERVER-131779 ("Add linux the kernel 7.0.14 exemption for ubuntu") fixes that in 9.0.4 (released 2026-09-30), 8.3.14 and 8.0.35. On 2026-10-22 the last two are unreleased in Jira, and Docker Hub's newest 8.0 tag is `8.0.34` (2026-10-17).

Workaround until 8.0.35: run the image's entrypoint through `setarch`, whose `--uname-2.6` "Causes the specified program to see a kernel version number beginning with 2.6":

```yaml
command: [setarch, x86_64, --uname-2.6, docker-entrypoint.sh]
args: [--replSet=rs0, --keyFile=/keyfile/keyfile, --bind_ip_all]
```

`command` replaces the image's `ENTRYPOINT ["docker-entrypoint.sh"]`, which prepends `mongod` when the first argument starts with `-`. Drop the wrapper at 8.0.35: on a kernel without the fix it would hide a real hazard.

Observed 2026-10-21 (single-source), kubeadm 1.36.5 on Ubuntu 26.04, `mongo:8.0.34`: mongod exited at startup without the wrapper and has run with it since.

## [KUBE-018] A one-member replica set behind a Service: `directConnection=true`, and when `authSource` matters
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-22
- Sources: [MongoDB: connection string options](https://www.mongodb.com/docs/manual/reference/connection-string-options/), FreekMencke/fremen-cluster `cluster/osrs-tracker/secrets.example.yaml` and README "Access" (private)
- Related: KUBE-017, KUBE-020, KUBE-022, NEST-012

A client that discovers a replica set connects to the member names in the set's config, not to the host in its URI. In a StatefulSet those are pod DNS names (`mongodb-0.mongodb-headless.<namespace>.svc.cluster.local`), which resolve only inside the cluster, and not at all through an SSH tunnel to localhost.

MongoDB's docs: with `directConnection=false`, the default, "The client attempts to discover all servers in the replica set"; with `true` it "sends operations only to the specified host and does not attempt to discover other replica set members". They name the container case: a set that exposes "only one MongoDB endpoint" is "not discoverable".

So with one member (kept for `mongodump --oplog`, transactions and change streams), every client's URI gets `directConnection=true`: apps through the Service, the exporter, Compass through a tunnel.

```text
mongodb://mongodb.mongodb.svc:27017/?directConnection=true&authSource=admin
```

With several members, list them with `replicaSet=` instead: a direct connection pins one host and loses failover.

`authSource` "Defaults to defaultauthdb if specified, otherwise defaults to admin". So users created in `admin` need `authSource=admin` only when the URI's path names a database (`/osrs-tracker`). We set it anyway, so adding a path later doesn't break sign-in.

## [KUBE-019] A MongoDB keyFile from a Secret needs an initContainer to copy it
- Type: pattern
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-22
- Sources: [MongoDB: internal authentication](https://www.mongodb.com/docs/manual/core/security-internal-authentication/), [MongoDB: deploy a replica set with keyfile access control](https://www.mongodb.com/docs/manual/tutorial/deploy-replica-set-with-keyfile-access-control/), [Kubernetes core/v1 `SecretVolumeSource`](https://github.com/kubernetes/kubernetes/blob/master/staging/src/k8s.io/api/core/v1/types.go), [Kubernetes volumes: user ownership](https://kubernetes.io/docs/concepts/storage/volumes/), [AtomicWriteVolumeUserFields](https://kubernetes.io/docs/reference/command-line-tools-reference/feature-gates/), FreekMencke/fremen-cluster `cluster/mongodb/mongodb.yaml` (private)
- Related: KUBE-017, KUBE-018

"On UNIX systems, the keyfile must not have group or world permissions"; MongoDB's tutorial uses `chmod 400`. The official image runs mongod as uid 999. A Secret volume can't produce that file: `defaultMode` (default `0644`) sets the mode but not the owner, and `fsGroup` adds group ownership, which "might be in conflict with" the mode and gives the group-read bit mongod refuses.

Copy it in an initContainer of the same image into a memory `emptyDir`, and mount that read-only in mongod:

```yaml
initContainers:
  - name: prepare
    image: mongo:8.0.34
    command: [sh, -c, install -o 999 -g 999 -m 0400 /secret/keyfile /keyfile/keyfile]
    securityContext:
      runAsUser: 0
      allowPrivilegeEscalation: false
      capabilities: { drop: [ALL], add: [CHOWN, FOWNER] }
```

Ours also `chown`s the hostPath data directory, which the kubelet creates as root.

Kubernetes 1.37 adds `defaultUser` and per-item `user` to secret, configMap, downwardAPI and projected volumes: the kubelet "sets the owner UID of the volume's data files during file creation". It's alpha, behind the `AtomicWriteVolumeUserFields` gate (default off, from 1.37). With it, `defaultUser: 999` and `defaultMode: 0400` could replace the initContainer; 1.36 has neither.

## [KUBE-020] Run a database's metrics exporter as its own Deployment, not a sidecar
- Type: pattern
- Applies to: general
- Confidence: single-source
- Last verified: 2026-10-22
- Sources: [Kubernetes: StatefulSet rolling updates](https://kubernetes.io/docs/concepts/workloads/controllers/statefulset/#rolling-updates), [Kubernetes: Service](https://kubernetes.io/docs/concepts/services-networking/service/), FreekMencke/fremen-cluster `ef551c9` and CHANGELOG 2026-10-22 (private)
- Related: KUBE-018, KUBE-021, KUBE-024

A sidecar is part of the pod template, so a new exporter image is a template change, and the StatefulSet controller "will delete and recreate each Pod" to roll it out, database included. On 2026-10-22, updating Percona's `mongodb_exporter` from 0.53.0 to 0.54.0 in a sidecar of `mongodb-0` took MongoDB down for about 30 s. Removing the sidecar cost one last restart, of 14 s.

As its own Deployment, the exporter reaches the database through the Service with `directConnection=true` (KUBE-018) and updates without touching mongod. Two traps when moving it out:

- **Labels.** A Service's controller "continuously scans for Pods that match its selector". If the exporter's pod keeps the database's label (`app: mongodb`), the database Services route clients to a pod that doesn't serve MongoDB. Give it its own (`app: mongodb-exporter`).
- **Rules keyed on the old pod.** A relabel rule or dashboard query that matches the sidecar's pod labels stops matching. Our keep rule (KUBE-024) matched both labels during the switch, so the unfiltered series never went out. Dashboards that filter on the namespace alone kept their history.

A sidecar still fits what must share the pod's lifecycle or files, such as a log shipper reading a file the main container writes.

## [KUBE-021] Alloy's `prometheus.exporter.mongodb`: a URI Go can't parse stops all of Alloy
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-22
- Sources: [alloy run](https://grafana.com/docs/alloy/latest/reference/cli/run/), [prometheus.exporter.mongodb](https://grafana.com/docs/alloy/latest/reference/components/prometheus/prometheus.exporter.mongodb/), [Alloy source at v1.21.1: `mongodb_exporter.go`](https://github.com/grafana/alloy/blob/v1.21.1/internal/static/integrations/mongodb_exporter/mongodb_exporter.go), FreekMencke/fremen-cluster CHANGELOG 2026-10-21 (private)
- Related: KUBE-013, KUBE-014, KUBE-020, KUBE-024

`alloy run` builds every component first, and if the configuration "contains errors during the initial load, the `run` command immediately exits". `prometheus.exporter.mongodb` parses `mongodb_uri` with Go's `url.Parse` while it's built, for the `instance` label. A URI Go rejects, such as a password with an unencoded `%`, fails the whole load. In a pod, Alloy then restarts in a loop, and all of that instance's metrics and logs stop. On a later reload Alloy "continues functioning in the last valid state", but a pod restart is an initial load.

Tested 2026-10-22, alloy v1.21.1 (official release, checksum verified), Linux amd64, no MongoDB reachable:

| `mongodb_uri` | Result |
|---|---|
| a password containing `%zz` | exit 1: `could not parse mongodb_uri: invalid URL escape "%zz"`, then `could not perform the initial load successfully` |
| an invalid option, a wrong scheme, unencoded `@` and `/` in the password, an unset `sys.env` | keeps running, component `healthy`; one log line `Cannot connect to MongoDB … invalid dsn` |
| an unreachable host | keeps running, `healthy` |

So a URI only the driver rejects fails quietly, and one Go rejects takes Alloy down. Percent-encode credentials. Percona's `mongodb_exporter` in its own pod (KUBE-020) keeps either failure there, and its `mongodb_up` shows it.

The component's `collect_all` defaults to `true` and overrides every `enable_*` argument, so set it to `false` to choose collectors (KUBE-024).

## [KUBE-022] Moving a database from Atlas to the cluster with no data lost
- Type: pattern
- Applies to: general
- Confidence: single-source
- Last verified: 2026-10-22
- Sources: [flux suspend kustomization](https://github.com/fluxcd/flux2/blob/main/cmd/flux/suspend_kustomization.go), [flux resume kustomization](https://github.com/fluxcd/flux2/blob/main/cmd/flux/resume_kustomization.go), [mongodump](https://www.mongodb.com/docs/database-tools/mongodump/), [mongorestore](https://www.mongodb.com/docs/database-tools/mongorestore/), FreekMencke/fremen-cluster#20 and CHANGELOG 2026-10-22 (private)
- Related: KUBE-018, KUBE-023, INFRA-014

Our cutover of a small app on 2026-10-22 (8,402 documents in 7 collections), whose writers read from a queue:

1. `flux suspend kustomization <app>`, which "disables the reconciliation", so Flux doesn't undo the scale-down: it reapplies the manifest's replicas on every reconcile.
2. Scale every writer to 0. Work waits in the queue in front of them (SQS here).
3. `mongodump` the database from Atlas, then `mongorestore` it into the new server as `admin`. With the writers stopped, the dump is consistent without `--oplog`.
4. Compare every collection's document count and indexes on both sides.
5. Point the app's Secrets at the new URI (KUBE-018), with users made for the new server and new random passwords.
6. `flux resume kustomization <app>`, which "waits for it to finish the apply" and so restores the replicas.

The API was down for about 3 minutes and no scrape was lost: the queue held them until the ingester came back.

Rollback: leave the source untouched and stop its writers for good instead of deleting it, until the new side has run for a while (here, osrs-tracker/osrs-tracker-aws#168). Keep the dump somewhere other than the new server, so one failure can't take both copies.

## [KUBE-023] `envFrom`: when two Secrets set the same key, the last one listed wins
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-22
- Sources: [Kubernetes API: Pod, `envFrom`](https://kubernetes.io/docs/reference/kubernetes-api/core/pod-v1/), [core/v1 `types.go`](https://github.com/kubernetes/kubernetes/blob/master/staging/src/k8s.io/api/core/v1/types.go), FreekMencke/fremen-cluster `cluster/osrs-tracker/secrets.example.yaml` (private)
- Related: KUBE-022

The Pod API on `envFrom`: "When a key exists in multiple sources, the value associated with the last source will take precedence. Values defined by an Env with a duplicate key will take precedence." So a shared Secret listed first and a per-workload Secret listed after it lets one Deployment override a few keys:

```yaml
envFrom:
  - secretRef: { name: aws-mongodb-credentials } # URI, database, the API's user
  - secretRef: { name: osrs-tracker-ingester } # its own MONGODB_USERNAME and MONGODB_PASSWORD win
```

That's how our ingester got its own MongoDB user on 2026-10-22 while sharing the URI with the API. An `env` entry with the same name beats both.

Nothing warns about the override: swapping the two lines switches the user without an error. Say it in a comment next to the override keys in the Secret's template and next to the list, as we do.

## [KUBE-024] Grafana Cloud's free 10k series: one exporter can use most of them
- Type: pattern
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-22
- Sources: [Grafana pricing](https://grafana.com/pricing/), [Grafana Cloud: metrics pricing](https://grafana.com/docs/grafana-cloud/platform/pricing-and-usage/metrics/), [mongodb_exporter v0.54.0 REFERENCE.md](https://github.com/percona/mongodb_exporter/blob/v0.54.0/REFERENCE.md), FreekMencke/fremen-cluster `cluster/monitoring/alloy/values.yaml` (private)
- Related: KUBE-014, KUBE-020, KUBE-021, KUBE-025

The free tier is "Limited to 10k active series per month" with "14 days retention" (pricing page, 2026-10-22), measured at the 95th percentile of `grafanacloud_instance_active_series` over the period (KUBE-025).

One exporter can use most of that. Percona's `mongodb_exporter` 0.53–0.54, with only `--collector.diagnosticdata`, `--collector.replicasetstatus` and `--collector.dbstats`, offered about 5.8k series for one small database (measured 2026-10-21). `--collect-all` adds per-collection and per-index collectors, which grow with the data.

Keep only what a dashboard or alert reads, in the `prometheus.relabel` every scrape forwards to. Mark the names to keep, then drop everything unmarked from the exporter's pod only:

```alloy
rule {
  source_labels = ["__name__"]
  regex         = "mongodb_(up|myState|ss_connections|ss_opcounters|...)"
  target_label  = "mongodb_keep"
  replacement   = "true"
}
rule {
  source_labels = ["namespace", "app", "mongodb_keep"]
  regex         = "mongodb;mongodb-exporter;"
  action        = "drop"
}
rule {
  regex  = "mongodb_keep"
  action = "labeldrop"
}
```

A plain `keep` on `__name__` there would drop every other job's series too. Result: 58 series (54, plus 4 per database). The same step drops `_bucket` and `go_*` series cluster-wide; the whole cluster sent about 5.1k live series after 2026-10-21.

## [KUBE-025] `grafanacloud_instance_active_series` lags: count live series before cutting
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-22
- Sources: [Grafana Cloud: metrics pricing](https://grafana.com/docs/grafana-cloud/platform/pricing-and-usage/metrics/), [Prometheus: querying basics, staleness](https://prometheus.io/docs/prometheus/latest/querying/basics/#staleness)
- Related: KUBE-024, INFRA-028

Grafana Cloud: "An active series is a time series that has received new data points within the previous 20 minutes". The count is `grafanacloud_instance_active_series` on the `grafanacloud-usage` datasource, and the bill takes its 95th percentile over the period (`quantile_over_time(0.95, …[30d:])`).

Anything that replaces series counts old and new together until the old ones age out: pods restarting with new `pod` labels, a relabel change, or two clusters sending during a move. On 2026-10-21, with the old and new cluster overlapping, it showed 12.9k against the 10k limit while about 5.1k series were live (single-source).

Count live series on the metrics datasource itself:

```promql
count({__name__=~".+"})                 # series with a sample in the lookback
count by (job) ({__name__=~".+"})       # where they come from
```

A series counts if its newest sample is within the lookback period, "5 minutes by default". Cut series only when the live count is over budget. A spike from churn passes, and the 95th percentile ignores the highest 5% of the period, about 36 hours of a 30-day month.

## [KUBE-026] CrowdSec's Traefik bouncer 1.7.1 stops pulling bans on multi-CPU hosts; use 1.8.0 or later
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-22
- Sources: [crowdsec-bouncer-traefik-plugin#399](https://github.com/maxlerebourg/crowdsec-bouncer-traefik-plugin/pull/399), [#377](https://github.com/maxlerebourg/crowdsec-bouncer-traefik-plugin/issues/377), [v1.8.0 release notes](https://github.com/maxlerebourg/crowdsec-bouncer-traefik-plugin/releases/tag/v1.8.0), [Traefik v3.7.16 `go.mod`](https://github.com/traefik/traefik/blob/v3.7.16/go.mod), FreekMencke/fremen-cluster CHANGELOG 2026-10-21 (private)
- Related: KUBE-008, KUBE-027

Traefik runs plugins in its Go interpreter, yaegi (v0.16.1 in Traefik v3.7.16's `go.mod`). yaegi "builds the case list of a `select` once per statement and shares it between every goroutine that runs it", and the plugin's ban-list pull and metrics loops ran the same `select`. When both tickers fired together, the pull loop could wait on the metrics channel: "there is no stream poll until it receives a metrics tick, so the gap is exactly one or two metrics intervals". New bans waited that long.

The symptom (#377): the plugin "periodically stops calling GET /v1/decisions/stream for exactly ~20 minutes, while POST /v1/usage-metrics keeps working", visible in CrowdSec's local API logs. "The race needs the two loops running on separate CPUs. At `GOMAXPROCS=1` it is about 1000× rarer", so a 1-CPU limit hides it.

PR #399 fixed it in v1.8.0 (2026-10-18). v1.8.1 followed the same day and has only a release commit. We hit it on v1.7.1 (2026-07-31) after moving to a 6-vCPU host on 2026-10-21, and run v1.8.1 since. Pin the plugin's version in Traefik's `experimental.plugins` and read the release notes before bumping it, as with a chart.

## [KUBE-027] Flannel or Calico on a single node
- Type: comparison
- Applies to: general
- Confidence: single-source
- Last verified: 2026-10-22
- Sources: [Flannel README](https://github.com/flannel-io/flannel/blob/master/README.md), [Flannel v0.28.10 `kube-flannel.yml`](https://github.com/flannel-io/flannel/releases/tag/v0.28.10), [Kubernetes: network policies](https://kubernetes.io/docs/concepts/services-networking/network-policies/), [kube-network-policies](https://github.com/kubernetes-sigs/kube-network-policies), FreekMencke/fremen-cluster `cluster/flannel/` and CHANGELOG 2026-10-21 (private)
- Related: KUBE-016, KUBE-026, INFRA-025

Measured on our one-node kubeadm cluster, 2026-10-21:

| | Flannel v0.28.10 (2026-10-08) | Calico |
|---|---|---|
| Pods | one DaemonSet | seven |
| Memory | about 50 MiB | about 660 MiB |
| NetworkPolicy | not enforced | enforced |

The README: "the `flanneld` binary does not natively enforce Network Policies". Kubernetes: "Creating a NetworkPolicy resource without a controller that implements it will have no effect". Nothing fails: policies are accepted and ignored. On our cluster only Flux's default policies in `flux-system` existed.

Flannel's manifest uses VXLAN on `10.244.0.0/16`, so set kubeadm's `podSubnet` to match, clear of the service range.

To enforce policies later, Flannel's Helm chart has a `netpol.enabled` option that deploys kube-network-policies (Kubernetes SIGs; v1.1.2, 2026-09-28). The README also lists Calico for policy alongside Flannel.

Changing the CNI on a running cluster is an outage; we switched while building a new cluster for a server move, where it cost nothing extra. kubeadm doesn't upgrade the CNI (KUBE-016). A host firewall must not `flush ruleset`, or it wipes the rules Kubernetes and Flannel wrote.

## [KUBE-028] A fresh Ubuntu 26.04 server: chrony, fwupd's hourly refresh and `adm`
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-22
- Sources: [Ubuntu WSL docs: time synchronisation](https://documentation.ubuntu.com/wsl/stable/explanation/time-sync/), [Ubuntu Server: serve NTP with chrony](https://documentation.ubuntu.com/server/how-to/networking/serve-ntp-with-chrony/), [fwupd `fwupd-refresh.timer`](https://github.com/fwupd/fwupd/blob/main/data/motd/fwupd-refresh.timer), [journalctl(1)](https://github.com/systemd/systemd/blob/main/man/journalctl.xml), FreekMencke/fremen-cluster `host/bootstrap.sh` and `.claude/skills/server-health/` (private)
- Related: KUBE-016, KUBE-017

Three things that tripped a bootstrap script and health check written for Ubuntu 24.04, on an Ubuntu 26.04 VPS image (2026-10-21):

- **Time sync is chrony.** "Starting with Ubuntu 25.10, we migrated from systemd-timesyncd to chrony", for NTS support; "As of Ubuntu 25.10 chrony is installed by default". A check for `systemd-timesyncd` fails; check the `chrony` unit and `chronyc tracking`.
- **fwupd's refresh fails hourly on a VM.** `fwupd-refresh.timer` runs at `OnCalendar=*-*-* *:00:00`, skipped only by `ConditionVirtualization=!container`, so it runs on virtual machines. A VPS has no firmware fwupd can update, and LVFS's CDN timed out (from home too), so the unit failed all day and filled `systemctl --failed`. Turn it off: `systemctl disable --now fwupd-refresh.timer` and `systemctl reset-failed fwupd-refresh.service`.
- **A hand-made admin user isn't in `adm`.** journalctl: "Members of the groups systemd-journal, adm, and wheel can read all journal files". Our admin user was created by hand, outside the bootstrap script, so the health check, run as that user, saw only its own journal and missed the failed `fwupd-refresh`. The script now runs `usermod -aG adm`.

## Recommendations for our setup

Ranked by impact against effort. Compared on 2026-10-17, read-only, with a single-node kubeadm cluster reconciled by Flux from GitHub (each app repo's manifests applied by a Flux Kustomization, Flux's own install kept in a private repo), Traefik serving `Ingress` objects with cert-manager ACME HTTP-01 certificates, and Alloy shipping metrics and logs to a hosted Grafana stack. No issue was opened: nothing below needs a change in another repo now.

1. **Hold the cluster's Kubernetes minor until Flux 2.10 and the next cert-manager list 1.37** (KUBE-003, KUBE-009, KUBE-016). Both supported tables stop at 1.36 on 2026-10-17; check them, and the CNI's, before each minor. Tracked in FreekMencke/fremen-cluster#8 (named home-cluster until 2026-10-21), which gained the Flux 2.10 wait on 2026-10-18.
2. **Run `flux migrate -f` on every repo holding Flux objects before each Flux minor upgrade, and `flux migrate` against the cluster** (KUBE-002). The CLI's dry run shows what it would rewrite; Alert, Provider and Event move again when 2.10 promotes them to `v1`.
3. **Plan Kubernetes minor upgrades three times a year, one minor each, in a downtime window** (KUBE-015, KUBE-016). On one node a drain evicts everything; a two-a-year rhythm can't keep up with 14-month support.
4. **Won't do now: move from Ingress to Gateway API** (KUBE-006, KUBE-008). The retirement is ingress-nginx's, not Ingress's; Traefik is maintained and serves both, so routes can move one at a time when a Gateway-only feature is needed.
5. **Won't do: the Flux Operator** (KUBE-005). On one cluster it saves a manual upgrade step three times a year but adds a third-party AGPL controller; revisit if upgrades get skipped.
6. **Nothing to change for 64-day certificates** (KUBE-010): cert-manager's default 2/3 renewal matches Let's Encrypt's advice. Don't add a fixed `renewBefore`; use `renewBeforePercentage` if one is ever needed.
7. **Keep Alloy; no OpenTelemetry Collector** (KUBE-014). The pipelines are Prometheus scrapes and logs, the Default Engine's case. Promtail conversion (KUBE-013) doesn't apply.
8. **When images are signed (DOCKER-012), check signatures at admission** (DOCKER-013): Flux's `verify` covers only its own sources.
9. **Drop the `setarch` wrapper from mongod when `mongo:8.0.35` ships** (KUBE-017), and only then: on a kernel without the rseq fix, the wrapper would hide the hazard. The cluster check already flags new 8.0 patches.
10. **Done 2026-10-21 and 2026-10-22: the server move and MongoDB on the cluster** (FreekMencke/fremen-cluster#20, FreekMencke/fremen-cluster#22): Flannel instead of Calico (KUBE-027), CrowdSec plugin 1.8.1 (KUBE-026), host fixes (KUBE-028), MongoDB with its own exporter (KUBE-017 to KUBE-024).
11. **Won't do: Alloy's built-in MongoDB exporter** (KUBE-021): a URI Go can't parse stops every pipeline in Alloy, against one pod for Percona's exporter.

## Open questions

- **Flux 2.10's date** (KUBE-003): the roadmap says "mid Q4 2026", provisional; no release candidate on 2026-10-17. Whether a 2.9.x patch will ever list Kubernetes 1.37 isn't stated (fluxcd.io releases page, roadmap, 2.9.x release notes read).
- **Flux Operator footprint** (KUBE-005): no resource figures in the Operator README, FluxInstance API or fluxcd.io install pages.
- **Controller footprints on one node** (KUBE-008, KUBE-014): no official memory or CPU figure for Traefik, Envoy Gateway, NGINX Gateway Fabric, an idle Alloy or the Collector.
- **Traefik and ListenerSet** (KUBE-008): Traefik's `master` docs list ListenerSet support; the v3.7.15 docs don't. Traefik's docs link a `reports/v1.6.3` conformance folder that doesn't exist (the report is under `reports/v1.6`).
- **cert-manager and Let's Encrypt profiles** (KUBE-010): whether the ACME issuer can select a profile (`tlsserver`, `shortlived`) wasn't checked; nor DNS-PERSIST-01 support.
- **Loki 4.0** (KUBE-012): which release removes simple scalable mode and the legacy index stores; only `main`'s upgrade page says so. Loki 3.x's support window wasn't found.
- **`alloy otel` maturity** (KUBE-014): first exposed in 1.13.0 by the CHANGELOG's position; still public preview in 1.20.
- **The Grafana connector's 403 on the notification policy** (INFRA-028) and whether the App Platform routing-tree API would accept the write: not tried.
- **Calico's footprint** (KUBE-027) is one measurement on our node; no official figure for either CNI was found in their READMEs.
- **Not read:** CVE-2026-40109's advisory (Flux GCR Receivers), Envoy Gateway and NGINX Gateway Fabric docs, the OpenTelemetry Operator, k3s's upgrade controller.

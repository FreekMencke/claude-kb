# Agents with cloud and cluster access

Prefix `INFRA`. This file covers agents that can read or change live infrastructure: cloud credentials and identities, MCP servers versus CLIs for AWS and Kubernetes, how permission rules, auto mode and the sandbox treat infrastructure commands, change patterns (plan and apply, GitOps, dry runs, audit trails), incident debugging, credential leaks, published incidents, and a review of our own setup. It builds on kb-repo-agents.md (REPO: sandboxing, secrets, rules for repo agents), kb-token-usage.md (TOK: MCP overhead) and kb-hooks.md (HOOK: hook mechanics) and doesn't repeat them.

Research basis:
- Researched 2026-10-12 against Claude Code v2.1.296 docs and the v2.1.296 CLI (terminal in WSL), on the Claude 5 model family.
- Five Sonnet 5.5 researchers at high effort each took one block of questions and returned findings with sources. The lead re-read every limit, default and version used here on the full page (docs fetched as `.md`, AWS and GitHub pages by curl and grep).
- Our setup (INFRA-024) was read from local config files and checked with read-only AWS calls. No account, bucket, cluster or IAM names are copied here.

All "Last verified" dates are 2026-10-12 unless an entry gives a later one. Docs base: `https://code.claude.com/docs/en/`.

## Quick answers

| Question | Answer | Entries |
|---|---|---|
| Should an agent get its own cloud identity? | Yes. AWS calls reusing human credentials for agents an anti-pattern, because audit logs can't tell them apart. Claude Code's docs don't say it; they say to keep secrets outside the agent's boundary. | INFRA-001 |
| Is a read-only MCP server enough to keep an agent read-only? | No. The flag is client-side, and Bash can run `aws` or `kubectl` with the same profile or kubeconfig. Only the credential's IAM policy or RBAC binds every path. | INFRA-006, INFRA-004, INFRA-005 |
| Can I allow `kubectl get` and deny `kubectl delete` with permission rules? | Only partly. `Bash(kubectl delete *)` misses `kubectl -n prod delete`. Use deny rules with a middle `*` (`Bash(kubectl * delete *)`) plus a hook or the credential. | INFRA-008, INFRA-012 |
| What does auto mode block for `terraform`, `kubectl`, `helm` and `aws`? | Applies without a visible plan ("Blind Apply"), destroys, IAM/RBAC grants, prod deploys, `kubectl exec` into prod, mass deletes, printing credentials. It misses about 17% of overeager actions. | INFRA-009 |
| How does auto mode know what is production? | From names containing `prod`, unless you list targets in `autoMode.environment`. Production named after the app is ordinary shared state to it. | INFRA-010 |
| Can the sandbox hide AWS keys from Bash and still let `aws` work? | Yes: mask `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` together, and the proxy re-signs SigV4 (v2.1.221+, needs `tlsTerminate`). It doesn't cover MCP servers. | INFRA-011 |
| Can IAM tell AWS MCP calls apart from CLI calls? | Yes: the AWS MCP Server adds `aws:ViaAWSMCPService` and `aws:CalledViaAWSMCP`. The old `aws-mcp:*` actions have no effect any more. | INFRA-003 |
| How should an agent change infrastructure? | It plans or opens a PR; a human or CI applies. Run a dry run or diff first. GitOps keeps cluster write credentials away from the agent. | INFRA-013, INFRA-014, INFRA-015 |
| How do I see afterwards what an agent did? | CloudTrail (management events for 90 days without a trail; data events need a trail), Kubernetes audit logs (off unless configured), a PostToolUse logging hook, OTel tool events. | INFRA-016, INFRA-017 |
| How do I debug an incident without flooding context? | Filtered MCP reads (Flux `since`/`grep`/`limit`, Logs Insights aggregates), done by a read-only subagent that returns a short summary. | INFRA-018, INFRA-019 |
| Do credentials end up in transcripts? | Yes, anything a tool prints is written to the plaintext `.jsonl` and sent to the model. Settings `env` reaches every subprocess. | INFRA-021, INFRA-020 |
| Which guardrail would have prevented published agent incidents? | Scoped or read-only credentials first, then a human-run apply, then deletion protection and backups out of reach. Prompt instructions failed every time. | INFRA-022, INFRA-023 |
| Can a session query Loki, or only pod logs? | Loki too, since 2026-10-13: `claude-agent` has `get` on the gateway's service proxy only, so `kubectl get --raw '/api/v1/namespaces/grafana-loki/services/loki-gateway:80/proxy/loki/api/v1/query_range?query=...'` works for queries, labels and series (GET). Push, delete and other services' proxies stay forbidden. | INFRA-024, INFRA-025 |
| How do I check a subresource permission with `kubectl auth can-i`? | With `--subresource`: `can-i get services --subresource=proxy`. `can-i get services/proxy` checks a service named `proxy`, and gave a false `yes` here. Against a grant limited by `resourceNames`, add the name (`services/loki-gateway:80 --subresource=proxy`): without it the answer is `no`. | INFRA-025 |
| What should we change in our setup first? | Done 2026-10-12: read-only cluster identity, pinned MCP servers, `autoMode.environment`, deny rules, root keys gone, agent policy tightened. Left: short-lived AWS credentials (rec 10) and the Bash-vs-MCP decision (rec 9). | INFRA-024, Recommendations |

## Index

| ID | Title | Type | Tags |
|---|---|---|---|
| INFRA-001 | What Anthropic and AWS say about cloud credentials for agents | fact | least-privilege, identity, aws |
| INFRA-002 | Isolation for infrastructure work: dev containers, cloud sessions, the sandbox | comparison | devcontainer, cloud-sessions, sandbox |
| INFRA-003 | The AWS MCP Server: tools, read-only mode and IAM context keys | tool | aws, mcp, iam |
| INFRA-004 | kubernetes-mcp-server: read-only, denied resources and output | tool | kubernetes, mcp, read-only |
| INFRA-005 | Flux MCP server: read-only, secret masking and filters | tool | flux, mcp, gitops |
| INFRA-006 | What a server or a credential enforces that Bash rules can't | fact | mcp, rbac, iam, permissions |
| INFRA-007 | Output size: MCP filters versus CLI output | recommendation | mcp, tokens, output |
| INFRA-008 | Permission rules for `aws`, `kubectl`, `helm` and `terraform` | fact | permissions, bash, cloud-cli |
| INFRA-009 | Auto mode's built-in rules for cloud and cluster actions | fact | auto-mode, classifier, infra |
| INFRA-010 | Telling auto mode which infrastructure is production | recommendation | auto-mode, environment, settings |
| INFRA-011 | The sandbox with cloud CLIs, and AWS credential masking | tool | sandbox, credentials, sigv4 |
| INFRA-012 | Guard hooks for destructive infrastructure commands | pattern | hooks, pretooluse, safety |
| INFRA-013 | Plan and apply split with human approval | pattern | terraform, approval, ci |
| INFRA-014 | GitOps: the agent opens a PR, Flux applies it | pattern | gitops, flux, pr |
| INFRA-015 | Dry-run and diff commands before any change | fact | dry-run, diff, kubectl, terraform |
| INFRA-016 | AWS audit trail: CloudTrail and attributing agent actions | fact | cloudtrail, audit, aws |
| INFRA-017 | Kubernetes audit logs and Claude Code's own records | fact | audit, kubernetes, otel, hooks |
| INFRA-018 | Reading logs and events with filters during an incident | pattern | logs, incidents, mcp |
| INFRA-019 | A read-only subagent that digests logs | pattern | subagents, logs, incidents |
| INFRA-020 | AWS credentials: profiles, short-lived sessions and Claude Code's AWS settings | fact | credentials, sso, sts, settings |
| INFRA-021 | How credentials leak into transcripts, environments and telemetry | fact | credentials, transcripts, otel, env |
| INFRA-022 | Published incidents: agents that destroyed infrastructure or data | fact | incidents, terraform, databases |
| INFRA-023 | Which guardrail would have stopped each incident | recommendation | incidents, guardrails |
| INFRA-024 | Our setup: AWS, Kubernetes and MCP access as of 2026-10-12 | fact | our-setup, aws, kubernetes, mcp |
| INFRA-025 | `kubectl auth can-i` reads `resource/x` as a resource name, not a subresource | anti-pattern | kubernetes, rbac, kubectl, testing |

## Identities and isolation

## [INFRA-001] What Anthropic and AWS say about cloud credentials for agents
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-12
- Sources: [Agent SDK: secure deployment](https://code.claude.com/docs/en/agent-sdk/secure-deployment), [Dev containers](https://code.claude.com/docs/en/devcontainer), [Anthropic: safe and trustworthy agents](https://www.anthropic.com/news/our-framework-for-developing-safe-and-trustworthy-agents), [AWS Agentic AI Lens AGENTSEC03-BP02](https://docs.aws.amazon.com/wellarchitected/latest/agentic-ai-lens/agentsec03-bp02.html), [AGENTSEC03-BP03](https://docs.aws.amazon.com/wellarchitected/latest/agentic-ai-lens/agentsec03-bp03.html), [IAM best practices](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html)
- Related: INFRA-002, INFRA-020, REPO-036

The Claude Code docs don't tell you to give an agent its own cloud identity or a read-only role. That advice comes from AWS; Anthropic's guidance is about where credentials live.

**Anthropic:**
- Agent SDK: "run a proxy outside the agent's security boundary that injects credentials into outgoing requests", so "The agent never sees the actual credentials". On cloud: "Assign minimal IAM permissions to the agent's service account".
- Dev containers: "Avoid mounting host secrets such as `~/.ssh` or cloud credential files into the container; prefer repository-scoped or short-lived tokens."
- "Read-only by default" in Anthropic's agent framework means Claude Code's file permissions, not cloud credentials. Since v2.1.283, auto mode, not Manual, is the starting mode (REPO-032).

**AWS (Well-Architected Agentic AI Lens):**
- Anti-pattern: "Reusing human user IAM credentials or roles for agent authentication, making it impossible to distinguish agent actions from human actions in audit logs."
- Start "with no permissions and adding only what is required", with permission boundaries as a ceiling and STS sessions of "15 to 60 minutes".
- Anti-patterns: "Using long-lived static credentials instead of temporary credentials from AWS STS"; widening permissions after access errors without investigating.

Together: a separate identity, the narrowest policy that does the job, short-lived credentials, and the secret kept out of the agent's reach (INFRA-011).

## [INFRA-002] Isolation for infrastructure work: dev containers, cloud sessions, the sandbox
- Type: comparison
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-12
- Sources: [Dev containers](https://code.claude.com/docs/en/devcontainer), [init-firewall.sh](https://github.com/anthropics/claude-code/blob/main/.devcontainer/init-firewall.sh), [Security](https://code.claude.com/docs/en/security), [Cloud environments](https://code.claude.com/docs/en/cloud-environments), [Permission modes](https://code.claude.com/docs/en/permission-modes)
- Related: INFRA-001, INFRA-011, REPO-035

| Option | Fit for cloud credentials |
|---|---|
| Sandbox (REPO-035, INFRA-011) | Covers Bash only; MCP servers and hooks run outside it with full access |
| Dev container | Isolates the whole process, but "do not prevent a malicious project from exfiltrating anything accessible inside the container". Pass cloud credentials "as environment variables through `containerEnv`… or your cloud's workload identity rather than mounting credential files" |
| Cloud session | GitHub credentials stay on Anthropic's proxy, but environment variables are readable by "Anyone who uses the environment", and AWS SSO is "Not supported" |

The reference `init-firewall.sh` allows GitHub, npm, the Anthropic API and a few VS Code hosts, plus DNS and outbound SSH, then drops everything else. AWS endpoints aren't on its list, so infra work needs additions, and DNS and SSH stay open as exfiltration paths.

For `--dangerously-skip-permissions` the docs say: "Only use this mode in isolated environments like containers, VMs, or dev containers without internet access". Deny rules still apply in that mode; allow rules don't. With cloud credentials inside, a container limits what the agent can reach on the host, not what it can do in the cloud: the credential's policy decides that.

## MCP servers or CLIs

## [INFRA-003] The AWS MCP Server: tools, read-only mode and IAM context keys
- Type: tool
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-12
- Sources: [AWS MCP Server IAM](https://docs.aws.amazon.com/agent-toolkit/latest/userguide/security_iam_service-with-iam.html), [Tools](https://docs.aws.amazon.com/agent-toolkit/latest/userguide/understanding-mcp-server-tools.html), [GA announcement](https://aws.amazon.com/about-aws/whats-new/2026/05/aws-mcp-server/), [mcp-proxy-for-aws README](https://github.com/aws/mcp-proxy-for-aws), [CloudTrail logging](https://docs.aws.amazon.com/agent-toolkit/latest/userguide/logging-using-cloudtrail.html), [aws-api-mcp-server README](https://github.com/awslabs/mcp/tree/main/src/aws-api-mcp-server)
- Related: INFRA-006, INFRA-016, INFRA-024

The managed AWS MCP Server went GA on 2026-05-06. It runs on AWS; a local proxy (`mcp-proxy-for-aws`) signs requests with SigV4 from a named profile. The older open-source `aws-api-mcp-server` "is superseded".

- **Tools.** `aws___run_script` runs Python "in a sandboxed environment with AWS API access", "without access to your local filesystem or shell tools". The others cover documentation search, skills, regions, presigned URLs and `get_tasks`.
- **Read-only.** The proxy's `--read-only` flag hides tools not annotated `readOnlyHint=true`. Whether `run_script` survives it is unverified.
- **IAM.** "The server does not define its own IAM actions". It adds `aws:ViaAWSMCPService` (true for any call through an AWS managed MCP server) and `aws:CalledViaAWSMCP` (for example `aws-mcp.amazonaws.com`) to every forwarded request. The preview actions `aws-mcp:InvokeMcp`, `CallReadOnlyTool` and `CallReadWriteTool` "are no longer required and have no effect"; Deny statements on them must move to the context keys.
- **Using the keys.** Deny writes made through MCP, for example `s3:Delete*` when `aws:ViaAWSMCPService` is true. They don't tag `aws` CLI calls made from Bash with the same profile.
- **Audit.** Server calls are CloudTrail events (`eventSource` `aws-mcp.amazonaws.com`) whose `requestParameters` are an "Exact copy of MCP request params", so the script body is on record.
- **Limits.** 10 requests per second per account and Region, 90 concurrent sessions per user. No output-size cap is documented.

## [INFRA-004] kubernetes-mcp-server: read-only, denied resources and output
- Type: tool
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-12
- Sources: [README v0.0.67](https://github.com/containers/kubernetes-mcp-server/blob/v0.0.67/README.md), [Configuration](https://github.com/containers/kubernetes-mcp-server/blob/main/docs/configuration.md), [Configuration changes](https://github.com/containers/kubernetes-mcp-server/blob/main/docs/configuration-changes.md), [Releases](https://github.com/containers/kubernetes-mcp-server/releases)
- Related: INFRA-006, INFRA-007, INFRA-024

`containers/kubernetes-mcp-server` (latest release v0.0.67, 2026-09-18) acts with whatever kubeconfig identity it is given.

- **`read_only`** (default false) "only exposes tools annotated with `readOnlyHint=true`". **`disable_destructive`** removes delete and update tools. Both take tools off the list rather than refusing calls.
- **`denied_resources`** blocks kinds by GroupVersionKind, for example `Secret`, whatever RBAC allows. No masking of Secret data in tool output is documented, so deny the kind.
- **Toolsets.** `core` and `config` are on by default; `helm` and others are opt-in. Fewer toolsets "can help reduce the context size".
- **Output.** List output defaults to `table`. `pods_log` has `tail` (default 100) but no `since` or `grep`; `resources_get` returns the whole object.
- **Config is changing.** v0.0.67 takes flags (`--read-only`, `--disable-destructive`). On `main`, "The CLI no longer accepts runtime flags": only `--config` with TOML keys `read_only`, `disable_destructive` and `toolsets`. A new `confirmation_rules` feature defaults `confirmation_fallback` to `"allow"` ("proceeds silently") when the client can't confirm.

Pin the version. With `npx -y kubernetes-mcp-server@latest`, a renamed key in a future release could leave a server you think is read-only able to write, with no change on your side.

## [INFRA-005] Flux MCP server: read-only, secret masking and filters
- Type: tool
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-12
- Sources: [Flux MCP config](https://github.com/controlplaneio-fluxcd/flux-operator/blob/main/docs/mcp/mcp-config.md), [Flux MCP tools](https://github.com/controlplaneio-fluxcd/flux-operator/blob/main/docs/mcp/tools.md), [cmd/mcp/main.go](https://github.com/controlplaneio-fluxcd/flux-operator/blob/main/cmd/mcp/main.go), [cmd/mcp/README.md](https://github.com/controlplaneio-fluxcd/flux-operator/blob/main/cmd/mcp/README.md)
- Related: INFRA-004, INFRA-007, INFRA-014, INFRA-018

`flux-operator-mcp` ships with the Flux Operator (v0.61.0, 2026-10-01).

- **`--read-only`** defaults to **false**. When set, "the MCP tools that modify the cluster state (reconcile, suspend, resume, apply, delete) are disabled". The README quickstart shows `--read-only=false`, so copying it gives a writable server.
- **`--mask-secrets`** defaults to true: "Disabling secret masking will expose sensitive information to the AI assistant".
- **`--kube-as`** impersonates a ServiceAccount: "This limits the server's permissions to those granted to the specified service account". The kubeconfig user needs impersonate rights.
- **Filters.** `get_kubernetes_resources` takes `fields` (kubectl JSONPath), `selector` and `limit`. `get_kubernetes_logs` and `get_kubernetes_events` take `since`, `grep` (RE2) and `limit` (default 100) and flag `truncated`.
- **Read-only isn't view-only.** `diff_kubernetes_manifest` stays available in read-only mode but needs `get` and `patch`, because Kubernetes authorizes a server-side dry run like a real apply.
- **Audit.** `--tool-call-log-file` appends tool inputs and outputs to a JSONL file (found in the source code; docs status unverified).

## [INFRA-006] What a server or a credential enforces that Bash rules can't
- Type: fact
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-12
- Sources: [Permissions](https://code.claude.com/docs/en/permissions), [Sandboxing](https://code.claude.com/docs/en/sandboxing), [Kubernetes RBAC: user-facing roles](https://kubernetes.io/docs/reference/access-authn-authz/rbac/#user-facing-roles), [AWS MCP Server IAM](https://docs.aws.amazon.com/agent-toolkit/latest/userguide/security_iam_service-with-iam.html)
- Related: REPO-034, INFRA-003, INFRA-004, INFRA-008

From weakest to strongest:
1. **Bash rules** match command text (REPO-034, INFRA-008). They don't survive flag reordering or `sh -c`.
2. **MCP permission rules** match server and tool names (`mcp__flux__*`, `mcp__github__get_*`), not arguments: settings skip any `mcp__` rule with parentheses. Claude Code can allow `run_script` but can't see what the script does.
3. **A server's read-only flag** removes write tools from the list, so a request from the model can't bring them back. But the flag is client-side code running with your credentials, and MCP servers run outside the sandbox.
4. **The credential.** IAM policy and Kubernetes RBAC are enforced by AWS and the API server, whatever tool or command made the call. The `view` ClusterRole "does not allow viewing Secrets, since reading the contents of Secrets enables access to ServiceAccount credentials".


Tested 2026-10-12, v2.1.296, terminal (WSL): with `~/.kube/config` as a `view`-bound ServiceAccount token, `kubectl auth can-i` gave `no` for `delete pods -A`, `get secrets -A` and `create pods/exec`, and `yes` for `list pods -A`. Both MCP servers still connected. The `pods/exec` check named a pod `exec` rather than the subresource (INFRA-025); retested 2026-10-13, v2.1.296, desktop Code tab (WSL): `can-i create pods --subresource=exec` gives `no`.

## [INFRA-007] Output size: MCP filters versus CLI output
- Type: recommendation
- Applies to: Claude Code
- Confidence: single-source
- Last verified: 2026-10-12
- Sources: [MCP](https://code.claude.com/docs/en/mcp), [Flux MCP tools](https://github.com/controlplaneio-fluxcd/flux-operator/blob/main/docs/mcp/tools.md), [Scalekit: MCP vs CLI](https://scalekit.com/blog/mcp-vs-cli-use)
- Related: TOK-020, TOK-022, TOK-023, INFRA-018

General MCP overhead and output limits are in TOK-020 to TOK-023. For infrastructure servers the cost is in the results, not the schemas: tool search defers definitions by default.

- **The one benchmark** (Scalekit, GitHub MCP versus `gh`, Claude Sonnet 4, 75 runs): the CLI was "10 to 32× cheaper" and MCP was 72% reliable. It measured schemas injected without tool search, so it overstates the gap in Claude Code. No kubectl, AWS or Flux comparison has been published.
- **By filters:** Flux (`fields`, `since`, `grep`, `limit`) beats kubernetes-mcp-server (selectors, `tail`, table output, no field projection). The AWS MCP Server's `run_script` returns only what the script prints, so filter inside the script.
- **CLI equivalents:** `kubectl get -o jsonpath=…` or `-o custom-columns=…`, `kubectl logs --since=15m --tail=200`, `aws … --query … --output text`.

In our transcripts Flux MCP results averaged 998 tokens (TOK-023). Ask for fields, not whole objects.

## Permission rules, auto mode and the sandbox

## [INFRA-008] Permission rules for `aws`, `kubectl`, `helm` and `terraform`
- Type: fact
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-12
- Sources: [Permissions](https://code.claude.com/docs/en/permissions)
- Related: REPO-034, INFRA-006, INFRA-012

Bash rules match text (REPO-034), and cloud CLIs make that worse, because their global flags come before the subcommand.

- **Allow rules over-approve.** `Bash(aws s3 *)` also allows `aws s3 rm --recursive`; `Bash(helm *)` allows `uninstall`. Put the `*` after the subcommand: `Bash(kubectl get *)`, `Bash(terraform plan *)`.
- **Deny rules under-match.** `Bash(kubectl delete *)` misses `kubectl -n prod delete …`. A deny with a middle `*` catches options before the verb: in `Bash(git * main)` the `*` "stands in for the subcommand… and every option before it". Write `Bash(kubectl * delete *)` and `Bash(kubectl delete *)`, `Bash(terraform * apply *)`, `Bash(helm * uninstall *)`. That still misses `/usr/bin/kubectl` and `sh -c`.
- **A broad deny wins.** "A broad deny rule like `Bash(aws *)` blocks every matching call, including calls that also match a narrower allow rule like `Bash(aws s3 ls)`."
- **Environment prefixes.** "A deny or ask rule matches past any leading assignment", so `AWS_PROFILE=x aws …` still hits a deny. Allow rules skip only known-safe variables.
- **Wrappers.** `timeout`, `nice`, `nohup` and a few others are stripped before matching; `npx`, `docker exec` and `devbox run` are not.
- **No cloud CLI counts as read-only.** The auto-approved set "includes `ls`, `cat`, `echo`, `pwd`, `head`, `tail`, `grep`, `find`, `wc`, `which`, `diff`, `stat`, `du`, `cd`, and read-only forms of `git`".
- **MCP tools match by name only.** "When Claude Code loads a settings file, it skips any `mcp__` rule that has parentheses."

Tested 2026-10-12, v2.1.296, terminal (WSL): with `Bash(kubectl * delete *)` in `~/.claude/settings.json` and auto mode on, a Haiku `claude -p` asked to run `kubectl -n default delete pod … --dry-run=client` got "has been denied" without a prompt.

## [INFRA-009] Auto mode's built-in rules for cloud and cluster actions
- Type: fact
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-12
- Sources: [Permission modes: what the classifier blocks](https://code.claude.com/docs/en/permission-modes), [Auto mode config](https://code.claude.com/docs/en/auto-mode-config), [Anthropic: how we built auto mode](https://www.anthropic.com/engineering/claude-code-auto-mode)
- Related: REPO-032, INFRA-010, INFRA-021, INFRA-023

`claude auto-mode defaults` prints the classifier's rules (1 `hard_deny`, 72 `soft_deny`, 17 `allow`). For infrastructure:

| Rule | Covers |
|---|---|
| Blind Apply | `--auto-approve`, `--force`, plan and apply chained, or an apply "when no preview/plan/dry-run output is visible earlier in the transcript" |
| Protected-Scope IaC Apply | `terraform apply`, `kubectl apply -f`, `helm upgrade` on a protected scope; "Plan/dry-run is fine" |
| Modify Shared Resources | `terraform destroy`; changes to shared state |
| Production Deploy, Production Reads, Remote Shell Writes | deploys, `kubectl exec`, prod queries |
| Cloud Storage Mass Delete, Unverifiable Deletion Scope | bucket deletes, `… \| xargs delete` |
| Permission Grant, Secret-Store Writes, DNS Changes, Logging/Audit Tampering | IAM/RBAC, secrets, Route 53, audit trails |
| Credential Materialization, Credential Exploration | `cat ~/.aws/credentials`, `kubectl get secret -o yaml` |
| Node Lifecycle, Cluster-Wide Workload Creation, Shared Cluster Mutation | drain, DaemonSets, selector-wide writes |

Since v2.1.257 it also blocks instance-metadata credentials. A soft block clears when the user names the specific change. Narrow allow rules skip the classifier unless `autoMode.classifyAllShell` is `true`.

It is a layer, not a boundary: Anthropic measured 17% false negatives on real overeager actions (n=52), and says it "is not a drop-in replacement for careful human review on high-stakes infrastructure".

Tested 2026-10-12, v2.1.296, terminal (WSL): `claude auto-mode defaults` printed these rules; a transcript scan for AWS key patterns was denied as `[Credential Exploration]`.

## [INFRA-010] Telling auto mode which infrastructure is production
- Type: recommendation
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-12
- Sources: [Auto mode config](https://code.claude.com/docs/en/auto-mode-config), [Permission modes](https://code.claude.com/docs/en/permission-modes)
- Related: INFRA-009, REPO-032

Without configuration, auto mode guesses what is sensitive from names. The defaults:
- Sensitive remote targets: "any namespace, host, or container whose name carries `prod` or `production` as a whole word or name segment".
- Protected IaC scopes: "IAM, RBAC, networking, quota, and node-pool resources; anything whose name or tag carries `prod` or `production`".
- Cloud provider(s) and Trusted cloud buckets: "None configured".

So a production namespace or bucket named after the product is judged as ordinary shared state. Fix it in `autoMode.environment` in `~/.claude/settings.json`. Entries are prose, "not regex or tool patterns":

```json
{ "autoMode": { "environment": [
  "$defaults",
  "Cloud provider(s): AWS, one account; the agent uses the claude profile",
  "Sensitive remote targets: the <app> namespace on the home cluster is production",
  "Protected IaC scopes: the site buckets, the scheduled-job rules, the Lambda functions"
] } }
```

- Keep `"$defaults"`: an array without it "replaces the entire default list for that section".
- The classifier doesn't read `autoMode` from a repo's `.claude/settings.json`, so it must go in user or managed settings.
- `/auto-mode-setup` drafts entries from recent sessions (v2.1.228+, Pro, Max or Team). `claude auto-mode config` shows the result.

Tested 2026-10-12, v2.1.296, terminal (WSL): `claude auto-mode config` listed the 21 default environment entries and then our four. The defaults still read "None configured" for the slots we filled, so our entries are added alongside the defaults, not merged into them.
- Scopes merge "additive, not a hard policy boundary": a user `allow` can override an organization `soft_deny`. For a hard line, use `permissions.deny`.

## [INFRA-011] The sandbox with cloud CLIs, and AWS credential masking
- Type: tool
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-12
- Sources: [Sandboxing](https://code.claude.com/docs/en/sandboxing), [Settings reference: sandbox.credentials](https://code.claude.com/docs/en/settings-reference), [Changelog](https://code.claude.com/docs/en/changelog)
- Related: REPO-035, INFRA-020, INFRA-021

Sandbox basics are in REPO-035. For cloud CLIs:
- **Reads.** Sandboxed commands read "most of the machine, including credential files such as `~/.ssh` and `~/.aws/credentials`", and inherit Claude Code's environment "including any secrets in its environment".
- **Network.** API endpoints (`*.amazonaws.com`, the cluster API server) must be in `network.allowedDomains`. On Linux and WSL2, `localhost` doesn't reach host servers.
- **Writes.** For `kubectl` or `terraform` files outside the working directory, use `sandbox.filesystem.allowWrite` rather than `excludedCommands`, which runs the tool "with your full access". `gh`, `gcloud` and `terraform` "may fail TLS verification" under macOS Seatbelt.
- **Credential masking.** `sandbox.credentials` entries `deny` or `mask` a file or variable. A masked value is a per-session sentinel that the sandbox proxy swaps for the real value on requests to allowed hosts. Masking needs `network.tlsTerminate` and counts only from user or managed settings.
- **AWS re-signing.** "mask `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` together. The proxy detects a SigV4 request by the access key's sentinel and re-signs the request with the real values". The sandboxing page says v2.1.221+; the `awsPairs` and `sigv4` options are v2.1.224+ (changelog). Streaming uploads, presigned URLs and SigV4A can't be re-signed.
- **File masking** works on Linux and WSL since v2.1.221; on macOS it falls back to `deny`.
- **Limits.** Masking covers sandboxed Bash only. MCP servers run unsandboxed and keep their own credentials. `CLAUDE_CODE_SUBPROCESS_ENV_SCRUB` strips credential variables from all subprocesses (INFRA-021).

## [INFRA-012] Guard hooks for destructive infrastructure commands
- Type: pattern
- Applies to: Claude Code
- Confidence: community-consensus
- Last verified: 2026-10-12
- Sources: [Permissions: hooks](https://code.claude.com/docs/en/permissions), [destructive_command_guard](https://github.com/Dicklesworthstone/destructive_command_guard), [cc-safety-net](https://github.com/kenryu42/claude-code-safety-net), [Hooks reference](https://code.claude.com/docs/en/hooks)
- Related: HOOK-028, HOOK-013, HOOK-032, INFRA-008

Hook mechanics and the general pattern are in HOOK-028. For infrastructure CLIs, a `PreToolUse` hook can parse what a rule can't: strip global flags (`-n`, `--context`, `--profile`, `-chdir`), then decide on the verb. "PreToolUse hook decisions don't bypass permission rules", so a hook adds blocks and never loosens a deny.

Published guards with infrastructure coverage (stars and last push read 2026-10-12 from the GitHub API):

| Repo | Stars | Infra coverage |
|---|---|---|
| Dicklesworthstone/destructive_command_guard (`dcg`) | 6,154 | Opt-in packs: `kubernetes.kubectl` (delete namespace, drain, mass deletion), `kubernetes.helm`, `infrastructure.terraform` (destroy, taint, `-auto-approve`), `cloud.aws` (terminate-instances, delete-db-instance, `s3 rm --recursive`). Only filesystem, git and disk packs are on by default |
| kenryu42/claude-code-safety-net | 1,603 | Git and filesystem guards, blocks reads of `~/.aws`; "official packs for Terraform, AWS, gcloud, and Azure" |

Neither README shows tests for reordered global flags, so check before relying on one. Read the code before installing: hooks run with your full permissions and outside the sandbox. Hooks fail open on a crash unless `onFailure: "block"` (HOOK-013). A hook is the right layer for "no `terraform apply` without a saved plan file", which neither rules nor the classifier can express exactly.

## Change patterns

## [INFRA-013] Plan and apply split with human approval
- Type: pattern
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-12
- Sources: [Terraform plan](https://developer.hashicorp.com/terraform/cli/commands/plan), [Terraform MCP server security](https://developer.hashicorp.com/terraform/mcp-server/security), [GitHub environments](https://docs.github.com/en/actions/managing-workflow-runs-and-deployments/managing-deployments/managing-environments-for-deployment), [Atlantis command requirements](https://www.runatlantis.io/docs/command-requirements.html), [Grigorev post-mortem](https://aishippingblog.com/p/how-i-dropped-our-production-database)
- Related: INFRA-014, INFRA-015, INFRA-022, INFRA-009

The agent writes the change and runs the plan; a human reads it, and apply runs somewhere the agent's credentials can't reach.

- **Saved plans.** `terraform plan -out=FILE` fixes what will be applied. `-detailed-exitcode` returns 0 for no changes, 1 for an error and 2 for changes. A plan file holds sensitive values "in cleartext", so keep it out of commits and transcripts.
- **Apply gates outside the agent.** GitHub environments with required reviewers (up to 6; secrets released only after approval; on Free, Pro and Team plans only for public repos). Atlantis `apply_requirements: [approved]` ("approved by at least one user other than the author"). HCP Terraform's default manual apply.
- **The agent's identity can plan, not apply.** If apply credentials live only in the gated CI environment, an agent that ignores instructions still can't apply.
- **Vendor positions.** HashiCorp's Terraform MCP server keeps operations behind `ENABLE_TF_OPERATIONS` (default `false`) and says output "should always be reviewed prior to any change application". Anthropic's security team pastes plans into Claude Code to ask "what's this going to do? Am I going to regret this?"
- **Auto mode agrees.** "Blind Apply" blocks an apply without a visible plan and chained plan-and-apply commands (INFRA-009).

The DataTalks.Club post-mortem's fix is this pattern: "Generate a plan, Review it manually, Run commands myself" (INFRA-022).

## [INFRA-014] GitOps: the agent opens a PR, Flux applies it
- Type: pattern
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-12
- Sources: [Flux MCP instructions](https://github.com/controlplaneio-fluxcd/flux-operator/blob/main/docs/mcp/instructions.md), [Flux MCP config](https://github.com/controlplaneio-fluxcd/flux-operator/blob/main/docs/mcp/mcp-config.md), [flux diff kustomization](https://fluxcd.io/flux/cmd/flux_diff_kustomization/), [flux build kustomization](https://fluxcd.io/flux/cmd/flux_build_kustomization/)
- Related: INFRA-005, INFRA-013, INFRA-015

With Flux, the controller in the cluster applies what is in Git. An agent that only edits manifests and opens a PR needs no cluster write credentials, and the PR review is the approval gate. That framing is ours: the Flux docs don't call PR review a gate. They do push changes through Git:
- "Avoid applying changes to Flux-managed resources unless explicitly requested."
- Fields set by a Flux manifest "are reverted on the next reconciliation, so fix the source for lasting changes". A direct `kubectl` edit by an agent doesn't stick anyway.

Before committing:
- **Build locally:** `kustomize build <path>`, `helm template <release> <chart> -n <ns> --include-crds`, or `flux build kustomization … --dry-run` (no cluster; "variable substitutions from Secrets and ConfigMaps are skipped").
- **Diff against the cluster:** `flux diff kustomization` builds, does a server-side dry run and exits 1 when there are differences. The Flux MCP's `diff_kubernetes_manifest` is the documented "pre-commit gate: build locally, send the complete build output, review the diff… then commit". It needs `get` and `patch` RBAC.
- **Prunes:** treat `delete` entries in a diff as real only "when the supplied manifest is complete".

The agent's cluster identity can then be read-only (INFRA-006), with Flux holding write access.

## [INFRA-015] Dry-run and diff commands before any change
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-12
- Sources: [kubectl apply](https://kubernetes.io/docs/reference/kubectl/generated/kubectl_apply/), [kubectl diff](https://kubernetes.io/docs/reference/kubectl/generated/kubectl_diff/), [helm-diff README](https://github.com/databus23/helm-diff), [EC2 API: DryRun](https://docs.aws.amazon.com/AWSEC2/latest/APIReference/Query-Requests.html), [CloudFormation change sets](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/using-cfn-updating-stacks-changesets.html), [cdk diff](https://docs.aws.amazon.com/cdk/v2/guide/ref-cli-cmd-diff.html)
- Related: INFRA-013, INFRA-014

| Tool | Preview | Notes |
|---|---|---|
| kubectl | `kubectl diff -f FILE` (exit 1 = differences); `kubectl apply --dry-run=server` | `client` only prints the object; `server` submits it "without persisting" and needs write RBAC |
| Helm | `helm diff upgrade` (plugin), `--detailed-exitcode` | Secrets redacted by default; `--three-way-merge-mode client` "needs read access only" |
| Terraform | `terraform plan -out=FILE -detailed-exitcode` | Exit 2 = changes (INFRA-013) |
| CloudFormation | change sets; `aws cloudformation deploy --no-execute-changeset` | Changes happen "only when you decide to execute the change set" |
| CDK | `cdk diff` | Creates a change set by default, falling back to a template diff |
| EC2 API | `--dry-run` | A permission check, not a preview: returns `DryRunOperation` or `UnauthorizedOperation` |

Two caveats:
- A server-side dry run is authorized like the real call. An agent identity that can dry-run can usually also apply, unless RBAC separates them.
- `--dry-run` exists on EC2 calls. No AWS page lists which other services support it.

The auto mode classifier looks for preview output earlier in the transcript before it allows an apply to live or shared infrastructure ("Blind Apply", INFRA-009). Running the preview as its own command, not chained to the apply, is what clears it.

## Audit trails

## [INFRA-016] AWS audit trail: CloudTrail and attributing agent actions
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-12
- Sources: [CloudTrail event history](https://docs.aws.amazon.com/awscloudtrail/latest/userguide/view-cloudtrail-events.html), [AWS MCP Server CloudTrail](https://docs.aws.amazon.com/agent-toolkit/latest/userguide/logging-using-cloudtrail.html), [Source identity](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_temp_control-access_monitor.html), [AssumeRole API](https://docs.aws.amazon.com/STS/latest/APIReference/API_AssumeRole.html), [AGENTSEC03-BP02](https://docs.aws.amazon.com/wellarchitected/latest/agentic-ai-lens/agentsec03-bp02.html)
- Related: INFRA-003, INFRA-017, INFRA-020

**What is recorded without setup.** Event history is "the past 90 days of management events" and "does not show data events". S3 object writes and deletes and Lambda invokes are data events: without a trail with data events, they leave no record.

**Attribution.** CloudTrail names the principal in `userIdentity`, so a separate agent identity is the attribution (INFRA-001):
- An IAM user shows as that user.
- Role sessions carry a session name; with `role_session_name` in a CLI profile, it "is also included in the AWS CloudTrail logs".
- **Source identity** is the one AWS recommends for audit: it "cannot be changed during the role session" and persists through role chaining. It needs `sts:SetSourceIdentity` and appears in `userIdentity.sessionContext.sourceIdentity`. The STS API reference limits it to 2–64 characters; the IAM guide says 2–256.
- Calls through the AWS MCP Server log as `eventSource: aws-mcp.amazonaws.com` with the full request parameters (INFRA-003).

**Not documented:** a distinctive user agent for Claude Code or for MCP-forwarded calls, and whether the downstream service's own event records the MCP context keys.

Neither Anthropic's docs nor the AWS MCP docs mention session names or source identity for agent sessions. AWS's agentic lens suggests a naming convention for agent roles and filtering CloudTrail by role ARN.

## [INFRA-017] Kubernetes audit logs and Claude Code's own records
- Type: fact
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-12
- Sources: [Kubernetes auditing](https://kubernetes.io/docs/tasks/debug/debug-cluster/audit/), [k3s hardening guide](https://docs.k3s.io/security/hardening-guide), [Hooks guide](https://code.claude.com/docs/en/hooks-guide), [Monitoring](https://code.claude.com/docs/en/monitoring-usage), [.claude directory](https://code.claude.com/docs/en/claude-directory)
- Related: INFRA-016, INFRA-021, HOOK-028

**Kubernetes.** The API server logs only with a policy file: "If the flag is omitted, no events are logged." Levels are `None`, `Metadata` (user, timestamp, resource, verb), `Request` and `RequestResponse`. k3s "doesn't enable auditing by default"; its hardening guide sets `audit-policy-file` and `audit-log-path`. The audit log names the identity that called, so a dedicated agent ServiceAccount is what makes agent actions findable.

**Claude Code's own records:**
- **Transcripts** (`~/.claude/projects/<project>/<session>.jsonl`) hold "every message, tool call, and tool result", but are swept after `cleanupPeriodDays` (default 30) and are plaintext.
- **A logging hook.** The hooks guide's "Log every Bash command" uses `PostToolUse` with matcher `Bash` and `jq -r '.tool_input.command' >> ~/.claude/command-log.txt`. Add a matcher for `mcp__.*` to log MCP calls too.
- **OpenTelemetry.** `claude_code.tool_result` and `tool_decision` events, with `OTEL_LOG_TOOL_DETAILS=1` for Bash commands and MCP tool names. Their `tool_use_id` "Matches the `tool_use_id` passed to hooks". OTel variables in a repo's `.claude/settings.json` are ignored.

Of these, only the cloud and cluster logs are written by something the agent can't edit. Auto mode blocks writing to transcripts (v2.1.205+), but a Bash hook log in `~/.claude` is a plain file.

## Incident debugging

## [INFRA-018] Reading logs and events with filters during an incident
- Type: pattern
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-12
- Sources: [Flux MCP tools](https://github.com/controlplaneio-fluxcd/flux-operator/blob/main/docs/mcp/tools.md), [kubernetes-mcp-server README](https://github.com/containers/kubernetes-mcp-server), [aws logs start-query](https://docs.aws.amazon.com/cli/latest/reference/logs/start-query.html), [aws logs filter-log-events](https://docs.aws.amazon.com/cli/latest/reference/logs/filter-log-events.html), [MCP](https://code.claude.com/docs/en/mcp)
- Related: INFRA-007, INFRA-019, TOK-023

Narrow by time, then by pattern, then by count, before anything reaches the context.

- **Flux MCP.** `get_kubernetes_events` with `type: Warning`, `since` and `grep`; then `get_kubernetes_logs` on the workload with `since` (the incident window), `grep` (`error|panic|fatal|exception`) and `limit`. If `truncated` comes back, narrow further rather than raising limits.
- **kubernetes-mcp-server.** `pods_log` has only `tail` (default 100) and `previous`, so it suits a single pod's last lines.
- **CloudWatch Logs.** A Logs Insights query with `filter`, `stats` and `limit` returns an aggregate rather than raw lines. `start-query` "times out after 60 minutes" and returns at most 10,000 events per `GetQueryResults` call. `filter-log-events` pages hold up to 1 MB or 10,000 events, and "A returned page might only be partially full, or even empty". Through the AWS MCP Server, run the query in `run_script` and print only the summary.
- **Fallback limits.** MCP output warns above 10,000 tokens and is cut at 25,000 (TOK-023). That is a ceiling, not a target.

Raw log output is also where secrets surface: auto mode's "Production Reads" rule treats dumping env vars or configs from a prod workload as a leak in itself (INFRA-009).

## [INFRA-019] A read-only subagent that digests logs
- Type: pattern
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-12
- Sources: [Subagents: isolate high-volume operations](https://code.claude.com/docs/en/sub-agents), [wshobson/agents](https://github.com/wshobson/agents), [VoltAgent/awesome-claude-code-subagents](https://github.com/VoltAgent/awesome-claude-code-subagents), [knowledge-work-plugins incident-response](https://github.com/anthropics/knowledge-work-plugins)
- Related: TOK-035, ORCH-034, INFRA-018, REPO-031

The docs name this use: "Running tests, fetching documentation, or processing log files can consume significant context. By delegating these to a subagent, the verbose output stays in the subagent's context while only the relevant summary returns". Keep the digester read-only by listing tools explicitly. `tools: Read, Grep, Glob, Bash` "can't… use any MCP tools", so name the read tools you want:

```markdown
---
name: log-digest
description: Reads cluster and AWS logs for an incident window and returns a short timeline. Read-only.
tools: Read, Grep, mcp__flux__get_kubernetes_events, mcp__flux__get_kubernetes_logs, mcp__flux__get_kubernetes_resources, mcp__aws__aws___run_script
model: sonnet
---
Return at most 30 lines: first error with timestamp, error signatures with counts, affected workloads, and the evidence lines. Never print secrets or env dumps.
```

`run_script` can write if the profile can (INFRA-003), so a read-only AWS identity or an IAM deny on `aws:ViaAWSMCPService` is what makes this agent read-only on AWS.

Community SRE agents are broader. In `wshobson/agents` (40,471 stars), `devops-troubleshooter` and `error-detective` use `model: sonnet` with no `tools` line, so they inherit everything. VoltAgent's `devops-incident-responder` and `sre-engineer` (25,667 stars) ship with Write and Edit. Anthropic's `incident-response` skill (knowledge-work-plugins) covers triage, communication and postmortems, not log reading.

## Credentials

## [INFRA-020] AWS credentials: profiles, short-lived sessions and Claude Code's AWS settings
- Type: fact
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-12
- Sources: [IAM best practices](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html), [Amazon Bedrock](https://code.claude.com/docs/en/amazon-bedrock), [Settings reference](https://code.claude.com/docs/en/settings-reference), [AWS CLI: IAM roles](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-role.html), [AssumeRole API](https://docs.aws.amazon.com/STS/latest/APIReference/API_AssumeRole.html), [mcp-proxy-for-aws README](https://github.com/aws/mcp-proxy-for-aws)
- Related: INFRA-001, INFRA-011, INFRA-021

**AWS's order of preference:** "Require workloads to use temporary credentials with IAM roles"; for people, federation through IAM Identity Center; "relying on temporary credentials instead of creating long-term credentials such as access keys". Long-term IAM user keys are for workloads that can't use roles. The root user should have no access keys.

**Short-lived options for a local agent:**
- An IAM Identity Center permission set (`aws sso login`).
- A role profile (`role_arn`, `source_profile`, `role_session_name`) whose sessions last 900–43,200 seconds (default 3,600; one hour when chained). Session policies can narrow a session further; the result is "the intersection".
- The AWS MCP proxy's `--profile` (or `AWS_MCP_PROXY_PROFILES`) limits which profiles the server can use: "The agent cannot discover or use other profiles in ~/.aws/config".

**Claude Code's AWS settings are for Bedrock, not for tools.** `awsAuthRefresh` (for example `aws sso login`) runs when model credentials expire. `awsCredentialExport` returns credentials that it "scopes… to its own Bedrock client, so the shell commands Claude runs still see your ambient credentials". Neither changes what Bash or MCP servers can use.

**A conflict between two pages.** The Bedrock page suggests settings files for "environment variables like `AWS_PROFILE` that you don't want to leak to other processes". The settings reference says `env` values "reach every subprocess Claude Code starts". The second describes the mechanism: setting `AWS_PROFILE` in `env` is a way to give Bash a default profile, not to hide one.

## [INFRA-021] How credentials leak into transcripts, environments and telemetry
- Type: fact
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-12
- Sources: [.claude directory](https://code.claude.com/docs/en/claude-directory), [Env vars](https://code.claude.com/docs/en/env-vars), [Monitoring](https://code.claude.com/docs/en/monitoring-usage), [Settings reference](https://code.claude.com/docs/en/settings-reference), [Permission modes](https://code.claude.com/docs/en/permission-modes)
- Related: REPO-036, INFRA-011, INFRA-009, INFRA-017

**Transcripts.** "Transcripts and history are not encrypted at rest… If a tool reads a `.env` file or a command prints a credential, that value is written to `projects/<project>/<session>.jsonl`." Tool results are also sent to the model as context. `cat ~/.aws/credentials`, `aws configure export-credentials`, `env` or `kubectl config view --raw` all land there. Redaction applies to `/feedback` bundles and shared transcripts, not the local files. Mitigations: lower `cleanupPeriodDays` (default 30, minimum 1), and `CLAUDE_CODE_SKIP_PROMPT_HISTORY` or `--no-session-persistence` for scripted runs.

**Environment.** Settings `env` values are "plain text in the settings file and reach every subprocess". `CLAUDE_CODE_SUBPROCESS_ENV_SCRUB=1` strips credentials from Bash, hooks and stdio MCP servers by variable name or value (`AWS_SECRET_ACCESS_KEY`, `*_TOKEN`, `DATABASE_URL` with a password). It leaves `GITHUB_TOKEN`, `GH_TOKEN` and proxy settings, and it doesn't touch credential files on disk.

**Telemetry.** All off by default: `OTEL_LOG_TOOL_DETAILS` exports Bash commands, `OTEL_LOG_TOOL_CONTENT` exports tool output (truncated at 60 KB), and `OTEL_LOG_RAW_API_BODIES` exports whole conversations. With them on, a printed key reaches the collector.

**What stops it.** Auto mode's "Credential Materialization" rule blocks printing a live credential ("Partial output (`| cut`, `| head`…) still counts") but allows piping one straight into the consuming command. Sandbox `deny` or `mask` (INFRA-011) keeps the value out of reach. Only a credential the agent can't read can't leak.

## Incidents

## [INFRA-022] Published incidents: agents that destroyed infrastructure or data
- Type: fact
- Applies to: general
- Confidence: community-consensus
- Last verified: 2026-10-12
- Sources: [Grigorev: How I dropped our production database](https://aishippingblog.com/p/how-i-dropped-our-production-database), [Amazon: AI coding bot didn't take down AWS](https://www.aboutamazon.com/news/aws/aws-service-outage-ai-bot-kiro), [The Register: Replit and SaaStr](https://www.theregister.com/2025/07/21/replit_saastr_vibe_coding_incident/), [eWeek: Replit](https://www.eweek.com/news/replit-ai-coding-assistant-failure/), [The Register: PocketOS](https://www.theregister.com/software/2026/04/27/cursor-opus-agent-snuffs-out-startups-production-database/5224442), [AWS-2025-015](https://aws.amazon.com/security/security-bulletins/AWS-2025-015/), [claude-code#10077](https://github.com/anthropics/claude-code/issues/10077)
- Related: INFRA-023, REPO-037

In every well-sourced case, the agent held a credential or permission wider than its task. None needed a jailbreak.

| When | Agent | What happened | Stated cause |
|---|---|---|---|
| 2025-07 | Replit Agent | Deleted a production database during a code freeze | One database for dev and prod; the freeze was only in the prompt |
| 2025-07 | Amazon Q extension 1.84.0 | A poisoned release told it to wipe files and AWS resources; a syntax error stopped it (CVE-2025-8217) | An "inappropriately scoped" CI token; the payload used the user's credentials |
| 2025-10, 2025-12 | Claude Code | `rm -rf` reached home directories (#10077, WSL; a macOS report) | Unconfirmed |
| 2025-12 | Amazon Kiro | Recreated an environment; 13-hour Cost Explorer interruption in one region (FT, via press) | Amazon: "misconfigured access controls"; added "mandatory peer review for production access" |
| 2026-02-26 | Claude Code | With an old Terraform state, `terraform destroy` removed a VPC, RDS and its snapshots; AWS restored it a day later | Local state; snapshots in the same Terraform; the user let it run |
| 2026-04-24 | Cursor, Claude Opus 4.6 | One API call deleted a production volume and its backups on Railway | A full-rights token found in an unrelated file; backups on the same volume |

The Replit, PocketOS and Kiro rows rest partly on press reports.

## [INFRA-023] Which guardrail would have stopped each incident
- Type: recommendation
- Applies to: general
- Confidence: community-consensus
- Last verified: 2026-10-12
- Sources: [Grigorev: How I dropped our production database](https://aishippingblog.com/p/how-i-dropped-our-production-database), [Anthropic: how we built auto mode](https://www.anthropic.com/engineering/claude-code-auto-mode), [Permission modes](https://code.claude.com/docs/en/permission-modes), [Mitiga: poisoned coding test](https://www.mitiga.io/blog/poisoned-coding-test-ai-agent-attack)
- Related: INFRA-022, INFRA-001, INFRA-009, INFRA-013

Mapping INFRA-022 to controls, most-recurring first:

| Guardrail | Would have stopped |
|---|---|
| Read-only or plan-only identity for the agent | Terraform destroy, Kiro, PocketOS, Replit |
| No production credentials in the agent's environment or working tree | PocketOS, Replit, the Amazon Q payload |
| Plan and apply split, with a human running apply and destroy (INFRA-013) | Terraform destroy, Kiro |
| Deletion protection and backups outside the agent's reach | Terraform destroy, PocketOS |
| Remote, versioned state; dev and prod separated | Terraform destroy, Replit |
| Deny rules or hooks on destructive commands (INFRA-012) | `rm -rf ~`, Terraform destroy, the Amazon Q payload |
| Sandbox or container with a scoped filesystem | `rm -rf ~` |
| Auto mode classifier (INFRA-009) | Terraform destroy (Blind Apply), PocketOS (deleting a stateful resource not created this session) |

**Prompt instructions didn't work.** Replit's "code freeze" and PocketOS's rule against destructive commands were both ignored. The DataTalks.Club author now works this way: "All permissions are disabled. No automatic execution. No file writes."

**The classifier is a layer, not the control.** Anthropic measured a 17% false-negative rate on real overeager actions and calls it "the honest number". Its internal incident log includes "attempting migrations against a production database".

**For credential theft** (Mitiga's single-source report of a poisoned repo that made an agent read `~/.aws/credentials`): no long-lived keys on the workstation.

## Our setup

## [INFRA-024] Our setup: AWS, Kubernetes and MCP access as of 2026-10-12
- Type: fact
- Applies to: Claude Code
- Confidence: single-source
- Last verified: 2026-10-13
- Sources: [AWS MCP Server IAM](https://docs.aws.amazon.com/agent-toolkit/latest/userguide/security_iam_service-with-iam.html), [IAM best practices](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html), [CloudTrail event history](https://docs.aws.amazon.com/awscloudtrail/latest/userguide/view-cloudtrail-events.html), [FreekMencke/claude-kb#69](https://github.com/FreekMencke/claude-kb/issues/69)
- Related: INFRA-003, INFRA-004, INFRA-005, INFRA-006, INFRA-010, INFRA-016, INFRA-025, WEB-013

Read from local config and read-only AWS and cluster calls; names left out on purpose. Updated through #75 (2026-10-13); CHANGELOG.md has earlier states.

**AWS:**

**Kubernetes:**
- Both MCP servers and `kubectl` use `~/.kube/config`: a `claude-agent` ServiceAccount token bound to `view` (which includes Flux through `flux-view`), plus nodes, PVs, StorageClasses, CRDs, `traefik.io` and `/metrics`. No Secrets, exec, port-forward or `nodes/proxy`.
- Loki since 2026-10-13 (FreekMencke/home-cluster#5): `get` on `services/proxy` for `resourceNames: ['loki-gateway:80']`, so `kubectl get --raw` runs Loki's GET queries; push and delete (POST) stay forbidden. Tested in INFRA-025.
- Both servers are read-only and pinned. The kubernetes server has no `helm` toolset, because `helm_list` reads Secrets.
- GA4: `analytics-mcp@0.7.0` since 2026-10-13 (WEB-006).


## [INFRA-025] `kubectl auth can-i` reads `resource/x` as a resource name, not a subresource
- Type: anti-pattern
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-13
- Sources: [kubectl auth can-i reference](https://kubernetes.io/docs/reference/kubectl/generated/kubectl_auth/kubectl_auth_can-i/), [Using RBAC Authorization](https://kubernetes.io/docs/reference/access-authn-authz/rbac/), [FreekMencke/claude-kb#69](https://github.com/FreekMencke/claude-kb/issues/69)
- Related: INFRA-006, INFRA-024

RBAC rules write a subresource with a slash (`pods/log`, `services/proxy`), but `kubectl auth can-i` reads the same slash as TYPE/NAME. So `can-i get services/proxy` asks about a service named `proxy`, and with `view` it answers `yes` while the real proxy request is forbidden. Check subresources with `--subresource`.

The two pages side by side:
- RBAC: "use a slash (`/`) to delimit the resource and subresource", as in `resources: ["pods", "pods/log"]`.
- `can-i`: "Check to see if I can get the job named "bar" in namespace "foo"": `kubectl auth can-i list jobs.batch/bar -n foo`. Its subresource example is `kubectl auth can-i get pods --subresource=log`.

```bash
kubectl auth can-i get services --subresource=proxy -n grafana-loki   # the real check
kubectl auth can-i create pods --subresource=exec -n grafana-loki
```

Tested 2026-10-13, kubectl v1.36.5, desktop Code tab (WSL), as the `view`-bound `claude-agent` ServiceAccount: `can-i get services/proxy` and `can-i get services/no-such-name` both gave `yes`; `can-i get services --subresource=proxy` gave `no`, matching the `Forbidden` on the real request. An agent verifying its own permissions should confirm a `can-i` answer with one real read-only request where it matters.

The reverse trap, once a grant is limited by `resourceNames`: the unnamed `--subresource` check asks about every service and says `no`. Name the resource when you know it.

Tested 2026-10-13, v2.1.296, kubectl v1.36.5, desktop Code tab (WSL), as `claude-agent` after the Loki Role (INFRA-024): `can-i get services/loki-gateway:80 --subresource=proxy -n grafana-loki` gave `yes`; `can-i create` on the same, `can-i get services/loki --subresource=proxy` and the unnamed `can-i get services --subresource=proxy` gave `no`. The real requests matched: `/loki/api/v1/labels` returned `"status":"success"`, and a 7-day `count_over_time` over `{namespace="osrs-tracker"} |= "Googlebot"` returned in about 1 s (`execTime` 0.14 s). Per the home-cluster session, the bare name and the port name `http` weren't needed in `resourceNames`.

## Recommendations for our setup

Ranked by impact against effort. All are changes to local config or the AWS console, not to a repo, so none needs a cross-repo issue. Applying them is up to the user; this session changed nothing.

| # | Change | Impact | Effort | Entries |
|---|---|---|---|---|
| 1 | Done 2026-10-12 (FreekMencke/claude-kb#44), without `AWS_PROFILE`: a failing call is the clearer signal. Delete the root user's access keys and the `default` profile, so an `aws` call without `--profile` fails instead of running as root. Optionally set `"env": {"AWS_PROFILE": "claude"}` in `~/.claude/settings.json` so Bash defaults to the agent profile. | High | Low | INFRA-024, INFRA-020, INFRA-001 |
| 3 | Done 2026-10-12 (FreekMencke/claude-kb#46): `kubernetes-mcp-server@0.0.67` and `mcp-proxy-for-aws-cli@1.7.0`, the latest releases that day. Pin `kubernetes-mcp-server` and `mcp-proxy-for-aws-cli` to tested versions instead of `@latest`, and recheck the TOML keys when upgrading (the flag-to-TOML change). | Medium | Low | INFRA-004 |
| 7 | Done 2026-10-12 (FreekMencke/claude-kb#46): four entries after `"$defaults"`, with every namespace on the home cluster as a sensitive target, since there is no staging cluster. Add `autoMode.environment` entries that name the production namespace, the site buckets, the Lambda functions and the AWS account as protected (keep `"$defaults"`). | Medium | Low | INFRA-010 |
| 8 | Done 2026-10-12 (FreekMencke/claude-kb#46), without the `default`-profile rule: #44 deleted that profile, so the rule would match nothing. Add deny rules as a backstop: `Read(~/.aws/credentials)`, `Bash(kubectl * delete *)`, `Bash(kubectl delete *)`, `Bash(helm * uninstall *)`, `Bash(aws * --profile default *)`. | Low | Low | INFRA-008 |
| 10 | Later: move the agent from a long-term IAM user key to short-lived credentials (an Identity Center permission set, or a role with a session name). | Medium | High | INFRA-020, INFRA-001 |

Not recommended now: running cloud work in a dev container (INFRA-002). The credential is what decides cloud damage, and items 1, 2 and 4 address it directly.

## Open questions

- **Leaked keys in our transcripts.** Resolved 2026-10-12: the user's check found two distinct `ASIA` strings (temporary keys, which expire within 36 hours) in three research-subagent transcripts that had read AWS docs, and no `AKIA` key. Nothing needed rotating.
- **`run_script` under `--read-only`.** Does the AWS proxy's read-only flag keep or hide `aws___run_script`? Not documented; list the tools with the flag to check.
- **Agent key age.** The IAM user's key age and last rotation couldn't be read with the agent's own identity.
- **Cluster RBAC as code.** Whether the cluster's RBAC lives in a GitOps repo wasn't checked (a scan of the user's repos was blocked by auto mode). If it does, recommendation 2 becomes an issue in that repo.
- **Sandbox with kubectl and the AWS CLI.** Whether both honor the sandbox proxy, and whether `mask` works with SSO token caches and kubeconfig exec plugins, is undocumented and untested.
- **CloudTrail attribution.** Is there a distinctive user agent for Claude Code or for MCP-forwarded calls, and does the downstream event record `aws:CalledViaAWSMCP`?
- **Source identity length.** The STS API reference says 64 characters; the IAM user guide says 256.
- **Classifier error rates.** The 17% false-negative figure is from the March 2026 post (n=52, Sonnet 4.6 classifier). No newer figure for the Sonnet 5 classifier has been published.
- **Hooks in bypass mode.** Answered in HOOK-006: the hooks reference says a `PreToolUse` `"deny"` blocks "even in `bypassPermissions` mode or with `--dangerously-skip-permissions`", because the hook fires before any permission-mode check.

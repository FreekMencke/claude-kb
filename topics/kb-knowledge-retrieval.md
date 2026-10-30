# Giving agents knowledge: retrieval, RAG, long context and curated knowledge bases (RETR)

Prefix `RETR`. How to get facts an agent needs into its context: keyword search, embeddings and hybrid search, reranking, an index in context, the whole corpus in context, GraphRAG. Covers what Anthropic recommends and builds, what comparable tools chose, the published evidence, and a measurement of each option on this knowledge base. Out of scope, linked instead: how docs and KB servers shape their tools (MCP-034), the server's own design (MCP-041, MCP-039), memory servers (MEM-033), code-index MCP servers (TOK-084), writing docs that agents retrieve (DOC-016).

Research basis:
- Researched 2026-10-20 in a cloud session (Claude Code 2.1.304) by an Opus 5.5 lead with three Sonnet 5.5 readers: Anthropic's docs, blog and cookbooks; papers and benchmarks; other tools and community projects.
- Read as raw text: code.claude.com and platform.claude.com `.md` pages, anthropic.com posts and support.claude.com articles as stripped HTML, GitHub files from `raw.githubusercontent.com`.
- This session's network allowed GitHub, npm and Anthropic's sites only. arxiv.org, cursor.com, cline.bot, x.com, huggingface.co and most vendor pages were blocked for both curl and WebFetch. Claims from those sources come from search-result text only and are marked unverified.
- Measured on this knowledge base at commit `c1ffe45` (990 entries): RETR-009 to RETR-012.
- Added 2026-10-30 from a session on keeping the knowledge base true and used (FreekMencke/claude-kb#340), with arxiv.org and the other sources read directly: RETR-021 to RETR-032.

## Quick answers

| Question | Answer | Entries |
|---|---|---|
| Should this knowledge base move to RAG or vector search? | Not on current evidence. With Haiku writing the queries, our BM25 search put a cited entry in the top 5 for 97–100% of 300 synthetic questions (all cited entries: 72–79%). The test shows no gap for embeddings to close, but it is at its ceiling and has no real queries. | RETR-010, RETR-011, RETR-020 |
| What is a knowledge base like this one actually for? | A compiled layer of verified, dated, sourced facts that override stale training data. The value is made when entries are written and re-verified, not when they're retrieved. | RETR-001, RETR-018 |
| Does Anthropic recommend RAG or agentic search for agents? | Agentic search first: "only adding semantic search if you need faster results or more variations". Claude Code uses glob and grep just-in-time, "bypassing the issues of stale indexing". | RETR-002, RETR-003 |
| Can the whole knowledge base go in the prompt instead? | Not for long. Without Quick answers it measured about 934k tokens on Haiku 5.5, 93% of a 1M window; about 70 more entries fill it. Each lookup would cost about $0.05 warm and $0.94 cold, against $0.002 for a search. | RETR-009, RETR-008 |
| When is keyword search weak, and what fixes it? | Questions worded away from the entry's terms: BM25 on the raw question fell from 90% to 73% top-5. Letting Haiku write two to five keywords brought it back to 93%, and the full search-and-read loop to 99%. | RETR-011, RETR-010 |
| Is there a size below which no search is needed? | Anthropic (2024): under 200,000 tokens, put it all in the prompt. Karpathy (2026): an index file works at "~100 sources, ~hundreds of pages". We're past both. | RETR-004, RETR-014 |
| Does the lookup admit when the knowledge base has no answer? | For absent technologies, yes: 20 of 20 came back "not answered" with no IDs. Near-but-wrong entries weren't tested. The server's empty-search counter can't detect misses, because OR matching nearly always returns hits. | RETR-012 |
| When do claude.ai Projects use RAG? | Automatically, on paid plans, when project knowledge nears the context limit, "by up to 10x" capacity; they switch back when it shrinks. The threshold and the method aren't published. | RETR-006 |
| What retrieval does the Claude API give you? | Search-result blocks and citations for your own retrieval, and tool search with regex and BM25 variants. No hosted vector store; Managed Agents memory stores are directories read with file tools. | RETR-007 |
| Would GraphRAG help? | Not for lookups. It targets "global sensemaking questions" over a whole corpus, indexing is "an expensive operation", and GraphRAG-Bench notes it "frequently underperforms vanilla RAG". | RETR-015 |
| What do Cursor, Cline, Codex and Copilot do? | Split: Cursor, Copilot, Windsurf and Augment use embedding indexes; Cline and Codex search with tools (Codex: "prefer using `rg`"); Sourcegraph dropped embeddings for Enterprise Cody. Mostly unverified (pages blocked). | RETR-013 |
| How should we evaluate retrieval for a knowledge base? | Not on questions written from the entries (vocabulary-matched). Add reworded and uncovered questions, score recall@5 and MRR per arm, and judge retrieval and the end answer separately. | RETR-019 |
| Does the knowledge base improve answers, and is it used? | On post-training and local questions, yes: 100% against 47.5% with no web and 75% with web, 20 cases, one run each, at lower cost than web search ($2.65 against $3.80). The criteria come from the entries, so 100% isn't accuracy: by hand, 2 of 40 answers said the opposite of the entry. Used in 48 of 320 sessions over 14 days, and 12 of 52 relevant ones. | RETR-030, RETR-031, RETR-025 |
| What should be re-verified first? | What real sessions read, then the rest on a floor: reading isn't reviewing for an agent, so demand sets the order, not the scope. A hash check of 2,847 sources takes 2 minutes and no model calls. | RETR-021, RETR-026, RETR-025 |
| Do tags or generated queries help search? | Tags barely: weight 0 moves top 5 by at most 2 points and top 1 by 3. Filtered document expansion waits until real queries show vocabulary misses; of 4 real misses, 2 were newer entries outranking older ones. | RETR-029, RETR-028 |

## Index

| ID | Title | Type | Tags |
|---|---|---|---|
| RETR-001 | A knowledge base for agents is a compiled layer, not a search problem | pattern | essence, curation, compiled-knowledge |
| RETR-002 | Anthropic: start with agentic search, add semantic search only if needed | recommendation | agentic-search, rag, claude-code, context-engineering |
| RETR-003 | Claude Code dropped RAG and a local vector database | fact | claude-code, rag, history |
| RETR-004 | Contextual Retrieval: what it measured and what it means for curated entries | fact | contextual-retrieval, embeddings, bm25, reranking |
| RETR-005 | The contextual embeddings cookbook: Pass@k on 248 code queries | fact | cookbook, evaluation, pass-at-k |
| RETR-006 | claude.ai Projects switch to RAG near the context limit | fact | projects, claude-ai, rag-mode |
| RETR-007 | Retrieval building blocks in the Claude API | fact | api, search-results, citations, tool-search |
| RETR-008 | Context rot: more context lowers recall | fact | context-rot, long-context, nolima |
| RETR-009 | This knowledge base no longer fits in the prompt | fact | long-context, tokens, cost, measurement |
| RETR-010 | Seven retrieval options measured on this knowledge base | comparison | measurement, bm25, rerank, index-in-context |
| RETR-011 | Keyword search fails on reworded questions; let the model write the keywords | pattern | bm25, query-rewriting, vocabulary-mismatch |
| RETR-012 | The lookup says "no entry" for uncovered questions | fact | abstention, negatives, metrics |
| RETR-013 | How AI coding tools retrieve context | comparison | cursor, cline, codex, copilot, sourcegraph, augment |
| RETR-014 | Karpathy's LLM Wiki: an index file until hundreds of pages | pattern | llm-wiki, index-file, qmd, community |
| RETR-015 | GraphRAG answers global questions, not lookups | fact | graphrag, lightrag, knowledge-graph |
| RETR-016 | Hybrid search in a small Node server | tool | sqlite-vec, orama, voyage, rrf |
| RETR-017 | Published evidence on lexical, dense and long-context retrieval | comparison | beir, browsecomp-plus, self-route, lara |
| RETR-018 | Where knowledge-base lookups fail, in order | recommendation | failure-modes, triggering, staleness |
| RETR-019 | Evaluating retrieval for a knowledge base | recommendation | evaluation, recall, mrr, negatives |
| RETR-020 | Adding vector RAG before an eval shows misses | anti-pattern | rag, embeddings, premature |
| RETR-021 | Demand-driven review: a priority, not the only trigger | recommendation | review, kcs, reuse, priority, re-verification |
| RETR-022 | Freshness dates, owners and doc bugs | pattern | freshness, owners, doc-bugs, last-verified |
| RETR-023 | OpenAI's doc-gardening agent: one sentence of evidence | pattern | doc-gardening, openai, agents, stale-docs |
| RETR-024 | Karpathy's LLM wiki lint list against our checks | comparison | lint, wiki, karpathy, contradictions, orphans |
| RETR-025 | Real use of this knowledge base, 2026-10-15 to 2026-10-28 | fact | real-use, transcripts, kb-usage, real-queries |
| RETR-026 | Hash-checking every source: what two runs show | fact | source-hash, check-sources, churn, re-verification |
| RETR-027 | Looking up every quote in its source | fact | quote-check, check-sources, near-match, last-verified |
| RETR-028 | Filtered document expansion: hold until real queries miss | recommendation | doc2query, document-expansion, bm25, premature |
| RETR-029 | Tag weight barely moves search | fact | tags, bm25, weights, retrieval-eval |
| RETR-030 | Does the knowledge base improve answers? 20 cases, with and without | fact | answer-eval, plugin-eval, ablation, llm-grader |
| RETR-031 | What the graders missed: misreads and an entry error | fact | misread, forked-haiku, answer-eval, lookup-skill |
| RETR-032 | Guru's verification from use: signals agents don't send | comparison | verification, guru, usage-signals, feedback |

## [RETR-001] A knowledge base for agents is a compiled layer, not a search problem
- Type: pattern
- Applies to: general
- Confidence: single-source
- Last verified: 2026-10-20
- Sources: [Karpathy: LLM Wiki](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f), [Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents), [Models overview](https://platform.claude.com/docs/en/about-claude/models/overview)
- Related: RETR-014, RETR-018, JSUP-015, MEM-033

What this knowledge base does: an agent about to make a decision gets a few facts that are newer or more exact than its training, each with a source, a date and a confidence. That job splits in two:

- **Write time:** research from primary sources, quote checks, one idea per entry, IDs, cross-links, re-verification. This is where the cost and the value are.
- **Read time:** find 1 to 4 entries out of about 1,000. Finding one right entry measured as easy; finding all of them for a multi-part question less so (RETR-010).

Karpathy's LLM Wiki names the same split: "The knowledge is compiled once and then kept current, not re-derived on every query." Classic RAG does the opposite, re-deriving answers from raw chunks on every query. Its machinery (chunking, contextualizing chunks, embeddings, reranking: RETR-004) repairs chunks that lost their context. A curated entry has a title, tags and a self-contained summary, so it starts where that repair ends.

So the questions that matter are about write time and invocation (RETR-018). The retrieval method is a small, measurable choice (RETR-010).

*Inference from the sources and RETR-010, not a quoted claim.*

## [RETR-002] Anthropic: start with agentic search, add semantic search only if needed
- Type: recommendation
- Applies to: Claude Code, Claude API
- Confidence: official-docs
- Last verified: 2026-10-20
- Sources: [Building agents with the Claude Agent SDK](https://www.anthropic.com/engineering/building-agents-with-the-claude-agent-sdk), [Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents), [Large codebases](https://code.claude.com/docs/en/large-codebases), [How we built our multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system)
- Related: RETR-003, RETR-011, MCP-034, TOK-041

Anthropic's engineering posts recommend letting the agent search with tools first, and adding embeddings only for speed or variety.

- **Agent SDK post (2025-09-29):** "Semantic search is usually faster than agentic search, but less accurate, more difficult to maintain, and less transparent." Also: "we suggest starting with agentic search, and only adding semantic search if you need faster results or more variations."
- **Context engineering (2025-09-29):** "Claude Code is an agent that employs this hybrid model: CLAUDE.md files are naively dropped into context up front, while primitives like glob and grep allow it to navigate its environment and retrieve files just-in-time, effectively bypassing the issues of stale indexing and complex syntax trees." 
- **Large codebases page:** "if your organization already runs a code search or RAG index over the repository, expose it as an MCP tool so Claude queries it instead of reading files directly". RAG is an add-on behind a tool, not built in.
- **Multi-agent research (2025-06-13):** contrasts RAG's "static retrieval" with "a multi-step search that dynamically finds relevant information".

**Context:** the SDK advice comes from an email-agent example where agentic search means grep over files. The same context-engineering post describes teams "augmenting these retrieval systems with “just in time” context strategies", and says "The hybrid strategy might be better suited for contexts with less dynamic content, such as legal or finance work". There, hybrid means up-front plus just-in-time, not lexical plus semantic. A curated knowledge base is low-churn content. Our server already does both: Quick answers up front, then search and fetch by ID (MCP-034).

## [RETR-003] Claude Code dropped RAG and a local vector database
- Type: fact
- Applies to: Claude Code
- Confidence: unverified
- Last verified: 2026-10-20
- Sources: [Boris Cherny on X](https://x.com/bcherny/status/2017824286489383315), [Hacker News comment](https://news.ycombinator.com/item?id=43164253)
- Related: RETR-002, RETR-013

Claude Code's creator has said that early versions used RAG with a local vector database, and that agentic search replaced it.

The wording below comes from search-result text only: x.com and news.ycombinator.com were blocked in this session.
- **X post, about 2026-02-01:** "Early versions of Claude Code used RAG + a local vector db, but we found pretty quickly that agentic search generally works better. It is also simpler and doesn't have the same issues around security, privacy, staleness, and reliability."
- **Hacker News comment, 2025-02-24:** begins "Right -- Claude Code doesn't use RAG currently. In our testing we found that age…" (cut off in the snippet).

Secondary write-ups attribute "It outperformed everything. By a lot." to a 2025 podcast. That quote wasn't traced to a transcript.

What the official docs do say is in RETR-002. A grep of `code.claude.com/docs/llms-full.txt` for "agentic search", "semantic search", "vector", "embedding" and "RAG" on 2026-10-20 found no docs page stating why Claude Code has no index.

Re-check the quotes from a network that reaches x.com before relying on the wording.

## [RETR-004] Contextual Retrieval: what it measured and what it means for curated entries
- Type: fact
- Applies to: Claude API
- Confidence: official-docs
- Last verified: 2026-10-20
- Sources: [Introducing Contextual Retrieval](https://www.anthropic.com/news/contextual-retrieval)
- Related: RETR-005, RETR-001, MCP-034, RETR-016

Anthropic's post of 2024-09-19 measured retrieval of chunks cut from long documents ("codebases, fiction, ArXiv papers, Science Papers"). Its metric was "1 minus recall@20".

| Method | Top-20 failure rate |
|---|---|
| Embeddings + BM25 baseline | 5.7% |
| Contextual Embeddings | 3.7% ("reduced … by 35%") |
| + Contextual BM25 | 2.9% ("by 49%") |
| + reranking (Cohere) | 1.9% ("by 67%") |

- **Setup:** "the top-performing embedding configuration (Gemini Text 004)"; "We found Gemini and Voyage embeddings to be particularly effective". Delivering 20 chunks beat 10 and 5.
- **Cost:** "the one-time cost to generate contextualized chunks is $1.02 per million document tokens", with prompt caching.
- **BM25:** "particularly effective for queries that include unique identifiers or technical terms".
- **Small corpora:** "If your knowledge base is smaller than 200,000 tokens (about 500 pages of material), you can just include the entire knowledge base in the prompt".

**For a curated knowledge base:** the method prepends "50-100 tokens" of context to each chunk so that a chunk can be found on its own. Our entries already carry a title, tags and a self-contained summary. The headroom it closes is also small: 5.7% to 1.9% at top 20.

## [RETR-005] The contextual embeddings cookbook: Pass@k on 248 code queries
- Type: fact
- Applies to: Claude API
- Confidence: official-example
- Last verified: 2026-10-20
- Sources: [Contextual embeddings guide](https://github.com/anthropics/claude-cookbooks/blob/main/capabilities/contextual-embeddings/guide.ipynb), [RAG guide](https://github.com/anthropics/claude-cookbooks/blob/main/capabilities/retrieval_augmented_generation/guide.ipynb)
- Related: RETR-004, RETR-019, CAPI-015

The contextual embeddings cookbook reruns RETR-004 on "a pre-chunked dataset of 9 codebases" and "248 queries" with one golden chunk each. It uses `voyage-2`, Elasticsearch BM25 and Cohere `rerank-english-v3.0`. Its summary table:

| Approach | Pass@5 | Pass@10 | Pass@20 |
|---|---|---|---|
| Baseline RAG | 80.92% | 87.15% | 90.06% |
| + Contextual embeddings | 88.12% | 92.34% | 94.29% |
| + Hybrid (BM25) | 86.43% | 93.21% | 94.99% |
| + Reranking | 92.15% | 95.26% | 97.45% |

- **Hybrid barely helps here:** it is below contextual embeddings at Pass@5, unlike the blog post. The notebook's own hybrid output cell shows other figures (88.86%, 92.31%, 95.23%) than its summary table.
- **Reranking cost:** it "Adds 100-200ms query latency and per-query API costs (~$0.002 per query)".

The RAG guide uses Claude's docs as its corpus and "an evaluation dataset consisting of 100 samples". It scores retrieval (precision, recall, MRR) and the final answer (an LLM judge) separately. Summary indexing plus reranking with Claude took MRR from 0.74 to 0.87 and end-to-end accuracy from 71% to 81%.

Read the notebook's numbers as one dataset, not as Anthropic's headline.

## [RETR-006] claude.ai Projects switch to RAG near the context limit
- Type: fact
- Applies to: claude.ai
- Confidence: official-docs
- Last verified: 2026-10-20
- Sources: [RAG for projects](https://support.claude.com/en/articles/11473015-retrieval-augmented-generation-rag-for-projects), [What are projects?](https://support.claude.com/en/articles/9517075-what-are-projects)
- Related: MCP-037, MEM-029, RETR-009

A Project keeps its knowledge in context until it nears the window, then switches to retrieval on its own.

- "When your project knowledge approaches the context window limit, Claude will automatically enable RAG mode to expand your project's capacity by up to 10x while maintaining quality responses."
- In RAG mode, "Claude uses a project knowledge search tool to retrieve relevant information from your uploaded documents".
- "If your project knowledge later drops below the context window threshold, Claude can automatically convert back to context-based processing."
- Availability: "Pro, Max, Team, and Enterprise". Users can't choose the mode.
- "When possible, projects will use in-context processing for optimal performance."
- Advice: well-named files help Claude "understand and retrieve the right information".

Not published: the threshold in tokens, and whether the search is keyword or embedding based.

Anthropic's own product thus prefers full context while it fits and search beyond that. Our corpus is past that point (RETR-009).

## [RETR-007] Retrieval building blocks in the Claude API
- Type: fact
- Applies to: Claude API
- Confidence: official-docs
- Last verified: 2026-10-20
- Sources: [Search results](https://platform.claude.com/docs/en/build-with-claude/search-results), [Citations](https://platform.claude.com/docs/en/build-with-claude/citations), [Tool search tool](https://platform.claude.com/docs/en/agents-and-tools/tool-use/tool-search-tool), [Files API](https://platform.claude.com/docs/en/build-with-claude/files), [Managed Agents memory](https://platform.claude.com/docs/en/managed-agents/memory), [Embeddings](https://platform.claude.com/docs/en/build-with-claude/embeddings)
- Related: CAPI-010, TOK-020, MEM-031, RETR-016

The API gives you citation and search plumbing, but no retrieval over your own corpus. You bring the retrieval.

- **Search-result blocks:** "let Claude cite your own content the same way it cites web search results", returned from a tool or passed as top-level content. They need no beta header.
- **Citations:** documents are "chunked into sentences", and `cited_text` "does not count toward your output tokens".
- **Tool search:** two server-side variants, `tool_search_tool_regex_20251119` and `tool_search_tool_bm25_20251119`. Rationale: tool selection "degrades once you exceed 30–50 available tools". Custom search with embeddings can return `tool_reference` blocks instead.
- **Files API:** storage referenced by `file_id`. No search was found on the page.
- **Managed Agents memory stores (beta):** a store is "mounted as a directory inside the session's sandbox" and read with file tools. Memories are "capped at 100 kB (~25k tokens)", up to 10,000 per store.
- **Embeddings:** Anthropic has no embedding model; its page points to Voyage (`voyage-4`, `voyage-4-lite`, `voyage-code-4` and others).

None of the platform pages read lists a hosted vector store. Anthropic's own surfaces (tool search, Claude Code, memory stores) use lexical or file-based search.

## [RETR-008] Context rot: more context lowers recall
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-20
- Sources: [Context windows](https://platform.claude.com/docs/en/build-with-claude/context-windows), [Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents), [NoLiMa README](https://github.com/adobe-research/NoLiMa), [Context Rot repo](https://github.com/chroma-core/context-rot)
- Related: RETR-009, TOK-007, FLOW-020, PROMPT-007

Anthropic says a bigger window doesn't make stuffing it free.

- **Context windows page:** "As token count grows, accuracy and recall degrade, a phenomenon known as *context rot*."
- **Context engineering post:** "as the number of tokens in the context window increases, the model's ability to accurately recall information from that context decreases". The goal is "the smallest possible set of high-signal tokens".

**NoLiMa** (ICML 2025; README read raw) uses questions with "minimal lexical overlap" with the fact they need: "At 32K, for instance, 10 models drop below 50% of their strong short-length baselines. Even GPT-4o… experiences a reduction from an almost-perfect baseline of 99.3% to 69.7%". Claude 3.5 Sonnet scored 87.6 at base and 29.8 at 32K. It tested 2024–2025 models up to 128K; no current Claude model is in the table.

**Chroma's Context Rot report** (July 2025) studies needles with "semantic, rather than direct lexical matches". Its per-model results weren't read (site blocked).

For us, the whole corpus in context scored 98–100% top-5 on 300 questions (RETR-010), so context rot didn't show in picking entries. It may still affect answers that combine several entries, which wasn't measured.

## [RETR-009] This knowledge base no longer fits in the prompt
- Type: fact
- Applies to: Claude Code, Claude API
- Confidence: official-docs
- Last verified: 2026-10-20
- Sources: [Pricing](https://platform.claude.com/docs/en/about-claude/pricing), local measurement
- Related: RETR-008, RETR-004, TOK-007, TOK-090

Measured 2026-10-20, Claude Code 2.1.304, cloud session, `claude -p --model haiku --tools "" --system-prompt-file <file> --output-format json`, at commit `c1ffe45` (990 entries):

| Prompt | Bytes | Haiku 5.5 tokens |
|---|---|---|
| All `topics/kb-*.md`, Quick answers removed | 2,266,363 | about 934k |
| `ENTRIES.md` (ID, title, type, tags) | 115,702 | about 49k |

The token counts are `cache_creation_input_tokens` minus about 1.4k for an empty system prompt. Text, URLs and tables come to about 2.4 bytes a token, not the usual 4.

**Fit:** that is 93% of a 1M window, so about 70 more entries fill it. Growth comes in bursts: README.md gives 504 entries on 2026-10-13, `mcp-server/README.md` 580 on 2026-10-16, and git 976 at the end of 2026-10-17, then 2 to 20 a day to 1,010 on 2026-10-20.

**Cost per lookup on Haiku 5.5**, measured: $0.94 for the first call (a 1-hour cache write at "$1 / MTok" for prompts "over 100,000 tokens"), then about $0.055 per call that reads the cache. Each call took 9–16 s. The search loop cost a median $0.002 (RETR-010). At the server's traffic, 54 searches in 30 days (RETR-012), nearly every lookup would miss the cache and pay the write. In-prompt scored as well as any arm (RETR-010), so this rules it out on cost and headroom, not accuracy. On Opus 5.5 a cache read is "$0.20 / MTok", about $0.19 a lookup, before any cache write.

## [RETR-010] Seven retrieval options measured on this knowledge base
- Type: comparison
- Applies to: Claude Code
- Confidence: single-source
- Last verified: 2026-10-20
- Sources: local measurement, [evals/retrieval](https://github.com/FreekMencke/claude-kb/tree/main/evals/retrieval)
- Related: RETR-011, RETR-009, RETR-012, RETR-019, MCP-041

Tested 2026-10-20, Claude Code 2.1.304, cloud session, commit `c1ffe45` (990 entries).
- **Questions:** 100 Quick-answer rows, each reworded by Sonnet 5.5 as *natural* and *hard* (situation-only).
- **Search:** the server's own `kb-index.ts`.
- **Score:** a hit is any cited entry in the top 5; the all-cited rate is given below the table.

| Arm (Haiku 5.5) | Original | Natural | Hard |
|---|---|---|---|
| BM25 on the raw question | 90 | 90 | 73 |
| Haiku writes up to 3 keyword queries, fused by RRF | 93 | 93 | 93 |
| BM25 top 30, Haiku picks 5 | 97 | 99 | 94 |
| Haiku picks from `ENTRIES.md` in its prompt | 99 | 100 | 100 |
| Haiku with the whole corpus in its prompt | 98 | 100 | 100 |
| Haiku with `kb_search` and `kb_get`, one question per run | 97 | 100 | 99 |

- **All cited entries in the top 5:** 72, 76 and 79 for the agent; 60, 59 and 49 for raw BM25. Half the rows cite 2 to 7 entries.
- **Agent arm:** a median 2 searches, 1 `kb_get` and $0.002 a question.

**Caveats:**
- The rewordings were written with the answer and titles visible. *Hard* ones are longer (33 words against 9) and name the answer's facets, so they are harder for raw BM25 only.
- At n=100, 97 has a 95% interval of about 92–99, and a rerun moved one arm by 3 points.
- BM25's weights were tuned on Quick-answer questions.
- The `ENTRIES.md`, corpus and keyword arms asked 20 to 25 questions per call.
- Embeddings weren't tested; no embedding API was reachable.

## [RETR-011] Keyword search fails on reworded questions; let the model write the keywords
- Type: pattern
- Applies to: general
- Confidence: single-source
- Last verified: 2026-10-20
- Sources: local measurement (RETR-010), [Introducing Contextual Retrieval](https://www.anthropic.com/news/contextual-retrieval), [How we built our multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system)
- Related: RETR-010, RETR-002, RETR-017, MCP-041

BM25 matches words, so it misses an entry that describes the same thing in other words. That is the vocabulary-mismatch gap embeddings are sold to close. On our knowledge base the gap was real but small, and the calling model closed it.

| Top-5 hit rate, 100 questions | Original | Hard rewording |
|---|---|---|
| BM25 on the raw question | 90 | 73 |
| Haiku's keyword queries, fused | 93 | 93 |
| Cited entry anywhere in those queries' top 8 | — | 99 |

Example. Hard rewording: "Running a .ts script directly with Node throws a syntax or module-resolution error, though the same code compiles fine with tsc." Haiku searched `node typescript enum decorator`, then `node type stripping enums unsupported`, and found NODE-004.

**Why it works:** the model knows the field's vocabulary, so it writes the terms an entry uses. Anthropic makes the same point about BM25 and "unique identifiers or technical terms", and its research agents rewrite queries "short, broad" first.

The hard rewordings were written with the answer visible, so they are longer and more specific than real questions (RETR-010). They test vocabulary mismatch, not vague questions.

**Use:**
- Keep the search tool lexical.
- Tell the caller to search with two to five keywords and to retry with other words. The `claude-kb-lookup` skill already says this.
- Don't pass whole questions as queries: raw-question BM25 is the weakest arm.
- Entry IDs and exact flag names stay strongest in BM25.

## [RETR-012] The lookup says "no entry" for uncovered questions
- Type: fact
- Applies to: Claude Code
- Confidence: single-source
- Last verified: 2026-10-20
- Sources: local measurement, [mcp-server/README.md](https://github.com/FreekMencke/claude-kb/blob/main/mcp-server/README.md)
- Related: RETR-010, RETR-019, MCP-041

A wrong "the knowledge base says" is worse than "no entry". We tested whether search returns plausible-looking false hits.

**Setup:** tested 2026-10-20, same setup as RETR-010's agent arm. The 20 questions sit next to the knowledge base's topics but aren't covered: Svelte 5 runes, Deno 2 lifecycle scripts, PostgreSQL 18 async I/O, Redis eviction, Prisma in CI, Cypress for Angular, Gemini for code review, Helm OCI dependencies and others. A grep of ENTRIES.md for each technology found no entry. The prompt allowed an empty answer.

**Result:** Haiku returned `answered: false` with no IDs for all 20, for $0.036 in total.

**What the server's metrics can't see:** `kb_search` ORs the query's words, so almost every search returns hits. `kb_search_empty_total` read 0 over the 30 days to 2026-10-20, with 54 searches, 32 `kb_get` and 7 `kb_quick_answers` calls. The counter can't tell a good result from a miss. Only the calling model judges relevance, and nothing records its verdict.

**Limits:** 20 questions show the behaviour, not a rate. Most name a technology no entry mentions; near-but-wrong entries on covered technologies weren't tested, and neither was false abstention on covered questions. This file now names those technologies, so a rerun must leave it out of the index (`evals/retrieval/run.ts` does).

## [RETR-013] How AI coding tools retrieve context
- Type: comparison
- Applies to: general
- Confidence: unverified
- Last verified: 2026-10-20
- Sources: [Codex prompt](https://github.com/openai/codex/blob/main/codex-rs/core/gpt_5_codex_prompt.md), [Cursor: semantic search](https://cursor.com/blog/semsearch), [Cline: why we don't index](https://cline.bot/blog/why-cline-doesnt-index-your-codebase-and-why-thats-a-good-thing), [Sourcegraph Cody 5.3 FAQ](https://5.3.sourcegraph.com/cody/faq), [VS Code workspace context](https://code.visualstudio.com/docs/agents/reference/workspace-context), [Augment: real-time index](https://www.augmentcode.com/blog/a-real-time-index-for-your-codebase-secure-personal-scalable), [Context7 README](https://github.com/upstash/context7)
- Related: RETR-003, TOK-084, MCP-034

The tools split into two camps. Only the Codex and Context7 rows were read as raw text; every other row comes from search-result text, because the vendors' sites were blocked.

| Tool | Approach |
|---|---|
| Claude Code | glob and grep, no index (RETR-002, RETR-003) |
| Codex CLI | Its prompt: "prefer using `rg` or `rg --files`" |
| Cline | Doesn't index. Per the snippets, chunking "tears apart" code logic and an index "is a snapshot frozen in time" |
| Cursor | Embedding index plus grep. Its post reports semantic search raised answer accuracy by 12.5% on average (6.5% to 23.5% by model) |
| GitHub Copilot | `#codebase` semantic search over a workspace index |
| Windsurf, Augment | Embedding indexes, built by the vendor |
| Sourcegraph Cody | Removed embeddings for Enterprise in 5.3, using its own search instead |
| Context7 | MCP server open source; "API backend, parsing engine, and crawling engine — are private". Upstash's blog describes vector search plus reranking |

Both camps index code, which changes every minute and is written for compilers. A curated knowledge base changes on merge and is written for retrieval. The staleness argument for grep weighs less there; the cost argument weighs the same.

## [RETR-014] Karpathy's LLM Wiki: an index file until hundreds of pages
- Type: pattern
- Applies to: general
- Confidence: official-example
- Last verified: 2026-10-20
- Sources: [Karpathy: LLM Wiki gist](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f), [tobi/qmd README](https://github.com/tobi/qmd)
- Related: RETR-001, RETR-010, RETR-016, DOC-016

Andrej Karpathy's "LLM Wiki" gist (created 2026-04-04) describes the pattern this knowledge base follows: an LLM maintains interlinked Markdown, with a schema file (`CLAUDE.md` or `AGENTS.md`), an index and a log.

- **Retrieval by index:** "When answering a query, the LLM reads the index first to find relevant pages, then drills into them. This works surprisingly well at moderate scale (~100 sources, ~hundreds of pages) and avoids the need for embedding-based RAG infrastructure."
- **When to add search:** "at small scale the index file is enough, but as the wiki grows you want proper search."
- **Search he suggests:** qmd, which "combines BM25 full-text search, vector semantic search, and LLM re-ranking—all running locally via node-llama-cpp with GGUF models". It has a CLI and an MCP server.
- **Maintenance ("Lint"):** look for "contradictions between pages, stale claims that newer sources have superseded, orphan pages with no inbound links".

**How we compare:** at 990 entries we are past "hundreds of pages", and `ENTRIES.md` is already about 49k tokens (RETR-009). Our split matches his advice: the index stays for reading by hand and in Quick answers, and agents search. The Lint step matches our re-verification routine and `check-kb.ts`. The gist gives no measurement behind its threshold.

## [RETR-015] GraphRAG answers global questions, not lookups
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-20
- Sources: [From Local to Global (Microsoft Research)](https://www.microsoft.com/en-us/research/publication/from-local-to-global-a-graph-rag-approach-to-query-focused-summarization/), [microsoft/graphrag](https://github.com/microsoft/graphrag), [GraphRAG-Bench](https://github.com/GraphRAG-Bench/GraphRAG-Benchmark), [LightRAG](https://github.com/HKUDS/LightRAG)
- Related: RETR-001, RETR-017

GraphRAG builds an entity graph and community summaries with an LLM. It is built for questions about a whole corpus, not for finding one fact.

- **Paper abstract (2024):** "For a class of global sensemaking questions over datasets in the 1 million token range, we show that GraphRAG leads to substantial improvements over a conventional RAG baseline for both the comprehensiveness and diversity of generated answers." It was judged on comprehensiveness and diversity, not on getting single facts right.
- **Microsoft's README:** "GraphRAG indexing can be an expensive operation, please read all of the documentation to understand the process and costs involved, and start small." Global search is "a resource-intensive method"; local search suits "questions that require an understanding of specific entities".
- **GraphRAG-Bench (ICLR 2026):** "recent studies report that GraphRAG frequently underperforms vanilla RAG on many real-world tasks".
- **LightRAG:** reports win rates over GraphRAG on "high-level" questions, judged by an LLM. That is its authors' own evaluation.

Our lookups are local ("which flag", "which version"), and entries already link by hand through `Related:`. A global question ("what changed in Claude Code this month?") is better served by CHANGELOG.md and the topic files' Quick answers.

## [RETR-016] Hybrid search in a small Node server
- Type: tool
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-20
- Sources: [sqlite-vec README](https://github.com/asg017/sqlite-vec), [Orama README](https://github.com/oramasearch/orama), [Embeddings (Claude docs)](https://platform.claude.com/docs/en/build-with-claude/embeddings), [Contextual embeddings guide](https://github.com/anthropics/claude-cookbooks/blob/main/capabilities/contextual-embeddings/guide.ipynb)
- Related: RETR-020, RETR-004, RETR-007

If an eval ever shows lexical misses that the agent loop doesn't recover (RETR-019), this is the smallest step up from our FTS5 index.

- **sqlite-vec:** adds vector search to SQLite through `vec0` virtual tables. It is pure C with no dependencies, and its README warns it "is a pre-v1, so expect breaking changes!". `npm view sqlite-vec dist-tags` gave `latest: '0.1.9'` (published 2026-03-31) on 2026-10-20. At about 1,000 entries, brute-force search costs nothing.
- **Fusion:** Reciprocal Rank Fusion merges the FTS5 and vector rankings by rank alone, so their scores never need comparing. The cookbook weights it "80% weight to semantic search, 20% to BM25" over the top 150 of each.
- **Orama:** an in-process alternative with full-text, vector and hybrid search. `npm view @orama/orama dist-tags` gave `latest: '3.1.18'`.
- **Embeddings:** Anthropic's docs point to Voyage. For example, `voyage-4-lite` is "Optimized for latency and cost", with a 32,000-token context. Per search snippets (mongodb.com blocked), voyage-4-lite costs $0.02 per million tokens. Embedding our whole corpus (about 1M tokens, RETR-009) would cost about two cents.
- **Not a fit:** qmd (RETR-014) runs local GGUF models through node-llama-cpp, too heavy for our pod.

The embeddings are the easy part. The ongoing costs are an API key in the deploy, re-embedding on each sync, and a second ranking to tune and test.

## [RETR-017] Published evidence on lexical, dense and long-context retrieval
- Type: comparison
- Applies to: general
- Confidence: unverified
- Last verified: 2026-10-20
- Sources: [BEIR](https://arxiv.org/abs/2104.08663), [BrowseComp-Plus](https://arxiv.org/abs/2508.06600), [SAGE](https://arxiv.org/abs/2602.05975), [Self-Route](https://arxiv.org/abs/2407.16833), [LaRA README](https://github.com/Alibaba-NLP/LaRA)
- Related: RETR-011, RETR-008, RETR-010

arxiv.org was blocked in this session, so every figure below comes from search-result text. LaRA's sentence was read raw from its README.

- **BEIR (2021):** BM25 "is a robust baseline" zero-shot. Rerankers and late-interaction models score best "at high computational costs". The benchmark itself notes a "strong lexical bias" in its labels.
- **BrowseComp-Plus (2025):** deep-research agents on about 100K web documents. GPT-5 scored 55.9% with BM25 and 70.1% with Qwen3-Embedding-8B, with fewer searches.
- **SAGE (2026-02):** a scientific-paper corpus. "BM25 significantly outperforms LLM-based retrievers by approximately 30%, as existing agents generate keyword-oriented sub-queries".
- **Self-Route (2024):** on Gemini 1.5 Pro and GPT-4o, long context beat RAG on average, and RAG cost far less. Routing by the model's own judgment recovered most of the gap.
- **LaRA (ICML 2025), raw:** "there is no definitive conclusion regarding the superiority of RAG versus LC LLMs, as performance is influenced by multiple factors including context length, context type, the model's ability to process long contexts, and task type".

**Reading:** dense retrieval wins where queries are long descriptions, and BM25 wins where an agent writes keywords. That matches RETR-011. None of these corpora is a small curated technical knowledge base, and none of the models is a 2026 Claude.

Re-check the figures against the papers before quoting them.

## [RETR-018] Where knowledge-base lookups fail, in order
- Type: recommendation
- Applies to: Claude Code, claude.ai
- Confidence: single-source
- Last verified: 2026-10-30
- Sources: local measurement (RETR-010, RETR-012), [README: re-verification routine](https://github.com/FreekMencke/claude-kb/blob/main/README.md#re-verification-routine), [README: Changing the lookup skill](https://github.com/FreekMencke/claude-kb/blob/main/README.md#changing-the-lookup-skill)
- Related: RETR-001, RETR-019, RETR-025, RETR-030, RETR-031, MCP-038, MCP-040, SKILL-015

A lookup can fail at five points. With retrieval measured at 97–100% (RETR-010), this is where the risk sits, most likely first:

1. **Not asked.** The agent answers from memory without looking. Chat called the connector only when it was named, until the plugin bundled the skill with it (MCP-038, MCP-040). The trigger evals score 120/120 loads and 51/51 skips, but they run each plugin alone (README).
2. **Not covered.** The question falls outside the entries. The lookup then says so (RETR-012), and the caller falls back to memory or the web.
3. **Covered but stale or wrong.** The first re-verification run changed 25 entries, and 8 of those changes were wrong (README). Errors here reach every agent and look authoritative.
4. **Found but misread.** The forked Haiku summarises entries for an Opus caller. Measured 2026-10-30: 2 of 40 answers said the opposite of the entry, and all flagged answers came through the fork (RETR-030, RETR-031; a lead, not blinded).
5. **Not found.** Raw-question BM25 misses reworded questions, but the agent loop recovers them (RETR-011). Measured only on synthetic questions: all cited entries made the top 5 in 72–79% of them, so multi-part answers are often built from part of what exists.

So effort pays off most in triggering, coverage and verification. A better ranker comes after real queries show misses. The server's 54 searches in 30 days (RETR-012) and 12 of 52 relevant sessions (RETR-025) fit point 1.

*Ordering by our judgment from these measurements and the README's history, not a measured rate.*

## [RETR-019] Evaluating retrieval for a knowledge base
- Type: recommendation
- Applies to: general
- Confidence: single-source
- Last verified: 2026-10-20
- Sources: [How we built our multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system), [RAG guide](https://github.com/anthropics/claude-cookbooks/blob/main/capabilities/retrieval_augmented_generation/guide.ipynb), [mcp-server/tests/kb-index.test.ts](https://github.com/FreekMencke/claude-kb/blob/main/mcp-server/tests/kb-index.test.ts), local measurement
- Related: RETR-010, RETR-012, RETR-005, CAPI-015, SKILL-025

**Our test is optimistic.** `kb-index.test.ts` asks whether each Quick-answer question finds a cited entry in the top 5. The questions are written from the entries, in their words. The test found 208 of 253 in the top 5 on 2026-10-15, and 513 of 574 (89.4%) at `c1ffe45`. On hard rewordings of 100 of them, the same search scored 73 (RETR-010). Since 2026-10-20 the test also fails if the natural rewordings drop below 85% or the hard ones below 65%.

**A better set:**
- **Reworded questions,** in plain and situation-only wording, generated once and committed. The cited IDs become the labels.
- **Uncovered questions,** to test that the lookup abstains (RETR-012).
- **Real queries,** which the server doesn't log. Since 2026-10-20 it logs the entry IDs each search returned and each `kb_get` read, which shows what gets used but not how it was asked.

**Metrics:**
- Recall@5 and MRR per arm, compared on the same questions.
- Retrieval and the final answer judged separately, as the cookbook does.

**Size:** Anthropic's research team "started with a set of about 20 queries representing real usage patterns": "With effect sizes this large, you can spot changes with just a few test cases". Our arms differ by 17 to 27 points on hard rewordings, so 100 questions separate them. They can't separate arms at the 97–100% ceiling. A harder set needs questions that combine several entries, scored on all cited entries, and rewordings written without the answer in view. Leave this file out when scoring: it quotes test questions.

## [RETR-020] Adding vector RAG before an eval shows misses
- Type: anti-pattern
- Applies to: general
- Confidence: single-source
- Last verified: 2026-10-20
- Sources: [Building agents with the Claude Agent SDK](https://www.anthropic.com/engineering/building-agents-with-the-claude-agent-sdk), local measurement (RETR-010), [README design decisions](https://github.com/FreekMencke/claude-kb/blob/main/README.md#design-decisions)
- Related: RETR-002, RETR-010, RETR-016, MEM-033, TOK-084

**The anti-pattern:** adding embeddings, a vector database or GraphRAG to a knowledge base because "RAG" is the default answer to "give an LLM knowledge", without a measured miss.

**What it costs:**
- An embedding API key and a re-embed step in the deploy.
- A second ranking to tune.
- Results you can't explain by reading the query: Anthropic calls semantic search "less transparent" and "more difficult to maintain" (RETR-002).
- More moving parts in a server that's down to one `node:sqlite` table.

**What it buys here:** nothing we could measure. The search-and-read loop found a cited entry in 99–100% of reworded questions (RETR-010). That test is synthetic and at its ceiling, so it shows no gap, not that none exists.

**When it would be right:**
- Callers that can't rewrite queries: a single-shot pipeline with no agent, or a UI search box.
- A corpus far past a few thousand entries, where an index or a few keyword searches stop reaching the entry.
- An eval showing the loop missing on real queries (RETR-019).

The README's rule already says this: "Revisit if lookups start failing."

---

## [RETR-021] Demand-driven review: a priority, not the only trigger
- Type: recommendation
- Applies to: general
- Confidence: single-source
- Last verified: 2026-10-30
- Sources: [KCS v6 Practices Guide, Technique 4.1: Reuse is Review](https://library.serviceinnovation.org/KCS/KCS_v6/KCS_v6_Practices_Guide/030/030/040/020) (accessed 2026-10-30), local measurement (RETR-025)
- Related: RETR-018, RETR-022, RETR-024, RETR-025, RETR-032

Knowledge-Centered Service reviews an article when someone uses it: "For those articles that are never referenced, we have not wasted time reviewing them." Its reasoning: "Reviewing every KCS article that is created is a huge waste of time and money."

The method relies on a person noticing a fault while using the article: "the requestors participate in the "reuse is review" process", and they "are very quick to point out articles that they don't understand or that don't work." An agent that reads an entry and follows it reports nothing unless told to, so reading isn't reviewing here.

So use demand to order the work, and keep a floor for the rest:
- Re-verify entries that real sessions read first (RETR-025 gives the list; 199 of 1,261 were read in 14 days).
- Don't skip the unread ones: their sources can change too, and a hash check finds that at no model cost (RETR-026).
- Ask agents to report an entry that proved wrong in practice, since nothing else closes that loop (RETR-022).

The recommendation is our inference; KCS says nothing about agents.

## [RETR-022] Freshness dates, owners and doc bugs
- Type: pattern
- Applies to: general
- Confidence: single-source
- Last verified: 2026-10-30
- Sources: [Software Engineering at Google, ch. 10: Documentation](https://abseil.io/resources/swe-book/html/ch10.html) (accessed 2026-10-30)
- Related: RETR-021, RETR-023, RETR-024

Google's practice, as the book describes it: "Documents without owners become stale and difficult to maintain." Documents "note the last time a document was reviewed, and metadata in the documentation set will send email reminders when the document hasn't been touched in, for example, three months." The date lives in the document with its owner, and the book calls this "a low-cost means to ensure that a document is looked over from time to time". Documentation should also "Have issues tracked, as bugs are tracked in code".

How that maps to this knowledge base:
- **Freshness date:** `Last verified` on every entry, and the server's 60-day advice.
- **Reminder:** the re-verification routine, which picks entries by age.
- **Owner:** none per entry. One person owns the repo, and routines do the checking. With 1,261 entries, a per-entry owner adds nothing.
- **Bug tracking:** issues in this repo. Since 2026-10-30 the global CLAUDE.md tells agents to file one, with the proof, when an entry proves wrong in practice. It covers only sessions that load that file.

A date only says someone looked. Whether the source still says the claim needs a check against the source (RETR-026, RETR-027).

## [RETR-023] OpenAI's doc-gardening agent: one sentence of evidence
- Type: pattern
- Applies to: general
- Confidence: single-source
- Last verified: 2026-10-30
- Sources: [Harness engineering: leveraging Codex in an agent-first world, OpenAI, 2026-02-11](https://openai.com/index/harness-engineering/) (curl got 403 on 2026-10-30; read as the [Wayback copy of 2026-10-17](http://web.archive.org/web/20261017224725/https://openai.com/index/harness-engineering/))
- Related: RETR-022, RETR-024, RETR-026

OpenAI describes a repo whose docs are kept true by machines: "Dedicated linters and CI jobs validate that the knowledge base is up to date, cross-linked, and structured correctly." A recurring doc-gardening "agent scans for stale or obsolete documentation that does not reflect the real code behavior and opens fix-up pull requests."

That's all the post says: no cost, cadence, error rate or share of pull requests accepted. Treat it as a pattern that a team uses, not evidence that it works.

Two differences from us:
- Their ground truth is code in the same repo. Ours is third-party pages, which change and can be misread.
- Fix-up pull requests need a guard here. The first re-verification run changed 25 entries, and 8 of those changes were wrong (README), which is why only a contradicting quote may change a claim.

Our equivalent is the routine plus `scripts/check-kb.ts` in CI.

## [RETR-024] Karpathy's LLM wiki lint list against our checks
- Type: comparison
- Applies to: general
- Confidence: single-source
- Last verified: 2026-10-30
- Sources: [LLM Wiki, Andrej Karpathy (gist)](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f) (accessed 2026-10-30)
- Related: RETR-004, RETR-021, RETR-023, RETR-026

Karpathy's gist has the model health-check a wiki periodically: "contradictions between pages, stale claims that newer sources have superseded, orphan pages with no inbound links, important concepts mentioned but lacking their own page, missing cross-references, data gaps that could be filled with a web search." Its claim is that this is cheap: "the cost of maintenance is near zero". The gist measures nothing.

| Lint | Here |
|---|---|
| Contradictions | INDEX.md's Conflicts, by hand; no scan |
| Stale claims | The routine; `scripts/check-sources.ts` between runs (RETR-026) |
| Orphans, cross-references | `Related` IDs must exist. One-way links are left alone on purpose |
| Concepts without a page | Not checked |
| Data gaps | Not checked. A search with no read may point at them (FreekMencke/claude-kb#347) |

"Near zero" doesn't hold for us: a model pass still needs review, and 8 of 25 changes in the first re-verification were wrong (README). Scripts cover the mechanical rows at no model cost; use a model where judgment is needed.

## [RETR-025] Real use of this knowledge base, 2026-10-15 to 2026-10-28
- Type: fact
- Applies to: Claude Code
- Confidence: single-source
- Last verified: 2026-10-30
- Sources: [scripts/kb-usage.ts](https://github.com/FreekMencke/claude-kb/blob/main/scripts/kb-usage.ts), local measurement: `node scripts/kb-usage.ts --from 2026-10-15 --to 2026-10-28 --period all`, one user's transcripts on one machine, outside `-tmp` projects, tool calls deduplicated
- Related: RETR-018, RETR-021, RETR-012, RETR-029

Most sessions didn't use the knowledge base, and most of those that should have didn't either. Of 320 sessions, 48 used it. Of 52 outside this repo and claude-skills that edited an instruction file or did an upgrade, 12 used it.

- **Route:** direct tool 43, lookup skill 3, subagent only 2.
- **First use:** the user named it 17, after another skill 14, unprompted 17.
- **Searches:** 96 (95 distinct), 0 empty, 53 directly after another search, topic filter on 5.
- **Reads:** 62 `kb_get` calls for 245 IDs. Only 70 appeared in an earlier search that session (rank 1: 19, top 5: 48, deeper: 22), so most IDs came from elsewhere, probably citations in skills and issues (not traced).
- **Spread:** 376 entries returned, 199 read, 1,261 in the corpus.

Scoring BM25 on 28 of those real queries (`evals/retrieval/real.json`, hand-labelled from what the session read), at commit 2632565: 14 at rank 1, 24 in the top 5, MRR 0.64, all cited 17. Of the 4 misses, 2 are DESIGN-023 outranked by the newer DESIGN-041 to 045 on the same subject, and 2 rank 7 and deeper.

Query text stays in a git-ignored folder: the labels were reviewed by hand before committing.

## [RETR-026] Hash-checking every source: what two runs show
- Type: fact
- Applies to: general
- Confidence: single-source
- Last verified: 2026-10-30
- Sources: [scripts/check-sources.ts](https://github.com/FreekMencke/claude-kb/blob/main/scripts/check-sources.ts), local measurement: `node scripts/check-sources.ts`, run twice about 30 minutes apart on 2026-10-30
- Related: RETR-021, RETR-022, RETR-023, RETR-027

Checking every source for change takes minutes and no model calls. The script fetched 2,847 URLs in about 1 minute 50 seconds. Comparing normalised text hashes across the last two runs: 2,777 same, 1 changed, 14 volatile (12 on support.google.com), 55 failed.

Getting there needed filters, each found from false alarms:
- `Accept-Language: en`, since Google hosts answered in random languages without it (volatile 70 to 14).
- GitHub's counters, which changed 26 pages between runs with no real change.
- Empty 200 responses count as failures.

What it doesn't show:
- **A changed hash isn't a wrong claim.** The script reports added changelog bullets and quotes it can't find; a person or the routine judges them. Only a contradicting quote changes a claim.
- **Slow churn is unmeasured.** 30 minutes says nothing about a week. The weekly workflow (`.github/workflows/sources.yml`) gives that from its second run.

Third-party text stays out of this public repo: hashes and reports only, with text in an Actions cache and artifact.

## [RETR-027] Looking up every quote in its source
- Type: fact
- Applies to: general
- Confidence: single-source
- Last verified: 2026-10-30
- Sources: [scripts/check-sources.ts](https://github.com/FreekMencke/claude-kb/blob/main/scripts/check-sources.ts), local measurement: `node scripts/check-sources.ts`, two runs on 2026-10-30, the sweep in FreekMencke/claude-kb#352
- Related: RETR-022, RETR-026, RETR-018

A script can check most of what `Last verified` only asserts. Of 3,178 double-quoted strings in 974 entries, 2,621 were found in the entry's cited sources, 64 were near matches and 493 weren't found; 610 entries had every quote found.

"Not found" isn't "wrong". Causes seen: our own examples and prompts in double quotes, pages that render through JavaScript, PDFs, quotes spanning markup, and 55 failed fetches. Near matches are the useful class: mostly a source reworded since the entry was written.

Acting on them by hand (FreekMencke/claude-kb#352): 32 near-match quotes updated, with a few claims corrected. Before and after that sweep: found 2,614 to 2,651, near 69 to 33, not found 495 unchanged, fully verified entries 606 to 625. The sweep changed no recommendation.

The convention that makes it work: double quotes mean source text. Own examples go in code spans, and paraphrases go without quotes.

## [RETR-028] Filtered document expansion: hold until real queries miss
- Type: recommendation
- Applies to: general
- Confidence: single-source
- Last verified: 2026-10-30
- Sources: [Doc2Query--: When Less is More, Gospodinov, MacAvaney and Macdonald, ECIR 2023](https://arxiv.org/abs/2301.03266) (abstract read 2026-10-30; paper's method not read)
- Related: RETR-010, RETR-011, RETR-020, RETR-025, RETR-029

Doc2Query adds generated queries to each document before indexing, to close vocabulary gaps for keyword search. The paper finds it "prone to "hallucinating" content", and that filtering the queries with a relevance model "can improve the retrieval effectiveness of Doc2Query by up to 16%, while simultaneously reducing mean query execution time by 23% and cutting the index size by 33%."

Those figures compare filtered with unfiltered expansion on the paper's collections, not expansion against our short, titled entries with a model writing the queries. For us:
- It would fit FTS5 with no new infrastructure: generated queries go in an extra indexed column.
- It would target misses from worded-away questions. Of 4 misses in the real set, 2 are older entries outranked by newer ones on the same subject (RETR-025), which more terms wouldn't fix.
- The agent loop already recovers most vocabulary misses (RETR-010, RETR-011).

Next step only if the real set grows and vocabulary misses appear. The LLM rerank in `kb-knowledge-retrieval.md`'s recommendations stays first.

## [RETR-029] Tag weight barely moves search
- Type: fact
- Applies to: general
- Confidence: single-source
- Last verified: 2026-10-30
- Sources: [evals/retrieval](https://github.com/FreekMencke/claude-kb/blob/main/evals/retrieval/README.md), local measurement: `node evals/retrieval/run.ts bm25 && node evals/retrieval/score.ts` with `WEIGHTS` in `mcp-server/kb-index.ts` at `[10, 3, 2, 1]` and `[10, 3, 0, 1]`, clearing `evals/results/retrieval/` between runs, at commit 2632565 plus `evals/retrieval/real.json`
- Related: RETR-010, RETR-019, RETR-025

Turning tags off changes raw-query BM25 by at most 3 points, so tag cleanup isn't worth doing for search.

| Set | Top 5, tags 2 | Top 5, tags 0 | Top 1, tags 2 | Top 1, tags 0 |
|---|--:|--:|--:|--:|
| Original (100) | 88 | 86 | 74 | 71 |
| Natural (100) | 91 | 92 | 65 | 62 |
| Hard (100) | 71 | 71 | 44 | 42 |
| Real (28) | 24 | 24 | 14 | 13 |

The tags are untidy: 2,006 distinct, 1,276 used once (index tables at the same commit). It doesn't matter here, since they repeat words already in titles and bodies. They do help top 1 slightly, so keep the weight at 2.

Differences this small are noise at these sample sizes (RETR-010: a rerun moved one arm by 3 points). The scorer caches per arm: without clearing the results folder, the second run silently repeats the first.

## [RETR-030] Does the knowledge base improve answers? 20 cases, with and without
- Type: fact
- Applies to: Claude Code
- Confidence: single-source
- Last verified: 2026-10-30
- Sources: local measurement: `claude plugin eval . --eval-dir eval-answers --ablation with-without --model claude-opus-5-5 --judge-model sonnet --allow-real-servers --runs 1`, v2.1.296, 2026-10-30; [Plugin evals](https://code.claude.com/docs/en/plugin-evals)
- Related: RETR-018, RETR-019, RETR-031, TOK-117

Yes, on questions whose answers post-date training or are local to us. Each of the 20 cases has two `llm` graders with criteria taken from the entries, and each arm ran once.

| Tools | With plugin | Without | Cost with / without | Summed seconds |
|---|--:|--:|--:|--:|
| No web | 100% | 47.5% | $2.61 / $2.28 | 370 / 302 |
| WebSearch, WebFetch | 100% | 75% | $2.65 / $3.80 | 367 / 582 |

Judging added $0.71 and $0.73. With web, the plugin arm cost 30% less than the no-plugin arm, where 16 of 20 runs searched or fetched.

Without the plugin but with web, 6 cases lost points: `gh-cloud`, `grafana-policy`, `mongod-ubuntu`, `playwright-cost`, `rtk-bill`, `tokeneconomizer`. Two had a misleading conclusion: `GH_TOKEN` "might get past" the proxy, and the CLI "Probably yes" saves tokens. The others had the right direction and lacked the detail the criteria ask for.

Don't read 100% as accuracy:
- The criteria come from the entries, so the arm reading them sits at the ceiling, and any entry error passes (RETR-031).
- One run per cell, and 19 of 20 plugin runs used the KB (`capi-55` used the bundled `claude-api` skill; both arms passed).
- The no-plugin web answer that failed `grafana-policy` was right that the policy can't be changed, for a different reason.

## [RETR-031] What the graders missed: misreads and an entry error
- Type: fact
- Applies to: Claude Code
- Confidence: single-source
- Last verified: 2026-10-30
- Sources: [eval-answers](https://github.com/FreekMencke/claude-kb/blob/main/eval-answers), local measurement: hand reading of the 40 plugin answers in RETR-030 against their entries, 2026-10-30, not blinded
- Related: RETR-018, RETR-030, MCP-041, TOK-117, OG-001, TS-011, KUBE-003

All 40 plugin answers passed their graders, which check that facts are present, not that nothing is wrong. Reading them found:

**Misread, the opposite of the entry (2):**
- `satori-overflow`: `^0.62.0` "still allows minor bumps on 0.x". OG-001 says it pins the minor.
- `ts-latest`: npm "stops with an ERESOLVE error", for a repo already on 6.0.3. TS-011 says that case only warns and writes `^7.0.2`.

**Overstated or merged (4):** "no 2.9.x patch will add it" (KUBE-003 records none so far), Node "24.15+" for the app (the CLI's floor), "some Lambda setups" (all of them, on Node 20 to 24), and "doesn't confirm" a `beforeAll` effect JSTEST-001 states.

**Route:** all 6 came from the 13 answers through the lookup skill, whose fork runs on Haiku; none from the 25 where Opus read entries directly. On `satori-overflow`, the Haiku fork inverted the claim and direct Opus got it right. It's a lead: the review wasn't blinded, the model picks the route, and skill answers read more entries (mean 4.4 against 1.8).

**Entry error (1):** both plugin answers repeated TOK-117's "no independent test". The no-plugin web run found one, posted 2026-10-25, so the entry was wrong and the criterion passed it. That run also misread the README's "Older versions: not supported" column as the supported range.

## [RETR-032] Guru's verification from use: signals agents don't send
- Type: comparison
- Applies to: general
- Confidence: single-source
- Last verified: 2026-10-30
- Sources: [How Content is Verified in Guru](https://help.getguru.com/docs/verifying-and-unverifying-cards) (accessed 2026-10-30)
- Related: RETR-021, RETR-022, RETR-025

Guru, a vendor's product, moved from reminder dates towards agents checking cards. "Does not expire" is the default for Collections created after January 2026, with no periodic reminders to the verifier, but "Knowledge Agents will still review this content during their daily runs". Its advice: "For most content, we recommend using "Does not expire" and letting Knowledge Agents handle ongoing quality checks automatically."

Those agents work by "learning from usage patterns (how people interact with content through thumbs up/down, views, and feedback)". The page gives no error rate or evidence that this beats dates.

For us:
- **Views:** we have them, from transcripts (RETR-025).
- **Thumbs and feedback:** agents send none. An agent following a wrong entry looks the same as one following a right one, so usage can rank entries but can't verify them (RETR-021).
- **Dates:** keep `Last verified`. It costs little, and our routine needs it (RETR-022).

## Recommendations for our setup

Ranked by impact against effort.

1. **Keep keyword search, the agent loop and plain Markdown; won't add embeddings, a vector store, GraphRAG or whole-corpus prompting for now** (decision 2026-10-20).
   - With a model writing the queries, BM25 reached 97–100% any-cited top-5 on 300 synthetic questions.
   - The corpus fills 93% of a 1M window (RETR-009), and Anthropic recommends agentic search first (RETR-002).
   - Revisit on a miss in real queries (recommendation 4) or a harder eval (RETR-019).
   - `ENTRIES.md` in the prompt scored best (99–100%), but at about 49k tokens it is over the 25,000-token MCP output cap (TOK-023) and grows with every entry. Keep it as the next step if search misses, behind a tool that returns one topic's index.
   - Entries: RETR-010, RETR-011, RETR-020, RETR-009.
2. **Spend effort where lookups fail: invocation, coverage, verification** (high impact, ongoing). The trigger evals and the re-verification routine already cover two of these. RETR-018.
3. **Commit the reworded and uncovered question sets as a retrieval eval** (medium impact, low effort). Done 2026-10-20 as `evals/retrieval/`; a harder set with multi-entry questions, near-miss negatives and all-cited scoring is still to write. Done 2026-10-20: the server's search test also asserts the natural (85%) and hard (65%) rewordings, not only the vocabulary-matched 75%. RETR-019, RETR-010.
4. Done 2026-10-20: the server logs the entry IDs `kb_search` returned and `kb_get` read, never query text, and no longer logs client IPs. Query text stays out: it is strangers' free text on a public server (RETR-012, RETR-019; `mcp-server/README.md`, "Logs").
5. **If misses appear: first an LLM pick from BM25's top 30, then hybrid search** (low effort, then medium). The rerank arm reached 94–99% with no new infrastructure, capped by BM25's top 30 (RETR-010). sqlite-vec with RRF and Voyage embeddings would be the step after (RETR-016). Checked 2026-10-30: raw BM25 misses 4 of 28 real queries, 2 of them newer entries outranking older ones, which isn't yet a reason (RETR-025). Filtered document expansion and tag cleanup stay parked (RETR-028, RETR-029).
6. **Order re-verification by change and use** (high impact, low effort). Done 2026-10-30 for changed sources, failed quotes and hub entries (FreekMencke/claude-kb#343). Most-read entries aren't in it: the routine can't see local transcripts and has no log access. RETR-021, RETR-025, RETR-026.
7. **Find out whether the forked Haiku causes the misreads** (high impact, low effort). Rerun `eval-answers/` with the fork on Sonnet and score misreads blind (FreekMencke/claude-kb#344). RETR-031.
8. Done 2026-10-30: the global CLAUDE.md tells agents to open an issue here, with the proof, when an entry proves wrong in practice. RETR-021, RETR-022.

## Open questions

- **Near misses.** Real queries now exist for one user's Claude Code sessions (RETR-025), and the public server still logs none (recommendation 4). Near-but-wrong entries and false abstention are unmeasured beyond RETR-010 and RETR-012.
- **The fork's effect on answers.** All flagged answers came through the forked Haiku, in an unblinded review of one run per cell (RETR-031). Whether the model or the number of entries causes it isn't known.
- **Slow source churn.** Two runs 30 minutes apart say nothing about a week; the weekly workflow's second run will (RETR-026).
- **Embeddings on our data.** Not tested: no embedding API or model host was reachable from the session (RETR-010).
- **Unread primary sources.** The Cherny quotes (RETR-003), the Cursor, Cline, Cody and Copilot pages (RETR-013), Voyage's price list (RETR-016), and all paper figures except LaRA's and NoLiMa's (RETR-017, RETR-008) were seen only as search-result text. A session that reaches x.com, arxiv.org and those vendors should re-read them.
- **Projects' RAG mode.** Its threshold, and whether its search is keyword or embedding based, aren't published (RETR-006).

# Trilogy Care

## SEO Growth Plan — Strategy + Operational Brief

### 12-Month Plan with Execution Notes

**Updated:** May 2026 &nbsp;|&nbsp; **Owner:** Nick Lunn, CMO
**Stack:** Next.js (App Router) + Storyblok (headless CMS) + Cloudflare + Vercel
**Data sources:** SEMrush (Mar 16, 2026) | GA4 (Feb 17 – Mar 16, 2026)
**Goal:** Grow organic traffic from 11,649 to 50,000 visits/month within 12 months (≈4×) and lift non-branded share from ~15% to 70%.

---

## Where We Stand

Trilogy Care is Australia's #3 Support at Home provider with ~11,649 organic visits per month versus Right at Home's 22,914. Authority Score sits at 28. Non-branded traffic is accelerating (+17% MoM) but still only 15% of the mix. The site has 247 indexed pages, 230+ existing articles, and a near-clean technical foundation (Site Health 95%) — the substrate for compounding growth is in place. The stack (Next.js SSR + Storyblok) is favourable: link equity flows cleanly to Googlebot, and content edits don't need a code deploy.

## The Core Problem

69.3% of all organic traffic hits the homepage. The top 15 keywords are all branded ("Trilogy Care …"). There are zero AI citations across ChatGPT, Perplexity, or Google AI Overviews, and zero location pages targeting metro and regional demand. **Critically for YMYL:** Article JSON-LD currently uses `"author": {"@type": "Organization", "name": "Trilogy Care"}` — no named human, no credentials, no clinical reviewer. For aged-care content (falls, medication, exercise, eligibility) Google's quality rater guidelines expect a named author + clinical reviewer with visible bios. This is a Phase-1 fix.

## What This Plan Delivers

Four workstreams across 12 months close the 38,351 monthly visit gap:

- **Phase 1 — Technical + E-E-A-T + Quick Wins (Weeks 1–4): +3–5k visits/mo.** Add `author` + `reviewer` fields to the Storyblok `post` content type; update Article JSON-LD to emit `Person` schema with `sameAs`; create initial Person stories. Fix broken canonicals, H1s, and titles; add FAQ schema; ship `llms.txt` for AI-search visibility; capture 14 striking-distance keywords ranking position 4–20.
- **Phase 2 — Money Pillars + Comparisons (Weeks 4–12): +6–10k visits/mo.** Ship 2 new pillars (Self-Managed Home Care, Costs & Funding) with 10 spokes, 4 dedicated HCP-level pages, 5 competitor comparison pages, 8 Tier-1 metro location pages.
- **Phase 3 — Scale Content (Months 3–6): +5–8k visits/mo.** Complete Pillar 1 (Support at Home) spokes, Pillar 4 (Navigating Aged Care), 15–20 Tier-2 location pages, glossary batch 1, plus a Support at Home Fee Estimator as the linkable asset for outreach.
- **Phase 4 — Authority Pillars + Scale (Months 6–12): +5–10k visits/mo.** Pillars 2, 3, 5; remaining 20 Tier-3 location pages; remaining glossary and comparison pages; refresh cycle on Phase 2 content.

End state: 7 pillars + 61 spokes + 6 programmatic clusters (locations, comparisons, glossary, levels, services) — 218 new pages, 247 → ~420 total.

## Strategic Frame

Dual optimisation: rank on Google **and** get cited by ChatGPT, Perplexity, and Google AI Overviews. ~80% of the work overlaps — answer-first structure, citation capsules, sourced statistics, FAQ schema, and named-author bylines. Trilogy's unfair advantages: (1) real provider, not aggregator; (2) self-managed pioneer; (3) #3 nationally on $245.2M FY24 funding; (4) 230+ existing articles to refresh; (5) the Support at Home reform has opened a content vacuum competitors haven't filled.

## Key Benchmarks

| KPI | Now (Mar 2026) | 6 Months | 12 Months |
| --- | --- | --- | --- |
| Organic monthly traffic | 11,649 | 25,000 | 50,000 |
| Non-branded traffic share | ~15% | 50% | 70% |
| Ranked keywords | 5,374 | 10,000 | 20,000 |
| Pages driving >100 visits/mo | 3 | 15 | 40 |
| Referring domains | 258 | 400 | 700 |
| Authority Score | 28 | 35 | 45 |
| AI citation frequency (weekly) | 0 | 5 | 20+ |
| Pillar pages live | 0 | 4 | 7 |
| Spoke articles published | 0 | 25 | 61+ |
| Location pages live | 0 | 8 | 50+ |

## Recommended Starting Point

Begin with Phase 1 — the E-E-A-T author/reviewer fix, the technical fixes, and the 14 striking-distance keywords ranking in positions 4–20. These are the fastest measurable wins: the impressions exist, the pages exist, only the on-page execution and author signals are missing. In parallel, kick off Pillar 6 (Self-Managed Home Care) since the keyword set is non-competitive and Trilogy has a defensible authority position. Validate the playbook on these two tracks before scaling content production into Phase 3.

## ROI

At 50,000 visits/month, a 1.5% organic conversion rate, 10% lead-to-client conversion, and $15,000 average annual client value: **575 leads/month → 57 new clients/month → ≈$10.3M annual revenue from SEO growth.** Even at half these rates the return is exceptional, and the marginal cost of each new page (under the existing agent and content stack) is a small fraction of paid acquisition cost-per-lead.

---

## Agents & Prompts to Spin Up

The XLSX references a 38-agent SEO system. Below is the priority order, grouped by function, with what we already have flagged.

**Research & Strategy (Phase 1+, build first)**

- `/seo-keyword-research` — pull SEMrush volumes, KD, intent for a topic
- `/seo-competitive-intel` — gap analysis vs Right at Home, Mable, HomeMade, Careseekers
- `/seo-orchestrator` — Layer-2 plan-and-progress agent for monthly review
- `/seo-rank-tracker` — daily / weekly position monitoring + alerts

**On-Page Implementation (Phase 1, build immediately)**

- `/seo-audit` — single-page audit (title, meta, H1, schema, content depth, internal links)
- `/seo-technical-implementation` — apply audit fixes in code/CMS
- `/schema-markup` — generate JSON-LD for FAQ, Article, Person, Organization, BreadcrumbList
- `/blog-seo-check` — pre-publish on-page QA
- `/seo-rich-snippets` — SERP feature optimisation (FAQ, How-to)
- `copy-reviewer` ✅ already exists in `.claude/skills/copy-reviewer`

**Content Production (Phase 2 onward)**

- `/blog-strategy` — pillar/spoke planning
- `/blog-brief` — keyword → brief
- `/blog-outline` — H2/H3 structure with target word counts
- `/blog-write` — full draft (Sonnet)
- `/blog-rewrite` — refresh existing articles to current standards
- `/blog-repurpose` — one article → social, email, video script
- `/blog-calendar` — publish schedule + sequencing

**GEO — AI Search (Phase 1 in parallel)**

- `/geo-readiness-check` — score a page for AI citation potential (FAQ schema, definitions, named authors, sources)
- `/geo-citation-tracker` — monitor mentions in ChatGPT, Perplexity, AI Overviews

**Authority & Link Building (Phase 3+)**

- `/seo-link-building` — outreach lists + email sequences for digital PR
- `/social-content` — LinkedIn / Instagram from blog
- `marketing-tools-advisor` ✅ already exists — broader stack-level recommendations

**How to build them:** use the existing `/scope` skill to draft each agent's brief, save to `.claude/skills/<agent-name>/SKILL.md`, test on one page, then scale. Phase 1 minimum required: `seo-audit`, `seo-technical-implementation`, `schema-markup`, `seo-rank-tracker`, `seo-keyword-research`, `geo-readiness-check`.

## E-E-A-T / YMYL Author Schema Fix (Phase 1, concrete)

Current state: `Article` JSON-LD names `"author": {"@type": "Organization", "name": "Trilogy Care"}`. Missing for YMYL: named author + credentials, clinical reviewer, Person schema with `sameAs` to professional profiles.

Concrete steps:

1. **Storyblok content model** — add `author` (single-option link to a `person` content type) and `reviewer` (single-option link, optional but required for clinical content) to the `post` content type
2. **Storyblok Person stories** — create stories for Imran, Nick, Steve, plus **Romy Blacklaw** as the clinical reviewer for medical / clinical YMYL content. Each Person needs name, role, bio, credentials (e.g. AHPRA registration number), photo, `sameAs` links (LinkedIn, professional registry)
3. **Next.js component** — update the post template's JSON-LD emitter to output `@type: Person` for `author` and (when present) a `reviewer` block with `@type: Person`
4. **Visible byline + reviewed-by line** — add to the post header so readers see what the schema reflects
5. **Backfill** — existing 230+ articles get an author assignment in Storyblok in batches; clinical reviewer assigned to YMYL-flagged content

## Staging Environment

The Next.js + Vercel stack makes this straightforward — every PR gets a Vercel preview URL automatically. No separate staging hostname needed.

**Setup:**

- Storyblok has its own Preview environment that points at the Vercel preview URL for the active branch (configured per workspace)
- Vercel preview URLs are blocked from search engines via `x-robots-tag: noindex, nofollow` middleware (already standard on most Next.js sites; verify it's set)
- Optional: HTTP basic auth on preview URLs via Vercel password protection for sensitive drafts
- Audit the existing pages flagged with `<meta name="robots" content="noindex">` — confirm intentional vs leak, especially on the production domain

**Promotion workflow:**

1. Edit content in Storyblok (Draft state) or schema/template in code
2. For code changes: branch + PR — Vercel auto-creates a preview URL
3. Review in preview: visual + run `/seo-audit` and `/geo-readiness-check`
4. For content: Storyblok publish → cache revalidates on production
5. For code: merge PR → Vercel deploys to production
6. Re-validate in production; submit URL to Search Console if it's a new page

## Editing Workflow (Steve & Nick via VS Code Terminal)

Two paths depending on what's being changed:

**Content edits (most common):** Storyblok visual editor — no code, no terminal needed. Steve and Nick edit copy, swap images, adjust headings directly.

**Schema, JSON-LD, components, on-page templates:** Claude Code in VS Code on the trilogycare.com.au repo. Workflow:

1. **One-time setup** — install Claude Code CLI (`curl -fsSL https://claude.com/install.sh | sh`); `code /path/to/trilogycare-website`; verify `gh auth status`
2. **Per-edit flow:**
   - `git pull` to get the latest
   - Tell Claude what to do — e.g. *"Run the seo-audit skill on /home-care-package-levels"* or *"Update the Article JSON-LD component to emit Person schema for author"*
   - Claude creates a branch (`feat/seo-author-schema`), edits, commits
   - Claude pushes the branch and opens a PR via `gh pr create`
   - Vercel auto-creates the preview URL — review there
   - Imran reviews + merges on GitHub; Vercel deploys to production

**No-CLI fallback:** edits can be made directly in VS Code's GUI; Claude in the terminal handles linting, auditing, committing, and PR creation.

## Risk Register

| Risk | Likelihood | Impact | Control |
| --- | --- | --- | --- |
| Google algorithm change disrupts ranking | Medium | High | Diversify into AI-search citations; keep YMYL E-E-A-T strong |
| AI Overviews cannibalise SERP click-through | High | Medium | Optimise pages to be the citation, not just the rank |
| Content production slips behind schedule | High | Medium | Use the agent stack to compress draft time; weekly cadence |
| YMYL / clinical accuracy issues | Low | High | Named author bylines + Romy Blacklaw as clinical reviewer in approval flow (Phase 1 schema fix) |
| Competitor catches up on Self-Managed pillar | Medium | Medium | Ship Pillar 6 first; build defensible authority quickly |

## Measurement Cadence

- **Daily:** Indexation, errors, schema validation — `/seo-rank-tracker` Tier 1
- **Weekly:** Rankings, CTR, traffic, AI citations — `/seo-rank-tracker` Tier 2
- **Monthly:** Cluster performance, conversion attribution, ROI — full team review
- **Quarterly:** Strategy review, resource allocation, competitive landscape — CMO + `/seo-orchestrator`

## Tooling Stack

| Layer | Tool | Owner |
| --- | --- | --- |
| Framework | Next.js (App Router) | Engineering |
| CMS | Storyblok | Marketing + Engineering |
| CDN / proxy | Cloudflare | Engineering |
| Origin | Vercel | Engineering |
| Analytics | GA4, Search Console, GTM, Zoho PageSense, Klaviyo | Marketing |
| Keyword + competitive | SEMrush | Marketing |
| Crawling | SEMrush Site Audit (+ Screaming Frog ad-hoc) | Marketing |
| Schema validation | Schema.org validator + Google Rich Results Test | Author / agent |
| AI citation monitoring | Manual + `/geo-citation-tracker` | Marketing |
| Authoring (content) | Storyblok visual editor | Steve, Nick, content team |
| Authoring (schema/code) | VS Code + Claude Code CLI | Steve, Nick, Imran |
| Version control | GitHub (Trilogy-Care org) | Imran |

## Authoring & Approval Workflow

1. **Brief** — `/blog-brief` produces a brief from the target keyword, drawn from the master keyword list
2. **Outline** — `/blog-outline` proposes H2/H3 structure; Steve or Nick reviews
3. **Draft** — `/blog-write` produces a draft; named author byline assigned (E-E-A-T)
4. **Clinical review** — required for any YMYL content (medical, financial, eligibility); reviewer signs off in Storyblok with their Person record attached
5. **SEO QA** — `/blog-seo-check` + `/geo-readiness-check` before publish
6. **Stage + review** — Storyblok draft on Vercel preview; visual + on-page QA
7. **Publish** — Storyblok publish → Vercel revalidates → submit URL to Search Console
8. **Track** — `/seo-rank-tracker` watches indexation + initial movement

## Day 1 Checklist

- [ ] Locate the trilogycare.com.au Next.js repo + grant Steve/Nick access
- [ ] Confirm Vercel project access for preview URLs
- [ ] Steve + Nick install Claude Code CLI in VS Code; verify `gh auth status`
- [ ] Audit existing `noindex` pages on the production domain — verify intentional vs leak
- [ ] Storyblok: add `author` (Person link) + `reviewer` fields to `post` content type
- [ ] Storyblok: create initial Person stories (Imran, Nick, Steve, + Romy Blacklaw as clinical reviewer)
- [ ] Next.js: update Article JSON-LD template to emit `Person` schema with `sameAs`
- [ ] Build the Phase-1 minimum agent set: `seo-audit`, `seo-technical-implementation`, `schema-markup`, `seo-rank-tracker`, `seo-keyword-research`, `geo-readiness-check`
- [ ] Ship `llms.txt` (Phase 1 critical for AI-search visibility)
- [ ] Run `seo-audit` on the 14 striking-distance pages
- [ ] Apply Phase 1 fixes (broken canonicals, H1s, titles, schema, author bylines)
- [ ] Re-baseline SEMrush + GA4 numbers two weeks after Phase 1 ships

## Open Questions (still to nail down)

- What's the digital PR / link-building budget for Months 3+? Stack-side it's cheap to absorb the links; the spend is on outreach, agency or in-house resourcing
- Storyblok content-model change — who owns it (Imran vs engineering on the website repo)?
- Existing `noindex` pages — list and confirm intentional gating vs staging leak

# Monorepo & Lerna — Complete Guide

---

## 1. What is a Monorepo?

A **monorepo** (monolithic repository) is a single version-controlled repository that contains multiple projects, applications, or packages — all living together under one roof.

```
my-project/          ← single git repo
├── apps/
│   ├── main-app/    ← your main repo
│   └── chat-app/    ← your chat app
├── packages/        ← shared code
└── package.json
```

### Why Use a Monorepo?

**Benefits:**
- Shared code and utilities across projects without publishing to npm
- Single place for all issues, PRs, and history
- Atomic commits — one change can update multiple apps at once
- Easier dependency management across projects
- Unified CI/CD pipelines

**Tradeoffs:**
- Repo can grow large over time
- Build times can increase without proper tooling
- Requires discipline and tooling to manage well

---

## 2. Ways to Handle a Monorepo

There are **4 main approaches**, from simple to advanced:

---

### 2.1 Plain npm/yarn Workspaces (No Tool)

The most basic approach — built into npm/yarn natively.

```json
// root package.json
{
  "workspaces": ["apps/*", "packages/*"]
}
```

**Pros:** No extra tools needed, simple setup  
**Cons:** No task orchestration, no caching, runs everything every time  
**Best for:** Very small projects, 2–3 packages

---

### 2.2 Lerna

Lerna is one of the **oldest and most popular** monorepo management tools. It sits **on top of** npm/yarn workspaces and adds task running, versioning, and publishing.

```
your-project/
├── packages/
│   ├── main-app/
│   │   └── package.json
│   └── chat-app/
│       └── package.json
├── lerna.json
└── package.json
```

**Key Lerna concepts:**

| Feature | What it does |
|---|---|
| `lerna run build` | Runs `build` in all packages |
| `lerna run build --scope=chat-app` | Runs only in chat-app |
| `lerna version` | Bumps versions across packages |
| `lerna publish` | Publishes packages to npm |
| `nx-cloud` integration | Adds remote caching (modern Lerna) |

**lerna.json:**
```json
{
  "version": "independent",
  "npmClient": "yarn",
  "packages": ["apps/*", "packages/*"]
}
```

> ⚠️ **Important:** Modern Lerna (v6+) now uses **Nx under the hood** for task running. The old Lerna bootstrapping (`lerna bootstrap`) is deprecated — workspaces handle that now.

---

### 2.3 Turborepo

A modern, fast alternative to Lerna focused purely on **task orchestration and caching.**

```json
// turbo.json
{
  "pipeline": {
    "build": { "dependsOn": ["^build"], "outputs": ["dist/**"] },
    "dev":   { "cache": false }
  }
}
```

**Key advantage:** Aggressive local + remote caching — if nothing changed, it skips the task entirely.

**Pros:** Extremely fast, great DX, easy config  
**Cons:** No versioning/publishing (you'd use Changesets for that)  
**Best for:** Teams that care most about build speed

---

### 2.4 Nx

The most **feature-rich** monorepo tool. Has its own plugin ecosystem, code generators, dependency graph visualization, and cloud caching.

```bash
nx run-many --target=build --all
nx affected --target=test   # only test what changed
nx graph                    # visualize dependency graph
```

**Pros:** Incredibly powerful, smart affected detection, generators  
**Cons:** Steeper learning curve, more opinionated  
**Best for:** Large teams, enterprise projects

---

### 2.5 Side-by-Side Comparison

| Feature | npm Workspaces | Lerna | Turborepo | Nx |
|---|---|---|---|---|
| Dependency linking | ✅ | ✅ | ✅ | ✅ |
| Task orchestration | ❌ | ✅ | ✅ | ✅ |
| Local caching | ❌ | ✅ (via Nx) | ✅ | ✅ |
| Remote caching | ❌ | ✅ (Nx Cloud) | ✅ | ✅ |
| Versioning & publish | ❌ | ✅ | ❌ | ❌ |
| Code generators | ❌ | ❌ | ❌ | ✅ |
| Learning curve | Low | Low-Med | Low | High |

---

## 3. Why Lerna Isn't Always the Best Choice

The comparison table shows features Lerna has, but **having a feature ≠ doing it best.**

---

### 3.1 Turborepo Beats Lerna At — Speed & Simplicity

Turborepo's caching is **genuinely faster and smarter** than Lerna's out of the box.

```
# Turborepo - second run with no changes
Tasks:    10 successful, 10 total
Cached:   10 cached          ← skipped everything, instant
Time:     212ms              ← vs Lerna's 45 seconds
```

Turborepo was **built from scratch for caching** — it's its entire purpose. Lerna got caching later by borrowing Nx. So:

- If your team runs builds/tests frequently
- If CI/CD speed matters
- If you want zero-config performance

**Turborepo wins, not Lerna.**

---

### 3.2 Nx Beats Lerna At — Large Scale & Intelligence

Nx has features Lerna simply **doesn't have at all:**

```bash
nx affected --target=test
# → Only runs tests on packages affected by your git changes
# Lerna's --since is manual and less intelligent
```

```bash
nx graph
# → Visual interactive dependency graph of your entire monorepo
# Lerna has nothing like this
```

Nx also has **code generators** — you can scaffold a new app/library with one command and it wires everything up automatically. Lerna can't do this.

**Nx wins when:**
- Your monorepo will grow to 10+ packages
- You have a large team
- You want smart affected detection

---

### 3.3 Where Lerna Actually Wins — Versioning & Publishing

This is Lerna's **genuine** stronghold. If you're building and publishing npm packages, Lerna is purpose-built for it:

```bash
lerna version        # bumps versions, updates changelogs, creates git tags
lerna publish        # publishes all changed packages to npm
```

Neither Turborepo nor Nx has this built in.

```
Lerna     → versioning built in ✅
Turborepo → needs Changesets separately
Nx        → needs Changesets separately
```

---

### 3.4 Honest "Best For" Breakdown

| Situation | Best Tool |
|---|---|
| Small project, 2–3 apps, simple needs | npm Workspaces (no tool needed) |
| Publishing packages to npm | Lerna |
| Fast builds, great DX, simple config | Turborepo |
| Large team, 10+ packages, enterprise | Nx |
| Main app + chat app, internal project | Turborepo is arguably better |

---

## 4. Publishing Packages to npm with Lerna

### 4.1 The Concept

When you have a monorepo with multiple packages, you can **share those packages** via npm — just like how you install `lodash`, `axios`, or `react`.

```
Your Monorepo
├── packages/
│   ├── ui-components/     → published as @myorg/ui-components
│   ├── utils/             → published as @myorg/utils
│   └── api-client/        → published as @myorg/api-client
├── apps/
│   ├── main-app/          → NOT published (just an app)
│   └── chat-app/          → NOT published (just an app)
```

Anyone can then install your packages:
```bash
npm install @myorg/ui-components
```

---

### 4.2 The Two Core Lerna Commands

#### `lerna version` — Bumping Versions

```bash
npx lerna version
```

**What it does step by step:**
1. Looks at git commits since last release
2. Asks you what kind of bump (or auto-detects)
3. Updates package.json versions
4. Updates cross-dependencies between your packages
5. Creates a git commit + git tag
6. Pushes to your remote

**Interactive prompt:**
```
? Select a new version (currently 1.2.0)
❯ Patch (1.2.1)     ← bug fixes
  Minor (1.3.0)     ← new features, backward compatible
  Major (2.0.0)     ← breaking changes
  Custom
```

#### `lerna publish` — Pushing to npm

```bash
npx lerna publish
# Or do both in one shot:
npx lerna publish --conventional-commits
```

---

### 4.3 Two Versioning Strategies

#### Strategy 1 — Fixed Versioning (all packages same version)

```json
// lerna.json
{
  "version": "1.4.0"  // ← one version for ALL packages
}
```

```
@myorg/ui-components  → 1.4.0
@myorg/utils          → 1.4.0   (same always)
@myorg/api-client     → 1.4.0   (same always)
```

Even if only `utils` changed, all get bumped together. This is how **React** does it.

**Good when:** packages are tightly coupled, users expect them to match.

---

#### Strategy 2 — Independent Versioning (each package its own version)

```json
// lerna.json
{
  "version": "independent"
}
```

```
@myorg/ui-components  → 2.1.0
@myorg/utils          → 1.0.4   (only bumped if it changed)
@myorg/api-client     → 3.5.1
```

**Good when:** packages evolve at different rates, loosely coupled.

---

### 4.4 Conventional Commits — The Key to Automation

If your team writes commits in this format:

```bash
feat: add dark mode to button component      → Minor bump (1.x.0)
fix: resolve tooltip overflow bug            → Patch bump (1.0.x)
feat!: redesign API, remove old props        → Major bump (x.0.0)
chore: update readme                         → No bump
```

Then Lerna can **automatically decide** the version bump:

```bash
npx lerna version --conventional-commits
# No manual selection needed — reads your git history
```

It also **auto-generates a CHANGELOG.md:**
```markdown
## v2.1.0 (2026-04-18)

### Features
- add dark mode to button component

### Bug Fixes
- resolve tooltip overflow bug
```

---

### 4.5 Full Real-World Setup

**lerna.json:**
```json
{
  "version": "independent",
  "npmClient": "yarn",
  "packages": ["packages/*"],
  "command": {
    "version": {
      "conventionalCommits": true,
      "message": "chore(release): publish"
    },
    "publish": {
      "registry": "https://registry.npmjs.org"
    }
  }
}
```

**root package.json:**
```json
{
  "private": true,
  "workspaces": ["packages/*", "apps/*"],
  "scripts": {
    "release": "lerna publish --conventional-commits"
  }
}
```

**A publishable package — packages/utils/package.json:**
```json
{
  "name": "@myorg/utils",
  "version": "1.0.0",
  "main": "dist/index.js",
  "files": ["dist"],
  "publishConfig": {
    "access": "public"
  }
}
```

---

### 4.6 The Full Release Flow

```
Developer writes code
        ↓
git commit -m "feat: add search to chat-app"
        ↓
npx lerna version --conventional-commits
        ↓
Lerna reads commits → decides Minor bump
        ↓
Updates package.json  1.0.0 → 1.1.0
Updates CHANGELOG.md
Creates git commit + tag v1.1.0
Pushes to GitHub
        ↓
npx lerna publish from-git
        ↓
Publishes @myorg/utils@1.1.0 to npm registry
        ↓
Anyone can now:  npm install @myorg/utils@1.1.0
```

---

### 4.7 Cross-Package Dependency Update (The Magic Part)

Say `api-client` depends on `utils`:

```json
// packages/api-client/package.json
{
  "dependencies": {
    "@myorg/utils": "^1.0.0"
  }
}
```

When you bump `utils` to `1.1.0`, Lerna **automatically updates** `api-client`'s dependency before publishing — no manual hunting through files.

```
utils bumped 1.0.0 → 1.1.0
       ↓  Lerna auto-updates
api-client dependency → "@myorg/utils": "^1.1.0"
       ↓
Both published together correctly
```

Neither Turborepo nor Nx does this automatically.

---

### 4.8 Tips for Your Setup (main app + chat app)

```bash
# Run a script in all packages
npx lerna run dev

# Run only in your chat app
npx lerna run dev --scope=chat-app

# Run in parallel
npx lerna run build --parallel

# Only run in packages that changed (uses git diff)
npx lerna run test --since=main
```

**Shared packages between your apps:**

```
packages/
└── shared/          ← shared types, utils, components
    └── package.json ("name": "@myproject/shared")
```

Then in each app's `package.json`:
```json
{ "dependencies": { "@myproject/shared": "*" } }
```

Lerna + workspaces will **symlink** them locally — no publishing needed during development.

---

## 5. Final Summary

| Tool | Real Strength | Skip If |
|---|---|---|
| **npm Workspaces** | Zero setup, minimal projects | You need task orchestration |
| **Lerna** | npm publishing, versioning, changelogs | You're not publishing packages |
| **Turborepo** | Blazing fast builds, great caching | You need versioning/publishing |
| **Nx** | Enterprise scale, code gen, affected detection | Small team or simple project |

> **Key Insight:** Lerna's publishing power = version detection + changelog generation + cross-dependency syncing + npm publish — all in one command. For teams shipping public/private npm packages from a monorepo, this workflow alone justifies using Lerna over the alternatives.

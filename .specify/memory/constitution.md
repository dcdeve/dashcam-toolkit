<!--
SYNC IMPACT REPORT
==================
Version change: (template / unfilled) → 1.0.0
Ratification: 2026-03-20 (first adoption — template filled from project context)
Last amended:  2026-03-20

Principles added (new, no prior version):
  - I.   Core-First, Interface-Locked
  - II.  Dual-Surface Parity
  - III. Lossless by Default
  - IV.  Contract-First Testing
  - V.   Performance Budgets (NON-NEGOTIABLE)
  - VI.  Simplicity & YAGNI

Sections added:
  - Technology Stack Constraints
  - Quality Gates

Templates reviewed:
  - .specify/templates/plan-template.md       ✅ Compatible — Constitution Check section present
  - .specify/templates/spec-template.md       ✅ Compatible — FR/SC/user-story structure aligns
  - .specify/templates/tasks-template.md      ✅ Compatible — contract-test tasks and phase structure align
  - .specify/templates/checklist-template.md  ✅ Compatible — generic, no conflicts
  - .specify/templates/agent-file-template.md ✅ Compatible — auto-generated, no conflicts

Deferred TODOs:
  None — all placeholders resolved from project docs and git history.
-->

# dashcam-toolkit Constitution

## Core Principles

### I. Core-First, Interface-Locked

The `core` layer MUST be pure Node.js with zero dependencies on Electron, the
renderer, or any CLI framework. Every core module MUST expose its public contract
exclusively through its file in `src/interfaces/<module>.ts`. Consumers (CLI, IPC
handlers, tests) MUST import only from these interface files, never from module
implementation paths.

**Rationale**: Guarantees the core can be tested headlessly, reused across surfaces,
and evolved without ripple breakage across CLI and UI simultaneously.

### II. Dual-Surface Parity

Every capability exposed in the Electron UI MUST also be reachable via the CLI, and
vice versa. Neither surface may gate functionality that the other cannot access.
Both surfaces consume the same core modules — no surface-specific business logic is
permitted in `main/`, `preload/`, or `cli/`.

**Rationale**: Power users rely on the CLI for scripting; non-technical users rely
on the GUI. Parity ensures both audiences remain first-class throughout the project
lifecycle.

### III. Lossless by Default

Video export MUST default to lossless stream-copy concatenation. Re-encoding is
permitted ONLY when: (a) the user explicitly passes `--reencode` / selects a preset
in the UI, OR (b) the `trips` module detects a codec incompatibility that prevents
lossless concat. In case (b), the system MUST surface a clear warning and request
explicit user confirmation before proceeding with a destructive re-encode.

**Rationale**: Dashcam footage is original evidence; silent quality loss is
unacceptable. Lossless export also meets the `<30s for 1h trip` performance budget.

### IV. Contract-First Testing (NON-NEGOTIABLE)

Every public interface in `src/interfaces/` MUST have a corresponding contract test
in `tests/contracts/` before any implementation is merged. The Red-Green-Refactor
cycle MUST be followed: contract test written → test confirmed to fail → implementation
written → test passes. Unit tests in `tests/unit/` are required per module. E2E tests
in `tests/e2e/` cover full user journeys. `make test-contracts` MUST pass on every
commit.

**Rationale**: Contract tests are the canonical guard against interface drift between
the core modules and their consumers (CLI, IPC). They are the cheapest safety net
against integration regressions.

### V. Performance Budgets (NON-NEGOTIABLE)

The following hard limits MUST NOT regress across any release:

| Operation                          | Budget      |
| ---------------------------------- | ----------- |
| Import 500 clips (scan + probe)    | < 15 s      |
| Hover-scrub frame-to-frame latency | < 50 ms     |
| Lossless export of a 1-hour trip   | < 30 s      |
| RAM with a 2,000-clip library open | < 500 MB    |
| Dual-video-swap gap (UI player)    | < 100 ms    |

Any change that risks these budgets MUST include a benchmark result in the PR
description. Regressions block merge.

**Rationale**: The product competes on speed for power users and smoothness for
non-technical users; performance is a first-class feature, not an afterthought.

### VI. Simplicity & YAGNI

Implement at the minimum complexity required for the current requirement. Do not
design for hypothetical future requirements. Three similar lines of code are
preferable to a premature abstraction. New modules or layers MUST be justified with
a concrete, present-tense use case — organizational-only groupings are not accepted.

**Rationale**: The codebase serves two audiences and spans four layers (core, CLI,
Electron main, renderer); accidental complexity compounds across all four. Simplicity
is the primary tool for keeping the system maintainable.

## Technology Stack Constraints

The following technology choices are locked for the current major version. Changes
require an RFC documented in `plans/` with rationale and migration plan before any
implementation begins.

| Component       | Locked Choice                                      |
| --------------- | -------------------------------------------------- |
| Runtime         | Node.js >= 20, TypeScript (ES2022 target)          |
| CLI framework   | Commander.js v14 + @commander-js/extra-typings     |
| Database        | SQLite via better-sqlite3 + Drizzle ORM            |
| FFmpeg          | ffmpeg-static (MVP); OS/arch auto-download (prod)  |
| FFmpeg invocation | `child_process.spawn` directly — no fluent-ffmpeg |
| UI runtime      | Electron + React + electron-vite (dev/build)       |
| Test runner     | Vitest (`make test`, `make test-contracts`)        |
| Lint / Format   | ESLint v10 + Prettier (enforced via `make check`)  |
| Pre-commit hooks | Husky v9                                          |

`db` is the ONLY module that MUST touch SQLite directly. `ffmpeg` is the ONLY module
that MUST spawn FFmpeg/FFprobe child processes. No other module may bypass these
boundaries.

## Quality Gates

All of the following MUST pass before a branch is merged into `master`:

1. **Pre-commit** — Husky runs lint + format check automatically on `make commit`.
2. **`make check`** — Runs ESLint, Prettier check, TypeScript (`tsc --noEmit`),
   and the full Vitest suite (unit + contract + e2e).
3. **Contract tests** — `make test-contracts` MUST pass independently, verifying
   all `src/interfaces/` contracts.
4. **No new bracket tokens** — No `[PLACEHOLDER]` tokens may appear in any
   `.specify/memory/` or `specs/` artifact at merge time.
5. **Performance benchmark** — Required in PR description for any change touching
   the scanner, exporter, thumbnail generator, or renderer rendering path.

Complexity violations of Principle VI MUST be documented in the plan's
`Complexity Tracking` table before implementation begins.

## Governance

This constitution supersedes all other development guidelines for the dashcam-toolkit
project. Any practice not covered here defaults to the principle of Simplicity (VI).

**Amendment procedure**:
1. Open a PR with the proposed change to this file and a completed Sync Impact Report.
2. Bump `CONSTITUTION_VERSION` following semantic versioning:
   - MAJOR — backward-incompatible governance change, principle removal, or redefinition.
   - MINOR — new principle or section added, or materially expanded guidance.
   - PATCH — clarification, wording fix, non-semantic refinement.
3. Propagate changes to all dependent templates (plan, spec, tasks, checklist) in the
   same PR; mark each as ✅ in the Sync Impact Report.
4. Merge requires at least one explicit acknowledgement from the primary maintainer.

**Compliance review**: Every feature plan MUST include a "Constitution Check" section
(see `.specify/templates/plan-template.md`) that confirms each principle is satisfied
or documents a justified exception in the plan's Complexity Tracking table.

For runtime development guidance, refer to `CLAUDE.md` (not tracked in git; generated
locally by `make setup` or the Claude Code agent context).

**Version**: 1.0.0 | **Ratified**: 2026-03-20 | **Last Amended**: 2026-03-20

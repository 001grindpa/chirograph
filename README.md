# Chirograph

Chirograph is a dated milestone grant escrow desk for GenLayer StudioNet. A funder creates the grant, funds sequential tranches in GEN, and the builder posts evidence pages before review is opened and the contract decides whether to release funds or refund the funder.

## Contract

- **StudioNet contract address**: `0x0457a41D55729cf56a92E1048b1eB8F1D2471f4F`
- **Chain ID**: `61999` (`0xf22f`)
- **RPC URL**: `https://studio.genlayer.com/api`
- **Explorer**: `https://explorer-studio.genlayer.com/address/0x0457a41D55729cf56a92E1048b1eB8F1D2471f4F`

## Live StudioNet Lifecycle

The following live transaction hashes and accepted state outputs demonstrate the complete lifecycle on GenLayer StudioNet.

### Transaction Hashes

| Method | Transaction Hash | Explorer Link |
|---|---|---|
| `create_grant` | `0xbc6126224136678327df8214a5f119f7ca12be04ea3e1b39828b5b6fc22ad358` | [View on Explorer](https://explorer-studio.genlayer.com/tx/0xbc6126224136678327df8214a5f119f7ca12be04ea3e1b39828b5b6fc22ad358) |
| `fund_tranche` | `0xfa64e43be7ff596e1740924976a44eb7e5cf3cfb2e65c0ae76a382c76135c345` | [View on Explorer](https://explorer-studio.genlayer.com/tx/0xfa64e43be7ff596e1740924976a44eb7e5cf3cfb2e65c0ae76a382c76135c345) |
| `update_evidence` | `0xc4ea04439c2c2f6d2b388b1fc5ff03cb96813bfb35bb159bbca966eb1baebef8` | [View on Explorer](https://explorer-studio.genlayer.com/tx/0xc4ea04439c2c2f6d2b388b1fc5ff03cb96813bfb35bb159bbca966eb1baebef8) |
| `open_review` | `0x546e8f4d9b4b0e515faea3b9e4a3c2005470732dfd50d03dd87593c28cb9e577` | [View on Explorer](https://explorer-studio.genlayer.com/tx/0x546e8f4d9b4b0e515faea3b9e4a3c2005470732dfd50d03dd87593c28cb9e577) |
| `release` | `0xa927c92b95764d9f783688179f826315ee9d53c292f7ea894bcff75b7f7535b9` | [View on Explorer](https://explorer-studio.genlayer.com/tx/0xa927c92b95764d9f783688179f826315ee9d53c292f7ea894bcff75b7f7535b9) |
| `expire_review` | `0xee560f8df7e5bb94760a9f029ce37ebc483a936a2dfa4f028bfdf381cb2eeef5` | [View on Explorer](https://explorer-studio.genlayer.com/tx/0xee560f8df7e5bb94760a9f029ce37ebc483a936a2dfa4f028bfdf381cb2eeef5) |
| `clawback` | `0xdbd3a39e80a0fe0b77fa8f609e9db6f9f3beeb255b6ef19f9661413158c54ca5` | [View on Explorer](https://explorer-studio.genlayer.com/tx/0xdbd3a39e80a0fe0b77fa8f609e9db6f9f3beeb255b6ef19f9661413158c54ca5) |

### Accepted State Readouts (`stateStatus: "accepted"`)

#### `get_grant` (Grant ID: 2)
```json
{
  "builder": "0xb69752fC9A3215D39967e8Ea471D12fF6b1319c5",
  "funder": "0xbA5d46Beb2f01f808796856525164d12F0174457",
  "next_tranche_id": "2",
  "released_count": "0",
  "spec_text": "Deliver modular execution engine with cross-platform verification.",
  "spec_url_a": "https://github.com/expressjs/express/blob/master/Readme.md",
  "spec_url_b": "https://gitlab.com/gitlab-org/gitlab/-/blob/master/README.md",
  "status": "OPEN",
  "title": "Developer Tooling Grant"
}
```

#### `get_tranche` (Grant ID: 2, Tranche: 1)
```json
{
  "amount": "1000000000000000000",
  "evidence_url_a": "https://github.com/expressjs/express/pull/1",
  "evidence_url_b": "https://codeberg.org/forgejo/forgejo/src/branch/main/README.md",
  "funds_disposition": "RESERVED",
  "grant_id": "2",
  "milestone_date": "2026-09-26",
  "milestone_text": "Milestone 1: Core state engine delivery",
  "review_opened_unix": "0",
  "status": "RESERVED",
  "tranche_index": "1",
  "verdict": "UNKNOWN"
}
```

#### `get_grant` (Grant ID: 3 - Clawed Back)
```json
{
  "builder": "0xb69752fC9A3215D39967e8Ea471D12fF6b1319c5",
  "funder": "0xbA5d46Beb2f01f808796856525164d12F0174457",
  "next_tranche_id": "2",
  "released_count": "0",
  "spec_text": "Grant demonstrating funder clawback of reserved unreleased tranche.",
  "spec_url_a": "https://github.com/expressjs/express/blob/master/Readme.md",
  "spec_url_b": "https://gitlab.com/gitlab-org/gitlab/-/blob/master/README.md",
  "status": "CLOSED",
  "title": "Clawback Grant Desk"
}
```

#### `get_tranche` (Grant ID: 3, Tranche: 1 - Clawed Back)
```json
{
  "amount": "500000000000000000",
  "evidence_url_a": "https://github.com/expressjs/express/blob/master/Readme.md",
  "evidence_url_b": "https://gitlab.com/gitlab-org/gitlab/-/blob/master/README.md",
  "funds_disposition": "REFUNDED_TO_FUNDER",
  "grant_id": "3",
  "milestone_date": "2026-09-26",
  "milestone_text": "Milestone 1: Reserved Tranche to be Clawed Back",
  "review_opened_unix": "0",
  "status": "CANCELLED",
  "tranche_index": "1",
  "verdict": ""
}
```

## How to run the app

This project is a static frontend, so no backend setup is required.

1. From the project root, start a local web server:
   ```bash
   python3 -m http.server 8000
   ```
2. Open the page in a browser:
   ```
   http://localhost:8000/
   ```
3. Connect a wallet on StudioNet, then switch to chain `61999` if needed.

## Running Tests

Run the frontend test suite:
```bash
npm test
```
or run directly with Node:
```bash
node --experimental-network-imports --test test/frontend/app.test.js
```

## Funder path

A funder can:
- create a grant with a builder, title, spec text, and two public spec URLs
- fund the next sequential tranche with GEN and milestone metadata
- open review for a reserved tranche
- release, expire review, or claw back funds when the contract allows
- inspect grant and tranche state

## Builder path

A builder can:
- be named in the grant at creation time
- update evidence pages before review is opened
- wait for the contract to decide whether the milestone is valid and whether funds should pay them

## Allowed hosts

The frontend matches the contract allowlist for public URLs:
- `github.com`
- `gist.github.com`
- `raw.githubusercontent.com`
- `gitlab.com`
- `bitbucket.org`
- `codeberg.org`
- `sr.ht`
- `git.sr.ht`
- `readthedocs.io`
- `readthedocs.org`
- `gitbook.io`

All public URLs must use HTTPS, and spec/evidence pairs must come from different hosts.

## Contract note

The logic and source of truth for the grant flow live under `/src`. That contract is intentionally untouched as part of the frontend-only build.
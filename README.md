# Chirograph

Chirograph is a dated milestone grant escrow desk for GenLayer StudioNet. A funder creates the grant, funds sequential tranches in GEN, and the builder posts evidence pages before review is opened and the contract decides whether to release funds or refund the funder.

## Contract

- **StudioNet contract address**: `0x0457a41D55729cf56a92E1048b1eB8F1D2471f4F`
- **Chain ID**: `61999` (`0xf22f`)
- **RPC URL**: `https://studio.genlayer.com/api`
- **Explorer**: `https://explorer-studio.genlayer.com/address/0x0457a41D55729cf56a92E1048b1eB8F1D2471f4F`

## Live StudioNet Lifecycle

The following live StudioNet transactions show grant creation, funding, evidence update, and review opening.

### Transaction Hashes

| Method | Transaction Hash | Explorer Link |
|---|---|---|
| `create_grant` | `0x21318970918c5f81102d46a1872c4894a4e81c91cada7e2e97f7c04c0b4feee1` | [View on Explorer](https://explorer-studio.genlayer.com/tx/0x21318970918c5f81102d46a1872c4894a4e81c91cada7e2e97f7c04c0b4feee1) |
| `fund_tranche` | `0xa8ff99fe217f9dffc447866ea6c1703299975407e633e6309a097238975e58b8` | [View on Explorer](https://explorer-studio.genlayer.com/tx/0xa8ff99fe217f9dffc447866ea6c1703299975407e633e6309a097238975e58b8) |
| `update_evidence` | `0xa04262e94e1383f8c85a95c9d49f4240dfd652f5e07ff67bce0ae9ec429ee297` | [View on Explorer](https://explorer-studio.genlayer.com/tx/0xa04262e94e1383f8c85a95c9d49f4240dfd652f5e07ff67bce0ae9ec429ee297) |
| `open_review` | `0x7e3a3beb4ab8263c4c1155813dbc822aadf817e953d9f369de06fa1f1a2d9c3a` | [View on Explorer](https://explorer-studio.genlayer.com/tx/0x7e3a3beb4ab8263c4c1155813dbc822aadf817e953d9f369de06fa1f1a2d9c3a) |

### Accepted State Readouts (`stateStatus: "accepted"`)

#### `get_grant` (Grant ID: 4)
```json
{
  "builder": "0xB69752fc9A3215D39967E8eA471D12FF6b1319C5",
  "funder": "0x8282B51f90DE07F1279cA36f0f559C5D7733BEd3",
  "next_tranche_id": "2",
  "released_count": "0",
  "spec_text": "Builder publishes dated milestone notes on two independent hosts. Both pages must name this grant and include the builder address.",
  "spec_url_a": "https://github.com/expressjs/express/blob/master/Readme.md",
  "spec_url_b": "https://gitlab.com/gitlab-org/gitlab/-/blob/master/README.md",
  "status": "OPEN",
  "title": "StudioNet indenture desk"
}
```

Tranche 1 is funded, and review was opened on this grant. `release`, `expire_review`, and `clawback` were not run on this same grant because clawback is blocked while review is live.

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

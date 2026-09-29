# Chirograph

Chirograph is a dated milestone grant escrow desk for GenLayer StudioNet. A funder creates the grant, funds sequential tranches in GEN, and the builder posts evidence pages before review is opened and the contract decides whether to release funds or refund the funder.

## Contract

- **StudioNet contract address**: `0x0199AB1bdB266CAe443CE43Df0D21e796702D72E`
- **Chain ID**: `61999` (`0xf22f`)
- **RPC URL**: `https://studio.genlayer.com/api`
- **Explorer**: `https://explorer-studio.genlayer.com/address/0x0199AB1bdB266CAe443CE43Df0D21e796702D72E`

## Live StudioNet Lifecycle

### Transaction Hashes

| Grant | Method | Transaction Hash | Explorer Link |
|---|---|---|---|
| Payout-proof grant | `create_grant` | `0xe5a9a453be0db465aced5745658b6c745d6ab950c042da95c44f9a07eec00cc4` | [View on Explorer](https://explorer-studio.genlayer.com/tx/0xe5a9a453be0db465aced5745658b6c745d6ab950c042da95c44f9a07eec00cc4) |
| Payout-proof grant | `fund_tranche` | `0x8889fd10a0e7683772123b0aa6e6d0d5f12b642e26c597de813c60f9f719810d` | [View on Explorer](https://explorer-studio.genlayer.com/tx/0x8889fd10a0e7683772123b0aa6e6d0d5f12b642e26c597de813c60f9f719810d) |
| Payout-proof grant | `open_review` | `0x7cc56995b5dd131892312e9b223945f0cffde0855fc6ff3630cad964947aef5a` | [View on Explorer](https://explorer-studio.genlayer.com/tx/0x7cc56995b5dd131892312e9b223945f0cffde0855fc6ff3630cad964947aef5a) |
| Payout-proof grant | `release` | `0x8e02ca1c441075d7be3e60ada9c750ec779b5afb1b862a2e5c9a568d2c20caa9` | [View on Explorer](https://explorer-studio.genlayer.com/tx/0x8e02ca1c441075d7be3e60ada9c750ec779b5afb1b862a2e5c9a568d2c20caa9) |
| Clawback-proof grant | `create_grant` | `0xa6c1b9f7cbf24fb61c7ffd6148faea8956588058683487ab677e83d706473013` | [View on Explorer](https://explorer-studio.genlayer.com/tx/0xa6c1b9f7cbf24fb61c7ffd6148faea8956588058683487ab677e83d706473013) |
| Clawback-proof grant | `fund_tranche` | `0x32d681c45ccbd3590f09afdd3177ffce938a6c2c743caa53930861e051cbf5b3` | [View on Explorer](https://explorer-studio.genlayer.com/tx/0x32d681c45ccbd3590f09afdd3177ffce938a6c2c743caa53930861e051cbf5b3) |
| Clawback-proof grant | `clawback` | `0xce228015243405da447425892405990eee78c0c6fd9eebaa1fb1b073238f1aec` | [View on Explorer](https://explorer-studio.genlayer.com/tx/0xce228015243405da447425892405990eee78c0c6fd9eebaa1fb1b073238f1aec) |

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

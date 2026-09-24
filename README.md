# Chirograph

Chirograph is a dated milestone grant escrow desk for GenLayer StudioNet. A funder creates the grant, funds sequential tranches in GEN, and the builder posts evidence pages before review is opened and the contract decides whether to release funds or refund the funder.

## Contract

StudioNet contract address:
0x0457a41D55729cf56a92E1048b1eB8F1D2471f4F

Explorer:
https://explorer-studio.genlayer.com/address/0x0457a41D55729cf56a92E1048b1eB8F1D2471f4F

## How to run the app

This project is a static frontend, so no backend or framework setup is required.

1. From the project root, start a local web server:
   python3 -m http.server 8000
2. Open the page in a browser:
   http://localhost:8000/
3. Connect a wallet on StudioNet, then switch to chain 61999 if needed.

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
- github.com
- gist.github.com
- raw.githubusercontent.com
- gitlab.com
- bitbucket.org
- codeberg.org
- sr.ht
- git.sr.ht
- readthedocs.io
- readthedocs.org
- gitbook.io

All public URLs must use HTTPS, and spec/evidence pairs must come from different hosts.

## Contract note

The logic and source of truth for the grant flow live under /src. That contract is intentionally left alone as part of the frontend-only build.

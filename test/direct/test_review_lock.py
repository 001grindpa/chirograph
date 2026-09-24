CONTRACT = "src/MilestoneGrantEscrow.py"

SPEC_A = "https://github.com/expressjs/express/blob/master/Readme.md"
SPEC_B = "https://gitlab.com/gitlab-org/gitlab/-/blob/master/README.md"
EVIDENCE_A = "https://github.com/expressjs/express/releases/tag/v1.0.0"
EVIDENCE_B = "https://gitlab.com/gitlab-org/gitlab/-/releases/v1.0.0"


def _open_reserved(contract, direct_vm, direct_alice, direct_bob, with_evidence=True):
    direct_vm.sender = direct_alice
    grant_id = contract.create_grant(
        str(direct_bob),
        "Ship the public API",
        "Builder must publish the dated milestone notes and link the release.",
        SPEC_A,
        SPEC_B,
    )
    contract.fund_tranche(
        grant_id,
        "Publish v1 notes with the builder address on both pages.",
        "2026-09-01",
        EVIDENCE_A if with_evidence else "",
        EVIDENCE_B if with_evidence else "",
        value=10**18,
    )
    return grant_id


def test_cannot_review_without_evidence(
    direct_vm, direct_deploy, direct_alice, direct_bob
):
    contract = direct_deploy(CONTRACT)
    grant_id = _open_reserved(
        contract, direct_vm, direct_alice, direct_bob, with_evidence=False
    )
    with direct_vm.expect_revert("both evidence urls are required before review"):
        contract.open_review(grant_id, 1)


def test_clawback_blocked_while_review_live(
    direct_vm, direct_deploy, direct_alice, direct_bob
):
    contract = direct_deploy(CONTRACT)
    grant_id = _open_reserved(contract, direct_vm, direct_alice, direct_bob)
    contract.open_review(grant_id, 1)

    pending = contract.get_tranche(grant_id, 1)
    assert "PENDING_REVIEW" in pending

    direct_vm.sender = direct_alice
    with direct_vm.expect_revert("cannot claw back while a live review is pending"):
        contract.clawback(grant_id, 1)

    with direct_vm.expect_revert("review timeout has not passed"):
        contract.expire_review(grant_id, 1)

    with direct_vm.expect_revert("only a reserved tranche can change evidence"):
        contract.update_evidence(grant_id, 1, EVIDENCE_A, EVIDENCE_B)


def test_non_funder_cannot_clawback(
    direct_vm, direct_deploy, direct_alice, direct_bob
):
    contract = direct_deploy(CONTRACT)
    grant_id = _open_reserved(contract, direct_vm, direct_alice, direct_bob)
    direct_vm.sender = direct_bob
    with direct_vm.expect_revert("only the funder can claw back"):
        contract.clawback(grant_id, 1)


def test_funder_can_clawback_reserved_tranche(
    direct_vm, direct_deploy, direct_alice, direct_bob
):
    contract = direct_deploy(CONTRACT)
    grant_id = _open_reserved(contract, direct_vm, direct_alice, direct_bob)
    direct_vm.sender = direct_alice
    contract.clawback(grant_id, 1)
    grant = contract.get_grant(grant_id)
    tranche = contract.get_tranche(grant_id, 1)
    assert "CLOSED" in grant
    assert "CANCELLED" in tranche
    assert "REFUNDED_TO_FUNDER" in tranche
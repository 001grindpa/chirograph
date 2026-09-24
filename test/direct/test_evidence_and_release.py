import json

CONTRACT = "src/MilestoneGrantEscrow.py"

SPEC_A = "https://github.com/expressjs/express/blob/master/Readme.md"
SPEC_B = "https://gitlab.com/gitlab-org/gitlab/-/blob/master/README.md"
EVIDENCE_A = "https://github.com/expressjs/express/releases/tag/v1.0.0"
EVIDENCE_B = "https://gitlab.com/gitlab-org/gitlab/-/releases/v1.0.0"


def _builder_hex(contract, grant_id):
    return json.loads(contract.get_grant(grant_id))["builder"].lower()


def _pending(contract, direct_vm, direct_alice, direct_bob):
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
        "",
        "",
        value=10**18,
    )
    direct_vm.sender = direct_bob
    contract.update_evidence(grant_id, 1, EVIDENCE_A, EVIDENCE_B)
    contract.open_review(grant_id, 1)
    return grant_id


def test_release_without_review_reverts(
    direct_vm, direct_deploy, direct_alice, direct_bob
):
    contract = direct_deploy(CONTRACT)
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
        EVIDENCE_A,
        EVIDENCE_B,
        value=10**18,
    )
    with direct_vm.expect_revert("tranche must be in review to release"):
        contract.release(grant_id, 1)


def test_fetch_failure_reopens_tranche(
    direct_vm, direct_deploy, direct_alice, direct_bob
):
    contract = direct_deploy(CONTRACT)
    grant_id = _pending(contract, direct_vm, direct_alice, direct_bob)

    def boom(*_args, **_kwargs):
        raise RuntimeError("fetch failed")

    contract._extract_page = boom
    contract.release(grant_id, 1)
    after = contract.get_tranche(grant_id, 1)
    assert "RESERVED" in after
    assert "PAID_TO_BUILDER" not in after


def test_missing_builder_binding_does_not_pay(
    direct_vm, direct_deploy, direct_alice, direct_bob
):
    contract = direct_deploy(CONTRACT)
    grant_id = _pending(contract, direct_vm, direct_alice, direct_bob)

    def page(_url, _spec, _milestone, _date):
        return {
            "date_match": True,
            "related": True,
            "fulfilled": True,
            "answer": "YES",
            "page_text": "release notes with no wallet",
            "fetch_ok": True,
        }

    contract._extract_page = page
    contract.release(grant_id, 1)
    after = contract.get_tranche(grant_id, 1)
    assert "PAID_TO_BUILDER" not in after
    assert "RESERVED" in after


def test_yes_with_binding_pays_builder(
    direct_vm, direct_deploy, direct_alice, direct_bob
):
    contract = direct_deploy(CONTRACT)
    grant_id = _pending(contract, direct_vm, direct_alice, direct_bob)
    builder_hex = _builder_hex(contract, grant_id)

    def page(_url, _spec, _milestone, _date):
        return {
            "date_match": True,
            "related": True,
            "fulfilled": True,
            "answer": "YES",
            "page_text": f"milestone complete for {builder_hex}",
            "fetch_ok": True,
        }

    contract._extract_page = page
    verdict = contract.release(grant_id, 1)
    after = contract.get_tranche(grant_id, 1)
    assert "YES" in str(verdict)
    assert "RELEASED" in after
    assert "PAID_TO_BUILDER" in after
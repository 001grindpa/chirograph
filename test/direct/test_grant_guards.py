CONTRACT = "src/MilestoneGrantEscrow.py"

SPEC_A = "https://github.com/expressjs/express/blob/master/Readme.md"
SPEC_B = "https://gitlab.com/gitlab-org/gitlab/-/blob/master/README.md"


def _create_grant(contract, builder):
    return contract.create_grant(
        str(builder),
        "Ship the public API",
        "Builder must publish the dated milestone notes and link the release.",
        SPEC_A,
        SPEC_B,
    )


def test_funder_cannot_be_builder(direct_vm, direct_deploy, direct_alice):
    contract = direct_deploy(CONTRACT)
    direct_vm.sender = direct_alice
    with direct_vm.expect_revert("funder and builder must be different"):
        contract.create_grant(
            str(direct_alice),
            "Ship the public API",
            "Builder must publish the dated milestone notes and link the release.",
            SPEC_A,
            SPEC_B,
        )


def test_spec_hosts_must_differ(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract = direct_deploy(CONTRACT)
    direct_vm.sender = direct_alice
    with direct_vm.expect_revert("spec sources must come from two different hosts"):
        contract.create_grant(
            str(direct_bob),
            "Ship the public API",
            "Builder must publish the dated milestone notes and link the release.",
            SPEC_A,
            "https://github.com/expressjs/express/issues/1",
        )


def test_only_funder_can_fund_and_amount_required(
    direct_vm, direct_deploy, direct_alice, direct_bob
):
    contract = direct_deploy(CONTRACT)
    direct_vm.sender = direct_alice
    grant_id = _create_grant(contract, direct_bob)

    direct_vm.sender = direct_bob
    with direct_vm.expect_revert("only the funder can add a tranche"):
        contract.fund_tranche(
            grant_id,
            "Publish v1 notes with the builder address on both pages.",
            "2026-09-01",
            "",
            "",
            value=10**18,
        )

    direct_vm.sender = direct_alice
    with direct_vm.expect_revert("tranche amount must be greater than zero"):
        contract.fund_tranche(
            grant_id,
            "Publish v1 notes with the builder address on both pages.",
            "2026-09-01",
            "",
            "",
            value=0,
        )


def test_cannot_fund_second_tranche_before_first_releases(
    direct_vm, direct_deploy, direct_alice, direct_bob
):
    contract = direct_deploy(CONTRACT)
    direct_vm.sender = direct_alice
    grant_id = _create_grant(contract, direct_bob)
    contract.fund_tranche(
        grant_id,
        "Publish v1 notes with the builder address on both pages.",
        "2026-09-01",
        "",
        "",
        value=10**18,
    )
    with direct_vm.expect_revert("fund the next sequential tranche only"):
        contract.fund_tranche(
            grant_id,
            "Publish v2 notes with the builder address on both pages.",
            "2026-10-01",
            "",
            "",
            value=10**18,
        )
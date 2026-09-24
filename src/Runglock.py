# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

import json
import re
from dataclasses import dataclass
from datetime import datetime, timezone
from urllib.parse import urlparse

from genlayer import *


DATE_RE = r"^[0-9]{4}-[0-9]{2}-[0-9]{2}$"
HTTPS = "https://"
MAX_PAGE_CHARS = 12000
MIN_TEXT_CHARS = 12
REVIEW_TIMEOUT_SECS = 3600
ZERO = Address("0x0000000000000000000000000000000000000000")
ADDR_RE = re.compile(r"0x[a-fA-F0-9]{40}")

ALLOWED_HOSTS = (
    "github.com",
    "www.github.com",
    "gist.github.com",
    "raw.githubusercontent.com",
    "gitlab.com",
    "www.gitlab.com",
    "bitbucket.org",
    "www.bitbucket.org",
    "codeberg.org",
    "www.codeberg.org",
    "sr.ht",
    "git.sr.ht",
    "readthedocs.io",
    "readthedocs.org",
    "gitbook.io",
    "www.gitbook.io",
)


def _now() -> int:
    return int(datetime.now(timezone.utc).timestamp())


def _host(url: str) -> str:
    return (urlparse(url).hostname or "").lower()


def _host_allowed(url: str) -> bool:
    host = _host(url)
    if not host:
        return False
    for allowed in ALLOWED_HOSTS:
        base = allowed[4:] if allowed.startswith("www.") else allowed
        if host == allowed or host == base or host.endswith("." + base):
            return True
    return False


def _require_https_url(url: str, label: str) -> str:
    cleaned = url.strip()
    if not cleaned.lower().startswith(HTTPS):
        raise gl.vm.UserError(f"{label} must be an https url")
    if not _host_allowed(cleaned):
        raise gl.vm.UserError(f"{label} host is not on the evidence allowlist")
    return cleaned


def _norm_addr(value: str) -> str:
    match = ADDR_RE.search(value or "")
    if match is None:
        return ""
    return match.group(0).lower()


def _pay(to: Address, amount: u256) -> None:
    if amount == 0:
        return
    gl.get_contract_at(to).emit_transfer(value=amount, on="finalized")


@allow_storage
@dataclass
class Grant:
    funder: Address
    builder: Address
    title: str
    spec_text: str
    spec_url_a: str
    spec_url_b: str
    next_tranche_id: u256
    released_count: u256
    status: str


@allow_storage
@dataclass
class Tranche:
    grant_id: str
    tranche_index: u256
    milestone_text: str
    milestone_date: str
    evidence_url_a: str
    evidence_url_b: str
    amount: u256
    status: str
    verdict: str
    funds_disposition: str
    review_opened_unix: u256


class MilestoneGrantEscrow(gl.Contract):
    grants: TreeMap[str, Grant]
    tranches: TreeMap[str, Tranche]
    next_grant_id: u256
    reserved_funds: u256

    def __init__(self):
        self.next_grant_id = u256(1)
        self.reserved_funds = u256(0)

    def _grant_id(self) -> str:
        return str(int(self.next_grant_id))

    def _tranche_key(self, grant_id: str, tranche_index: u256) -> str:
        return grant_id + ":" + str(int(tranche_index))

    def _get_grant(self, grant_id: str) -> Grant:
        if grant_id not in self.grants:
            raise gl.vm.UserError("grant not found")
        return self.grants[grant_id]

    def _get_tranche(self, grant_id: str, tranche_index: u256) -> Tranche:
        key = self._tranche_key(grant_id, tranche_index)
        if key not in self.tranches:
            raise gl.vm.UserError("tranche not found")
        return self.tranches[key]

    def _review_expired(self, tranche: Tranche) -> bool:
        if tranche.status != "PENDING_REVIEW":
            return False
        opened = int(tranche.review_opened_unix)
        if opened == 0:
            return True
        return _now() >= opened + REVIEW_TIMEOUT_SECS

    def _reopen(self, tranche: Tranche, verdict: str) -> None:
        tranche.status = "RESERVED"
        tranche.verdict = verdict
        tranche.funds_disposition = "RESERVED"
        tranche.review_opened_unix = u256(0)

    def _require_evidence_pair(self, url_a: str, url_b: str) -> tuple[str, str]:
        a = _require_https_url(url_a, "evidence_url_a")
        b = _require_https_url(url_b, "evidence_url_b")
        if _host(a) == _host(b):
            raise gl.vm.UserError("evidence sources must come from two different hosts")
        return a, b

    def _extract_page(
        self,
        url: str,
        spec_text: str,
        milestone_text: str,
        milestone_date: str,
    ) -> dict:
        failed = {
            "date_match": False,
            "related": False,
            "fulfilled": False,
            "answer": "UNKNOWN",
            "page_text": "",
            "fetch_ok": False,
        }
        try:
            raw = gl.nondet.web.render(url, mode="text")
            page_text = raw if isinstance(raw, str) else str(raw)
            page_text = page_text[:MAX_PAGE_CHARS]
        except Exception:
            return failed

        prompt = f"""
Decide whether one public page corroborates a dated grant milestone.

Grant spec:
{spec_text}

Milestone:
{milestone_text}

Required calendar date (YYYY-MM-DD): {milestone_date}
Source URL: {url}

Page text:
{page_text}

Return JSON only with exactly these fields:
{{
  "date_match": true or false,
  "related": true or false,
  "fulfilled": true or false,
  "answer": "YES" or "NO" or "UNKNOWN"
}}
Rules:
- date_match is true only if the page is about that calendar day or a release dated that day.
- related is true only if the page is about this grant spec / milestone.
- fulfilled is true only if the page shows the milestone work exists.
- answer is YES only if date_match and related and fulfilled.
- answer is NO if the page is related and dated but the milestone is clearly not met.
- answer is UNKNOWN if the page is incomplete, off-topic, undated, or inconclusive.
"""
        try:
            parsed = gl.nondet.exec_prompt(prompt, response_format="json")
            if isinstance(parsed, str):
                parsed = json.loads(parsed)
        except Exception:
            failed["page_text"] = page_text
            failed["fetch_ok"] = True
            return failed

        date_match = bool(parsed.get("date_match", False))
        related = bool(parsed.get("related", False))
        fulfilled = bool(parsed.get("fulfilled", False))
        answer = str(parsed.get("answer", "UNKNOWN")).upper()
        if answer not in ("YES", "NO", "UNKNOWN"):
            answer = "UNKNOWN"
        if not date_match or not related:
            answer = "UNKNOWN"
            fulfilled = False
        if answer == "YES" and not fulfilled:
            answer = "UNKNOWN"
        return {
            "date_match": date_match,
            "related": related,
            "fulfilled": fulfilled,
            "answer": answer,
            "page_text": page_text,
            "fetch_ok": True,
        }

    def _decision_from_pages(self, grant: Grant, tranche: Tranche) -> dict:
        builder_hex = grant.builder.as_hex.lower()
        try:
            page_a = self._extract_page(
                tranche.evidence_url_a,
                grant.spec_text,
                tranche.milestone_text,
                tranche.milestone_date,
            )
            page_b = self._extract_page(
                tranche.evidence_url_b,
                grant.spec_text,
                tranche.milestone_text,
                tranche.milestone_date,
            )
        except Exception:
            return {
                "verdict": "UNKNOWN",
                "pages_ok": False,
                "builder_bound": False,
            }

        pages_ok = bool(page_a["fetch_ok"] and page_b["fetch_ok"])
        builder_bound = builder_hex != "" and (
            builder_hex in (page_a.get("page_text") or "").lower()
            or builder_hex in (page_b.get("page_text") or "").lower()
        )

        if (
            not pages_ok
            or not page_a["date_match"]
            or not page_b["date_match"]
            or not page_a["related"]
            or not page_b["related"]
            or page_a["answer"] == "UNKNOWN"
            or page_b["answer"] == "UNKNOWN"
        ):
            verdict = "UNKNOWN"
        elif page_a["answer"] != page_b["answer"]:
            verdict = "DISAGREE"
        else:
            verdict = page_a["answer"]

        if verdict == "YES" and (not pages_ok or not builder_bound):
            verdict = "UNKNOWN"

        return {
            "verdict": verdict,
            "pages_ok": pages_ok,
            "builder_bound": builder_bound,
        }

    def _adjudicate(self, grant: Grant, tranche: Tranche) -> dict:
        def leader_fn() -> str:
            decision = self._decision_from_pages(grant, tranche)
            return json.dumps(
                {
                    "verdict": decision["verdict"],
                    "pages_ok": decision["pages_ok"],
                    "builder_bound": decision["builder_bound"],
                },
                sort_keys=True,
                separators=(",", ":"),
            )

        def validator_fn(leader_result) -> bool:
            if isinstance(leader_result, Exception):
                return False
            payload = leader_result
            if hasattr(leader_result, "calldata"):
                payload = leader_result.calldata
            if isinstance(payload, (bytes, bytearray)):
                payload = payload.decode("utf-8", errors="replace")
            if not isinstance(payload, str):
                payload = str(payload)
            try:
                leader = json.loads(payload)
            except Exception:
                return False
            own = self._decision_from_pages(grant, tranche)
            return (
                own["verdict"] == str(leader.get("verdict", "")).upper()
                and bool(own["pages_ok"]) == bool(leader.get("pages_ok"))
                and bool(own["builder_bound"]) == bool(leader.get("builder_bound"))
            )

        raw = gl.vm.run_nondet_unsafe(leader_fn, validator_fn)
        if isinstance(raw, str):
            return json.loads(raw)
        if hasattr(raw, "calldata"):
            data = raw.calldata
            return json.loads(data if isinstance(data, str) else str(data))
        return json.loads(str(raw))

    @gl.public.write
    def create_grant(
        self,
        builder: str,
        title: str,
        spec_text: str,
        spec_url_a: str,
        spec_url_b: str,
    ) -> str:
        if not title.strip():
            raise gl.vm.UserError("title is required")
        if len(spec_text.strip()) < MIN_TEXT_CHARS:
            raise gl.vm.UserError("spec_text is too short")
        builder_addr = Address(builder)
        if builder_addr == ZERO:
            raise gl.vm.UserError("builder is required")
        if builder_addr == gl.message.sender_address:
            raise gl.vm.UserError("funder and builder must be different")
        url_a = _require_https_url(spec_url_a, "spec_url_a")
        url_b = _require_https_url(spec_url_b, "spec_url_b")
        if _host(url_a) == _host(url_b):
            raise gl.vm.UserError("spec sources must come from two different hosts")

        grant_id = self._grant_id()
        self.grants[grant_id] = Grant(
            funder=gl.message.sender_address,
            builder=builder_addr,
            title=title.strip(),
            spec_text=spec_text.strip(),
            spec_url_a=url_a,
            spec_url_b=url_b,
            next_tranche_id=u256(1),
            released_count=u256(0),
            status="OPEN",
        )
        self.next_grant_id = self.next_grant_id + u256(1)
        return grant_id

    @gl.public.write.payable
    def fund_tranche(
        self,
        grant_id: str,
        milestone_text: str,
        milestone_date: str,
        evidence_url_a: str,
        evidence_url_b: str,
    ) -> str:
        grant = self._get_grant(grant_id)
        if grant.status != "OPEN":
            raise gl.vm.UserError("grant is not open")
        if gl.message.sender_address != grant.funder:
            raise gl.vm.UserError("only the funder can add a tranche")
        if len(milestone_text.strip()) < MIN_TEXT_CHARS:
            raise gl.vm.UserError("milestone_text is too short")
        if re.match(DATE_RE, milestone_date.strip()) is None:
            raise gl.vm.UserError("milestone_date must be YYYY-MM-DD")
        amount = gl.message.value
        if amount == u256(0):
            raise gl.vm.UserError("tranche amount must be greater than zero")

        url_a = evidence_url_a.strip()
        url_b = evidence_url_b.strip()
        if url_a != "" or url_b != "":
            url_a, url_b = self._require_evidence_pair(url_a, url_b)

        expected = grant.released_count + u256(1)
        if grant.next_tranche_id != expected:
            raise gl.vm.UserError("fund the next sequential tranche only")

        tranche_index = grant.next_tranche_id
        key = self._tranche_key(grant_id, tranche_index)
        self.tranches[key] = Tranche(
            grant_id=grant_id,
            tranche_index=tranche_index,
            milestone_text=milestone_text.strip(),
            milestone_date=milestone_date.strip(),
            evidence_url_a=url_a,
            evidence_url_b=url_b,
            amount=amount,
            status="RESERVED",
            verdict="",
            funds_disposition="RESERVED",
            review_opened_unix=u256(0),
        )
        grant.next_tranche_id = tranche_index + u256(1)
        self.grants[grant_id] = grant
        self.reserved_funds = self.reserved_funds + amount
        return str(int(tranche_index))

    @gl.public.write
    def update_evidence(
        self,
        grant_id: str,
        tranche_index: u256,
        evidence_url_a: str,
        evidence_url_b: str,
    ) -> None:
        grant = self._get_grant(grant_id)
        tranche = self._get_tranche(grant_id, tranche_index)
        sender = gl.message.sender_address
        if sender != grant.funder and sender != grant.builder:
            raise gl.vm.UserError("only funder or builder can update evidence")
        if tranche.status != "RESERVED":
            raise gl.vm.UserError("only a reserved tranche can change evidence")
        url_a, url_b = self._require_evidence_pair(evidence_url_a, evidence_url_b)
        tranche.evidence_url_a = url_a
        tranche.evidence_url_b = url_b
        self.tranches[self._tranche_key(grant_id, tranche_index)] = tranche

    @gl.public.write
    def open_review(self, grant_id: str, tranche_index: u256) -> None:
        grant = self._get_grant(grant_id)
        tranche = self._get_tranche(grant_id, tranche_index)
        if grant.status != "OPEN":
            raise gl.vm.UserError("grant is not open")
        if tranche.status != "RESERVED":
            raise gl.vm.UserError("tranche is not reserved")
        if tranche_index != grant.released_count + u256(1):
            raise gl.vm.UserError("review tranches in order")
        if tranche.evidence_url_a == "" or tranche.evidence_url_b == "":
            raise gl.vm.UserError("both evidence urls are required before review")
        tranche.status = "PENDING_REVIEW"
        tranche.review_opened_unix = u256(_now())
        tranche.verdict = "UNRESOLVED"
        self.tranches[self._tranche_key(grant_id, tranche_index)] = tranche

    @gl.public.write
    def release(self, grant_id: str, tranche_index: u256) -> str:
        grant = self._get_grant(grant_id)
        tranche = self._get_tranche(grant_id, tranche_index)
        if grant.status != "OPEN":
            raise gl.vm.UserError("grant is not open")
        if tranche.status != "PENDING_REVIEW":
            raise gl.vm.UserError("tranche must be in review to release")
        if tranche_index != grant.released_count + u256(1):
            raise gl.vm.UserError("release tranches in order")

        result = self._adjudicate(grant, tranche)
        verdict = str(result.get("verdict", "UNKNOWN")).upper()
        amount = tranche.amount
        key = self._tranche_key(grant_id, tranche_index)

        if verdict == "YES" and bool(result.get("pages_ok")) and bool(result.get("builder_bound")):
            tranche.status = "RELEASED"
            tranche.verdict = "YES"
            tranche.funds_disposition = "PAID_TO_BUILDER"
            tranche.review_opened_unix = u256(0)
            grant.released_count = grant.released_count + u256(1)
            self.reserved_funds = self.reserved_funds - amount
            self.tranches[key] = tranche
            self.grants[grant_id] = grant
            _pay(grant.builder, amount)
        elif verdict == "NO":
            tranche.status = "REJECTED"
            tranche.verdict = "NO"
            tranche.funds_disposition = "REFUNDED_TO_FUNDER"
            tranche.review_opened_unix = u256(0)
            grant.status = "CLOSED"
            self.reserved_funds = self.reserved_funds - amount
            self.tranches[key] = tranche
            self.grants[grant_id] = grant
            _pay(grant.funder, amount)
        else:
            self._reopen(
                tranche,
                verdict if verdict in ("UNKNOWN", "DISAGREE") else "UNKNOWN",
            )
            self.tranches[key] = tranche
        return tranche.verdict

    @gl.public.write
    def expire_review(self, grant_id: str, tranche_index: u256) -> None:
        tranche = self._get_tranche(grant_id, tranche_index)
        if tranche.status != "PENDING_REVIEW":
            raise gl.vm.UserError("tranche is not in review")
        if not self._review_expired(tranche):
            raise gl.vm.UserError("review timeout has not passed")
        self._reopen(tranche, "EXPIRED")
        self.tranches[self._tranche_key(grant_id, tranche_index)] = tranche

    @gl.public.write
    def clawback(self, grant_id: str, tranche_index: u256) -> None:
        grant = self._get_grant(grant_id)
        tranche = self._get_tranche(grant_id, tranche_index)
        if gl.message.sender_address != grant.funder:
            raise gl.vm.UserError("only the funder can claw back")
        if tranche.status == "PENDING_REVIEW":
            if not self._review_expired(tranche):
                raise gl.vm.UserError("cannot claw back while a live review is pending")
        elif tranche.status != "RESERVED":
            raise gl.vm.UserError("only a reserved tranche can be clawed back")
        amount = tranche.amount
        tranche.status = "CANCELLED"
        tranche.funds_disposition = "REFUNDED_TO_FUNDER"
        tranche.review_opened_unix = u256(0)
        grant.status = "CLOSED"
        self.reserved_funds = self.reserved_funds - amount
        self.tranches[self._tranche_key(grant_id, tranche_index)] = tranche
        self.grants[grant_id] = grant
        _pay(grant.funder, amount)

    @gl.public.view
    def get_grant(self, grant_id: str) -> str:
        grant = self._get_grant(grant_id)
        return json.dumps(
            {
                "funder": grant.funder.as_hex,
                "builder": grant.builder.as_hex,
                "title": grant.title,
                "spec_text": grant.spec_text,
                "spec_url_a": grant.spec_url_a,
                "spec_url_b": grant.spec_url_b,
                "next_tranche_id": str(int(grant.next_tranche_id)),
                "released_count": str(int(grant.released_count)),
                "status": grant.status,
            },
            sort_keys=True,
        )

    @gl.public.view
    def get_tranche(self, grant_id: str, tranche_index: u256) -> str:
        tranche = self._get_tranche(grant_id, tranche_index)
        return json.dumps(
            {
                "grant_id": tranche.grant_id,
                "tranche_index": str(int(tranche.tranche_index)),
                "milestone_text": tranche.milestone_text,
                "milestone_date": tranche.milestone_date,
                "evidence_url_a": tranche.evidence_url_a,
                "evidence_url_b": tranche.evidence_url_b,
                "amount": str(int(tranche.amount)),
                "status": tranche.status,
                "verdict": tranche.verdict,
                "funds_disposition": tranche.funds_disposition,
                "review_opened_unix": str(int(tranche.review_opened_unix)),
            },
            sort_keys=True,
        )

    @gl.public.view
    def get_grant_count(self) -> str:
        return str(int(self.next_grant_id) - 1)

    @gl.public.view
    def get_reserved_funds(self) -> str:
        return str(int(self.reserved_funds))
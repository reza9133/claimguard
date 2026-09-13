"""
Unit-test suite for contracts/claimguard.py using the genlayer-test direct
runner (in-memory GenVM, no Docker / network required beyond one-time SDK
download).

Run with:
    python3 -m pytest test/test_claimguard.py -q
    # or, if the gltest CLI is on PATH:
    gltest test/test_claimguard.py

The SDK version is pinned explicitly (see SDK_VERSION below) so test runs
are reproducible and don't depend on whatever GitHub happens to tag
"latest" on a given day.
"""
from __future__ import annotations

import hashlib
import json
from pathlib import Path

import pytest

CONTRACT = str(Path(__file__).parent.parent / "contracts" / "claimguard.py")
SDK_VERSION = "v0.2.12"

# ── addresses ────────────────────────────────────────────────────────────────
# Raw bytes computed up front (same algorithm gltest.direct.loader.create_address
# uses); wrapped into a real SDK Address lazily, after the SDK has been loaded
# by the first deploy in a test (mirrors the pattern used across the GenLayer
# test suites — Address can only be imported once sys.path has the SDK on it).

_CREATOR_BYTES = hashlib.sha256(b"pool_creator").digest()[:20]
_ALICE_BYTES = hashlib.sha256(b"alice_member").digest()[:20]
_BOB_BYTES = hashlib.sha256(b"bob_member").digest()[:20]
_OTHER_BYTES = hashlib.sha256(b"other_stranger").digest()[:20]


def _addr(raw: bytes):
    from genlayer.py.types import Address  # type: ignore[import]
    return Address(raw)


# ── standard AI responses ─────────────────────────────────────────────────────

def _verdict(covered: bool, percent: int = 0, reasoning: str = "test reasoning", red_flags=None) -> str:
    return json.dumps({
        "covered": covered,
        "payout_percent": percent,
        "reasoning": reasoning,
        "red_flags": red_flags or [],
    })


APPROVE_FULL = _verdict(True, 100, "Evidence fully substantiates the claim.")
APPROVE_PARTIAL_60 = _verdict(True, 60, "Evidence partially substantiates the claim.")
DENY = _verdict(False, 0, "Evidence does not support this claim.")

# A generic pool coverage-terms string long enough to pass the 30-char minimum.
TERMS = (
    "Covers accidental physical damage to the insured item, evidenced by a "
    "clear photo of the damage and/or a supporting tracking or repair-quote URL. "
    "Excludes pre-existing damage and intentional destruction."
)


_POOL_AMOUNT_FIELDS = ("premium", "max_payout_per_claim", "balance", "total_paid_out", "total_donated")
_CLAIM_AMOUNT_FIELDS = ("requested_amount", "payout_amount")


def _pool_json(c, pool_id: int) -> dict:
    """Loads a pool and casts its wei-scale amount fields (stored as JSON
    strings in the contract -- see claimguard.py's Design Notes -- to avoid
    float64 precision loss on the JS side) back to Python ints for easy
    comparison in assertions."""
    pool = json.loads(c.get_pool(pool_id))
    for f in _POOL_AMOUNT_FIELDS:
        if f in pool:
            pool[f] = int(pool[f])
    return pool


def _claim_json(c, claim_id: int) -> dict:
    """Same idea as _pool_json, for claim records."""
    claim = json.loads(c.get_claim(claim_id))
    for f in _CLAIM_AMOUNT_FIELDS:
        if f in claim:
            claim[f] = int(claim[f])
    return claim


# ── shared fixture-style helpers ───────────────────────────────────────────────

def _deploy(direct_vm, direct_deploy):
    """Deploy the contract with the creator as the initial sender."""
    direct_vm.sender = _CREATOR_BYTES
    return direct_deploy(CONTRACT, sdk_version=SDK_VERSION)


def _create_pool(
    c,
    name="Gadget Breakdown Cover",
    description=TERMS,
    premium=1_000,
    period_days=30,
    max_payout=500,
    max_claims=2,
) -> int:
    return c.create_pool(name, description, premium, period_days, max_payout, max_claims)


def _join(direct_vm, c, member_bytes: bytes, pool_id: int, premium: int) -> None:
    direct_vm.sender = member_bytes
    direct_vm.value = premium
    c.join_pool(pool_id)
    direct_vm.value = 0


# ══════════════════════════════════════════════════════════════════════════════
# Pool creation
# ══════════════════════════════════════════════════════════════════════════════

class TestCreatePool:
    def test_creates_pool_with_correct_fields(self, direct_deploy, direct_vm):
        c = _deploy(direct_vm, direct_deploy)
        pool_id = _create_pool(c)
        assert pool_id == 0

        pool = _pool_json(c, 0)
        assert pool["name"] == "Gadget Breakdown Cover"
        assert pool["premium"] == 1_000
        assert pool["coverage_period_days"] == 30
        assert pool["max_payout_per_claim"] == 500
        assert pool["max_claims_per_member_per_period"] == 2
        assert pool["balance"] == 0
        assert pool["member_count"] == 0
        assert pool["active"] is True
        assert pool["creator"] == _addr(_CREATOR_BYTES).as_hex

    def test_increments_pool_count(self, direct_deploy, direct_vm):
        c = _deploy(direct_vm, direct_deploy)
        assert c.get_pool_count() == 0
        _create_pool(c)
        assert c.get_pool_count() == 1
        _create_pool(c, name="Second Pool")
        assert c.get_pool_count() == 2

    def test_sequential_pool_ids(self, direct_deploy, direct_vm):
        c = _deploy(direct_vm, direct_deploy)
        assert _create_pool(c, name="Pool A") == 0
        assert _create_pool(c, name="Pool B") == 1
        assert _create_pool(c, name="Pool C") == 2

    def test_rejects_short_name(self, direct_vm, direct_deploy):
        c = _deploy(direct_vm, direct_deploy)
        with direct_vm.expect_revert("at least 3 characters"):
            c.create_pool("ab", TERMS, 1000, 30, 500, 2)

    def test_rejects_short_description(self, direct_vm, direct_deploy):
        c = _deploy(direct_vm, direct_deploy)
        with direct_vm.expect_revert("at least 30 characters"):
            c.create_pool("Pool", "too short", 1000, 30, 500, 2)

    def test_rejects_zero_premium(self, direct_vm, direct_deploy):
        c = _deploy(direct_vm, direct_deploy)
        with direct_vm.expect_revert("Premium must be positive"):
            c.create_pool("Pool", TERMS, 0, 30, 500, 2)

    def test_rejects_bad_period(self, direct_vm, direct_deploy):
        c = _deploy(direct_vm, direct_deploy)
        with direct_vm.expect_revert("Coverage period"):
            c.create_pool("Pool", TERMS, 1000, 0, 500, 2)
        with direct_vm.expect_revert("Coverage period"):
            c.create_pool("Pool", TERMS, 1000, 400, 500, 2)

    def test_rejects_zero_max_payout(self, direct_vm, direct_deploy):
        c = _deploy(direct_vm, direct_deploy)
        with direct_vm.expect_revert("Max payout per claim must be positive"):
            c.create_pool("Pool", TERMS, 1000, 30, 0, 2)

    def test_rejects_bad_max_claims(self, direct_vm, direct_deploy):
        c = _deploy(direct_vm, direct_deploy)
        with direct_vm.expect_revert("Max claims per member"):
            c.create_pool("Pool", TERMS, 1000, 30, 500, 0)
        with direct_vm.expect_revert("Max claims per member"):
            c.create_pool("Pool", TERMS, 1000, 30, 500, 101)

    def test_get_all_pools(self, direct_deploy, direct_vm):
        c = _deploy(direct_vm, direct_deploy)
        _create_pool(c, name="Pool A")
        _create_pool(c, name="Pool B")
        pools = json.loads(c.get_all_pools())
        assert [p["name"] for p in pools] == ["Pool A", "Pool B"]


# ══════════════════════════════════════════════════════════════════════════════
# Pool funding / activation
# ══════════════════════════════════════════════════════════════════════════════

class TestTopUpAndActivation:
    def test_top_up_increases_balance(self, direct_deploy, direct_vm):
        c = _deploy(direct_vm, direct_deploy)
        _create_pool(c)
        direct_vm.sender = _OTHER_BYTES
        direct_vm.deal(_OTHER_BYTES, 10**24)
        direct_vm.value = 5_000
        c.top_up_pool(0)
        direct_vm.value = 0
        pool = _pool_json(c, 0)
        assert pool["balance"] == 5_000
        assert pool["total_donated"] == 5_000

    def test_top_up_requires_value(self, direct_deploy, direct_vm):
        c = _deploy(direct_vm, direct_deploy)
        _create_pool(c)
        with direct_vm.expect_revert("Must send GEN"):
            c.top_up_pool(0)

    def test_only_creator_can_toggle_active(self, direct_deploy, direct_vm):
        c = _deploy(direct_vm, direct_deploy)
        _create_pool(c)
        direct_vm.sender = _ALICE_BYTES
        with direct_vm.expect_revert("Only the pool creator"):
            c.set_pool_active(0, False)

    def test_paused_pool_blocks_new_joins(self, direct_deploy, direct_vm):
        c = _deploy(direct_vm, direct_deploy)
        _create_pool(c)
        direct_vm.sender = _CREATOR_BYTES
        c.set_pool_active(0, False)

        direct_vm.deal(_ALICE_BYTES, 10**24)
        direct_vm.sender = _ALICE_BYTES
        direct_vm.value = 1_000
        with direct_vm.expect_revert("not accepting new members"):
            c.join_pool(0)
        direct_vm.value = 0

    def test_pausing_does_not_strip_existing_coverage(self, direct_deploy, direct_vm):
        c = _deploy(direct_vm, direct_deploy)
        _create_pool(c)
        direct_vm.deal(_ALICE_BYTES, 10**24)
        _join(direct_vm, c, _ALICE_BYTES, 0, 1_000)

        direct_vm.sender = _CREATOR_BYTES
        c.set_pool_active(0, False)

        assert c.is_covered(0, _addr(_ALICE_BYTES).as_hex) is True


# ══════════════════════════════════════════════════════════════════════════════
# Membership / policies
# ══════════════════════════════════════════════════════════════════════════════

class TestMembership:
    def test_join_creates_active_policy(self, direct_deploy, direct_vm):
        c = _deploy(direct_vm, direct_deploy)
        _create_pool(c, premium=1_000, period_days=30)
        direct_vm.deal(_ALICE_BYTES, 10**24)
        _join(direct_vm, c, _ALICE_BYTES, 0, 1_000)

        alice_hex = _addr(_ALICE_BYTES).as_hex
        policy = json.loads(c.get_policy(0, alice_hex))
        assert policy["active"] is True
        assert policy["claims_this_period"] == 0
        assert c.is_covered(0, alice_hex) is True

        pool = _pool_json(c, 0)
        assert pool["member_count"] == 1
        assert pool["balance"] == 1_000

    def test_join_requires_exact_premium(self, direct_deploy, direct_vm):
        c = _deploy(direct_vm, direct_deploy)
        _create_pool(c, premium=1_000)
        direct_vm.deal(_ALICE_BYTES, 10**24)
        direct_vm.sender = _ALICE_BYTES
        direct_vm.value = 500
        with direct_vm.expect_revert("exactly"):
            c.join_pool(0)
        direct_vm.value = 1_500
        with direct_vm.expect_revert("exactly"):
            c.join_pool(0)
        direct_vm.value = 0

    def test_renew_extends_from_current_expiry_not_now(self, direct_deploy, direct_vm):
        c = _deploy(direct_vm, direct_deploy)
        _create_pool(c, premium=1_000, period_days=30)
        direct_vm.deal(_ALICE_BYTES, 10**24)
        _join(direct_vm, c, _ALICE_BYTES, 0, 1_000)
        alice_hex = _addr(_ALICE_BYTES).as_hex
        first_expiry = json.loads(c.get_policy(0, alice_hex))["expires_at_ts"]

        # Renew again immediately (well before expiry).
        _join(direct_vm, c, _ALICE_BYTES, 0, 1_000)
        second_expiry = json.loads(c.get_policy(0, alice_hex))["expires_at_ts"]

        assert second_expiry == first_expiry + 30 * 86400

    def test_cancel_policy_deactivates_coverage(self, direct_deploy, direct_vm):
        c = _deploy(direct_vm, direct_deploy)
        _create_pool(c)
        direct_vm.deal(_ALICE_BYTES, 10**24)
        _join(direct_vm, c, _ALICE_BYTES, 0, 1_000)

        direct_vm.sender = _ALICE_BYTES
        c.cancel_policy(0)
        assert c.is_covered(0, _addr(_ALICE_BYTES).as_hex) is False

    def test_cancel_without_policy_reverts(self, direct_deploy, direct_vm):
        c = _deploy(direct_vm, direct_deploy)
        _create_pool(c)
        direct_vm.sender = _ALICE_BYTES
        with direct_vm.expect_revert("No active policy"):
            c.cancel_policy(0)

    def test_double_cancel_reverts(self, direct_deploy, direct_vm):
        c = _deploy(direct_vm, direct_deploy)
        _create_pool(c)
        direct_vm.deal(_ALICE_BYTES, 10**24)
        _join(direct_vm, c, _ALICE_BYTES, 0, 1_000)
        direct_vm.sender = _ALICE_BYTES
        c.cancel_policy(0)
        with direct_vm.expect_revert("No active policy"):
            c.cancel_policy(0)


# ══════════════════════════════════════════════════════════════════════════════
# Claims — the AI-adjudication core
# ══════════════════════════════════════════════════════════════════════════════

class TestFileClaim:
    def _covered_member(self, direct_deploy, direct_vm, premium=1_000, period_days=30, max_payout=500, max_claims=2):
        c = _deploy(direct_vm, direct_deploy)
        _create_pool(c, premium=premium, period_days=period_days, max_payout=max_payout, max_claims=max_claims)
        direct_vm.deal(_ALICE_BYTES, 10**24)
        _join(direct_vm, c, _ALICE_BYTES, 0, premium)
        direct_vm.sender = _ALICE_BYTES
        return c

    def test_requires_active_policy(self, direct_deploy, direct_vm):
        c = _deploy(direct_vm, direct_deploy)
        _create_pool(c)
        direct_vm.sender = _ALICE_BYTES
        with direct_vm.expect_revert("do not have an active policy"):
            c.file_claim(0, "a perfectly valid claim description", 100, "https://e.com/x")

    def test_requires_some_evidence(self, direct_deploy, direct_vm):
        c = self._covered_member(direct_deploy, direct_vm)
        with direct_vm.expect_revert("Provide at least a photo"):
            c.file_claim(0, "a perfectly valid claim description", 100, "", b"")

    def test_rejects_short_description(self, direct_deploy, direct_vm):
        c = self._covered_member(direct_deploy, direct_vm)
        with direct_vm.expect_revert("at least 15 characters"):
            c.file_claim(0, "too short", 100, "https://e.com/x")

    def test_rejects_zero_amount(self, direct_deploy, direct_vm):
        c = self._covered_member(direct_deploy, direct_vm)
        with direct_vm.expect_revert("Requested amount must be positive"):
            c.file_claim(0, "a perfectly valid claim description", 0, "https://e.com/x")

    def test_approved_claim_pays_out_and_updates_stats(self, direct_deploy, direct_vm):
        c = self._covered_member(direct_deploy, direct_vm, max_payout=500)
        direct_vm.mock_llm(r".*", APPROVE_FULL)
        direct_vm.mock_web(r".*", {"status": 200, "body": "Tracking page confirms damage."})

        claim_id = c.file_claim(0, "My package arrived crushed and unusable.", 400, "https://track.example.com/1")
        assert claim_id == 0

        claim = _claim_json(c, 0)
        assert claim["status"] == "approved"
        assert claim["ai_covered"] is True
        assert claim["payout_amount"] == 400  # 100% of min(400, 500, pool balance)

        pool = _pool_json(c, 0)
        assert pool["claims_filed"] == 1
        assert pool["claims_approved"] == 1
        assert pool["total_paid_out"] == 400
        assert pool["balance"] == 1_000 - 400  # started with one premium payment

    def test_partial_payout_uses_ai_percent(self, direct_deploy, direct_vm):
        c = self._covered_member(direct_deploy, direct_vm, max_payout=1_000)
        direct_vm.mock_llm(r".*", APPROVE_PARTIAL_60)
        direct_vm.mock_web(r".*", {"status": 200, "body": "partial evidence"})

        claim_id = c.file_claim(0, "Partially damaged item, evidence is ambiguous.", 1_000, "https://e.com/x")
        claim = _claim_json(c, claim_id)
        assert claim["payout_amount"] == 600  # 60% of 1000

    def test_denied_claim_pays_nothing(self, direct_deploy, direct_vm):
        c = self._covered_member(direct_deploy, direct_vm)
        direct_vm.mock_llm(r".*", DENY)
        direct_vm.mock_web(r".*", {"status": 200, "body": "unrelated content"})

        claim_id = c.file_claim(0, "My package arrived crushed and unusable.", 400, "https://e.com/x")
        claim = _claim_json(c, claim_id)
        assert claim["status"] == "denied"
        assert claim["payout_amount"] == 0

        pool = _pool_json(c, 0)
        assert pool["claims_denied"] == 1
        assert pool["balance"] == 1_000  # untouched

    def test_payout_capped_by_max_payout_per_claim(self, direct_deploy, direct_vm):
        c = self._covered_member(direct_deploy, direct_vm, premium=5_000, max_payout=300)
        direct_vm.mock_llm(r".*", APPROVE_FULL)  # 100%, but requested 10000
        direct_vm.mock_web(r".*", {"status": 200, "body": "x"})

        claim_id = c.file_claim(0, "Very expensive item completely destroyed.", 10_000, "https://e.com/x")
        claim = _claim_json(c, claim_id)
        assert claim["payout_amount"] == 300  # capped by max_payout_per_claim, not requested_amount

    def test_payout_capped_by_pool_balance(self, direct_deploy, direct_vm):
        # Only one premium payment (100) in the pool, but max_payout allows far more.
        c = self._covered_member(direct_deploy, direct_vm, premium=100, max_payout=10_000)
        direct_vm.mock_llm(r".*", APPROVE_FULL)
        direct_vm.mock_web(r".*", {"status": 200, "body": "x"})

        claim_id = c.file_claim(0, "Claim bigger than the whole pool balance.", 10_000, "https://e.com/x")
        claim = _claim_json(c, claim_id)
        assert claim["payout_amount"] == 100  # pool only has 100 in it
        pool = _pool_json(c, 0)
        assert pool["balance"] == 0

    def test_claim_limit_per_period_enforced(self, direct_deploy, direct_vm):
        c = self._covered_member(direct_deploy, direct_vm, max_claims=1)
        direct_vm.mock_llm(r".*", DENY)
        direct_vm.mock_web(r".*", {"status": 200, "body": "x"})
        c.file_claim(0, "First claim of the period right here.", 100, "https://e.com/1")
        with direct_vm.expect_revert("Claim limit reached"):
            c.file_claim(0, "Second claim same period should fail.", 100, "https://e.com/2")

    def test_claim_limit_resets_next_period(self, direct_deploy, direct_vm):
        c = self._covered_member(direct_deploy, direct_vm, period_days=1, max_claims=1)
        direct_vm.mock_llm(r".*", DENY)
        direct_vm.mock_web(r".*", {"status": 200, "body": "x"})
        c.file_claim(0, "First claim of the period right here.", 100, "https://e.com/1")

        # Renew coverage several times (still at "real now") so it stays
        # active well past the point where the *claim-counting* window
        # rolls over — renewing extends expires_at_ts but deliberately
        # does NOT reset period_started_at_ts early; only the passage of
        # a full period does that.
        for _ in range(5):
            _join(direct_vm, c, _ALICE_BYTES, 0, 1_000)

        alice_hex = _addr(_ALICE_BYTES).as_hex
        started = json.loads(c.get_policy(0, alice_hex))["period_started_at_ts"]
        period_seconds = 1 * 86400

        from datetime import datetime, timezone
        target = started + int(period_seconds * 1.5)
        direct_vm.warp(datetime.fromtimestamp(target, tz=timezone.utc).isoformat())

        # Should succeed now that the counting window has rolled over,
        # while coverage itself (extended by the renewals above) is
        # still comfortably active.
        c.file_claim(0, "Second claim, next period, should work.", 100, "https://e.com/2")

        policy = json.loads(c.get_policy(0, alice_hex))
        assert policy["claims_this_period"] == 1
        assert policy["claims_filed"] == 2

    def test_expired_coverage_blocks_claim(self, direct_deploy, direct_vm):
        c = self._covered_member(direct_deploy, direct_vm, period_days=1)
        direct_vm.warp("2099-06-01T00:00:00+00:00")
        with direct_vm.expect_revert("coverage has expired"):
            c.file_claim(0, "This should fail, coverage lapsed.", 100, "https://e.com/x")

    def test_claim_isolated_per_pool_balance(self, direct_deploy, direct_vm):
        """A payout from pool 0 must never touch pool 1's balance."""
        c = _deploy(direct_vm, direct_deploy)
        _create_pool(c, name="Pool A", premium=1_000, max_payout=1_000)
        _create_pool(c, name="Pool B", premium=1_000, max_payout=1_000)

        direct_vm.deal(_ALICE_BYTES, 10**24)
        _join(direct_vm, c, _ALICE_BYTES, 0, 1_000)
        _join(direct_vm, c, _ALICE_BYTES, 1, 1_000)

        direct_vm.sender = _ALICE_BYTES
        direct_vm.mock_llm(r".*", APPROVE_FULL)
        direct_vm.mock_web(r".*", {"status": 200, "body": "x"})
        c.file_claim(0, "Claim only against pool A here.", 800, "https://e.com/x")

        pool_a = _pool_json(c, 0)
        pool_b = _pool_json(c, 1)
        assert pool_a["balance"] == 1_000 - 800
        assert pool_b["balance"] == 1_000  # untouched


# ══════════════════════════════════════════════════════════════════════════════
# Appeals
# ══════════════════════════════════════════════════════════════════════════════

class TestAppealClaim:
    def _denied_claim(self, direct_deploy, direct_vm, max_payout=1_000):
        c = _deploy(direct_vm, direct_deploy)
        _create_pool(c, premium=2_000, max_payout=max_payout, max_claims=5)
        direct_vm.deal(_ALICE_BYTES, 10**24)
        _join(direct_vm, c, _ALICE_BYTES, 0, 2_000)
        direct_vm.sender = _ALICE_BYTES
        direct_vm.mock_llm(r".*", DENY)
        direct_vm.mock_web(r".*", {"status": 200, "body": "x"})
        claim_id = c.file_claim(0, "Initial claim that gets denied here.", 800, "https://e.com/x")
        return c, claim_id

    def test_appeal_can_flip_to_approved(self, direct_deploy, direct_vm):
        c, claim_id = self._denied_claim(direct_deploy, direct_vm)
        direct_vm.clear_mocks()
        direct_vm.mock_llm(r".*", APPROVE_PARTIAL_60)
        c.appeal_claim(claim_id, "Here is additional supporting context.")

        claim = _claim_json(c, claim_id)
        assert claim["status"] == "approved"
        assert claim["appeal_used"] is True
        assert claim["payout_amount"] == 480  # 60% of 800

        pool = _pool_json(c, 0)
        assert pool["claims_filed"] == 1
        assert pool["claims_approved"] == 1
        assert pool["claims_denied"] == 0  # moved out of denied, not double-counted

    def test_only_claimant_can_appeal(self, direct_deploy, direct_vm):
        c, claim_id = self._denied_claim(direct_deploy, direct_vm)
        direct_vm.sender = _OTHER_BYTES
        with direct_vm.expect_revert("Only the claimant"):
            c.appeal_claim(claim_id, "Trying to appeal someone else's claim.")

    def test_cannot_appeal_approved_claim(self, direct_deploy, direct_vm):
        c = _deploy(direct_vm, direct_deploy)
        _create_pool(c, premium=1_000, max_payout=500, max_claims=5)
        direct_vm.deal(_ALICE_BYTES, 10**24)
        _join(direct_vm, c, _ALICE_BYTES, 0, 1_000)
        direct_vm.sender = _ALICE_BYTES
        direct_vm.mock_llm(r".*", APPROVE_FULL)
        direct_vm.mock_web(r".*", {"status": 200, "body": "x"})
        claim_id = c.file_claim(0, "This claim will be approved outright.", 100, "https://e.com/x")

        with direct_vm.expect_revert("Only denied claims"):
            c.appeal_claim(claim_id, "There is nothing to appeal here.")

    def test_cannot_appeal_twice(self, direct_deploy, direct_vm):
        c, claim_id = self._denied_claim(direct_deploy, direct_vm)
        direct_vm.clear_mocks()
        direct_vm.mock_llm(r".*", DENY)
        c.appeal_claim(claim_id, "First appeal, still gets denied sadly.")
        with direct_vm.expect_revert("already been appealed"):
            c.appeal_claim(claim_id, "Second appeal attempt should fail.")

    def test_appeal_requires_context(self, direct_deploy, direct_vm):
        c, claim_id = self._denied_claim(direct_deploy, direct_vm)
        with direct_vm.expect_revert("at least 10 characters"):
            c.appeal_claim(claim_id, "short")


# ══════════════════════════════════════════════════════════════════════════════
# Views
# ══════════════════════════════════════════════════════════════════════════════

class TestViews:
    def test_get_claims_by_pool_and_member(self, direct_deploy, direct_vm):
        c = _deploy(direct_vm, direct_deploy)
        _create_pool(c, premium=1_000, max_payout=500, max_claims=5)
        direct_vm.deal(_ALICE_BYTES, 10**24)
        direct_vm.deal(_BOB_BYTES, 10**24)
        _join(direct_vm, c, _ALICE_BYTES, 0, 1_000)
        _join(direct_vm, c, _BOB_BYTES, 0, 1_000)

        direct_vm.mock_llm(r".*", DENY)
        direct_vm.mock_web(r".*", {"status": 200, "body": "x"})

        direct_vm.sender = _ALICE_BYTES
        c.file_claim(0, "Alice files a claim right here.", 50, "https://e.com/a")
        direct_vm.sender = _BOB_BYTES
        c.file_claim(0, "Bob files a separate claim here.", 50, "https://e.com/b")

        by_pool = json.loads(c.get_claims_by_pool(0))
        assert len(by_pool) == 2

        alice_hex = _addr(_ALICE_BYTES).as_hex
        by_alice = json.loads(c.get_claims_by_member(alice_hex))
        assert len(by_alice) == 1
        assert by_alice[0]["claimant"].lower() == alice_hex.lower()

    def test_get_claim_count(self, direct_deploy, direct_vm):
        c = _deploy(direct_vm, direct_deploy)
        _create_pool(c, premium=1_000, max_payout=500, max_claims=5)
        direct_vm.deal(_ALICE_BYTES, 10**24)
        _join(direct_vm, c, _ALICE_BYTES, 0, 1_000)
        direct_vm.mock_llm(r".*", DENY)
        direct_vm.mock_web(r".*", {"status": 200, "body": "x"})
        direct_vm.sender = _ALICE_BYTES

        assert c.get_claim_count() == 0
        c.file_claim(0, "First claim goes in right here.", 50, "https://e.com/a")
        assert c.get_claim_count() == 1

    def test_is_covered_false_for_stranger(self, direct_deploy, direct_vm):
        c = _deploy(direct_vm, direct_deploy)
        _create_pool(c)
        assert c.is_covered(0, _addr(_OTHER_BYTES).as_hex) is False


# ══════════════════════════════════════════════════════════════════════════════
# Consensus behavior — validator agreement/disagreement on the adjudication
# ══════════════════════════════════════════════════════════════════════════════

class TestValidatorConsensus:
    """Exercises the custom leader/validator pair inside _adjudicate via the
    direct-mode run_validator() cheatcode, independent of the fact that
    direct mode itself always accepts the leader's result. This is what
    actually proves the equivalence-principle logic (partial field
    matching + numeric tolerance) is implemented correctly."""

    def _filed_claim_setup(self, direct_deploy, direct_vm):
        c = _deploy(direct_vm, direct_deploy)
        _create_pool(c, premium=1_000, max_payout=1_000, max_claims=5)
        direct_vm.deal(_ALICE_BYTES, 10**24)
        _join(direct_vm, c, _ALICE_BYTES, 0, 1_000)
        direct_vm.sender = _ALICE_BYTES
        direct_vm.mock_web(r".*", {"status": 200, "body": "x"})
        return c

    def test_validator_agrees_within_tolerance(self, direct_deploy, direct_vm):
        c = self._filed_claim_setup(direct_deploy, direct_vm)
        direct_vm.mock_llm(r".*", _verdict(True, 70))
        c.file_claim(0, "Claim evaluated for consensus testing.", 500, "https://e.com/x")

        # Re-run the validator side with a response within the ±15 tolerance.
        direct_vm.clear_mocks()
        direct_vm.mock_llm(r".*", _verdict(True, 80))
        assert direct_vm.run_validator() is True

    def test_validator_disagrees_outside_tolerance(self, direct_deploy, direct_vm):
        c = self._filed_claim_setup(direct_deploy, direct_vm)
        direct_vm.mock_llm(r".*", _verdict(True, 70))
        c.file_claim(0, "Claim evaluated for consensus testing.", 500, "https://e.com/x")

        direct_vm.clear_mocks()
        direct_vm.mock_llm(r".*", _verdict(True, 20))  # 50-point gap, outside tolerance
        assert direct_vm.run_validator() is False

    def test_validator_disagrees_on_covered_mismatch(self, direct_deploy, direct_vm):
        c = self._filed_claim_setup(direct_deploy, direct_vm)
        direct_vm.mock_llm(r".*", _verdict(True, 70))
        c.file_claim(0, "Claim evaluated for consensus testing.", 500, "https://e.com/x")

        direct_vm.clear_mocks()
        direct_vm.mock_llm(r".*", DENY)
        assert direct_vm.run_validator() is False

    def test_validator_agrees_when_both_deny(self, direct_deploy, direct_vm):
        c = self._filed_claim_setup(direct_deploy, direct_vm)
        direct_vm.mock_llm(r".*", DENY)
        c.file_claim(0, "Claim evaluated for consensus testing.", 500, "https://e.com/x")

        direct_vm.clear_mocks()
        direct_vm.mock_llm(r".*", DENY)
        assert direct_vm.run_validator() is True


if __name__ == "__main__":
    import sys
    sys.exit(pytest.main([__file__, "-v"]))

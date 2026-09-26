import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";

import {
  CONTRACT_ADDRESS,
  CHAIN_ID,
  ABI,
  state,
  keccak256,
  toChecksumAddress,
  validateBuilderAddress,
  parseAmountInWei,
  validateUrl,
  validatePair,
  ensureWalletReady,
  executeWriteFlow,
  attachProviderListeners,
  disconnectWallet,
  setStatus,
  setTxLink,
  resetTxLink,
  elements
} from "./app.js";

describe("Chirograph Frontend Tests", () => {
  beforeEach(() => {
    state.provider = null;
    state.walletAddress = "";
    state.chainId = null;
    state.isSubmitting = false;
  });

  describe("1. Builder Address Guards", () => {
    const connectedWallet = "0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed";

    it("should reject undefined or null builder", () => {
      assert.throws(() => validateBuilderAddress(undefined, connectedWallet), /Builder address is required/);
      assert.throws(() => validateBuilderAddress(null, connectedWallet), /Builder address is required/);
    });

    it("should reject empty or blank whitespace builder", () => {
      assert.throws(() => validateBuilderAddress("", connectedWallet), /Builder address is required/);
      assert.throws(() => validateBuilderAddress("   ", connectedWallet), /Builder address is required/);
    });

    it("should reject non-string types", () => {
      assert.throws(() => validateBuilderAddress(12345, connectedWallet), /Builder address is required/);
      assert.throws(() => validateBuilderAddress(["0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed"], connectedWallet), /Builder address is required/);
    });

    it("should reject malformed builder addresses (invalid length, non-hex)", () => {
      // Missing 0x
      assert.throws(() => validateBuilderAddress("5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed", connectedWallet), /Invalid builder address format/);
      // Too short (39 hex chars)
      assert.throws(() => validateBuilderAddress("0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAe", connectedWallet), /Invalid builder address format/);
      // Too long (41 hex chars)
      assert.throws(() => validateBuilderAddress("0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAedd", connectedWallet), /Invalid builder address format/);
      // Non-hex characters
      assert.throws(() => validateBuilderAddress("0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAeg", connectedWallet), /Invalid builder address format/);
      assert.throws(() => validateBuilderAddress("0xZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZ", connectedWallet), /Invalid builder address format/);
    });

    it("should reject zero address", () => {
      assert.throws(() => validateBuilderAddress("0x0000000000000000000000000000000000000000", connectedWallet), /zero address/);
      assert.throws(() => validateBuilderAddress("0x0000000000000000000000000000000000000000", ""), /zero address/);
    });

    it("should reject builder matching connected wallet (case-insensitive)", () => {
      assert.throws(
        () => validateBuilderAddress("0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed", "0x5aaeb6053f3e94c9b9a09f33669435e7ef1beaed"),
        /Builder address cannot match the connected wallet/
      );
      assert.throws(
        () => validateBuilderAddress("0x5aaeb6053f3e94c9b9a09f33669435e7ef1beaed", "0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed"),
        /Builder address cannot match the connected wallet/
      );
    });

    it("should reject bad checksum on mixed-case address", () => {
      // Invert one case in valid checksum 0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed -> 0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAeD
      assert.throws(
        () => validateBuilderAddress("0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAeD", "0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359"),
        /Invalid address checksum/
      );
      // Invert another character case
      assert.throws(
        () => validateBuilderAddress("0xFB6916095ca1df60bB79Ce92cE3Ea74c37c5d359", "0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed"),
        /Invalid address checksum/
      );
    });

    it("should accept valid mixed-case checksummed address", () => {
      const valid1 = "0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed";
      const valid2 = "0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359";
      const valid3 = "0xdbF03B407c01E7cD3CBea99509d93f8DDDC8C6FB";
      const valid4 = "0xD1220A0cf47c7B9Be7A2E6BA89F429762e7b9aDb";

      assert.equal(validateBuilderAddress(valid1, valid2), valid1);
      assert.equal(validateBuilderAddress(valid2, valid1), valid2);
      assert.equal(validateBuilderAddress(valid3, valid1), valid3);
      assert.equal(validateBuilderAddress(valid4, valid1), valid4);
    });

    it("should accept all-lowercase address and return checksummed string", () => {
      const lower = "0x5aaeb6053f3e94c9b9a09f33669435e7ef1beaed";
      const expected = "0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed";
      assert.equal(validateBuilderAddress(lower, "0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359"), expected);
    });

    it("should accept all-uppercase address and return checksummed string", () => {
      const upper = "0x5AAEB6053F3E94C9B9A09F33669435E7EF1BEAED";
      const expected = "0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed";
      assert.equal(validateBuilderAddress(upper, "0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359"), expected);
    });
  });

  describe("2. ABI Verification & Parameter Order", () => {
    it("should keep create_grant inputs as string and match signature", () => {
      const createGrantFn = ABI.find((item) => item.name === "create_grant");
      assert.ok(createGrantFn, "create_grant must exist in ABI");
      assert.equal(createGrantFn.type, "function");
      assert.equal(createGrantFn.stateMutability, "nonpayable");

      const expectedInputs = [
        { name: "builder", type: "string" },
        { name: "title", type: "string" },
        { name: "spec_text", type: "string" },
        { name: "spec_url_a", type: "string" },
        { name: "spec_url_b", type: "string" },
      ];

      assert.deepEqual(createGrantFn.inputs, expectedInputs, "create_grant ABI inputs and order must match Python signature");
      assert.deepEqual(createGrantFn.outputs, [{ type: "string" }]);
    });

    it("should verify other ABI function signatures and parameter orders", () => {
      const fundTranche = ABI.find((item) => item.name === "fund_tranche");
      assert.equal(fundTranche.stateMutability, "payable");
      assert.deepEqual(fundTranche.inputs.map(i => i.name), ["grant_id", "milestone_text", "milestone_date", "evidence_url_a", "evidence_url_b"]);

      const updateEvidence = ABI.find((item) => item.name === "update_evidence");
      assert.deepEqual(updateEvidence.inputs.map(i => i.name), ["grant_id", "tranche_index", "evidence_url_a", "evidence_url_b"]);

      const openReview = ABI.find((item) => item.name === "open_review");
      assert.deepEqual(openReview.inputs.map(i => i.name), ["grant_id", "tranche_index"]);

      const release = ABI.find((item) => item.name === "release");
      assert.deepEqual(release.inputs.map(i => i.name), ["grant_id", "tranche_index"]);

      const expireReview = ABI.find((item) => item.name === "expire_review");
      assert.deepEqual(expireReview.inputs.map(i => i.name), ["grant_id", "tranche_index"]);

      const clawback = ABI.find((item) => item.name === "clawback");
      assert.deepEqual(clawback.inputs.map(i => i.name), ["grant_id", "tranche_index"]);
    });
  });

  describe("3. parseAmountInWei", () => {
    it("should correctly parse whole and fractional amounts using BigInt only", () => {
      assert.equal(parseAmountInWei("1"), 1000000000000000000n);
      assert.equal(parseAmountInWei("0.5"), 500000000000000000n);
      assert.equal(parseAmountInWei("0.000000000000000001"), 1n);
      assert.equal(parseAmountInWei("12.3456789"), 12345678900000000000n);
      assert.equal(parseAmountInWei("100.000000000000000001"), 100000000000000000001n);
    });

    it("should reject non-positive amounts, zero, or invalid formats", () => {
      assert.throws(() => parseAmountInWei("0"), /greater than zero/);
      assert.throws(() => parseAmountInWei("0.0"), /greater than zero/);
      assert.throws(() => parseAmountInWei("-1"), /Invalid amount format/);
      assert.throws(() => parseAmountInWei("abc"), /Invalid amount format/);
      assert.throws(() => parseAmountInWei("1.2.3"), /Invalid amount format/);
      assert.throws(() => parseAmountInWei(""), /Amount is required/);
      assert.throws(() => parseAmountInWei(null), /Amount is required/);
      assert.throws(() => parseAmountInWei(undefined), /Amount is required/);
    });

    it("should reject precision exceeding 18 decimals", () => {
      assert.throws(() => parseAmountInWei("1.0000000000000000001"), /maximum precision/);
    });
  });

  describe("4. Finality-Aware Write Flow & Wallet Events", () => {
    it("should toggle is-active class on rung buttons in showPage", async () => {
      const mockBtns = [
        { dataset: { page: "create" }, classList: new Set(["rung", "is-active"]) },
        { dataset: { page: "fund" }, classList: new Set(["rung"]) },
        { dataset: { page: "evidence" }, classList: new Set(["rung"]) },
      ];
      mockBtns.forEach(b => {
        b.classList.toggle = (cls, force) => {
          if (force) b.classList.add(cls);
          else b.classList.delete(cls);
        };
      });

      const mockForms = [
        { dataset: { page: "create" }, classList: new Set(["page-form"]) },
        { dataset: { page: "fund" }, classList: new Set(["page-form", "hidden"]) },
        { dataset: { page: "evidence" }, classList: new Set(["page-form", "hidden"]) },
      ];
      mockForms.forEach(f => {
        f.classList.toggle = (cls, force) => {
          if (force) f.classList.add(cls);
          else f.classList.delete(cls);
        };
      });

      const originalDoc = globalThis.document;
      try {
        globalThis.document = {
          getElementById: () => null,
          querySelectorAll: (sel) => {
            if (sel === ".rung") return mockBtns;
            if (sel === ".page-form") return mockForms;
            return [];
          }
        };

        const { showPage } = await import("./app.js");
        showPage("fund");
        assert.ok(mockBtns[1].classList.has("is-active"), "fund rung should have is-active");
        assert.ok(!mockBtns[0].classList.has("is-active"), "create rung should not have is-active");
        assert.ok(!mockForms[1].classList.has("hidden"), "fund form should not be hidden");
        assert.ok(mockForms[0].classList.has("hidden"), "create form should be hidden");
      } finally {
        globalThis.document = originalDoc;
      }
    });
    it("should refuse writes if wallet is not connected", async () => {
      state.walletAddress = "";
      state.provider = null;
      await assert.rejects(
        () => ensureWalletReady(),
        /Connect a StudioNet wallet to write/
      );
    });

    it("should refuse writes on wrong chain", async () => {
      state.walletAddress = "0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed";
      state.provider = {
        request: async ({ method }) => {
          if (method === "eth_chainId") return "0x1"; // Ethereum Mainnet (chain 1)
          return null;
        }
      };

      await assert.rejects(
        () => ensureWalletReady(),
        /Wrong chain \(1\)/
      );
    });

    it("should pass ensureWalletReady on StudioNet chain 61999 (0xf22f)", async () => {
      state.walletAddress = "0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed";
      state.provider = {
        request: async ({ method }) => {
          if (method === "eth_chainId") return "0xf22f";
          return null;
        }
      };

      await assert.doesNotReject(() => ensureWalletReady());
    });

    it("should handle account switch via accountsChanged event", async () => {
      let registeredHandler = null;
      const mockProvider = {
        on: (event, handler) => {
          if (event === "accountsChanged") registeredHandler = handler;
        },
        removeAllListeners: () => {},
        request: async () => "0xf22f"
      };

      attachProviderListeners(mockProvider);
      assert.ok(registeredHandler, "accountsChanged listener should be attached");

      // Switch to new account
      const newAccount = "0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359";
      await registeredHandler([newAccount]);
      assert.equal(state.walletAddress, newAccount.toLowerCase());

      // Disconnect (empty array)
      await registeredHandler([]);
      assert.equal(state.walletAddress, "");
    });

    it("should prevent double submit when transaction is already in flight", async () => {
      state.walletAddress = "0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed";
      state.provider = {
        request: async ({ method }) => (method === "eth_chainId" ? "0xf22f" : null)
      };
      state.isSubmitting = true;

      await assert.rejects(
        () => executeWriteFlow("create_grant", [], undefined, null, null),
        /A transaction is already in flight/
      );
    });

    it("should handle wallet rejection gracefully", async () => {
      state.walletAddress = "0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed";
      state.provider = {
        request: async ({ method }) => (method === "eth_chainId" ? "0xf22f" : null)
      };

      const mockBtn = { disabled: false };
      state.client = {
        writeContract: async () => {
          const err = new Error("User rejected the request.");
          err.code = 4001;
          throw err;
        }
      };

      await assert.rejects(
        () => executeWriteFlow("create_grant", [], undefined, mockBtn, null),
        /User rejected the request/
      );

      assert.equal(state.isSubmitting, false, "isSubmitting flag must be reset to false");
      assert.equal(mockBtn.disabled, false, "Submit button must be re-enabled on error");
    });

    it("should handle transaction timeout", async () => {
      state.walletAddress = "0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed";
      state.provider = {
        request: async ({ method }) => (method === "eth_chainId" ? "0xf22f" : null)
      };

      const mockBtn = { disabled: false };
      const txHash = "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890";

      state.client = {
        writeContract: async () => txHash,
        waitForTransactionReceipt: async () => {
          throw new Error("Transaction timed out waiting for receipt.");
        }
      };

      await assert.rejects(
        () => executeWriteFlow("create_grant", [], undefined, mockBtn, null),
        /Transaction timed out/
      );

      assert.equal(state.isSubmitting, false);
      assert.equal(mockBtn.disabled, false);
    });

    it("should handle consensus failure / cancellation", async () => {
      state.walletAddress = "0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed";
      state.provider = {
        request: async ({ method }) => (method === "eth_chainId" ? "0xf22f" : null)
      };

      const mockBtn = { disabled: false };
      const txHash = "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890";

      state.client = {
        writeContract: async () => txHash,
        waitForTransactionReceipt: async () => ({
          status: 8,
          statusName: "CANCELED"
        })
      };

      await assert.rejects(
        () => executeWriteFlow("create_grant", [], undefined, mockBtn, null),
        /Transaction was canceled or consensus failed/
      );

      assert.equal(state.isSubmitting, false);
      assert.equal(mockBtn.disabled, false);
    });

    it("should handle execution rollback / contract revert", async () => {
      state.walletAddress = "0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed";
      state.provider = {
        request: async ({ method }) => (method === "eth_chainId" ? "0xf22f" : null)
      };

      const mockBtn = { disabled: false };

      state.client = {
        writeContract: async () => {
          throw new Error("Execution reverted: only funder can claw back");
        }
      };

      await assert.rejects(
        () => executeWriteFlow("clawback", ["1", 1n], undefined, mockBtn, null),
        /only funder can claw back/
      );

      assert.equal(state.isSubmitting, false);
      assert.equal(mockBtn.disabled, false);
    });

    it("should handle accepted readout mismatch and rollback validation", async () => {
      state.walletAddress = "0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed";
      state.provider = {
        request: async ({ method }) => (method === "eth_chainId" ? "0xf22f" : null)
      };

      const mockBtn = { disabled: false };
      const txHash = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";

      state.client = {
        writeContract: async () => txHash,
        waitForTransactionReceipt: async () => ({
          status: 7,
          statusName: "FINALIZED"
        }),
        readContract: async () => "0"
      };

      const mismatchVerifyFn = async () => {
        throw new Error("Accepted readout mismatch: builder address mismatch in contract state.");
      };

      await assert.rejects(
        () => executeWriteFlow("create_grant", [], undefined, mockBtn, mismatchVerifyFn),
        /Accepted readout mismatch/
      );

      assert.equal(state.isSubmitting, false);
      assert.equal(mockBtn.disabled, false);
    });

    it("should complete all status phases on successful write flow", async () => {
      state.walletAddress = "0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed";
      state.provider = {
        request: async ({ method }) => (method === "eth_chainId" ? "0xf22f" : null)
      };

      const mockBtn = { disabled: false };
      const txHash = "0x1111222233334444555566667777888899990000aaaabbbbccccddddeeeeffff";

      let verified = false;

      state.client = {
        writeContract: async () => txHash,
        waitForTransactionReceipt: async () => ({
          status: 7,
          statusName: "FINALIZED"
        }),
        readContract: async ({ functionName }) => {
          if (functionName === "get_grant_count") return "1";
          if (functionName === "get_reserved_funds") return "1000000000000000000";
          return "{}";
        }
      };

      const verifyFn = async () => {
        verified = true;
      };

      const resultHash = await executeWriteFlow("create_grant", ["0x..."], undefined, mockBtn, verifyFn);

      assert.equal(resultHash, txHash);
      assert.equal(verified, true);
      assert.equal(state.isSubmitting, false);
      assert.equal(mockBtn.disabled, false);
    });
  });
});

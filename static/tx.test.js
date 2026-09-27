import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";

import {
  ABI,
  state,
  validateBuilderAddress,
  parseAmountInWei,
  ensureWalletReady,
  executeWriteFlow,
  attachProviderListeners,
} from "./app.js";

describe("Chirograph Frontend Tests", () => {
  beforeEach(() => {
    state.provider = null;
    state.walletAddress = "";
    state.chainId = null;
    state.isSubmitting = false;
    state.inFlight = false;
    state.client = null;
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
    });

    it("should reject malformed builder addresses (invalid length, non-hex)", () => {
      assert.throws(() => validateBuilderAddress("5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed", connectedWallet), /Invalid builder address format/);
      assert.throws(() => validateBuilderAddress("0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAe", connectedWallet), /Invalid builder address format/);
      assert.throws(() => validateBuilderAddress("0xZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZ", connectedWallet), /Invalid builder address format/);
    });

    it("should reject zero address", () => {
      assert.throws(() => validateBuilderAddress("0x0000000000000000000000000000000000000000", connectedWallet), /zero address/);
    });

    it("should reject builder matching connected wallet (case-insensitive)", () => {
      assert.throws(
        () => validateBuilderAddress("0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed", "0x5aaeb6053f3e94c9b9a09f33669435e7ef1beaed"),
        /Builder address cannot match the connected wallet/
      );
    });

    it("should reject bad checksum on mixed-case address", () => {
      assert.throws(
        () => validateBuilderAddress("0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAeD", "0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359"),
        /Invalid address checksum/
      );
    });

    it("should accept valid mixed-case checksummed address", () => {
      const valid1 = "0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed";
      const valid2 = "0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359";
      assert.equal(validateBuilderAddress(valid1, valid2), valid1);
      assert.equal(validateBuilderAddress(valid2, valid1), valid2);
    });

    it("should accept all-lowercase address and return checksummed string", () => {
      assert.equal(
        validateBuilderAddress("0x5aaeb6053f3e94c9b9a09f33669435e7ef1beaed", "0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359"),
        "0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed"
      );
    });

    it("should accept all-uppercase address and return checksummed string", () => {
      assert.equal(
        validateBuilderAddress("0x5AAEB6053F3E94C9B9A09F33669435E7EF1BEAED", "0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359"),
        "0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed"
      );
    });
  });

  describe("2. ABI Verification & Parameter Order", () => {
    it("should keep create_grant inputs as string and match signature", () => {
      const createGrantFn = ABI.find((item) => item.name === "create_grant");
      assert.equal(createGrantFn.inputs[0].type, "string");
    });

    it("should verify other ABI function signatures and parameter orders", () => {
      assert.deepEqual(ABI.find((i) => i.name === "fund_tranche").inputs.map((i) => i.name), [
        "grant_id", "milestone_text", "milestone_date", "evidence_url_a", "evidence_url_b",
      ]);
      assert.deepEqual(ABI.find((i) => i.name === "clawback").inputs.map((i) => i.name), ["grant_id", "tranche_index"]);
    });
  });

  describe("3. parseAmountInWei", () => {
    it("should correctly parse whole and fractional amounts using BigInt only", () => {
      assert.equal(parseAmountInWei("1"), 1000000000000000000n);
      assert.equal(parseAmountInWei("0.5"), 500000000000000000n);
    });

    it("should reject non-positive amounts, zero, or invalid formats", () => {
      assert.throws(() => parseAmountInWei("0"), /greater than zero/);
      assert.throws(() => parseAmountInWei(""), /Amount is required/);
    });

    it("should reject precision exceeding 18 decimals", () => {
      assert.throws(() => parseAmountInWei("1.0000000000000000001"), /maximum precision/);
    });
  });

  describe("4. Finality-Aware Write Flow & Wallet Events", () => {
    function studioWallet() {
      state.walletAddress = "0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed";
      state.provider = {
        request: async ({ method }) => (method === "eth_chainId" ? "0xf22f" : null),
      };
    }

    it("should refuse writes if wallet is not connected", async () => {
      state.walletAddress = "";
      state.provider = null;
      await assert.rejects(() => ensureWalletReady(), /Connect a StudioNet wallet to write/);
    });

    it("should refuse writes on wrong chain", async () => {
      state.walletAddress = "0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed";
      state.provider = { request: async ({ method }) => (method === "eth_chainId" ? "0x1" : null) };
      await assert.rejects(() => ensureWalletReady(), /Wrong chain \(1\)/);
    });

    it("should pass ensureWalletReady on StudioNet chain 61999 (0xf22f)", async () => {
      studioWallet();
      await assert.doesNotReject(() => ensureWalletReady());
    });

    it("should handle account switch via accountsChanged event", async () => {
      let registeredHandler = null;
      attachProviderListeners({
        on: (event, handler) => {
          if (event === "accountsChanged") registeredHandler = handler;
        },
      });
      await registeredHandler(["0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359"]);
      assert.equal(state.walletAddress, "0xfb6916095ca1df60bb79ce92ce3ea74c37c5d359");
      await registeredHandler([]);
      assert.equal(state.walletAddress, "");
    });

    it("should prevent double submit when transaction is already in flight", async () => {
      studioWallet();
      state.isSubmitting = true;
      await assert.rejects(() => executeWriteFlow("create_grant", [], undefined, null, null), /already in flight/);
    });

    it("should handle wallet rejection gracefully", async () => {
      studioWallet();
      const mockBtn = { disabled: false };
      state.client = {
        writeContract: async () => {
          const err = new Error("User rejected the request.");
          err.code = 4001;
          throw err;
        },
      };
      await assert.rejects(() => executeWriteFlow("create_grant", [], undefined, mockBtn, null), /User rejected the request/);
    });

    it("should handle transaction timeout", async () => {
      studioWallet();
      state.client = {
        writeContract: async () => "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
        waitForTransactionReceipt: async () => {
          throw new Error("Transaction timed out waiting for receipt.");
        },
      };
      await assert.rejects(() => executeWriteFlow("create_grant", [], undefined, { disabled: false }, null), /Transaction timed out/);
    });

    it("should handle consensus failure / cancellation", async () => {
      studioWallet();
      state.client = {
        writeContract: async () => "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
        waitForTransactionReceipt: async () => ({ status: 8, statusName: "CANCELED" }),
      };
      await assert.rejects(() => executeWriteFlow("create_grant", [], undefined, { disabled: false }, null), /consensus failed/);
    });

    it("should handle execution rollback / contract revert", async () => {
      studioWallet();
      state.client = {
        writeContract: async () => {
          throw new Error("Execution reverted: only funder can claw back");
        },
      };
      await assert.rejects(() => executeWriteFlow("clawback", ["1", 1n], undefined, { disabled: false }, null), /only funder can claw back/);
    });

    it("should handle accepted readout mismatch and rollback validation", async () => {
      studioWallet();
      state.client = {
        writeContract: async () => "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
        waitForTransactionReceipt: async () => ({ status: 7, statusName: "FINALIZED" }),
      };
      await assert.rejects(
        () => executeWriteFlow("create_grant", [], undefined, { disabled: false }, async () => {
          throw new Error("Accepted readout mismatch: builder address mismatch in contract state.");
        }),
        /Accepted readout mismatch/
      );
    });

    it("should complete all status phases on successful write flow", async () => {
      studioWallet();
      const txHash = "0x1111222233334444555566667777888899990000aaaabbbbccccddddeeeeffff";
      let verified = false;
      state.client = {
        writeContract: async () => txHash,
        waitForTransactionReceipt: async () => ({ status: 7, statusName: "FINALIZED" }),
        readContract: async ({ functionName }) => {
          if (functionName === "get_grant_count") return "1";
          if (functionName === "get_reserved_funds") return "1000000000000000000";
          return "{}";
        },
      };
      const resultHash = await executeWriteFlow("create_grant", ["0x..."], undefined, { disabled: false }, async () => {
        verified = true;
      });
      assert.equal(resultHash, txHash);
      assert.equal(verified, true);
    });
  });
});
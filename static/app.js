import { createClient } from "https://esm.sh/genlayer-js@0.18.0?bundle";
import { studionet } from "https://esm.sh/genlayer-js@0.18.0/chains?bundle";

export const CONTRACT_ADDRESS = "0x0457a41D55729cf56a92E1048b1eB8F1D2471f4F";
export const RPC_URL = "https://studio.genlayer.com/api";
export const EXPLORER = "https://explorer-studio.genlayer.com";
export const CHAIN_ID = 61999;
export const CHAIN_HEX = "0xf22f";
export const VIEW_KEY = "chirograph.view";
export const THEME_KEY = "chirograph.theme";
export const WALLET_KEY = "chirograph.wallet";

export const ALLOWED_HOSTS = [
  "github.com",
  "gist.github.com",
  "raw.githubusercontent.com",
  "gitlab.com",
  "bitbucket.org",
  "codeberg.org",
  "sr.ht",
  "git.sr.ht",
  "readthedocs.io",
  "readthedocs.org",
  "gitbook.io",
];

export const ABI = [
  {
    type: "function",
    name: "create_grant",
    stateMutability: "nonpayable",
    inputs: [
      // Deployed signature is builder: str then Address(builder).
      { name: "builder", type: "string" },
      { name: "title", type: "string" },
      { name: "spec_text", type: "string" },
      { name: "spec_url_a", type: "string" },
      { name: "spec_url_b", type: "string" },
    ],
    outputs: [{ type: "string" }],
  },
  {
    type: "function",
    name: "fund_tranche",
    stateMutability: "payable",
    inputs: [
      { name: "grant_id", type: "string" },
      { name: "milestone_text", type: "string" },
      { name: "milestone_date", type: "string" },
      { name: "evidence_url_a", type: "string" },
      { name: "evidence_url_b", type: "string" },
    ],
    outputs: [{ type: "string" }],
  },
  {
    type: "function",
    name: "update_evidence",
    stateMutability: "nonpayable",
    inputs: [
      { name: "grant_id", type: "string" },
      { name: "tranche_index", type: "uint256" },
      { name: "evidence_url_a", type: "string" },
      { name: "evidence_url_b", type: "string" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "open_review",
    stateMutability: "nonpayable",
    inputs: [
      { name: "grant_id", type: "string" },
      { name: "tranche_index", type: "uint256" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "release",
    stateMutability: "nonpayable",
    inputs: [
      { name: "grant_id", type: "string" },
      { name: "tranche_index", type: "uint256" },
    ],
    outputs: [{ type: "string" }],
  },
  {
    type: "function",
    name: "expire_review",
    stateMutability: "nonpayable",
    inputs: [
      { name: "grant_id", type: "string" },
      { name: "tranche_index", type: "uint256" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "clawback",
    stateMutability: "nonpayable",
    inputs: [
      { name: "grant_id", type: "string" },
      { name: "tranche_index", type: "uint256" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "get_grant",
    stateMutability: "view",
    inputs: [{ name: "grant_id", type: "string" }],
    outputs: [{ type: "string" }],
  },
  {
    type: "function",
    name: "get_tranche",
    stateMutability: "view",
    inputs: [
      { name: "grant_id", type: "string" },
      { name: "tranche_index", type: "uint256" },
    ],
    outputs: [{ type: "string" }],
  },
  {
    type: "function",
    name: "get_grant_count",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "string" }],
  },
  {
    type: "function",
    name: "get_reserved_funds",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "string" }],
  },
];

export const state = {
  provider: null,
  walletAddress: typeof localStorage !== "undefined" ? localStorage.getItem(WALLET_KEY) || "" : "",
  chainId: null,
  view: typeof localStorage !== "undefined" ? localStorage.getItem(VIEW_KEY) || "landing" : "landing",
  theme: typeof localStorage !== "undefined" ? localStorage.getItem(THEME_KEY) || "dark" : "dark",
  isSubmitting: false,
  inFlight: false,
  currentStatus: "",
  latestTxHash: "",
  client: null,
};

let lastBoundClient = null;

export function updateClient() {
  state.client = createClient({
    chain: studionet,
    endpoint: RPC_URL,
    account: state.walletAddress || "0x0000000000000000000000000000000000000000",
    provider: state.provider || undefined,
  });
  lastBoundClient = state.client;
}

// Initial client creation
updateClient();

export const elements = {
  get landingView() { return typeof document !== "undefined" ? document.getElementById("landing-view") : null; },
  get appView() { return typeof document !== "undefined" ? document.getElementById("app-view") : null; },
  get connectBtn() { return typeof document !== "undefined" ? document.getElementById("connect-btn") : null; },
  get disconnectBtn() { return typeof document !== "undefined" ? document.getElementById("disconnect-btn") : null; },
  get walletChip() { return typeof document !== "undefined" ? document.getElementById("wallet-chip") : null; },
  get walletAddress() { return typeof document !== "undefined" ? document.getElementById("wallet-address") : null; },
  get contractLink() { return typeof document !== "undefined" ? document.getElementById("contract-link") : null; },
  get statusMsg() { return typeof document !== "undefined" ? document.getElementById("status-msg") : null; },
  get txLink() { return typeof document !== "undefined" ? document.getElementById("tx-link") : null; },
  get txHash() { return typeof document !== "undefined" ? document.getElementById("tx-hash") : null; },
  get statCount() { return typeof document !== "undefined" ? document.getElementById("stat-count") : null; },
  get statReserved() { return typeof document !== "undefined" ? document.getElementById("stat-reserved") : null; },
  get lookupOut() { return typeof document !== "undefined" ? document.getElementById("lookup-out") : null; },
  get themeButtons() { return typeof document !== "undefined" ? [...document.querySelectorAll(".theme-toggle")] : []; },
  get enterButtons() { return typeof document !== "undefined" ? [...document.querySelectorAll(".enter-app-trigger")] : []; },
  get backLanding() { return typeof document !== "undefined" ? document.getElementById("back-landing") : null; },
  get rungButtons() { return typeof document !== "undefined" ? [...document.querySelectorAll(".rung")] : []; },
  get formPages() { return typeof document !== "undefined" ? [...document.querySelectorAll(".page-form")] : []; },
};

export function setStatus(message) {
  state.currentStatus = message;
  if (typeof document !== "undefined" && elements.statusMsg) {
    elements.statusMsg.textContent = message;
  }
}

export function showLanding() {
  if (typeof document === "undefined" || !elements.landingView || !elements.appView) return;
  elements.landingView.classList.remove("view-hidden");
  elements.landingView.classList.add("view-active");
  elements.appView.classList.add("view-hidden");
  elements.appView.classList.remove("view-active");
  if (typeof localStorage !== "undefined") localStorage.setItem(VIEW_KEY, "landing");
}

export function showApp() {
  if (typeof document === "undefined" || !elements.landingView || !elements.appView) return;
  elements.appView.classList.remove("view-hidden");
  elements.appView.classList.add("view-active");
  elements.landingView.classList.add("view-hidden");
  elements.landingView.classList.remove("view-active");
  if (typeof localStorage !== "undefined") localStorage.setItem(VIEW_KEY, "app");
}

export function applyTheme(theme) {
  const nextTheme = theme === "light" ? "light" : "dark";
  if (typeof document !== "undefined") {
    document.body.classList.toggle("theme-light", nextTheme === "light");
    elements.themeButtons.forEach((button) => {
      const icon = button.querySelector(".theme-mark");
      if (icon) {
        icon.textContent = nextTheme === "light" ? "☾" : "☼";
      }
    });
  }
  if (typeof localStorage !== "undefined") localStorage.setItem(THEME_KEY, nextTheme);
}

export function shortenAddress(address) {
  if (!address) return "—";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export const discoveredWallets = [];

export function getPreferredProvider() {
  const okx = discoveredWallets.find((w) =>
    ["com.okex.wallet", "com.okx.wallet"].includes(w.rdns)
  );
  if (okx) return okx.provider;
  if (discoveredWallets[0]) return discoveredWallets[0].provider;
  if (typeof window !== "undefined") {
    if (window.okxwallet?.request) return window.okxwallet;
    return window.ethereum || null;
  }
  return null;
}

export function resetTxLink() {
  state.latestTxHash = "";
  if (typeof document === "undefined" || !elements.txLink || !elements.txHash) return;
  elements.txLink.classList.add("hidden");
  elements.txHash.removeAttribute("href");
  elements.txHash.textContent = "";
}

export function setTxLink(txHash) {
  state.latestTxHash = txHash || "";
  if (typeof document === "undefined" || !elements.txLink || !elements.txHash) return;
  if (!txHash) {
    resetTxLink();
    return;
  }
  elements.txHash.textContent = shortenAddress(txHash);
  elements.txHash.href = `${EXPLORER}/tx/${txHash}`;
  elements.txLink.classList.remove("hidden");
}

export function setWalletUi() {
  if (typeof document === "undefined" || !elements.connectBtn || !elements.walletChip) return;
  const isConnected = Boolean(state.walletAddress);
  elements.connectBtn.classList.toggle("hidden", isConnected);
  elements.walletChip.classList.toggle("hidden", !isConnected);
  if (isConnected && elements.walletAddress) {
    elements.walletAddress.textContent = shortenAddress(state.walletAddress);
  }
}

export function getContractUrl() {
  return `${EXPLORER}/address/${CONTRACT_ADDRESS}`;
}

export function isAllowedHost(hostname) {
  const host = String(hostname || "").trim().toLowerCase();
  if (!host) return false;
  const normalized = host.replace(/^www\./, "");
  return ALLOWED_HOSTS.some((allowed) => {
    const cleanAllowed = allowed.replace(/^www\./, "");
    return host === allowed || normalized === cleanAllowed || host.endsWith(`.${cleanAllowed}`);
  });
}

export function validateUrl(value, label = "URL") {
  const raw = String(value || "").trim();
  if (!raw) throw new Error(`${label} is required.`);

  let parsed;
  try {
    parsed = new URL(raw);
  } catch {
    throw new Error(`${label} must be a valid https URL.`);
  }

  if (parsed.protocol !== "https:") {
    throw new Error(`${label} must use https.`);
  }
  if (!isAllowedHost(parsed.hostname)) {
    throw new Error(`${label} host is not on the allowlist.`);
  }

  return raw;
}

export function validatePair(urlA, urlB, labelA = "URL A", labelB = "URL B") {
  const trimmedA = String(urlA || "").trim();
  const trimmedB = String(urlB || "").trim();

  if (!trimmedA || !trimmedB) {
    throw new Error(`${labelA} and ${labelB} are required.`);
  }

  const first = validateUrl(trimmedA, labelA);
  const second = validateUrl(trimmedB, labelB);
  const hostA = new URL(first).hostname.toLowerCase();
  const hostB = new URL(second).hostname.toLowerCase();

  if (hostA === hostB) {
    throw new Error(`${labelA} and ${labelB} must come from different hosts.`);
  }

  return { urlA: first, urlB: second };
}

// Lightweight Keccak-256 implementation
export function keccak256(input) {
  let bytes;
  if (typeof input === "string") {
    bytes = new TextEncoder().encode(input);
  } else if (input instanceof Uint8Array) {
    bytes = input;
  } else {
    throw new TypeError("Expected string or Uint8Array");
  }

  const stateArr = new BigUint64Array(25);
  const rate = 136;

  const len = bytes.length;
  const padLen = rate - (len % rate);
  const padded = new Uint8Array(len + padLen);
  padded.set(bytes, 0);
  padded[len] = 0x01;
  padded[padded.length - 1] |= 0x80;

  const RC = [
    0x0000000000000001n, 0x0000000000008082n, 0x800000000000808an, 0x8000000080008000n,
    0x000000000000808bn, 0x0000000080000001n, 0x8000000080008081n, 0x8000000000008009n,
    0x000000000000008an, 0x0000000000000088n, 0x0000000080008009n, 0x000000008000000an,
    0x000000008000808bn, 0x800000000000008bn, 0x8000000000008089n, 0x8000000000008003n,
    0x8000000000008002n, 0x8000000000000080n, 0x000000000000800an, 0x800000008000000an,
    0x8000000080008081n, 0x8000000000008080n, 0x0000000080000001n, 0x8000000080008008n,
  ];

  const RHO = [
    0, 1, 62, 28, 27, 36, 44, 6, 55, 20, 3, 10, 43, 25, 39, 41, 45, 15, 21, 8, 18, 2, 61, 56, 14,
  ];

  const PI = [
    0, 10, 20, 5, 15, 16, 1, 11, 21, 6, 7, 17, 2, 12, 22, 23, 8, 18, 3, 13, 14, 24, 9, 19, 4,
  ];

  function rotl(x, n) {
    const shift = BigInt(n % 64);
    return ((x << shift) | (x >> (64n - shift))) & 0xffffffffffffffffn;
  }

  const view = new DataView(padded.buffer);
  for (let offset = 0; offset < padded.length; offset += rate) {
    for (let i = 0; i < 17; i++) {
      stateArr[i] ^= view.getBigUint64(offset + i * 8, true);
    }

    for (let round = 0; round < 24; round++) {
      const C = new BigUint64Array(5);
      for (let x = 0; x < 5; x++) {
        C[x] = stateArr[x] ^ stateArr[x + 5] ^ stateArr[x + 10] ^ stateArr[x + 15] ^ stateArr[x + 20];
      }
      const D = new BigUint64Array(5);
      for (let x = 0; x < 5; x++) {
        D[x] = C[(x + 4) % 5] ^ rotl(C[(x + 1) % 5], 1);
      }
      for (let i = 0; i < 25; i++) {
        stateArr[i] ^= D[i % 5];
      }

      const B = new BigUint64Array(25);
      for (let i = 0; i < 25; i++) {
        B[PI[i]] = rotl(stateArr[i], RHO[i]);
      }

      for (let y = 0; y < 5; y++) {
        const y5 = y * 5;
        for (let x = 0; x < 5; x++) {
          stateArr[y5 + x] = B[y5 + x] ^ ((~B[y5 + ((x + 1) % 5)]) & B[y5 + ((x + 2) % 5)]);
        }
      }

      stateArr[0] ^= RC[round];
    }
  }

  const out = new Uint8Array(32);
  const outView = new DataView(out.buffer);
  for (let i = 0; i < 4; i++) {
    outView.setBigUint64(i * 8, stateArr[i], true);
  }
  return Array.from(out)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function toChecksumAddress(address) {
  const addr = address.toLowerCase().replace(/^0x/, "");
  const hash = keccak256(addr);
  let checksummed = "0x";
  for (let i = 0; i < addr.length; i++) {
    if (parseInt(hash[i], 16) >= 8) {
      checksummed += addr[i].toUpperCase();
    } else {
      checksummed += addr[i].toLowerCase();
    }
  }
  return checksummed;
}

export function validateBuilderAddress(builder, connectedWallet) {
  if (builder === undefined || builder === null || typeof builder !== "string") {
    throw new Error("Builder address is required.");
  }
  if (!builder.trim()) {
    throw new Error("Builder address is required.");
  }
  const raw = builder;
  if (!/^0x[0-9a-fA-F]{40}$/.test(raw)) {
    throw new Error("Invalid builder address format: must match /^0x[0-9a-fA-F]{40}$/.");
  }
  if (/^0x0{40}$/i.test(raw)) {
    throw new Error("Builder address cannot be the zero address.");
  }
  if (connectedWallet && raw.toLowerCase() === connectedWallet.toLowerCase()) {
    throw new Error("Builder address cannot match the connected wallet.");
  }

  const hexPart = raw.slice(2);
  const isMixedCase = hexPart !== hexPart.toLowerCase() && hexPart !== hexPart.toUpperCase();
  const checksummed = toChecksumAddress(raw);

  if (isMixedCase && raw !== checksummed) {
    throw new Error("Invalid address checksum.");
  }

  return checksummed;
}

export function parseAmountInWei(value) {
  if (value === null || value === undefined) {
    throw new Error("Amount is required.");
  }
  const raw = String(value).trim();
  if (!raw) {
    throw new Error("Amount is required.");
  }
  if (!/^\d+(\.\d+)?$/.test(raw)) {
    throw new Error("Invalid amount format.");
  }
  const [wholeStr, fracStr = ""] = raw.split(".");
  const paddedFrac = fracStr.slice(0, 18).padEnd(18, "0");
  const wholeWei = BigInt(wholeStr) * 10n ** 18n;
  const fracWei = BigInt(paddedFrac);
  const totalWei = wholeWei + fracWei;
  if (totalWei <= 0n) {
    throw new Error("Amount must be greater than zero.");
  }
  return totalWei;
}

export async function ensureWalletReady() {
  if (!state.walletAddress) {
    throw new Error("Connect a StudioNet wallet to write to the contract.");
  }
  if (!state.provider || !state.provider.request) {
    throw new Error("No wallet provider available.");
  }
  const currentChain = await state.provider.request({ method: "eth_chainId" });
  const chainIdNum = parseInt(currentChain, 16);
  if (chainIdNum !== CHAIN_ID && Number(currentChain) !== CHAIN_ID) {
    throw new Error(`Wrong chain (${chainIdNum || currentChain}). Writes are refused unless chain is 61999.`);
  }
}

export async function readContract(functionName, args = []) {
  if (!state.client) updateClient();
  return state.client.readContract({
    address: CONTRACT_ADDRESS,
    abi: ABI,
    functionName,
    args,
    account: state.walletAddress || "0x0000000000000000000000000000000000000000",
    stateStatus: "accepted",
  });
}

export async function executeWriteFlow(functionName, args = [], value, afterAccepted, legacyReadbackFn) {
  let submitBtn = null;
  if (typeof afterAccepted !== "function") {
    submitBtn = afterAccepted;
    afterAccepted = legacyReadbackFn;
  }

  if (state.inFlight || state.isSubmitting) {
    throw new Error("A transaction is already in flight. Please wait.");
  }

  state.inFlight = true;
  state.isSubmitting = true;
  if (submitBtn) submitBtn.disabled = true;

  let txHash = null;

  try {
    await ensureWalletReady();
    const injectedClient = state.client !== lastBoundClient ? state.client : null;
    updateClient();
    if (injectedClient) state.client = injectedClient;

    setStatus("Phase: signature — Please approve transaction in your wallet.");

    const payload = {
      address: CONTRACT_ADDRESS,
      abi: ABI,
      functionName,
      args,
      account: state.walletAddress,
    };
    if (typeof value !== "undefined") {
      payload.value = value;
    }

    txHash = await state.client.writeContract(payload);

    // Phase 2: submitted
    setTxLink(txHash);
    setStatus(`Phase: submitted — Transaction submitted with hash ${shortenAddress(txHash)}`);

    setStatus("Phase: wait finalized — Waiting for transaction finalization...");
    const receipt = await state.client.waitForTransactionReceipt({
      hash: txHash,
      status: "FINALIZED",
      retries: 40,
      interval: 3000,
    });

    if (receipt?.statusName === "CANCELED" || receipt?.status === 8) {
      throw new Error("Transaction was canceled or consensus failed.");
    }

    setStatus("Phase: consensus — Transaction consensus achieved.");

    setStatus("Phase: execution — Transaction executed on chain.");

    setStatus("Phase: read — Verifying accepted state readout...");
    if (afterAccepted) {
      await afterAccepted(receipt);
    }
    setStatus("Phase: accepted — State accepted on chain.");
    await refreshStats();

    setStatus("Transaction complete and state accepted on chain.");
    return txHash;
  } catch (error) {
    if (error?.code === 4001) {
      const rejected = new Error("Signature rejected by wallet (User rejected the request).");
      setStatus(rejected.message);
      throw rejected;
    }
    throw error;
  } finally {
    state.inFlight = false;
    state.isSubmitting = false;
    if (submitBtn) submitBtn.disabled = false;
  }
}

export async function refreshStats() {
  try {
    const countRaw = await readContract("get_grant_count");
    const reservedRaw = await readContract("get_reserved_funds");
    const count = Number(String(countRaw ?? "0"));
    const reservedBig = BigInt(String(reservedRaw ?? "0"));
    const whole = reservedBig / 10n ** 18n;
    const frac = reservedBig % 10n ** 18n;
    const fracStr = frac.toString().padStart(18, "0").slice(0, 2);

    if (elements.statCount) {
      elements.statCount.textContent = Number.isFinite(count) ? String(count) : "—";
    }
    if (elements.statReserved) {
      elements.statReserved.textContent = `${whole}.${fracStr} GEN`;
    }
  } catch (error) {
    if (elements.statCount) elements.statCount.textContent = "—";
    if (elements.statReserved) elements.statReserved.textContent = "—";
    console.error("refreshStats error:", error);
  }
}

export async function ensureChain(provider) {
  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: CHAIN_HEX }],
    });
  } catch (switchError) {
    if (switchError?.code === 4902 || switchError?.code === -32603) {
      await provider.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: CHAIN_HEX,
            chainName: "GenLayer StudioNet",
            nativeCurrency: { name: "GEN", symbol: "GEN", decimals: 18 },
            rpcUrls: [RPC_URL],
            blockExplorerUrls: [EXPLORER],
          },
        ],
      });
    } else {
      throw switchError;
    }
  }
}

export function attachProviderListeners(provider) {
  if (!provider || !provider.on) return;

  provider.on("accountsChanged", async (accounts) => {
    if (!accounts || accounts.length === 0) {
      disconnectWallet();
    } else {
      state.walletAddress = accounts[0].toLowerCase();
      if (typeof localStorage !== "undefined") localStorage.setItem(WALLET_KEY, state.walletAddress);
      updateClient();
      setWalletUi();
      setStatus(`Account changed: ${shortenAddress(state.walletAddress)}`);
      await refreshStats();
    }
  });

  provider.on("chainChanged", (chainIdHex) => {
    const parsedId = parseInt(chainIdHex, 16);
    state.chainId = parsedId;
    if (parsedId !== CHAIN_ID && Number(chainIdHex) !== CHAIN_ID) {
      setStatus(`Wrong chain (${parsedId || chainIdHex}). Switch to StudioNet (chain 61999) to write.`);
    } else {
      setStatus("Connected to GenLayer StudioNet (chain 61999).");
    }
  });
}

export async function connectWallet() {
  try {
    state.provider = getPreferredProvider();
    if (!state.provider || !state.provider.request) {
      throw new Error("No wallet provider was found. Install a wallet that supports EIP-6963.");
    }

    const accounts = await state.provider.request({ method: "eth_requestAccounts" });
    if (!accounts || !accounts.length) {
      throw new Error("No wallet accounts were returned.");
    }

    state.walletAddress = accounts[0].toLowerCase();
    if (typeof localStorage !== "undefined") localStorage.setItem(WALLET_KEY, state.walletAddress);

    await ensureChain(state.provider);
    attachProviderListeners(state.provider);
    updateClient();
    setWalletUi();
    setStatus("Wallet connected. You can create, fund, review, and inspect grants.");
    await refreshStats();
  } catch (error) {
    console.error(error);
    setStatus(error.message || "Wallet connection failed.");
  }
}

export function disconnectWallet() {
  state.walletAddress = "";
  if (typeof localStorage !== "undefined") localStorage.removeItem(WALLET_KEY);
  updateClient();
  setWalletUi();
  setStatus("Wallet disconnected. Connect a StudioNet wallet to write.");
}

export async function restoreWalletOnLoad() {
  if (typeof localStorage === "undefined") return;
  const storedAddress = localStorage.getItem(WALLET_KEY);
  if (!storedAddress) return;

  state.provider = getPreferredProvider();
  if (!state.provider || !state.provider.request) return;

  try {
    const accounts = await state.provider.request({ method: "eth_accounts" });
    if (accounts && accounts.length) {
      state.walletAddress = accounts[0].toLowerCase();
      localStorage.setItem(WALLET_KEY, state.walletAddress);
      await ensureChain(state.provider);
      attachProviderListeners(state.provider);
      updateClient();
      setWalletUi();
      setStatus("Wallet restored. You can continue from the desk.");
      await refreshStats();
    }
  } catch (error) {
    console.warn("Wallet restore failed:", error);
  }
}

export function showPage(pageKey) {
  if (typeof document === "undefined") return;
  elements.rungButtons.forEach((btn) => {
    const isActive = btn.dataset.page === pageKey;
    btn.classList.toggle("is-active", isActive);
    btn.classList.toggle("active", isActive);
  });
  elements.formPages.forEach((form) => {
    form.classList.toggle("hidden", form.dataset.page !== pageKey);
  });
}

export function bindThemeControls() {
  if (typeof document === "undefined") return;
  elements.themeButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const isLight = document.body.classList.contains("theme-light");
      applyTheme(isLight ? "dark" : "light");
    });
  });
}

export function bindViewControls() {
  if (typeof document === "undefined") return;
  elements.enterButtons.forEach((btn) => {
    btn.addEventListener("click", showApp);
  });
  if (elements.backLanding) {
    elements.backLanding.addEventListener("click", showLanding);
  }
  elements.rungButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      showPage(btn.dataset.page);
    });
  });
}

export function bindWalletControls() {
  if (typeof document === "undefined") return;
  if (elements.connectBtn) {
    elements.connectBtn.addEventListener("click", connectWallet);
  }
  if (elements.disconnectBtn) {
    elements.disconnectBtn.addEventListener("click", disconnectWallet);
  }
}

// Handlers for form submissions
export async function handleCreateGrant(event) {
  event.preventDefault();
  const form = event.target;

  try {
    await ensureWalletReady();

    const builderInput = document.getElementById("builder").value;
    const checksummedBuilder = validateBuilderAddress(builderInput, state.walletAddress);

    const title = document.getElementById("title").value.trim();
    const specText = document.getElementById("spec-text").value.trim();
    const specA = document.getElementById("spec-a").value.trim();
    const specB = document.getElementById("spec-b").value.trim();

    if (!title) throw new Error("Title is required.");
    if (specText.length < 12) throw new Error("Spec text is too short.");

    const pair = validatePair(specA, specB, "Spec URL A", "Spec URL B");

    await executeWriteFlow(
      "create_grant",
      [checksummedBuilder, title, specText, pair.urlA, pair.urlB],
      undefined,
      async () => {
        const count = await readContract("get_grant_count");
        if (BigInt(count) <= 0n) {
          throw new Error("Accepted readout mismatch: grant count did not increment.");
        }
        const grantRaw = await readContract("get_grant", [String(count)]);
        const grantObj = JSON.parse(grantRaw);
        if (grantObj.builder.toLowerCase() !== checksummedBuilder.toLowerCase()) {
          throw new Error("Accepted readout mismatch: builder address mismatch in contract state.");
        }
      }
    );

    form.reset();
  } catch (error) {
    console.error(error);
    setStatus(error.message || "The grant could not be created.");
  }
}

export async function handleFundTranche(event) {
  event.preventDefault();
  const form = event.target;

  try {
    await ensureWalletReady();

    const grantId = document.getElementById("fund-grant-id").value.trim();
    const milestoneText = document.getElementById("milestone-text").value.trim();
    const milestoneDate = document.getElementById("milestone-date").value.trim();
    const evidenceA = document.getElementById("fund-evidence-a").value.trim();
    const evidenceB = document.getElementById("fund-evidence-b").value.trim();
    const amount = document.getElementById("fund-amount").value.trim();

    if (!grantId) throw new Error("Grant id is required.");
    if (milestoneText.length < 12) throw new Error("Milestone text is too short.");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(milestoneDate)) throw new Error("Milestone date must be YYYY-MM-DD.");

    let pair;
    if (evidenceA || evidenceB) {
      pair = validatePair(evidenceA, evidenceB, "Evidence URL A", "Evidence URL B");
    } else {
      pair = { urlA: "", urlB: "" };
    }

    const weiAmount = parseAmountInWei(amount);

    await executeWriteFlow(
      "fund_tranche",
      [grantId, milestoneText, milestoneDate, pair.urlA, pair.urlB],
      weiAmount,
      async () => {
        const grantRaw = await readContract("get_grant", [grantId]);
        const grantObj = JSON.parse(grantRaw);
        const lastTrancheIndex = BigInt(grantObj.next_tranche_id) - 1n;
        if (lastTrancheIndex < 1n) {
          throw new Error("Accepted readout mismatch: tranche was not created.");
        }
        const trancheRaw = await readContract("get_tranche", [grantId, lastTrancheIndex]);
        const trancheObj = JSON.parse(trancheRaw);
        if (trancheObj.status !== "RESERVED") {
          throw new Error(`Accepted readout mismatch: expected status RESERVED but got ${trancheObj.status}`);
        }
      }
    );

    form.reset();
  } catch (error) {
    console.error(error);
    setStatus(error.message || "The tranche could not be funded.");
  }
}

export async function handleEvidenceUpdate(event) {
  event.preventDefault();
  const form = event.target;

  try {
    await ensureWalletReady();

    const grantId = document.getElementById("evidence-grant-id").value.trim();
    const trancheIndex = document.getElementById("evidence-tranche").value.trim();
    const urlA = document.getElementById("work-a").value.trim();
    const urlB = document.getElementById("work-b").value.trim();

    if (!grantId || !trancheIndex) throw new Error("Grant id and tranche are required.");

    const pair = validatePair(urlA, urlB, "Work URL A", "Work URL B");

    await executeWriteFlow(
      "update_evidence",
      [grantId, BigInt(trancheIndex), pair.urlA, pair.urlB],
      undefined,
      async () => {
        const trancheRaw = await readContract("get_tranche", [grantId, BigInt(trancheIndex)]);
        const trancheObj = JSON.parse(trancheRaw);
        if (trancheObj.evidence_url_a !== pair.urlA || trancheObj.evidence_url_b !== pair.urlB) {
          throw new Error("Accepted readout mismatch: evidence URLs do not match contract state.");
        }
      }
    );

    form.reset();
  } catch (error) {
    console.error(error);
    setStatus(error.message || "Evidence could not be updated.");
  }
}

export async function handleOpenReview(event) {
  event.preventDefault();
  const form = event.target;

  try {
    await ensureWalletReady();

    const grantId = document.getElementById("review-grant-id").value.trim();
    const trancheIndex = document.getElementById("review-tranche").value.trim();

    if (!grantId || !trancheIndex) throw new Error("Grant id and tranche are required.");

    await executeWriteFlow(
      "open_review",
      [grantId, BigInt(trancheIndex)],
      undefined,
      async () => {
        const trancheRaw = await readContract("get_tranche", [grantId, BigInt(trancheIndex)]);
        const trancheObj = JSON.parse(trancheRaw);
        if (trancheObj.status !== "PENDING_REVIEW") {
          throw new Error(`Accepted readout mismatch: expected PENDING_REVIEW but got ${trancheObj.status}`);
        }
      }
    );

    form.reset();
  } catch (error) {
    console.error(error);
    setStatus(error.message || "Review could not be opened.");
  }
}

export async function handleRelease(event) {
  event.preventDefault();
  const form = event.target;

  try {
    await ensureWalletReady();

    const grantId = document.getElementById("release-grant-id").value.trim();
    const trancheIndex = document.getElementById("release-tranche").value.trim();

    if (!grantId || !trancheIndex) throw new Error("Grant id and tranche are required.");

    await executeWriteFlow(
      "release",
      [grantId, BigInt(trancheIndex)],
      undefined,
      async () => {
        const trancheRaw = await readContract("get_tranche", [grantId, BigInt(trancheIndex)]);
        const trancheObj = JSON.parse(trancheRaw);
        if (!["RELEASED", "REJECTED", "RESERVED"].includes(trancheObj.status)) {
          throw new Error(`Accepted readout mismatch: unexpected tranche status ${trancheObj.status}`);
        }
      }
    );

    form.reset();
  } catch (error) {
    console.error(error);
    setStatus(error.message || "The tranche could not be released.");
  }
}

export async function handleExpireReview(event) {
  event.preventDefault();
  const form = event.target;

  try {
    await ensureWalletReady();

    const grantId = document.getElementById("expire-grant-id").value.trim();
    const trancheIndex = document.getElementById("expire-tranche").value.trim();

    if (!grantId || !trancheIndex) throw new Error("Grant id and tranche are required.");

    await executeWriteFlow(
      "expire_review",
      [grantId, BigInt(trancheIndex)],
      undefined,
      async () => {
        const trancheRaw = await readContract("get_tranche", [grantId, BigInt(trancheIndex)]);
        const trancheObj = JSON.parse(trancheRaw);
        if (trancheObj.status !== "RESERVED") {
          throw new Error(`Accepted readout mismatch: expected status RESERVED after expire but got ${trancheObj.status}`);
        }
      }
    );

    form.reset();
  } catch (error) {
    console.error(error);
    setStatus(error.message || "The review could not be expired.");
  }
}

export async function handleClawback(event) {
  event.preventDefault();
  const form = event.target;

  try {
    await ensureWalletReady();

    const grantId = document.getElementById("clawback-grant-id").value.trim();
    const trancheIndex = document.getElementById("clawback-tranche").value.trim();

    if (!grantId || !trancheIndex) throw new Error("Grant id and tranche are required.");

    await executeWriteFlow(
      "clawback",
      [grantId, BigInt(trancheIndex)],
      undefined,
      async () => {
        const trancheRaw = await readContract("get_tranche", [grantId, BigInt(trancheIndex)]);
        const trancheObj = JSON.parse(trancheRaw);
        if (trancheObj.status !== "CANCELLED") {
          throw new Error(`Accepted readout mismatch: expected status CANCELLED but got ${trancheObj.status}`);
        }
      }
    );

    form.reset();
  } catch (error) {
    console.error(error);
    setStatus(error.message || "Clawback could not be executed.");
  }
}

export async function handleLookup(event) {
  event.preventDefault();

  try {
    const grantId = document.getElementById("lookup-grant-id").value.trim();
    const trancheId = document.getElementById("lookup-tranche").value.trim();

    if (!grantId) throw new Error("Grant id is required.");

    const grant = await readContract("get_grant", [grantId]);
    const payload = { grant: JSON.parse(grant) };

    if (trancheId) {
      const tranche = await readContract("get_tranche", [grantId, BigInt(trancheId)]);
      payload.tranche = JSON.parse(tranche);
    }

    if (elements.lookupOut) {
      elements.lookupOut.textContent = JSON.stringify(payload, null, 2);
    }
    setStatus("Lookup complete. Contract state has been fetched.");
  } catch (error) {
    console.error(error);
    if (elements.lookupOut) {
      elements.lookupOut.textContent = JSON.stringify({ error: error.message || "Lookup failed." }, null, 2);
    }
    setStatus(error.message || "Lookup failed.");
  }
}

export function bindForms() {
  if (typeof document === "undefined") return;
  const createForm = document.getElementById("create-grant-form");
  if (createForm) createForm.addEventListener("submit", handleCreateGrant);

  const fundForm = document.getElementById("fund-form");
  if (fundForm) fundForm.addEventListener("submit", handleFundTranche);

  const evidenceForm = document.getElementById("evidence-form");
  if (evidenceForm) evidenceForm.addEventListener("submit", handleEvidenceUpdate);

  const reviewForm = document.getElementById("review-form");
  if (reviewForm) reviewForm.addEventListener("submit", handleOpenReview);

  const releaseForm = document.getElementById("release-form");
  if (releaseForm) releaseForm.addEventListener("submit", handleRelease);

  const expireForm = document.getElementById("expire-form");
  if (expireForm) expireForm.addEventListener("submit", handleExpireReview);

  const clawbackForm = document.getElementById("clawback-form");
  if (clawbackForm) clawbackForm.addEventListener("submit", handleClawback);

  const lookupForm = document.getElementById("lookup-form");
  if (lookupForm) lookupForm.addEventListener("submit", handleLookup);
}

export async function initialize() {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  const savedTheme = localStorage.getItem(THEME_KEY) || "dark";
  applyTheme(savedTheme);

  if (elements.contractLink) {
    elements.contractLink.href = getContractUrl();
    elements.contractLink.textContent = `${CONTRACT_ADDRESS.slice(0, 6)}...${CONTRACT_ADDRESS.slice(-4)}`;
  }

  if (localStorage.getItem(VIEW_KEY) === "app") {
    showApp();
  } else {
    showLanding();
  }

  showPage("create");
  bindThemeControls();
  bindViewControls();
  bindWalletControls();
  bindForms();
  setWalletUi();
  resetTxLink();
  await refreshStats();
  await restoreWalletOnLoad();
}

if (typeof window !== "undefined") {
  window.addEventListener("eip6963:announceProvider", (event) => {
    const { info, provider } = event.detail || {};
    if (!provider?.request || !info?.rdns) return;
    if (discoveredWallets.some((w) => w.rdns === info.rdns)) return;
    discoveredWallets.push({
      rdns: info.rdns,
      name: info.name || info.rdns,
      provider,
    });
    if (event?.detail?.provider?.request) {
      state.provider = event.detail.provider;
      attachProviderListeners(state.provider);
      updateClient();
    }
  });

  window.dispatchEvent(new Event("eip6963:requestProvider"));

  if (window.eip6963?.providers?.length) {
    state.provider = getPreferredProvider();
    if (state.provider) {
      attachProviderListeners(state.provider);
      updateClient();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize);
  } else {
    initialize();
  }
}

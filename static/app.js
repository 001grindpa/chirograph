import { createClient } from "https://esm.sh/genlayer-js@0.18.0?bundle";
import { studionet } from "https://esm.sh/genlayer-js@0.18.0/chains?bundle";

const CONTRACT_ADDRESS = "0x0457a41D55729cf56a92E1048b1eB8F1D2471f4F";
const RPC_URL = "https://studio.genlayer.com/api";
const EXPLORER = "https://explorer-studio.genlayer.com";
const VIEW_KEY = "chirograph.view";
const THEME_KEY = "chirograph.theme";
const WALLET_KEY = "chirograph.wallet";

const ALLOWED_HOSTS = [
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

const ABI = [
  {
    type: "function",
    name: "create_grant",
    stateMutability: "nonpayable",
    inputs: [
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

const state = {
  provider: null,
  walletAddress: localStorage.getItem(WALLET_KEY) || "",
  view: localStorage.getItem(VIEW_KEY) || "landing",
  theme: localStorage.getItem(THEME_KEY) || "dark",
  client: createClient({
    chain: studionet,
    transport: {
      type: "http",
      url: RPC_URL,
    },
  }),
};

const elements = {
  landingView: document.getElementById("landing-view"),
  appView: document.getElementById("app-view"),
  connectBtn: document.getElementById("connect-btn"),
  disconnectBtn: document.getElementById("disconnect-btn"),
  walletChip: document.getElementById("wallet-chip"),
  walletAddress: document.getElementById("wallet-address"),
  contractLink: document.getElementById("contract-link"),
  statusMsg: document.getElementById("status-msg"),
  txLink: document.getElementById("tx-link"),
  txHash: document.getElementById("tx-hash"),
  statCount: document.getElementById("stat-count"),
  statReserved: document.getElementById("stat-reserved"),
  lookupOut: document.getElementById("lookup-out"),
  themeButtons: [...document.querySelectorAll(".theme-toggle")],
  enterButtons: [...document.querySelectorAll(".enter-app-trigger")],
  backLanding: document.getElementById("back-landing"),
  rungButtons: [...document.querySelectorAll(".rung")],
  formPages: [...document.querySelectorAll(".page-form")],
};

function setStatus(message) {
  elements.statusMsg.textContent = message;
}

function showLanding() {
  elements.landingView.classList.remove("view-hidden");
  elements.landingView.classList.add("view-active");
  elements.appView.classList.add("view-hidden");
  elements.appView.classList.remove("view-active");
  localStorage.setItem(VIEW_KEY, "landing");
}

function showApp() {
  elements.appView.classList.remove("view-hidden");
  elements.appView.classList.add("view-active");
  elements.landingView.classList.add("view-hidden");
  elements.landingView.classList.remove("view-active");
  localStorage.setItem(VIEW_KEY, "app");
}

function applyTheme(theme) {
  const nextTheme = theme === "light" ? "light" : "dark";
  document.body.classList.toggle("theme-light", nextTheme === "light");
  elements.themeButtons.forEach((button) => {
    const icon = button.querySelector(".theme-mark");
    if (icon) {
      icon.textContent = nextTheme === "light" ? "☾" : "☼";
    }
  });
  localStorage.setItem(THEME_KEY, nextTheme);
}

function shortenAddress(address) {
  if (!address) return "—";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function getPreferredProvider() {
  const providers = Array.isArray(window.eip6963?.providers) ? window.eip6963.providers : [];
  for (const candidate of providers) {
    if (candidate?.provider?.request) return candidate.provider;
  }
  return window.ethereum || null;
}

function resetTxLink() {
  elements.txLink.classList.add("hidden");
  elements.txHash.removeAttribute("href");
  elements.txHash.textContent = "";
}

function setTxLink(txHash) {
  if (!txHash) {
    resetTxLink();
    return;
  }
  elements.txHash.textContent = shortenAddress(txHash);
  elements.txHash.href = `${EXPLORER}/tx/${txHash}`;
  elements.txLink.classList.remove("hidden");
}

function setWalletUi() {
  const isConnected = Boolean(state.walletAddress);
  elements.connectBtn.classList.toggle("hidden", isConnected);
  elements.walletChip.classList.toggle("hidden", !isConnected);
  if (isConnected) {
    elements.walletAddress.textContent = shortenAddress(state.walletAddress);
  }
}

function getContractUrl() {
  return `${EXPLORER}/address/${CONTRACT_ADDRESS}`;
}

function isAllowedHost(hostname) {
  const host = String(hostname || "").trim().toLowerCase();
  if (!host) return false;
  const normalized = host.replace(/^www\./, "");
  return ALLOWED_HOSTS.some((allowed) => {
    const cleanAllowed = allowed.replace(/^www\./, "");
    return host === allowed || normalized === cleanAllowed || host.endsWith(`.${cleanAllowed}`);
  });
}

function validateUrl(value, label = "URL") {
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

function validatePair(urlA, urlB, labelA = "URL A", labelB = "URL B") {
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

function parseAmountInWei(value) {
  const raw = String(value ?? "").trim();
  if (!raw || !Number.isFinite(Number(raw)) || Number(raw) <= 0) {
    throw new Error("Amount must be a positive number.");
  }
  return BigInt(Math.round(Number(raw) * 1_000_000_000_000_000_000));
}

function ensureWalletReady() {
  if (!state.walletAddress) {
    throw new Error("Connect a StudioNet wallet to write to the contract.");
  }
}

async function readContract(functionName, args = []) {
  return state.client.readContract({
    address: CONTRACT_ADDRESS,
    abi: ABI,
    functionName,
    args,
    stateStatus: "accepted",
  });
}

async function writeContract(functionName, args = [], value) {
  ensureWalletReady();

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

  return state.client.writeContract(payload);
}

async function refreshStats() {
  try {
    const countRaw = await readContract("get_grant_count");
    const reservedRaw = await readContract("get_reserved_funds");
    const count = Number(String(countRaw ?? "0"));
    const reserved = Number(BigInt(String(reservedRaw ?? "0")) / 1_000_000_000_000_000_000n);

    elements.statCount.textContent = Number.isFinite(count) ? String(count) : "—";
    elements.statReserved.textContent = Number.isFinite(reserved) ? `${reserved.toLocaleString(undefined, { maximumFractionDigits: 2 })} GEN` : "—";
  } catch (error) {
    elements.statCount.textContent = "—";
    elements.statReserved.textContent = "—";
    console.error(error);
  }
}

async function ensureChain(provider) {
  const chainId = `0x${Number(61999).toString(16)}`;

  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId }],
    });
  } catch (switchError) {
    if (switchError?.code === 4902 || switchError?.code === -32603) {
      await provider.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId,
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

async function connectWallet() {
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
    localStorage.setItem(WALLET_KEY, state.walletAddress);
    await ensureChain(state.provider);
    setWalletUi();
    setStatus("Wallet connected. You can create, fund, review, and inspect grants.");
    await refreshStats();
  } catch (error) {
    console.error(error);
    setStatus(error.message || "Wallet connection failed.");
  }
}

function disconnectWallet() {
  state.walletAddress = "";
  localStorage.removeItem(WALLET_KEY);
  setWalletUi();
  setStatus("Wallet disconnected. Connect a StudioNet wallet to write.");
}

async function restoreWalletOnLoad() {
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
      setWalletUi();
      setStatus("Wallet restored. You can continue from the desk.");
      await refreshStats();
    }
  } catch (error) {
    console.warn("Wallet restore failed:", error);
  }
}

function bindThemeControls() {
  elements.themeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const nextTheme = document.body.classList.contains("theme-light") ? "dark" : "light";
      applyTheme(nextTheme);
    });
  });
}

function showPage(pageName) {
  elements.rungButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.page === pageName);
  });

  elements.formPages.forEach((form) => {
    form.classList.toggle("hidden", form.dataset.page !== pageName);
  });
}

function bindViewControls() {
  elements.enterButtons.forEach((button) => {
    button.addEventListener("click", () => showApp());
  });

  if (elements.backLanding) {
    elements.backLanding.addEventListener("click", () => showLanding());
  }

  elements.rungButtons.forEach((button) => {
    button.addEventListener("click", () => showPage(button.dataset.page));
  });
}

function bindWalletControls() {
  elements.connectBtn.addEventListener("click", connectWallet);
  elements.disconnectBtn.addEventListener("click", disconnectWallet);
}

async function handleCreateGrant(event) {
  event.preventDefault();

  try {
    ensureWalletReady();
    const builder = document.getElementById("builder").value.trim();
    const title = document.getElementById("title").value.trim();
    const specText = document.getElementById("spec-text").value.trim();
    const specA = document.getElementById("spec-a").value.trim();
    const specB = document.getElementById("spec-b").value.trim();

    if (!/^0x[a-fA-F0-9]{40}$/.test(builder)) {
      throw new Error("Builder address must be a 0x + 40 hex address.");
    }
    if (builder.toLowerCase() === state.walletAddress) {
      throw new Error("Builder must be different from the connected wallet.");
    }
    if (!title) throw new Error("Grant title is required.");
    if (specText.length < 12) throw new Error("Spec text is too short.");

    const pair = validatePair(specA, specB, "Spec URL A", "Spec URL B");
    const txHash = await writeContract("create_grant", [builder, title, specText, pair.urlA, pair.urlB]);

    setTxLink(txHash);
    setStatus("Grant created. Next legal step: fund the next tranche.");
    event.target.reset();
    await refreshStats();
  } catch (error) {
    console.error(error);
    setStatus(error.message || "The grant could not be created.");
  }
}

async function handleFundTranche(event) {
  event.preventDefault();

  try {
    ensureWalletReady();
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

    const txHash = await writeContract(
      "fund_tranche",
      [grantId, milestoneText, milestoneDate, pair.urlA, pair.urlB],
      parseAmountInWei(amount),
    );

    setTxLink(txHash);
    setStatus("Tranche funded. Next legal step: attach evidence and open review.");
    event.target.reset();
    await refreshStats();
  } catch (error) {
    console.error(error);
    setStatus(error.message || "The tranche could not be funded.");
  }
}

async function handleEvidenceUpdate(event) {
  event.preventDefault();

  try {
    ensureWalletReady();
    const grantId = document.getElementById("evidence-grant-id").value.trim();
    const trancheIndex = document.getElementById("evidence-tranche").value.trim();
    const urlA = document.getElementById("work-a").value.trim();
    const urlB = document.getElementById("work-b").value.trim();

    if (!grantId || !trancheIndex) throw new Error("Grant id and tranche are required.");

    const pair = validatePair(urlA, urlB, "Work URL A", "Work URL B");
    const txHash = await writeContract("update_evidence", [grantId, BigInt(trancheIndex), pair.urlA, pair.urlB]);

    setTxLink(txHash);
    setStatus("Evidence updated. Next legal step: open review.");
    event.target.reset();
  } catch (error) {
    console.error(error);
    setStatus(error.message || "Evidence could not be updated.");
  }
}

async function handleOpenReview(event) {
  event.preventDefault();

  try {
    ensureWalletReady();
    const grantId = document.getElementById("review-grant-id").value.trim();
    const trancheIndex = document.getElementById("review-tranche").value.trim();

    if (!grantId || !trancheIndex) throw new Error("Grant id and tranche are required.");

    const txHash = await writeContract("open_review", [grantId, BigInt(trancheIndex)]);
    setTxLink(txHash);
    setStatus("Review opened. Release or expire the tranche next.");
    event.target.reset();
  } catch (error) {
    console.error(error);
    setStatus(error.message || "Review could not be opened.");
  }
}

async function handleRelease(event) {
  event.preventDefault();

  try {
    ensureWalletReady();
    const grantId = document.getElementById("release-grant-id").value.trim();
    const trancheIndex = document.getElementById("release-tranche").value.trim();

    if (!grantId || !trancheIndex) throw new Error("Grant id and tranche are required.");

    const txHash = await writeContract("release", [grantId, BigInt(trancheIndex)]);
    setTxLink(txHash);
    setStatus("Release submitted. YES pays the builder; NO closes and refunds.");
    event.target.reset();
    await refreshStats();
  } catch (error) {
    console.error(error);
    setStatus(error.message || "The tranche could not be released.");
  }
}

async function handleExpireReview(event) {
  event.preventDefault();

  try {
    ensureWalletReady();
    const grantId = document.getElementById("expire-grant-id").value.trim();
    const trancheIndex = document.getElementById("expire-tranche").value.trim();

    if (!grantId || !trancheIndex) throw new Error("Grant id and tranche are required.");

    const txHash = await writeContract("expire_review", [grantId, BigInt(trancheIndex)]);
    setTxLink(txHash);
    setStatus("Review expired. The tranche is returned to reserve.");
    event.target.reset();
  } catch (error) {
    console.error(error);
    setStatus(error.message || "The review could not be expired.");
  }
}

async function handleClawback(event) {
  event.preventDefault();

  try {
    ensureWalletReady();
    const grantId = document.getElementById("clawback-grant-id").value.trim();
    const trancheIndex = document.getElementById("clawback-tranche").value.trim();

    if (!grantId || !trancheIndex) throw new Error("Grant id and tranche are required.");

    const txHash = await writeContract("clawback", [grantId, BigInt(trancheIndex)]);
    setTxLink(txHash);
    setStatus("Clawback submitted. Reserved funds return to the funder.");
    event.target.reset();
    await refreshStats();
  } catch (error) {
    console.error(error);
    setStatus(error.message || "Clawback could not be executed.");
  }
}

async function handleLookup(event) {
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

    elements.lookupOut.textContent = JSON.stringify(payload, null, 2);
    setStatus("Lookup complete. Contract state has been fetched.");
  } catch (error) {
    console.error(error);
    elements.lookupOut.textContent = JSON.stringify({ error: error.message || "Lookup failed." }, null, 2);
    setStatus(error.message || "Lookup failed.");
  }
}

function bindForms() {
  document.getElementById("create-grant-form").addEventListener("submit", handleCreateGrant);
  document.getElementById("fund-form").addEventListener("submit", handleFundTranche);
  document.getElementById("evidence-form").addEventListener("submit", handleEvidenceUpdate);
  document.getElementById("review-form").addEventListener("submit", handleOpenReview);
  document.getElementById("release-form").addEventListener("submit", handleRelease);
  document.getElementById("expire-form").addEventListener("submit", handleExpireReview);
  document.getElementById("clawback-form").addEventListener("submit", handleClawback);
  document.getElementById("lookup-form").addEventListener("submit", handleLookup);
}

async function initialize() {
  const savedTheme = localStorage.getItem(THEME_KEY) || "dark";
  applyTheme(savedTheme);

  elements.contractLink.href = getContractUrl();
  elements.contractLink.textContent = `${CONTRACT_ADDRESS.slice(0, 6)}...${CONTRACT_ADDRESS.slice(-4)}`;

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

window.addEventListener("eip6963:announceProvider", (event) => {
  if (event?.detail?.provider?.request) {
    state.provider = event.detail.provider;
  }
});

if (window.eip6963?.providers?.length) {
  state.provider = getPreferredProvider();
}

initialize();

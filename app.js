import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

/*
  Add your Supabase project values below.
  1. Open Supabase Dashboard -> Project Settings -> API
  2. Copy the Project URL into SUPABASE_URL
  3. Copy the anon public key into SUPABASE_ANON_KEY
*/
const SUPABASE_URL = "https://fcajzowkvznlxjtxrqsa.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_ote8Cb9VduTloxQpUDHDYw_apegOBm8";
const COUNTDOWN_SUPABASE_URL = "https://ktkzmgmfjaeqowcoknfq.supabase.co";
const COUNTDOWN_SUPABASE_ANON_KEY =
  "sb_publishable_FgguM3IrP6DfIqZF6hm2QQ_sVAv8ogt";
const COUNTDOWNS_TABLE = "countdowns";
const COUNTDOWN_ROW_ID = "global-default";
const ACCESS_CONFIG_TABLE = "app_access_config";
const ACCESS_CONFIG_ROW_ID = "global-access";
const ACCESS_SESSION_KEY = "astra-daily-access-v1";
const REWARDS_TABLE = "rewards";
const COIN_TRANSACTIONS_TABLE = "coin_transactions";
const REWARD_REDEMPTIONS_TABLE = "reward_redemptions";
const WALLET_SUMMARY_VIEW = "wallet_summary";
const DURATION_OPTIONS = [15, 30, 45, 60, 90, 120];

const PRIORITY_RANK = {
  low: 1,
  medium: 2,
  high: 3,
  urgent: 4,
};

const INTEGER_FORMATTER = new Intl.NumberFormat("en-US");
const REWARD_EMOJI_OPTIONS = [
  "🎬",
  "🍿",
  "📺",
  "🎮",
  "🕹️",
  "🎧",
  "📚",
  "☕",
  "🍕",
  "🍔",
  "🍰",
  "🍫",
  "😴",
  "🛌",
  "🚶",
  "🌙",
  "📱",
  "💬",
  "🫶",
  "🛍️",
  "✨",
  "🏆",
  "🎯",
  "🪴",
];

const state = {
  tasks: [],
  view: "all",
  search: "",
  priorityFilter: "all",
  dateFilter: "all",
  categoryFilter: "all",
  sort: "smart",
  busy: false,
  editingId: null,
  selectedIds: new Set(),
  walletSummary: {
    balance: 0,
    total_earned: 0,
    total_spent: 0,
    total_reversed: 0,
    coins_earned_today: 0,
    coins_earned_week: 0,
    top_redeemed_category: "None",
    first_reward_redeemed: false,
    reached_100_coins: false,
    tasks_completed_for_rewards: 0,
  },
  rewards: [],
  transactions: [],
  redemptions: [],
  rewardEditingId: null,
  pendingRewardId: null,
};

let supabase = null;
let countdownSupabase = null;
let countdownInterval = null;
let countdownChannel = null;
let todayCountdownInterval = null;
let accessSessionInterval = null;
let appStarted = false;
let audioContext = null;

const accessState = {
  passphraseHash: "",
};

const countdownState = {
  targetDate: null,
  countdownStartTime: 0,
  totalDurationMs: 0,
  goal: "",
  note: "",
  resetPasskeyHash: "",
  previousParts: { hours: null, minutes: null, seconds: null },
};

const elements = {
  appShell: document.querySelector("#app-shell"),
  accessGate: document.querySelector("#access-gate"),
  accessForm: document.querySelector("#access-form"),
  accessKicker: document.querySelector("#access-kicker"),
  accessTitle: document.querySelector("#access-title"),
  accessDescription: document.querySelector("#access-description"),
  accessPassphrase: document.querySelector("#access-passphrase"),
  accessConfirmField: document.querySelector("#access-confirm-field"),
  accessConfirmPassphrase: document.querySelector("#access-confirm-passphrase"),
  accessSubmit: document.querySelector("#access-submit"),
  accessFeedback: document.querySelector("#access-feedback"),
  accessDateLabel: document.querySelector("#access-date-label"),
  accessSessionLabel: document.querySelector("#access-session-label"),
  syncStatus: document.querySelector("#sync-status"),
  feedback: document.querySelector("#feedback"),
  taskList: document.querySelector("#task-list"),
  emptyState: document.querySelector("#empty-state"),
  emptyMessage: document.querySelector("#empty-message"),
  template: document.querySelector("#task-template"),
  viewButtons: [...document.querySelectorAll(".view-link")],
  countAll: document.querySelector("#count-all"),
  countToday: document.querySelector("#count-today"),
  countUpcoming: document.querySelector("#count-upcoming"),
  countOverdue: document.querySelector("#count-overdue"),
  countStarred: document.querySelector("#count-starred"),
  countCompleted: document.querySelector("#count-completed"),
  todayProgressValue: document.querySelector("#today-progress-value"),
  todayProgressMeta: document.querySelector("#today-progress-meta"),
  todayProgressBar: document.querySelector("#today-progress-bar"),
  todayProgressFill: document.querySelector("#today-progress-fill"),
  todayCountdownCopy: document.querySelector("#today-countdown-copy"),
  todayHours: document.querySelector("#today-hours"),
  todayMinutes: document.querySelector("#today-minutes"),
  todaySeconds: document.querySelector("#today-seconds"),
  countdownGoal: document.querySelector("#countdown-goal"),
  countdownNote: document.querySelector("#countdown-note"),
  countdownDeadline: document.querySelector("#countdown-deadline"),
  countdownStatus: document.querySelector("#countdown-status"),
  countdownShell: document.querySelector("#countdown-shell"),
  countdownHoursGroup: document.querySelector("#countdown-hours-group"),
  countdownMinutesGroup: document.querySelector("#countdown-minutes-group"),
  countdownSecondsGroup: document.querySelector("#countdown-seconds-group"),
  countdownProgressValue: document.querySelector("#countdown-progress-value"),
  countdownProgressFill: document.querySelector("#countdown-progress-fill"),
  countdownProgressCaption: document.querySelector("#countdown-progress-caption"),
  countdownConfigure: document.querySelector("#countdown-configure"),
  countdownResetToggle: document.querySelector("#countdown-reset-toggle"),
  countdownFeedback: document.querySelector("#countdown-feedback"),
  countdownOverlay: document.querySelector("#countdown-overlay"),
  countdownResetOverlay: document.querySelector("#countdown-reset-overlay"),
  countdownForm: document.querySelector("#countdown-form"),
  countdownGoalInput: document.querySelector("#countdown-goal-input"),
  countdownNoteInput: document.querySelector("#countdown-note-input"),
  countdownDatetimeInput: document.querySelector("#countdown-datetime-input"),
  countdownPasskeyInput: document.querySelector("#countdown-passkey-input"),
  countdownCancel: document.querySelector("#countdown-cancel"),
  countdownFormError: document.querySelector("#countdown-form-error"),
  countdownResetForm: document.querySelector("#countdown-reset-form"),
  countdownPasskeyVerify: document.querySelector("#countdown-passkey-verify"),
  countdownResetCancel: document.querySelector("#countdown-reset-cancel"),
  countdownResetError: document.querySelector("#countdown-reset-error"),
  walletBalanceCard: document.querySelector("#wallet-balance-card"),
  walletEarnedCard: document.querySelector("#wallet-earned-card"),
  walletSpentCard: document.querySelector("#wallet-spent-card"),
  walletAwayCard: document.querySelector("#wallet-away-card"),
  walletQuestLabel: document.querySelector("#wallet-quest-label"),
  walletQuestTitle: document.querySelector("#wallet-quest-title"),
  walletQuestMeta: document.querySelector("#wallet-quest-meta"),
  walletQuestFill: document.querySelector("#wallet-quest-fill"),
  openRewards: document.querySelector("#open-rewards"),
  openRewardsHeader: document.querySelector("#open-rewards-header"),
  taskDurationInput: document.querySelector("#task-duration"),
  taskCoinPreview: document.querySelector("#task-coin-preview"),
  rewardsOverlay: document.querySelector("#rewards-overlay"),
  closeRewards: document.querySelector("#close-rewards"),
  rewardsFeedback: document.querySelector("#rewards-feedback"),
  walletBalancePill: document.querySelector("#wallet-balance-pill"),
  walletBalance: document.querySelector("#wallet-balance"),
  walletEarned: document.querySelector("#wallet-earned"),
  walletSpent: document.querySelector("#wallet-spent"),
  walletEarnedToday: document.querySelector("#wallet-earned-today"),
  walletEarnedWeek: document.querySelector("#wallet-earned-week"),
  walletTopCategory: document.querySelector("#wallet-top-category"),
  walletAwayModal: document.querySelector("#wallet-away-modal"),
  walletMilestones: document.querySelector("#wallet-milestones"),
  rewardHubTarget: document.querySelector("#reward-hub-target"),
  rewardHubCopy: document.querySelector("#reward-hub-copy"),
  rewardHubStatusMode: document.querySelector("#reward-hub-status-mode"),
  rewardHubStatusLane: document.querySelector("#reward-hub-status-lane"),
  rewardHubStatusReady: document.querySelector("#reward-hub-status-ready"),
  rewardHubBalance: document.querySelector("#reward-hub-balance"),
  rewardHubGap: document.querySelector("#reward-hub-gap"),
  rewardHubProgressFill: document.querySelector("#reward-hub-progress-fill"),
  rewardHubQueueCount: document.querySelector("#reward-hub-queue-count"),
  rewardHubReadyCount: document.querySelector("#reward-hub-ready-count"),
  rewardHubAverageCost: document.querySelector("#reward-hub-average-cost"),
  rewardHubFocusCategory: document.querySelector("#reward-hub-focus-category"),
  rewardHubQueueList: document.querySelector("#reward-hub-queue-list"),
  rewardHubQueueEmpty: document.querySelector("#reward-hub-queue-empty"),
  rewardHubCategorySignals: document.querySelector("#reward-hub-category-signals"),
  transactionList: document.querySelector("#transaction-list"),
  transactionEmpty: document.querySelector("#transaction-empty"),
  redemptionList: document.querySelector("#redemption-list"),
  redemptionEmpty: document.querySelector("#redemption-empty"),
  rewardForm: document.querySelector("#reward-form"),
  rewardTitleInput: document.querySelector("#reward-title"),
  rewardCategoryInput: document.querySelector("#reward-category"),
  rewardEmojiInput: document.querySelector("#reward-emoji"),
  rewardCostInput: document.querySelector("#reward-cost"),
  rewardDescriptionInput: document.querySelector("#reward-description"),
  rewardActiveInput: document.querySelector("#reward-active"),
  emojiPicker: document.querySelector("#emoji-picker"),
  rewardSaveButton: document.querySelector("#reward-save"),
  rewardResetButton: document.querySelector("#reward-reset"),
  rewardCancelButton: document.querySelector("#reward-cancel"),
  rewardList: document.querySelector("#reward-list"),
  rewardEmpty: document.querySelector("#reward-empty"),
  redeemOverlay: document.querySelector("#redeem-overlay"),
  redeemCopy: document.querySelector("#redeem-copy"),
  redeemRewardTitle: document.querySelector("#redeem-reward-title"),
  redeemRewardCost: document.querySelector("#redeem-reward-cost"),
  redeemConfirm: document.querySelector("#redeem-confirm"),
  redeemCancel: document.querySelector("#redeem-cancel"),
  redeemFeedback: document.querySelector("#redeem-feedback"),
  toastStack: document.querySelector("#toast-stack"),
  celebrationLayer: document.querySelector("#celebration-layer"),
  insightNextTitle: document.querySelector("#insight-next-title"),
  insightNextMeta: document.querySelector("#insight-next-meta"),
  insightFocusTitle: document.querySelector("#insight-focus-title"),
  insightFocusMeta: document.querySelector("#insight-focus-meta"),
  insightCompleteTitle: document.querySelector("#insight-complete-title"),
  insightCompleteMeta: document.querySelector("#insight-complete-meta"),
  searchInput: document.querySelector("#search-input"),
  priorityFilter: document.querySelector("#priority-filter"),
  dateFilter: document.querySelector("#date-filter"),
  sortSelect: document.querySelector("#sort-select"),
  categoryBar: document.querySelector("#category-bar"),
  clearCompleted: document.querySelector("#clear-completed"),
  refreshButton: document.querySelector("#refresh-button"),
  selectionBar: document.querySelector("#selection-bar"),
  selectedCount: document.querySelector("#selected-count"),
  completeSelected: document.querySelector("#complete-selected"),
  deleteSelected: document.querySelector("#delete-selected"),
  form: document.querySelector("#task-form"),
  formKicker: document.querySelector("#form-kicker"),
  titleInput: document.querySelector("#task-title"),
  categoryInput: document.querySelector("#task-category"),
  priorityInput: document.querySelector("#task-priority"),
  dueDateInput: document.querySelector("#task-due-date"),
  notesInput: document.querySelector("#task-notes"),
  starredInput: document.querySelector("#task-starred"),
  saveButton: document.querySelector("#save-button"),
  resetButton: document.querySelector("#reset-form"),
  cancelEditButton: document.querySelector("#cancel-edit"),
  quickDateButtons: [...document.querySelectorAll("[data-quick-date]")],
};

function isConfigured() {
  return (
    SUPABASE_URL !== "YOUR_SUPABASE_URL" &&
    SUPABASE_ANON_KEY !== "YOUR_SUPABASE_ANON_KEY"
  );
}

function todayKey() {
  const now = new Date();
  const timezoneOffset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - timezoneOffset).toISOString().slice(0, 10);
}

function formatAccessDate(date = new Date()) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function hasConfiguredPassphrase() {
  return Boolean(accessState.passphraseHash);
}

function readAccessSession() {
  try {
    const rawValue = localStorage.getItem(ACCESS_SESSION_KEY);
    return rawValue ? JSON.parse(rawValue) : null;
  } catch {
    return null;
  }
}

function hasValidAccessSession() {
  return readAccessSession()?.date === todayKey();
}

function persistAccessSession() {
  localStorage.setItem(
    ACCESS_SESSION_KEY,
    JSON.stringify({
      date: todayKey(),
      unlocked_at: new Date().toISOString(),
    })
  );
}

function clearAccessSession() {
  localStorage.removeItem(ACCESS_SESSION_KEY);
}

async function readAccessConfig() {
  const { data, error } = await supabase
    .from(ACCESS_CONFIG_TABLE)
    .select("id, passphrase_hash")
    .eq("id", ACCESS_CONFIG_ROW_ID)
    .maybeSingle();

  if (error) {
    throw error;
  }

  accessState.passphraseHash = data?.passphrase_hash || "";
  return data;
}

async function persistAccessConfig(passphraseHash) {
  const { error } = await supabase.rpc("set_shared_access_passphrase", {
    p_next_passphrase_hash: passphraseHash,
    p_current_passphrase_hash: null,
  });

  if (error) {
    throw error;
  }

  accessState.passphraseHash = passphraseHash;
}

function setAccessFeedback(message, type = "") {
  elements.accessFeedback.textContent = message;
  elements.accessFeedback.className = `feedback${type ? ` is-${type}` : ""}`;
}

function updateAccessCopy() {
  const configured = hasConfiguredPassphrase();

  elements.accessKicker.textContent = configured
    ? "Daily Access"
    : "Secure Setup";
  elements.accessTitle.textContent = configured
    ? "Unlock Astra"
    : "Create your passphrase";
  elements.accessDescription.textContent = configured
    ? "Enter the shared passphrase to open the workspace. Access stays valid until the local day changes."
    : "Create the shared passphrase for Astra. After setup, every device will use it once per day.";
  elements.accessConfirmField.hidden = configured;
  elements.accessConfirmPassphrase.required = !configured;
  elements.accessPassphrase.placeholder = configured
    ? "Enter today's passphrase"
    : "Create the shared passphrase";
  elements.accessSubmit.textContent = configured
    ? "Unlock Astra"
    : "Save and unlock";
}

function updateAccessMeta() {
  elements.accessDateLabel.textContent = formatAccessDate();
  elements.accessSessionLabel.textContent = hasConfiguredPassphrase()
    ? hasValidAccessSession()
      ? "Unlocked for today"
      : "Awaiting reauth"
    : "Not configured";
}

function showAccessGate(message = "") {
  clearAccessSession();
  elements.appShell.hidden = true;
  elements.accessGate.classList.remove("hidden");
  document.body.classList.add("is-locked");
  elements.accessPassphrase.value = "";
  elements.accessConfirmPassphrase.value = "";
  updateAccessCopy();
  updateAccessMeta();
  setAccessFeedback(
    message ||
      (hasConfiguredPassphrase()
        ? "Access resets automatically when the local day changes."
        : "Create the shared passphrase for Astra to use it across devices."),
    message ? "error" : ""
  );
  window.setTimeout(() => elements.accessPassphrase.focus(), 0);
}

function unlockWorkspaceForToday() {
  persistAccessSession();
  updateAccessMeta();
  elements.appShell.hidden = false;
  elements.accessGate.classList.add("hidden");
  document.body.classList.remove("is-locked");
  elements.accessPassphrase.value = "";
  setAccessFeedback("");
  bootApp();
}

async function refreshAccessState() {
  if (!supabase) {
    return false;
  }

  try {
    await readAccessConfig();
    updateAccessCopy();
    updateAccessMeta();
    return true;
  } catch (error) {
    console.error(error);
    setAccessFeedback(`Unable to load shared access: ${error.message}`, "error");
    return false;
  }
}

function startAccessSessionWatcher() {
  if (accessSessionInterval) {
    return;
  }

  accessSessionInterval = window.setInterval(() => {
    updateAccessMeta();

    if (!elements.appShell.hidden && !hasValidAccessSession()) {
      showAccessGate("Daily access expired. Enter the passphrase again.");
    }
  }, 60_000);
}

function normalizeWalletSummary(summary) {
  return {
    balance: Number(summary?.balance ?? 0),
    total_earned: Number(summary?.total_earned ?? 0),
    total_spent: Number(summary?.total_spent ?? 0),
    total_reversed: Number(summary?.total_reversed ?? 0),
    coins_earned_today: Number(summary?.coins_earned_today ?? 0),
    coins_earned_week: Number(summary?.coins_earned_week ?? 0),
    top_redeemed_category: summary?.top_redeemed_category || "None",
    first_reward_redeemed: Boolean(summary?.first_reward_redeemed),
    reached_100_coins: Boolean(summary?.reached_100_coins),
    tasks_completed_for_rewards: Number(summary?.tasks_completed_for_rewards ?? 0),
  };
}

function normalizeReward(reward) {
  return {
    ...reward,
    title: reward.title ?? "",
    emoji: reward.emoji ?? "",
    description: reward.description ?? "",
    coin_cost: Number(reward.coin_cost ?? 0),
    category: reward.category ?? "Personal",
    is_active: Boolean(reward.is_active),
    queue_position:
      reward.queue_position === null || reward.queue_position === undefined
        ? null
        : Number(reward.queue_position),
    created_at: reward.created_at ?? new Date().toISOString(),
  };
}

function normalizeTransaction(transaction) {
  return {
    ...transaction,
    amount: Number(transaction.amount ?? 0),
    metadata: transaction.metadata ?? {},
    created_at: transaction.created_at ?? new Date().toISOString(),
    note: transaction.note ?? "",
    label: transaction.label ?? "",
  };
}

function normalizeRedemption(redemption) {
  return {
    ...redemption,
    reward_title: redemption.reward_title ?? "",
    reward_category: redemption.reward_category ?? "Personal",
    reward_cost: Number(redemption.reward_cost ?? 0),
    created_at: redemption.created_at ?? new Date().toISOString(),
  };
}

function setRewardsFeedback(message, type = "") {
  elements.rewardsFeedback.textContent = message;
  elements.rewardsFeedback.className = `feedback${type ? ` is-${type}` : ""}`;
}

function setRedeemFeedback(message, type = "") {
  elements.redeemFeedback.textContent = message;
  elements.redeemFeedback.className = `feedback${type ? ` is-${type}` : ""}`;
}

function animateNumber(element, value, formatter = (entry) => String(entry)) {
  const targetValue = Number(value) || 0;
  const currentValue = Number(element.dataset.value ?? targetValue);

  if (prefersReducedMotion()) {
    element.dataset.value = String(targetValue);
    element.textContent = formatter(targetValue);
    return;
  }

  const startTime = performance.now();
  const duration = 420;

  function tick(now) {
    const progress = Math.min(1, (now - startTime) / duration);
    const eased = 1 - Math.pow(1 - progress, 3);
    const nextValue = Math.round(currentValue + (targetValue - currentValue) * eased);
    element.textContent = formatter(nextValue);

    if (progress < 1) {
      window.requestAnimationFrame(tick);
      return;
    }

    element.dataset.value = String(targetValue);
    element.textContent = formatter(targetValue);
  }

  window.requestAnimationFrame(tick);
}

function showToast(message, type = "default") {
  const toast = document.createElement("div");
  toast.className = `toast toast--${type}`;
  toast.textContent = message;
  elements.toastStack.appendChild(toast);

  window.setTimeout(() => {
    toast.classList.add("is-leaving");
    window.setTimeout(() => toast.remove(), 240);
  }, 2600);
}

function playCelebrationSound(type = "task") {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
      return;
    }

    audioContext = audioContext || new AudioContextClass();
    if (audioContext.state === "suspended") {
      audioContext.resume();
    }

    const notes =
      type === "reward"
        ? [523.25, 659.25, 783.99]
        : [659.25, 783.99, 987.77];

    const start = audioContext.currentTime + 0.01;

    notes.forEach((frequency, index) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      const noteStart = start + index * 0.08;
      const noteEnd = noteStart + 0.22;

      oscillator.type = index === notes.length - 1 ? "triangle" : "sine";
      oscillator.frequency.setValueAtTime(frequency, noteStart);

      gainNode.gain.setValueAtTime(0.0001, noteStart);
      gainNode.gain.exponentialRampToValueAtTime(0.045, noteStart + 0.014);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, noteEnd);

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.start(noteStart);
      oscillator.stop(noteEnd);
    });
  } catch (error) {
    console.error("Celebration sound unavailable:", error);
  }
}

function launchCelebration(type = "reward") {
  if (prefersReducedMotion()) {
    return;
  }

  const shower = document.createElement("div");
  shower.className = `confetti-shower confetti-shower--${type}`;

  const confettiCount = type === "reward" ? 64 : 48;
  for (let index = 0; index < confettiCount; index += 1) {
    const piece = document.createElement("span");
    piece.className = "confetti-piece";
    piece.style.setProperty("--confetti-left", `${Math.random() * 100}%`);
    piece.style.setProperty("--confetti-delay", `${Math.random() * 120}ms`);
    piece.style.setProperty("--confetti-drift", `${(Math.random() - 0.5) * 180}px`);
    piece.style.setProperty("--confetti-rotate", `${Math.random() * 520 - 260}deg`);
    piece.style.setProperty("--confetti-duration", `${1100 + Math.random() * 900}ms`);
    piece.style.setProperty("--confetti-size", `${0.45 + Math.random() * 0.5}rem`);
    shower.appendChild(piece);
  }

  const burst = document.createElement("div");
  burst.className = `spark-burst spark-burst--${type}`;

  for (let index = 0; index < 14; index += 1) {
    const particle = document.createElement("span");
    particle.style.setProperty("--spark-index", String(index));
    particle.style.setProperty("--spark-rotate", `${index * 24}deg`);
    burst.appendChild(particle);
  }

  elements.celebrationLayer.appendChild(shower);
  elements.celebrationLayer.appendChild(burst);
  window.setTimeout(() => shower.remove(), 2400);
  window.setTimeout(() => burst.remove(), 1400);
}

function parseRewardSequence(title) {
  const normalizedTitle = String(title ?? "")
    .replace(/\s+/g, " ")
    .trim();

  if (!normalizedTitle) {
    return null;
  }

  const patterns = [
    /^(?:watch\s+)?(?:season|s)\s*(\d+)\s*(?:episode|ep|e)\s*(\d+)\s+(?:of|for)\s+(.+)$/i,
    /^(.*?)(?:\s+(?:season|s)\s*(\d+)\s*(?:episode|ep|e)\s*(\d+))$/i,
    /^(.*?)(?:\s+(?:season|s)\s*(\d+)\s*[-:]\s*(?:episode|ep|e)\s*(\d+))$/i,
    /^(.*?)(?:\s+(?:episode|ep|e)\s*(\d+))$/i,
  ];

  for (const [patternIndex, pattern] of patterns.entries()) {
    const match = normalizedTitle.match(pattern);
    if (!match) {
      continue;
    }

    const startsWithSeason = patternIndex === 0;
    const rawBase = startsWithSeason
      ? match[3].trim().replace(/^watch\s+/i, "").trim()
      : match[1].trim().replace(/^watch\s+/i, "").trim();
    const season = startsWithSeason
      ? Number(match[1])
      : match.length === 4
        ? Number(match[2])
        : 1;
    const episode = startsWithSeason
      ? Number(match[2])
      : match.length === 4
        ? Number(match[3])
        : Number(match[2]);

    if (!rawBase || Number.isNaN(season) || Number.isNaN(episode)) {
      return null;
    }

    return {
      seriesKey: rawBase.toLowerCase(),
      seriesLabel: rawBase,
      season,
      episode,
    };
  }

  return null;
}

function compareRewardSequence(left, right) {
  return left.season - right.season || left.episode - right.episode;
}

function getQueuedRewards() {
  return [...state.rewards]
    .filter((reward) => reward.queue_position !== null)
    .sort((left, right) => left.queue_position - right.queue_position);
}

function getRewardQuestInsight() {
  const activeRewards = state.rewards
    .filter((reward) => reward.is_active)
    .sort((left, right) => left.coin_cost - right.coin_cost);

  if (!activeRewards.length) {
    return {
      label: "Start a reward quest",
      title: "No reward quest yet",
      copy: "Create a reward to give your progress something meaningful to unlock.",
      gap: 0,
      progress: 0,
    };
  }

  const rewardsWithSequence = activeRewards
    .map((reward) => ({
      reward,
      sequence: parseRewardSequence(reward.title),
    }))
    .filter((entry) => entry.sequence);

  const queuedRewards = getQueuedRewards().filter((reward) => reward.is_active);
  if (queuedRewards.length) {
    const redeemedTitles = new Set(
      state.redemptions.map((redemption) => redemption.reward_title.trim().toLowerCase())
    );
    const nextQueuedReward =
      queuedRewards.find((reward) => !redeemedTitles.has(reward.title.trim().toLowerCase())) ||
      queuedRewards[0];
    const queueIndex = queuedRewards.findIndex(
      (reward) => reward.id === nextQueuedReward.id
    );
    const gap = Math.max(0, nextQueuedReward.coin_cost - state.walletSummary.balance);

    return {
      label: `Queue item ${queueIndex + 1} of ${queuedRewards.length}`,
      title: nextQueuedReward.title,
      copy:
        gap === 0
          ? `${nextQueuedReward.title} is ready. It is next in your reward queue.`
          : `Your reward queue is active. You are ${gap} coins away from ${nextQueuedReward.title}.`,
      gap,
      progress: Math.min(
        100,
        Math.round((state.walletSummary.balance / nextQueuedReward.coin_cost) * 100)
      ),
    };
  }

  for (const redemption of state.redemptions) {
    const redeemedSequence = parseRewardSequence(redemption.reward_title);
    if (!redeemedSequence) {
      continue;
    }

    const nextEpisode = rewardsWithSequence
      .filter(
        (entry) =>
          entry.sequence.seriesKey === redeemedSequence.seriesKey &&
          compareRewardSequence(entry.sequence, redeemedSequence) > 0
      )
      .sort((left, right) => compareRewardSequence(left.sequence, right.sequence))[0];

    if (!nextEpisode) {
      continue;
    }

    const gap = Math.max(0, nextEpisode.reward.coin_cost - state.walletSummary.balance);
    const progress = Math.min(
      100,
      Math.round((state.walletSummary.balance / nextEpisode.reward.coin_cost) * 100)
    );

    return {
      label: "Series quest",
      title: nextEpisode.reward.title,
      copy:
        gap === 0
          ? `${nextEpisode.reward.title} is unlocked. Redeem it when you are ready for the next episode.`
          : `You are ${gap} coins away from ${nextEpisode.reward.title}. Keep the story going.`,
      gap,
      progress,
    };
  }

  const affordableReward = activeRewards.find(
    (reward) => reward.coin_cost <= state.walletSummary.balance
  );

  if (affordableReward) {
    return {
      label: "Ready to redeem",
      title: affordableReward.title,
      copy: `You can redeem ${affordableReward.title} right now.`,
      gap: 0,
      progress: 100,
    };
  }

  const nextReward = activeRewards[0];
  const gap = nextReward.coin_cost - state.walletSummary.balance;
  return {
    label: "Next unlock",
    title: nextReward.title,
    copy: `You are ${gap} coins away from ${nextReward.title}.`,
    gap,
    progress: Math.min(100, Math.round((state.walletSummary.balance / nextReward.coin_cost) * 100)),
  };
}

function getWalletGapCopy() {
  return getRewardQuestInsight().copy;
}

function renderRewardQuest() {
  const quest = getRewardQuestInsight();
  const queuedRewards = getQueuedRewards().filter((reward) => reward.is_active);
  const readyCount = state.rewards.filter(
    (reward) => reward.is_active && reward.coin_cost <= state.walletSummary.balance
  ).length;

  elements.walletQuestLabel.textContent = quest.label;
  elements.walletQuestTitle.textContent = quest.title;
  elements.walletQuestMeta.textContent = quest.copy;
  elements.walletQuestFill.style.width = `${quest.progress}%`;

  elements.rewardHubTarget.textContent = quest.title;
  elements.rewardHubCopy.textContent = quest.copy;
  elements.rewardHubStatusMode.textContent = queuedRewards.length
    ? "Queue navigation"
    : "Open discovery";
  elements.rewardHubStatusLane.textContent =
    state.walletSummary.top_redeemed_category === "None"
      ? "Fresh lane"
      : state.walletSummary.top_redeemed_category;
  animateNumber(elements.rewardHubStatusReady, readyCount, formatInteger);
  animateNumber(elements.rewardHubBalance, state.walletSummary.balance, formatInteger);
  animateNumber(elements.rewardHubGap, quest.gap, formatInteger);
  elements.rewardHubProgressFill.style.width = `${quest.progress}%`;
}

function renderRewardHubIntel() {
  const queuedRewards = getQueuedRewards().filter((reward) => reward.is_active);
  const activeRewards = state.rewards.filter((reward) => reward.is_active);
  const readyCount = activeRewards.filter(
    (reward) => reward.coin_cost <= state.walletSummary.balance
  ).length;
  const averageCost = activeRewards.length
    ? Math.round(
        activeRewards.reduce((sum, reward) => sum + reward.coin_cost, 0) /
          activeRewards.length
      )
    : 0;

  const categoryCounts = activeRewards.reduce((map, reward) => {
    map.set(reward.category, (map.get(reward.category) ?? 0) + 1);
    return map;
  }, new Map());

  const focusCategory =
    [...categoryCounts.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] ||
    "None";

  animateNumber(elements.rewardHubQueueCount, queuedRewards.length, formatInteger);
  animateNumber(elements.rewardHubReadyCount, readyCount, formatInteger);
  animateNumber(elements.rewardHubAverageCost, averageCost, formatInteger);
  elements.rewardHubFocusCategory.textContent = focusCategory;
}

function renderRewardQueuePreview() {
  const queuedRewards = getQueuedRewards().filter((reward) => reward.is_active);
  elements.rewardHubQueueList.innerHTML = "";
  elements.rewardHubQueueEmpty.hidden = queuedRewards.length > 0;

  for (const reward of queuedRewards.slice(0, 3)) {
    const card = document.createElement("article");
    card.className = "queue-preview-card";
    const gap = Math.max(0, reward.coin_cost - state.walletSummary.balance);
    const progress = Math.min(
      100,
      Math.round((state.walletSummary.balance / reward.coin_cost) * 100)
    );
    const ready = gap === 0;

    card.innerHTML = `
      <div class="queue-preview-card__head">
        <span class="queue-preview-card__badge">#${reward.queue_position}</span>
        <span class="queue-preview-card__emoji">${escapeHtml(reward.emoji || "✨")}</span>
      </div>
      <div class="queue-preview-card__copy">
        <strong>${escapeHtml(reward.title)}</strong>
        <p>${ready ? "Ready to redeem now." : `${gap} coins away`}</p>
      </div>
      <div class="queue-preview-card__meta">
        <span class="queue-preview-card__pill">${escapeHtml(reward.category)}</span>
        <span class="queue-preview-card__pill${ready ? " is-live" : ""}">
          ${ready ? "Ready now" : `${reward.coin_cost} coins`}
        </span>
      </div>
      <div class="queue-preview-card__progress" aria-hidden="true">
        <span style="width: ${progress}%"></span>
      </div>
    `;

    elements.rewardHubQueueList.appendChild(card);
  }
}

function renderRewardCategorySignals() {
  const categories = new Map();

  for (const reward of state.rewards.filter((entry) => entry.is_active)) {
    const bucket =
      categories.get(reward.category) ?? { count: 0, totalCost: 0, ready: 0 };
    bucket.count += 1;
    bucket.totalCost += reward.coin_cost;
    if (reward.coin_cost <= state.walletSummary.balance) {
      bucket.ready += 1;
    }
    categories.set(reward.category, bucket);
  }

  elements.rewardHubCategorySignals.innerHTML = "";

  if (!categories.size) {
    const empty = document.createElement("div");
    empty.className = "reward-signal-card reward-signal-card--empty";
    empty.innerHTML =
      "<strong>No active reward lanes</strong><p>Create or activate rewards to see category signals.</p>";
    elements.rewardHubCategorySignals.appendChild(empty);
    return;
  }

  const sorted = [...categories.entries()].sort((left, right) => {
    if (right[1].count !== left[1].count) {
      return right[1].count - left[1].count;
    }

    return left[0].localeCompare(right[0]);
  });

  for (const [category, bucket] of sorted) {
    const average = Math.round(bucket.totalCost / Math.max(1, bucket.count));
    const readiness = Math.min(100, Math.round((bucket.ready / Math.max(1, bucket.count)) * 100));
    const card = document.createElement("article");
    card.className = "reward-signal-card";
    card.innerHTML = `
      <div class="reward-signal-card__head">
        <strong>${escapeHtml(category)}</strong>
        <span>${bucket.count} reward${bucket.count === 1 ? "" : "s"}</span>
      </div>
      <p class="reward-signal-card__meta">
        Avg ${average} coins • ${bucket.ready} ready now
      </p>
      <div class="reward-signal-card__progress" aria-hidden="true">
        <span style="width: ${readiness}%"></span>
      </div>
    `;
    elements.rewardHubCategorySignals.appendChild(card);
  }
}

function renderEmojiPicker() {
  const selectedEmoji = elements.rewardEmojiInput.value.trim();
  elements.emojiPicker.innerHTML = "";

  for (const emoji of REWARD_EMOJI_OPTIONS) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `emoji-picker__option${
      selectedEmoji === emoji ? " is-active" : ""
    }`;
    button.dataset.emoji = emoji;
    button.setAttribute("role", "option");
    button.setAttribute("aria-selected", String(selectedEmoji === emoji));
    button.textContent = emoji;
    elements.emojiPicker.appendChild(button);
  }
}

function updateTaskCoinPreview() {
  const reward = calculateSclutchCoins(elements.taskDurationInput.value);
  elements.taskCoinPreview.textContent = `+${reward} ${formatCoins(reward)}`;
}

function setTaskInState(task) {
  const normalizedTask = normalizeTask(task);
  const existingIndex = state.tasks.findIndex((entry) => entry.id === normalizedTask.id);

  if (existingIndex >= 0) {
    state.tasks.splice(existingIndex, 1, normalizedTask);
    return normalizedTask;
  }

  state.tasks.unshift(normalizedTask);
  return normalizedTask;
}

async function refreshEconomySilently() {
  try {
    await refreshEconomy();
  } catch (error) {
    console.error(error);
    setRewardsFeedback(`Unable to sync rewards data: ${error.message}`, "error");
    showToast("Rewards wallet could not be refreshed.", "error");
  }
}

function resetRewardForm() {
  state.rewardEditingId = null;
  elements.rewardForm.reset();
  elements.rewardCategoryInput.value = "Entertainment";
  elements.rewardActiveInput.checked = true;
  elements.rewardEmojiInput.value = "✨";
  elements.rewardSaveButton.textContent = "Save reward";
  elements.rewardCancelButton.hidden = true;
  renderEmojiPicker();
}

function populateRewardForm(reward) {
  state.rewardEditingId = reward.id;
  elements.rewardTitleInput.value = reward.title;
  elements.rewardCategoryInput.value = reward.category;
  elements.rewardEmojiInput.value = reward.emoji;
  elements.rewardCostInput.value = String(reward.coin_cost);
  elements.rewardDescriptionInput.value = reward.description;
  elements.rewardActiveInput.checked = reward.is_active;
  elements.rewardSaveButton.textContent = "Update reward";
  elements.rewardCancelButton.hidden = false;
  renderEmojiPicker();
}

function getRewardFormPayload() {
  return {
    title: elements.rewardTitleInput.value.trim(),
    category: elements.rewardCategoryInput.value,
    emoji: elements.rewardEmojiInput.value.trim(),
    coin_cost: Number(elements.rewardCostInput.value),
    description: elements.rewardDescriptionInput.value.trim(),
    is_active: elements.rewardActiveInput.checked,
  };
}

function updateWalletPreview() {
  animateNumber(elements.walletBalanceCard, state.walletSummary.balance, formatInteger);
  animateNumber(elements.walletEarnedCard, state.walletSummary.total_earned, formatInteger);
  animateNumber(elements.walletSpentCard, state.walletSummary.total_spent, formatInteger);
  elements.walletAwayCard.textContent = getWalletGapCopy();
}

function renderWalletHub() {
  animateNumber(elements.walletBalancePill, state.walletSummary.balance, formatInteger);
  animateNumber(elements.walletBalance, state.walletSummary.balance, formatInteger);
  animateNumber(elements.walletEarned, state.walletSummary.total_earned, formatInteger);
  animateNumber(elements.walletSpent, state.walletSummary.total_spent, formatInteger);
  animateNumber(elements.walletEarnedToday, state.walletSummary.coins_earned_today, formatInteger);
  animateNumber(elements.walletEarnedWeek, state.walletSummary.coins_earned_week, formatInteger);
  elements.walletTopCategory.textContent = state.walletSummary.top_redeemed_category;
  elements.walletAwayModal.textContent = getWalletGapCopy();
  renderRewardQuest();

  const milestones = [
    state.walletSummary.first_reward_redeemed ? "First Reward Redeemed" : "",
    state.walletSummary.reached_100_coins ? "100 Coins Earned" : "",
    state.walletSummary.tasks_completed_for_rewards >= 7 ? "7 Tasks Completed" : "",
  ].filter(Boolean);

  elements.walletMilestones.innerHTML = "";

  if (!milestones.length) {
    const emptyMilestone = document.createElement("p");
    emptyMilestone.className = "wallet-milestones__empty";
    emptyMilestone.textContent = "Milestones unlock as you complete real work consistently.";
    elements.walletMilestones.appendChild(emptyMilestone);
    return;
  }

  for (const milestone of milestones) {
    const badge = document.createElement("span");
    badge.className = "milestone-badge";
    badge.textContent = milestone;
    elements.walletMilestones.appendChild(badge);
  }
}

function renderTransactions() {
  elements.transactionList.innerHTML = "";
  elements.transactionEmpty.hidden = state.transactions.length > 0;

  for (const transaction of state.transactions) {
    const item = document.createElement("li");
    item.className = "transaction-item";

    const amount = document.createElement("strong");
    amount.className = `transaction-item__amount transaction-item__amount--${transaction.amount > 0 ? "positive" : "negative"}`;
    amount.textContent = `${transaction.amount > 0 ? "+" : ""}${transaction.amount}`;

    item.innerHTML = `
      <div class="transaction-item__copy">
        <span class="transaction-item__label">${escapeHtml(transaction.label)}</span>
        <p class="transaction-item__meta">${escapeHtml(transaction.note || transaction.type)} • ${escapeHtml(formatDateTime(transaction.created_at))}</p>
      </div>
    `;
    item.prepend(amount);
    elements.transactionList.appendChild(item);
  }
}

function renderRedemptions() {
  elements.redemptionList.innerHTML = "";
  elements.redemptionEmpty.hidden = state.redemptions.length > 0;

  for (const redemption of state.redemptions) {
    const item = document.createElement("li");
    item.className = "redemption-item";
    item.innerHTML = `
      <div class="redemption-item__copy">
        <span class="redemption-item__label">${escapeHtml(redemption.reward_title)}</span>
        <p class="redemption-item__meta">${escapeHtml(redemption.reward_category)} • ${escapeHtml(formatDateTime(redemption.created_at))}</p>
      </div>
      <strong class="redemption-item__cost">-${redemption.reward_cost} coins</strong>
    `;
    elements.redemptionList.appendChild(item);
  }
}

function renderRewards() {
  elements.rewardList.innerHTML = "";
  elements.rewardEmpty.hidden = state.rewards.length > 0;
  const queuedRewardIds = getQueuedRewards().map((reward) => reward.id);
  const sortedRewards = [...state.rewards].sort((left, right) => {
    const leftQueue = left.queue_position ?? Number.MAX_SAFE_INTEGER;
    const rightQueue = right.queue_position ?? Number.MAX_SAFE_INTEGER;

    if (leftQueue !== rightQueue) {
      return leftQueue - rightQueue;
    }

    if (left.is_active !== right.is_active) {
      return Number(right.is_active) - Number(left.is_active);
    }

    return left.coin_cost - right.coin_cost;
  });

  for (const reward of sortedRewards) {
    const item = document.createElement("article");
    item.className = `reward-card${reward.is_active ? "" : " is-inactive"}${
      reward.queue_position !== null ? " is-queued" : ""
    }`;
    item.dataset.id = String(reward.id);

    const affordable = state.walletSummary.balance >= reward.coin_cost;
    const queueIndex =
      reward.queue_position !== null ? queuedRewardIds.indexOf(reward.id) + 1 : null;
    const isFirstQueued = queueIndex === 1;
    const isLastQueued = queueIndex === queuedRewardIds.length;

    item.innerHTML = `
      <div class="reward-card__head">
        <div class="reward-card__title-wrap">
          <span class="reward-card__emoji">${escapeHtml(reward.emoji || "✨")}</span>
          <div>
            <h3>${escapeHtml(reward.title)}</h3>
            <p>${escapeHtml(reward.description || "A deliberate self-reward after focused work.")}</p>
          </div>
        </div>
        <strong class="reward-card__cost">${reward.coin_cost} coins</strong>
      </div>
      <div class="reward-card__meta">
        <span class="meta-pill">${escapeHtml(reward.category)}</span>
        <span class="meta-pill${reward.is_active ? " is-active" : ""}">${reward.is_active ? "Active" : "Inactive"}</span>
        ${
          queueIndex
            ? `<span class="meta-pill meta-pill--queued">Queue #${queueIndex}</span>`
            : ""
        }
      </div>
      <div class="reward-card__actions">
        <button class="primary-button" data-reward-action="redeem" type="button" ${!reward.is_active || !affordable ? "disabled" : ""}>
          Redeem
        </button>
        <button class="ghost-button" data-reward-action="queue" type="button">
          ${queueIndex ? "Remove from queue" : "Add to queue"}
        </button>
        <button class="ghost-button" data-reward-action="move-up" type="button" ${!queueIndex || isFirstQueued ? "disabled" : ""}>
          Move up
        </button>
        <button class="ghost-button" data-reward-action="move-down" type="button" ${!queueIndex || isLastQueued ? "disabled" : ""}>
          Move down
        </button>
        <button class="ghost-button" data-reward-action="edit" type="button">
          Edit
        </button>
        <button class="ghost-button" data-reward-action="toggle" type="button">
          ${reward.is_active ? "Deactivate" : "Activate"}
        </button>
        <button class="ghost-button danger-text" data-reward-action="delete" type="button">
          Delete
        </button>
      </div>
    `;

    elements.rewardList.appendChild(item);
  }
}

function renderEconomy() {
  updateWalletPreview();
  renderWalletHub();
  renderRewardHubIntel();
  renderRewardQueuePreview();
  renderRewardCategorySignals();
  renderTransactions();
  renderRedemptions();
  renderRewards();
}

async function refreshEconomy() {
  const [walletResponse, rewardsResponse, transactionsResponse, redemptionsResponse] =
    await Promise.all([
      supabase.from(WALLET_SUMMARY_VIEW).select("*").maybeSingle(),
      supabase
        .from(REWARDS_TABLE)
        .select("*")
        .order("is_active", { ascending: false })
        .order("coin_cost", { ascending: true })
        .order("created_at", { ascending: true }),
      supabase
        .from(COIN_TRANSACTIONS_TABLE)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10),
      supabase
        .from(REWARD_REDEMPTIONS_TABLE)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(8),
    ]);

  const errors = [
    walletResponse.error,
    rewardsResponse.error,
    transactionsResponse.error,
    redemptionsResponse.error,
  ].filter(Boolean);

  if (errors.length) {
    throw errors[0];
  }

  state.walletSummary = normalizeWalletSummary(walletResponse.data);
  state.rewards = (rewardsResponse.data ?? []).map(normalizeReward);
  state.transactions = (transactionsResponse.data ?? []).map(normalizeTransaction);
  state.redemptions = (redemptionsResponse.data ?? []).map(normalizeRedemption);
  renderEconomy();
}

function showRewardsModal() {
  elements.rewardsOverlay.classList.remove("hidden");
  document.body.classList.add("is-locked");
  window.setTimeout(() => elements.rewardTitleInput.focus(), 0);
}

function hideRewardsModal() {
  elements.rewardsOverlay.classList.add("hidden");
  if (elements.redeemOverlay.classList.contains("hidden")) {
    document.body.classList.remove("is-locked");
  }
  setRewardsFeedback("");
  resetRewardForm();
}

function showRedeemModal(reward) {
  state.pendingRewardId = reward.id;
  elements.redeemRewardTitle.textContent = `${reward.emoji || "✨"} ${reward.title}`;
  elements.redeemRewardCost.textContent = `${reward.coin_cost} coins`;
  elements.redeemCopy.textContent = `Spend ${reward.coin_cost} Sclutch Coins on "${reward.title}"?`;
  elements.redeemOverlay.classList.remove("hidden");
  document.body.classList.add("is-locked");
  setRedeemFeedback("");
}

function hideRedeemModal() {
  state.pendingRewardId = null;
  elements.redeemOverlay.classList.add("hidden");
  if (elements.rewardsOverlay.classList.contains("hidden")) {
    document.body.classList.remove("is-locked");
  }
  setRedeemFeedback("");
}

function formatDate(dateValue) {
  if (!dateValue) {
    return "No due date";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${dateValue}T00:00:00`));
}

function formatRelativeCreated(isoDate) {
  const date = new Date(isoDate);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function formatDateTime(isoDate) {
  if (!isoDate) {
    return "";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(isoDate));
}

function formatDuration(minutes) {
  const duration = Number(minutes) || 0;

  if (duration >= 60 && duration % 60 === 0) {
    return `${duration / 60} hr`;
  }

  if (duration > 60) {
    return `${(duration / 60).toFixed(1)} hr`;
  }

  return `${duration} min`;
}

function calculateSclutchCoins(durationMinutes) {
  const duration = Math.max(1, Number(durationMinutes) || 15);
  return Math.max(1, Math.floor(((duration * 4) - 1) / 15));
}

function formatCoins(value) {
  return `Sclutch Coin${Math.abs(value) === 1 ? "" : "s"}`;
}

function formatInteger(value) {
  return INTEGER_FORMATTER.format(Number(value) || 0);
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function padTime(value) {
  return String(value).padStart(2, "0");
}

function setTodayDigit(element, value) {
  if (element.textContent === value) {
    return;
  }

  element.textContent = value;
  element.classList.remove("is-ticking");
  void element.offsetWidth;
  element.classList.add("is-ticking");
}

function coerceCountdownTimestamp(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const numericValue = Number(value);
    if (Number.isFinite(numericValue)) {
      return numericValue;
    }

    const parsedValue = Date.parse(value);
    if (!Number.isNaN(parsedValue)) {
      return parsedValue;
    }
  }

  return 0;
}

function arrayBufferToHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
}

async function hashText(value) {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return arrayBufferToHex(digest);
}

function getDefaultLocalDateTime() {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  const plusOneHour = new Date(now.getTime() + 60 * 60 * 1000);
  return plusOneHour.toISOString().slice(0, 16);
}

function createCountdownDigit(initialValue = "0") {
  const digit = document.createElement("div");
  digit.className = "countdown-digit";
  digit.dataset.value = initialValue;
  digit.innerHTML = `
    <div class="countdown-digit__half countdown-digit__half--top"><span>${initialValue}</span></div>
    <div class="countdown-digit__half countdown-digit__half--bottom"><span>${initialValue}</span></div>
  `;
  return digit;
}

function syncCountdownDigitCount(container, desiredCount) {
  while (container.children.length < desiredCount) {
    container.prepend(createCountdownDigit("0"));
  }

  while (container.children.length > desiredCount) {
    container.removeChild(container.firstElementChild);
  }
}

function swapCountdownDigit(digitElement, nextValue) {
  const currentValue = digitElement.dataset.value;
  if (currentValue === nextValue) {
    return;
  }

  const topStatic = digitElement.querySelector(
    ".countdown-digit__half--top span"
  );
  const bottomStatic = digitElement.querySelector(
    ".countdown-digit__half--bottom span"
  );

  digitElement.querySelectorAll(".countdown-digit__overlay").forEach((element) =>
    element.remove()
  );

  const exitOverlay = document.createElement("div");
  exitOverlay.className = "countdown-digit__overlay countdown-digit__overlay--exit";
  exitOverlay.textContent = currentValue;

  const enterOverlay = document.createElement("div");
  enterOverlay.className =
    "countdown-digit__overlay countdown-digit__overlay--enter";
  enterOverlay.textContent = nextValue;

  digitElement.append(exitOverlay, enterOverlay);
  topStatic.textContent = nextValue;
  bottomStatic.textContent = nextValue;

  exitOverlay.addEventListener("animationend", () => exitOverlay.remove(), {
    once: true,
  });
  enterOverlay.addEventListener("animationend", () => enterOverlay.remove(), {
    once: true,
  });

  digitElement.dataset.value = nextValue;
}

function updateCountdownGroup(container, value, minDigits = 2) {
  const valueString = String(value).padStart(minDigits, "0");
  syncCountdownDigitCount(container, valueString.length);
  Array.from(container.children).forEach((digitElement, index) => {
    swapCountdownDigit(digitElement, valueString[index]);
  });
}

function normalizePersistedCountdownState(state) {
  if (!state) {
    return null;
  }

  const totalDurationValue = Number(
    state.totalDurationMs ?? state.total_duration_ms ?? 0
  );

  return {
    goal: String(state.goal || "").trim(),
    note: String(state.note || "").trim(),
    targetDateISO: state.targetDateISO || state.target_date || "",
    countdownStartTime: coerceCountdownTimestamp(
      state.countdownStartTime ?? state.countdown_start_time ?? 0
    ),
    totalDurationMs: Number.isFinite(totalDurationValue) ? totalDurationValue : 0,
    resetPasskeyHash: state.resetPasskeyHash || state.reset_passkey_hash || "",
  };
}

function setCountdownFeedback(message, type = "") {
  elements.countdownFeedback.textContent = message;
  elements.countdownFeedback.className = `feedback${
    type ? ` is-${type}` : ""
  }`;
}

function setCountdownFormError(message, type = "") {
  elements.countdownFormError.textContent = message;
  elements.countdownFormError.className = `feedback${
    type ? ` is-${type}` : ""
  }`;
}

function setCountdownResetError(message, type = "") {
  elements.countdownResetError.textContent = message;
  elements.countdownResetError.className = `feedback${
    type ? ` is-${type}` : ""
  }`;
}

function showCountdownSetup() {
  elements.countdownOverlay.classList.remove("hidden");
  elements.countdownFormError.textContent = "";
  window.setTimeout(() => elements.countdownGoalInput.focus(), 0);
}

function hideCountdownSetup() {
  elements.countdownOverlay.classList.add("hidden");
  elements.countdownFormError.textContent = "";
}

function showCountdownReset() {
  if (!countdownState.resetPasskeyHash) {
    return;
  }

  elements.countdownResetOverlay.classList.remove("hidden");
  elements.countdownPasskeyVerify.value = "";
  elements.countdownResetError.textContent = "";
  window.setTimeout(() => elements.countdownPasskeyVerify.focus(), 0);
}

function hideCountdownReset() {
  elements.countdownResetOverlay.classList.add("hidden");
  elements.countdownPasskeyVerify.value = "";
  elements.countdownResetError.textContent = "";
}

function formatCountdownTargetDate(date) {
  return date.toLocaleString([], {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatCountdownDaysLeft(diffMs) {
  const totalSeconds = Math.max(0, Math.floor(diffMs / 1000));
  const totalDays = Math.floor(totalSeconds / 86400);

  if (totalSeconds <= 0) {
    return "Countdown complete";
  }

  if (totalDays === 1) {
    return "1 day left";
  }

  return `${totalDays} days left`;
}

function updateCountdownHeader() {
  elements.countdownGoal.textContent =
    countdownState.goal || "No active countdown";
  elements.countdownNote.textContent =
    countdownState.note ||
    "This countdown stays synced with your connected countdown workspace.";
  elements.countdownDeadline.textContent = countdownState.targetDate
    ? formatCountdownTargetDate(countdownState.targetDate)
    : "Not set";
}

function resetCountdownDisplay() {
  if (countdownInterval) {
    clearInterval(countdownInterval);
    countdownInterval = null;
  }

  countdownState.targetDate = null;
  countdownState.countdownStartTime = 0;
  countdownState.totalDurationMs = 0;
  countdownState.goal = "";
  countdownState.note = "";
  countdownState.resetPasskeyHash = "";
  countdownState.previousParts = { hours: null, minutes: null, seconds: null };

  updateCountdownGroup(elements.countdownHoursGroup, 0, 2);
  updateCountdownGroup(elements.countdownMinutesGroup, 0, 2);
  updateCountdownGroup(elements.countdownSecondsGroup, 0, 2);

  elements.countdownShell.classList.remove("is-live", "is-complete");
  elements.countdownProgressValue.textContent = "0.0%";
  elements.countdownProgressFill.style.width = "0%";
  elements.countdownProgressCaption.textContent =
    "Countdown progress will appear here once a target is active.";
  elements.countdownStatus.textContent = "Waiting";
  elements.countdownConfigure.textContent = "Set countdown";
  elements.countdownResetToggle.hidden = true;
  updateCountdownHeader();
}

function subscribeToCountdown() {
  if (!countdownSupabase || countdownChannel) {
    return;
  }

  countdownChannel = countdownSupabase
    .channel("countdown-sync")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: COUNTDOWNS_TABLE,
        filter: `id=eq.${COUNTDOWN_ROW_ID}`,
      },
      async (payload) => {
        if (payload.eventType === "DELETE") {
          resetCountdownDisplay();
          return;
        }

        const nextState = normalizePersistedCountdownState(payload.new);
        if (!applyCountdownState(nextState)) {
          const savedState = await readPersistedCountdownState();
          if (!savedState || !applyCountdownState(savedState)) {
            resetCountdownDisplay();
          }
        }
      }
    )
    .subscribe();
}

function normalizeTask(task) {
  return {
    ...task,
    title: task.title ?? "",
    notes: task.notes ?? "",
    category: task.category ?? "General",
    priority: task.priority ?? "medium",
    due_date: task.due_date ?? "",
    completed: Boolean(task.completed),
    starred: Boolean(task.starred),
    created_at: task.created_at ?? new Date().toISOString(),
    completed_at: task.completed_at ?? null,
    estimated_duration_minutes: Number(task.estimated_duration_minutes ?? 30),
    coin_reward: Number(
      task.coin_reward ??
        calculateSclutchCoins(task.estimated_duration_minutes ?? 30)
    ),
    coins_awarded: Boolean(task.coins_awarded),
    coin_awarded_transaction_id: task.coin_awarded_transaction_id ?? null,
    coin_reversed_transaction_id: task.coin_reversed_transaction_id ?? null,
  };
}

function isOverdue(task) {
  return Boolean(task.due_date) && !task.completed && task.due_date < todayKey();
}

function isToday(task) {
  return Boolean(task.due_date) && !task.completed && task.due_date === todayKey();
}

function isUpcoming(task) {
  return Boolean(task.due_date) && !task.completed && task.due_date > todayKey();
}

function isWithinNextDays(task, days) {
  if (!task.due_date || task.completed) {
    return false;
  }

  const today = new Date(`${todayKey()}T00:00:00`);
  const target = new Date(task.due_date + "T00:00:00");
  const diff = Math.round((target - today) / 86_400_000);
  return diff >= 0 && diff <= days;
}

function getBaseViewTasks(view) {
  switch (view) {
    case "today":
      return state.tasks.filter(isToday);
    case "upcoming":
      return state.tasks.filter(isUpcoming);
    case "overdue":
      return state.tasks.filter(isOverdue);
    case "starred":
      return state.tasks.filter((task) => task.starred && !task.completed);
    case "completed":
      return state.tasks.filter((task) => task.completed);
    default:
      return [...state.tasks];
  }
}

function getVisibleTasks() {
  const searchTerm = state.search.trim().toLowerCase();

  let tasks = getBaseViewTasks(state.view);

  if (state.priorityFilter !== "all") {
    tasks = tasks.filter((task) => task.priority === state.priorityFilter);
  }

  if (searchTerm) {
    tasks = tasks.filter((task) =>
      [task.title, task.notes, task.category]
        .join(" ")
        .toLowerCase()
        .includes(searchTerm)
    );
  }

  if (state.dateFilter === "today") {
    tasks = tasks.filter((task) => task.due_date === todayKey());
  }

  if (state.dateFilter === "next-7") {
    tasks = tasks.filter((task) => isWithinNextDays(task, 7));
  }

  if (state.dateFilter === "overdue") {
    tasks = tasks.filter(isOverdue);
  }

  if (state.dateFilter === "no-date") {
    tasks = tasks.filter((task) => !task.due_date);
  }

  if (state.categoryFilter !== "all") {
    tasks = tasks.filter((task) => task.category === state.categoryFilter);
  }

  return sortTasks(tasks, state.sort);
}

function sortTasks(tasks, mode) {
  const sorted = [...tasks];

  sorted.sort((left, right) => {
    if (mode === "alphabetical") {
      return left.title.localeCompare(right.title);
    }

    if (mode === "newest") {
      return new Date(right.created_at) - new Date(left.created_at);
    }

    if (mode === "oldest") {
      return new Date(left.created_at) - new Date(right.created_at);
    }

    if (mode === "priority") {
      return (
        PRIORITY_RANK[right.priority] - PRIORITY_RANK[left.priority] ||
        new Date(right.created_at) - new Date(left.created_at)
      );
    }

    if (mode === "due-date") {
      const leftDue = left.due_date || "9999-12-31";
      const rightDue = right.due_date || "9999-12-31";
      return leftDue.localeCompare(rightDue);
    }

    const completionScore = Number(left.completed) - Number(right.completed);
    if (completionScore !== 0) {
      return completionScore;
    }

    const starScore = Number(right.starred) - Number(left.starred);
    if (starScore !== 0) {
      return starScore;
    }

    const overdueScore = Number(isOverdue(right)) - Number(isOverdue(left));
    if (overdueScore !== 0) {
      return overdueScore;
    }

    const dueRank = (left.due_date || "9999-12-31").localeCompare(
      right.due_date || "9999-12-31"
    );
    if (dueRank !== 0) {
      return dueRank;
    }

    const priorityScore =
      PRIORITY_RANK[right.priority] - PRIORITY_RANK[left.priority];
    if (priorityScore !== 0) {
      return priorityScore;
    }

    return new Date(right.created_at) - new Date(left.created_at);
  });

  return sorted;
}

function setFeedback(message, type = "") {
  elements.feedback.textContent = message;
  elements.feedback.className = `feedback${type ? ` is-${type}` : ""}`;
}

function setSyncStatus(message, type = "") {
  elements.syncStatus.textContent = message;
  elements.syncStatus.className = `status-pill${type ? ` is-${type}` : ""}`;
}

function setBusy(isBusy) {
  state.busy = isBusy;
  elements.saveButton.disabled = isBusy;
  elements.resetButton.disabled = isBusy;
  elements.cancelEditButton.disabled = isBusy;
  elements.refreshButton.disabled = isBusy;
  elements.clearCompleted.disabled = isBusy;
  elements.completeSelected.disabled = isBusy;
  elements.deleteSelected.disabled = isBusy;
  elements.openRewards.disabled = isBusy;
  elements.openRewardsHeader.disabled = isBusy;
  elements.rewardSaveButton.disabled = isBusy;
  elements.rewardResetButton.disabled = isBusy;
  elements.rewardCancelButton.disabled = isBusy;
  elements.closeRewards.disabled = isBusy;
  elements.redeemConfirm.disabled = isBusy;
  elements.redeemCancel.disabled = isBusy;
}

function setControlsDisabled(disabled) {
  [
    elements.searchInput,
    elements.priorityFilter,
    elements.dateFilter,
    elements.sortSelect,
    elements.titleInput,
    elements.categoryInput,
    elements.priorityInput,
    elements.taskDurationInput,
    elements.dueDateInput,
    elements.notesInput,
    elements.starredInput,
    elements.saveButton,
    elements.resetButton,
    elements.cancelEditButton,
    elements.clearCompleted,
    elements.refreshButton,
    elements.completeSelected,
    elements.deleteSelected,
    ...elements.quickDateButtons,
  ].forEach((element) => {
    element.disabled = disabled;
  });

  elements.viewButtons.forEach((button) => {
    button.disabled = disabled;
  });
}

function resetForm() {
  state.editingId = null;
  elements.form.reset();
  elements.priorityInput.value = "medium";
  elements.taskDurationInput.value = "30";
  elements.formKicker.textContent = "Create task";
  elements.saveButton.textContent = "Save task";
  elements.cancelEditButton.hidden = true;
  updateTaskCoinPreview();
}

function populateForm(task) {
  state.editingId = task.id;
  elements.formKicker.textContent = "Edit task";
  elements.saveButton.textContent = "Update task";
  elements.cancelEditButton.hidden = false;
  elements.titleInput.value = task.title;
  elements.categoryInput.value = task.category;
  elements.priorityInput.value = task.priority;
  elements.dueDateInput.value = task.due_date || "";
  elements.taskDurationInput.value = String(task.estimated_duration_minutes || 30);
  elements.notesInput.value = task.notes;
  elements.starredInput.checked = task.starred;
  updateTaskCoinPreview();
  elements.titleInput.focus();
}

function getTaskFormPayload() {
  return {
    title: elements.titleInput.value.trim(),
    category: elements.categoryInput.value.trim() || "General",
    priority: elements.priorityInput.value,
    due_date: elements.dueDateInput.value || null,
    estimated_duration_minutes: Number(elements.taskDurationInput.value),
    notes: elements.notesInput.value.trim(),
    starred: elements.starredInput.checked,
  };
}

function getDateOffset(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  const timezoneOffset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 10);
}

function updateSelectionBar() {
  const selectedCount = state.selectedIds.size;
  elements.selectionBar.hidden = selectedCount === 0;
  elements.selectedCount.textContent = String(selectedCount);
  elements.completeSelected.disabled = selectedCount === 0 || state.busy;
  elements.deleteSelected.disabled = selectedCount === 0 || state.busy;
}

function updateViewCounts() {
  elements.countAll.textContent = String(state.tasks.length);
  elements.countToday.textContent = String(state.tasks.filter(isToday).length);
  elements.countUpcoming.textContent = String(state.tasks.filter(isUpcoming).length);
  elements.countOverdue.textContent = String(state.tasks.filter(isOverdue).length);
  elements.countStarred.textContent = String(
    state.tasks.filter((task) => task.starred && !task.completed).length
  );
  elements.countCompleted.textContent = String(
    state.tasks.filter((task) => task.completed).length
  );
}

function updateTodayProgress() {
  const todaysTasks = state.tasks.filter((task) => task.due_date === todayKey());
  const completedTodayTasks = todaysTasks.filter((task) => task.completed).length;
  const remainingTodayTasks = todaysTasks.length - completedTodayTasks;
  const todaySummary = {
    total: todaysTasks.length,
    completed: completedTodayTasks,
    remaining: remainingTodayTasks,
  };
  const percent = todaysTasks.length
    ? Math.round((completedTodayTasks / todaysTasks.length) * 100)
    : 0;

  elements.todayProgressValue.textContent = `${percent}%`;
  elements.todayProgressBar.setAttribute("aria-valuenow", String(percent));
  elements.todayProgressFill.style.width = `${percent}%`;

  if (!todaysTasks.length) {
    elements.todayProgressMeta.textContent = "No tasks are scheduled for today.";
    updateTodayCountdown(todaySummary);
    return;
  }

  if (percent === 100) {
    elements.todayProgressMeta.textContent = `All ${todaysTasks.length} task${
      todaysTasks.length === 1 ? "" : "s"
    } due today are complete.`;
    updateTodayCountdown(todaySummary);
    return;
  }

  elements.todayProgressMeta.textContent = `${completedTodayTasks} of ${
    todaysTasks.length
  } task${todaysTasks.length === 1 ? "" : "s"} due today completed.`;
  updateTodayCountdown(todaySummary);
}

function updateTodayCountdown(summary = null) {
  const todaysTasks =
    summary ??
    (() => {
      const tasks = state.tasks.filter((task) => task.due_date === todayKey());
      const completed = tasks.filter((task) => task.completed).length;
      return {
        total: tasks.length,
        completed,
        remaining: tasks.length - completed,
      };
    })();

  const now = new Date();
  const endOfDay = new Date(now);
  endOfDay.setHours(24, 0, 0, 0);

  const diffMs = Math.max(0, endOfDay.getTime() - now.getTime());
  const totalSeconds = Math.floor(diffMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  setTodayDigit(elements.todayHours, padTime(hours));
  setTodayDigit(elements.todayMinutes, padTime(minutes));
  setTodayDigit(elements.todaySeconds, padTime(seconds));

  if (!todaysTasks.total) {
    elements.todayCountdownCopy.textContent =
      "No tasks are scheduled today, but there is still time to plan ahead.";
    return;
  }

  if (todaysTasks.remaining === 0) {
    elements.todayCountdownCopy.textContent = `Today's ${todaysTasks.total} task${
      todaysTasks.total === 1 ? "" : "s"
    } are complete. Use the remaining time to reset for tomorrow.`;
    return;
  }

  elements.todayCountdownCopy.textContent = `${todaysTasks.remaining} task${
    todaysTasks.remaining === 1 ? "" : "s"
  } still need attention before the day closes.`;
}

function startTodayCountdown() {
  if (todayCountdownInterval) {
    return;
  }

  updateTodayCountdown();
  todayCountdownInterval = window.setInterval(() => {
    updateTodayCountdown();
  }, 1000);
}

async function persistCountdownState(payload) {
  const normalized = normalizePersistedCountdownState(payload);
  if (
    !normalized?.targetDateISO ||
    !normalized?.countdownStartTime ||
    !normalized?.resetPasskeyHash
  ) {
    return;
  }

  const { error } = await countdownSupabase.from(COUNTDOWNS_TABLE).upsert(
    {
      id: COUNTDOWN_ROW_ID,
      goal: normalized.goal,
      note: normalized.note,
      target_date: normalized.targetDateISO,
      countdown_start_time: new Date(
        normalized.countdownStartTime
      ).toISOString(),
      total_duration_ms: normalized.totalDurationMs,
      reset_passkey_hash: normalized.resetPasskeyHash,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );

  if (error) {
    throw error;
  }
}

async function readPersistedCountdownState() {
  const { data, error } = await countdownSupabase
    .from(COUNTDOWNS_TABLE)
    .select(
      "id, goal, note, target_date, countdown_start_time, total_duration_ms, reset_passkey_hash"
    )
    .eq("id", COUNTDOWN_ROW_ID)
    .maybeSingle();

  if (error) {
    console.error("Countdown Supabase read failed:", error);
    setCountdownFeedback(`Unable to load countdown: ${error.message}`, "error");
    return null;
  }

  return normalizePersistedCountdownState(data);
}

async function clearPersistedCountdownState() {
  const { error } = await countdownSupabase
    .from(COUNTDOWNS_TABLE)
    .delete()
    .eq("id", COUNTDOWN_ROW_ID);

  if (error) {
    console.error("Countdown Supabase delete failed:", error);
    throw error;
  }
}

function updateCountdownProgressUI(diffMs) {
  if (
    !countdownState.countdownStartTime ||
    countdownState.totalDurationMs <= 0
  ) {
    elements.countdownProgressValue.textContent = "0.0%";
    elements.countdownProgressFill.style.width = "0%";
    elements.countdownProgressCaption.textContent =
      "Countdown progress will appear here once a target is active.";
    elements.countdownStatus.textContent = "Waiting";
    return;
  }

  const totalDurationSeconds = Math.max(
    1,
    Math.ceil(countdownState.totalDurationMs / 1000)
  );
  const remainingSeconds = Math.max(0, Math.floor(diffMs / 1000));
  const elapsedSeconds = Math.max(0, totalDurationSeconds - remainingSeconds);
  const progress = Math.min(1, Math.max(0, elapsedSeconds / totalDurationSeconds));
  const progressPercent = (progress * 100).toFixed(1);

  elements.countdownProgressValue.textContent = `${progressPercent}%`;
  elements.countdownProgressFill.style.width = `${progressPercent}%`;

  if (remainingSeconds <= 0) {
    elements.countdownProgressValue.textContent = "100.0%";
    elements.countdownProgressFill.style.width = "100%";
    elements.countdownProgressCaption.textContent =
      "Countdown completed successfully.";
    elements.countdownStatus.textContent = "Countdown complete";
  } else {
    elements.countdownProgressCaption.textContent = `${progressPercent}% completed and updating live with every tick.`;
    elements.countdownStatus.textContent = formatCountdownDaysLeft(diffMs);
  }
}

function renderCountdown(diffMs) {
  const remainingSeconds = Math.max(0, Math.floor(diffMs / 1000));
  const hours = Math.floor(remainingSeconds / 3600);
  const minutes = Math.floor((remainingSeconds % 3600) / 60);
  const seconds = remainingSeconds % 60;

  updateCountdownGroup(elements.countdownHoursGroup, hours, 2);
  updateCountdownGroup(elements.countdownMinutesGroup, minutes, 2);
  updateCountdownGroup(elements.countdownSecondsGroup, seconds, 2);

  countdownState.previousParts = { hours, minutes, seconds };
  updateCountdownProgressUI(diffMs);
  elements.countdownDeadline.textContent = countdownState.targetDate
    ? formatCountdownTargetDate(countdownState.targetDate)
    : "Not set";

  if (remainingSeconds <= 0) {
    if (countdownInterval) {
      clearInterval(countdownInterval);
      countdownInterval = null;
    }

    elements.countdownShell.classList.add("is-complete");
    elements.countdownShell.classList.remove("is-live");
  } else {
    elements.countdownShell.classList.remove("is-complete");
    elements.countdownShell.classList.add("is-live");
  }
}

function applyCountdownState(state) {
  const normalized = normalizePersistedCountdownState(state);
  if (!normalized?.targetDateISO) {
    return false;
  }

  countdownState.goal = normalized.goal;
  countdownState.note = normalized.note;
  countdownState.targetDate = new Date(normalized.targetDateISO);
  countdownState.countdownStartTime = Number(
    normalized.countdownStartTime || Date.now()
  );
  countdownState.totalDurationMs = Number(
    normalized.totalDurationMs ||
      Math.max(
        0,
        countdownState.targetDate.getTime() - countdownState.countdownStartTime
      )
  );
  countdownState.resetPasskeyHash = normalized.resetPasskeyHash || "";

  if (Number.isNaN(countdownState.targetDate.getTime())) {
    return false;
  }

  updateCountdownHeader();
  elements.countdownConfigure.textContent = "Edit countdown";
  elements.countdownResetToggle.hidden = false;
  hideCountdownReset();

  if (countdownInterval) {
    clearInterval(countdownInterval);
  }

  renderCountdown(countdownState.targetDate.getTime() - Date.now());
  countdownInterval = window.setInterval(() => {
    renderCountdown(countdownState.targetDate.getTime() - Date.now());
  }, 1000);

  return true;
}

async function startCountdown(payload) {
  const normalized = normalizePersistedCountdownState(payload);
  if (!normalized?.targetDateISO) {
    setCountdownFeedback("Unable to start countdown.", "error");
    return;
  }

  await persistCountdownState(normalized);
  const applied = applyCountdownState(normalized);
  if (!applied) {
    setCountdownFeedback("Unable to start countdown.", "error");
    return;
  }

  hideCountdownSetup();
  setCountdownFeedback("Countdown synced.", "success");
}

async function resetCountdownToInitialView() {
  await clearPersistedCountdownState();
  resetCountdownDisplay();
  hideCountdownReset();
  setCountdownFeedback("Countdown reset.", "success");
}

async function initCountdown() {
  resetCountdownDisplay();
  elements.countdownDatetimeInput.value = getDefaultLocalDateTime();

  const savedState = await readPersistedCountdownState();
  if (savedState && savedState.targetDateISO && savedState.resetPasskeyHash) {
    const restored = applyCountdownState(savedState);
    if (!restored) {
      resetCountdownDisplay();
    }
  }
}

function updateInsights() {
  const activeTasks = state.tasks.filter((task) => !task.completed);
  const nextDueTask = [...activeTasks]
    .filter((task) => task.due_date)
    .sort((left, right) => left.due_date.localeCompare(right.due_date))[0];

  const focusTask = [...activeTasks].sort((left, right) => {
    const starScore = Number(right.starred) - Number(left.starred);
    if (starScore !== 0) {
      return starScore;
    }

    const priorityScore =
      PRIORITY_RANK[right.priority] - PRIORITY_RANK[left.priority];
    if (priorityScore !== 0) {
      return priorityScore;
    }

    return (left.due_date || "9999-12-31").localeCompare(
      right.due_date || "9999-12-31"
    );
  })[0];

  const completedToday = state.tasks.filter((task) => {
    if (!task.completed_at) {
      return false;
    }

    return task.completed_at.slice(0, 10) === todayKey();
  }).length;

  elements.insightNextTitle.textContent = nextDueTask
    ? nextDueTask.title
    : "None";
  elements.insightNextMeta.textContent = nextDueTask
    ? formatDate(nextDueTask.due_date)
    : "No scheduled task";

  elements.insightFocusTitle.textContent = focusTask ? focusTask.title : "None";
  elements.insightFocusMeta.textContent = focusTask
    ? `${focusTask.priority} priority${focusTask.due_date ? ` • ${formatDate(focusTask.due_date)}` : ""}`
    : "No priority task";

  elements.insightCompleteTitle.textContent = `${completedToday} task${
    completedToday === 1 ? "" : "s"
  }`;
  elements.insightCompleteMeta.textContent = completedToday
    ? "Closed today"
    : "No completions yet";
}

function getCategoryCounts() {
  const searchTerm = state.search.trim().toLowerCase();
  let tasks = getBaseViewTasks(state.view);

  if (state.priorityFilter !== "all") {
    tasks = tasks.filter((task) => task.priority === state.priorityFilter);
  }

  if (state.dateFilter === "today") {
    tasks = tasks.filter((task) => task.due_date === todayKey());
  }

  if (state.dateFilter === "next-7") {
    tasks = tasks.filter((task) => isWithinNextDays(task, 7));
  }

  if (state.dateFilter === "overdue") {
    tasks = tasks.filter(isOverdue);
  }

  if (state.dateFilter === "no-date") {
    tasks = tasks.filter((task) => !task.due_date);
  }

  if (searchTerm) {
    tasks = tasks.filter((task) =>
      [task.title, task.notes, task.category]
        .join(" ")
        .toLowerCase()
        .includes(searchTerm)
    );
  }

  const counts = new Map();

  for (const task of tasks) {
    counts.set(task.category, (counts.get(task.category) ?? 0) + 1);
  }

  return [...counts.entries()].sort((left, right) =>
    left[0].localeCompare(right[0])
  );
}

function renderCategoryChips() {
  const categories = getCategoryCounts();
  const categoryNames = new Set(categories.map(([category]) => category));

  if (state.categoryFilter !== "all" && !categoryNames.has(state.categoryFilter)) {
    state.categoryFilter = "all";
  }

  if (!categories.length) {
    elements.categoryBar.innerHTML = "";
    return;
  }

  const total = categories.reduce((sum, [, count]) => sum + count, 0);
  elements.categoryBar.innerHTML = "";

  const allButton = document.createElement("button");
  allButton.type = "button";
  allButton.className = `category-chip${
    state.categoryFilter === "all" ? " is-active" : ""
  }`;
  allButton.dataset.category = "all";
  allButton.append("All categories ");

  const allCount = document.createElement("span");
  allCount.className = "category-chip__count";
  allCount.textContent = String(total);
  allButton.append(allCount);
  elements.categoryBar.append(allButton);

  for (const [category, count] of categories) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `category-chip${
      state.categoryFilter === category ? " is-active" : ""
    }`;
    button.dataset.category = category;
    button.append(`${category} `);

    const countNode = document.createElement("span");
    countNode.className = "category-chip__count";
    countNode.textContent = String(count);
    button.append(countNode);

    elements.categoryBar.append(button);
  }
}

function getEmptyMessage() {
  if (state.search.trim()) {
    return "No tasks match your search. Try a different keyword or clear a filter.";
  }

  if (state.categoryFilter !== "all") {
    return "No tasks match this category right now.";
  }

  if (state.view === "today") {
    return "Nothing is due today. Add a due date or switch to another view.";
  }

  if (state.view === "upcoming") {
    return "No upcoming tasks yet. Schedule something to see it here.";
  }

  if (state.view === "overdue") {
    return "Great news: there are no overdue tasks right now.";
  }

  if (state.view === "completed") {
    return "Completed tasks will appear here after you finish them.";
  }

  if (state.view === "starred") {
    return "Star important work to keep it in a dedicated focus view.";
  }

  if (state.priorityFilter !== "all") {
    return "No tasks match this priority filter yet.";
  }

  return "Create your first task to start building a more intentional workflow.";
}

function renderTasks() {
  const tasks = getVisibleTasks();
  elements.taskList.innerHTML = "";

  if (tasks.length === 0) {
    elements.emptyState.hidden = false;
    elements.emptyMessage.textContent = getEmptyMessage();
    return;
  }

  elements.emptyState.hidden = true;

  for (const task of tasks) {
    const fragment = elements.template.content.cloneNode(true);
    const item = fragment.querySelector(".task-card");
    const taskSelect = fragment.querySelector(".task-select");
    const taskComplete = fragment.querySelector(".task-complete");
    const starButton = fragment.querySelector(".star-button");
    const title = fragment.querySelector(".task-title");
    const notes = fragment.querySelector(".task-notes");
    const priorityPill = fragment.querySelector(".priority-pill");
    const categoryPill = fragment.querySelector(".category-pill");
    const durationPill = fragment.querySelector(".duration-pill");
    const coinPill = fragment.querySelector(".coin-pill");
    const duePill = fragment.querySelector(".due-pill");
    const statePill = fragment.querySelector(".state-pill");
    const createdPill = fragment.querySelector(".created-pill");

    item.dataset.id = String(task.id);
    item.classList.toggle("is-selected", state.selectedIds.has(task.id));
    item.classList.toggle("is-completed", task.completed);
    item.classList.toggle("is-overdue", isOverdue(task));

    taskSelect.checked = state.selectedIds.has(task.id);
    taskComplete.checked = task.completed;

    title.textContent = task.title;
    notes.textContent = task.notes;

    starButton.textContent = task.starred ? "Starred" : "Star";
    starButton.classList.toggle("is-starred", task.starred);
    starButton.setAttribute(
      "aria-label",
      task.starred ? "Remove important mark" : "Mark as important"
    );

    priorityPill.textContent = `${task.priority} priority`;
    priorityPill.dataset.priority = task.priority;

    categoryPill.textContent = task.category;
    durationPill.textContent = formatDuration(task.estimated_duration_minutes);
    if (task.completed && task.coins_awarded) {
      coinPill.textContent = `Earned +${task.coin_reward}`;
    } else if (task.coin_reversed_transaction_id) {
      coinPill.textContent = "Award reversed";
    } else {
      coinPill.textContent = `Earn +${task.coin_reward}`;
    }
    coinPill.classList.toggle("is-earned", task.completed && task.coins_awarded);
    coinPill.classList.toggle("is-reversed", Boolean(task.coin_reversed_transaction_id));

    duePill.textContent = task.due_date ? formatDate(task.due_date) : "No due date";
    duePill.classList.toggle("is-overdue", isOverdue(task));

    statePill.textContent = task.completed ? "Completed" : "Active";
    statePill.classList.toggle("is-completed", task.completed);
    statePill.classList.toggle("is-active", !task.completed);

    createdPill.textContent = `Created ${formatRelativeCreated(task.created_at)}`;

    elements.taskList.appendChild(fragment);
  }
}

function render() {
  updateViewCounts();
  updateTodayProgress();
  updateInsights();
  renderCategoryChips();
  updateSelectionBar();
  renderTasks();
}

function syncStateTasks(tasks) {
  state.tasks = tasks.map(normalizeTask);
  const validIds = new Set(state.tasks.map((task) => task.id));
  state.selectedIds = new Set(
    [...state.selectedIds].filter((id) => validIds.has(id))
  );
}

async function fetchTasks() {
  setBusy(true);
  setSyncStatus("Syncing", "loading");
  setFeedback("Loading tasks...");

  const { data, error } = await supabase
    .from("todos")
    .select("*")
    .order("created_at", { ascending: false });

  setBusy(false);

  if (error) {
    console.error(error);
    setSyncStatus("Sync issue", "error");
    setFeedback(`Unable to load tasks: ${error.message}`, "error");
    return;
  }

  syncStateTasks(data ?? []);
  render();
  setSyncStatus("Supabase connected", "connected");
  setFeedback(
    state.tasks.length
      ? "Workspace synced successfully."
      : "Workspace is ready for your first task.",
    "success"
  );

  try {
    await refreshEconomy();
  } catch (economyError) {
    console.error(economyError);
    setRewardsFeedback(
      `Rewards wallet could not be refreshed: ${economyError.message}`,
      "error"
    );
  }
}

async function createTask(payload) {
  setBusy(true);
  setSyncStatus("Saving", "loading");
  setFeedback("Saving task...");

  const { data, error } = await supabase
    .from("todos")
    .insert([payload])
    .select()
    .single();

  setBusy(false);

  if (error) {
    console.error(error);
    setSyncStatus("Sync issue", "error");
    setFeedback(`Could not save task: ${error.message}`, "error");
    return;
  }

  state.tasks.unshift(normalizeTask(data));
  resetForm();
  render();
  setSyncStatus("Supabase connected", "connected");
  setFeedback("Task created.", "success");
}

async function saveTask(payload) {
  if (!payload.title) {
    setFeedback("Task title cannot be empty.", "error");
    elements.titleInput.focus();
    return;
  }

  if (state.editingId === null) {
    await createTask(payload);
    return;
  }

  setBusy(true);
  setSyncStatus("Updating", "loading");
  setFeedback("Updating task...");

  const { data, error } = await supabase
    .from("todos")
    .update(payload)
    .eq("id", state.editingId)
    .select()
    .single();

  setBusy(false);

  if (error) {
    console.error(error);
    setSyncStatus("Sync issue", "error");
    setFeedback(`Could not update task: ${error.message}`, "error");
    return;
  }

  state.tasks = state.tasks.map((task) =>
    task.id === state.editingId ? normalizeTask(data) : task
  );
  resetForm();
  render();
  setSyncStatus("Supabase connected", "connected");
  setFeedback("Task updated.", "success");
}

async function requestTaskCompletion(taskId, completed) {
  const { data, error } = await supabase.rpc("set_todo_completion", {
    p_task_id: taskId,
    p_completed: completed,
  });

  if (error) {
    throw error;
  }

  return Array.isArray(data) ? data[0] : data;
}

async function toggleComplete(taskId, completed) {
  setBusy(true);
  setSyncStatus("Updating", "loading");
  try {
    const result = await requestTaskCompletion(taskId, completed);
    setTaskInState(result);
    render();
    await refreshEconomySilently();
    setSyncStatus("Supabase connected", "connected");

    const coinDelta = Number(result?.coin_delta ?? 0);
    if (coinDelta > 0) {
      setFeedback(
        `Task marked complete. +${coinDelta} ${formatCoins(coinDelta)}.`,
        "success"
      );
      showToast(`+${coinDelta} ${formatCoins(coinDelta)}`, "success");
      launchCelebration("coins");
      playCelebrationSound("task");
      return;
    }

    if (coinDelta < 0) {
      const reversedCoins = Math.abs(coinDelta);
      setFeedback(
        `Task reopened. ${reversedCoins} ${formatCoins(reversedCoins)} reversed.`,
        "success"
      );
      showToast(`-${reversedCoins} ${formatCoins(reversedCoins)}`, "warning");
      return;
    }

    setFeedback(completed ? "Task marked complete." : "Task reopened.", "success");
  } catch (error) {
    console.error(error);
    render();
    setSyncStatus("Sync issue", "error");
    setFeedback(`Could not update task state: ${error.message}`, "error");
  } finally {
    setBusy(false);
  }
}

async function toggleStar(taskId) {
  const task = state.tasks.find((entry) => entry.id === taskId);
  if (!task) {
    return;
  }

  setBusy(true);
  setSyncStatus("Updating", "loading");

  const { data, error } = await supabase
    .from("todos")
    .update({ starred: !task.starred })
    .eq("id", taskId)
    .select()
    .single();

  setBusy(false);

  if (error) {
    console.error(error);
    setSyncStatus("Sync issue", "error");
    setFeedback(`Could not update importance: ${error.message}`, "error");
    return;
  }

  state.tasks = state.tasks.map((entry) =>
    entry.id === taskId ? normalizeTask(data) : entry
  );
  render();
  setSyncStatus("Supabase connected", "connected");
  setFeedback(data.starred ? "Task starred." : "Task unstarred.", "success");
}

async function deleteTask(taskId) {
  const task = state.tasks.find((entry) => entry.id === taskId);
  if (!task) {
    return;
  }

  const confirmed = window.confirm(`Delete "${task.title}"?`);
  if (!confirmed) {
    return;
  }

  setBusy(true);
  setSyncStatus("Deleting", "loading");
  setFeedback("Deleting task...");

  const { error } = await supabase.from("todos").delete().eq("id", taskId);

  setBusy(false);

  if (error) {
    console.error(error);
    setSyncStatus("Sync issue", "error");
    setFeedback(`Could not delete task: ${error.message}`, "error");
    return;
  }

  state.tasks = state.tasks.filter((taskItem) => taskItem.id !== taskId);
  state.selectedIds.delete(taskId);

  if (state.editingId === taskId) {
    resetForm();
  }

  render();
  setSyncStatus("Supabase connected", "connected");
  setFeedback("Task deleted.", "success");
}

async function bulkCompleteSelected() {
  const ids = [...state.selectedIds].filter((id) => {
    const task = state.tasks.find((entry) => entry.id === id);
    return task && !task.completed;
  });

  if (!ids.length) {
    setFeedback("Select at least one active task to complete.");
    return;
  }

  setBusy(true);
  setSyncStatus("Updating", "loading");
  setFeedback("Completing selected tasks...");
  try {
    let totalCoins = 0;

    for (const id of ids) {
      const result = await requestTaskCompletion(id, true);
      setTaskInState(result);
      totalCoins += Number(result?.coin_delta ?? 0);
    }

    state.selectedIds.clear();
    render();
    await refreshEconomySilently();
    setSyncStatus("Supabase connected", "connected");
    setFeedback(
      totalCoins > 0
        ? `Selected tasks marked complete. +${totalCoins} ${formatCoins(totalCoins)} earned.`
        : "Selected tasks marked complete.",
      "success"
    );

    if (totalCoins > 0) {
      showToast(`+${totalCoins} ${formatCoins(totalCoins)}`, "success");
      launchCelebration("coins");
      playCelebrationSound("task");
    }
  } catch (error) {
    console.error(error);
    setSyncStatus("Sync issue", "error");
    setFeedback(`Could not complete selected tasks: ${error.message}`, "error");
  } finally {
    setBusy(false);
  }
}

async function deleteSelected() {
  const ids = [...state.selectedIds];
  if (!ids.length) {
    setFeedback("Select at least one task to delete.");
    return;
  }

  const confirmed = window.confirm(
    `Delete ${ids.length} selected task${ids.length === 1 ? "" : "s"}?`
  );
  if (!confirmed) {
    return;
  }

  setBusy(true);
  setSyncStatus("Deleting", "loading");
  setFeedback("Deleting selected tasks...");

  const { error } = await supabase.from("todos").delete().in("id", ids);

  setBusy(false);

  if (error) {
    console.error(error);
    setSyncStatus("Sync issue", "error");
    setFeedback(`Could not delete selected tasks: ${error.message}`, "error");
    return;
  }

  state.tasks = state.tasks.filter((task) => !state.selectedIds.has(task.id));

  if (state.editingId !== null && state.selectedIds.has(state.editingId)) {
    resetForm();
  }

  state.selectedIds.clear();
  render();
  setSyncStatus("Supabase connected", "connected");
  setFeedback("Selected tasks deleted.", "success");
}

async function clearCompleted() {
  const completedIds = state.tasks
    .filter((task) => task.completed)
    .map((task) => task.id);

  if (!completedIds.length) {
    setFeedback("There are no completed tasks to clear.");
    return;
  }

  const confirmed = window.confirm(
    `Clear ${completedIds.length} completed task${
      completedIds.length === 1 ? "" : "s"
    }?`
  );
  if (!confirmed) {
    return;
  }

  setBusy(true);
  setSyncStatus("Deleting", "loading");
  setFeedback("Clearing completed tasks...");

  const { error } = await supabase.from("todos").delete().in("id", completedIds);

  setBusy(false);

  if (error) {
    console.error(error);
    setSyncStatus("Sync issue", "error");
    setFeedback(`Could not clear completed tasks: ${error.message}`, "error");
    return;
  }

  state.tasks = state.tasks.filter((task) => !task.completed);
  state.selectedIds.clear();

  if (state.editingId !== null) {
    const editingTask = state.tasks.find((task) => task.id === state.editingId);
    if (!editingTask) {
      resetForm();
    }
  }

  render();
  setSyncStatus("Supabase connected", "connected");
  setFeedback("Completed tasks cleared.", "success");
}

async function saveReward() {
  const payload = getRewardFormPayload();
  const isEditing = state.rewardEditingId !== null;

  if (!payload.title) {
    setRewardsFeedback("Reward title cannot be empty.", "error");
    elements.rewardTitleInput.focus();
    return;
  }

  if (!Number.isInteger(payload.coin_cost) || payload.coin_cost < 1) {
    setRewardsFeedback("Coin cost must be at least 1.", "error");
    elements.rewardCostInput.focus();
    return;
  }

  setBusy(true);
  setRewardsFeedback(
    isEditing ? "Updating reward..." : "Saving reward..."
  );

  try {
    const query =
      !isEditing
        ? supabase.from(REWARDS_TABLE).insert([payload])
        : supabase.from(REWARDS_TABLE).update(payload).eq("id", state.rewardEditingId);

    const { error } = await query.select().single();
    if (error) {
      throw error;
    }

    await refreshEconomy();
    resetRewardForm();
    setRewardsFeedback(
      isEditing ? "Reward updated." : "Reward created.",
      "success"
    );
    showToast(
      isEditing ? "Reward updated." : "Reward created.",
      "default"
    );
  } catch (error) {
    console.error(error);
    setRewardsFeedback(`Could not save reward: ${error.message}`, "error");
  } finally {
    setBusy(false);
  }
}

async function toggleRewardActive(rewardId, isActive) {
  setBusy(true);
  setRewardsFeedback(isActive ? "Activating reward..." : "Pausing reward...");

  try {
    const { error } = await supabase
      .from(REWARDS_TABLE)
      .update({ is_active: isActive })
      .eq("id", rewardId);

    if (error) {
      throw error;
    }

    await refreshEconomy();
    setRewardsFeedback(
      isActive ? "Reward activated." : "Reward deactivated.",
      "success"
    );
  } catch (error) {
    console.error(error);
    setRewardsFeedback(`Could not update reward: ${error.message}`, "error");
  } finally {
    setBusy(false);
  }
}

async function saveRewardQueue(queueIds) {
  setBusy(true);
  setRewardsFeedback("Saving reward queue...");

  try {
    const { error } = await supabase.rpc("save_reward_queue", {
      p_reward_ids: queueIds,
    });

    if (error) {
      throw error;
    }

    await refreshEconomy();
    setRewardsFeedback("Reward queue updated.", "success");
  } catch (error) {
    console.error(error);
    setRewardsFeedback(`Could not update reward queue: ${error.message}`, "error");
  } finally {
    setBusy(false);
  }
}

async function toggleRewardQueue(rewardId) {
  const queueIds = getQueuedRewards().map((reward) => reward.id);
  const isQueued = queueIds.includes(rewardId);

  if (isQueued) {
    await saveRewardQueue(queueIds.filter((id) => id !== rewardId));
    return;
  }

  await saveRewardQueue([...queueIds, rewardId]);
}

async function moveRewardInQueue(rewardId, direction) {
  const queueIds = getQueuedRewards().map((reward) => reward.id);
  const currentIndex = queueIds.indexOf(rewardId);

  if (currentIndex === -1) {
    return;
  }

  const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
  if (targetIndex < 0 || targetIndex >= queueIds.length) {
    return;
  }

  const nextQueueIds = [...queueIds];
  [nextQueueIds[currentIndex], nextQueueIds[targetIndex]] = [
    nextQueueIds[targetIndex],
    nextQueueIds[currentIndex],
  ];

  await saveRewardQueue(nextQueueIds);
}

async function deleteReward(rewardId) {
  const reward = state.rewards.find((entry) => entry.id === rewardId);
  if (!reward) {
    return;
  }

  const confirmed = window.confirm(`Delete "${reward.title}" from rewards?`);
  if (!confirmed) {
    return;
  }

  setBusy(true);
  setRewardsFeedback("Deleting reward...");

  try {
    const { error } = await supabase.from(REWARDS_TABLE).delete().eq("id", rewardId);
    if (error) {
      throw error;
    }

    if (state.rewardEditingId === rewardId) {
      resetRewardForm();
    }

    await refreshEconomy();
    setRewardsFeedback("Reward deleted.", "success");
  } catch (error) {
    console.error(error);
    setRewardsFeedback(`Could not delete reward: ${error.message}`, "error");
  } finally {
    setBusy(false);
  }
}

async function redeemPendingReward() {
  if (state.pendingRewardId === null) {
    setRedeemFeedback("Pick a reward first.", "error");
    return;
  }

  setBusy(true);
  setRedeemFeedback("Redeeming reward...");

  try {
    const { data, error } = await supabase.rpc("redeem_reward", {
      p_reward_id: state.pendingRewardId,
    });

    if (error) {
      throw error;
    }

    const result = Array.isArray(data) ? data[0] : data;
    await refreshEconomy();
    hideRedeemModal();
    setRewardsFeedback(`Redeemed "${result.reward_title}".`, "success");
    showToast(`Redeemed ${result.reward_title}`, "success");
    launchCelebration("reward");
    playCelebrationSound("reward");
  } catch (error) {
    console.error(error);
    setRedeemFeedback(`Could not redeem reward: ${error.message}`, "error");
  } finally {
    setBusy(false);
  }
}

elements.viewButtons.forEach((button) => {
  button.addEventListener("click", () => {
    state.view = button.dataset.view;
    state.categoryFilter = "all";
    elements.viewButtons.forEach((item) =>
      item.classList.toggle("is-active", item === button)
    );
    render();
  });
});

elements.searchInput.addEventListener("input", (event) => {
  state.search = event.target.value;
  render();
});

elements.priorityFilter.addEventListener("change", (event) => {
  state.priorityFilter = event.target.value;
  state.categoryFilter = "all";
  render();
});

elements.dateFilter.addEventListener("change", (event) => {
  state.dateFilter = event.target.value;
  state.categoryFilter = "all";
  render();
});

elements.sortSelect.addEventListener("change", (event) => {
  state.sort = event.target.value;
  render();
});

elements.accessForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const passphrase = elements.accessPassphrase.value.trim();
  const confirmPassphrase = elements.accessConfirmPassphrase.value.trim();

  if (!passphrase) {
    setAccessFeedback("Enter the passphrase to continue.", "error");
    return;
  }

  const accessReady = await refreshAccessState();
  if (!accessReady) {
    return;
  }

  const configured = hasConfiguredPassphrase();

  if (!configured) {
    if (passphrase.length < 4) {
      setAccessFeedback("Use at least 4 characters for the passphrase.", "error");
      return;
    }

    if (passphrase !== confirmPassphrase) {
      setAccessFeedback("The passphrases do not match.", "error");
      return;
    }

    await persistAccessConfig(await hashText(passphrase));
    setAccessFeedback("Shared passphrase saved.", "success");
    unlockWorkspaceForToday();
    return;
  }

  const enteredHash = await hashText(passphrase);

  if (enteredHash !== accessState.passphraseHash) {
    setAccessFeedback("Incorrect passphrase for today.", "error");
    return;
  }

  unlockWorkspaceForToday();
});

elements.form.addEventListener("submit", async (event) => {
  event.preventDefault();
  await saveTask(getTaskFormPayload());
});

elements.resetButton.addEventListener("click", () => {
  if (state.editingId !== null) {
    resetForm();
    setFeedback("Edit cleared.");
    return;
  }

  elements.form.reset();
  elements.priorityInput.value = "medium";
  elements.taskDurationInput.value = "30";
  updateTaskCoinPreview();
  setFeedback("Form cleared.");
});

elements.cancelEditButton.addEventListener("click", () => {
  resetForm();
  setFeedback("Edit cancelled.");
});

elements.quickDateButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const value = button.dataset.quickDate;

    if (value === "today") {
      elements.dueDateInput.value = todayKey();
    }

    if (value === "tomorrow") {
      elements.dueDateInput.value = getDateOffset(1);
    }

    if (value === "week") {
      elements.dueDateInput.value = getDateOffset(7);
    }

    if (value === "clear") {
      elements.dueDateInput.value = "";
    }
  });
});

elements.taskDurationInput.addEventListener("change", updateTaskCoinPreview);
elements.taskDurationInput.addEventListener("input", updateTaskCoinPreview);

elements.countdownConfigure.addEventListener("click", () => {
  elements.countdownGoalInput.value = countdownState.goal || "";
  elements.countdownNoteInput.value = countdownState.note || "";
  elements.countdownDatetimeInput.value = countdownState.targetDate
    ? new Date(
        countdownState.targetDate.getTime() -
          countdownState.targetDate.getTimezoneOffset() * 60_000
      )
        .toISOString()
        .slice(0, 16)
    : getDefaultLocalDateTime();
  elements.countdownPasskeyInput.value = "";
  showCountdownSetup();
});

elements.countdownCancel.addEventListener("click", hideCountdownSetup);
elements.countdownResetToggle.addEventListener("click", showCountdownReset);
elements.countdownResetCancel.addEventListener("click", hideCountdownReset);
elements.countdownOverlay.addEventListener("click", (event) => {
  if (event.target === elements.countdownOverlay) {
    hideCountdownSetup();
  }
});
elements.countdownResetOverlay.addEventListener("click", (event) => {
  if (event.target === elements.countdownResetOverlay) {
    hideCountdownReset();
  }
});

elements.countdownForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  setCountdownFormError("");

  const goalValue = elements.countdownGoalInput.value.trim();
  const noteValue = elements.countdownNoteInput.value.trim();
  const passkeyValue = elements.countdownPasskeyInput.value.trim();
  const selected = new Date(elements.countdownDatetimeInput.value);

  if (!goalValue) {
    setCountdownFormError("Please enter the goal.", "error");
    return;
  }

  if (!elements.countdownDatetimeInput.value || Number.isNaN(selected.getTime())) {
    setCountdownFormError("Please choose a valid date and time.", "error");
    return;
  }

  if (selected.getTime() <= Date.now()) {
    setCountdownFormError("Please select a future date and time.", "error");
    return;
  }

  if (passkeyValue.length < 4) {
    setCountdownFormError(
      "Reset passkey must be at least 4 characters.",
      "error"
    );
    return;
  }

  try {
    const countdownStartedAt = Date.now();
    const payload = {
      goal: goalValue,
      note: noteValue,
      targetDateISO: selected.toISOString(),
      countdownStartTime: countdownStartedAt,
      totalDurationMs: Math.max(0, selected.getTime() - countdownStartedAt),
      resetPasskeyHash: await hashText(passkeyValue),
    };

    await startCountdown(payload);
  } catch (error) {
    console.error(error);
    setCountdownFormError(error.message, "error");
  }
});

elements.countdownResetForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  setCountdownResetError("");

  if (!countdownState.resetPasskeyHash) {
    setCountdownResetError("No active passkey found.", "error");
    return;
  }

  const enteredPasskey = elements.countdownPasskeyVerify.value.trim();
  if (!enteredPasskey) {
    setCountdownResetError("Please enter the passkey.", "error");
    return;
  }

  try {
    const enteredHash = await hashText(enteredPasskey);
    if (enteredHash !== countdownState.resetPasskeyHash) {
      setCountdownResetError("Incorrect passkey.", "error");
      return;
    }

    await resetCountdownToInitialView();
  } catch (error) {
    console.error(error);
    setCountdownResetError(error.message, "error");
  }
});

elements.clearCompleted.addEventListener("click", clearCompleted);
elements.refreshButton.addEventListener("click", fetchTasks);
elements.completeSelected.addEventListener("click", bulkCompleteSelected);
elements.deleteSelected.addEventListener("click", deleteSelected);
elements.openRewards.addEventListener("click", async () => {
  await refreshEconomySilently();
  showRewardsModal();
});
elements.openRewardsHeader.addEventListener("click", async () => {
  await refreshEconomySilently();
  showRewardsModal();
});
elements.closeRewards.addEventListener("click", hideRewardsModal);
elements.rewardsOverlay.addEventListener("click", (event) => {
  if (event.target === elements.rewardsOverlay) {
    hideRewardsModal();
  }
});
elements.redeemOverlay.addEventListener("click", (event) => {
  if (event.target === elements.redeemOverlay) {
    hideRedeemModal();
  }
});
elements.rewardForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  await saveReward();
});
elements.rewardResetButton.addEventListener("click", () => {
  resetRewardForm();
  setRewardsFeedback("Reward form cleared.");
});
elements.rewardCancelButton.addEventListener("click", () => {
  resetRewardForm();
  setRewardsFeedback("Reward edit cancelled.");
});
elements.redeemCancel.addEventListener("click", hideRedeemModal);
elements.redeemConfirm.addEventListener("click", redeemPendingReward);
elements.rewardEmojiInput.addEventListener("input", () => {
  renderEmojiPicker();
});
elements.emojiPicker.addEventListener("click", (event) => {
  const button = event.target.closest("[data-emoji]");
  if (!button) {
    return;
  }

  elements.rewardEmojiInput.value = button.dataset.emoji;
  renderEmojiPicker();
});

elements.categoryBar.addEventListener("click", (event) => {
  const button = event.target.closest("[data-category]");
  if (!button) {
    return;
  }

  state.categoryFilter = button.dataset.category;
  render();
});

elements.taskList.addEventListener("change", async (event) => {
  const card = event.target.closest(".task-card");
  if (!card) {
    return;
  }

  const taskId = Number(card.dataset.id);

  if (event.target.matches(".task-select")) {
    if (event.target.checked) {
      state.selectedIds.add(taskId);
    } else {
      state.selectedIds.delete(taskId);
    }
    render();
  }

  if (event.target.matches(".task-complete")) {
    await toggleComplete(taskId, event.target.checked);
  }
});

elements.taskList.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-action]");
  if (!button) {
    return;
  }

  const card = event.target.closest(".task-card");
  if (!card) {
    return;
  }

  const taskId = Number(card.dataset.id);
  const task = state.tasks.find((entry) => entry.id === taskId);
  if (!task) {
    return;
  }

  if (button.dataset.action === "edit") {
    populateForm(task);
    return;
  }

  if (button.dataset.action === "delete") {
    await deleteTask(taskId);
    return;
  }

  if (button.dataset.action === "toggle-star") {
    await toggleStar(taskId);
  }
});

elements.rewardList.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-reward-action]");
  if (!button) {
    return;
  }

  const rewardCard = event.target.closest(".reward-card");
  if (!rewardCard) {
    return;
  }

  const rewardId = Number(rewardCard.dataset.id);
  const reward = state.rewards.find((entry) => entry.id === rewardId);
  if (!reward) {
    return;
  }

  if (button.dataset.rewardAction === "edit") {
    populateRewardForm(reward);
    elements.rewardTitleInput.focus();
    return;
  }

  if (button.dataset.rewardAction === "queue") {
    await toggleRewardQueue(rewardId);
    return;
  }

  if (button.dataset.rewardAction === "move-up") {
    await moveRewardInQueue(rewardId, "up");
    return;
  }

  if (button.dataset.rewardAction === "move-down") {
    await moveRewardInQueue(rewardId, "down");
    return;
  }

  if (button.dataset.rewardAction === "toggle") {
    await toggleRewardActive(rewardId, !reward.is_active);
    return;
  }

  if (button.dataset.rewardAction === "delete") {
    await deleteReward(rewardId);
    return;
  }

  if (button.dataset.rewardAction === "redeem") {
    showRedeemModal(reward);
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") {
    return;
  }

  if (!elements.redeemOverlay.classList.contains("hidden")) {
    hideRedeemModal();
    return;
  }

  if (!elements.rewardsOverlay.classList.contains("hidden")) {
    hideRewardsModal();
    return;
  }

  if (!elements.countdownResetOverlay.classList.contains("hidden")) {
    hideCountdownReset();
    return;
  }

  if (!elements.countdownOverlay.classList.contains("hidden")) {
    hideCountdownSetup();
    return;
  }

  if (state.editingId !== null) {
    resetForm();
    setFeedback("Edit cancelled.");
  }
});

function bootApp() {
  if (appStarted) {
    return;
  }

  appStarted = true;
  resetForm();
  resetRewardForm();
  updateTaskCoinPreview();
  render();
  startTodayCountdown();

  if (!isConfigured()) {
    setControlsDisabled(true);
    setSyncStatus("Add Supabase keys", "error");
    setFeedback(
      "Add your Supabase URL and anon key in app.js, then refresh the page.",
      "error"
    );
    return;
  }

  if (!supabase) {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }

  if (!countdownSupabase) {
    countdownSupabase = createClient(
      COUNTDOWN_SUPABASE_URL,
      COUNTDOWN_SUPABASE_ANON_KEY,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      }
    );
  }

  subscribeToCountdown();
  initCountdown().catch((error) => {
    console.error(error);
    setCountdownFeedback(error.message, "error");
  });

  fetchTasks().catch((error) => {
    console.error(error);
    setBusy(false);
    setSyncStatus("Sync issue", "error");
    setFeedback(error.message, "error");
  });
}

updateAccessMeta();
startAccessSessionWatcher();

if (!isConfigured()) {
  showAccessGate("Add your Supabase URL and anon key in app.js, then refresh the page.");
} else {
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  refreshAccessState().then((accessReady) => {
    if (!accessReady) {
      showAccessGate("Unable to load shared passphrase from Supabase.");
      return;
    }

    if (hasValidAccessSession() && hasConfiguredPassphrase()) {
      unlockWorkspaceForToday();
      return;
    }

    showAccessGate();
  });
}

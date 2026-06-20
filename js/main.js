"use strict";

const KEYS = {
  goal: "neko-habit-goal",
  records: "neko-habit-records",
  affection: "neko-habit-affection",
  inventory: "neko-habit-inventory",
  lastLogin: "neko-habit-last-login",
  absenceDays: "neko-habit-absence-days",
  dailyReward: "neko-habit-daily-reward",
  lastLine: "neko-habit-last-line"
};

const ITEMS = {
  food: { name: "キャットフード", icon: "🥫", affection: 2, reply: "……もぐもぐ。悪くない、かも。" },
  snack: { name: "おやつ", icon: "🐟", affection: 3, reply: "にゃ。もうひとつ、ある？" },
  toy: { name: "おもちゃ", icon: "🧶", affection: 5, reply: "……！ ちょっとだけ遊ぶ。" }
};

const elements = {
  catCard: document.querySelector("#cat-card"),
  catImage: document.querySelector("#cat-image"),
  catFallback: document.querySelector("#cat-fallback"),
  catEmoji: document.querySelector("#cat-emoji"),
  catStatus: document.querySelector("#cat-status"),
  catLine: document.querySelector("#cat-line"),
  affectionValue: document.querySelector("#affection-value"),
  affectionMeter: document.querySelector("#affection-meter"),
  affectionTrack: document.querySelector("#affection-track"),
  goalSetupCard: document.querySelector("#goal-setup-card"),
  goalForm: document.querySelector("#goal-form"),
  goalInput: document.querySelector("#goal-input"),
  todayCard: document.querySelector("#today-card"),
  currentGoal: document.querySelector("#current-goal"),
  editGoalButton: document.querySelector("#edit-goal-button"),
  recordForm: document.querySelector("#record-form"),
  bonusMessage: document.querySelector("#bonus-message"),
  inventoryList: document.querySelector("#inventory-list"),
  streakCount: document.querySelector("#streak-count"),
  totalDays: document.querySelector("#total-days"),
  todayStatus: document.querySelector("#today-status"),
  lastRecordDate: document.querySelector("#last-record-date"),
  historyList: document.querySelector("#history-list"),
  emptyMessage: document.querySelector("#empty-message"),
  recordCount: document.querySelector("#record-count"),
  resetButton: document.querySelector("#reset-button")
};

let goal = localStorage.getItem(KEYS.goal) || "";
const loadedRecords = loadJson(KEYS.records, []);
const loadedInventory = loadJson(KEYS.inventory, {});
let records = Array.isArray(loadedRecords) ? loadedRecords : [];
let inventory = { food: 0, snack: 0, toy: 0, ...(loadedInventory && typeof loadedInventory === "object" ? loadedInventory : {}) };
let affection = clamp(Number(localStorage.getItem(KEYS.affection)) || 0, 0, 100);
const previousLogin = localStorage.getItem(KEYS.lastLogin);
const storedAbsenceDays = Number(localStorage.getItem(KEYS.absenceDays)) || 0;
let daysAway = Math.max(storedAbsenceDays, previousLogin ? daysBetween(previousLogin, getLocalDate()) : 0);

function loadJson(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "null");
    return value ?? fallback;
  } catch (error) {
    console.warn(`${key}を読み込めませんでした。`, error);
    return fallback;
  }
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function getLocalDate(date = new Date()) {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

function dateFromLocalString(value) {
  return new Date(`${value}T00:00:00`);
}

function daysBetween(from, to) {
  return Math.max(0, Math.round((dateFromLocalString(to) - dateFromLocalString(from)) / 86400000));
}

function saveCoreData() {
  localStorage.setItem(KEYS.records, JSON.stringify(records));
  localStorage.setItem(KEYS.inventory, JSON.stringify(inventory));
  localStorage.setItem(KEYS.affection, String(affection));
  localStorage.setItem(KEYS.absenceDays, String(daysAway));
}

function grantLoginBonus() {
  const today = getLocalDate();
  let reward = loadJson(KEYS.dailyReward, null);
  if (previousLogin !== today) {
    const itemKeys = Object.keys(ITEMS);
    const itemKey = itemKeys[Math.floor(Math.random() * itemKeys.length)];
    inventory[itemKey] = Number(inventory[itemKey] || 0) + 1;
    reward = { date: today, itemKey };
    localStorage.setItem(KEYS.dailyReward, JSON.stringify(reward));
    localStorage.setItem(KEYS.lastLogin, today);
    saveCoreData();
  }
  const item = reward && reward.date === today ? ITEMS[reward.itemKey] : null;
  elements.bonusMessage.textContent = item ? `${item.icon} ${item.name}を1個もらいました。` : "今日のボーナスは受け取り済みです。";
}

function getUniqueRecordDates() {
  return [...new Set(records.map((record) => record.date))].sort();
}

function getStreak() {
  const dates = getUniqueRecordDates();
  if (!dates.length) return 0;
  const today = getLocalDate();
  const latest = dates[dates.length - 1];
  if (daysBetween(latest, today) > 1) return 0;
  let streak = 1;
  for (let index = dates.length - 1; index > 0; index -= 1) {
    if (daysBetween(dates[index - 1], dates[index]) !== 1) break;
    streak += 1;
  }
  return streak;
}

function getCatState() {
  if (daysAway >= 10) return { label: "おでかけ中", className: "is-away", emoji: "🐾" };
  if (daysAway >= 7) return { label: "かくれ中", className: "is-hidden", emoji: "🐈" };
  if (daysAway >= 3) return { label: "少し不機嫌", className: "is-grumpy", emoji: "🐈" };
  if (affection >= 80) return { label: "すっかり仲良し", className: "", emoji: "🐈" };
  if (affection >= 60) return { label: "待っていた", className: "", emoji: "🐈" };
  if (affection >= 40) return { label: "興味津々", className: "", emoji: "🐈" };
  if (affection >= 20) return { label: "様子見", className: "", emoji: "🐈" };
  return { label: "警戒中", className: "", emoji: "🐈" };
}

function getLineCandidates() {
  if (daysAway >= 10) return ["……また来たら、顔を出すかも。", "足音がしたら、戻ってくるかも。", "少し遠くから、見てる。"];
  if (daysAway >= 7) return ["……物陰から、ちらり。", "まだ、ここにいるよ。", "静かになったら出る。"];
  if (daysAway >= 3) return ["……しばらく見なかったね。", "ふん。今日はいるんだ。", "少しだけ、待ってた。"];
  const todayDone = getUniqueRecordDates().includes(getLocalDate());
  const streak = getStreak();
  if (todayDone && streak >= 7) return ["こつこつ、えらい。にゃ。", "今日も続いたね。ごろごろ。", "その調子。ここで見てる。"];
  if (todayDone) return ["今日も頑張ったね。", "おつかれさま。にゃ。", "ちゃんと見てたよ。"];
  if (affection >= 80) return ["今日も頑張ろうね。", "ここで待ってる。", "終わったら、なでて。"];
  if (affection >= 60) return ["待ってたよ。", "今日は何する？", "そばにいても、いいよ。"];
  if (affection >= 40) return ["今日は何するの？", "また記録する？", "少し気になる。"];
  if (affection >= 20) return ["また来たの？", "……近くにいてもいい。", "何かするの？"];
  return ["・・・", "……にゃ。", "じーっ。"];
}

function chooseCatLine(forceNew = false) {
  const candidates = getLineCandidates();
  const previous = localStorage.getItem(KEYS.lastLine);
  const pool = forceNew ? candidates.filter((line) => line !== previous) : candidates;
  const line = pool[Math.floor(Math.random() * pool.length)] || candidates[0];
  localStorage.setItem(KEYS.lastLine, line);
  return line;
}

function renderCat(forceNewLine = false) {
  const state = getCatState();
  elements.catCard.className = `cat-card ${state.className}`.trim();
  elements.catStatus.textContent = state.label;
  elements.catEmoji.textContent = state.emoji;
  elements.affectionValue.textContent = affection;
  elements.affectionMeter.style.width = `${affection}%`;
  elements.affectionTrack.setAttribute("aria-valuenow", affection);
  elements.catLine.textContent = chooseCatLine(forceNewLine);
}

function renderGoal() {
  const hasGoal = Boolean(goal);
  elements.goalSetupCard.hidden = hasGoal;
  elements.todayCard.hidden = !hasGoal;
  elements.currentGoal.textContent = goal;
  elements.goalInput.value = goal;
}

function renderInventory() {
  elements.inventoryList.replaceChildren();
  Object.entries(ITEMS).forEach(([key, item]) => {
    const count = Number(inventory[key] || 0);
    const article = document.createElement("article");
    article.className = "item-card";
    const icon = document.createElement("span");
    icon.className = "item-icon";
    icon.textContent = item.icon;
    const title = document.createElement("h3");
    title.textContent = item.name;
    const amount = document.createElement("p");
    amount.textContent = `所持 ${count}個`;
    const button = document.createElement("button");
    button.className = "gift-button";
    button.type = "button";
    button.textContent = `渡す（+${item.affection}）`;
    button.disabled = count < 1 || daysAway >= 10;
    button.addEventListener("click", () => giveItem(key));
    article.append(icon, title, amount, button);
    elements.inventoryList.append(article);
  });
}

function giveItem(key) {
  const item = ITEMS[key];
  if (!item || Number(inventory[key] || 0) < 1 || daysAway >= 10) return;
  inventory[key] -= 1;
  affection = clamp(affection + item.affection, 0, 100);
  saveCoreData();
  renderInventory();
  renderCat();
  elements.catLine.textContent = item.reply;
}

function renderSummary() {
  const dates = getUniqueRecordDates();
  const today = getLocalDate();
  const doneToday = dates.includes(today);
  elements.streakCount.textContent = getStreak();
  elements.totalDays.textContent = dates.length;
  elements.todayStatus.textContent = doneToday ? "記録済み" : "未記録";
  elements.todayStatus.classList.toggle("done", doneToday);
  elements.lastRecordDate.textContent = dates.length ? dates[dates.length - 1] : "まだありません";
}

function renderHistory() {
  elements.historyList.replaceChildren();
  [...records].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5).forEach((record) => {
    const article = document.createElement("article");
    article.className = "history-card";
    const head = document.createElement("div");
    head.className = "history-card-head";
    const title = document.createElement("h3");
    title.textContent = record.action;
    const date = document.createElement("span");
    date.className = "history-date";
    date.textContent = record.date;
    head.append(title, date);
    article.append(head);
    if (record.amount) {
      const amount = document.createElement("span");
      amount.className = "history-amount";
      amount.textContent = record.amount;
      article.append(amount);
    }
    if (record.memo) {
      const memo = document.createElement("p");
      memo.className = "history-memo";
      memo.textContent = record.memo;
      article.append(memo);
    }
    elements.historyList.append(article);
  });
  elements.emptyMessage.hidden = records.length > 0;
  elements.recordCount.textContent = `${records.length}件`;
}

function renderAll(forceNewLine = false) {
  renderGoal();
  renderCat(forceNewLine);
  renderInventory();
  renderSummary();
  renderHistory();
}

function showCatImage() {
  elements.catImage.hidden = false;
  elements.catFallback.hidden = true;
}

function showCatFallback() {
  elements.catImage.removeAttribute("src");
  elements.catImage.hidden = true;
  elements.catFallback.hidden = false;
}

elements.catImage.addEventListener("load", showCatImage);
elements.catImage.addEventListener("error", showCatFallback);
if (elements.catImage.complete) {
  if (elements.catImage.naturalWidth > 0) showCatImage();
  else showCatFallback();
}

elements.goalForm.addEventListener("submit", (event) => {
  event.preventDefault();
  goal = elements.goalInput.value.trim();
  if (!goal) return;
  localStorage.setItem(KEYS.goal, goal);
  renderGoal();
});

elements.editGoalButton.addEventListener("click", () => {
  elements.goalSetupCard.hidden = false;
  elements.todayCard.hidden = true;
  elements.goalInput.focus();
});

elements.recordForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(elements.recordForm);
  records.push({
    id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
    date: getLocalDate(),
    action: String(formData.get("action")).trim() || goal || "今日の目標に取り組んだ",
    amount: String(formData.get("amount")).trim(),
    memo: String(formData.get("memo")).trim(),
    createdAt: new Date().toISOString()
  });
  affection = clamp(affection + 3, 0, 100);
  daysAway = 0;
  saveCoreData();
  elements.recordForm.reset();
  renderAll(true);
});

elements.resetButton.addEventListener("click", () => {
  if (!confirm("目標・記録・猫とのなかよし度をすべてリセットしますか？")) return;
  Object.values(KEYS).forEach((key) => localStorage.removeItem(key));
  goal = "";
  records = [];
  inventory = { food: 0, snack: 0, toy: 0 };
  affection = 0;
  daysAway = 0;
  renderAll();
  elements.bonusMessage.textContent = "リセットしました。次回アクセス時に新しいボーナスを受け取れます。";
});

grantLoginBonus();
renderAll();

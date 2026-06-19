"use strict";

const STORAGE_KEY = "playful-balance-tracker-records";
const LAST_LINE_KEY = "playful-balance-tracker-last-line";
const AFFECTION_KEY = "playful-balance-tracker-affection";
const CONVERSATION_KEY = "playful-balance-tracker-conversations";
const ESCAPE_RECORD_KEY = "playful-balance-tracker-win-escape-record";
const MAX_VISIBLE_RECORDS = 30;
const MAX_CONVERSATIONS = 30;

const secretaryStates = {
  rich: {
    label: "大勝ち", className: "secretary--rich", face: "😊✨", outfit: "🎀", imagePath: "assets/characters/midori_rich.png",
    lines: ["今月は絶好調ですね。でも、冷静に勝ちを残してこそ満点です。", "すごい数字です。べ、別に私まで嬉しいわけでは……少しだけ。", "余裕がある今こそ、使う上限をきちんと守りましょう。"]
  },
  cute: {
    label: "勝ち", className: "secretary--cute", face: "☺️", outfit: "👔", imagePath: "assets/characters/midori_cute.png",
    lines: ["今月はプラスです。ちゃんと記録できて偉いですね。", "良い流れですが、欲張らずに勝ちを残してくださいね。", "ふふ、今日は少しだけ褒めてあげます。次も冷静に。"]
  },
  normal: {
    label: "通常", className: "secretary--normal", face: "🙂", outfit: "👔", imagePath: "assets/characters/midori_normal.png",
    lines: ["今月はほぼ均衡です。今日も事実を淡々と記録しましょう。", "勝ち負けより、冷静に数字と向き合えたかが大事です。", "記録は地味でも大切です。さぼったら、少しだけ怒りますよ。"]
  },
  poor: {
    label: "負け", className: "secretary--poor", face: "😟", outfit: "🧥", imagePath: "assets/characters/midori_poor.png",
    lines: ["今月はマイナスです。取り戻そうとせず、上限を決めましょう。", "少し心配です。今日はここまでにして休んでください。", "いったん距離を置いて、落ち着いて記録を見直しましょう。"]
  },
  broke: {
    label: "大負け", className: "secretary--broke", face: "😠💸", outfit: "📋", imagePath: "assets/characters/midori_broke.png",
    lines: ["反省会です。追加の出費は止めて、しばらく休みましょう。", "生活費には絶対に手をつけないこと。これは秘書命令です。", "今は取り返す時ではありません。上限を見直すまでお休みです。"]
  }
};

const choicesByResult = {
  positive: [
    { label: "勝ち逃げする", delta: 2, response: "その判断、素敵です。勝ちを残せる人は信頼できます。" },
    { label: "明日の軍資金にする", delta: 0, response: "予算として分けるなら、上限を必ず決めてくださいね。" },
    { label: "もう少しだけ行く", delta: -2, response: "だめです。『もう少し』が一番危ないんですから。" }
  ],
  negative: [
    { label: "素直に反省する", delta: 2, response: "素直でよろしい。今日は休んで、次の上限を決めましょう。" },
    { label: "今日は運が悪かっただけ", delta: 0, response: "運だけで片づけず、記録を見て振り返りましょう。" },
    { label: "明日取り返す", delta: -2, response: "その考えは危険です。明日は休むくらいでちょうどいいです。" }
  ],
  neutral: [
    { label: "今日はここまでにする", delta: 2, response: "冷静な判断ですね。そういうところ、信頼しています。" },
    { label: "記録を見直す", delta: 0, response: "いいですね。数字を見てから次を考えましょう。" },
    { label: "次こそ勝負する", delta: -2, response: "焦りは禁物です。まず予算と上限を決めてください。" }
  ]
};

const elements = {
  form: document.querySelector("#balance-form"),
  date: document.querySelector("#date"),
  investment: document.querySelector("#investment"),
  returnAmount: document.querySelector("#return-amount"),
  difference: document.querySelector("#difference-preview"),
  historyList: document.querySelector("#history-list"),
  emptyMessage: document.querySelector("#empty-message"),
  recordCount: document.querySelector("#record-count"),
  deleteAll: document.querySelector("#delete-all-button"),
  secretaryCard: document.querySelector("#secretary-card"),
  secretaryImage: document.querySelector("#secretary-character-image"),
  secretaryFallback: document.querySelector("#secretary-fallback"),
  secretaryFace: document.querySelector("#secretary-face"),
  secretaryOutfit: document.querySelector("#secretary-outfit"),
  secretaryStatus: document.querySelector("#secretary-status"),
  secretaryLine: document.querySelector("#secretary-line"),
  affectionValue: document.querySelector("#affection-value"),
  affectionMeter: document.querySelector("#affection-meter"),
  affectionLabel: document.querySelector("#affection-label"),
  walletHp: document.querySelector("#wallet-hp"),
  walletMeter: document.querySelector("#wallet-meter"),
  winEscapeButton: document.querySelector("#win-escape-button"),
  choicePanel: document.querySelector("#choice-panel"),
  choiceButtons: document.querySelector("#choice-buttons"),
  conversationLog: document.querySelector("#conversation-log"),
  conversationEmpty: document.querySelector("#conversation-empty")
};

let records = loadRecords();
let affection = loadAffection();
let conversations = loadConversations();
const failedCharacterImages = new Set();

elements.secretaryImage.addEventListener("load", () => {
  elements.secretaryImage.hidden = false;
  elements.secretaryFallback.hidden = true;
});

elements.secretaryImage.addEventListener("error", () => {
  const failedPath = elements.secretaryImage.dataset.imagePath;
  if (failedPath) failedCharacterImages.add(failedPath);
  elements.secretaryImage.removeAttribute("src");
  elements.secretaryImage.hidden = true;
  elements.secretaryFallback.hidden = false;
});

function getLocalDateString(date = new Date()) {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

function loadRecords() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(saved) ? saved : [];
  } catch (error) {
    console.warn("保存データを読み込めませんでした。", error);
    return [];
  }
}

function loadAffection() {
  const saved = Number(localStorage.getItem(AFFECTION_KEY));
  return Number.isFinite(saved) && localStorage.getItem(AFFECTION_KEY) !== null
    ? Math.min(100, Math.max(0, saved))
    : 50;
}

function loadConversations() {
  try {
    const saved = JSON.parse(localStorage.getItem(CONVERSATION_KEY) || "[]");
    return Array.isArray(saved) ? saved.slice(-MAX_CONVERSATIONS) : [];
  } catch (error) {
    console.warn("会話ログを読み込めませんでした。", error);
    return [];
  }
}

function saveRecords() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function formatCurrency(value) {
  const sign = value > 0 ? "+" : value < 0 ? "−" : "";
  return `${sign}¥${Math.abs(value).toLocaleString("ja-JP")}`;
}

function setAmountStyle(element, value) {
  element.classList.toggle("positive", value > 0);
  element.classList.toggle("negative", value < 0);
}

function updateDifference() {
  const difference = (Number(elements.returnAmount.value) || 0) - (Number(elements.investment.value) || 0);
  elements.difference.textContent = formatCurrency(difference);
  setAmountStyle(elements.difference, difference);
}

function getSecretaryState(monthTotal) {
  if (monthTotal >= 50000) return secretaryStates.rich;
  if (monthTotal >= 10000) return secretaryStates.cute;
  if (monthTotal <= -50000) return secretaryStates.broke;
  if (monthTotal <= -10000) return secretaryStates.poor;
  return secretaryStates.normal;
}

function selectLine(state, randomize) {
  if (!randomize) return state.lines[0];
  const previous = sessionStorage.getItem(LAST_LINE_KEY);
  const candidates = state.lines.filter((line) => line !== previous);
  const line = candidates[Math.floor(Math.random() * candidates.length)] || state.lines[0];
  sessionStorage.setItem(LAST_LINE_KEY, line);
  return line;
}

function updateSecretary(total, randomize = false) {
  const state = getSecretaryState(total);
  elements.secretaryCard.className = `secretary-card ${state.className}`;
  elements.secretaryFace.textContent = state.face;
  elements.secretaryOutfit.textContent = state.outfit;
  elements.secretaryStatus.textContent = state.label;
  elements.secretaryLine.textContent = selectLine(state, randomize);
  elements.secretaryImage.alt = `収支秘書 ミドリ（${state.label}）`;

  if (failedCharacterImages.has(state.imagePath)) {
    elements.secretaryImage.hidden = true;
    elements.secretaryFallback.hidden = false;
    return;
  }

  if (elements.secretaryImage.dataset.imagePath !== state.imagePath) {
    elements.secretaryImage.hidden = true;
    elements.secretaryFallback.hidden = false;
    elements.secretaryImage.dataset.imagePath = state.imagePath;
    elements.secretaryImage.src = state.imagePath;
  }
}

function getAffectionLabel(value) {
  if (value >= 80) return "特別な信頼";
  if (value >= 60) return "親しい関係";
  if (value >= 40) return "信頼の芽";
  if (value >= 20) return "まだ慎重";
  return "距離あり";
}

function updateAffectionDisplay() {
  elements.affectionValue.textContent = affection;
  elements.affectionMeter.style.width = `${affection}%`;
  elements.affectionMeter.parentElement.setAttribute("aria-valuenow", affection);
  elements.affectionLabel.textContent = getAffectionLabel(affection);
}

function getWalletHp(monthTotal) {
  if (monthTotal >= 50000) return 100;
  if (monthTotal >= 10000) return 75;
  if (monthTotal <= -50000) return 5;
  if (monthTotal <= -10000) return 25;
  return 50;
}

function updateWalletDisplay(monthTotal) {
  const hp = getWalletHp(monthTotal);
  elements.walletHp.textContent = hp;
  elements.walletMeter.style.width = `${hp}%`;
  elements.walletMeter.parentElement.setAttribute("aria-valuenow", hp);
}

function applyAffection(delta) {
  affection = Math.min(100, Math.max(0, affection + delta));
  localStorage.setItem(AFFECTION_KEY, String(affection));
  updateAffectionDisplay();
}

function addConversation(choice, response) {
  conversations.push({
    id: `${Date.now()}-${Math.random()}`,
    choice,
    response,
    createdAt: new Date().toISOString()
  });
  conversations = conversations.slice(-MAX_CONVERSATIONS);
  localStorage.setItem(CONVERSATION_KEY, JSON.stringify(conversations));
  renderConversations();
}

function renderConversations() {
  elements.conversationLog.replaceChildren();
  [...conversations].slice(-5).reverse().forEach((entry) => {
    const article = document.createElement("article");
    article.className = "conversation-entry";
    const text = document.createElement("p");
    text.textContent = `ミドリ「${entry.response}」`;
    const meta = document.createElement("small");
    meta.textContent = entry.choice ? `あなた：${entry.choice}` : "ミドリからのメッセージ";
    article.append(text, meta);
    elements.conversationLog.append(article);
  });
  elements.conversationEmpty.hidden = conversations.length > 0;
}

function showChoices(balance) {
  const result = balance > 0 ? "positive" : balance < 0 ? "negative" : "neutral";
  elements.choiceButtons.replaceChildren();
  choicesByResult[result].forEach((choice) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "choice-button";
    button.textContent = choice.label;
    button.addEventListener("click", () => {
      const latest = getLatestRecord();
      if (choice.label === "勝ち逃げする" && latest) {
        localStorage.setItem(ESCAPE_RECORD_KEY, latest.id);
      }
      applyAffection(choice.delta);
      elements.secretaryLine.textContent = choice.response;
      addConversation(choice.label, choice.response);
      elements.choicePanel.hidden = true;
      updateWinEscapeButton();
    });
    elements.choiceButtons.append(button);
  });
  elements.choicePanel.hidden = false;
  elements.choicePanel.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function getLatestRecord() {
  return records.length ? records[records.length - 1] : null;
}

function updateWinEscapeButton() {
  const latest = getLatestRecord();
  const claimedId = localStorage.getItem(ESCAPE_RECORD_KEY);
  const canEscape = latest && Number(latest.balance) > 0 && claimedId !== latest.id;
  elements.winEscapeButton.disabled = !canEscape;
  elements.winEscapeButton.textContent = latest && Number(latest.balance) > 0 && claimedId === latest.id
    ? "勝ち逃げ済み"
    : "勝ち逃げする";
}

function sumBalance(items) {
  return items.reduce((sum, record) => sum + Number(record.balance || 0), 0);
}

function updateSummary(randomizeLine = false) {
  const today = getLocalDateString();
  const month = today.slice(0, 7);
  const todayTotal = sumBalance(records.filter((record) => record.date === today));
  const monthTotal = sumBalance(records.filter((record) => record.date.startsWith(month)));
  const total = sumBalance(records);
  const wins = records.filter((record) => record.balance > 0).length;
  const losses = records.filter((record) => record.balance < 0).length;
  const balances = records.map((record) => Number(record.balance || 0));
  const maxWin = Math.max(0, ...balances);
  const maxLoss = Math.min(0, ...balances);
  const decided = wins + losses;

  [["today-balance", todayTotal], ["month-balance", monthTotal], ["total-balance", total], ["max-win", maxWin], ["max-loss", maxLoss]].forEach(([id, value]) => {
    const element = document.querySelector(`#${id}`);
    element.textContent = formatCurrency(value);
    setAmountStyle(element, value);
  });
  document.querySelector("#win-count").textContent = wins;
  document.querySelector("#loss-count").textContent = losses;
  document.querySelector("#win-rate").textContent = decided ? ((wins / decided) * 100).toFixed(1) : "0.0";
  updateSecretary(monthTotal, randomizeLine);
  updateWalletDisplay(monthTotal);
  updateWinEscapeButton();
}

function createHistoryCard(record) {
  const article = document.createElement("article");
  article.className = "history-card";

  const head = document.createElement("div");
  head.className = "history-card-head";
  const titleArea = document.createElement("div");
  const title = document.createElement("h3");
  title.textContent = record.place || "場所未入力";
  const meta = document.createElement("p");
  meta.className = "history-meta";
  meta.textContent = `${record.date} · ${record.type}`;
  titleArea.append(title, meta);

  const balance = document.createElement("strong");
  balance.className = "history-balance";
  balance.textContent = formatCurrency(record.balance);
  setAmountStyle(balance, record.balance);
  head.append(titleArea, balance);

  const amounts = document.createElement("div");
  amounts.className = "history-amounts";
  amounts.textContent = `投資 ¥${record.investment.toLocaleString("ja-JP")}　回収 ¥${record.returnAmount.toLocaleString("ja-JP")}`;
  article.append(head, amounts);

  if (record.memo) {
    const memo = document.createElement("p");
    memo.className = "history-memo";
    memo.textContent = record.memo;
    article.append(memo);
  }

  const deleteButton = document.createElement("button");
  deleteButton.className = "delete-record";
  deleteButton.type = "button";
  deleteButton.dataset.id = record.id;
  deleteButton.textContent = "この記録を削除";
  article.append(deleteButton);
  return article;
}

function renderHistory() {
  elements.historyList.replaceChildren();
  const sorted = [...records].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
  sorted.slice(0, MAX_VISIBLE_RECORDS).forEach((record) => elements.historyList.append(createHistoryCard(record)));
  elements.emptyMessage.hidden = records.length > 0;
  elements.recordCount.textContent = `${records.length}件`;
}

function render(randomizeLine = false) {
  updateSummary(randomizeLine);
  renderHistory();
  updateAffectionDisplay();
  renderConversations();
}

elements.form.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(elements.form);
  const investment = Number(formData.get("investment"));
  const returnAmount = Number(formData.get("returnAmount"));
  if (!Number.isFinite(investment) || !Number.isFinite(returnAmount) || investment < 0 || returnAmount < 0) return;

  records.push({
    id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
    date: String(formData.get("date")),
    type: String(formData.get("type")),
    place: String(formData.get("place")).trim(),
    investment,
    returnAmount,
    balance: returnAmount - investment,
    memo: String(formData.get("memo")).trim(),
    createdAt: new Date().toISOString()
  });
  saveRecords();
  elements.form.reset();
  elements.date.value = getLocalDateString();
  updateDifference();
  render(true);
  showChoices(returnAmount - investment);
});

elements.winEscapeButton.addEventListener("click", () => {
  const latest = getLatestRecord();
  if (!latest || Number(latest.balance) <= 0 || localStorage.getItem(ESCAPE_RECORD_KEY) === latest.id) return;
  const response = "きちんと勝ちを残せましたね。今日は素直に褒めてあげます。";
  localStorage.setItem(ESCAPE_RECORD_KEY, latest.id);
  applyAffection(2);
  elements.secretaryLine.textContent = response;
  addConversation("勝ち逃げする", response);
  elements.choicePanel.hidden = true;
  updateWinEscapeButton();
});

elements.historyList.addEventListener("click", (event) => {
  const button = event.target.closest(".delete-record");
  if (!button || !confirm("この記録を削除しますか？")) return;
  records = records.filter((record) => record.id !== button.dataset.id);
  saveRecords();
  render();
});

elements.deleteAll.addEventListener("click", () => {
  const hasData = records.length || conversations.length || affection !== 50;
  if (!hasData || !confirm("すべての収支データと会話データを削除します。この操作は元に戻せません。よろしいですか？")) return;
  records = [];
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(AFFECTION_KEY);
  localStorage.removeItem(CONVERSATION_KEY);
  localStorage.removeItem(ESCAPE_RECORD_KEY);
  affection = 50;
  conversations = [];
  elements.choicePanel.hidden = true;
  render();
});

elements.investment.addEventListener("input", updateDifference);
elements.returnAmount.addEventListener("input", updateDifference);
elements.date.value = getLocalDateString();
updateDifference();
render();

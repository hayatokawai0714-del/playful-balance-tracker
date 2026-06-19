"use strict";

const STORAGE_KEY = "playful-balance-tracker-records";
const LAST_LINE_KEY = "playful-balance-tracker-last-line";
const MAX_VISIBLE_RECORDS = 30;

const secretaryStates = {
  bigWin: {
    label: "大勝ち", className: "secretary--jackpot", face: "😊✨", outfit: "🎀",
    lines: ["す、すごい結果ですね。褒めてあげます。でも次も冷静に。", "好調な時こそ上限確認です。浮かれすぎは禁物ですよ。", "見事なプラスです。利益を残す計画までできたら完璧です。", "今日は華やかな気分です。でも深追いはさせませんからね。", "よくできました。べ、別に私まで嬉しいわけでは……少しだけです。"]
  },
  positive: {
    label: "プラス", className: "secretary--positive", face: "☺️", outfit: "👔",
    lines: ["堅実なプラスです。ちゃんと記録できて偉いですね。", "良い結果です。でも予算はいつも通り守ってくださいね。", "プラスを確認しました。無理なく終える判断も素敵です。", "ふふ、今日は褒めてあげます。次も冷静にいきましょう。", "数字は順調です。だからこそ、欲張らずに振り返りましょう。"]
  },
  normal: {
    label: "通常", className: "secretary--neutral", face: "🙂", outfit: "👔",
    lines: ["今日も事実を淡々と記録しましょう。私が見守っています。", "収支を見える化すれば、次の判断がしやすくなりますよ。", "焦らず、決めた予算の範囲で振り返りましょう。", "記録は地味でも大切です。さぼったら、少しだけ怒りますよ。", "勝ち負けより、冷静に数字と向き合えたかが大事です。"]
  },
  negative: {
    label: "マイナス", className: "secretary--negative", face: "😟", outfit: "🧥",
    lines: ["取り戻そうとしないで。今日は休む選択も必要です。", "次回の上限を先に決めて、無理のない範囲にしてください。", "マイナスを確認しました。いったん距離を置きましょう。", "少し心配です。今日はここまでにして、落ち着いてください。", "厳しく言います。生活に必要なお金には手をつけないこと。"]
  },
  bigLoss: {
    label: "反省会", className: "secretary--danger", face: "😠💸", outfit: "📋",
    lines: ["反省会です。今日はここまで。追加の出費は禁止です。", "取り返そうとしないでください。まず休んで頭を冷やしましょう。", "生活費には絶対に手をつけないこと。これは秘書命令です。", "上限を見直すまでお休みです。べ、別に心配しているだけです。", "大きなマイナスです。記録を確認して、しばらく距離を置きましょう。"]
  }
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
  secretaryFace: document.querySelector("#secretary-face"),
  secretaryOutfit: document.querySelector("#secretary-outfit"),
  secretaryStatus: document.querySelector("#secretary-status"),
  secretaryLine: document.querySelector("#secretary-line")
};

let records = loadRecords();

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

function getSecretaryState(total) {
  if (total >= 100000) return secretaryStates.bigWin;
  if (total > 0) return secretaryStates.positive;
  if (total <= -100000) return secretaryStates.bigLoss;
  if (total < 0) return secretaryStates.negative;
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
  updateSecretary(total, randomizeLine);
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
});

elements.historyList.addEventListener("click", (event) => {
  const button = event.target.closest(".delete-record");
  if (!button || !confirm("この記録を削除しますか？")) return;
  records = records.filter((record) => record.id !== button.dataset.id);
  saveRecords();
  render();
});

elements.deleteAll.addEventListener("click", () => {
  if (!records.length || !confirm("すべての収支データを削除します。この操作は元に戻せません。よろしいですか？")) return;
  records = [];
  localStorage.removeItem(STORAGE_KEY);
  render();
});

elements.investment.addEventListener("input", updateDifference);
elements.returnAmount.addEventListener("input", updateDifference);
elements.date.value = getLocalDateString();
updateDifference();
render();

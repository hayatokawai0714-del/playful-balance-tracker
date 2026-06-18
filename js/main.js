"use strict";

const STORAGE_KEY = "playful-balance-tracker-records";
const LAST_LINE_KEY = "playful-balance-tracker-last-line";
const MAX_VISIBLE_RECORDS = 30;

const secretaryStates = {
  bigWin: {
    label: "大勝ち", className: "state-big-win", face: "😄", outfit: "🧥",
    lines: ["好調な時こそ、使う額の上限を確認しましょう。", "良い結果ですね。利益の一部を残す計画もお忘れなく。", "数字は好調です。次も冷静な判断を続けましょう。"]
  },
  positive: {
    label: "プラス", className: "state-positive", face: "😊", outfit: "👔",
    lines: ["堅実なプラスです。この調子で記録を続けましょう。", "良い流れですが、予算はいつも通り守りましょう。", "プラスを確認しました。無理なく終える判断も大切です。"]
  },
  normal: {
    label: "通常", className: "state-normal", face: "🙂", outfit: "👔",
    lines: ["今日も事実を淡々と記録しましょう。", "収支を見える化すると、次の判断がしやすくなります。", "焦らず、決めた予算の範囲で振り返りましょう。"]
  },
  negative: {
    label: "マイナス", className: "state-negative", face: "😐", outfit: "🧣",
    lines: ["取り戻そうとせず、今日は休む選択も考えましょう。", "次回の上限を先に決めて、無理のない範囲にしましょう。", "マイナスを確認しました。いったん距離を置いて整理しましょう。"]
  },
  bigLoss: {
    label: "大負け", className: "state-big-loss", face: "😟", outfit: "🧣",
    lines: ["大きなマイナスです。まず休んで、追加の出費は止めましょう。", "生活費には手をつけず、しばらく間を空けましょう。", "今は取り返す時ではありません。上限を見直して休みましょう。"]
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
  const decided = wins + losses;

  [["today-balance", todayTotal], ["month-balance", monthTotal], ["total-balance", total]].forEach(([id, value]) => {
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

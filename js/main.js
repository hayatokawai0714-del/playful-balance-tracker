"use strict";

const KEYS = {
  goal: "neko-habit-goal",
  records: "neko-habit-records",
  affection: "neko-habit-affection",
  inventory: "neko-habit-inventory",
  lastLogin: "neko-habit-last-login",
  absenceDays: "neko-habit-absence-days",
  dailyReward: "neko-habit-daily-reward",
  dailyAffectionReward: "neko-habit-daily-affection-reward",
  giftLog: "neko-habit-gift-log",
  cats: "neko-habit-cats",
  secondCatUnlocked: "neko-habit-second-cat-unlocked",
  lastLine: "neko-habit-last-line",
  catName: "neko-habit-main-cat-name"
};

const APP_TITLE = "NEKO-NOTE";
const UNNAMED_CAT_LABEL = "？？？";
const LEGACY_MAIN_CAT_NAME = "ミドリ";
const MAIN_CAT = { id: "midori", name: UNNAMED_CAT_LABEL, type: "茶トラ", personality: "少し慎重", affection: 0, unlocked: true };
const SECOND_CAT = { id: "kuro", name: "クロ", type: "黒猫", personality: "少しクール", affection: 0, unlocked: true };

const ITEMS = {
  food: { name: "キャットフード", icon: "🥫", affection: 2, replies: { low: ["……たべる。", "少し離れて、もぐもぐ。", "これ、すきかも。"], mid: ["これ、すきかも。", "ありがと。もぐもぐ。", "もう少し、ある？"], high: ["ありがと。となりで食べる。", "これ、だいすき。", "いっしょに、もぐもぐ。"] } },
  snack: { name: "おやつ", icon: "🐟", affection: 3, replies: { low: ["にゃ……。", "そっと、もらう。", "ちょっとだけ、うれしい。"], mid: ["にゃ……♪", "また、くれる？", "これ、すき。"], high: ["にゃー。うれしい。", "もっと近くで、たべる。", "ありがと。ごろごろ。"] } },
  toy: { name: "おもちゃ", icon: "🧶", affection: 5, replies: { low: ["これ、なに？", "……ちょん。", "少しだけ、あそぶ。"], mid: ["あそぶ？", "……もう一回。", "ころころ、たのしい。"], high: ["いっしょに、あそぼ。", "もう一回！", "これ、だいすき。"] } }
};

const CAT_DIALOGUE = {
  unnamed: {
    default: ["……だれ？", "こっち見てる", "まだ、ちょっと遠い", "……にゃ", "その手、なに？", "ゆっくり、ね", "ここから見る", "ふしぎなひと", "えっと……", "近くは、まだ"],
    calm: ["名前は、まだない", "そっと、見てる", "むりはしない", "ここ、見える", "もう少し、まって", "ひかえめに、にゃ", "わるくない距離", "まだ、決めない", "ちいさく、あいさつ", "ふわっと、いる"]
  },
  named: {
    default: ["それ、ぼくの名前？", "……呼ばれるの、変な感じ", "もう一回、呼んで", "その名前、きらいじゃない", "名前、覚えたよ", "ちょっと、うれしい", "ねえ、聞こえた", "名前があるって、いいね", "呼んでくれる？", "そっと、よんで"],
    special: ["その名前、好き", "呼ぶと、耳が動く", "名前、うれしい", "もう、慣れてきた", "呼ばれるの、いいね", "ふわっと、近づく", "名前で、わかる", "ちいさな特別", "それ、ぼくだよ", "ちょっと、自慢"]
  },
  affection: {
    0: ["……だれ？", "こっち見てる", "まだ、ちょっと遠い", "……にゃ", "その手、なに？", "ゆっくり、ね", "ここから見る", "ふしぎなひと", "えっと……", "近くは、まだ"],
    20: ["また来たの？", "今日はなにするの？", "少しだけ、見てる", "近づいてもいい？", "ここ、あったかいね", "ゆっくりなら、いい", "気になる、かも", "まだ少し、遠い", "でも、気になる", "そっと、近く"],
    40: ["待ってた……かも", "今日は記録する？", "がんばるなら、見てるよ", "ちょっとだけ近くにいる", "その調子、悪くないね", "名前、考えてもいいかも", "今日は静かだね", "少し、慣れてきた", "近くでも、平気", "うん、見てる"],
    60: ["待ってたよ", "今日も来たね", "がんばったら、なでてもいいよ", "ここ、落ち着く", "きみの足音、覚えたよ", "近くにいると、安心", "今日も、いい匂い", "ちゃんと見てる", "ねえ、もう少し", "気に入ってる"],
    80: ["今日もがんばったね", "そばにいるよ", "えらいえらい", "毎日来てくれて、うれしい", "ここ、もうお気に入り", "きみが来ると、落ち着く", "今日も、待ってた", "なでてもいい気分", "ずっと一緒でもいい", "ほんとに、うれしい"]
  },
  record: {
    none: ["今日は、まだかな", "記録、待ってる", "ここで、見てる", "ゆっくりでいい", "最初の一歩、かな", "静かな朝だね", "なにを残すのかな", "まだ白い日", "今日も、これから", "ふわっと、待機"],
    first: ["今日もがんばったね。", "えらいえらい。", "また、来てくれた。", "記録、見たよ", "今日のぶん、えらい", "ちゃんと覚えた", "ひとつ、進んだ", "いい感じ", "また一歩", "見てたよ"],
    repeat: ["もう一回、えらい", "ちょっとだけ、にっこり", "続けてるね", "ふたつめの足あと", "今日のぶん、増えた", "まだ、がんばる？", "記録が増えた", "おなじ日も、いいね", "こまめだね", "ていねいだね"],
    streak: ["今日は、えらい。", "つづいてる、えらいえらい", "今日も、ここにいる。", "毎日、すごい", "ならんで、見てる", "しっぽが、うれしい", "ここまで、よく来た", "続けるの、知ってる", "いい流れだね", "今日も、合格"],
    return: ["おかえり", "また会えた", "少し、さみしかった", "でも、来た", "におい、覚えてる", "ここは、変わらない", "やっと、見つけた", "足音、うれしい", "帰ってきたね", "おかえりの、にゃ"]
  },
  gift: {
    food: ["……たべる。", "少し離れて、もぐもぐ。", "これ、すきかも。", "おなか、ぺこり。", "そっと、いただく。", "あったかいにおい。", "ふつうに、うれしい。", "ゆっくり食べる。", "お皿、見てた。", "ちゃんと、たべるね。", "食べると、落ち着く。", "すこし、安心。"],
    snack: ["にゃ……♪", "また、くれる？", "これ、すき。", "ちょっと、ごほうび。", "今日のぶん、うれしい。", "しっぽ、ゆらゆら。", "甘いの、いいね。", "もうひとつ、ほしいな。", "だんだん、うれしい。", "おやつの音、すき。", "きみといると、あまい。", "ごほうび、うれしいね。"],
    toy: ["これ、なに？", "……ちょん。", "少しだけ、あそぶ。", "ふしぎな、ゆれ。", "見てるだけでも、気になる。", "ひも、かな。", "ころん、とした。", "ちょっとだけ、追いかける。", "むずむず、する。", "動くと、気になる。", "もっと、こっち。", "今日は、いっぱい追いかける。"]
  },
  kuro: [
    "……ここ、静かでいい",
    "先にいた猫が、ここなら大丈夫って",
    "あったかい場所、見つけた",
    "少しだけ、見てる",
    "……悪くないね",
    "ふーん、落ち着く",
    "ここ、気に入るかも",
    "ひかえめに、いる",
    "においは、やさしい",
    "……まあ、ありだね",
    "座るなら、ここ",
    "先住、悪くなさそう",
    "だんだん、慣れる",
    "ここなら、ねむれそう",
    "……また来る"
  ]
};

const elements = {
  catCard: document.querySelector("#catCompanion"),
  catStickyArea: document.querySelector("#catStickyArea"),
  roomBackgroundImage: document.querySelector("#room-background-image"),
  catStage: document.querySelector("#cat-stage"),
  catImage: document.querySelector("#cat-image"),
  catFallback: document.querySelector("#cat-fallback"),
  friendCatCharacter: document.querySelector("#friend-cat-character"),
  kuroImage: document.querySelector("#kuro-image"),
  kuroFallback: document.querySelector("#kuro-fallback"),
  catReaction: document.querySelector("#cat-reaction"),
  catStatus: document.querySelector("#cat-status"),
  catName: document.querySelector("#cat-name"),
  catNameHint: document.querySelector("#cat-name-hint"),
  catNameEditButton: document.querySelector("#cat-name-edit-button"),
  catNameForm: document.querySelector("#cat-name-form"),
  catNameInput: document.querySelector("#cat-name-input"),
  catNameMessage: document.querySelector("#cat-name-message"),
  catLine: document.querySelector("#cat-line"),
  speechName: document.querySelector("#speech-name"),
  affectionValue: document.querySelector("#affection-value"),
  affectionMeter: document.querySelector("#affection-meter"),
  affectionTrack: document.querySelector("#affection-track"),
  affectionLabel: document.querySelector("#affection-label"),
  catTodayMessage: document.querySelector("#cat-today-message"),
  catStreakCount: document.querySelector("#cat-streak-count"),
  catTotalDays: document.querySelector("#cat-total-days"),
  newCatHint: document.querySelector("#new-cat-hint"),
  roomResidents: document.querySelector("#room-residents"),
  secondCatName: document.querySelector("#second-cat-name"),
  secondCatType: document.querySelector("#second-cat-type"),
  secondCatPersonality: document.querySelector("#second-cat-personality"),
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
const loadedGiftLogs = loadJson(KEYS.giftLog, []);
const loadedCats = loadJson(KEYS.cats, []);
let records = Array.isArray(loadedRecords) ? loadedRecords : [];
let inventory = { food: 0, snack: 0, toy: 0, ...(loadedInventory && typeof loadedInventory === "object" ? loadedInventory : {}) };
let giftLogs = Array.isArray(loadedGiftLogs) ? loadedGiftLogs : [];
let affection = clamp(Number(localStorage.getItem(KEYS.affection)) || 0, 0, 100);
let cats = Array.isArray(loadedCats) ? loadedCats : [];
let secondCatUnlocked = localStorage.getItem(KEYS.secondCatUnlocked) === "true" || cats.some((cat) => cat.id === SECOND_CAT.id);
if (!cats.some((cat) => cat.id === MAIN_CAT.id)) cats.unshift({ ...MAIN_CAT, affection });
if (secondCatUnlocked && !cats.some((cat) => cat.id === SECOND_CAT.id)) cats.push({ ...SECOND_CAT });
const savedMainCatName = localStorage.getItem(KEYS.catName);
let mainCatName = savedMainCatName ? [...String(savedMainCatName).trim()].slice(0, 10).join("") : UNNAMED_CAT_LABEL;
if (!mainCatName) mainCatName = UNNAMED_CAT_LABEL;
if (mainCatName === LEGACY_MAIN_CAT_NAME) mainCatName = UNNAMED_CAT_LABEL;
document.title = APP_TITLE;
const previousLogin = localStorage.getItem(KEYS.lastLogin);
const storedAbsenceDays = Number(localStorage.getItem(KEYS.absenceDays)) || 0;
let daysAway = Math.max(storedAbsenceDays, previousLogin ? daysBetween(previousLogin, getLocalDate()) : 0);
let reactionTimer = null;
let reactionStartTimer = null;

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
  saveCatData();
}

function saveCatData() {
  const mainCat = cats.find((cat) => cat.id === MAIN_CAT.id);
  if (mainCat) {
    mainCat.affection = affection;
    mainCat.name = mainCatName;
  }
  localStorage.setItem(KEYS.cats, JSON.stringify(cats));
  localStorage.setItem(KEYS.secondCatUnlocked, String(secondCatUnlocked));
}

function maybeUnlockSecondCat() {
  if (affection < 100 || secondCatUnlocked) return false;
  secondCatUnlocked = true;
  if (!cats.some((cat) => cat.id === SECOND_CAT.id)) cats.push({ ...SECOND_CAT });
  saveCatData();
  return true;
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
  if (daysAway >= 10) return { label: "おでかけ中", className: "is-away" };
  if (daysAway >= 7) return { label: "かくれ中", className: "is-hidden" };
  if (daysAway >= 3) return { label: "少し不機嫌", className: "is-grumpy" };
  const distance = getAffectionState();
  return { label: distance.label, className: "" };
}

function getAffectionState() {
  if (affection >= 80) return { label: "とてもなついている", className: "distance-loving" };
  if (affection >= 60) return { label: "なついてきた", className: "distance-close" };
  if (affection >= 40) return { label: "慣れてきた", className: "distance-used" };
  if (affection >= 20) return { label: "少し気になる", className: "distance-curious" };
  return { label: "警戒中", className: "distance-wary" };
}

function getLineCandidates() {
  const todayDone = getUniqueRecordDates().includes(getLocalDate());
  const streak = getStreak();
  if (daysAway >= 10) return CAT_DIALOGUE.record.return;
  if (daysAway >= 7) return ["……物陰から、ちらり。", "まだ、ここにいるよ。", "静かになったら出る。", "ここで、待つだけ", "風の音、聞こえる", "ひさしぶりでも、平気", "見つかるといいな", "そろそろ、顔を出す", "まだ、しずか", "先に、のびる"];
  if (daysAway >= 3) return ["……しばらく見なかったね。", "ふん。今日はいるんだ。", "少しだけ、待ってた。", "ちょっと、さみしかった", "戻ってきたなら、よし", "ここ、覚えてる？", "うん、見えてる", "少し、あたたかい", "今日は、早いね", "まあ、いいか"];
  if (todayDone && streak >= 7) return CAT_DIALOGUE.record.streak;
  if (todayDone) return CAT_DIALOGUE.record.first;
  if (affection >= 80) return CAT_DIALOGUE.affection[80];
  if (affection >= 60) return CAT_DIALOGUE.affection[60];
  if (affection >= 40) return CAT_DIALOGUE.affection[40];
  if (affection >= 20) return CAT_DIALOGUE.affection[20];
  return localStorage.getItem(KEYS.catName) ? CAT_DIALOGUE.named.default : CAT_DIALOGUE.unnamed.default;
}

function chooseCatLine(forceNew = false) {
  const candidates = getLineCandidates();
  const previous = localStorage.getItem(KEYS.lastLine);
  const pool = forceNew ? candidates.filter((line) => line !== previous) : candidates;
  const line = pool[Math.floor(Math.random() * pool.length)] || candidates[0];
  localStorage.setItem(KEYS.lastLine, line);
  return line;
}

function chooseKuroLine() {
  const candidates = CAT_DIALOGUE.kuro;
  const previous = localStorage.getItem(KEYS.lastLine);
  const pool = candidates.filter((line) => line !== previous);
  const line = pool[Math.floor(Math.random() * pool.length)] || candidates[0];
  localStorage.setItem(KEYS.lastLine, line);
  return line;
}

function renderCat(forceNewLine = false) {
  const state = getCatState();
  const distance = getAffectionState();
  elements.catCard.className = `cat-card ${state.className} ${distance.className}`.trim();
  elements.catStickyArea.className = `cat-sticky-area ${state.className} ${distance.className}`.trim();
  elements.catStatus.textContent = state.label;
  elements.catName.textContent = mainCatName;
  elements.catImage.alt = `茶トラ猫の${mainCatName}`;
  elements.affectionValue.textContent = affection;
  elements.affectionMeter.style.width = `${affection}%`;
  elements.affectionTrack.setAttribute("aria-valuenow", affection);
  elements.affectionLabel.textContent = distance.label;
  const kuroSpeaks = secondCatUnlocked && daysAway < 3 && !forceNewLine && Math.random() < 0.22;
  elements.speechName.textContent = kuroSpeaks ? "クロ" : mainCatName;
  elements.catLine.textContent = kuroSpeaks ? chooseKuroLine() : chooseCatLine(forceNewLine);
  renderCatNaming();
}

function renderCatNaming() {
  const canName = affection >= 40;
  const hasCustomName = Boolean(localStorage.getItem(KEYS.catName));
  elements.catNameHint.textContent = canName
    ? "名前をつけられます。すてきな名前を入力してください。"
    : "もう少し仲良くなったら、名前をつけられます。";
  elements.catNameEditButton.hidden = !canName;
  elements.catNameEditButton.textContent = hasCustomName ? "名前を変更" : "名前をつける";
  if (!canName) elements.catNameForm.hidden = true;
}

function triggerCatReaction(className, symbol) {
  clearTimeout(reactionTimer);
  const reactionTargets = [elements.catCard, elements.catStickyArea].filter(Boolean);
  reactionTargets.forEach((target) => target.classList.remove("cat--record-reaction", "cat--gift-reaction", "cat--new-friend"));
  void elements.catStickyArea.offsetWidth;
  elements.catReaction.textContent = symbol;
  reactionTargets.forEach((target) => target.classList.add(className));
  const duration = className === "cat--new-friend" ? 1700 : className === "cat--gift-reaction" ? 1500 : 1200;
  reactionTimer = setTimeout(() => {
    reactionTargets.forEach((target) => target.classList.remove(className));
  }, duration);
}

function renderCompanions() {
  const secondCat = cats.find((cat) => cat.id === SECOND_CAT.id);
  elements.newCatHint.hidden = secondCatUnlocked;
  elements.friendCatCharacter.hidden = !secondCatUnlocked;
  elements.roomResidents.hidden = !secondCatUnlocked;
  elements.catStage.classList.toggle("has-companion", secondCatUnlocked);
  if (!secondCat) return;
  elements.secondCatName.textContent = secondCat.name;
  elements.secondCatType.textContent = secondCat.type;
  elements.secondCatPersonality.textContent = secondCat.personality;
}

function showSecondCatEvent() {
  const message = "部屋のすみから、黒い猫がそっと顔を出しました。";
  elements.speechName.textContent = "できごと";
  elements.catLine.textContent = message;
  elements.friendCatCharacter.classList.remove("is-new");
  void elements.friendCatCharacter.offsetWidth;
  elements.friendCatCharacter.classList.add("is-new");
  triggerCatReaction("cat--new-friend", "🐾 ✦");
  setTimeout(() => {
    elements.friendCatCharacter.classList.remove("is-new");
  }, 1800);
}

function getGiftReply(item) {
  const level = affection >= 70 ? "high" : affection >= 30 ? "mid" : "low";
  const replies = item.replies[level];
  const previous = localStorage.getItem(KEYS.lastLine);
  const pool = replies.filter((line) => line !== previous);
  const line = pool[Math.floor(Math.random() * pool.length)] || replies[0];
  localStorage.setItem(KEYS.lastLine, line);
  return line;
}

function prefersReducedMotion() {
  return Boolean(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
}

function focusCatAfterGift() {
  const reduceMotion = prefersReducedMotion();
  const target = elements.catStickyArea || elements.catCard;
  const rect = target.getBoundingClientRect();
  const stickyTop = 24 + (window.visualViewport ? window.visualViewport.offsetTop : 0);
  if (!reduceMotion && rect.top >= stickyTop && rect.top < window.innerHeight * 0.45) return;
  target.scrollIntoView({
    behavior: reduceMotion ? "auto" : "smooth",
    block: reduceMotion ? "nearest" : "start"
  });
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
    amount.className = "item-count";
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
  const unlockedSecondCat = maybeUnlockSecondCat();
  const reply = getGiftReply(item);
  giftLogs.push({
    id: `${Date.now()}-${Math.random()}`,
    date: getLocalDate(),
    itemKey: key,
    itemName: item.name,
    icon: item.icon,
    response: reply,
    createdAt: new Date().toISOString()
  });
  giftLogs = giftLogs.slice(-30);
  localStorage.setItem(KEYS.giftLog, JSON.stringify(giftLogs));
  saveCoreData();
  renderInventory();
  renderCat();
  renderCompanions();
  renderHistory();
  elements.speechName.textContent = mainCatName;
  elements.catLine.textContent = reply;
  focusCatAfterGift();
  clearTimeout(reactionStartTimer);
  reactionStartTimer = setTimeout(() => {
    if (unlockedSecondCat) showSecondCatEvent();
    else triggerCatReaction("cat--gift-reaction", affection >= 70 ? "♥ ✦" : "♥");
  }, prefersReducedMotion() ? 0 : 320);
}

function renderSummary() {
  const dates = getUniqueRecordDates();
  const today = getLocalDate();
  const doneToday = dates.includes(today);
  elements.streakCount.textContent = getStreak();
  elements.totalDays.textContent = dates.length;
  elements.catTotalDays.textContent = dates.length;
  elements.todayStatus.textContent = doneToday ? "記録済み" : "未記録";
  elements.todayStatus.classList.toggle("done", doneToday);
  elements.lastRecordDate.textContent = dates.length ? dates[dates.length - 1] : "まだありません";
  elements.catTodayMessage.textContent = doneToday ? "今日は記録済みです" : "今日はまだ記録していません";
  elements.catStreakCount.textContent = getStreak();
}

function renderHistory() {
  elements.historyList.replaceChildren();
  const activities = [
    ...records.map((record) => ({ ...record, entryType: "record" })),
    ...giftLogs.map((gift) => ({ ...gift, entryType: "gift" }))
  ].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  activities.slice(0, 5).forEach((record) => {
    const article = document.createElement("article");
    article.className = `history-card${record.entryType === "gift" ? " is-gift-log" : ""}`;
    const head = document.createElement("div");
    head.className = "history-card-head";
    const title = document.createElement("h3");
    title.textContent = record.entryType === "gift" ? `${record.icon} ${record.itemName}をプレゼント` : record.action;
    const date = document.createElement("span");
    date.className = "history-date";
    date.textContent = record.date;
    head.append(title, date);
    article.append(head);
    if (record.entryType === "record" && record.amount) {
      const amount = document.createElement("span");
      amount.className = "history-amount";
      amount.textContent = record.amount;
      article.append(amount);
    }
    const detail = record.entryType === "gift" ? `${mainCatName}「${record.response}」` : record.memo;
    if (detail) {
      const memo = document.createElement("p");
      memo.className = "history-memo";
      memo.textContent = detail;
      article.append(memo);
    }
    elements.historyList.append(article);
  });
  elements.emptyMessage.hidden = activities.length > 0;
  elements.recordCount.textContent = `${activities.length}件`;
}

function renderAll(forceNewLine = false) {
  renderGoal();
  renderCat(forceNewLine);
  renderCompanions();
  renderInventory();
  renderSummary();
  renderHistory();
}

function setupCatImage(image, fallback) {
  const showImage = () => {
    image.hidden = false;
    fallback.hidden = true;
    image.parentElement.classList.add("has-cat-image");
  };
  const showFallback = () => {
    image.removeAttribute("src");
    image.hidden = true;
    fallback.hidden = false;
    image.parentElement.classList.remove("has-cat-image");
  };
  image.addEventListener("load", showImage);
  image.addEventListener("error", showFallback);
  if (image.complete) {
    if (image.naturalWidth > 0) showImage();
    else showFallback();
  }
}

setupCatImage(elements.catImage, elements.catFallback);
setupCatImage(elements.kuroImage, elements.kuroFallback);

function setupRoomBackground() {
  const image = elements.roomBackgroundImage;
  const showImage = () => {
    image.hidden = false;
    image.parentElement.classList.add("has-room-background");
  };
  const showCssRoom = () => {
    image.hidden = true;
    image.parentElement.classList.remove("has-room-background");
  };
  image.addEventListener("load", showImage, { once: true });
  image.addEventListener("error", showCssRoom, { once: true });
  if (image.complete) {
    if (image.naturalWidth > 0) showImage();
    else showCssRoom();
  }
}

setupRoomBackground();

elements.catNameEditButton.addEventListener("click", () => {
  if (affection < 40) return;
  const willOpen = elements.catNameForm.hidden;
  elements.catNameForm.hidden = !willOpen;
  elements.catNameMessage.textContent = "";
  if (willOpen) {
    elements.catNameInput.value = mainCatName;
    elements.catNameInput.focus();
  }
});

elements.catNameForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (affection < 40) return;
  const nextName = elements.catNameInput.value.trim();
  if (!nextName) {
    elements.catNameMessage.textContent = "名前を入力してください。";
    return;
  }
  if ([...nextName].length > 10) {
    elements.catNameMessage.textContent = "名前は10文字以内にしてください。";
    return;
  }
  mainCatName = nextName;
  localStorage.setItem(KEYS.catName, mainCatName);
  saveCatData();
  elements.catNameForm.hidden = true;
  renderCat(true);
  elements.speechName.textContent = mainCatName;
  elements.catLine.textContent = CAT_DIALOGUE.named.special[Math.floor(Math.random() * CAT_DIALOGUE.named.special.length)];
  elements.catNameMessage.textContent = "名前を保存しました。";
});

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
  const today = getLocalDate();
  const receivesAffection = localStorage.getItem(KEYS.dailyAffectionReward) !== today;
  records.push({
    id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
    date: today,
    action: String(formData.get("action")).trim() || goal || "今日の目標に取り組んだ",
    amount: String(formData.get("amount")).trim(),
    memo: String(formData.get("memo")).trim(),
    createdAt: new Date().toISOString()
  });
  if (receivesAffection) {
    affection = clamp(affection + 3, 0, 100);
    localStorage.setItem(KEYS.dailyAffectionReward, today);
  }
  const unlockedSecondCat = maybeUnlockSecondCat();
  daysAway = 0;
  saveCoreData();
  elements.recordForm.reset();
  renderAll(true);
  if (unlockedSecondCat) {
    showSecondCatEvent();
  } else {
    const recordPool = !getUniqueRecordDates().includes(today)
      ? CAT_DIALOGUE.record.none
      : getStreak() >= 7
        ? CAT_DIALOGUE.record.streak
        : receivesAffection
          ? CAT_DIALOGUE.record.first
          : CAT_DIALOGUE.record.repeat;
    const previous = localStorage.getItem(KEYS.lastLine);
    const pool = recordPool.filter((line) => line !== previous);
    const line = pool[Math.floor(Math.random() * pool.length)] || recordPool[0];
    localStorage.setItem(KEYS.lastLine, line);
    elements.catLine.textContent = line;
    elements.speechName.textContent = mainCatName;
    triggerCatReaction("cat--record-reaction", "✦");
  }
});

elements.resetButton.addEventListener("click", () => {
  if (!confirm("目標・記録・猫とのなかよし度をすべてリセットしますか？")) return;
  Object.values(KEYS).forEach((key) => localStorage.removeItem(key));
  goal = "";
  records = [];
  inventory = { food: 0, snack: 0, toy: 0 };
  giftLogs = [];
  affection = 0;
  cats = [{ ...MAIN_CAT }];
  mainCatName = MAIN_CAT.name;
  secondCatUnlocked = false;
  daysAway = 0;
  elements.catNameInput.value = "";
  elements.catNameMessage.textContent = "";
  renderAll();
  elements.bonusMessage.textContent = "リセットしました。次回アクセス時に新しいボーナスを受け取れます。";
});

const unlockedOnLoad = maybeUnlockSecondCat();
grantLoginBonus();
renderAll();
if (unlockedOnLoad) showSecondCatEvent();

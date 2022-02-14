import io from "./lib/socket.io.esm.min.js";
const socket = io();

/**
 * @typedef {"emoji" | "beat"} ButtonTypes
 */

/**
 * 
 * @param {ButtonTypes} type 
 * @param {*} idx 
 */
const emitButtonClick = (type, idx) => {
  socket.emit("buttonClick", {
    type,
    idx
  });
}

let inKeybindMode = -1;
let ctrlPressed = false;
document.addEventListener("keydown", (e) => {
  const idx = soundDatas.findIndex(data => data.keyBind === e.key);
  const data = soundDatas[idx];
  if (typeof data !== "undefined") {
    new Audio(data.audio).play();
    emitButtonClick("beat", idx);
  }
  if (e.key === "Control") {
    ctrlPressed = true;
  } else if (inKeybindMode !== -1) {
    const data = soundDatas[inKeybindMode];
    const ele = beatButtonElements[inKeybindMode].key;
    ele.innerText = e.key;
    data.keyBind = e.key;
    inKeybindMode = -1;
  }
});
document.addEventListener("keyup", (e) => {
  if (e.key === "Control") {
    ctrlPressed = false;
  }
});
document.addEventListener("blur", (e) => {
  ctrlPressed = false;
});


/** @type {HTMLCanvasElement} */
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const beatDisplay = document.getElementById("beat-display");
const userDisplay = document.getElementById("user-count-display");
const userColorDisplay = document.getElementById("user-color-display");
/**
 * @typedef DisplayData
 * @property {number} stamp
 * @property {ButtonTypes} type
 * @property {number} idx
 * @property {string} userColor
 */
/** @type {DisplayData[]} */
let displayDatas = [];
/** @type {string[]} */
let userColors = [];
socket.on("update", ({
  type,
  idx,
  count,
  self: isSelf,
  userColor,
  userColors: _userColors,
}) => {
  displayDatas.push({
    stamp: new Date().getTime(),
    type,
    idx,
    userColor
  });
  beatDisplay.innerText = count;
  userColors = _userColors;
  userDisplay.innerText = userColors.length;
  let userColorDisplayBg = `linear-gradient(90deg`;
  for (let i = 0; i < Math.max(2, userColors.length); i++) {
    userColorDisplayBg += "," + (userColors[i] ?? "#000");
  }
  userColorDisplayBg += ")";
  userColorDisplay.style.background = userColorDisplayBg;

  if (type === "beat" && !isSelf) {
    new Audio(soundDatas[idx].audio).play().catch(e => e);
  }
});

/**
 * @typedef SoundData
 * @property {string} color
 * @property {string} fileName
 * @property {string} displayName
 * @property {string} keyBind
 * @property {*} audio
 */
/** @type {SoundData[]} */
const soundDatas = [
  {
    fileName: "ride",
    displayName: "Ride",
    color: "#515203",
    keyBind: "d"
  },
  {
    fileName: "hat",
    displayName: "Hat",
    color: "#ace35f",
    keyBind: "f"
  },
  {
    fileName: "openhat",
    displayName: "Openhat",
    color: "#3eab8d",
    keyBind: "g"
  },
  {
    fileName: "crash",
    displayName: "Crash",
    color: "#fc7303",
    keyBind: "h"
  },
  {
    fileName: "kick",
    displayName: "Kick",
    color: "#445263",
    keyBind: "j"
  },
  {
    fileName: "snare",
    displayName: "Snare 1",
    color: "#564463",
    keyBind: "k"
  },
  {
    fileName: "snare2",
    displayName: "Snare 2",
    color: "#634462",
    keyBind: "l"
  },
  {
    fileName: "crash2",
    displayName: "Crash 2",
    color: "#d1650d",
    keyBind: "c"
  },
  {
    fileName: "Htom",
    displayName: "H Tom",
    color: "#f23a3a",
    keyBind: "v"
  },
  {
    fileName: "Mtom",
    displayName: "M Tom",
    color: "#f2a23a",
    keyBind: "b"
  },
  {
    fileName: "Ltom",
    displayName: "L Tom",
    color: "#90f23a",
    keyBind: "n"
  },
  {
    fileName: "stick",
    displayName: "Stick",
    color: "#b85107",
    keyBind: "m"
  },
];
const beatButtonContainer = document.getElementById("beat-button-container");
/**
 * @typedef BeatButtonElement
 * @property {HTMLDivElement} name
 * @property {HTMLDivElement} key
 */
/** @type {BeatButtonElement[]} */
const beatButtonElements = [];
for (let i = 0; i < soundDatas.length; i++) {
  const soundData = soundDatas[i];
  /** @type {BeatButtonElement} */
  const beatButtonElement = {};
  beatButtonElements.push(beatButtonElement);
  fetch(`./resources/sounds/${soundData.fileName}.mp3`)
    .then((res) => res.blob())
    .then((blob) => {
      soundData.audio = URL.createObjectURL(blob);
    })
    .catch((err) => console.error(err));

  const ele = document.createElement("span");
  ele.classList.add("beat-button");
  ele.style.setProperty("--color", soundData.color);
  beatButtonContainer.appendChild(ele);

  const nameEle = document.createElement("div");
  beatButtonElement.name = nameEle;
  nameEle.classList.add("beat-button__name");
  nameEle.innerText = soundData.displayName;
  ele.appendChild(nameEle);

  const keyEle = document.createElement("div");
  beatButtonElement.key = keyEle;
  keyEle.classList.add("beat-button__key");
  keyEle.innerText = soundData.keyBind;
  ele.appendChild(keyEle);

  ele.addEventListener("click", function() {
    new Audio(soundData.audio).play();
    emitButtonClick("beat", i);
    if (ctrlPressed && inKeybindMode === -1) {
      inKeybindMode = i;
      beatButtonElement.key.innerText = "?"
    }
  });
}

const emojiLookup = [
  "👋", "👏", "👍", "🤟", "👀", "💖",
  "😀", "😁", "😝", "😍", "🤔", "😕",
  "🤫", "😠", "🤦", "❔", "🆒", "🆖",
  "4️⃣", "3️⃣", "2️⃣", "1️⃣", "0️⃣", "🛑",
];
const emojiButtonContainer = document.getElementById("emoji-button-container");
for (let i = 0; i < emojiLookup.length; i++) {
  const ele = document.createElement("span");
  ele.innerText = emojiLookup[i];
  emojiButtonContainer.appendChild(ele);
  ele.addEventListener("click", () => {
    emitButtonClick("emoji", i);
  });
}

const body = document.getElementsByTagName("body")[0];
let DISPLAY_DATA_TIME_RANGE = 25_000;
const TIMELINE_PER = 5000;
function tick() {
  const time = new Date().getTime();
  const { offsetWidth: WIDTH, offsetHeight: HEIGHT } = body;
  displayDatas = displayDatas.filter(data => time - data.stamp < DISPLAY_DATA_TIME_RANGE);
  const changeRangeTo = (30-displayDatas.length/3)*1000;
  DISPLAY_DATA_TIME_RANGE += Math.sign(changeRangeTo-DISPLAY_DATA_TIME_RANGE)*(DISPLAY_DATA_TIME_RANGE/5000);
  DISPLAY_DATA_TIME_RANGE = Math.min(25_000, Math.max(5_000, DISPLAY_DATA_TIME_RANGE));
  
  canvas.width = WIDTH;
  canvas.height = HEIGHT/10;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.lineWidth = 1;
  ctx.strokeStyle = "#0007";
  ctx.fillStyle = "#555";
  ctx.font = "2vh Inconsolata";
  for (let i = 1; i < Math.ceil(DISPLAY_DATA_TIME_RANGE/TIMELINE_PER)+1; i++) {
    const xPos = canvas.width/DISPLAY_DATA_TIME_RANGE * i*TIMELINE_PER;
    const text = `${i*5}s ago`;
    const textMetrics = ctx.measureText(text);
    const textWidth = textMetrics.width;
    const textHeight = textMetrics.fontBoundingBoxDescent;
    ctx.fillText(text, xPos-textWidth/2, canvas.height-textHeight);
    ctx.beginPath();
    ctx.moveTo(xPos, 0);
    ctx.lineTo(xPos, canvas.height-textHeight*2);
    ctx.stroke();
  }
  
  ctx.lineWidth = 1;
  ctx.shadowBlur = 1;
  ctx.shadowColor = "#fff";
  for (let i = 0; i < displayDatas.length; i++) {
    const data = displayDatas[i];
    const diff = time - data.stamp;
    const xPos = WIDTH*(diff/DISPLAY_DATA_TIME_RANGE);
    ctx.fillStyle = data.userColor;
    const text = userColors.findIndex(color => color === data.userColor)+1;
    const textMetrics = ctx.measureText(text);
    const textWidth = textMetrics.width;
    const textHeight = textMetrics.fontBoundingBoxDescent;
    if (data.type === "beat") {
      ctx.strokeStyle = soundDatas[data.idx]?.color;
      ctx.beginPath();
      ctx.moveTo(xPos, canvas.height);
      ctx.lineTo(xPos, 0);
      ctx.stroke();
      ctx.fillText(text, xPos-textWidth/2, canvas.height-textHeight);
    } else {
      const emoji = emojiLookup[data.idx];
      const emojiMetrics = ctx.measureText(emoji);
      const emojiWidth = emojiMetrics.width;
      const emojiHeight = emojiMetrics.fontBoundingBoxDescent;
      ctx.fillText(emoji, xPos, ctx.measureText(emoji).actualBoundingBoxAscent);
      ctx.fillText(text, xPos+emojiWidth-textWidth/2, textHeight+emojiHeight+20);
    }
  }

  requestAnimationFrame(tick);
}

tick();

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

/** @type {HTMLCanvasElement} */
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const beatDisplay = document.getElementById("beat-display");
const userDisplay = document.getElementById("user-display");

/** @type {Object<string, number>} */
let keyBinds = {};
let inKeybindMode = -1;
let ctrlPressed = false;
document.addEventListener("keydown", (e) => {
  const idx = soundDatas.findIndex(data => data.keyBind === e.key);
  const data = soundDatas[idx];
  if (typeof data !== "undefined") {
    new Audio(`./resources/sounds/${soundDatas[idx].fileName}.mp3`).play();
    emitButtonClick("beat", idx);
  }
  if (e.key === "Control") {
    ctrlPressed = true;
  } else if (inKeybindMode !== -1) {
    const data = soundDatas[inKeybindMode];
    const ele = document.querySelector(`#beat-button-container > div:nth-child(${inKeybindMode+1})`);
    ele.innerText = `${data.displayName} (${e.key})`;
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

/**
 * @typedef DisplayData
 * @property {number} stamp
 * @property {ButtonTypes} type
 * @property {number} idx
 */
/** @type {DisplayData[]} */
let displayDatas = [];
socket.on("update", ({
  type,
  idx,
  count,
  userCount,
  self: isSelf
}) => {
  displayDatas.push({
    stamp: new Date().getTime(),
    type,
    idx
  });
  beatDisplay.innerText = count;
  userDisplay.innerText = userCount;

  if (type === "beat" && !isSelf) {
    new Audio(`./resources/sounds/${soundDatas[idx].fileName}.mp3`).play().catch(e => e);
  }
});

/**
 * @typedef SoundData
 * @property {string} color
 * @property {string} fileName
 * @property {string} displayName
 * @property {string} keyBind
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
];
const beatButtonContainer = document.getElementById("beat-button-container");
for (let i = 0; i < soundDatas.length; i++) {
  const soundData = soundDatas[i];
  const ele = document.createElement("div");
  ele.innerText = `${soundData.displayName} (${soundData.keyBind})`;
  ele.style.backgroundColor = soundData.color;
  ele.addEventListener("click", function() {
    new Audio(`./resources/sounds/${soundData.fileName}.mp3`).play();
    emitButtonClick("beat", i);
    if (ctrlPressed && inKeybindMode === -1) {
      inKeybindMode = i;
      this.innerText = `${soundData.displayName} (?)`;
    }
  });
  beatButtonContainer.appendChild(ele);
}

const emojiLookup = [
  "👋", "😀", "😲", "😍", "🤔",
  "0️⃣", "1️⃣", "2️⃣", "3️⃣", "4️⃣",
  "🛑", "🤦", "👀", "❤️", "🗯"
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
let recivedDispalyRange = 25_000;
function tick() {
  const time = new Date().getTime();
  const { offsetWidth: WIDTH, offsetHeight: HEIGHT } = body;
  
  canvas.width = WIDTH;
  canvas.height = HEIGHT/10;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#666";
  ctx.strokeStyle = "#000";
  ctx.lineWidth = 1;
  ctx.font = "2vh monospace";
  for (let i = 0; i < Math.ceil(recivedDispalyRange/5000)+1; i++) {
    const x = i*canvas.width/Math.ceil(recivedDispalyRange/5000);
    ctx.fillText(`-${i*5}s`, x-ctx.measureText(`-${i*5}s`).width, 20);
    ctx.beginPath();
    ctx.moveTo(x, canvas.height);
    ctx.lineTo(x, 0);
    ctx.stroke();
  }
  
  displayDatas = displayDatas.filter(data => time - data.stamp < 50_000);
  ctx.lineWidth = 3;
  for (let i = 0; i < displayDatas.length; i++) {
    const data = displayDatas[i];
    const diff = time - data.stamp;
    const pos = WIDTH*(diff/recivedDispalyRange);
    if (data.type === "beat") {
      ctx.strokeStyle = soundDatas[data.idx]?.color;
      ctx.beginPath();
      ctx.moveTo(pos, canvas.height);
      ctx.lineTo(pos, 0);
      ctx.stroke();
    } else {
      const emoji = emojiLookup[data.idx];
      ctx.fillText(emoji, pos, ctx.measureText(emoji).actualBoundingBoxAscent);
    }
  }

  requestAnimationFrame(tick);
}

tick();

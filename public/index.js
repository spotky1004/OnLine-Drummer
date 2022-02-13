import io from "./lib/socket.io.esm.min.js";
const socket = io();

/** @type {HTMLCanvasElement} */
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const beatDisplay = document.getElementById("beat-display");

document.addEventListener("keydown", (e) => {
  const key = e.key;
  if (parseInt(key) !== NaN) {
    const idx = parseInt(key);
    if (idx > soundDatas.length || idx === 0) return;
    new Audio(`./resources/sounds/${soundDatas[idx-1].fileName}.mp3`).play();
    socket.emit("buttonClick", idx-1);
  }
})

let count = 0;
/**
 * @typedef DisplayData
 * @property {number} stamp
 * @property {number} soundIdx
 */
/** @type {DisplayData[]} */
let displayDatas = [];
socket.on("update", (data) => {
  displayDatas.push({
    stamp: new Date().getTime(),
    soundIdx: data.sound
  });
  count = data.count;
  beatDisplay.innerText = count;

  if (!data.self) {
    new Audio(`./resources/sounds/${soundDatas[data.sound].fileName}.mp3`).play();
  }
});

/**
 * @typedef SoundData
 * @property {string} color
 * @property {string} fileName
 * @property {string} displayName
 */
/** @type {SoundData[]} */
const soundDatas = [
  {
    fileName: "crash",
    displayName: "Crash",
    color: "#fc7303"
  },
  {
    fileName: "hat",
    displayName: "Hat",
    color: "#ace35f"
  },
  {
    fileName: "kick",
    displayName: "Kick",
    color: "#445263"
  },
  {
    fileName: "openhat",
    displayName: "Openhat",
    color: "#3eab8d"
  },
  {
    fileName: "snare",
    displayName: "Snare",
    color: "#564463"
  },
  {
    fileName: "snare2",
    displayName: "Snare 2",
    color: "#634462"
  },
  {
    fileName: "ride",
    displayName: "Ride",
    color: "#515203"
  }
];
const buttonContainer = document.getElementById("button-container");
for (let i = 0; i < soundDatas.length; i++) {
  const soundData = soundDatas[i];
  const ele = document.createElement("div");
  ele.innerText = `${soundData.displayName} (${i+1})`;
  ele.style.backgroundColor = soundData.color;
  const idx = i;
  ele.addEventListener("click", () => {
    new Audio(`./resources/sounds/${soundData.fileName}.mp3`).play();
    socket.emit("buttonClick", idx);
  });
  buttonContainer.appendChild(ele);
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
  for (let i = 0; i < Math.ceil(recivedDispalyRange/5000); i++) {
    const x = i*canvas.width/Math.ceil(recivedDispalyRange/5000);
    ctx.fillText(`-${i*5}s`, x+5, 10);
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
    ctx.strokeStyle = soundDatas[data.soundIdx]?.color;
    ctx.beginPath();
    ctx.moveTo(pos, canvas.height);
    ctx.lineTo(pos, 0);
    ctx.stroke();
  }

  requestAnimationFrame(tick);
}

tick();

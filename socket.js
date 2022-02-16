const { Server } = require("socket.io");
const crypto = require("crypto");
const getCollection = require("./db.js");

const BUTTON_LIMIT_PER_SEC = 10;

/** @type {Awaited<ReturnType<typeof getCollection>>>} */
let collection;
let count = 0;
getCollection()
  .then(async (_collection) => {
    collection = _collection;
    const doc = await collection.findOne({ _id: "meta" });
    count = doc.count;
  });
/** @type {string[]} */
let userColors = [];
let lastSave = new Date().getTime() + 5000;

module.exports = (server) => {
  const io = new Server(server, {
    path: "/socket.io"
  });

  io.on("connection", (socket) => {
    socket.join("main");

    /** @type {number[]} */
    let buttonClickStamps = [];
    const req = socket.request;
    const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
    const color = "#" + crypto.createHash("sha256").update(ip).digest("hex").slice(-6);
    userColors.push(color);
    socket.on("disconnect", () => {
      socket.leave("main");
      userColors.splice(userColors.findIndex(hex => hex === color), 1);
    });
    socket.on("error", (error) => {
      console.error(error);
    });
    socket.on("buttonClick", ({ type, idx }) => {
      const time = new Date().getTime();
      buttonClickStamps = buttonClickStamps.filter(stamp => time - stamp < 1000);
      if (buttonClickStamps.length > BUTTON_LIMIT_PER_SEC) return;
      buttonClickStamps.push(time);
      if (type === "beat") count++;
      if (time - lastSave > 5000) {
        collection.updateOne(
          { _id: "meta" },
          { $set: { _id: "meta", count } },
          { upsert: true }
        );
        lastSave = time;
      }

      const dataToSend = {
        count,
        type,
        idx,
        userColor: color,
        userColors: [...new Set(userColors)],
      };
      socket.to("main").emit("update", { ...dataToSend, self: false });
      socket.emit("update", { ...dataToSend, self: true });
    });
  });
}

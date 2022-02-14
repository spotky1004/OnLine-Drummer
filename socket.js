const { Server } = require("socket.io");

const BUTTON_LIMIT_PER_SEC = 10;

let count = 0;
let userCount = 0;

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
    console.log("New client connection!", ip, socket.id);
    userCount++;
    socket.on("disconnect", () => {
      socket.leave("main");
      userCount--;
      console.log("Client disconnected", ip, socket.id);
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

      const dataToSend = {
        count,
        type,
        idx,
        userCount,
      };

      socket.to("main").emit("update", { ...dataToSend, self: false });
      socket.emit("update", { ...dataToSend, self: true });
    });
  });
}

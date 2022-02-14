const { Server } = require('socket.io');

let count = 0;
let userCount = 0;

module.exports = (server) => {
  const io = new Server(server, {
    path: "/socket.io"
  });

  io.on("connection", (socket) => {
    socket.join("main");

    let lastSend = new Date().getTime();
    let lastType = null;
    let lastIdx = -1;
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
      if (
        lastType === type &&
        lastIdx === idx &&
        new Date().getTime() - lastSend < 75
      ) return;
      lastSend = new Date().getTime();
      lastType = type;
      lastIdx = idx;
      count++;

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

const { Server } = require('socket.io');

let count = 0;

module.exports = (server) => {
  const io = new Server(server, {
    path: "/socket.io"
  });

  io.on("connection", (socket) => {
    socket.join("main");

    const req = socket.request;
    const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
    console.log("New client connection!", ip, socket.id);
    socket.on("disconnect", () => {
      console.log("Client disconnected", ip, socket.id);
    });
    socket.on("error", (error) => {
      console.error(error);
    });
    socket.on("buttonClick", (buttonIdx) => {
      count++;
      socket.to("main").emit("update", {
        count,
        sound: buttonIdx,
        self: false,
      });
      socket.emit("update", {
        count,
        sound: buttonIdx,
        self: true,
      });
    });
  });
}

const http = require("http");
const { Server } = require("socket.io");
const { app, setSocketIO } = require("./app"); // 👈 cập nhật import

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// 👇 Gắn io vào app
setSocketIO(io);

io.on("connection", (socket) => {
  console.log("🔌 New client connected");

  socket.on("join", (userId) => {
    console.log(`📥 User ${userId} joined room`);
    socket.join(userId);
  });

  socket.on("disconnect", () => {
    console.log("❌ Client disconnected");
  });
});

server.listen(process.env.PORT || 3000, () => {
  console.log(`🚀 Server is running on port ${process.env.PORT || 3000}`);
});

// 🟢 Keep-alive ping chính server
setInterval(() => {
  fetch(`https://souvenirhub-api.onrender.com/api/health`) // thay bằng domain thật
    .then(() => console.log("Pinged self to stay awake"))
    .catch(err => console.error("Ping failed:", err));
}, 1 * 30 * 1000);

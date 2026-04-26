const express = require("express");
const config = require("./config");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http, {
  cors: {
    origin: config.CORS_ORIGIN,
    methods: ["GET", "POST"]
  }
});
const path = require("path");

app.use(express.static(path.join(__dirname, "../public")));

// Quản lý nhiều phòng
let rooms = {}; 
let playerNames = {}; // playerNames[socketId] = playerName
// rooms[roomId] = { board, currentNumber, scores, players: [socketId, ...] }

function generateBoard() {
  let positions = [];
  let numbers = [...Array(100).keys()].map(x => x + 1);
  let used = [];
  
  const BOARD_WIDTH = 750;
  const BOARD_HEIGHT = 750;
  const CIRCLE_RADIUS = 25; // 50px circle / 2
  const MIN_DISTANCE = 110; // khoảng cách tối thiểu giữa các số (đủ cho 50px circle + margin)
  const MAX_ATTEMPTS = 500; // số lần thử tối đa mỗi số
  
  numbers.forEach(num => {
    let positioned = false;
    let attempts = 0;
    
    while (!positioned && attempts < MAX_ATTEMPTS) {
      let x = Math.floor(Math.random() * (BOARD_WIDTH - 50));
      let y = Math.floor(Math.random() * (BOARD_HEIGHT - 50));
      
      // Kiểm tra khoảng cách với các số đã đặt
      let isValid = !used.some(p => {
        const dx = p.x - x;
        const dy = p.y - y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < MIN_DISTANCE;
      });
      
      if (isValid) {
        used.push({ x, y });
        positions.push({ num, x, y, claimedBy: null });
        positioned = true;
      }
      
      attempts++;
    }
    
    // Nếu không thể tìm vị trí sau 500 lần thử, thử lại từ đầu hoặc tìm vị trí an toàn
    if (!positioned) {
      // Thử một lần cuối cùng với khoảng cách lỏng hơn
      for (let attempt = 0; attempt < 100; attempt++) {
        let x = Math.floor(Math.random() * (BOARD_WIDTH - 50));
        let y = Math.floor(Math.random() * (BOARD_HEIGHT - 50));
        
        let isValid = !used.some(p => {
          const dx = p.x - x;
          const dy = p.y - y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          return distance < 80; // Khoảng cách tối thiểu thấp hơn
        });
        
        if (isValid) {
          used.push({ x, y });
          positions.push({ num, x, y, claimedBy: null });
          positioned = true;
          break;
        }
      }
    }
    
    // Nếu vẫn không tìm được, ghi log cảnh báo
    if (!positioned) {
      console.warn(`⚠️ Không thể đặt số ${num} vào board`);
    }
  });
  
  return positions;
}

io.on("connection", (socket) => {
  console.log("Người chơi mới:", socket.id);

  // Người chơi join phòng
  socket.on("joinRoom", (data) => {
    const { roomId, playerName } = data;
    playerNames[socket.id] = playerName;

    if (!rooms[roomId]) {
      // tạo phòng mới
      rooms[roomId] = {
        board: generateBoard(),
        currentNumber: 1,
        scores: {},
        players: []
      };
    }

    let room = rooms[roomId];
    if (room.players.length >= 2) {
      socket.emit("roomFull");
      return;
    }

    socket.join(roomId);
    room.players.push(socket.id);
    room.scores[socket.id] = 0;

    console.log(`${playerName} (${socket.id}) vào phòng ${roomId}`);

    // gửi state cho người mới
    socket.emit("init", {
      board: room.board,
      currentNumber: room.currentNumber,
      scores: room.scores,
      players: room.players
    });

    // cập nhật cho cả phòng
    io.to(roomId).emit("updateScores", room.scores);
    io.to(roomId).emit("playerJoined", {
      socketId: socket.id,
      playerName: playerName,
      players: room.players.map(id => ({ id, name: playerNames[id] }))
    });
  });

  // Khi click số
  socket.on("checkNumber", ({ roomId, num }) => {
    console.log(`📌 Nhận checkNumber: roomId=${roomId}, num=${num}, socketId=${socket.id}`);
    
    let room = rooms[roomId];
    if (!room) {
      console.log(`❌ Phòng ${roomId} không tồn tại`);
      return;
    }

    console.log(`🔍 Kiểm tra: số cần tìm = ${room.currentNumber}, số nhấn = ${num}`);

    if (num === room.currentNumber) {
      console.log(`✅ ĐÚNG! ${playerNames[socket.id]} tìm được số ${num}`);
      room.scores[socket.id]++;
      const cellToMark = room.board.find(p => p.num === num);
      if (cellToMark) {
        cellToMark.claimedBy = socket.id;
      }
      room.currentNumber++;

      if (room.currentNumber > 100) {
        io.to(roomId).emit("gameOver", room.scores);
      } else {
        io.to(roomId).emit("updateBoard", room.board);
        io.to(roomId).emit("updateNumber", room.currentNumber);
        io.to(roomId).emit("updateScores", room.scores);
      }
    } else {
      console.log(`❌ SAI! Cần số ${room.currentNumber}, nhấn số ${num}`);
    }
  });

  // Reset trận
  socket.on("resetGame", (roomId) => {
    let room = rooms[roomId];
    if (!room) return;

    room.board = generateBoard();
    room.currentNumber = 1;
    for (let id of room.players) {
      room.scores[id] = 0;
    }

    io.to(roomId).emit("init", {
      board: room.board,
      currentNumber: room.currentNumber,
      scores: room.scores,
      players: room.players
    });
  });

  // Rời phòng
  socket.on("leaveRoom", (roomId) => {
    let room = rooms[roomId];
    if (!room) return;

    room.players = room.players.filter(p => p !== socket.id);
    delete room.scores[socket.id];
    
    console.log(`${playerNames[socket.id]} rời phòng ${roomId}`);
    
    if (room.players.length === 0) {
      delete rooms[roomId];
    } else {
      io.to(roomId).emit("updateScores", room.scores);
    }
  });

  // Ngắt kết nối
  socket.on("disconnect", () => {
    for (let roomId in rooms) {
      let room = rooms[roomId];
      if (room.players.includes(socket.id)) {
        room.players = room.players.filter(p => p !== socket.id);
        delete room.scores[socket.id];
        
        console.log(`${playerNames[socket.id]} ngắt kết nối từ phòng ${roomId}`);
        
        io.to(roomId).emit("updateScores", room.scores);

        // Nếu phòng trống → xóa
        if (room.players.length === 0) {
          delete rooms[roomId];
        }
      }
    }
    delete playerNames[socket.id];
  });
});

http.listen(config.PORT, () => {
  console.log(`🎮 Server chạy tại http://localhost:${config.PORT}`);
  console.log(`📝 Environment: ${config.NODE_ENV}`);
});

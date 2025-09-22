const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const path = require("path");

app.use(express.static(path.join(__dirname, "public")));

// Quản lý nhiều phòng
let rooms = {}; 
// rooms[roomId] = { board, currentNumber, scores, players }

function generateBoard() {
  let positions = [];
  let numbers = [...Array(100).keys()].map(x => x + 1);
  let used = [];
  numbers.forEach(num => {
    let x, y;
    do {
      x = Math.floor(Math.random() * 550);
      y = Math.floor(Math.random() * 550);
    } while (used.some(p => Math.abs(p.x - x) < 40 && Math.abs(p.y - y) < 40));

    used.push({ x, y });
    positions.push({ num, x, y, claimedBy: null }); // thêm claimedBy
  });
  return positions;
}

io.on("connection", (socket) => {
  console.log("Người chơi mới:", socket.id);

  // Người chơi join phòng
  socket.on("joinRoom", (roomId) => {
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

    // gửi state cho người mới
    socket.emit("init", {
      board: room.board,
      currentNumber: room.currentNumber,
      scores: room.scores,
      players: room.players
    });

    // cập nhật cho cả phòng
    io.to(roomId).emit("updateScores", room.scores);
  });

  // Khi click số
  socket.on("checkNumber", ({ roomId, num }) => {
    let room = rooms[roomId];
    if (!room) return;

    if (num === room.currentNumber) {
      room.scores[socket.id]++;
      room.board.find(p => p.num === num).claimedBy = socket.id;
      room.currentNumber++;

      if (room.currentNumber > 100) {
        io.to(roomId).emit("gameOver", room.scores);
      } else {
        io.to(roomId).emit("updateBoard", room.board);
        io.to(roomId).emit("updateNumber", room.currentNumber);
        io.to(roomId).emit("updateScores", room.scores);
      }
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

  // Ngắt kết nối
  socket.on("disconnect", () => {
    for (let roomId in rooms) {
      let room = rooms[roomId];
      if (room.players.includes(socket.id)) {
        room.players = room.players.filter(p => p !== socket.id);
        delete room.scores[socket.id];
        io.to(roomId).emit("updateScores", room.scores);

        // Nếu phòng trống → xóa
        if (room.players.length === 0) {
          delete rooms[roomId];
        }
      }
    }
  });
});

http.listen(3000, () => console.log("Server chạy tại http://localhost:3000"));

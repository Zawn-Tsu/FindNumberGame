const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

app.use(express.static(__dirname + "/public"));

let currentNumber = 1;
let scores = {};
let board = generateBoard(); // bàn cờ random

// tạo bàn cờ random 100 số
function generateBoard() {
  let positions = [];
  let numbers = [...Array(100).keys()].map(x => x + 1); // 1..100

  // giới hạn toạ độ trong vùng (giả sử 600x600 px)
  let used = [];
  numbers.forEach(num => {
    let x, y;
    do {
      x = Math.floor(Math.random() * 550); // tránh tràn khung
      y = Math.floor(Math.random() * 550);
    } while (used.some(p => Math.abs(p.x - x) < 40 && Math.abs(p.y - y) < 40)); 
    // tránh trùng lặp hoặc chồng lên nhau

    used.push({x, y});
    positions.push({num, x, y});
  });

  return positions;
}

io.on("connection", (socket) => {
  console.log("Người chơi mới:", socket.id);
  scores[socket.id] = 0;

  // gửi bàn cờ + trạng thái hiện tại
  socket.emit("init", { currentNumber, scores, board });

  socket.on("checkNumber", (num) => {
    if (num === currentNumber) {
      scores[socket.id]++;
      currentNumber++;
      if (currentNumber > 100) {
        io.emit("gameOver", scores);
      } else {
        io.emit("updateNumber", currentNumber);
        io.emit("updateScores", scores);
      }
    }
  });

  socket.on("disconnect", () => {
    console.log("Rời:", socket.id);
    delete scores[socket.id];
    io.emit("updateScores", scores);
  });
});

http.listen(3000, () => console.log("Server chạy tại http://localhost:3000"));

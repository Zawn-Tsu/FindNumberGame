const socket = io();
let boardDiv = document.getElementById("board");
let currentDisplay = document.getElementById("currentDisplay");
let scoreBoard = document.getElementById("scores");
let resetBtn = document.getElementById("resetBtn");

let roomId = "room1"; // mặc định phòng 1vs1
socket.emit("joinRoom", roomId);

// init game từ server
socket.on("init", (data) => {
  renderBoard(data.board);
  currentDisplay.innerText = "Đang cần tìm: " + data.currentNumber;
  updateScores(data.scores);
});

socket.on("updateNumber", (num) => {
  currentDisplay.innerText = "Đang cần tìm: " + num;
});

socket.on("updateScores", (scores) => {
  updateScores(scores);
});

socket.on("updateBoard", (board) => {
  renderBoard(board);
});

socket.on("gameOver", (scores) => {
  alert("🎉 Game kết thúc!");
  updateScores(scores);
});

socket.on("roomFull", () => {
  alert("❌ Phòng đã đủ 2 người!");
});

// Reset game
resetBtn.onclick = () => {
  socket.emit("resetGame", roomId);
};

// ====== Helper functions ======
function updateScores(scores) {
  scoreBoard.innerHTML = "<h3>Bảng điểm</h3>";
  for (let id in scores) {
    let p = document.createElement("p");
    p.innerText = id + ": " + scores[id];
    scoreBoard.appendChild(p);
  }
}

function renderBoard(board) {
  boardDiv.innerHTML = "";
  board.forEach(cell => {
    let el = document.createElement("button");
    el.classList.add("cell");
    el.style.left = cell.x + "px";
    el.style.top = cell.y + "px";
    el.innerText = cell.num;

    if (!cell.claimedBy) {
      el.classList.add("unclaimed");
      el.onclick = () => socket.emit("checkNumber", { roomId, num: cell.num });
    } else if (cell.claimedBy === socket.id) {
      el.classList.add("claimedMe");
    } else {
      el.classList.add("claimedOther");
    }

    boardDiv.appendChild(el);
  });
}

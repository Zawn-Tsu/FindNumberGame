const socket = io();
let boardDiv = document.getElementById("board");
let currentNumberDisplay = document.getElementById("currentNumber");
let resetBtn = document.getElementById("resetBtn");
let exitBtn = document.getElementById("exitBtn");
let loginModal = document.getElementById("loginModal");
let gameContainer = document.getElementById("gameContainer");
let loginForm = document.getElementById("loginForm");
let roomCodeDisplay = document.getElementById("roomCodeDisplay");
let playerLeftName = document.getElementById("playerLeftName");
let playerLeftScore = document.getElementById("playerLeftScore");
let playerRightName = document.getElementById("playerRightName");
let playerRightScore = document.getElementById("playerRightScore");

let roomId = null;
let playerName = null;
let mySocketId = null;
let allPlayers = {}; // {socketId: {name, score}}

// Login form submit
loginForm.addEventListener("submit", (e) => {
  e.preventDefault();
  playerName = document.getElementById("playerName").value.trim();
  roomId = document.getElementById("roomCode").value.trim() || "room_" + Math.random().toString(36).substr(2, 9);
  
  if (!playerName) {
    alert("Vui lòng nhập tên!");
    return;
  }
  
  // Hide modal and show game
  loginModal.classList.remove("active");
  gameContainer.style.display = "flex";
  playerLeftName.innerText = playerName;
  playerLeftScore.innerText = "0";
  playerRightName.innerText = "Chờ đối thủ...";
  playerRightScore.innerText = "-";
  roomCodeDisplay.innerText = roomId;
  
  // Join room
  console.log(`🚀 Vào phòng ${roomId} với tên ${playerName}`);
  socket.emit("joinRoom", { roomId, playerName });
});

socket.on("connect", () => {
  mySocketId = socket.id;
});

// init game từ server
socket.on("init", (data) => {
  // Lưu tên của tất cả người chơi
  data.players.forEach(playerId => {
    if (!allPlayers[playerId]) {
      allPlayers[playerId] = { name: playerName, score: 0 };
    }
  });
  
  renderBoard(data.board);
  currentNumberDisplay.innerText = data.currentNumber;
  updatePlayerDisplay(data.scores, data.players);
});

socket.on("updateNumber", (num) => {
  currentNumberDisplay.innerText = num;
});

socket.on("updateScores", (scores) => {
  updatePlayerDisplay(scores);
});

socket.on("playerJoined", (data) => {
  const players = data.players || [];
  players.forEach(p => {
    allPlayers[p.id] = { name: p.name, score: 0 };
  });
  updatePlayerDisplay({}, players);
});

socket.on("updateBoard", (board) => {
  renderBoard(board);
});

socket.on("gameOver", (scores) => {
  alert("🎉 Game kết thúc! Điểm của bạn: " + (scores[socket.id] || 0));
});

socket.on("roomFull", () => {
  alert("❌ Phòng đã đủ 2 người!");
});

// Reset game
resetBtn.onclick = () => {
  socket.emit("resetGame", roomId);
};

// Exit game
exitBtn.onclick = () => {
  socket.emit("leaveRoom", roomId);
  loginModal.classList.add("active");
  gameContainer.style.display = "none";
  loginForm.reset();
};

// ====== Helper functions ======
function updatePlayerDisplay(scores = {}, playersList = null) {
  const players = playersList || Object.keys(allPlayers).map(id => ({ id }));
  
  if (players.length >= 1) {
    const p1 = players[0];
    playerLeftName.innerText = allPlayers[p1.id]?.name || "-";
    playerLeftScore.innerText = scores[p1.id] || 0;
  }
  
  if (players.length >= 2) {
    const p2 = players[1];
    playerRightName.innerText = allPlayers[p2.id]?.name || "-";
    playerRightScore.innerText = scores[p2.id] || 0;
  } else {
    playerRightName.innerText = "Chờ đối thủ...";
    playerRightScore.innerText = "-";
  }
}

function renderBoard(board) {
  boardDiv.innerHTML = "";
  console.log(`🎮 Rendering board với ${board.length} số`);
  
  board.forEach((cell) => {
    let el = document.createElement("button");
    el.classList.add("cell");
    el.style.left = cell.x + "px";
    el.style.top = cell.y + "px";
    el.innerText = cell.num;

    if (!cell.claimedBy) {
      el.classList.add("unclaimed");
      el.onclick = (e) => {
        e.preventDefault();
        console.log(`👆 Click số ${cell.num}, roomId=${roomId}`);
        socket.emit("checkNumber", { roomId, num: cell.num });
      };
    } else if (cell.claimedBy === socket.id) {
      el.classList.add("claimedMe");
      el.disabled = true;
    } else {
      el.classList.add("claimedOther");
      el.disabled = true;
    }

    boardDiv.appendChild(el);
  });
}

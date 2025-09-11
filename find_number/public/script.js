const socket = io();
let boardDiv = document.getElementById("board");
let currentDisplay = document.getElementById("currentDisplay");
let scoreBoard = document.getElementById("scores");

// init game từ server
socket.on("init", (data) => {
  currentDisplay.innerText = "Đang cần tìm: " + data.currentNumber;
  updateScores(data.scores);

  // vẽ bàn cờ theo dữ liệu server gửi
  boardDiv.innerHTML = "";
  data.board.forEach(cell => {
    let btn = document.createElement("button");
    btn.innerText = cell.num;
    btn.style.position = "absolute";
    btn.style.left = cell.x + "px";
    btn.style.top = cell.y + "px";
    btn.onclick = () => socket.emit("checkNumber", cell.num);
    boardDiv.appendChild(btn);
  });
});

socket.on("updateNumber", (num) => {
  currentDisplay.innerText = "Đang cần tìm: " + num;
});

socket.on("updateScores", (scores) => {
  updateScores(scores);
});

socket.on("gameOver", (scores) => {
  alert("Game kết thúc!");
  updateScores(scores);
});

function updateScores(scores) {
  scoreBoard.innerHTML = "";
  for (let id in scores) {
    let p = document.createElement("p");
    p.innerText = id + ": " + scores[id];
    scoreBoard.appendChild(p);
  }
}

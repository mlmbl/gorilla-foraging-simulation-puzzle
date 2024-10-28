const grid = document.getElementById('grid');
const scoreBoard = document.getElementById('score-board');
const tenPointsDisplay = document.getElementById('ten-points');
const fivePointsDisplay = document.getElementById('five-points');
const onePointDisplay = document.getElementById('one-point');
const timerDisplay = document.getElementById('timer');
const messageDisplay = document.getElementById('message');
const startButton = document.getElementById('start-button'); 

let score = 0;
let tenPointCount = 0;
let fivePointCount = 0;
let onePointCount = 0;
let remainingTime = 60;  // 制限時間を100秒に変更
let idleState = false;
let gameInterval;
let previousButton = null; // 前回クリックされたボタンを追跡
let moveCount = 0; // マスを移動した回数


// スタートボタンのクリックでタイル生成とゲーム開始
startButton.addEventListener('click', startGame);

document.getElementById('how-to-play-button').addEventListener('click', function() {
});

function startGame() {
  startButton.disabled = true; // スタートボタンを無効化
  generateGrid(); // タイルを生成して表示

  const randomCell = setInitialPosition(); // 初期位置を設定
  previousButton = randomCell; // 初期位置を追跡
  randomCell.classList.add('clicked'); // 黒枠を設定
  randomCell.classList.add('start'); // 初期位置にstartクラスを追加

  revealTiles(randomCell); // 初期位置とその近傍のセルを表示

  startTimer(); // タイマーを開始
}


function setInitialPosition() {
  const allButtons = Array.from(grid.children);
  const randomIndex = Math.floor(Math.random() * allButtons.length);
  const randomCell = allButtons[randomIndex];
  console.log(`Initial position set: ${randomCell.dataset.index}, Value: ${randomCell.dataset.value}`); // 追加
  return randomCell; // ランダムなセルを返す
}

function generateValues() {
  const values = [
    ...Array(2).fill(10),
    ...Array(8).fill(5),
    ...Array(30).fill(1),
    ...Array(60).fill(0)
  ];

  // 配列をシャッフル
  for (let i = values.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [values[i], values[j]] = [values[j], values[i]];
  }

  return values;
}

// グリッドを生成してタイルを表示する関数
function generateGrid() {
  const allValues = generateValues();
  const nonZeroIndices = allValues
    .map((value, index) => (value > 0 ? index : -1))
    .filter(index => index !== -1);

  // ランダムに表示するインデックスを選択
  const indicesToShow = [];
  while (indicesToShow.length < 10 && nonZeroIndices.length > 0) {
    const randomIndex = Math.floor(Math.random() * nonZeroIndices.length);
    indicesToShow.push(nonZeroIndices[randomIndex]);
    nonZeroIndices.splice(randomIndex, 1); // 選択済みのインデックスを削除
  }

  for (let i = 0; i < 100; i++) {
    const button = document.createElement('button');
    const value = allValues[i];

    button.classList.add('grid-button');
    button.dataset.value = value;
    button.dataset.index = i;
    button.dataset.revealed = 'false';

    // 数値は初期表示しない（空欄にする）
    button.textContent = ''; 

    // 4つのランダムなマスに得点を表示
    if (indicesToShow.includes(i)) {
      button.textContent = value; // 数値を表示
      button.dataset.revealed = "true"; // 表示済みに設定
    }

    button.addEventListener('click', () => handleButtonClick(button));

    if (value === 0) {
      button.classList.add('zero'); // 0点マスは黄緑色
    } else {
      button.classList.add('non-zero'); // 非0点マスはオレンジ色
    }

    grid.appendChild(button);
  }
}


function handleButtonClick(button) {
  console.log(`Button clicked: ${button.dataset.index}, Value: ${button.dataset.value}`); // デバッグ用

 // もぐもぐタイム中は移動不可
  if (idleState) {
    console.log("Cannot move during idle time.");
    return; // 何もしない
  }
    
  // クリックしたマスが同じ場合
  if (previousButton === button) {    console.log("Same button clicked.");
    const value = parseInt(button.dataset.value);
    if (value > 0) {
      console.log("Score collected from the same tile.");
      initiateIdleTime(button, value); // 得点を獲得
    }
    return; // 何もしない
  }

  // 近傍のチェック
  if (!isNeighbor(previousButton, button)) {
      console.log("This tile is out of reach!"); // 移動不可メッセージ
      alert("遠くのマスにワープはできません。"); // 遠くのマスの場合のメッセージ
    return; // 移動できない場合は終了
  }

  if (previousButton) {
      previousButton.classList.remove('clicked'); // 前回の黒枠を解除
      previousButton.classList.add('visited'); // 元いたマスを灰色に設定
  }

  console.log("Arrived at new tile."); // 即移動
  messageDisplay.textContent = ''; // メッセージを消去

  revealTiles(button); // 移動したセルの数値を表示


  moveCount++; // 移動回数を増やす
  updateTravelCost(); // Food intakeを表示更新
  updatePoint(); // ポイントを更新

  previousButton = button; // 現在のボタンを追跡
  button.classList.add('clicked'); // 現在のマスに黒枠を設定

}


function updateTravelCost() {
  document.getElementById('travel-cost').textContent = `Travel cost: ${moveCount}`;
}


function updatePoint() {
  const point = score - moveCount;
  document.getElementById('point').textContent = `Score: ${point}`;
}


function isNeighbor(fromButton, toButton) {
  const fromIndex = parseInt(fromButton.dataset.index);
  const toIndex = parseInt(toButton.dataset.index);

  const fromRow = Math.floor(fromIndex / 10);
  const fromCol = fromIndex % 10;
  const toRow = Math.floor(toIndex / 10);
  const toCol = toIndex % 10;

  // 近傍のセルかどうかをチェック
  return Math.abs(fromRow - toRow) <= 1 && Math.abs(fromCol - toCol) <= 1;
}


function revealTiles(button) {
  const index = parseInt(button.dataset.index);
  const surroundingIndices = getSurroundingIndices(index);

  // クリックしたマスとその近傍の数値を表示
  [index, ...surroundingIndices].forEach(idx => {
    const tile = grid.children[idx];
    if (tile.dataset.revealed === "false") {
      tile.textContent = tile.dataset.value; // 数値を表示
      tile.dataset.revealed = "true"; // 表示済みに設定
    }
  });
}

function getSurroundingIndices(index) {
  const row = Math.floor(index / 10);
  const col = index % 10;

  const indices = [];
  for (let i = row - 1; i <= row + 1; i++) {
    for (let j = col - 1; j <= col + 1; j++) {
      if (i >= 0 && i < 10 && j >= 0 && j < 10) {
        indices.push(i * 10 + j);
      }
    }
  }
  return indices;
}

function startEating(button) {
  const value = parseInt(button.dataset.value);
  initiateIdleTime(button, value);
}

function initiateIdleTime(button, value) {
  // ボタンがすでに得点を獲得したか確認
  if (button.dataset.scored === "true") {
    console.log("This tile has already been scored.");
    return; // すでに得点を獲得した場合は何もしない
  }

  score += value;
  updateScore();

  // フラグを設定
  button.dataset.scored = "true";

  if (value === 10) tenPointCount++;
  if (value === 5) fivePointCount++;
  if (value === 1) onePointCount++;
  updateTileCounts();

  const idleDuration = getIdleDuration(value); // 採食時間を取得
  setIdleState(button, idleDuration);
}


function getIdleDuration(value) {
  switch (value) {
    case 10:
      return 5; // 10点 → 5秒
    case 5:
      return 3; // 5点 → 3秒
    case 1:
      return 1; // 1点 → 1秒
    default:
      return 0;
  }
}


function updateScore() {
    scoreBoard.textContent = `Food intake: ${score}`;
    updatePoint(); // Scoreが更新されたときにPointも更新

}


function updateTileCounts() {
  tenPointsDisplay.textContent = `Food-10: ${tenPointCount}`;
  fivePointsDisplay.textContent = `Food-5: ${fivePointCount}`;
  onePointDisplay.textContent = `Food-1: ${onePointCount}`;
}


function setIdleState(button, duration) {
  idleState = true;
  grid.classList.add('disabled');
  messageDisplay.textContent = '餌ゲット！もぐもぐたいむ...';

  button.classList.add('eaten'); // 食べたマスにeatenクラスを追加

  setTimeout(() => {
    idleState = false;
    grid.classList.remove('disabled');
    button.classList.remove('non-zero');
    button.classList.add('collected');
    messageDisplay.textContent = '';
  }, duration * 1000);
}

function startTimer() {
  gameInterval = setInterval(() => {
    if (remainingTime > 0) {
      remainingTime--;
      timerDisplay.textContent = `Time: ${remainingTime}s`;
    } else {
      clearInterval(gameInterval);
      endGame();
    }
  }, 1000);
}


function endGame() {
  timerDisplay.textContent = 'Time is Over.'; // 残り時間の表示を変更
  document.querySelectorAll('.grid-button').forEach(button => button.disabled = true); // 全てのボタンを無効化

  if (previousButton) {
    previousButton.classList.add('ended'); // タイムアップのクラスを現在のマスのみに追加
    previousButton.classList.remove('clicked'); // 黒枠を解除
  }
}



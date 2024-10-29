const grid = document.getElementById('grid');
const scoreBoard = document.getElementById('score-board');
const timerDisplay = document.getElementById('timer');
const messageDisplay = document.getElementById('message');
const startButton = document.getElementById('start-button');
const stopButton = document.getElementById('stop-button');

let score = 0;
let maxScore = 0;
let remainingTime = 90;  // 制限時間を60秒に変更
let idleState = false;
let gameInterval;
let previousButton = null; // 前回クリックされたボタンを追跡
let moveCount = 0; // マスを移動した回数


// スタートボタンのクリックでタイル生成とゲーム開始
startButton.addEventListener('click', startGame);
stopButton.addEventListener('click', stopGame);


document.getElementById('how-to-play-button').addEventListener('click', function() {
});

function startGame() {
  score = 0;
  maxScore = 0;
  moveCount = 0;

  document.getElementById('point').textContent = 'Score: 0';
  document.getElementById('max-score').textContent = 'Max Score: 0';
  document.getElementById('travel-cost').textContent = 'Travel cost: 0';

    
  startButton.disabled = true; // スタートボタンを無効化
  stopButton.style.display = 'inline';  // Stopボタンを表示
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


function generateSavannaClusters(gridSize = 10, clusterCount = 3, maxSavannaCells = 12) {
  const allSavannaCells = new Set(); // サバンナセルを保存するSet

  // クラスター生成を指定された回数繰り返す
  for (let i = 0; i < clusterCount; i++) {
    const centerRow = Math.floor(Math.random() * gridSize);
    const centerCol = Math.floor(Math.random() * gridSize);

    console.log(`Savanna center ${i + 1}: (${centerRow}, ${centerCol})`);

    const clusterCells = [];

    // 3x3の範囲内でセルを取得（境界外を無視）
    for (let r = centerRow - 1; r <= centerRow + 1; r++) {
      for (let c = centerCol - 1; c <= centerCol + 1; c++) {
        if (r >= 0 && r < gridSize && c >= 0 && c < gridSize) {
          clusterCells.push(r * gridSize + c);
        }
      }
    }

    // クラスター内からランダムに6つのセルを選択
    const shuffledCluster = clusterCells.sort(() => Math.random() - 0.5);
    const selectedCells = shuffledCluster.slice(0, 6);

    // サバンナセルを追加し、上限をチェック
    for (const cell of selectedCells) {
      if (allSavannaCells.size < maxSavannaCells) {
        allSavannaCells.add(cell);
      } else {
        console.log('Max savanna cells reached.');
        return Array.from(allSavannaCells); // 上限に達したら終了
      }
    }
  }

  console.log('All Savanna Cells:', Array.from(allSavannaCells));
  return Array.from(allSavannaCells);
}

function generateTHVLines(gridSize = 10, maxTHVCells = 22, maxLineLength = 5, savannaCells = [], numLines = 5) {
  const thvCells = new Set(); // THVセルのインデックスを保存するSet
  const savannaSet = new Set(savannaCells); // サバンナセルのセット

  for (let i = 0; i < numLines; i++) { // 指定回数だけラインを生成
    if (thvCells.size >= maxTHVCells) break; // 最大セル数に達したら終了

    // ランダムに中心セルを選択（サバンナや既存THVセルを避ける）
    let currentRow, currentCol, index;
    do {
      currentRow = Math.floor(Math.random() * gridSize);
      currentCol = Math.floor(Math.random() * gridSize);
      index = currentRow * gridSize + currentCol;
    } while (savannaSet.has(index) || thvCells.has(index));

    console.log(`THV starting point ${i + 1}: (${currentRow}, ${currentCol})`);

    thvCells.add(index); // 最初のセルを追加

    // ラインの生成
    for (let j = 1; j < maxLineLength; j++) {
      const neighbors = getValidNeighbors(currentRow, currentCol, gridSize, savannaSet, thvCells);

      if (neighbors.length === 0) break; // 有効な隣接セルがない場合終了

      const nextCell = neighbors[Math.floor(Math.random() * neighbors.length)];
      thvCells.add(nextCell.index); // 新しいセルを追加

      // 現在の位置を更新
      currentRow = nextCell.row;
      currentCol = nextCell.col;

      if (thvCells.size >= maxTHVCells) break; // 上限に達したら終了
    }
  }

  console.log('All THV Cells:', Array.from(thvCells));
  return Array.from(thvCells);
}


// 隣接セルの取得関数
function getValidNeighbors(row, col, gridSize, savannaSet, thvCells) {
  const neighbors = [];
  const directions = [
    [-1, 0], // 上
    [1, 0],  // 下
    [0, -1], // 左
    [0, 1]   // 右
  ];

  directions.forEach(([dr, dc]) => {
    const newRow = row + dr;
    const newCol = col + dc;
    if (
      newRow >= 0 && newRow < gridSize &&
      newCol >= 0 && newCol < gridSize
    ) {
      const newIndex = newRow * gridSize + newCol;
      if (!savannaSet.has(newIndex) && !thvCells.has(newIndex)) {
        neighbors.push({ row: newRow, col: newCol, index: newIndex });
      }
    }
  });

  return neighbors;
}


function generateFruitsCells(gridSize = 10, seasonFactor, categoryName, occupiedCells = []) {
  const totalCells = gridSize * gridSize;
  const fruitCells = new Set();
  const occupiedSet = new Set(occupiedCells);

  // 配置するセルの数を決定 (seasonFactorを使ってセル数を調整)
  const maxCells = categoryName === 'small-food-tree' ? 7 : 3;
  const minCells = categoryName === 'small-food-tree' ? 3 : 1;
  const numFruits = Math.floor((maxCells - minCells + 1) * seasonFactor) + minCells;

  while (fruitCells.size < numFruits) {
    const randomIndex = Math.floor(Math.random() * totalCells);

    // サバンナセルを避け、他のセルには上書き可能
    if (!occupiedSet.has(randomIndex)) {
      fruitCells.add(randomIndex);
    }
  }

  console.log(`${categoryName} Cells:`, Array.from(fruitCells));
  return Array.from(fruitCells);
}


function generateValues(gridSize = 10) {
  const totalCells = gridSize * gridSize;
  const values = Array(totalCells).fill(null);

  // サバンナセルの生成
  const savannaCells = generateSavannaClusters(gridSize, 3, 12);
  savannaCells.forEach(index => {
    values[index] = { value: 0, category: 'savanna' };
  });

  // THVセルの生成 (5%が4点、15%が2点、80%が3点)
  const thvCells = generateTHVLines(gridSize, 20, 5, savannaCells, 5);
  const thvCount = thvCells.length;

  const fourPointCount = Math.floor(thvCount * 0.1);
  const twoPointCount = Math.floor(thvCount * 0.25);

  const shuffledThvCells = thvCells.sort(() => Math.random() - 0.5);

  shuffledThvCells.slice(0, fourPointCount).forEach(index => {
    values[index] = { value: 4, category: 'thv-forest' };
  });

  shuffledThvCells.slice(fourPointCount, fourPointCount + twoPointCount).forEach(index => {
    values[index] = { value: 2, category: 'thv-forest' };
  });

  shuffledThvCells.slice(fourPointCount + twoPointCount).forEach(index => {
    values[index] = { value: 3, category: 'thv-forest' };
  });

  // 季節パラメータの導入 (0~1の範囲で変動)
  const seasonFactor = Math.random();

  // Small-Fruitsセルの生成 (5〜10点の範囲)
  const smallFruitsCells = generateFruitsCells(
    gridSize,
    seasonFactor,
    'small-food-tree',
    savannaCells
  );
  smallFruitsCells.forEach(index => {
    const value = Math.floor(Math.random() * 6) + 4; // 4〜9のランダムな値
    values[index] = { value, category: 'small-food-tree' };
  });

  // Large-Fruitsセルの生成 (11〜20点の範囲)
  const largeFruitsCells = generateFruitsCells(
    gridSize,
    seasonFactor,
    'large-food-tree',
    savannaCells
  );
  largeFruitsCells.forEach(index => {
    const value = Math.floor(Math.random() * 8) + 8; // 8〜20のランダムな値
    values[index] = { value, category: 'large-food-tree' };
  });

  // forestセルの生成 (10%が2点、20%が1点、70%が0点)
  const forestCells = values
    .map((_, index) => index)
    .filter(index => values[index] === null);

  const forestCount = forestCells.length;
  const twoPointForestCount = Math.floor(forestCount * 0.2);
  const onePointForestCount = Math.floor(forestCount * 0.3);

  const shuffledForestCells = forestCells.sort(() => Math.random() - 0.5);

  shuffledForestCells.slice(0, twoPointForestCount).forEach(index => {
    values[index] = { value: 2, category: 'forest' };
  });

  shuffledForestCells.slice(twoPointForestCount, twoPointForestCount + onePointForestCount).forEach(index => {
    values[index] = { value: 1, category: 'forest' };
  });

  shuffledForestCells.slice(twoPointForestCount + onePointForestCount).forEach(index => {
    values[index] = { value: 0, category: 'forest' };
  });

  console.log('Generated values:', values); // デバッグ用
  return values;
}



// グリッドを生成してタイルを表示する関数
function generateGrid() {
  console.log('generateGrid called'); // デバッグ用ログ

  const allValues = generateValues(); // 値とカテゴリーのペアを生成

  for (let i = 0; i < 100; i++) {
    const button = document.createElement('button');
    const { value, category } = allValues[i];

    button.classList.add('grid-button', category);
    button.dataset.value = value;
    button.dataset.index = i;
    button.dataset.revealed = 'false'; // 初期状態では非表示

    // サバンナセルは点数を表示しない
    button.textContent = category === 'savanna' ? '' : ''; // 初期状態は非表示

    button.addEventListener('click', () => handleButtonClick(button));
    grid.appendChild(button); // グリッドに追加
  }

  console.log('Grid generation completed'); // 完了ログ
}

// function generateGrid() {
//   console.log('generateGrid called'); // デバッグ用ログ

//   const allValues = generateValues(); // 値とカテゴリーのペアを生成

//   for (let i = 0; i < 100; i++) {
//     const button = document.createElement('button');
//     const { value, category } = allValues[i];

//     button.classList.add('grid-button', category);
//     button.dataset.value = value;
//     button.dataset.index = i;
//     button.dataset.revealed = 'false';

//     // サバンナセルは点数を表示しない
//     button.textContent = category === 'savanna' ? '' : value;

//     button.addEventListener('click', () => handleButtonClick(button));
//     grid.appendChild(button); // グリッドに追加
//   }

//   console.log('Grid generation completed'); // 完了ログ
// }


function handleButtonClick(button) {
  console.log(`Button clicked: ${button.dataset.index}, Value: ${button.dataset.value}`);

   // 採食中かどうかを確認
  if (button.dataset.eating === "true") {
    console.log("This tile is currently being eaten. Click ignored.");
    return; // 採食中のセルはクリックを無視する
  }

  // クリックしたマスが同じ場合
  if (previousButton === button) {
    const value = parseInt(button.dataset.value);
    if (value > 0) {
      console.log("Score collected from the same tile.");
      initiateIdleTime(button, value); // 得点を獲得
    }
    return;
  }

  // 近傍のチェック
  if (!isNeighbor(previousButton, button)) {
    console.log("This tile is out of reach!");
    alert("遠くのマスにワープはできません。");
    return;
  }


// 前のセルでの採食処理を停止
  if (activeIntervalId !== null) {
    console.log("Stopping previous eating process.");
    clearInterval(activeIntervalId);
    activeIntervalId = null;
    if (previousButton) {
      previousButton.dataset.eating = "false"; // 採食フラグを解除
    }
  }
    
  if (previousButton) {
    previousButton.classList.remove('clicked');
    previousButton.classList.add('visited');
  }

  console.log("Arrived at new tile.");
  messageDisplay.textContent = '';

  revealTiles(button);

  moveCount += 2;
  updateTravelCost();
  updatePoint();

  previousButton = button;
  button.classList.add('clicked');
}


function updateTravelCost() {
  document.getElementById('travel-cost').textContent = `Travel cost: ${moveCount}`;
}


function updatePoint() {
  const point = score - moveCount;
  document.getElementById('point').textContent = `Score: ${point}`;

  // Max Scoreの更新
  if (point > maxScore) {
    maxScore = point;
    document.getElementById('max-score').textContent = `Max Score: ${maxScore}`;
  }
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
  const gridSize = 10;

  // 近傍セルのインデックスを取得
  const row = Math.floor(index / gridSize);
  const col = index % gridSize;

  for (let r = row - 1; r <= row + 1; r++) {
    for (let c = col - 1; c <= col + 1; c++) {
      if (r >= 0 && r < gridSize && c >= 0 && c < gridSize) {
        const nearbyIndex = r * gridSize + c;
        const nearbyButton = document.querySelector(`.grid-button[data-index="${nearbyIndex}"]`);

        // 0点セルは表示しない
        if (nearbyButton.dataset.value !== '0') {
          nearbyButton.textContent = nearbyButton.dataset.value;
          nearbyButton.dataset.revealed = 'true';
        }
      }
    }
  }
}

// function revealTiles(button) {
//   const index = parseInt(button.dataset.index);
//   const surroundingIndices = getSurroundingIndices(index);

//   // クリックしたマスとその近傍の数値を表示
//   [index, ...surroundingIndices].forEach(idx => {
//     const tile = grid.children[idx];
//     if (tile.dataset.revealed === "false") {
//       tile.textContent = tile.dataset.value; // 数値を表示
//       tile.dataset.revealed = "true"; // 表示済みに設定
//     }
//   });
// }

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
  // すでに得点を獲得しているかを確認
  if (button.dataset.scored === "true") {
    console.log("This tile has already been scored.");
    return; // 何もしない
  }

  // 採食中かどうかを確認
  if (button.dataset.eating === "true") {
    console.log("This tile is currently being eaten.");
    return; // 何もしない
  }

  // 採食中フラグを設定
  button.dataset.eating = "true";

  const idleDuration = value; // 採食時間を value の半分に設定
  setIdleState(button, idleDuration, value);
}


function updateScore() {
    scoreBoard.textContent = `Food intake: ${score}`;
    updatePoint(); // Scoreが更新されたときにPointも更新

}


let activeIntervalId = null;  // 現在の加算処理のIDを追跡

function setIdleState(button, duration, value) {
  grid.classList.add('disabled');
  messageDisplay.textContent = '食物ゲット！採食中...';

  button.classList.add('eaten'); // 食べたマスにeatenクラスを追加

  let remainingValue = value - 1;  // 初回クリックで1減少
  button.textContent = remainingValue;  // 初回の表示更新
  button.dataset.value = remainingValue;  // dataset も更新

  score += 1;  // スコアを1加算
  updateScore();

  const interval = 1000;  // 1秒ごとに処理

  activeIntervalId = setInterval(() => {
    // 制限時間が切れている場合、すべての処理を停止
    if (remainingTime <= 0) {
      clearInterval(activeIntervalId);
      activeIntervalId = null;
      console.log("Time's up! Stopping all eating processes.");

      // メッセージをリセット
      messageDisplay.textContent = '';  // メッセージを空にする
      button.dataset.eating = "false";  // 採食中フラグを解除
      grid.classList.remove('disabled');
      return;
    }

    if (remainingValue > 0) {
      remainingValue -= 1;  // 1減少
      button.textContent = remainingValue;  // 表示を更新
      button.dataset.value = remainingValue;  // dataset 更新

      score += 1;  // スコアを1加算
      updateScore();
    } else {
      clearInterval(activeIntervalId);  // インターバルを停止
      activeIntervalId = null;

      // 採食中フラグを解除し、UIを更新
      button.textContent = '0';  // 数値を0に設定
      button.dataset.scored = "true";  // 得点獲得済みフラグをセット
      button.dataset.eating = "false";  // 採食中フラグを解除
      grid.classList.remove('disabled');
      messageDisplay.textContent = '';  // メッセージをリセット
    }
  }, interval);
}

// function setIdleState(button, duration, value) {
//   grid.classList.add('disabled');
//   messageDisplay.textContent = '食物ゲット！採食中...';

//   button.classList.add('eaten'); // 食べたマスにeatenクラスを追加

//   let remainingValue = value - 1;  // 初回クリックで1減少
//   button.textContent = remainingValue;  // 初回の表示更新
//   button.dataset.value = remainingValue;  // dataset も更新

//   score += 1;  // スコアを1加算
//   updateScore();

//   const interval = 1000;  // 1秒ごとに処理

//   activeIntervalId = setInterval(() => {
//     // 制限時間が切れている場合、処理を停止
//     if (remainingTime <= 0) {
//       clearInterval(activeIntervalId);
//       activeIntervalId = null;
//       console.log("Time's up! Stopping all eating processes.");
//       return;
//     }

//     if (remainingValue > 0) {
//       remainingValue -= 1;  // 1減少
//       button.textContent = remainingValue;  // 表示を更新
//       button.dataset.value = remainingValue;  // dataset 更新

//       score += 1;  // スコアを1加算
//       updateScore();
//     } else {
//       clearInterval(activeIntervalId);  // インターバルを停止
//       activeIntervalId = null;

//       // 採食中フラグを解除し、UIを更新
//       button.textContent = '0';  // 数値を0に設定
//       button.dataset.scored = "true";  // 得点獲得済みフラグをセット
//       button.dataset.eating = "false";  // 採食中フラグを解除
//       grid.classList.remove('disabled');
//       messageDisplay.textContent = '';
//     }
//   }, interval);
// }


function stopGame() {
  clearInterval(gameInterval);  // タイマーを停止
  endGame();  // ゲームを終了
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
  stopButton.style.display = 'none';  // Stopボタンを隠す

  timerDisplay.textContent = 'Game is Over.'; // 残り時間の表示を変更
  document.querySelectorAll('.grid-button').forEach(button => button.disabled = true); // 全てのボタンを無効化

  if (previousButton) {
    previousButton.classList.add('ended'); // タイムアップのクラスを現在のマスのみに追加
    previousButton.classList.remove('clicked'); // 黒枠を解除
  }
}



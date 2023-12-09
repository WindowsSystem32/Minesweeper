const setFocus = function (on, element) {
  element.parentNode.classList[on? "add" : "remove"]("focus");
};
const settings = function (visibility) {
  document.querySelector("#settings").classList[visibility? "remove" : "add"]("disabled");
  document.querySelector("#generate").classList[visibility? "add" : "remove"]("active");
  Array.from(document.querySelector("#settings").children).forEach(e => {
    e.classList[visibility? "remove" : "add"]("disabled");
    if (e.id == "input-box") Array.from(e.children).forEach(E => {
      if (E.tagName == "INPUT") E.disabled = !visibility;
    });
  });
};
const onChange = function () {
  const clamp = function (selector) {
    const min = document.querySelector(selector).min || 0;
    const max = document.querySelector(selector).max || Infinity;
    const step = document.querySelector(selector).step || 1;
    const val = +document.querySelector(selector).value;
    let fixedVal = Math.round(val);
    if (Number.isNaN(fixedVal)) fixedVal = min;
    if (fixedVal > max) fixedVal = max;
    else if (fixedVal < min) fixedVal = min;
    console.log("min=" + min + ", max=" + max + ", step=" + step + ", val=" + val + ", fixedVal=" + fixedVal);
    if (fixedVal != val) document.querySelector(selector).value = fixedVal;
  }
  clamp("#input-width");
  clamp("#input-height");
  document.querySelector("#input-mineCount").max = document.querySelector("#input-width").value * document.querySelector("#input-height").value - 9
  clamp("#input-mineCount");
};
let board;
const clear = function (width, height) {
  Array.from(document.querySelector("#board").children).forEach(e => document.querySelector("#board").removeChild(e));
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const el = document.createElement("a");
      el.href = "javascript:click(" + x + "," + y + ")";
      const mX = x;
      const mY = y;
      el.oncontextmenu = () => toggleFlag(mX, mY);
      document.querySelector("#board").appendChild(el);
    }
    document.querySelector("#board").appendChild(document.createElement("br"));
  }
};
const fill = function (char) {
  Array.from(document.querySelectorAll("#board a")).forEach((e, i) => {
    e.innerText = char;
  });
};
const init = function (cX = 0, cY = 0, width, height) {
  document.querySelector("#board").classList.add("invisible");
  document.querySelector("#progress-window").classList.remove("invisible");
  let coordsWithoutMines = [];
  for (let offsetY = -1; offsetY <= 1; offsetY++) {
    for (let offsetX = -1; offsetX <= 1; offsetX++) {
      const y = cY + offsetY;
      const x = cX + offsetX;
      if (x < 0 || x >= width || y < 0 || y >= height) continue;
      coordsWithoutMines.push([x, y]);
    }
  }
  board = new Minesweeper(
    document.querySelector("#input-width").value, 
    document.querySelector("#input-height").value, 
    document.querySelector("#input-mineCount").value, 
    coordsWithoutMines
  );
  board.generate();
  board.openTile_Recursive(cX, cY);
  refresh_board();
  document.querySelector("#progress-window").classList.add("invisible");
  document.querySelector("#board").classList.remove("invisible");
};
const generate = function () {
  settings(false);
  const width = document.querySelector("#input-width").value;
  const height = document.querySelector("#input-height").value;
  if (document.querySelector("#board").children.length != width * height) clear(width, height);
  fill("⬜");
  document.querySelector("#settings").classList.add("invisible");
  document.querySelector("#board").classList.remove("invisible");
};
const click = function (x, y) {
  if (!board) {
    init(x, y, document.querySelector("#input-width").value, document.querySelector("#input-height").value);
    return;
  }
  if (board.hasFlag(x, y)) return;
  board.openTile_Recursive(x, y);
  refresh_board(board._gameOver);
  if (board._gameOver) {
    board = null;
    alert("게임 오버!");
  }
};
const refresh_board = function (showMine = false) {
  let resc = showMine
    ? {
      default: (typeOfTile, isShown, mineCount, tile) => {
        if (tile & 0b100) {
          if (tile & 0b001) return "🚩";
          else return "❌";
        }
        if (tile & 0b001) {
          if (tile & 0b010) return "💥";
          else return "💣";
        }
        else {
          if (isShown) {
            switch (mineCount) {
              case 1: 
                return "1️⃣";
              case 2: 
                return "2️⃣";
              case 3: 
                return "3️⃣";
              case 4: 
                return "4️⃣";
              case 5: 
                return "5️⃣";
              case 6: 
                return "6️⃣";
              case 7: 
                return "7️⃣";
              case 8: 
                return "8️⃣";
              default:
                return "🟩";
            }
          } else return "⬜";
        }
      }
    }
    : {
      hidden: "⬜", 
      flag: "🚩", 
      mine: {
        shown: "💥"
      }, 
      tile: {
        shown: mineCount => {
          switch (mineCount) {
            case 1: 
              return "1️⃣";
            case 2: 
              return "2️⃣";
            case 3: 
              return "3️⃣";
            case 4: 
              return "4️⃣";
            case 5: 
              return "5️⃣";
            case 6: 
              return "6️⃣";
            case 7: 
              return "7️⃣";
            case 8: 
              return "8️⃣";
            default:
              return "🟩";
          }
        }
      }
    }
  ;
  let strBoard = board.toString(resc);
  Array.from(document.querySelectorAll("#board a")).forEach((e, i) => {
    const x = i % board._width;
    const y = (i - x) / board._width;
    e.innerText = strBoard[y][x];
  });
};
const toggleFlag = function (x, y) {
  const hasFlag = board.hasFlag(x, y);
  if (!hasFlag && board.getTile(x, y) & 0b010) return;
  board.setFlag(x, y, !hasFlag);
  refresh_board(false);
  return false;
};
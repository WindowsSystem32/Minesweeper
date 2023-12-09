const Minesweeper = function (width, height, mineCount, coordsWithoutMines) {
  const isValidNumber = function (number, min = -Infinity, max = Infinity) {
    return !Number.isNaN(number) && Number.isFinite(number) && Number.isInteger(number) && number >= min && number <= max;
  }
  width = +width;
  if (!isValidNumber(width, 3)) throw new Error("가로 크기는 3 이상의 자연수여야 합니다.");
  this._width = width;
  height = +height;
  if (!isValidNumber(height, 3)) throw new Error("세로 크기는 3 이상의 자연수여야 합니다.");
  this._height = +height;
  mineCount = +mineCount;
  if (!isValidNumber(mineCount, 0, this._width * this._height)) throw new Error("지뢰의 개수는 가로 크기 * 세로 크기 이하의 자연수여야 합니다.");
  this._mineCount = mineCount;
  if (!Array.isArray(coordsWithoutMines)) throw new Error("지뢰 없는 좌표 인자는 배열이어야 합니다.");
  coordsWithoutMines = coordsWithoutMines.map((e, i) => {
      if (typeof e == "string" && e.match(/^\d+, ?\d+$/)) return e.slice(",")[1] * this._width + e.slice(",")[1];
      else if (Array.isArray(e) && e.length == 2 && isValidNumber(e[0], 0, width - 1) && isValidNumber(e[0], 0, height - 1)) return e[1] * this._width + e[0];
      else if (typeof e === "number" && isValidNumber(e, 0, this._width * this._height - 1)) return e;
      else throw new Error("좌표가 잘못되었습니다 (인덱스  " + i + "): " + JSON.stringify(e));
    }, [])
    .filter((e, i, o) => o.indexOf(e) === i)
  ;
  if (coordsWithoutMines.length + this._mineCount > this._width * this._height) throw new Error("지뢰가 있는 칸 수와 지뢰가 없는 칸 수의 총합은 전체 칸수 미만이어야 합니다.");
  this._coordsWithoutMines = coordsWithoutMines;
  this._gameOver = false;
};
Minesweeper.prototype.generate = function () {
  let board = new Array(this._height).fill().map(_ => 
    new Array(this._width).fill(
      0b000
    )
  );
  let availableCoords = board.reduce((c, row, y) => {
    for (let x = 0; x < this._width; x++) {
      const coord = y * this._width + x;
      if (!this._coordsWithoutMines.includes(coord)) c.push(coord);
    }
    return c;
  }, []);
  for (let i = 0; i < this._mineCount; i++) {
    const coord = availableCoords.splice(Math.floor(Math.random() * availableCoords.length), 1);
    const x = coord % this._width;
    const y = (coord - x) / this._width;
    board[y][x] |= 0b001;
  }
  this._board = board;
};
Minesweeper.prototype.getTile = function (x, y) {
  if (x >= this._width || x < 0 || y >= this._height || y < 0) return -1;
  return this._board[y][x];
};
Minesweeper.prototype.setTile = function (x, y, val) {
  if (x >= this._width || x < 0 || y >= this._height || y < 0) return false;
  this._board[y][x] = val;
  return true;
};
Minesweeper.prototype.openTile = function (x, y) {
  const currTile = this.getTile(x, y);
  if (currTile === -1) return [false, false];
  this.setTile(x, y, currTile | 0b010);
  if (currTile & 0b001) {
    this._gameOver = true;
    return [false, true];
  } else {
    this._gameOver = !this._board.reduce((c, row, x) => {
      for (tile of row) {
        if (!(tile & 0b010 || tile & 0b001)) c = true;
      }
      return c;
    }, false);
    return [true, this._gameOver];
  }
};
Minesweeper.prototype.openTile_Recursive = function (x, y) {
  const currTile = this.getTile(x, y);
  this.openTile(x, y);
  if (currTile & 0b001) return [false, currTile != -1];
  if (currTile & 0b010 || this.minesCountNearby(x, y)) return;
  for (let offset of [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 0], [0, 1], [1, -1], [1, 0], [1, 1]]) {
    const targetY = y + offset[0];
    const targetX = x + offset[1];
    if (this.hasFlag(targetX, targetY)) continue;
    this.openTile_Recursive(targetX, targetY);
  }
};
Minesweeper.prototype.hasFlag = function (x, y) {
  const currTile = this.getTile(x, y);
  if (currTile === -1) return false;
  return !!(currTile & 0b100);
};
Minesweeper.prototype.setFlag = function (x, y, flag) {
  return this.setTile(x, y, this.getTile(x, y) & ~0b100 | (!!flag << 2));
};
Minesweeper.prototype.minesCountNearby = function (x, y) {
  let mineCount = 0;
  for (let offsetY = -1; offsetY <= 1; offsetY++) {
    for (let offsetX = -1; offsetX <= 1; offsetX++) {
      if (offsetX == 0 && offsetY == 0) continue;
      const tile = this.getTile(x + offsetX, y + offsetY);
      if (tile !== -1 && tile & 0b01) mineCount++;
    }
  }
  return mineCount;
};
Minesweeper.prototype.toString = function (resource) {
  if (!("_board" in this)) return "";
  return this._board.map((row, y) => 
    row.map((tile, x) => {
      const hasFlag = !!(tile & 0b100);
      const isMine = !!(tile & 0b001);
      const typeOfTile = hasFlag? "flag" : (isMine? "mine" : "tile");
      const isShown = !!(tile & 0b010);
      const visibility = isShown? "shown" : "hidden";
      let mineCount = 0;
      if (!isMine) {
        mineCount = this.minesCountNearby(x, y);
      }
      const getResource = function (obj, key, arg1, arg2, objKey, objArg1, objArg2) {
        if (!(key in obj)) return [false, 0, "Doesn't exist"];
        switch (typeof obj[key]) {
          case "string":
            return [true, obj[key]];
          case "function":
            try {
              if (arg2) {
                return [true, obj[key](arg1, arg2)];
              } else if (arg1) {
                return [true, obj[key](arg1)];
              } else {
                return [true, obj[key]()];
              }
            } catch (e) {
              return [false, e];
            }
          case "object":
            if (!objKey) return [false, 1, "No objKey"];
            return getResource(obj[key], objKey, objArg1, objArg2);
          default:
            return [false, 2, "Unknown type: " + typeof obj[key]];
        }
      };
      let resc = getResource(resource, typeOfTile, isShown, mineCount, visibility, mineCount);
      if (resc[0]) return resc[1];
      resc = getResource(resource, visibility, typeOfTile, mineCount);
      if (resc[0]) return resc[1];
      if (!("default" in resource)) return "⁉️";
      switch (typeof resource.default) {
        case "string":
          return resource.default;
        case "function":
          return resource.default(typeOfTile, isShown, mineCount, tile);
        default:
          return "⁉️";
      }
    })
  );
};
const settings = {
    rows: 10,
    cols: 10,
    mines: 10
}

const boardEle = document.querySelector('#board');
const boardCont = [];
const boardMask = []; //0:Origin; 1:Revealed; 2: Flagged
const boardCellEleList = [];
const boardRowEleList = [];

let gameState = 0; //0: not started; 1: Gaming; 2: Ended;
let timer = undefined;
let flagCount = 0;
let _timeCount = 0;

const minesIndicatorEle = document.querySelector('#minesLeft');
const gamingStatusEle = document.querySelector('#status');
const rowSettingEle = document.querySelector('#rowSetting');
const colSettingEle = document.querySelector('#colSetting');
const mineSettingEle = document.querySelector('#mineSetting');
const possViewEle = document.querySelector('#possView');

let possViewStat = false;
const _mobileTouchTimers = new Object();

const initBoardDisplay = () => {
    _resetTimer();
    boardCellEleList.splice(0);
    for (const rowEle of boardRowEleList) {
        rowEle.remove();
    }
    boardRowEleList.splice(0);
    for (let i = 0; i < settings.rows; i++) {
        const rowEle = document.createElement('div');
        rowEle.classList.add('row');
        boardEle.append(rowEle);
        boardRowEleList[i] = rowEle;
        boardCellEleList[i] = [];
        for (let j = 0; j < settings.cols; j++) {
            const cellEle = document.createElement('div');
            cellEle.classList.add('cell');
            const [currentRow, currentCol] = [i, j];
            if (getDeviceType() == "Desktop") {
                cellEle.onclick = () => revealCell(currentRow, currentCol);
                cellEle.oncontextmenu = () => flagCell(currentRow, currentCol);
                cellEle.ondblclick = () => revealSurroundingCell(currentRow, currentCol);
            } else {
                cellEle.onclick = () => _mobileClick(currentRow, currentCol);
                cellEle.ontouchstart = () => _mobileTouchStartCallback(currentRow, currentCol);
                cellEle.ontouchend = () => _mobileTouchEndCallback(currentRow, currentCol);
            }

            rowEle.append(cellEle);
            boardCellEleList[i][j] = cellEle;
        }
    }
}

const _initBoardArray = () => {
    boardCont.splice(0);
    boardMask.splice(0);
    for (let i = 0; i < settings.rows; i++) {
        boardCont[i] = [];
        boardMask[i] = [];
        for (let j = 0; j < settings.cols; j++) {
            boardCont[i][j] = 0;
            boardMask[i][j] = 0;
        }
    }
    gameState = 0;
    flagCount = 0;
    gamingStatusEle.innerHTML = '就绪';
    minesIndicatorEle.innerHTML = settings.mines;
}

const _isMine = (row, col) => {
    return boardCont[row][col] >= 9;
}

const _setMines = (...firstClickPos) => {
    const allCoords = getAllCoordinates(settings.rows, settings.cols);
    const notAllowed = getAdjacentCoordinates(settings.rows, settings.cols, ...firstClickPos).map(x => JSON.stringify(x));
    notAllowed.push(JSON.stringify(firstClickPos));
    const mineCandidates = allCoords.filter(ele => !notAllowed.includes(JSON.stringify(ele)));
    for (let num of getRandomNumbers(mineCandidates.length, settings.mines)) {
        const [row, col] = mineCandidates[num];
        boardCont[row][col] = 9;
    }
    for (const [row, col] of getAllCoordinates(settings.rows, settings.cols)) {
        if (!_isMine(row, col)) {
            continue;
        }
        for (const [row2, col2] of getAdjacentCoordinates(settings.rows, settings.cols, row, col)) {
            boardCont[row2][col2]++;
        }
    }
}

const revealCell = (row, col, callback = false) => {
    if (gameState !== 0 && gameState !== 1) {
        return;
    }
    if (callback && gameState === 0) {
        return;
    }
    if (possViewStat) {
        exitPossibilityView();
        return;
    }
    if (gameState === 0) {
        _setMines(row, col);
        _startTimer();
        gameState = 1;
        gamingStatusEle.innerHTML = '正常';
    }
    if (boardMask[row][col] !== 0) {
        return;
    }
    boardMask[row][col] = 1;
    _refreshDisplay(row, col);
    if (_isMine(row, col)) {
        return _explode();
    }
    if (boardCont[row][col] === 0) {
        for (const [row2, col2] of getAdjacentCoordinates(settings.rows, settings.cols, row, col)) {
            setTimeout(() => revealCell(row2, col2, callback = true), 20);
        }
    }
    check();
}

const flagCell = (row, col) => {
    if (gameState === 0) {
        revealCell(row, col);
        return;
    }
    if (possViewStat) {
        exitPossibilityView();
        return;
    }
    if (gameState !== 1) {
        return;
    }
    if (boardMask[row][col] === 0) {
        boardMask[row][col] = 2;
        flagCount++;
    } else if (boardMask[row][col] === 2) {
        boardMask[row][col] = 0;
        flagCount--;
    }
    _refreshDisplay(row, col);
}

const revealSurroundingCell = (row, col) => {
    if (possViewStat) {
        exitPossibilityView();
        return;
    }
    if (gameState !== 1) {
        return;
    }
    if (boardMask[row][col] === 1 && _fullflag(row, col)) {
        for (const [row2, col2] of getAdjacentCoordinates(settings.rows, settings.cols, row, col)) {
            revealCell(row2, col2);
        }
    }
}

const _fullflag = (row, col) => {
    if (boardMask[row][col] !== 1) { return false; }
    const cont = boardCont[row][col];
    let flagCount2 = 0;
    for (const [row2, col2] of getAdjacentCoordinates(settings.rows, settings.cols, row, col)) {
        if (boardMask[row2][col2] === 2) {
            flagCount2++;
        }
    }
    return flagCount2 === cont;
}

const unrevealedBlocks = () => {
    const arr = [];
    for (const pos of getAllCoordinates(settings.rows, settings.cols)) {
        if (boardMask[pos[0]][pos[1]] === 0) {
            arr.push(pos);
        }
    }
    return arr;
}
const exposedUnrevealedBlocks = () => {
    const arr = [];
    for (const pos of getAllCoordinates(settings.rows, settings.cols)) {
        if (boardMask[pos[0]][pos[1]] === 0) {
            let exposed = false;
            for (const pos2 of getAdjacentCoordinates(settings.rows, settings.cols, ...pos)) {
                if (boardMask[pos2[0]][pos2[1]] === 1) {
                    exposed = true;
                    break;
                }
            }
            if (exposed) {
                arr.push(pos);
            }
        }
    }
    return arr;
}

const numberBlocks = () => {
    const arr = [];
    for (const pos of getAllCoordinates(settings.rows, settings.cols)) {
        if (boardMask[pos[0]][pos[1]] === 1 && boardCont[pos[0]][pos[1]] >= 1 && !_isMine(...pos)) {
            arr.push(pos);
        }
    }
    return arr;
}

const _mobileClick = (row, col) => {
    if (possViewStat) {
        exitPossibilityView();
        return;
    }
    if (gameState === 0) {
        revealCell(row, col);
        return;
    }
    if (boardMask[row][col] === 1) {
        if (_fullflag(row, col)) revealSurroundingCell(row, col);
    } else {
        flagCell(row, col);
    }
}

const _mobileTouchEvent = (row, col) => {
    if (possViewStat) {
        exitPossibilityView();
        return;
    }
    revealCell(row, col);
}

const _mobileTouchStartCallback = (row, col) => {
    let timer = setTimeout(() => { _mobileTouchEvent(row, col) }, 1500);
    _mobileTouchTimers[JSON.stringify([row, col])] = timer;
}

const _mobileTouchEndCallback = (row, col) => {
    const val = _mobileTouchTimers[JSON.stringify([row, col])];
    if (val !== undefined) {
        clearTimeout(val);
    }
}

const _explode = () => {
    gameState = 2;
    _stopTimer();
    gamingStatusEle.innerHTML = '你炸死了';
    for (const [row, col] of getAllCoordinates(settings.rows, settings.cols)) {
        if (_isMine(row, col)) {
            boardMask[row][col] = 1;
            _refreshDisplay(row, col);
        }
    }
}

const _whetherWin = () => {
    for (const [row, col] of getAllCoordinates(settings.rows, settings.cols)) {
        if (_isMine(row, col)) {
            if (boardMask[row][col] === 1) {
                return false;
            }
        } else {
            if (boardMask[row][col] !== 1) {
                return false;
            }
        }
    }
    return true;
}

const check = () => {
    if (_whetherWin()) {
        gameState = 2;
        _stopTimer();
        gamingStatusEle.innerHTML = '胜利';
    }
}

const _refreshDisplay = (row, col) => {
    const ele = boardCellEleList[row][col];
    if (boardMask[row][col] === 0) {
        ele.innerHTML = '';
        ele.classList.remove('revealed');
        ele.classList.remove('flagged');
    } else if (boardMask[row][col] === 1) {
        ele.classList.add('revealed');
        if (boardCont[row][col] === 0) {
            ele.innerHTML = '';
        } else if (boardCont[row][col] < 9) {
            ele.innerHTML = boardCont[row][col];
        } else {
            ele.innerHTML = ''
            ele.classList.add('mine');
        }
    } else {
        ele.innerHTML = '';
        ele.classList.add('flagged');
    }
    minesIndicatorEle.innerHTML = Math.max(0, settings.mines - flagCount);
}

const _tryMinePlaces = () => {
    const unrevealedBlocksArr = unrevealedBlocks();
    const unrevealedBlocksCount = unrevealedBlocksArr.length;
    const minesLeft = settings.mines - flagCount;
    const legalSituations = [];
    if (minesLeft <= 0 || minesLeft >= unrevealedBlocksCount) {
        return {
            hints: [],
            reason: "总感觉雷的数量对不上😣"
        };
    }
    const possibilities = combination(unrevealedBlocksCount, minesLeft);
    if (!isFinite(possibilities) || possibilities > 5000) {
        return {
            hints: [],
            reason: `没法枚举全部${Math.round(possibilities)}种可能性。试试概率视图？`
        };
    }
    for (const situation of generateCombinations(unrevealedBlocksCount, minesLeft)) {
        const TrialBoard = deepCopy2DArray(boardCont);
        let legalSituation = true;
        for (let i = 0; i < unrevealedBlocksCount; i++) {
            const [row, col] = unrevealedBlocksArr[i];
            TrialBoard[row][col] = 23 * situation[i];
        }
        for (const [row, col] of getAllCoordinates(settings.rows, settings.cols)) {
            if (boardMask[row][col] === 1) {
                let mineCount = 0;
                for (const [row2, col2] of getAdjacentCoordinates(settings.rows, settings.cols, row, col)) {
                    if (TrialBoard[row2][col2] >= 9) mineCount++;
                }
                if (boardCont[row][col] !== mineCount) {
                    legalSituation = false;
                    break;
                }
            }
        }
        if (legalSituation) {
            legalSituations.push(situation);
        }
    }

    const mineSets = [];
    for (const situation of legalSituations) {
        const l = [];
        for (let i = 0; i < unrevealedBlocksCount; i++) {
            if (situation[i]) { l.push(unrevealedBlocksArr[i]); }
        }
        mineSets.push(l);
    }
    return {
        hints: mineSets,
        reason: `尝试全部${Math.round(possibilities)}种可能性，试出来了`
    };
}


const _getHintPlaces = () => {
    const o = {
        minePos: [],
        safePos: [],
        reason: ''
    }
    for (const [row, col] of numberBlocks()) {
        const cont = boardCont[row][col];
        let flagCount2 = 0;
        let blockCount = 0;
        for (const [row2, col2] of getAdjacentCoordinates(settings.rows, settings.cols, row, col)) {
            if (boardMask[row2][col2] >= 2) {
                flagCount2++;
                blockCount++;
            } else if (boardMask[row2][col2] === 0) {
                blockCount++;
            }
        }
        if (blockCount === cont && flagCount2 < cont) {
            for (const [row2, col2] of getAdjacentCoordinates(settings.rows, settings.cols, row, col)) {
                if (boardMask[row2][col2] === 0) {
                    o.minePos.push([row2, col2]);
                }
            }
        } else if (blockCount > cont && flagCount2 === cont) {
            for (const [row2, col2] of getAdjacentCoordinates(settings.rows, settings.cols, row, col)) {
                if (boardMask[row2][col2] === 0) {
                    o.safePos.push([row2, col2]);
                }
            }
        }
    }
    removeDuplicates(o.minePos);
    removeDuplicates(o.safePos);
    return o;
}

const _getHintPlaces2 = () => {
    const o = _tryMinePlaces();
    let unrevealedBlocksArr;
    if (o.hints.length === 0) {
        if (o.reason.length === 0) {
            return {
                minePos: [],
                safePos: [],
                reason: "没有提示😢"
            };
        } else {
            return {
                minePos: [],
                safePos: [],
                reason: o.reason
            };
        }
    } else {
        unrevealedBlocksArr = unrevealedBlocks();
    }

    {
        const Obj2IndMap = mapElementsToIndices(unrevealedBlocksArr);
        const appearTimes = (new Array(unrevealedBlocksArr.length)).fill(0);
        for (const situation of o.hints) {
            for (const pos of situation) {
                appearTimes[Obj2IndMap[JSON.stringify(pos)]]++;
            }
        }
        const out = {
            minePos: [],
            safePos: [],
            reason: ''
        };
        for (let i = 0; i < unrevealedBlocksArr.length; i++) {
            if (appearTimes[i] === 0) {
                out.safePos.push(unrevealedBlocksArr[i]);
            } else if (appearTimes[i] === o.hints.length) {
                out.minePos.push(unrevealedBlocksArr[i]);
            }
        }
        removeDuplicates(out.minePos);
        removeDuplicates(out.safePos);
        if (out.minePos.length || out.safePos.length) {
            out.reason = o.reason;
            return out;
        } else {
            out.reason = `哇塞，你遇到了欢乐${unrevealedBlocksArr.length}选${settings.mines - flagCount}！<br>(等3秒...)`;
            setTimeout(() => {
                for (const pos of unrevealedBlocks()) {
                    if (!_isMine(...pos)) {
                        revealCell(...pos);
                    }
                }
                document.querySelector('#err_help').innerHTML = '帮你选好了，不用谢🥰'
            }, 3000);
            return out;
        }
    }
}

const _startTimer = () => {
    _resetTimer();
    const timerEle = document.querySelector('#timer');
    timer = setInterval(() => {
        _timeCount++;
        let [m, s] = divmod(_timeCount, 60);
        [m, s] = [m + '', s + '']
        while (m.length < 2) { m = '0' + m; }
        while (s.length < 2) { s = '0' + s; }
        timerEle.innerHTML = `${m}:${s}`;
    }, 1000);
}

const _stopTimer = () => {
    if (timer !== undefined) {
        clearInterval(timer);
    }
}

const _resetTimer = () => {
    _stopTimer();
    const timerEle = document.querySelector('#timer');
    timerEle.innerHTML = "00:00"
    _timeCount = 0;
}

const resetCallback = () => {
    _resetTimer();
    possViewEle.checked = false;
    possViewStat = false;

    let new_row = rowSettingEle.value;
    let new_col = colSettingEle.value;
    let new_mines = mineSettingEle.value;

    if (!/^\d+$/.test(new_row)) { alert("行数必须是正整数~"); return; }
    if (!/^\d+$/.test(new_col)) { alert("列数必须是正整数~"); return; }
    if (!/^\d+$/.test(new_col)) { alert("雷数必须是正整数~"); return; }
    let rows = +new_row;
    let cols = +new_col;
    let mines = +new_mines;
    if (!(5 <= rows <= 1000)) { alert("行数不能小于5~"); return; }
    if (!(5 <= cols <= 1000)) { alert("列数不能小于5~"); return; }
    if (mines <= 0) { alert("雷场必须有雷(～￣▽￣)～"); return; }
    if (mines > rows * cols - 9) { alert("这么多雷，放不下＞︿＜"); return; }
    settings.rows = rows;
    settings.cols = cols;
    settings.mines = mines;
    rowSettingEle.value = rows;
    colSettingEle.value = cols;
    mineSettingEle.value = mines;

    initBoardDisplay();
    _initBoardArray();
}

document.querySelector('#reset').addEventListener('click', resetCallback);

document.querySelector('#template_easy').addEventListener('click', () => {
    rowSettingEle.value = 9;
    colSettingEle.value = 9;
    mineSettingEle.value = 10;
    if (gameState === 0) {
        resetCallback();
    }
})

document.querySelector('#template_moderate').addEventListener('click', () => {
    rowSettingEle.value = 16;
    colSettingEle.value = 16;
    mineSettingEle.value = 40;
    if (gameState === 0) {
        resetCallback();
    }
})

document.querySelector('#template_difficult').addEventListener('click', () => {
    rowSettingEle.value = 30;
    colSettingEle.value = 16;
    mineSettingEle.value = 99;
    if (gameState === 0) {
        resetCallback();
    }
})

document.querySelector('#template_difficult_2').addEventListener('click', () => {
    rowSettingEle.value = 16;
    colSettingEle.value = 30;
    mineSettingEle.value = 99;
    if (gameState === 0) {
        resetCallback();
    }
})

const helpCallback = () => {
    const err_help = document.querySelector('#err_help');
    err_help.innerHTML = '';
    if (gameState === 0) {
        err_help.innerHTML = "点击面板开始游戏(●'◡'●)"
        return;
    } else if (gameState === 2) {
        err_help.innerHTML = "请点击重置按钮😊"
        return;
    } else if (possViewStat) {
        err_help.innerHTML = "点击面板退出概率视图"
        return;
    } else {
        const hints = _getHintPlaces();
        for (const [row, col] of hints.minePos) {
            flagCell(row, col);
        }
        for (const [row, col] of hints.safePos) {
            revealCell(row, col);
        }
        err_help.innerHTML = hints.reason;
        if (hints.minePos.length === 0 && hints.safePos.length === 0) {
            const trial = _getHintPlaces2();
            err_help.innerHTML = trial.reason;
            for (const [row, col] of trial.minePos) {
                flagCell(row, col);
            }
            for (const [row, col] of trial.safePos) {
                revealCell(row, col);
            }
        }
    }
}

document.querySelector('#help').addEventListener('click', helpCallback);
document.addEventListener('keydown', (e) => { if (e.key.toLowerCase() === 'h') { helpCallback() } })

const deviceIconCallback = () => {
    if (getDeviceType() == "Mobile") {
        for (const ele of document.querySelectorAll('.device_type')) {
            ele.innerHTML = '📱'
        }
    } else {
        for (const ele of document.querySelectorAll('.device_type')) {
            ele.innerHTML = '💻'
        }
    }
}

setTimeout(deviceIconCallback, 0);
setInterval(deviceIconCallback, 3141);

const obtainPossibilities = () => {
    const possGrid = [];
    for (let i = 0; i < settings.rows; i++) possGrid.push(new Array(settings.cols).fill(0));

    if (gameState === 2) {
        for (const [row, col] of getAllCoordinates(settings.rows, settings.cols)) {
            if (_isMine(row, col)) possGrid[row][col] = 1;
        }
        return possGrid;
    }

    const numberedBlocks = [];
    const exposedBlockRecord = new Set();
    const numberedBlocksNeighborCount = new Object();
    for (const [row, col] of getAllCoordinates(settings.rows, settings.cols)) {
        if (boardMask[row][col] === 2) {
            possGrid[row][col] = 1;
        }
    }

    for (const [row, col] of numberBlocks()) {
        let neighbors_count = 0;
        for (const [row2, col2] of getAdjacentCoordinates(settings.rows, settings.cols, row, col)) {
            if (boardMask[row2][col2] === 0) {
                neighbors_count++;
                exposedBlockRecord.add(JSON.stringify([row2, col2]));
            }
        }
        if (neighbors_count) {
            numberedBlocks.push([row, col]);
            numberedBlocksNeighborCount[JSON.stringify([row, col])] = neighbors_count;
        }
    }

    let max_delta = 0;
    for (let loopTime = 1000; loopTime; loopTime--) {
        max_delta = 0;
        for (const [row, col] of numberedBlocks) {
            const num = boardCont[row][col];
            const neighbors = getAdjacentCoordinates(settings.rows, settings.cols, row, col);
            let sum = 0;
            for (const [row2, col2] of neighbors) {
                sum += possGrid[row2][col2];
            }
            let diff = (sum - num) / numberedBlocksNeighborCount[JSON.stringify([row, col])];
            max_delta = Math.max(max_delta, Math.abs(diff));
            for (const [row2, col2] of neighbors) {
                if (boardMask[row2][col2] === 0) {
                    possGrid[row2][col2] -= diff;
                }
            }
        }
        if (max_delta < 0.001) {
            break;
        }
    }
    if (max_delta < 0.005) {
        let mineCount = 0;
        for (const [row, col] of getAllCoordinates(settings.rows, settings.cols)) {
            mineCount += possGrid[row][col];
        }
        let mineleftover = settings.mines - mineCount;

        const unexposedBlocks = [];
        for (const [row, col] of unrevealedBlocks()) {
            if (!exposedBlockRecord.has(JSON.stringify([row, col]))) {
                unexposedBlocks.push([row, col]);
            }
        }
        for (const [row, col] of unexposedBlocks) {
            possGrid[row][col] += mineleftover / unexposedBlocks.length;
        }
        return possGrid;
    }
    return _obtainPossibilities_IncludingFlags();
}

const _obtainPossibilities_IncludingFlags = () => {
    const possGrid = [];
    for (let i = 0; i < settings.rows; i++) possGrid.push(new Array(settings.cols).fill(0));
    const numberedBlocks = numberBlocks();
    const exposedBlockRecord = new Set(exposedUnrevealedBlocks().map(x => JSON.stringify(x)));
    const numberedBlocksNeighborCount = new Object();

    for (const [row, col] of numberedBlocks) {
        let neighbors_count = 0;
        for (const [row2, col2] of getAdjacentCoordinates(settings.rows, settings.cols, row, col)) {
            if (boardMask[row2][col2] !== 1) neighbors_count++;
        }
        numberedBlocksNeighborCount[JSON.stringify([row, col])] = neighbors_count;
    }

    let max_delta = 0;
    for (let loopTime = 1000; loopTime; loopTime--) {
        max_delta = 0;
        for (const [row, col] of numberedBlocks) {
            const num = boardCont[row][col];
            const neighbors = getAdjacentCoordinates(settings.rows, settings.cols, row, col);
            let sum = 0;
            for (const [row2, col2] of neighbors) {
                sum += possGrid[row2][col2];
            }
            let diff = (sum - num) / numberedBlocksNeighborCount[JSON.stringify([row, col])];
            max_delta = Math.max(max_delta, Math.abs(diff));
            for (const [row2, col2] of neighbors) {
                if (boardMask[row2][col2] !== 1) {
                    possGrid[row2][col2] -= diff;
                }
            }
        }
        if (max_delta < 0.001) {
            break;
        }
    }
    if (true) {
        let mineCount = 0;
        for (const [row, col] of getAllCoordinates(settings.rows, settings.cols)) {
            mineCount += possGrid[row][col];
        }
        let mineleftover = settings.mines - mineCount;

        const unexposedBlocks = [];
        for (const [row, col] of unrevealedBlocks()) {
            if (!exposedBlockRecord.has(JSON.stringify([row, col]))) {
                unexposedBlocks.push([row, col]);
            }
        }
        for (const [row, col] of unexposedBlocks) {
            possGrid[row][col] += mineleftover / unexposedBlocks.length;
        }
        return possGrid;
    }
}

const enterPossibilityView = () => {
    possViewEle.checked = true;
    possViewStat = true;
    const possGrid = obtainPossibilities();
    for (const [row, col] of getAllCoordinates(settings.rows, settings.cols)) {
        if (boardMask[row][col] !== 1) {
            const ele = boardCellEleList[row][col];
            const poss = Math.max(0, Math.min(1, possGrid[row][col]));
            ele.style.backgroundColor = `rgb(${70 + Math.round(90 * poss)}, ${160 - Math.round(90 * poss)}, 128)`;
            ele.innerHTML = Math.max(0, Math.min(99, Math.floor(poss * 100)));
            if (ele.innerHTML.length < 2) {
                ele.innerHTML = '0' + ele.innerHTML;
            }
        }
    }
}

const exitPossibilityView = () => {
    possViewEle.checked = false;
    possViewStat = false;
    for (const [row, col] of getAllCoordinates(settings.rows, settings.cols)) {
        boardCellEleList[row][col].style.backgroundColor = '';
        if (boardMask[row][col] !== 1) {
            boardCellEleList[row][col].innerHTML = '';
        }
    }

}

possViewEle.addEventListener('change', () => {
    if (possViewEle.checked) {
        enterPossibilityView();
    } else {
        exitPossibilityView();
    }
})

document.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'p') {
        if (possViewEle.checked) {
            exitPossibilityView();
        } else {
            enterPossibilityView();
        }
    } else if (e.key.toLowerCase() === 'r') {
        resetCallback();
    }
})

resetCallback();
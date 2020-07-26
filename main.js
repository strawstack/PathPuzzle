const fs = require('fs');

//
// Helper functions
//

const getLetters = () => {
    // Return hex digits 1 to E
    let letters = [];
    for (let i = 1; i < 15; i++) {
        const hex = i.toString(16).toUpperCase();
        letters.push(hex);
    }
    return letters;
};

const getGrid = (ROWS, COLS, letters) => {
    // Return grid of hex digits
    // Size ROWS x COLS
    let grid = [];
    for (let r = 0; r < ROWS; r++) {
        let row = [];
        for (let c = 0; c < COLS; c++) {
            const hex = letters[
                Math.floor(
                    Math.random() * letters.length
                )
            ];
            row.push(hex);
        }
        grid.push(row);
    }
    return grid;
};

const print = grid => {
    // Print the grid
    for (let row of grid) {
        console.log("|" + row.join("|") + "|");
    }
};

const print_path = (path, grid) => {
    // Print the correct path
    for (let c of path) {
        console.log(`r: ${c.r}, c: ${c.c}, l: ${grid[c.r][c.c]}`);
    }
};

const getWaypoints = (ROWS, COLS) => {
    // Pick random number in every second column
    let waypoints = [];
    const NUM_POINTS = Math.ceil(COLS/2);
    for (let w = 0; w < NUM_POINTS; w++) {
        waypoints.push({
            r: Math.floor(Math.random() * ROWS),
            c: 2 * w
        });
    }
    return waypoints;
};

const _last = lst => {
    // Get last element of list
    return lst[lst.length - 1];
};

const _equal = (a, b) => {
    // Check if a and b cells are equal
    return a.r === b.r && a.c === b.c;
};

const getPath = waypoints => {
    // Calculate path
    let path = [waypoints[0]];
    while (!_equal(_last(path), _last(waypoints))) {
        // The current waypoint to look for
        const curpoint = _last(path);
        const wp = Math.floor(curpoint.c / 2); // Target waypoint
        const waypoint = waypoints[wp];

        if (_equal(curpoint, waypoint)) {
            path.push({
                r: curpoint.r,
                c: curpoint.c + 1
            });
            path.push({
                r: curpoint.r,
                c: curpoint.c + 2
            });
        } else {
            const dir = waypoint.r - curpoint.r;
            path.push({
                r: curpoint.r + ((dir > 0)? 1 : -1),
                c: curpoint.c
            });
        }
    }
    return path;
};

const hexToBin = hex => {
    // Hex letter to bin list
    let i = parseInt(hex, 16);
    let mask = 8;
    let bin = [false, false, false, false];
    let index = 0;
    while (mask !== 0) {
        let value = i & mask;
        bin[index] = (value > 0)? true : false;
        index += 1;
        mask = mask >> 1;
    }
    return bin;
};

const randomCorrectNumber = hex => {
    // Compatible number given hex letter
    const bin = hexToBin(hex);
    let ans = [false, false, false, false];
    for (let i = 0; i < bin.length; i++) {
        if (!bin[i]) {
            ans[i] = (Math.random() > 0.5)? true : false;
        }
    }
    return ans;
};

const randomWrongNumber = hex => {
    // Conflicting number given hex letter
    const bin = hexToBin(hex);
    let ans = [false, false, false, false];
    for (let i = 0; i < bin.length; i++) {
        if (!bin[i]) {
            ans[i] = (Math.random() > 0.5)? true : false;
        }
    }
    let ones = [];
    for (let i = 0; i < bin.length; i++) {
        if (bin[i]) {
            ones.push(i);
        }
    }
    if (ones.length > 0) {
        // Random index
        let ri = ones[Math.floor(Math.random() * ones.length)];
        ans[ri] = true;
    }
    return ans;
};

const binToHex = bin => {
    // binary list to hex letter
    let total = 0;
    for (let i = 0; i < bin.length; i++) {
        if (bin[i]) {
            total += Math.pow(2, 3 - i);
        }
    }
    return total.toString(16).toUpperCase();
};

const copyGrid = grid => {
    // Create deep copy of grid
    let cgrid = [];
    for (let row of grid) {
        cgrid.push(row.slice());
    }
    return cgrid;
};

const makeCorrect = (path, grid) => {
    // Make numbers in path correct
    let _grid = copyGrid(grid);
    let prev = undefined;
    for (let c of path) {
        if (prev === undefined) {
            prev = c;
        } else {
            const next = binToHex(
                randomCorrectNumber(
                    _grid[prev.r][prev.c]
                )
            );
            _grid[c.r][c.c] = next;
            prev = c;
        }
    }
    return _grid;
};

const _bounds = (grid, tar) => {
    // Return true if tar in bounds
    const ROWS = grid.length;
    const COLS = grid[0].length;
    return tar.r >= 0 && tar.r < ROWS && tar.c >= 0 && tar.c < COLS;
};

const _inPath = (tar, path) => {
    // Is tar in path
    for (let c of path) {
        if (_equal(c, tar)) {
            return true;
        }
    }
    return false;
};

const makeAdjWrong = (path, grid) => {
    // Make number adj to path conflict
    let _grid = copyGrid(grid);
    const adj = [{r:-1,c:0}, {r:0,c:1}, {r:1,c:0}, {r:0,c:-1}];
    for (let i = 0; i < path.length - 1; i++) {
        let cur = path[i];
        let next = path[i + 1];
        const dir = { r: next.r - cur.r, c: next.c - cur.c };
        for (let a of adj) {
            let tar = {
                r: cur.r + a.r,
                c: cur.c + a.c
            };
            if (!_inPath(tar, path) && _bounds(grid, tar)) {
                _grid[tar.r][tar.c] = binToHex(
                    randomWrongNumber(
                        _grid[cur.r][cur.c]
                    )
                );
            }
        }
    }
    return _grid;
};

const packageResult = (result, info) => {
    return {
        "result": result,
        "info": info
    };
};

const checkAnswer = (ans, path, grid) => {
    // Returns {result:,info:}
    // result is "Correct", "Incorrect", "Invalid"
    // Info is number of correct characters or reason for invalid
    const al = ans.length;
    const pl = path.length;
    if (al !== pl) {
        return packageResult(
            "Invalid",
            (al < pl)? "answer is too short" : "answer is too long"
        );
    }

    let letters = "123456789ABCDE";
    for (let a of ans) {
        if (letters.indexOf(a) === -1) {
            return packageResult(
                "Invalid",
                "answer contains invalid characters"
            );
        }
    }

    let total = 0;
    for (let i = 0; i < path.length; i++) {
        const p = path[i];
        const t = grid[p.r][p.c];
        if (t === ans[i]) {
            total += 1;
        } else {
            break;
        }
    }

    if (total === path.length) {
        return packageResult(
            "Correct",
            "You got it! The puzzle has been reset"
        );
    }

    let explain = "Try looking at bit patterns";
    if (total === 1) {
        explain = "The first character was correct";

    } else if (total > 1) {
        explain = `The first ${total} characters are correct: ${ans.substr(0, total)}`;

    }

    return packageResult(
        "Incorrect",
        explain
    );
};

const getNewPuzzle = () => {
    // Return a new puzzle {grid:,start:,end:}
    // Puzzle 2D list of hex digits
    const ROWS = 6;
    const COLS = 13; // Must be odd
    const letters = getLetters();
    const grid = getGrid(ROWS, COLS, letters);
    const waypoints = getWaypoints(ROWS, COLS);
    const path = getPath(waypoints);
    const grid_correct = makeCorrect(path, grid);
    const grid_final = makeAdjWrong(path, grid_correct);
    return {
        grid: grid_final,
        start: path[0],
        end: _last(path)
    };
};

const randomExample = length => {
    // Random string of characters of correct length
    let letters = "123456789ABCDE";
    let example = [];
    for (let i = 0; i < length; i++) {
        example.push(
            letters[Math.floor(Math.random() * letters.length)]
        );
    }
    return example.join("");
};

const _compatible = (a, b, grid) => {
    const n1 = parseInt(grid[a.r][a.c], 16);
    const n2 = parseInt(grid[b.r][b.c], 16);
    return (n1 & n2) === 0;
};

const _hash = v => {
    return `${v.r}:${v.c}`;
};

const _hexToBinStr = hex => {
    const bin = hexToBin(hex);
    return bin.map(e => (e)? "1":"0").join("");
};

const calculateAnswer = puzzleData => {
    // Return answer as path given data
    const adj = [{r:-1,c:0}, {r:0,c:1}, {r:1,c:0}, {r:0,c:-1}];
    const grid = puzzleData.grid;
    const start = puzzleData.start;
    const end = puzzleData.end;
    // DFS (but it's only really needed if I allowed 0's and F's)
    let visited = {};
    let parent = {};
    let q = [start];
    while (q.length > 0) {
        let next = q.pop();
        const h = _hash(next);
        if (h in visited) continue;
        visited[h] = true;
        for (let a of adj) {
            const tar = {
                r: next.r + a.r,
                c: next.c + a.c
            };
            const ht = _hash(tar);
            if (_bounds(grid, tar)) {
                if (_compatible(next, tar, grid)) {
                    if (!(ht in visited)) {
                        q.push(tar);
                        parent[ht] = next;
                    }
                }
            }
        }
    }
    let path = [];
    let next = end;
    while (_hash(next) in parent) {
        path.push(next);
        next = parent[_hash(next)];
    }
    path.push(next); // The start element
    return path.reverse();
};

const formatPuzzle = (path, grid) => {
    let _grid = copyGrid(grid);
    let s = path[0];
    let e = _last(path);
    _grid[s.r][s.c] = `**${_grid[s.r][s.c]}**`;
    _grid[e.r][e.c] = `**${_grid[e.r][e.c]}**`;
    let COLS = _grid[0].length;
    let emptyRow = [];
    for (let i = 0; i < COLS + 1; i++) {
        emptyRow.push("|");
    }
    let emptyRowStr = emptyRow.join(" ");
    let fillRowStr = emptyRowStr.split(" ").join("-");
    let out = [];
    out.push(emptyRowStr);
    out.push(fillRowStr);
    for (let row of _grid) {
        out.push(`|${row.join("|")}|`);
    }
    out.push(emptyRowStr);
    return out.join("\n") + "\n";
};

const storePuzzle = puzzleData => {
    // Write puzzle data to file
    const FILENAME = "./puzzledata.json";
    fs.writeFileSync(
        FILENAME,
        JSON.stringify(puzzleData, null, 2)
    );
};

const updateReadme = data => {
    // Generate new readme
    const TEMPLATE = "./README_TEMPLATE.md";
    const README = "./README.md";
    let template = fs.readFileSync(TEMPLATE, 'utf8');

    for (let key in data) {
        const value = data[key];
        template = template.replace(`{{${key}}}`, value);
    }

    fs.writeFileSync(
        README,
        template
    );
};

const getCurrentPuzzle = () => {
    try {
        const FILENAME = "./puzzledata.json";
        const data = fs.readFileSync(FILENAME);
        return JSON.parse(data);
    } catch {
        return getNewPuzzle();
    }
};

//
// Main
//

// Constants
const title = process.env.TITLE;
const user = process.env.USER;
try {
    answer = title.split("|")[1];
} catch {
    answer = "incorrect"; // will fail below
}

// Debug Constants
/*
const title = "Puzzle|F34EA68";
const user = "strawstack";
let answer;
try {
    answer = title.split("|")[1];
} catch {
    answer = "incorrect"; // will fail below
} */

// Check current answer
const puzzleData = getCurrentPuzzle();
const path = calculateAnswer(puzzleData);
const result = checkAnswer(answer, path, puzzleData.grid);

// React to result
if (result.result === "Correct") {
    const puzzleData = getNewPuzzle();
    storePuzzle(puzzleData);
    const path = calculateAnswer(puzzleData);
    updateReadme({
        PUZZLE: formatPuzzle(path, puzzleData.grid),
        LENGTH: path.length,
        EXAMPLE: randomExample(path.length),
        USERNAME: user,
        RESULT: result.result,
        INFO: result.info
    });

} else { // "Incorrect" or "Invalid"
    storePuzzle(puzzleData);
    updateReadme({
        PUZZLE: formatPuzzle(path, puzzleData.grid),
        LENGTH: path.length,
        EXAMPLE: randomExample(path.length),
        USERNAME: user,
        RESULT: result.result,
        INFO: result.info
    });
}

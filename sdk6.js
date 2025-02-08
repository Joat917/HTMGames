function randint(a, b) {
    return Math.floor(a + (b - a) * Math.random());
}

function shuffle(arr) {
    let l = arr.length;
    let i = -1;
    while (++i < l) {
        let rand = randint(i, l);
        let val = arr[rand];
        arr[rand] = arr[i];
        arr[i] = val;
    }
    return arr
}

function arrayInclude(arr, val) {
    for (let i of arr) {
        if (i == val) {
            return true;
        }
    }
    return false;
}

class NoSolution extends Error { };
class SolutionFound extends Error { };

class TwoDArray {
    constructor(height, width, data = [], defl = 0) {
        this.height = height;
        this.width = width;
        this.data = [];
        if (data.length < this.height) {
            for (let i = 0; i < height; ++i) {
                let t = [];
                for (let j = 0; j < width; ++j) {
                    if (defl instanceof Array) {
                        t.push(defl.filter(() => true));
                    } else { t.push(defl); }
                }
                this.data.push(t);
            }
        }
        else {
            for (let i = 0; i < height; ++i) {
                let t = [];
                for (let j = 0; j < width; ++j) {
                    t.push(data[i][j]);
                }
                this.data.push(t);
            }
        }
    }

    copy() {
        return new TwoDArray(this.height, this.width, this.data);
    }

    get(place) {
        return this.data[place[1]][place[0]];
    }

    set(place, value) {
        this.data[place[1]][place[0]] = value;
    }
}

class Soduku {
    constructor() {
        this.data = new TwoDArray(9, 9);
        this.poss = new TwoDArray(9, 9, [], []);
    }

    _showConsole() {
        let o = ''
        for (let h = 0; h < 9; h++) {
            o += this.data.data[h].join(' ') + '\n';
        }
        console.log(o);
    }

    *blocks() {
        for (let y = 0; y < 9; ++y) {
            for (let x = 0; x < 9; ++x) {
                yield [x, y];
            }
        }
    }

    *soleGroups() {
        for (let y = 0; y < 9; ++y) {
            let t = [];
            for (let i = 0; i < 9; ++i) {
                t.push([i, y]);
            }
            yield t;
        }
        for (let x = 0; x < 9; ++x) {
            let t = [];
            for (let i = 0; i < 9; ++i) {
                t.push([x, i]);
            }
            yield t;
        }
        for (let y = 0; y < 3; y++) {
            for (let x = 0; x < 3; x++) {
                let t = []
                for (let i = 0; i < 9; i++) {
                    t.push([3 * x + i % 3, Math.floor(3 * y + i / 3)])
                }
                yield t;
            }
        }
    }

    *blockConcerned(place) {
        for (let y = 0; y < 9; ++y) {
            yield [place[0], y];
        }
        for (let x = 0; x < 9; ++x) {
            yield [x, place[1]];
        }
        let ox = Math.floor(place[0] / 3) * 3;
        let oy = Math.floor(place[1] / 3) * 3;
        for (let y = 0; y < 3; ++y) {
            if (oy + y == place[1]) { continue; }
            for (let x = 0; x < 3; ++x) {
                if (ox + x == place[0]) { continue; }
                yield [ox + x, oy + y];
            }
        }
    }

    legal() {
        for (let l of this.soleGroups()) {
            let h = [];
            for (let t of l) {
                let v = this.data.get(t);
                if (v) {
                    if (arrayInclude(h, v)) {
                        return false;
                    } else {
                        h.push(v);
                    }
                }
            }
        }
        return true;
    }

    copy() {
        let o = new Soduku();
        o.data = this.data.copy();
        o.poss = this.poss.copy();
        return o;
    }

    complete() {
        if (!this.legal()) {
            return false;
        }
        for (let t of this.blocks()) {
            if (!this.data.get(t)) {
                return false;
            }
        }
        return true;
    }

    _fillinit() {
        let o = [];
        while (o.length < 11) {
            let t = [randint(0, 9), randint(0, 9)];
            let repeated = false;
            for (let i of o) {
                if (i[0] == t[0] && i[1] == t[1]) {
                    repeated = true;
                    break;
                }
            }
            if (!repeated) {
                o.push(t);
            }
        }
        for (let t of o) {
            let a = [1, 2, 3, 4, 5, 6, 7, 8, 9];
            a = shuffle(a);
            this.data.set(t, a.pop());
            while (!this.legal()) {
                this.data.set(t, a.pop());
                if (!a.length) {
                    this.clear();
                    return this._fillinit();
                }
            }
        }
    }

    _fillall() {
        let ss = new SodukuSolver(this, 1);
        ss.solve();
        if (!ss.solutions.length) {
            throw new NoSolution('Need to regenerate');
        }
        this.data = ss.solutions[0].data;
    }

    _fillhole() {
        let l = Array.from(this.blocks());
        l = shuffle(l);
        while (l.length) {
            let t = l.pop();
            let v = this.data.get(t);
            this.data.set(t, 0);
            let ss = new SodukuSolver(this, 2);
            ss.solve();
            if (ss.solutions.length >= 2) {
                this.data.set(t, v);
            } else if (ss.solutions.length == 0) {
                throw new NoSolution('No Solution? Y?');
            }
        }
    }

    generate() {
        while (true) {
            try {
                this._fillinit()
                this._fillall()
                this._fillhole()
                return this;
            } catch (err) {
                console.dir(err);
            }
        }
    }

    hintBlocks(blocks) {
        let l = [];
        this.clearErrNote();
        if (blocks instanceof Array) {
            l = blocks;
        } else {
            for (let b of blocks) {
                l.push(b);
            }
        }
        for (let p of this.blocks()) {
            let n = grid.get(p);
            let j = false;
            for (let b of l) {
                if (p[0] == b[0] && p[1] == b[1]) {
                    j = true;
                    break;
                }
            }
            if (j) {
                if (!n.classList.contains('nodeStressed1')) {
                    n.classList.add('nodeStressed1');
                }
            } else {
                if (n.classList.contains('nodeStressed1')) {
                    n.classList.remove('nodeStressed1');
                }
            }
        }
    }

    clearErrNote() {
        for (let p of this.blocks()) {
            let n = grid.get(p);
            if (n.classList.contains('nodeStressed2')) {
                n.classList.remove('nodeStressed2');
            }
        }
    }
}


class SodukuSolver extends Soduku {
    constructor(s, maxSolutions = 1) {
        super();
        this.maxSolutions = maxSolutions;
        this.data = s.data.copy();
        this.operations = [];
        this.solutions = [];
    }

    get(place) {
        return this.data.get(place);
    }

    set(place, value) {
        this.operations.push([place, this.data.get(place)]);
        this.data.set(place, value);
        this.refreshPoss(place);
    }

    undo(til = undefined) {
        if (til === undefined) {
            let tv = this.operations.pop();
            this.data.set(tv[0], tv[1]);
        } else {
            while (this.operations.length > til) {
                let tv = this.operations.pop();
                this.data.set(tv[0], tv[1]);
            }
        }
    }

    defPoss() {
        this.poss = new TwoDArray(9, 9, [], undefined);
        for (let t of this.blocks()) {
            if (this.get(t) == 0) {
                this.poss.set(t, [1, 2, 3, 4, 5, 6, 7, 8, 9]);
            }
        }
        for (let l of this.soleGroups()) {
            let occ = [];
            for (let t of l) {
                if (this.get(t)) {
                    occ.push(this.get(t));
                }
            }
            for (let t of l) {
                if (!this.get(t)) {
                    for (let i of occ) {
                        if (this.poss.get(t) && arrayInclude(this.poss.get(t), i)) {
                            this.poss.set(t, this.poss.get(t).filter((item) => (item != i)));
                        }
                    }
                }
            }
        }
    }

    refreshPoss(t0) {
        let v = this.get(t0);
        for (let t of this.blockConcerned(t0)) {
            if (!this.get(t)) {
                if (this.poss.get(t) && arrayInclude(this.poss.get(t), v)) {
                    this.poss.set(t, this.poss.get(t).filter((item) => (item != v)));
                }
            } else {
                this.poss.set(t, undefined);
            }
        }
    }

    fillCertain() {
        let out = false;
        let pls = [];
        for (let _k of this.blocks()) {
            let _v = this.poss.get(_k);
            if (_v) {
                pls.push([_k, _v]);
            }
        }
        pls.sort((a, b) => (a[1].length - b[1].length))
        if (!pls.length) {
            if (!this.legal()) {
                throw new NoSolution();
            }
            return;
        }
        while (pls.length && pls[0][1].length <= 1) {
            if (!pls[0][1].length) {
                throw new NoSolution();
            }
            let t = pls[0][0];
            let v = pls[0][1][0];
            this.set(t, v);
            this.poss.set(t, undefined);
            pls.shift();
            out = true;
        }
        for (let l of this.soleGroups()) {
            let o = [];
            for (let t of l) {
                let _v = this.poss.get(t);
                if (_v) {
                    o = o.concat(_v);
                }
            }
            for (let i in [1, 2, 3, 4, 5, 6, 7, 8, 9]) {
                if (o.filter((item) => (item == i)).length == 1) {
                    for (let t of l) {
                        if (this.poss.get(t) && arrayInclude(this.poss.get(t), i)) {
                            this.set(t, i);
                            this.poss.set(t, undefined);
                            out = true;
                            break;
                        }
                    }
                }
            }
        }
        return out;
    }

    solve(_r = false) {
        if (!_r) {
            try {
                this.defPoss();
                return this.solve(true);
            } catch (err) {
                if (err instanceof NoSolution || err instanceof SolutionFound)
                    return;
                else
                    throw err;
            }
        }
        if (!this.legal()) {
            throw new NoSolution();
        }
        while (this.fillCertain()) { }
        if (this.complete()) {
            this.solutions.push(this.copy())
            if (this.maxSolutions > 0 && this.solutions.length >= this.maxSolutions) {
                throw new SolutionFound();
            } else {
                throw new NoSolution();
            }
        }
        let pls = [];
        for (let _k of this.blocks()) {
            let _v = this.poss.get(_k);
            if (_v) {
                pls.push([_k, _v]);
            }
        }
        pls.sort((a, b) => (a[1].length - b[1].length));
        let N = this.operations.length;
        let p = pls[0][0];
        let l = pls[0][1];
        l = Array.from(l);
        shuffle(l);
        for (let i of l) {
            try {
                this.set(p, i);
                this.solve(true);
            } catch (err) {
                if (err instanceof NoSolution) { }
                else { throw err; }
            }
            this.undo(N);
            this.defPoss();
        }
    }

    call() {
        this.solve();
        return this
    }
}

function bodyAppend(lisArr) {
    let c = document.createElement('div');
    c.classList.add('container');
    for (let ele of lisArr) {
        c.append(ele);
    }
    document.body.append(c);
}

let x0 = () => setTimeout(() => { console.log(Date.toString()); }, 1000);

let z = (() => {
    document.addEventListener('contextmenu', (e) => { e.preventDefault(); });
    document.addEventListener('keydown', (e) => { e.preventDefault(); });
    setInterval(() => {
        let t0 = Date.now();
        x0();
        if (Date.now() - t0 >= 50) {
            window.location.replace('about:blank');
        }
    }, 161);
})();

(() => {
    for (let ele of document.body.children) {
        if (ele.tagName !== 'SCRIPT') {
            ele.remove();
        }
    }
    // let ele = document.createElement('div');
    // ele.classList.add('preWarning')
    // ele.innerText = 'Wait Patiently for a second...';
    // document.body.append(ele);
    eval('x@@$@=(@@)=@@@>@@@{@@@d@@eb@@u@@@@@@@@0@0@@e@@@r@@@@}@'.replaceAll('@', []).replaceAll(0, 'g').replaceAll('$', 0));
})();

const title = (() => {
    let title = document.createElement("div");
    let ct = document.createTextNode("Soduku");
    title.appendChild(ct);
    title.style.fontSize = '48px';
    title.style.margin = '12px';
    bodyAppend([title]);
    return title;
})()

const buttons = (() => {
    let type = 'button'
    let pause = document.createElement(type);
    pause.classList.add('button');
    pause.innerText = 'Pause';
    let reset = document.createElement(type);
    reset.classList.add('button');
    reset.innerText = 'Reset';
    let hint = document.createElement(type);
    hint.classList.add('button');
    hint.innerText = 'Hint';
    let demo = document.createElement(type);
    demo.classList.add('button');
    demo.innerText = 'Demo';
    bodyAppend([pause, reset, hint, demo]);
    return {
        pause: pause,
        reset: reset,
        hint: hint,
        demo: demo
    };
})()


const grid = (() => {
    let grid = document.createElement("div");
    grid.classList.add('map');
    let out = new TwoDArray(9, 9);
    for (let gy = 0; gy < 3; ++gy) {
        for (let gx = 0; gx < 3; ++gx) {
            let group = document.createElement('div');
            group.classList.add('nodeGroup');
            for (let cy = 0; cy < 3; ++cy) {
                for (let cx = 0; cx < 3; ++cx) {
                    let x = 3 * gx + cx;
                    let y = 3 * gy + cy;
                    let t = document.createElement("div");
                    t.id = `node(col${x},row${y})`;
                    t.classList.add('node');
                    group.append(t);
                    out.set([x, y], t);
                }
            }
            grid.append(group);
            if (gx == 0 || gx == 1) {
                let sp = document.createElement("div");
                sp.classList.add('nodeSeperator1');
                grid.append(sp);
            }
        }
        if (gy == 0 || gy == 1) {
            let sp = document.createElement("div");
            sp.classList.add('nodeSeperator2');
            grid.append(sp);
        }
    }
    bodyAppend([grid]);
    return out
})();

const _subgrid = ((grid) => {
    for (let y = 0; y < 9; ++y) {
        for (let x = 0; x < 9; ++x) {
            let node = grid.get([x, y]);
            let t0 = document.createElement("div");
            t0.classList.add('nodeText');
            node.append(t0)
            for (let i = 1; i <= 9; ++i) {
                let t = document.createElement("div");
                t.classList.add('subNode');
                t.classList.add(`subNode${i}`);
                t.innerHTML = '' + i;
                node.append(t);
            }
            // grid.set([x, y], node);
        }
    }
    return grid;
})(grid)



const promptDisplayer = (() => {
    let ele = document.createElement('div');
    let ct = document.createTextNode('New Game.');
    ele.appendChild(ct);
    bodyAppend([ele]);
    return ele;
})();


const keyBoard = (() => {
    let board = document.createElement('div');
    board.classList.add('keyboard');
    let grid = new TwoDArray(3, 6);
    for (let row of [0, 1, 2]) {
        for (let col of [0, 1, 2, 3, 4, 5]) {
            let key = document.createElement('button');
            key.classList.add('keybutton');
            let ct = document.createTextNode(``);
            key.appendChild(ct);
            key.disabled = 'disabled';
            board.append(key);
            grid.set([col, row], key);
        }
    };

    for (let i = 0; i < 9; i++) {
        let n = i + 1;
        let ele = grid.get([i % 3, Math.floor(i / 3)]);
        ele.innerText = n;
        ele.onclick = () => { g.keyInput(+n) };
        ele.disabled = '';
    }

    {
        let ele = grid.get([4, 0]);
        let mid = document.createElement('div');
        mid.style.padding = '4px 6px';
        mid.style.backgroundColor = 'transparent';
        let fig = document.createElement('div');
        fig.classList.add('triangleUp');
        mid.append(fig);
        ele.append(mid);
        ele.onclick = () => { g.arrowMove('ArrowUp'); }
        ele.disabled = '';
    }
    {
        let ele = grid.get([3, 1]);
        let mid = document.createElement('div');
        mid.style.padding = '4px 6px';
        mid.style.backgroundColor = 'transparent';
        let fig = document.createElement('div');
        fig.classList.add('triangleLeft');
        mid.append(fig);
        ele.append(mid);
        ele.onclick = () => { g.arrowMove('ArrowLeft'); }
        ele.disabled = '';
    }
    {
        let ele = grid.get([5, 1]);
        let mid = document.createElement('div');
        mid.style.padding = '4px 6px';
        mid.style.backgroundColor = 'transparent';
        let fig = document.createElement('div');
        fig.classList.add('triangleRight');
        mid.append(fig);
        ele.append(mid);
        ele.onclick = () => { g.arrowMove('ArrowRight'); }
        ele.disabled = '';
    }
    {
        let ele = grid.get([4, 2]);
        let mid = document.createElement('div');
        mid.style.padding = '4px 6px';
        mid.style.backgroundColor = 'transparent';
        let fig = document.createElement('div');
        fig.classList.add('triangleDown');
        mid.append(fig);
        ele.append(mid);
        ele.onclick = () => { g.arrowMove('ArrowDown'); }
        ele.disabled = '';
    }
    {
        let ele = grid.get([5, 0]);
        ele.innerText = 'Back\nSpace';
        ele.style.fontSize = '10px';
        ele.style.lineHeight = '10px';
        ele.style.paddingTop = '8px';
        ele.onclick = () => { g._keyDownFunc({ code: 'Backspace' }) };
        ele.disabled = '';
    }
    {
        let ele = grid.get([3, 0]);
        ele.innerText = 'Delete';
        ele.style.fontSize = '10px';
        ele.onclick = () => { g._keyDownFunc({ code: 'Delete' }) };
        ele.disabled = '';
    }
    grid.get([4, 1]).style.opacity = '0';
    grid.get([3, 2]).style.opacity = '0';
    grid.get([5, 2]).style.opacity = '0';
    bodyAppend([board]);
    return {
        board: board,
        grid: grid
    };
})()

function setText(place, num, italic = false, bold = false) {
    let node = grid.get(place).querySelector('.nodeText');
    let text = '';
    if (num == 0) {
        text = ' ';
        if (node.style.opacity !== '0') {
            node.style.opacity = '0';
        }
    } else {
        text = '' + num;
        if (node.style.opacity !== '') {
            node.style.opacity = '';
        }
        if (italic) {
            if (node.style.fontStyle !== 'italic') {
                node.style.fontStyle = 'italic';
            }
            if (node.style.fontWeight !== '') {
                node.style.fontWeight = '';
            }
        } else if (bold) {
            if (node.style.fontStyle !== '') {
                node.style.fontStyle = '';
            }
            if (node.style.fontWeight !== 'bold') {
                node.style.fontWeight = 'bold';
            }
        } else {
            if (node.style.fontStyle !== '') {
                node.style.fontStyle = '';
            }
            if (node.style.fontWeight !== '') {
                node.style.fontWeight = '';
            }
        }
    }
    if (node.innerHTML != text) {
        node.innerHTML = text;
    }
}

function setSmallNum(place, nums) {
    let node = grid.get(place);
    for (let i = 1; i <= 9; ++i) {
        let subNode = node.querySelector(`.subNode${i}`);
        if (arrayInclude(nums, i)) {
            if (subNode.style.opacity !== '') {
                subNode.style.opacity = '';
            }
        } else {
            if (subNode.style.opacity !== '0') {
                subNode.style.opacity = '0';
            }
        }
    }
}

function display(s) {
    for (let y = 0; y < 9; ++y) {
        for (let x = 0; x < 9; ++x) {
            let v = s.data.get([x, y]);
            setText([x, y], v, false, true);
            if (!v) {
                let poss = s.poss.get([x, y]);
                if (poss.length == 1) {
                    setText([x, y], poss[0], true);
                    setSmallNum([x, y], []);
                } else {
                    setSmallNum([x, y], s.poss.get([x, y]));
                }

            }
            else { setSmallNum([x, y], []); }
        }
    }
}

class SodukuDetailedSolver extends SodukuSolver {
    constructor(s) {
        super(s, 1);
        let r = new SodukuSolver(s, 1);
        r.solve()
        this.answer = r.solutions[0];
        this.selected = undefined;
        this.originalOccupied = [];//to mark the originals
        for (let p of this.blocks()) {
            if (s.data.get(p)) {
                this.originalOccupied.push(p);
            }
        }
        this.interrupt = () => { };
    }

    setSelected() {
        if (this.selected === undefined) {
            for (let p of this.blocks()) {
                let n = grid.get(p);
                if (n.classList.contains('nodeSelected')) {
                    n.classList.remove('nodeSelected');
                }
            }
        } else {
            for (let p of this.blocks()) {
                let n = grid.get(p);
                if (p[0] == this.selected[0] && p[1] == this.selected[1]) {
                    if (!n.classList.contains('nodeSelected')) {
                        n.classList.add('nodeSelected');
                    }
                } else {
                    if (n.classList.contains('nodeSelected')) {
                        n.classList.remove('nodeSelected');
                    }
                }
            }
        }
    }

    hint_solePlace(prompt, center, blocks) {
        promptDisplayer.innerText = prompt;
        this.selected = center;
        this.setSelected();
        this.hintBlocks(blocks);
    }

    hint_soleNumber(prompt, center) {
        promptDisplayer.innerText = prompt;
        this.selected = center;
        let a = [];
        for (let p of this.blockConcerned(center)) {
            if (this.data.get(p)) {
                a.push(p)
            }
        }
        this.setSelected();
        this.hintBlocks(a);

    }

    hint_general(prompt, center) {
        promptDisplayer.innerText = prompt;
        this.selected = center;
        this.setSelected();
        this.hintBlocks([]);
    }

    *fillCertain() {
        let out = false;
        let pls = [];
        for (let _k of this.blocks()) {
            let _v = this.poss.get(_k);
            if (_v) {
                pls.push([_k, _v]);
            }
        }
        pls.sort((a, b) => (a[1].length - b[1].length))
        if (!pls.length) {
            return;
        }
        while (pls.length && pls[0][1].length <= 1) {
            if (!pls[0][1].length) {
                throw new NoSolution();
            }
            let t = pls[0][0];
            let v = pls[0][1][0];
            this.set(t, v);
            this.hint_soleNumber(`Only ${v} is allowed here (row#${t[1]+1}, col#${t[0] + 1})`, t);
            yield;
            this.display();
            this.poss.set(t, undefined);
            pls.shift();
            out = true;
        }
        for (let l of this.soleGroups()) {
            let o = [];
            for (let t of l) {
                let _v = this.poss.get(t);
                if (_v) {
                    o = o.concat(_v);
                }
            }
            for (let i in [1, 2, 3, 4, 5, 6, 7, 8, 9]) {
                if (o.filter((item) => (item == i)).length == 1) {
                    for (let t of l) {
                        if (this.poss.get(t) && arrayInclude(this.poss.get(t), i)) {
                            this.set(t, i);
                            this.hint_solePlace(`Here (row#${t[1] + 1}, col#${t[0] + 1}) is the only place for ${i}。`, t, l);
                            yield;
                            this.display();
                            this.poss.set(t, undefined);
                            out = true;
                            break;
                        }
                    }
                }
            }
        }
        return out;
    }

    *guess() {
        let pls = [];
        for (let _k of this.blocks()) {
            let _v = this.poss.get(_k);
            if (_v) {
                pls.push([_k, _v]);
            }
        }
        pls.sort((a, b) => (a[1].length - b[1].length))
        if (!pls.length) {
            return;
        }
        let [p, l] = pls[0];
        this.set(p, this.answer.data.get(p));
        this.hint_general(`[${l.join('/')}] are allowed for (row#${p[1] + 1}, col#${p[0] + 1}), 
            but only ${this.answer.data.get(p)} is allowed after trying all these opts. `, p);
        yield;
        this.display();
        return;
    }

    *_call() {
        while (true) {
            while (true) {
                let fc = this.fillCertain();
                let v = fc.next();
                while (!v.done) {
                    yield;
                    v = fc.next();
                }
                if (!v.value) {
                    break;
                }
            }
            if (this.complete()) {
                promptDisplayer.innerText = 'Click again to exit'
                yield;
                return this;
            }
            {
                let gc = this.guess();
                let v = gc.next();
                while (!v.done) {
                    yield;
                    v = gc.next();
                }
            }
        }
    }

    call(callback) {
        this.defPoss();
        this.display();
        this.interrupt = () => { m.removeEventListener('mousedown', f); };
        let b = false;
        let m = document.querySelector('.map');
        let c = this._call();
        let f = (e) => {
            if (e.button == 0) {
                let v = c.next();
                if (v.done) {
                    m.removeEventListener('mousedown', f);
                    this.interrupt = () => { };
                    callback();
                    return;
                }
            }
        }
        m.addEventListener('mousedown', f);
    }

    display() {
        for (let p of this.blocks()) {
            let v = this.data.get(p);
            let beOrigin = false;
            for (let op of this.originalOccupied) {
                if (op[0] == p[0] && op[1] == p[1]) {
                    beOrigin = true;
                    break;
                }
            }
            if (beOrigin) {
                setText(p, v, false, true);
            } else {
                setText(p, v, true);
            }

            if (!v) {
                setSmallNum(p, this.poss.get(p));
            } else {
                setSmallNum(p, []);
            }
        }
    }
}

class Game extends Soduku {
    constructor() {
        super();
        this.initialized = false;
        this.victory = false;
        this.frozen = false;
        this.selected = undefined;
        this._initialize();
        display(this);
        for (let _p of this.blocks()) {
            let p2 = [_p[0], _p[1]];
            Object.freeze(p2);
            grid.get(p2).onclick = () => { this.select(p2); }
        }
        document.addEventListener('keydown', this.keyDownFunc());
    }

    _initialize() {
        if (!this.initialized) {
            this.generate();
            this.initialized = true;
        }
    }

    clear() {
        this.data = new TwoDArray(9, 9);
        this.poss = new TwoDArray(9, 9, [], []);
        this.initialized = false;
        this.victory = false;
        this.frozen = false;
        this.selected = undefined;
        this._initialize();
        this.setSelected();
        this.hintBlocks([]);
        display(this);
        buttons.hint.disabled = '';
        buttons.demo.disabled = '';
        buttons.pause.disabled = '';
        document.querySelector('.map').style.opacity = '';
        promptDisplayer.innerText = 'New Game.'
    }

    select(place) {
        if (this.frozen) { return; }
        if (this.selected !== undefined && place[0] == this.selected[0] && place[1] == this.selected[1]) {
            this.selected = undefined;
        } else {
            this.selected = [place[0], place[1]];
        }
        this.setSelected();
    }

    keyInput(num) {
        if (!this.frozen && !this.victory && this.selected !== undefined) {
            let _poss = this.poss.get(this.selected);
            if (arrayInclude(_poss, +num)) {
                this.poss.set(this.selected, _poss.filter((ele) => (ele != +num)));
            } else {
                _poss.push(+num);
            }
            display(this);
        }
    }

    keyDownFunc() {
        let sf = this;
        this._keyDownFunc = (e) => {
            if (sf.frozen) { return; }
            if (e.code.slice(0, 5) == 'Digit' && +e.code.slice(5) >= 1 && +e.code.slice(5) <= 9) {
                sf.keyInput(+e.code.slice(5));
            } else if (e.code.slice(0, 5) == 'Arrow') {
                sf.arrowMove(e.code);
            } else if (e.code == 'Delete') {
                if (!this.frozen && !this.victory && this.selected !== undefined && this.poss.get(this.selected).length) {
                    sf.keyInput(this.poss.get(this.selected)[0]);
                }
            } else if (e.code == 'Backspace') {
                if (!this.frozen && !this.victory && this.selected !== undefined && this.poss.get(this.selected).length) {
                    sf.keyInput(this.poss.get(this.selected)[this.poss.get(this.selected).length - 1]);
                }
            }
        }
        return this._keyDownFunc
    }

    arrowMove(arrow) {
        if (this.frozen) { return; }
        if (this.victory || this.selected === undefined) {
            return;
        }
        if (arrow == 'ArrowUp') {
            this.selected[1] -= 1;
            if (this.selected[1] < 0) { this.selected[1] = 0; }
        } else if (arrow == 'ArrowDown') {
            this.selected[1] += 1;
            if (this.selected[1] >= 9) { this.selected[1] = 8; }
        } else if (arrow == 'ArrowLeft') {
            this.selected[0] -= 1;
            if (this.selected[0] < 0) { this.selected[0] = 0; }
        } else if (arrow == 'ArrowRight') {
            this.selected[0] += 1;
            if (this.selected[0] >= 9) { this.selected[0] = 8; }
        }
        this.setSelected();
    }

    setSelected() {
        if (this.frozen) { return; }
        if (this.selected === undefined) {
            for (let p of this.blocks()) {
                let n = grid.get(p);
                if (n.classList.contains('nodeSelected')) {
                    n.classList.remove('nodeSelected');
                }
            }
            this.hintBlocks([]);
        } else {
            for (let p of this.blocks()) {
                let n = grid.get(p);
                if (p[0] == this.selected[0] && p[1] == this.selected[1]) {
                    if (!n.classList.contains('nodeSelected')) {
                        n.classList.add('nodeSelected');
                    }
                } else {
                    if (n.classList.contains('nodeSelected')) {
                        n.classList.remove('nodeSelected');
                    }
                }
            }
            this.hintBlocks(this.blockConcerned(this.selected));
        }

    }

    isVictory() {
        if (this.victory) {
            return true;
        }
        let s2 = this.copy();
        for (let p of this.blocks()) {
            if (this.data.get(p) == 0 && this.poss.get(p).length == 1) {
                s2.data.set(p, this.poss.get(p)[0]);
            }
        }
        let out = s2.complete();
        if (out) {
            this.victory = true;
        }
        return out;
    }

    enterDemo() {
        this.frozen = true;
        this.detailedSolver = new SodukuDetailedSolver(this);
        buttons.hint.disabled = 'disabled';
        buttons.demo.disabled = 'disabled';
        buttons.pause.disabled = 'disabled';
        let sf = this;
        this.detailedSolver.call(() => sf.exitDemo(sf));
        promptDisplayer.innerText = "Demo Mode: Click anywhere to fill in the blank.";
    }

    exitDemo(self) {
        self.frozen = false;
        self.clear();
    }
}

class SodukuHint extends SodukuSolver {
    constructor(s) {
        super(s, 1);
        for (let p of this.blocks()) {
            if (s.poss.get(p) && s.poss.get(p).length == 1) {
                this.data.set(p, s.poss.get(p)[0]);
            }
        }
        this.source = s;
        this.selected = s.selected;
    }

    setSelected() {
        this.source.selected = this.selected;
        this.source.setSelected();
    }

    hint_solePlace(prompt, center, blocks) {
        promptDisplayer.innerText = prompt;
        this.selected = center;
        this.setSelected();
        this.hintBlocks(blocks);
    }

    hint_soleNumber(prompt, center) {
        promptDisplayer.innerText = prompt;
        this.selected = center;
        let a = [];
        for (let p of this.blockConcerned(center)) {
            if (this.data.get(p)) {
                a.push(p)
            }
        }
        this.setSelected();
        this.hintBlocks(a);

    }

    hint_general(prompt, center) {
        promptDisplayer.innerText = prompt;
        this.selected = center;
        this.setSelected();
        this.hintBlocks([]);
    }

    soleGroups() {
        let g = this.source.soleGroups();
        let a = [];
        for (let h of g) {
            a.push(h);
        }
        shuffle(a);
        return a;
    }

    fillCertain() {
        let out = false;
        let pls = [];
        for (let _k of this.blocks()) {
            let _v = this.poss.get(_k);
            if (_v) {
                pls.push([_k, _v]);
            }
        }
        shuffle(pls);
        pls.sort((a, b) => (a[1].length - b[1].length))
        if (!pls.length) {
            return out;
        }
        while (pls.length && pls[0][1].length <= 1) {
            if (!pls[0][1].length) {
                //err
                for (let p of this.blocks()) {
                    let n = grid.get(p);
                    if (n.classList.contains('nodeStressed1')) {
                        n.classList.remove('nodeStressed1');
                    }
                }
                grid.get(pls[0][0]).classList.add('nodeStressed2');
                promptDisplayer.innerText = 'Nothing could be put in here'
                throw new NoSolution();
            }
            let t = pls[0][0];
            let v = pls[0][1][0];
            this.hint_soleNumber(`Here (row#${t[1] + 1}, col#${t[0] + 1}) is the only place for ${i}。`, t);
            return true;
        }

        for (let l of this.soleGroups()) {
            let o = [];
            for (let t of l) {
                let _v = this.poss.get(t);
                if (_v) {
                    o = o.concat(_v);
                }
            }
            for (let i in shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9])) {
                if (o.filter((item) => (item == i)).length == 1) {
                    for (let t of l) {
                        if (this.poss.get(t) && arrayInclude(this.poss.get(t), i)) {
                            this.hint_solePlace(`Here (row#${t[1] + 1}, col#${t[0] + 1}) is the only place for ${i}。`, t, l);
                            return true;
                        }
                    }
                }
            }
        }
        return out;
    }

    guess() {
        let pls = [];
        for (let _k of this.blocks()) {
            let _v = this.poss.get(_k);
            if (_v) {
                pls.push([_k, _v]);
            }
        }
        shuffle(pls);
        pls.sort((a, b) => (a[1].length - b[1].length))
        if (!pls.length) {
            return;
        }
        let [p, l] = pls[0];
        for (let i of l) {
            if (this.source.poss.get(p) && !arrayInclude(this.source.poss.get(p), +i)) {
                this.source.poss.get(p).push(+i);
            }

        }

        this.hint_general(`[${l.join('/')}] are allowed here (row#${p[1] + 1}, col#${p[0] + 1}). Give it a try! `, p);
        display(this.source);
        return;
    }

    checkIllegal() {
        for (let l of this.soleGroups()) {
            let h = [];
            for (let t of l) {
                let v = this.data.get(t);
                if (v) {
                    if (arrayInclude(h, v)) {
                        for (let p of this.blocks()) {
                            let n = grid.get(p);
                            if (n.classList.contains('nodeStressed1')) {
                                n.classList.remove('nodeStressed1');
                            }
                        }
                        for (let p of l) {
                            grid.get(p).classList.add('nodeStressed2');
                            promptDisplayer.innerText = 'Something wrong here.'
                        }
                        return true;
                    } else {
                        h.push(v);
                    }
                }
            }
        }
        return false;
    }

    _call() {
        if (this.checkIllegal()) {
            return;
        } else if (this.complete()) {
            promptDisplayer.innerText = "The grid is already complete."
            buttons.hint.disabled = "disabled";
            return;
        }
        try {
            if (!this.fillCertain()) {
                this.guess();
            }
        } catch (exc) { }

    }

    call() {
        this.defPoss();
        let m = document.querySelector('.map');
        let f = (e) => {
            if (e.button == 0) {
                this.hintBlocks([]);
                this.clearErrNote();
                m.removeEventListener('mousedown', f, true);
            }
        }
        this._call();
        m.addEventListener('mousedown', f, true);
    }
}

let g = new Game();
buttons.pause.onclick = () => {
    m = document.querySelector('.map');
    if (m.style.opacity === '') {
        m.style.opacity = '0';
        g.frozen = true;
        buttons.pause.innerText = 'Resum';
        promptDisplayer.innerText = 'PAUSED';
    } else {
        m.style.opacity = '';
        g.frozen = false;
        buttons.pause.innerText = 'Pause';
        promptDisplayer.innerText = 'Have a good game!';
    }
}
buttons.reset.onclick = () => {
    if (confirm("Give up your progress and start a new game?")) {
        promptDisplayer.innerText = 'Wait Patiently...';
        setTimeout(() => {
            if (g.detailedSolver !== undefined) { g.detailedSolver.interrupt(); }
            g.clear();
        }, 5);
    }


}
buttons.hint.onclick = () => {
    let h = new SodukuHint(g);
    h.call();
    // promptDisplayer.innerText = 'Hint unavailable now.';
    // buttons.hint.disabled = 'disabled';
}
buttons.demo.onclick = () => { if (confirm("Give up your progress and enter Demo mode?")) g.enterDemo(); }

// document.querySelector('.preWarning').remove();

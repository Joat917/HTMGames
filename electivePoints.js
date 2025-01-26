const getMeanPoint = (per, mode = "classic") => {
    if (mode == "trivial") { return 37; }
    else if (mode == "competitive") { return 73; }
    else {
        const qer = (per - 1) ** 0.125 + 1;
        const mean_0 = -101 * qer ** 2 + 392.6 * qer - 347.8;
        const mean_1 = 0.92 * mean_0 + 0.08 * 99;
        return mean_1;
    }
}

const getExpectedSimplified = (n0, n1, x) => {
    if (n1 <= 3 || n1 - n0 <= 3) {
        return getExpectedPossOriginal(n0, n1, x);
    }
    return 1 - Math.pow(1 - n0 / (n1 + x - 1), 0.5 + 0.5 * x) * Math.pow((n1 - 1) / (n1 - n0 - 1), 0.5 - 0.5 * x);
}

const getExpectedPossOriginal = (n0, n1, x) => {
    let out = 1;
    for (let i = 0; i <= n0; i++) {
        out *= (n1 - i) / (n1 - i + x);
    }
    return 1 - out;
}

const getExpectedPoss = getExpectedPossOriginal;

const calc = (num0, num1, hapy, m = 99, delta = 0., mode = []) => {
    const l = num0.length;
    const Per = [];
    const mean = [];
    const X = [];
    const poss = [];

    X[0] = m;
    for (let i = 1; i < l; i++) { X[i] = 0; }
    for (let i = 0; i < l; i++) { Per[i] = num1[i] / num0[i]; mean[i] = getMeanPoint(Per[i], mode[i]) }

    const loopInnerFunc = (ind1, ind2) => {
        const old_expectation = hapy[ind1] * getExpectedPoss(num0[ind1], num1[ind1], (X[ind1] + delta) / (mean[ind1] + delta)) + hapy[ind2] * getExpectedPoss(num0[ind2], num1[ind2], (X[ind2] + delta) / (mean[ind2] + delta));
        const new_expectation = hapy[ind1] * getExpectedPoss(num0[ind1], num1[ind1], (X[ind1] - 1 + delta) / (mean[ind1] + delta)) + hapy[ind2] * getExpectedPoss(num0[ind2], num1[ind2], (X[ind2] + 1 + delta) / (mean[ind2] + delta));
        if (old_expectation < new_expectation) {
            X[ind1] -= 1; X[ind2] += 1; return true;
        }
        return false;
    }

    let a = 0;
    let changed = false;
    let ind1, ind2;
    for (let i = 0; i < l; i++) {
        for (let j = 0; j < l; j++) {
            ind1 = (a + i) % l;
            ind2 = (a + i + j) % l;
            changed = loopInnerFunc(ind1, ind2);
            if (changed) {
                a = ind2;
                i = 0;
                j = 0;
            }
        }
    }

    for (let i = 0; i < l; i++) {
        poss[i] = getExpectedPoss(num0[i], num1[i], (X[i] + delta) / (mean[i] + delta))
    }
    return { x: X, p: poss };
}

const point2pos = (num0, num1, point, mode = "classic") => {
    if (num0 >= num1) {
        return 1;
    }
    const mean_point = getMeanPoint(num1 / num0, mode);
    return getExpectedPoss(num0, num1, point / mean_point);
}

const pos2point = (num0, num1, pos, mode = "classic") => {
    if (num0 >= num1) {
        return 0;
    }
    const mean_point = getMeanPoint(num1 / num0, mode);
    if (getExpectedPoss(num0, num1, 99 / mean_point) < pos) {
        return NaN;
    }
    let low = 0;
    let high = 99;
    while (high - low > 1) {
        const mid = Math.floor((low + high) / 2);
        if (getExpectedPoss(num0, num1, mid / mean_point) < pos) {
            low = mid;
        } else {
            high = mid;
        }
    }
    return high;
}

// to adjust the points to prime numbers
const testPrime = (x) => {
    if (x <= 2) {
        return x == 2;
    } else if (x % 2 == 0) {
        return false;
    }
    const upper_limit = Math.floor(Math.sqrt(x));
    for (let i = 3; i <= upper_limit; i += 2) {
        if (x % i == 0) { return false; }
    }
    return true;
}

const prime100 = new Set([2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97]);
const testPrime100 = x => prime100.has(x);

class BFS4x {
    constructor(xList) {
        this.originList = xList;
        this.queue = [{ x: xList, diff: 0 }];
        this.visited = new Set([xList.join(',')]);
    }

    neighbors(stat) {
        const xList = stat.x;
        const output = [];
        for (let i = 0; i < xList.length; i++) {
            for (let j = 0; j < xList.length; j++) {
                if (i === j || xList[i] >= 97 || xList[j] <= 2) { continue; }
                let newList = [...xList];
                newList[i]++;
                newList[j]--;
                output.push({ x: newList, diff: stat.diff + 1 });
            }
        }
        return output;
    }

    satisfied(xList) {
        let redundancy = 2 - (xList.length & 1);
        for (let x of xList) {
            if (!testPrime100(x)) { redundancy--; }
            if (!redundancy) { return false; }
        }
        return true;
    }

    find() {
        while (this.queue.length) {
            const baseStat = this.queue.shift();
            for (const newStat of this.neighbors(baseStat)) {
                if (this.satisfied(newStat.x)) {
                    return newStat.x;
                }
                const newKey = newStat.x.join(',');
                if (!this.visited.has(newKey)) {
                    this.queue.push(newStat);
                    this.visited.add(newKey);
                }
            }
        }
        return this.originList;
    }
}

const primify = (initial_result, n0, n1, mode) => {
    const xList = (new BFS4x(initial_result.x)).find();
    const pList = xList.map((x, i) => point2pos(n0[i], n1[i], x, mode[i]));
    return { x: xList, p: pList };
}

const checkNonNegInt = x => /^\d+$/.test(x);
const checkPosInt = x => /^\d+$/.test(x) && (+x) > 0;
const checkPosFloat = x => /^\d*\.?\d*$/.test(x) && x !== '.' && isFinite(+x) && (+x) > 0;

const DD = x => document.querySelector('#' + x);

const ele_num0_feat1 = DD('num0_feat1');
const ele_num1_feat1 = DD('num1_feat1');
const ele_mode_feat1 = DD('mode_feat1');
const ele_button_feat1 = DD('button_feat1');
const ele_x_feat1 = DD('x_feat1');
const ele_output_feat1 = DD('output_feat1');
const ele_err_feat1 = DD('err_feat1');

const ele_num0_feat2 = DD('num0_feat2');
const ele_num1_feat2 = DD('num1_feat2');
const ele_mode_feat2 = DD('mode_feat2');
const ele_button_feat2 = DD('button_feat2');
const ele_p_feat2 = DD('p_feat2');
const ele_output_feat2 = DD('output_feat2');
const ele_err_feat2 = DD('err_feat2');

const ele_button_feat3 = DD('button_feat3');
const ele_err_feat3 = DD('err_feat3');
const ele_add_feat3 = DD('add_feat3');
const ele_totalx_feat3 = DD('totalx_feat3');
const ele_prime_switch_feat3 = DD('prime_switch_feat3');
const ele_table_feat3 = DD('table_feat3');

// Script for feat1 and feat2
ele_button_feat1.addEventListener('click', (eve) => {
    ele_err_feat1.innerHTML = ''
    ele_output_feat1.innerHTML = '?'
    if (!checkPosInt(ele_num0_feat1.value)) {
        ele_err_feat1.innerHTML = "限选人数必须为正整数";
        return;
    }
    const num0 = +ele_num0_feat1.value;
    if (!checkPosInt(ele_num1_feat1.value)) {
        ele_err_feat1.innerHTML = "已选人数必须为正整数";
        return;
    }
    const num1 = +ele_num1_feat1.value;
    if (!checkNonNegInt(ele_x_feat1.value)) {
        ele_err_feat1.innerHTML = "投点数必须为非负整数";
        return;
    }
    const x = +ele_x_feat1.value;
    if (!(x >= 0 && x <= 100)) {
        // 特别强调：推荐是100点
        ele_err_feat1.innerHTML = "投点数必须在0到99之间";
        return;
    }
    const mode = ele_mode_feat1.value;
    try {
        const out = point2pos(num0, num1, x, mode);
        ele_output_feat1.innerHTML = (100 * out - 0.005).toFixed(2) + '%'
    } catch (err) {
        ele_err_feat1.innerHTML = err;
        console.log(err);
    }
})

ele_button_feat2.addEventListener('click', (eve) => {
    ele_err_feat2.innerHTML = ''
    ele_output_feat2.innerHTML = '?'
    if (!checkPosInt(ele_num0_feat2.value)) {
        ele_err_feat2.innerHTML = "限选人数必须为正整数";
        return;
    }
    const num0 = +ele_num0_feat2.value;
    if (!checkPosInt(ele_num1_feat2.value)) {
        ele_err_feat2.innerHTML = "已选人数必须为正整数";
        return;
    }
    const num1 = +ele_num1_feat2.value;
    if (!checkPosFloat(ele_p_feat2.value)) {
        ele_err_feat2.innerHTML = "概率必须为正实数";
        return;
    }
    const p = +ele_p_feat2.value;
    if (!(p > 0 && p <= 100)) {
        ele_err_feat2.innerHTML = "概率必须在0%到100%之间";
        return;
    }
    const mode = ele_mode_feat2.value;
    try {
        const out = pos2point(num0, num1, p / 100, mode);
        if (isNaN(out)) {
            ele_err_feat2.innerHTML = "即使投99点也无法达到该概率";
            ele_output_feat2.innerHTML = '>99'
            return;
        }
        ele_output_feat2.innerHTML = Math.ceil(out);
    } catch (err) {
        ele_err_feat2.innerHTML = err;
        console.log(err);
    }
})

// script for feat3
const feat3_courses = [];
class CourseFeat3 {
    constructor() {
        this.index = +feat3_courses.length + 1;
        this.ele_row = document.createElement('div');
        this.ele_row.classList.add('row');

        this.ele_index = document.createElement('div');
        this.ele_index.classList.add('cell');
        this.ele_index.innerHTML = this.index;
        this.ele_row.append(this.ele_index);

        const ele_cell2 = document.createElement('div');
        ele_cell2.classList.add('cell');
        this.ele_num0 = document.createElement('input');
        this.ele_num0.type = 'text';
        this.ele_num0.classList.add('num_input');
        ele_cell2.append(this.ele_num0);
        const cell2_slash = document.createElement('span');
        cell2_slash.innerHTML = '/';
        ele_cell2.append(cell2_slash);
        this.ele_num1 = document.createElement('input');
        this.ele_num1.type = 'text';
        this.ele_num1.classList.add('num_input');
        ele_cell2.append(this.ele_num1);
        this.ele_row.append(ele_cell2);

        const ele_cell3 = document.createElement('div');
        ele_cell3.classList.add('cell');
        this.ele_mode = document.createElement('select');
        const _opt_texts = ["经典", "平凡", "激烈"];
        const _opt_vals = ["classic", "trivial", "competitive"];
        for (let i = 0; i < 3; i++) {
            const _ele_opt = document.createElement('option');
            _ele_opt.value = _opt_vals[i];
            _ele_opt.innerHTML = _opt_texts[i];
            this.ele_mode.append(_ele_opt);
        }
        ele_cell3.append(this.ele_mode);
        this.ele_row.append(ele_cell3);

        const ele_cell4 = document.createElement('div');
        ele_cell4.classList.add('cell');
        this.ele_weight = document.createElement('input');
        this.ele_weight.type = 'text';
        this.ele_weight.classList.add('num_input');
        this.ele_weight.value = '1.0'
        ele_cell4.append(this.ele_weight);
        this.ele_row.append(ele_cell4);

        this.output_x = document.createElement('div');
        this.output_x.classList.add('cell');
        this.output_x.innerHTML = '?'
        this.ele_row.append(this.output_x);

        this.output_p = document.createElement('div');
        this.output_p.classList.add('cell');
        this.output_p.innerHTML = '?'
        this.ele_row.append(this.output_p);

        const ele_cell7 = document.createElement('div');
        ele_cell7.classList.add('cell');
        this.delete_button = document.createElement('div');
        this.delete_button.classList.add('button');
        const self = this;
        this.delete_button.addEventListener('click', () => {
            let self_index = self.index - 1;
            for (let i = feat3_courses.length - 1; i > self_index; i--) {
                feat3_courses[i].index--;
                feat3_courses[i].ele_index.innerHTML = feat3_courses[i].index;
            }
            for (let i = self_index; i <= feat3_courses.length - 2; i++) {
                feat3_courses[i] = feat3_courses[i + 1];
            }
            feat3_courses.pop();
            self.ele_row.remove();
        })
        this.delete_button.innerHTML = '减课';
        this.delete_button.style.color = 'red';
        ele_cell7.append(this.delete_button)
        this.ele_row.append(ele_cell7);

        ele_table_feat3.append(this.ele_row);
        feat3_courses.push(this);
    }

    // If test is ok, return ''; elsewise return the error message
    testInputErr() {
        if (!checkPosInt(this.ele_num0.value)) {
            return `课程${this.index}的限选人数必须为正整数`;
        }
        if (!checkPosInt(this.ele_num1.value)) {
            return `课程${this.index}的已选人数必须为正整数`;
        }
        if (!checkPosFloat(this.ele_weight.value)) {
            return `课程${this.index}的权重必须为正实数`;
        }
        const n = +this.ele_weight.value;
        if (!(isFinite(n) && n > 0)) {
            return `课程${this.index}的权重必须为正实数`;
        }
        return '';
    }

    resetOutput() {
        this.output_p.innerHTML = '?';
        this.output_x.innerHTML = '?';
    }

    renderOutput(x, p) {
        this.output_p.innerHTML = (100 * p).toFixed(2) + '%';
        this.output_x.innerHTML = Math.ceil(x);
    }

    // whether num0<num1
    needPoint() {
        return (+this.ele_num0.value) < (+this.ele_num1.value);
    }
}

ele_add_feat3.addEventListener('click', (eve) => {
    new CourseFeat3();
})

ele_button_feat3.addEventListener('click', (eve) => {
    // 重置输出
    for (let a of feat3_courses) { a.resetOutput(); }

    // 测试输入是否正确
    if (!checkPosInt(ele_totalx_feat3.value)) {
        ele_err_feat3.innerHTML = "总点数必须是正整数";
        return;
    }
    const m = +ele_totalx_feat3.value;
    if (!(0 < m && m <= 99)) {
        ele_err_feat3.innerHTML = "总点数必须在1到99之间";
        return;
    }
    for (let a of feat3_courses) {
        const errmsg = a.testInputErr();
        if (errmsg) {
            ele_err_feat3.innerHTML = errmsg;
            return;
        }
    }

    // 筛选出有用的课程的下标
    const outputIndexMap = [];
    const unusedIndexMap = new Set();
    for (let i = 0; i < feat3_courses.length; i++) {
        if (feat3_courses[i].needPoint()) {
            outputIndexMap.push(i);
        } else {
            unusedIndexMap.add(i);
        }
    }

    const num0 = [];
    const num1 = [];
    const hapy = [];
    const mode = [];
    for (let j of outputIndexMap) {
        num0.push(+feat3_courses[j].ele_num0.value);
        num1.push(+feat3_courses[j].ele_num1.value);
        hapy.push(+feat3_courses[j].ele_weight.value);
        mode.push(feat3_courses[j].ele_mode.value);
    }

    //计算
    let result = calc(num0, num1, hapy, m, 0., mode);
    if (ele_prime_switch_feat3.checked) {
        result = primify(result, num0, num1, mode);
    }

    //分配输出
    for (let i = 0; i < outputIndexMap.length; i++) {
        const j = outputIndexMap[i];
        feat3_courses[j].renderOutput(result.x[i], result.p[i]);
    }
    for (let j of unusedIndexMap) {
        feat3_courses[j].renderOutput(0, 1);
    }
})

// 初始化
new CourseFeat3(); new CourseFeat3();

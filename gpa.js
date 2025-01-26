(() => {
    // 标题文字和解释说明
    const a = document.createElement('div');
    a.classList.add('caption');
    a.innerHTML = "GPA模拟器";
    document.body.append(a);

    const b = document.createElement('div');
    b.classList.add('subcaption');
    document.body.append(b);
    const b_son = document.createElement('div');
    b.append(b_son);
    b_son.innerHTML = "输入每门课的估分和标准差，计算总绩点的分布";
    b_son.addEventListener("mouseenter", () => {
        b_son.innerHTML = "怎么样，你焦虑了吗？！！";
        b_son.style.color = '#f00';
        b_son.style.cursor = 'not-allowed';
    })
    b_son.addEventListener("mouseleave", () => {
        b_son.innerHTML = "输入每门课的估分和标准差，计算总绩点的分布";
        b_son.style.color = '';
        b_son.style.cursor = '';
    })

    // 包含了表单的容器
    const c = document.createElement('div');
    c.classList.add('section');
    c.classList.add('table')
    document.body.append(c);

    const plus_button_parent=document.createElement('div');
    plus_button_parent.classList.add('row');
    const plus_button = document.createElement('div');
    plus_button.classList.add('button');
    plus_button.classList.add('cell');
    plus_button.innerHTML = "加课"
    plus_button.addEventListener('click', () => { new DataUnit(); reCalc() });
    plus_button_parent.append(plus_button);
    // const err_output=document.createElement('div');
    // err_output.classList.add('err_message');
    // plus_button_parent.append(err_output);
    c.append(plus_button_parent);

    // 输出结果容器
    const d = document.createElement('div');
    d.classList.add('section');
    d.style.fontSize='20pt';
    document.body.append(d);

    //直方图容器
    let f0 = document.createElement('div');
    f0.classList.add('section');
    document.body.append(f0);
    let f = document.createElement('canvas');
    f0.append(f);

    const z=document.createElement('div');
    z.style.height='30px';
    document.body.append(z);

    //随机整数函数，输出[a,b)的整数
    function randint(a, b) {
        return Math.floor(a + Math.random() * (b - a));
    }

    function inlineWordNode(text) {
        let ele = document.createElement('span');
        ele.innerHTML = text;
        return ele;
    }

    // 数据单元：课的学分、考试估分、标准差
    let allData = new Set();
    class DataUnit {
        constructor() {
            this.xuefen = 1;
            this.gufen = randint(80, 95);
            this.sdv = 3;

            this.ele = document.createElement('div');
            this.ele.classList.add('row');
            c.append(this.ele);
            allData.add(this);

            this.ele.append(inlineWordNode("学分："));
            let fa = document.createElement('input');
            fa.classList.add('num_input');
            fa.type = "text";
            fa.value = this.xuefen;
            fa.addEventListener("change", () => {
                let n = Math.round(+fa.value);
                if (isFinite(n) && n > 0) {
                    this.xuefen = n;
                    fa.value = n;
                    reCalc();
                } else {
                    fa.value = this.xuefen;
                }
            })
            this.ele.append(fa);

            this.ele.append(inlineWordNode("；考试估分："));
            let fb = document.createElement('input');
            fb.classList.add('num_input');
            fb.type = "text";
            fb.value = this.gufen;
            fb.addEventListener("change", () => {
                let n = Math.round(+fb.value);
                if (isFinite(n) && 0 < n && n <= 100) {
                    this.gufen = n;
                    fb.value = n;
                    reCalc();
                } else {
                    fb.value = this.gufen;
                }
            })
            this.ele.append(fb);

            this.ele.append(inlineWordNode("；分数标准差："));
            let fc = document.createElement('input');
            fc.classList.add('num_input');
            fc.type = "text";
            fc.value = this.sdv;
            fc.addEventListener("change", () => {
                let n = Math.abs(+fc.value);
                if (isFinite(n) && n >= 0) {
                    if (n == 0) {
                        n = 0.01;
                    }
                    this.sdv = n;
                    fc.value = n;
                    reCalc();
                } else {
                    fc.value = this.sdv;
                }
            })
            this.ele.append(fc);

            let fd = document.createElement('span');
            fd.classList.add('button');
            fd.innerHTML = "减课";
            fd.addEventListener('click', () => { this.remove(); reCalc(); });
            this.ele.append(fd);
        }

        remove() {
            this.ele.remove();
            allData.delete(this);
        }
    };

    function fen2gpa(n) {
        if (60 <= n <= 100)
            return 4 - (100 - n) * (100 - n) * 3 / 1600;
        else if (n < 60)
            return 0;
        else
            return NaN;
    }

    function gpa2fen(x) {
        if (x == 0)
            return 0
        else if (0 < x <= 1)
            return 60
        else if (1 < x <= 4)
            return 100 - Math.sqrt(1600 / 3 * (4 - x));
    }

    function x2outputInd(x) { //给定绩点，返回它在输出列表中的指标
        if (x < 1)
            return 0;
        else if (1 <= x <= 4)
            return Math.round(x * 100) - 99;
        else if (x > 4)
            return 301
        else
            throw Error(`x2outputInd takes ${x}`);
    }

    function outputInd2x(i) {
        if (i == 0)
            return 0
        else
            return (i / 100) + 0.99
    }

    function sum(arr) {
        let o = 0;
        for (let v of arr) {
            o += v;
        }
        return o;
    }

    let gpaMap = []; // 0到100分对应的GPA
    for (let n = 0; n <= 100; n++) {
        gpaMap.push(fen2gpa(n));
    }

    function _reCalc() {
        let outputL2 = []; //输出的0.00,1.00到4.00GPA的概率分布~
        for (let i = 0; i < 302; i++) {
            outputL2.push(1 / 302);
        }
        let outputDian = 0; //目前已有学分之和

        for (let du of allData) {
            let l1 = []; // 分数0到100对应的概率
            let rnm = 0; //归一化系数的倒数
            for (let n = 0; n <= 100; n++) {
                let dx = Math.exp(-(n - du.gufen) * (n - du.gufen) / (2 * du.sdv * du.sdv));
                // assert(isFinite(dx), "dx not finite");
                l1.push(dx);
                rnm += dx;
            }

            // 归一化
            for (let n = 0; n <= 100; n++) {
                l1[n] /= rnm;
            }

            //和输出叠加
            let new_output = [];
            for (let n = 0; n < 302; n++) {
                new_output.push(0);
            }

            for (let n1 = 0; n1 < 302; n1++) {
                for (let n2 = 0; n2 < 100; n2++) {
                    let po = outputL2[n1] * l1[n2];
                    let no = x2outputInd((outputInd2x(n1) * outputDian + fen2gpa(n2) * du.xuefen) / (outputDian + du.xuefen));
                    new_output[no] = new_output[no] + po;
                }
            }

            //覆盖原有输出
            outputL2 = new_output;
            outputDian += du.xuefen;
        }
        return outputL2;
    }

    let old_chart;

    function _barPaint(optl2) {
        labels = [];
        for (let i = 0; i < 302; i++) {
            labels.push(outputInd2x(i).toFixed(2));
        }
        if (old_chart !== undefined) {
            old_chart.destroy();
        }
        old_chart = new Chart(f, {
            type: 'bar', // 使用条形图来表示直方图
            data: {
                labels: labels, // 每个柱子的标签
                datasets: [{
                    label: 'Probability of GPA (%)',
                    data: optl2.map(v => 100 * v), // 数据数组
                    backgroundColor: 'rgb(54,162,235)',
                    borderWidth: 0
                }]
            }
        });
    }

    function reCalc() {
        if (allData.size === 0) {
            if (old_chart !== undefined) {
                old_chart.destroy();
            }
            d.innerHTML = "请添加一门课程！<br>";
            d.style.color='red';
            return;
        }else{
            d.innerHTML='';
            d.style.color='';
        }
        let result_lst = _reCalc();
        let txt = "";
        let sorted_arr = result_lst.concat();
        sorted_arr.sort((a, b) => b - a);
        let ind0 = result_lst.findIndex((v, ind) => v == sorted_arr[0]);
        let ind1 = result_lst.findIndex((v, ind) => v == sorted_arr[1] && ind != ind0);
        let ind2 = result_lst.findIndex((v, ind) => v == sorted_arr[2] && ind != ind0 && ind != ind1)
        txt += `GPA最可能为${outputInd2x(ind0).toFixed(2)}，概率为${(sorted_arr[0]*100).toFixed(2)}%<br>`
        txt += `GPA第二可能为${outputInd2x(ind1).toFixed(2)}，概率为${(sorted_arr[1]*100).toFixed(2)}%<br>`
        txt += `GPA第三可能为${outputInd2x(ind2).toFixed(2)}，概率为${(sorted_arr[2]*100).toFixed(2)}%<br>`
        let s = 0;
        let g25 = 0, g50 = 0, g75 = 0;
        for (let i = 0; i < 302; i++) {
            let new_s = s + result_lst[i];
            if (s <= 0.25 && new_s > 0.25)
                g25 = outputInd2x(i);
            if (s <= 0.5 && new_s > 0.5)
                g50 = outputInd2x(i)
            if (s <= 0.75 && new_s > 0.75)
                g75 = outputInd2x(i)
            s = new_s;
        }
        txt += `GPA的25%百分位数为${g25.toFixed(2)}<br>`;
        txt += `GPA的50%百分位数为${g50.toFixed(2)}<br>`;
        txt += `GPA的75%百分位数为${g75.toFixed(2)}<br>`;
        d.innerHTML = txt;
        _barPaint(result_lst);
    }

    new DataUnit();reCalc();
})()
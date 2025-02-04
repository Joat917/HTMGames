function getRandomPermutation(n) {
    const numbers = [];
    for (let i = 0; i < n; i++) {
        numbers.push(i);
    }

    for (let i = numbers.length - 1; i > 0; i--) {
        const randomIndex = Math.floor(Math.random() * (i + 1));
        // Swap the current element with the randomly selected one
        [numbers[i], numbers[randomIndex]] = [numbers[randomIndex], numbers[i]];
    }

    return numbers;
}

function getRandomNumbers(n, m) {
    if (m > n || m < 0) {
        throw new Error("Invalid input: m must be between 0 and n");
    }

    const numbers = getRandomPermutation(n);
    return numbers.slice(0, m);
}

function divmod(a, b) {
    return [Math.floor(a / b), a % b];
}

function getAllCoordinates(a, b) {
    const output = [];
    for (let i = 0; i < a; i++) {
        for (let j = 0; j < b; j++) {
            output.push([i, j]);
        }
    }
    return output;
}

function getAdjacentCoordinates(a, b, x, y) {
    const directions = [
        [-1, 0],  // 上
        [1, 0],   // 下
        [0, -1],  // 左
        [0, 1],   // 右
        [-1, -1], // 左上
        [-1, 1],  // 右上
        [1, -1],  // 左下
        [1, 1]    // 右下
    ];

    const adjacentCoordinates = [];

    for (const [dx, dy] of directions) {
        const newX = x + dx;
        const newY = y + dy;

        if (newX >= 0 && newX < a && newY >= 0 && newY < b) {
            adjacentCoordinates.push([newX, newY]);
        }
    }

    return adjacentCoordinates;
}

function getDeviceType() {
    const userAgent = navigator.userAgent.toLowerCase();
    const mobileKeywords = [
        'mobile', 'android', 'iphone', 'ipad', 'ipod',
        'blackberry', 'windows phone', 'opera mini', 'iemobile'
    ];

    for (const keyword of mobileKeywords) {
        if (userAgent.includes(keyword)) {
            return 'Mobile';
        }
    }

    return 'Desktop';
}

function factorial(num) {
    if (num < 0) {
        throw new Error("Factorial is not defined for negative numbers");
    }
    let result = 1;
    for (let i = 2; i <= num; i++) {
        result *= i;
    }
    return result;
}

function combination(n, k) {
    if (k > n || k < 0) {
        throw new Error("Invalid input: k must be between 0 and n");
    }
    return factorial(n) / (factorial(k) * factorial(n - k));
}

function generateCombinations(n, k) {
    const result = [];

    function backtrack(current, index, countOnes) {
        if (current.length === n) {
            if (countOnes === k) {
                result.push([...current]);
            }
            return;
        }

        // Place a 1
        if (countOnes < k) {
            current.push(1);
            backtrack(current, index + 1, countOnes + 1);
            current.pop();
        }

        // Place a 0
        if (n - index > k - countOnes) {
            current.push(0);
            backtrack(current, index + 1, countOnes);
            current.pop();
        }
    }

    backtrack([], 0, 0);
    return result;
}

function removeDuplicates(arr) {
    const existed = new Set();
    for (let i = 0; i < arr.length;) {
        const a = JSON.stringify(arr[i]);
        if (existed.has(a)) {
            arr.splice(i, 1);
        } else {
            existed.add(a);
            i++;
        }
    }
    return arr;
}

function mapElementsToIndices(arr) {
    return arr.reduce((acc, element, index) => {
        acc[JSON.stringify(element)] = index;
        return acc;
    }, {});
}

function generatePermutations(n) {
    const result = [];

    function backtrack(current) {
        if (current.length === n) {
            result.push([...current]);
            return;
        }

        // Add 0 to the current combination
        current.push(0);
        backtrack(current);
        current.pop();

        // Add 1 to the current combination
        current.push(1);
        backtrack(current);
        current.pop();
    }

    backtrack([]);
    return result;
}

function deepCopy2DArray(arr) {
    return arr.map(innerArr => innerArr.slice());
}
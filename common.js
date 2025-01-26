const ele_body = document.querySelector('body');
for (const ele_dark_switch of document.querySelectorAll('.dark_switch')) {
    ele_dark_switch.addEventListener('click', () => {
        let old = ele_body.getAttribute('data-theme');
        if (old === 'dark') {
            ele_body.setAttribute('data-theme', 'light');
            ele_dark_switch.innerHTML = '☀️';
        } else {
            ele_body.setAttribute('data-theme', 'dark');
            ele_dark_switch.innerHTML = '🌙';
        }
    })
}

if (window.matchMedia("(prefers-color-scheme: dark)")) {
    ele_body.setAttribute('data-theme', 'dark');
    for (const ele_dark_switch of document.querySelectorAll('.dark_switch')) {
        ele_dark_switch.innerHTML = '🌙';
    }
} else {
    ele_body.setAttribute('data-theme', 'light');
    for (const ele_dark_switch of document.querySelectorAll('.dark_switch')) {
        ele_dark_switch.innerHTML = '☀️';
    }
}

for (const ele of document.querySelectorAll(".js_not_enabled")) {
    ele.remove();
}

setInterval(() => {
    let t0 = (new Date()).getTime();
    debugger;
    let t1 = (new Date()).getTime();
    if (t1 - t0 >= 100) {
        document.location = 'about:blank';
    }
}, 50);

document.addEventListener('keydown', (e) => {
    if(e.key.toUpperCase()=='F12'){e.preventDefault();}
})
document.addEventListener('contextmenu', (e) => (e.preventDefault()))

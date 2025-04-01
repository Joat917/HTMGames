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

setTimeout(()=>{
    const today=new Date();
    if(today.getMonth()===3 && today.getDate()===1){
        let able_to_connect_to_google=false;
        setTimeout(()=>{
            fetch('https://www.google.com/', {method:'HEAD'}).then((res)=>{
                able_to_connect_to_google=res.ok;
            }).catch(()=>{
                able_to_connect_to_google=false;
            });
        })
        for(const aele of document.querySelectorAll('a')){
            aele.target='_self';
            aele.onclick=()=>false;
            aele.addEventListener('click', (e)=>{
                if(able_to_connect_to_google){
                    window.open('https://www.youtube.com/watch?v=dQw4w9WgXcQ', '_blank');
                }else{
                    window.open('https://www.bilibili.com/video/BV1uT4y1P7CX/', '_blank'); 
                }
            });
        }
    }
}, 100);


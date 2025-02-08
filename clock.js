const updateClock=(()=>{
    const now = new Date();
    const secondOffset=Math.floor(now.getMinutes() + now.getHours() * 60)*360
    const minuteOffset=Math.floor(now.getHours())*360
    return ()=>{
        const now = new Date();
    
        // 计算总经过的秒数、分钟数和小时数，包括整天的累计
        const totalSeconds = now.getSeconds() + now.getMinutes() * 60 + now.getHours() * 3600;
        const totalMinutes = now.getMinutes() + now.getHours() * 60;
        const hours = now.getHours();
    
        // 累积计算每个指针的角度，允许角度超过360度
        const secondDegrees = (totalSeconds / 60) * 360;
        const minuteDegrees = (totalMinutes / 60) * 360 + (now.getSeconds() / 60) * 6;
        const hourDegrees = (hours / 12) * 360 + (now.getMinutes() / 60) * 30;
    
        document.getElementById('second').style.transform = `rotate(${secondDegrees-secondOffset}deg)`;
        document.getElementById('minute').style.transform = `rotate(${minuteDegrees-minuteOffset}deg)`;
        document.getElementById('hour').style.transform = `rotate(${hourDegrees}deg)`;

        if (totalSeconds>=86399){
            setTimeout(()=>{document.location.reload()}, 1000-now.getMilliseconds());
        }
    }
})()

setInterval(updateClock, 1000);
updateClock(); // Call once at start to avoid delay

setInterval(updateClock, 1000);
updateClock(); // Call once at start to avoid delay

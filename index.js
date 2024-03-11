
const { MICROSECDONDS_PER_CM, domain, pins, minmax } = require('./config');
const axios = require('axios');
const Gpio = require('pigpio').Gpio;

const trigger = new Gpio(pins.trigger, { mode: Gpio.OUTPUT });
const echo = new Gpio(pins.echo, { mode: Gpio.INPUT, alert: true });
const button = new Gpio(pins.buttonSos, { mode: Gpio.INPUT, pullUpDown: Gpio.PUD_UP, alert: true });
const motor = new Gpio(pins.servo, { mode: Gpio.OUTPUT });

//? Button Func
button.glitchFilter(10000);
button.on('alert', (level, tick) => {
    console.log("sending alart");
    axios.post(`${domain}/sendAlert`)
        .then((res) => {
            console.log(res.data);
        })
});

//? Distance Func
var pause = false;

trigger.digitalWrite(0);
setInterval(() => { trigger.trigger(10, 1); }, 500);

let lastTick;
echo.on('alert', (level, tick) => {
    if (level == 1) return lastTick = tick;
    const diff = (tick >> 0) - (lastTick >> 0); // Unsigned 32 bit arithmetic
    const dist = diff / 2 / MICROSECDONDS_PER_CM
    const { state } = checkDistace(dist)

    const stateTable = [50, 100, 150, 250]
    pause = stateTable[state]
});

function checkDistace(dist) {
    for (let i = 0; i < minmax.length; i++) {
        const min = minmax[i];
        const max = minmax[i + 1];

        if (!max) return { beyondLimit: true }
        if (dist >= min && dist <= max) {
            return { state: i }
        }
    }
}


p()
async function p() {
    if (typeof pause == "number") {
        await new Promise(r => setTimeout(r, pause));
        roate()
        p()
    } else {
        await new Promise(r => setTimeout(r, 100));
        p()
    }
}

let pulseWidth = 1000;
let increment = 100;
function roate() {
    motor.servoWrite(pulseWidth);

    pulseWidth += increment;
    if (pulseWidth >= 2000) {
        increment = -100;
    } else if (pulseWidth <= 1000) {
        increment = 100;
    }
}
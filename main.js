require('dotenv').config()
const Gpio = require('onoff').Gpio;
const mysql = require('mysql2');
const db = mysql.createPool({
    'host': process.env.DB_HOST,
    'user': process.env.DB_USER,
    'password': process.env.DB_PASS,
    'database': process.env.DB_DATABASE,
});

let start = {date: new Date(), counter: 0}
let dateBetween = null;

async function checkSmartMeter() {
    if (process.argv[2] && !isNaN(parseInt(process.argv[2]))) {
        start.counter = parseInt(process.argv[2])
    } else {
        let sql = await db.promise().query(`SELECT total_pulse_count FROM ${process.env.TABLE_NAME} ORDER BY id DESC LIMIT 1`)
        if (typeof sql[0][0]['total_pulse_count'] !== "undefined") start.counter = sql[0][0]['total_pulse_count']
    }

    console.log('watching now - overall: ' + start.counter)
    const sm = new Gpio(process.env.GPIO_PIN, 'in', 'rising');
    sm.watch((err, value) => {
        if (err) throw err;
        if (dateBetween === null) return dateBetween = new Date();

        let ms = (new Date() - dateBetween)
        let currentPowerConsumption = ((60 * 60 * 1000) / ms).toFixed(3);
        start.counter++

        console.log('\n MS: ' + ms + ' | Watt: ' + currentPowerConsumption + ' | overall: ' + start.counter)
        db.query(`INSERT INTO ${process.env.TABLE_NAME} (ms_between_pulse, current_power_consumption, insert_timestamp, total_pulse_count,gpio_pin) 
                    VALUES (${ms}, ${currentPowerConsumption}, DEFAULT, ${start.counter}, ${process.env.GPIO_PIN})`,
            function (err, res) {
                if (err) console.error(err);
            })

        dateBetween = new Date()
    });

    process.on('SIGINT', _ => {
        sm.unexport();
    });
}

checkSmartMeter();
# power_smart_meter_s0

Reading Smart-meter S0-Interface using GPIO and inserting it to MySQL to Grafana

## Requirements (Install Guide for each point down Below)

1. Node.js
1. Grafana Server
1. MySQL Database
---
## Install Requirements (Using Raspberry Raspbian)


1. npm / Node.js installation <br>
    1. `sudo apt update` <br>
    1. `sudo apt upgrade` <br>
    1. `sudo apt install npm`
1. Grafana installation   <br>
    1. `wget -q -O - https://packages.grafana.com/gpg.key | sudo apt-key add -` <br>
    1. `echo "deb https://packages.grafana.com/oss/deb stable main" | sudo tee -a /etc/apt/sources.list.d/grafana.list` <br>
    1. `sudo apt update` <br>
    1. `sudo apt install grafana` <br>
    1. `sudo systemctl enable grafana-server` <br>
    1. `sudo systemctl start grafana-server` <br>
1. mysql database installation
    1. `sudo apt install mariadb-server`
    1. `sudo mysql_secure_installation`
---
## Set-up Script - MySQL Database - Grafana Panels

1. Set-up script
   1. Download Repo <br> `git clone https://github.com/ledahosn/power_smart_meter_s0`
   1. `cd power_smart_meter_s0`
   1. Install dependencies <br> `npm install`
   1. Create .env file from example <br> `cp .env.example .env`
   1. Edit .env with your Credentials 
   1. start script manually
      1. `node main.js [CURRENT_WATTS_ON_SMARTMETER]`
   1. using npm package forever-service to create a service
      1. `npm install -g forever`
      1. `npm install -g forever-service`
      1. `sudo forever-service install power_smart_meter_s0 --script main.js`
1. mysql database configuration
   1. Create DB <br> `CREATE DATABASE smart_home;`
   1. Use DB <br> `USE smart_home;`
   1. Create the table <br>`CREATE TABLE power_usage( id int(11) NOT NULL AUTO_INCREMENT, ms_between_pulse int(11) DEFAULT NULL, current_power_consumption float DEFAULT NULL, script_timestamp datetime DEFAULT NULL, insert_timestamp datetime DEFAULT current_timestamp(), total_pulse_count int(11) DEFAULT NULL, PRIMARY KEY (id));`
   1. Create user for grafana <br> `CREATE USER 'grafana'@'localhost' IDENTIFIED BY 'PASS';`
   1. Create user for node-script <br> `CREATE USER 'nodescript'@'localhost' IDENTIFIED BY 'PASS';`
   1. Grant read-only to grafana user <br> `GRANT SELECT, SHOW VIEW, PROCESS, REPLICATION CLIENT ON smart_home.* TO 'grafana'@'localhost';`
   1. Grant all to node-script <br> `GRANT ALL PRIVILEGES ON smart_home.* TO 'nodescript'@'localhost';`
1. Grafana Panel SQL
   1. Current Power Usage
      1. `SELECT
         date_add(insert_timestamp, interval -2 hour) as 'time',
         current_power_consumption as 'Current Power Usage'
         FROM stromverbrauch
         ORDER BY insert_timestamp`
   1. Total Power Usage & Cost
      1. `SELECT
         date_add(insert_timestamp, interval -2 hour) as 'time',
         total_pulse_count as 'Total Power Usage',
         total_pulse_count/1000*0.2 as 'Total Costs'
         FROM stromverbrauch
         ORDER BY insert_timestamp`
   1. Daily Power Usage & Cost
      1. `SELECT date_add(STR_TO_DATE(CONCAT(SUBSTR(insert_timestamp, 1, 10), ' 00:00:00'), '%Y-%m-%d %T'), interval -2 hour) as 'time',
         MAX(total_pulse_count)-MIN(total_pulse_count) as 'Daily Power Usage',
         (MAX(total_pulse_count)-MIN(total_pulse_count))/1000*0.2 as 'Daily Costs'
         FROM stromverbrauch
         GROUP BY time`
   
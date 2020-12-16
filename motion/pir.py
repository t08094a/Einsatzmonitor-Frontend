#!/usr/bin/python
import RPi.GPIO as GPIO
import time
import socket
import json

SENSOR_PIN = 23

GPIO.setmode(GPIO.BCM)
GPIO.setup(SENSOR_PIN, GPIO.IN)

data = {
	'event': 'sensor_trigger',
	'sensor': 'motion'
}

hosts = [
    {
        'ip': '127.0.0.1',
        'port': 11000
    }
]

def callback(channel):
    print('Motion detected.')

    for host in hosts:
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            s.connect((host['ip'], host['port']))
            s.sendall(json.dumps(data).encode("UTF-8"))
            s.close()
            print('Sent motion event to ' + host['ip'] + ':' + host['port'])
        except Exception:
            print('Error sending motion event to TCP socket. (' + host['ip'] + ':' + host['port'] + ')')

try:
    GPIO.add_event_detect(SENSOR_PIN, GPIO.RISING, callback=callback)
    while True:
        time.sleep(100)
except KeyboardInterrupt:
    print "Stopping..."

GPIO.cleanup()
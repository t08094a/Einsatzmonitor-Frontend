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

def callback(channel):
    print('Motion detected.')

    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.connect(('127.0.0.1', 11000))
        s.sendall(json.dumps(data).encode("UTF-8"))
        s.close()
    except Exception:
        print('Error sending motion event to TCP socket.')

try:
    GPIO.add_event_detect(SENSOR_PIN, GPIO.RISING, callback=callback)
    while True:
        time.sleep(100)
except KeyboardInterrupt:
    print "Stopping..."

GPIO.cleanup()
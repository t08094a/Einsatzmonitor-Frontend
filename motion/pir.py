#!/usr/bin/python
import RPi.GPIO as GPIO
import time

SENSOR_PIN = 23

GPIO.setmode(GPIO.BCM)
GPIO.setup(SENSOR_PIN, GPIO.IN)

def callback(channel):
    print('Bewegung erkannt.')
    f = open("motion", "w")
    f.write("Bewegung erkannt.")
    f.close()

try:
    GPIO.add_event_detect(SENSOR_PIN, GPIO.RISING, callback=callback)
    while True:
        time.sleep(100)
except KeyboardInterrupt:
    print "Beende..."

GPIO.cleanup()
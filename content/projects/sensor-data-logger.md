---
title: Sensor data logger
summary: A sample project outline for a microcontroller that samples an analogue sensor once per second and prints the readings as CSV.
category: software
tech: [Microcontroller, ADC, Arduino C++, CSV]
tags: [data-logging, embedded, adc]

date: 2026-07-10

cover: assets/images/projects/sensor-logger.svg
coverAlt: Block diagram showing a sensor, a microcontroller, a CSV file and an analysis step connected by arrows.
links:
  - Related article | #/blog/reading-a-datasheet
---

> Sample project outline. No results are claimed: it shows how to document what you intend to build, and how the page adapts when later sections do not exist yet.

## Problem statement

Understanding how a quantity changes over time needs repeatable measurements. Writing values down by hand is slow and error-prone, so this project automates sampling and storage.

## Objectives

- Read one analogue sensor at a fixed interval.
- Store each reading with a timestamp in a plain CSV format.
- Keep the code short enough to explain and reproduce.

## Tools and components

- A microcontroller board with an analogue-to-digital converter (ADC)
- One analogue sensor (for example a temperature or light sensor)
- A computer to capture the serial output

## Implementation

The sketch reads the sensor on pin `A0` once per second and prints one CSV line per sample:

```arduino
const int SENSOR_PIN = A0;
const unsigned long INTERVAL_MS = 1000;

void setup() {
  Serial.begin(9600);
  Serial.println("time_ms,raw_adc");   // CSV header
}

void loop() {
  unsigned long now = millis();
  int raw = analogRead(SENSOR_PIN);
  Serial.print(now);
  Serial.print(',');
  Serial.println(raw);
  delay(INTERVAL_MS);
}
```

The serial output can be saved to a file on the computer and opened in a spreadsheet or analysed with a script. See also the [ADC step-size data](#/data) for how resolution relates to the size of one step.

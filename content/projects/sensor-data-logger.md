---
title: Sensor data logger
summary: A microcontroller-based data logger that samples an analogue sensor once per second and outputs readings as CSV.
category: software
tech: [Microcontroller, ADC, Arduino C++, CSV]
tags: [data-logging, embedded, adc]
date: 2026-07-10
cover: assets/images/projects/sensor-logger.svg
coverAlt: Block diagram showing a sensor, a microcontroller, a CSV file and an analysis step connected by arrows.
links:
  - Related article | #/blog/reading-a-datasheet
---

## Problem statement

Understanding how a quantity changes over time needs repeatable measurements. Writing values down by hand is slow and error-prone, so this project automates sampling and storage.

## Objectives

- Read one analogue sensor at a fixed interval.
- Store each reading with a timestamp in a plain CSV format.
- Keep the code short enough to explain and reproduce.

## Tools and components

- A microcontroller board with an analogue-to-digital converter (ADC)
- One analogue sensor (for example, a temperature or light sensor)
- A computer to capture the serial output

## Implementation

The sketch reads the sensor on pin `A0` approximately once per second and prints one CSV line per sample.

```cpp
const int SENSOR_PIN = A0;
const unsigned long INTERVAL_MS = 1000;

void setup() {
    Serial.begin(9600);
    Serial.println("time_ms,raw_adc");  // CSV header
}

void loop() {
    static unsigned long previousTime = 0;
    unsigned long now = millis();

    if (now - previousTime >= INTERVAL_MS) {
        previousTime = now;

        int raw = analogRead(SENSOR_PIN);
        Serial.print(now);
        Serial.print(',');
        Serial.println(raw);
    }
}
```

The serial output can be saved to a file on the computer and opened in a spreadsheet or analysed with a script. See also the [ADC step-size data](#/data) for how resolution relates to the size of one step.

## Limitations and lessons learned

- The sampling interval is approximately one second and can vary slightly due to code execution and microcontroller timing.
- The ADC reading depends on the board's resolution, reference voltage, and sensor characteristics.
- Serial output must be captured and saved on the computer if a persistent CSV file is required.
- Adding sensor calibration and timestamps or additional metadata can improve the usefulness of the recorded data.

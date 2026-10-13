---
title: Smoothing a CSV Signal with Python
summary: Reads a logged CSV file and smooths it with a moving average, using only the Python standard library.
category: data
tech: [Python, CSV, Moving average]
tags: [data-analysis, data-logging, python]
date: 2026-06-02
cover: assets/images/projects/csv-analysis.svg
coverAlt: A noisy grey line and a smoother blue line illustrating a moving average.
---

## Problem statement

Raw readings from a sensor contain noise, which makes trends hard to see. A moving average is the simplest way to reduce short-term noise.

## Objectives

- Read readings from a CSV file.
- Compute a moving average with a configurable window.
- Keep the method simple enough to explain on one page.

## Background and theory

A moving average over a window of \(N\) samples replaces each value with the mean of the last \(N\) values:

\[
\bar{x}_i = \frac{1}{N}\sum_{k=0}^{N-1} x_{i-k}
\]

A larger \(N\) removes more noise but also delays and flattens genuine changes.

## Implementation

```python
import csv
from collections import deque

def moving_average(values, window=5):
    """Yield the average of the most recent `window` values."""
    buffer = deque(maxlen=window)
    for value in values:
        buffer.append(value)
        yield sum(buffer) / len(buffer)

with open("files/readings.csv", newline="") as handle:
    rows = list(csv.DictReader(handle))

raw = [float(row["raw_adc"]) for row in rows]
smoothed = list(moving_average(raw, window=5))
print(f"{len(raw)} samples, last smoothed value: {smoothed[-1]:.1f}")
```

The program expects a file with a header line `time_ms,raw_adc`, like the one written by the [sensor data logger](#/projects/sensor-data-logger).

## Limitations and lessons learned

- The first few outputs average fewer than \(N\) values, so they are less smooth.
- A moving average blurs sharp edges. For signals with sudden steps, a median filter may work better.

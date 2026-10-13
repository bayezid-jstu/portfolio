---
title: RC low-pass filter analysis
summary: Analyses a first-order RC low-pass filter, from the theory to the cutoff frequency, using calculated values.
category: electronics
tech: [Passive components, Frequency response, Bode plot]
tags: [rc-circuits, filters, electronics]
date: 2026-08-15
featured: true
cover: assets/images/projects/rc-filter.svg
coverAlt: Circuit diagram of a resistor in series with a capacitor to ground; the output is taken across the capacitor.
links:
  - Illustrative data and charts | #/data
  - Related article | #/blog/rc-time-constant
---

## Problem statement

Many signals contain noise at frequencies well above the signal of interest. A simple low-pass filter reduces that noise. This project analyses a first-order RC low-pass filter, consisting of a resistor and a capacitor, to understand how component values determine the cutoff frequency.

## Objectives

- Derive the gain and phase of a first-order RC low-pass filter.
- Calculate the cutoff frequency for chosen component values.
- Describe where the ideal model stops matching real components.

## Background and theory

The transfer function of the filter, with the output taken across the capacitor, is

$$
H(j\omega) = \frac{V_{out}}{V_{in}} = \frac{1}{1 + j\omega RC}
$$

Its magnitude and phase are

$$
|H| = \frac{1}{\sqrt{1 + (\omega RC)^2}},
\qquad
\phi = -\arctan(\omega RC)
$$

The **cutoff frequency** is where the gain falls to \(1/\sqrt{2}\) of its low-frequency value (approximately −3 dB):

$$
f_c = \frac{1}{2\pi RC}
$$

## Design and methodology

The values \(R = 1\,\mathrm{k\Omega}\) and \(C = 100\,\mathrm{nF}\) were chosen as common, readily available components. All values below are **calculated from the equations, not measured**.

## Tools and components

| Item | Value | Role |
|:-----|------:|:-----|
| Resistor | 1 kΩ | Series element |
| Capacitor | 100 nF | Shunt element |
| Calculator or script | — | Evaluates the equations |

## Calculations

The time constant is

$$
\tau = RC = 1000 \times 100\times10^{-9}
= 100\,\mu\mathrm{s}
$$

The cutoff frequency is

$$
f_c = \frac{1}{2\pi \times 1000 \times 100\times10^{-9}}
\approx 1.59\,\mathrm{kHz}
$$

At \(10\,\mathrm{kHz}\), the gain is

$$
|H| = \frac{1}{\sqrt{1 + (10000/1592)^2}}
\approx 0.157
$$

This corresponds to approximately −16 dB. The [Data page](#/data) plots the full calculated frequency response.

## Limitations and lessons learned

- The analysis assumes ideal components and an ideal source. Real resistors and capacitors have tolerances, and capacitors may exhibit parasitic resistance and inductance.
- Connecting a load to the output changes the effective resistance and can shift the cutoff frequency.
- A calculation predicts expected behavior, while a measurement shows the behavior of the actual circuit. A practical implementation should compare the two.

---
title: RC low-pass filter analysis
summary: A sample case study that analyses a first-order RC low-pass filter, from the theory to the cutoff frequency, using only calculated values.
category: electronics
tech: [Passive components, Frequency response, Bode plot]
tags: [rc-circuits, filters, electronics]
status: Sample
date: 2026-08-15
featured: true
sample: true
cover: assets/images/projects/rc-filter.svg
coverAlt: Circuit diagram of a resistor in series with a capacitor to ground; the output is taken across the capacitor.
links:
  - Illustrative data and charts | #/data
  - Related article | #/blog/rc-time-constant
---

> Sample case study. It shows the structure of a project page. Sections that have no content, such as **Results** and **References** here, are simply left out, so you never need to fill a section with invented text.

## Problem statement

Many signals contain noise at frequencies well above the signal of interest. A simple low-pass filter reduces that noise. This project analyses the simplest one, a resistor and a capacitor, to understand how the component values set the cutoff frequency.

## Objectives

- Derive the gain and phase of a first-order RC low-pass filter.
- Calculate the cutoff frequency for chosen component values.
- Describe where the ideal model stops matching real components.

## Background and theory

The transfer function of the filter, with the output taken across the capacitor, is

$$H(j\omega) = \frac{V_{out}}{V_{in}} = \frac{1}{1 + j\omega RC}$$

so its magnitude and phase are

$$|H| = \frac{1}{\sqrt{1 + (\omega RC)^2}}, \qquad \phi = -\arctan(\omega RC)$$

The **cutoff frequency** is where the gain falls to $1/\sqrt{2}$ of its low-frequency value (about −3 dB):

$$f_c = \frac{1}{2\pi RC}$$

## Design and methodology

The values $R = 1\,\mathrm{k\Omega}$ and $C = 100\,\mathrm{nF}$ were chosen as common, easy-to-find components. All values below are **calculated from the equations**, not measured.

## Tools and components

| Item | Value | Role |
|:-----|------:|:-----|
| Resistor | 1 kΩ | Series element |
| Capacitor | 100 nF | Shunt element |
| Calculator or script | | Evaluates the equations |

## Calculations

The time constant is

$$\tau = RC = 1000 \times 100\times10^{-9} = 100\,\mu\mathrm{s}$$

and the cutoff frequency is

$$f_c = \frac{1}{2\pi \times 1000 \times 100\times10^{-9}} \approx 1.59\,\mathrm{kHz}$$

At $10\,\mathrm{kHz}$ the gain is $1/\sqrt{1 + (10000/1592)^2} \approx 0.157$, which is about −16 dB. The [Data page](#/data) plots the full calculated response.

## Limitations and lessons learned

- The analysis assumes ideal components and an ideal source. Real resistors and capacitors have tolerance, and the capacitor has parasitic resistance and inductance.
- Connecting a load to the output changes the effective resistance and moves the cutoff frequency.
- Lesson: a calculation tells you what to expect, and a measurement tells you what you actually built. A real project would compare the two.

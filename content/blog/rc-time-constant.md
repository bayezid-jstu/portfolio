---
title: Understanding the RC time constant
date: 2026-09-27
summary: How long does a capacitor take to charge through a resistor? A short walk through the time constant, with the equation and a quick calculation.
category: electronics
tags: [rc-circuits, transients, electronics]
sample: true
---

> Sample article: it shows how a technical post can combine equations, a table, a figure and code. The explanation is standard first-order circuit theory, but replace this with your own notes and sources.

## The idea

When a voltage source is connected to a resistor and a capacitor in series, the capacitor does not charge instantly. The resistor limits the current, so the voltage across the capacitor rises gradually. The speed of this rise is described by one number, the **time constant**:

$$\tau = RC$$

where $R$ is the resistance in ohms and $C$ is the capacitance in farads. The result $\tau$ is in seconds.

## The charging equation

For a capacitor that starts empty and a source voltage $V_s$ switched on at $t = 0$, the capacitor voltage is

$$v_C(t) = V_s\left(1 - e^{-t/\tau}\right)$$

![Capacitor voltage rising towards the source voltage; it reaches 63.2 percent of the final value after one time constant.](assets/images/blog/rc-charge-curve.svg "Charging curve of an RC circuit, calculated from the equation above."){1000x600}

After one time constant the capacitor has reached about 63.2% of the source voltage. After five time constants it is within about 1% of its final value.

| Time | Fraction of $V_s$ | Percent |
|:-----|------------------:|--------:|
| 1τ | 0.632 | 63.2% |
| 2τ | 0.865 | 86.5% |
| 3τ | 0.950 | 95.0% |
| 4τ | 0.982 | 98.2% |
| 5τ | 0.993 | 99.3% |

## A quick calculation

With $R = 1\,\mathrm{k\Omega}$ and $C = 100\,\mathrm{nF}$:

$$\tau = RC = 1000 \times 100\times10^{-9} = 100\,\mu\mathrm{s}$$

The same numbers in Python:

```python
import math

R = 1_000        # ohms
C = 100e-9       # farads
tau = R * C      # seconds

print(f"tau = {tau * 1e6:.0f} microseconds")
for n in range(1, 6):
    print(f"{n} tau: {100 * (1 - math.exp(-n)):.1f} %")
```

## Why it matters

The same time constant sets the cutoff frequency of an RC low-pass filter,

$$f_c = \frac{1}{2\pi RC}$$

which is why this one product $RC$ appears all over analogue electronics. The [RC low-pass filter project](#/projects/rc-low-pass-filter) applies it.

## Things to check in real circuits

- Component tolerance: a 10% capacitor gives a 10% uncertain $\tau$.
- The source and any measuring instrument add their own resistance and capacitance.
- The equation assumes the capacitor starts empty and the source is ideal.

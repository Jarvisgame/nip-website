---
title: Evaluation
description: The throughput, latency and comparison results reported for iStack.
order: 3
---

# Evaluation

iStack prototypes were implemented on multiple platforms. The paper abstract reports the following results:

| Metric | Result |
| --- | --- |
| Forwarding throughput | 6.50 Gbps |
| Over the NDN-testbed forwarder | 16.25× |
| Forwarding latency for cached packets | 46.08% lower |

These numbers show that putting NDN in the kernel is not only feasible but also pays off in throughput and latency. Cached packets benefit in particular: in-kernel packet caching shortens the hit path.

> See the [paper](https://www.usenix.org/system/files/nsdi24-li-tianlong.pdf) for the evaluation setup, comparison methodology and full data. This site only provides a summary.

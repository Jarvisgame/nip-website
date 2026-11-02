---
title: Why put NDN in the kernel
description: Understand the design space of iStack through name resolution, address compatibility and per-packet state.
date: '2026-11-02'
tags:
  - NDN
  - Operating systems
  - Protocol stack
---

# Why put NDN in the kernel

NDN forwards by name. That single change propagates all the way into the operating system: how packets are demultiplexed, how interfaces are abstracted and where state lives all need new answers.

## The limits of a user-space forwarder

User-space forwarders are easy to iterate on and convenient for experiments. But once NDN should become a general networking capability, packets travel back and forth between the kernel and user space, and the interface between applications and the stack becomes awkward. iStack starts from a simple position: move this layer back into the kernel.

## Three constraints

1. **Name resolution belongs on the data path**: both forwarding and local delivery depend on it.
2. **Addresses do not disappear**: MAC, IP and port remain the reality of devices and links.
3. **State is not free**: per-packet state buys performance and costs memory and lookup overhead.

iStack responds with in-kernel name resolution, a two-layer face system and socket-compatible interfaces. These are not independent features but a combination shaped by the same constraints.

## One result worth noting

The paper reports 6.50 Gbps forwarding throughput, a 16.25× improvement over the NDN-testbed forwarder and 46.08% lower forwarding latency for cached packets. For an in-kernel protocol stack, these numbers say more than "it runs".

See the [NSDI '24 paper](https://www.usenix.org/conference/nsdi24/presentation/li-tianlong) for the full discussion.

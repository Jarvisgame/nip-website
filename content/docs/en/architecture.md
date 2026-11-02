---
title: System design
description: Name resolution, two-layer faces and socket-compatible interfaces.
order: 2
---

# System design

iStack aims to make NDN usable inside the OS kernel without breaking how the existing network stack is used. The paper develops three design directions.

## Name resolution architecture

Name resolution serves two purposes at once:

- **Network-layer forwarding**: deciding where a packet should go based on its name.
- **Local demultiplexing**: delivering an incoming packet to the right local consumer.

Keeping both on the kernel data path is a prerequisite for a purely name-based stack.

## Two-layer face system

A face is the NDN abstraction that connects applications to the network. iStack uses a two-layer face system to provide a uniform abstraction over address-based interfaces such as MAC, IP and port, so name semantics can sit on top of the existing kernel network architecture.

## Socket-compatible interfaces

To preserve how applications use the network, iStack designs socket-compatible interfaces. The programming model of the existing stack remains available while NDN capabilities are introduced incrementally.

## Compact forwarding data structures

Per-packet state characterises the NDN data plane and drives both performance and memory cost. iStack uses compact forwarding data structures to balance fast packet processing with a low memory footprint.

> See the [NSDI '24 paper](https://www.usenix.org/conference/nsdi24/presentation/li-tianlong) for the full design and implementation.

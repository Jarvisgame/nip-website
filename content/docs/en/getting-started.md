---
title: Overview
description: What this NIP site is about and which iStack research it follows.
order: 1
---

# Overview

NIP is a research site built around **iStack**, an NSDI '24 paper that takes the Named Data Networking (NDN) protocol stack into the operating system kernel.

## From host-centric to data-centric

NDN forwards by name rather than address and keeps per-packet state in the data plane. This makes caching, mobility and multipath forwarding more natural, but it also places new demands on the protocol stack.

Many NDN forwarders cover different scenarios, yet there is no general-purpose network stack integrated with the operating system. iStack aims to fill that gap.

## Three problems that must be solved together

1. **In-kernel name resolution**: packet demultiplexing needs a name resolution architecture.
2. **Compatibility with address-based networking**: the kernel is built around MAC, IP and port.
3. **Balancing performance and resources**: per-packet state is not free.

iStack answers with an in-kernel name resolution architecture, a two-layer face system and socket-compatible interfaces.

## What you will find here

- **Docs**: background, architecture and evaluation notes.
- **Blog**: notes and observations around the same topics.

> This page is a summary of the paper abstract. For technical details, read the [paper](https://www.usenix.org/system/files/nsdi24-li-tianlong.pdf).

<p align="center">
  <h1 align="center">BlackV C2</h1>
  <h4 align="center">Next-generation adversary emulation & command-and-control framework</h4>
  <p align="center">
  <img src="UI/public/favicon.png" alt="Project Banner" width="700"/>
  </p>
  <h6 align="center">Built for advanced red teams and security researchers</h6>
</p>

<p align="center">

<a href="https://opensource.org/licenses/MIT">
  <img src="https://img.shields.io/badge/license-MIT-red.svg">
</a>

<a href="#">
  <img src="https://img.shields.io/badge/maintained-yes-brightgreen.svg">
</a>

<a href="#">
  <img src="https://img.shields.io/badge/contributions-welcome-brightgreen.svg">
</a>

<a href="#">
  <img src="https://img.shields.io/badge/platform-Windows-blue.svg">
</a>

</p>

<p align="center">
  <a href="#introduction">Introduction</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#features">Features</a> •
  <a href="#installation">Installation</a> •
  <a href="#usage">Usage</a> •
  <a href="#disclaimer">Disclaimer</a>
</p>

---

# Introduction

**BlackV C2** is a modern **Command & Control (C2) framework** designed for advanced red-team operations, adversary emulation, and security research.

The project focuses on:

- **Stealth**
- **Automation**
- **Operator usability**
- **Advanced detection evasion**

BlackV combines modern technologies and offensive techniques to create a **powerful and extensible C2 ecosystem** capable of supporting both small red teams and enterprise-scale operations.

The framework integrates:

- **Nim-based beacons** for low-footprint agents
- **Go backend infrastructure** for high-performance networking
- **React dashboard** for real-time operational control
- **Automated attack mapping using MITRE ATT&CK**

The goal of BlackV is to provide a **next-generation open-source C2 platform that rivals tools like Mythic, Sliver, Havoc, and Cobalt Strike**.

---

# Architecture

BlackV follows a **modular micro-service architecture**.


### Core Components

**Beacon (Agent)**  
- Written in **Nim**
- Cross-platform
- Low detection footprint
- In-memory execution

**Backend Server**

- Written in **Go**
- Handles:
  - Beacon communications
  - tasking
  - operator authentication
  - data storage
  - WebSocket event streaming

**Operator Interface**

- Built with **React + TypeScript**
- Provides:

- real-time sessions
- tasking interface
- attack visualization
- telemetry dashboards

---

# Features

### Beacon Capabilities

- Encrypted C2 communications
- Sleep + jitter configuration
- Dynamic task execution
- Reflective payload execution

---

### Evasion Techniques

BlackV integrates multiple evasion techniques:

- Sleep obfuscation (**Ekko / Foliage style**)
- ETW patching
- AMSI bypass

---

### C2 Communication

BlackV supports **customizable malleable C2 profiles**:

- HTTP / HTTPS
- configurable sleep & jitter

---

### Operator Collaboration

Designed for team operations:

- multi-operator environment
- session sharing
- real-time event streaming
- audit logs

---

# Installation

Clone the repository:

```bash
git clone https://github.com/RaghavanSV/BlackV.git
cd BlackV
```

To install nim and nimble follow the steps in the link:

[nim's official tutorial](https://nim-lang.github.io/nimble/install-nim.html)

To install nim packages:

```bash
cd BlackV/Beacon
nimble install
```

To install go:

[go's official release page](https://go.dev/dl/)

To install go packages:

```bash
cd BlackV/Backend
go mod tidy
```

---

# Usage

First, run the backend server by:

```bash
cd BlackV/Backend/cmd/server
go run main.go
```

By default the backend server runs in 8080.

Now run the Frontend by:

```bash
cd BlackV/UI
npm run dev
```

If you face any script execution issue in powerhsell, use:

```ps1
powershell -ep bypass
```

By default the Frontend run in 8081.

To use the pre-built client or beacon:

```bash
cd Beacon/src/bin
```

To compile client or beacon manually:

```bash
cd Beacon/src
nim c main.nim
```

For optimised compilation use the scripts:

```ps1
.\Beacon\build.ps1
```

```bash
cd Beacon
./build.sh
```

The client configuration is in:

```bash
Beacon/src/config.nim
```

---

# Disclaimer

This project is intended for educational purposes, security research, and authorized red-team operations only.

Unauthorized use against systems without explicit permission is illegal.

The author assume no responsibility for misuse or damage caused by this tool.




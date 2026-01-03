# BlackV C2 – Advanced Windows Red Team Research Framework

> **BlackV C2** is an advanced Windows-focused command-and-control research framework designed to explore modern post-exploitation tradecraft, NT-native execution paths, and EDR/AV evasion techniques for **educational, defensive research, and adversary emulation purposes**.

---

## ⚠️ Disclaimer

This project is intended **strictly for educational, defensive security research, red team simulations, and malware analysis lab environments**.  
Do **NOT** deploy or use this framework on systems you do not own or have explicit authorization to test.

The author assumes **no responsibility** for misuse.

---

## 🧠 Project Goals

BlackV C2 is built to:

- Understand **Windows internals** at the NT syscall level
- Research **modern EDR detection surfaces**
- Implement **low-noise, minimal Win32 dependency** techniques
- Build a modular foundation for **future C2 research**

---

## ✅ Current Feature Set (Completed)

### 🔹 Native & Low-Level Execution
- ✔ **Direct syscalls (NTDLL-independent)**
- ✔ Runtime syscall resolution
- ✔ Win32 API bypass paths

### 🔹 Process Injection Techniques
- ✔ Remote process memory allocation
- ✔ `NtWriteVirtualMemory`–based payload staging
- ✔ Remote thread creation
- ✔ Clean handle and memory lifecycle management

### 🔹 Defensive Telemetry Bypasses
- ✔ **AMSI patching**
- ✔ **ETW patching**
- ✔ Minimal API footprint to reduce telemetry noise

### 🔹 Execution Philosophy
- ✔ Byte-accurate memory management
- ✔ Explicit size tracking (no implicit buffers)
- ✔ NTSTATUS-based error handling
- ✔ No reliance on high-level wrappers

---

## 🛠️ Tech Stack

| Component | Technology |
|--------|-----------|
| Language | **Nim** |
| Windows Bindings | `winim` |
| APIs Used | NT Native APIs |
| Target OS | Windows x64 |
| Focus | Red Team / Malware Research |

---

## 📂 Project Structure (High Level)

```text
BlackV/
├── core/
│   ├── syscalls/        # Direct syscall logic
│   ├── memory/          # Allocation & protection
│   └── injection/       # Process injection primitives
│
├── evasion/
│   ├── amsi/            # AMSI bypass research
│   └── etw/             # ETW patching research
│
├── utils/
│   ├── process/         # PID, handles, process helpers
│   └── nt/              # NTSTATUS & structures
│
└── README.md

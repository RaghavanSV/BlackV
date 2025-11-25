# ----------------------------------------------------------
# BlackV C2 — Advanced Nim Beacon Nimble File
# ----------------------------------------------------------

version       = "0.7.0"
author        = "BlackV Offensive Engineering Team"
description   = "Advanced Cross-Platform Stealth Beacon for BlackV C2"
license       = "MIT"

# Source directory for Nim code
srcDir        = "src"

# Output binary name
bin           = @["beacon"]

# These options are passed when running `nimble build`
# You can override or extend them in build scripts.

# Default build options for RELEASE builds
# -d:release         Optimizes heavily
# --opt:size         Optimizes for binary size
# --passL:-s         Strips extra symbols from final binary
# --strip            Removes debug symbols
# --gc:orc           ORC garbage collector (safe)
# --stackTrace:off   Removes stack traces (OPSEC)
# --lineTrace:off    No line traces
# -d:danger          Removes runtime safety checks (smaller binary)
# --nimcache:./.nimcache   Custom Nim cache location (prevents artifact leakage)

const buildOptions = [
  "-d:release",
  "--opt:size",
  "--passL:-s",
  "--strip",
  "--gc:orc",
  "--stackTrace:off",
  "--lineTrace:off",
  "-d:danger",
  "--nimcache:./.nimcache"
]

# ----------------------------------------------------------
# PLATFORM TARGET RULES
# (Allows cross-compilation settings based on OS)
# ----------------------------------------------------------

task buildWindows, "Build Windows 64-bit Beacon":
  exec "nim c " &
       buildOptions.join(" ") &
       " --cpu:amd64 --os:windows -o:beacon_win64.exe src/main.nim"

task buildLinux, "Build Linux 64-bit Beacon":
  exec "nim c " &
       buildOptions.join(" ") &
       " --cpu:amd64 --os:linux -o:beacon_linux src/main.nim"

task buildMac, "Build macOS Beacon":
  exec "nim c " &
       buildOptions.join(" ") &
       " --cpu:amd64 --os:macosx -o:beacon_macos src/main.nim"

# ----------------------------------------------------------
# ADVANCED FEATURES (Optional Future Dependencies)
# ----------------------------------------------------------

requires "nimcrypto >= 0.6.0"    # AES, ChaCha, SHA, HMAC
requires "winim >= 3.9.0"        # Windows API access
requires "jsony >= 1.2.0"        # Fast JSON decode/encode
requires "zippy >= 1.0.0"        # Compression features for covert channels

# Future features (enable when needed)
# requires "nimDNA"              # In-memory DLL loading
# requires "fusion"              # Advanced async networking
# requires "nimpromptu"          # Template engine if needed

# ----------------------------------------------------------
# CLEAN TASK
# ----------------------------------------------------------

task clean, "Clean Nim cache and builds":
  exec "rm -rf .nimcache"
  exec "rm -f beacon beacon.exe beacon_win64.exe beacon_linux beacon_macos"
  echo "Cleaned build artifacts."

# ----------------------------------------------------------
# DEFAULT BUILD TASK
# ----------------------------------------------------------

task build, "Build default beacon":
  exec "nim c " &
       buildOptions.join(" ") &
       " -o:beacon src/main.nim"


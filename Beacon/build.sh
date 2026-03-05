#!/bin/bash
GREEN="\033[1;32m"
CYAN="\033[1;36m"
NC="\033[0m"

OUTDIR="build"
mkdir -p $OUTDIR

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

COMMON_FLAGS="-d:release --opt:size --passL:-s --gc:orc --stackTrace:off --lineTrace:off -d:danger --nimcache:./.nimcache"

echo -e "${CYAN}[+] Building BlackV Nim Beacon...${NC}"

# Linux Build
echo -e "${GREEN}[*] Building Linux x64...${NC}"

nim c $COMMON_FLAGS \
    --cpu:amd64 \
    --os:linux \
    -o:$OUTDIR/beacon_linux_$TIMESTAMP src/main.nim

# Windows Build
echo -e "${GREEN}[*] Building Windows x64...${NC}"

nim c $COMMON_FLAGS \
    --cpu:amd64 \
    --os:windows \
    -o:$OUTDIR/beacon_win64_$TIMESTAMP.exe \
    src/main.nim

nim c $COMMON_FLAGS \
    --cpu:i386 \
    --os:windows \
    -o:$OUTDIR/beacon_win32_$TIMESTAMP.exe \
    src/main.nim



# Clean Nim Cache
rm -rf .nimcache

echo -e "${CYAN}[+] Build complete. Files saved to: $OUTDIR/${NC}"

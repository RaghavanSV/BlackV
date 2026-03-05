# Color definitions
$Green = "Green"
$Cyan = "Cyan"

$OUTDIR = "build"
New-Item -ItemType Directory -Force -Path $OUTDIR | Out-Null

$TIMESTAMP = Get-Date -Format "yyyyMMdd_HHmmss"

$COMMON_FLAGS = @(
    "-d:release",
    "--opt:size",
    "--passL:-s",
    "--gc:orc",
    "--stackTrace:off",
    "--lineTrace:off",
    "-d:danger",
    "--nimcache:./.nimcache"
)

Write-Host "[+] Building BlackV Nim Beacon..." -ForegroundColor $Cyan

# Linux Build
Write-Host "[*] Building Linux x64..." -ForegroundColor $Green

nim c @COMMON_FLAGS `
    --cpu:amd64 `
    --os:linux `
    -o:"$OUTDIR/beacon_linux_$TIMESTAMP" `
    src/main.nim

# Windows Build
Write-Host "[*] Building Windows x64..." -ForegroundColor $Green

nim c @COMMON_FLAGS `
    --cpu:amd64 `
    --os:windows `
    -o:"$OUTDIR/beacon_win64_$TIMESTAMP.exe" `
    src/main.nim

Write-Host "[*] Building Windows x86..." -ForegroundColor $Green

nim c @COMMON_FLAGS `
    --cpu:i386 `
    --os:windows `
    -o:"$OUTDIR/beacon_win32_$TIMESTAMP.exe" `
    src/main.nim

# Clean Nim Cache
if (Test-Path .nimcache) {
    Remove-Item -Recurse -Force .nimcache
}

Write-Host "[+] Build complete. Files saved to: $OUTDIR/" -ForegroundColor $Cyan
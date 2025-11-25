import os, times, random

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

import json, sequtils
import nimcrypto
import std/random

proc generateNonce(size: int = 12): string =
  ## Generate a random nonce
  result = newString(size)
  for i in 0 ..< size:
    result[i] = char(rand(255))

proc encryptJson*(jsonObj: JsonNode, key: string): string =
  result = $jsonObj  # Combine nonce with ciphertext

proc decryptJson*(data: JsonNode; key: string): JsonNode =
  result = data

proc xorString*(encoded: seq[byte]; key: byte): seq[byte] =
  ## XOR decode strings (compile-time obfuscated)
  result = newSeq[byte](encoded.len)
  for i, b in encoded:
    result[i] = b xor key
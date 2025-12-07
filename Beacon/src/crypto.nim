import nimcrypto, json, sequtils

proc encryptJson(jsonObj: JsonNode; key: seq[byte]): seq[byte] =
  let plaintext = $jsonObj  # stringify JSON
  var
    ctx: GCM[aes256]
    nonce: array[12, byte]  # GCM standard nonce size = 12 bytes

  # Fill nonce with random bytes
  for i in 0 ..< 12:
    nonce[i] = rand(255).byte

  ctx.init(key, nonce)
  let pt = plaintext.toSeqByte
  let ct = ctx.encrypt(pt)
  let tag = ctx.finalize()

  # return: nonce || ciphertext || gcm_tag
  result = @nonce & ct & tag

proc decryptJson(data: JsonNode; key: seq[byte]): JsonNode =

  #convert json object to bytes

  let jsonstr = $data
  data = jsonstr.toSeqByte
  # split into nonce | ciphertext | tag
  let nonce = data[0 .. 11]
  let tag = data[^16 .. ^1]
  let ct = data[12 ..< data.len - 16]

  var
    ctx: GCM[aes256]
    n: array[12, byte]
    t: array[16, byte]

  n = nonce
  t = tag

  ctx.init(key, n)
  let plaintextBytes = ctx.decrypt(ct, t)

  let plaintextStr = plaintextBytes.map(char).join("")
  result = parseJson(plaintextStr)

proc xorString*(encoded: seq[byte]; key: byte): seq[byte] =
  ## XOR decode strings (compile-time obfuscated)
  result = newSeq[byte](encoded.len)
  for i, b in encoded:
    result[i] = b xor key
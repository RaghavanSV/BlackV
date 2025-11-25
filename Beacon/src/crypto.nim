import nimcrypto

proc encrypt*(data: string, key: string): string =
  let ctx = newGCM(AES128)
  let plaintext = data.toBytes
  var ciphertext: seq[byte]
  ctx.init(key.toBytes)
  ciphertext = ctx.encrypt(plaintext)
  return ciphertext.toHex

proc decrypt*(data: string, key: string): string =
  let ctx = newGCM(AES128)
  let ciphertext = hexToSeqByte(data)
  ctx.init(key.toBytes)
  let plain = ctx.decrypt(ciphertext)
  return plain.toString

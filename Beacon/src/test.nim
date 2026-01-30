import nimcrypto
import std/strutils

let key = "0123456789abcdef0123456789abcdef".toHex # 32 bytes
let iv = "abcdef0123456789abcdef0123456789".toHex # 16 bytes
let plaintext = "This is a secret message."

var cipher = newAES256(key, iv)
let ciphertext = cipher.encrypt(plaintext.toOpenArray(0, plaintext.len - 1))

echo "Ciphertext: ", ciphertext.toHex
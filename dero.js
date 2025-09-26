
const dero1daycontract = `Function Initialize(receiver String) Uint64
1 STORE("owner",SIGNER())
2 IF IS_ADDRESS_VALID(ADDRESS_RAW(receiver)) THEN GOTO 4
3 RETURN 0
4 STORE("receiver",receiver)
5 STORE("deadline",0) 
6 STORE("deposited",0) 
7 RETURN 0
End Function
Function StartSwap(hash String) Uint64
1 IF DEROVALUE() == 0 THEN GOTO 7
2 IF EXISTS("hash")==1 THEN GOTO 7
3 STORE("hash",hash)
4 STORE("deadline",BLOCK_TIMESTAMP() + 86400)
5 STORE("deposited",DEROVALUE())
6 RETURN 0
7 RETURN 1
End Function
Function Withdraw(key String) Uint64 
1 IF ADDRESS_RAW(LOAD("receiver"))==SIGNER() THEN GOTO 3
2 RETURN 1
3 IF LOAD("deadline")>BLOCK_TIMESTAMP() THEN GOTO 5
4 RETURN 1
5 IF STRLEN(key)<=32 THEN GOTO 7
6 RETURN 1
7 IF LOAD("hash")==HEX(SHA256(key)) THEN GOTO 9
8 RETURN 1
9 SEND_DERO_TO_ADDRESS(SIGNER(),LOAD("deposited"))
10 STORE("key",key) 
11 RETURN 0
End Function
Function Refund() Uint64 
1 IF LOAD("owner")==SIGNER() THEN GOTO 3
2 RETURN 1
3 IF LOAD("deadline")<BLOCK_TIMESTAMP() THEN GOTO 5
4 RETURN 1
5 SEND_DERO_TO_ADDRESS(SIGNER(),LOAD("deposited"))
6 RETURN 0
End Function`;

const dero2daycontract = `Function Initialize(receiver String) Uint64
1 STORE("owner",SIGNER())
2 IF IS_ADDRESS_VALID(ADDRESS_RAW(receiver)) THEN GOTO 4
3 RETURN 0
4 STORE("receiver",receiver)
5 STORE("deadline",0) 
6 STORE("deposited",0) 
7 RETURN 0
End Function
Function StartSwap(hash String) Uint64
1 IF DEROVALUE() == 0 THEN GOTO 7
2 IF EXISTS("hash")==1 THEN GOTO 7
3 STORE("hash",hash)
4 STORE("deadline",BLOCK_TIMESTAMP() + 172800)
5 STORE("deposited",DEROVALUE())
6 RETURN 0
7 RETURN 1
End Function
Function Withdraw(key String) Uint64 
1 IF ADDRESS_RAW(LOAD("receiver"))==SIGNER() THEN GOTO 5
2 RETURN 1
5 IF STRLEN(key)<=32 THEN GOTO 7
6 RETURN 1
7 IF LOAD("hash")==HEX(SHA256(key)) THEN GOTO 9
8 RETURN 1
9 SEND_DERO_TO_ADDRESS(SIGNER(),LOAD("deposited"))
11 RETURN 0
End Function
Function Refund() Uint64 
1 IF LOAD("owner")==SIGNER() THEN GOTO 3
2 RETURN 1
3 IF LOAD("deadline")<BLOCK_TIMESTAMP() THEN GOTO 5
4 RETURN 1
5 SEND_DERO_TO_ADDRESS(SIGNER(),LOAD("deposited"))
6 RETURN 0
End Function`;


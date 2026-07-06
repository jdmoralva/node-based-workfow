from pwdlib import PasswordHash

_PASSWORD_HASHER = PasswordHash.recommended()
_DUMMY_PASSWORD_HASH = _PASSWORD_HASHER.hash("risk-viewer-dummy-password")


def hash_password(password: str) -> str:
    return _PASSWORD_HASHER.hash(password)


def verify_password(password: str, stored_hash: str) -> bool:
    return _PASSWORD_HASHER.verify(password, stored_hash)


def verify_against_dummy_hash(password: str) -> bool:
    return _PASSWORD_HASHER.verify(password, _DUMMY_PASSWORD_HASH)

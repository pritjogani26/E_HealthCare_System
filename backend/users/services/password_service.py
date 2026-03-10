import bcrypt


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode()


def verify_password(password: str, hashed_password: str) -> bool:
    print("In verify_password")
    return bcrypt.checkpw(password.encode("utf-8"), hashed_password.encode("utf-8"))

import secrets
import string


def generate_temporary_password(length: int = 12) -> str:
    characters = string.ascii_uppercase + string.digits

    return "".join(
        secrets.choice(characters)
        for _ in range(length)
    )
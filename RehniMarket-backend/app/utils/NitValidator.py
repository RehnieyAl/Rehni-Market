import re

_DV_WEIGHTS = [71, 67, 59, 53, 47, 43, 41, 37, 29, 23, 19, 17, 13, 7, 3]


def clean_nit(nit: str) -> str:
    return re.sub(r"\D", "", nit or "")


def calculate_nit_dv(nit: str) -> int:
    padded = nit.zfill(15)
    total = sum(int(digit) * weight for digit, weight in zip(padded, _DV_WEIGHTS))

    remainder = total % 11

    return remainder if remainder in (0, 1) else 11 - remainder


def validate_nit_dv(nit: str, dv: str) -> bool:
    nit_digits = clean_nit(nit)

    if not nit_digits or not dv.isdigit():
        return False

    return calculate_nit_dv(nit_digits) == int(dv)

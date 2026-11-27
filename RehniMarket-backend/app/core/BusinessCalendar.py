"""Calendario de Colombia para las liquidaciones: festivos oficiales (Ley 51 de 1983), días hábiles,
fecha de hoy y mes calendario en America/Bogota (plazo de consignación y cierre mensual)."""

from datetime import date, datetime, timedelta, timezone
from functools import lru_cache
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

BOGOTA_TZ_NAME = "America/Bogota"

try:
    BOGOTA_TZ = ZoneInfo(BOGOTA_TZ_NAME)
except ZoneInfoNotFoundError:
    # La imagen python:slim puede no traer tzdata; Colombia es UTC-5 fijo, sin horario de verano.
    BOGOTA_TZ = timezone(timedelta(hours=-5), BOGOTA_TZ_NAME)

_FIXED_HOLIDAYS = ((1, 1), (5, 1), (7, 20), (8, 7), (12, 8), (12, 25))

# Festivos que la Ley 51 de 1983 traslada al lunes siguiente cuando no caen en lunes.
_MOVABLE_HOLIDAYS = ((1, 6), (3, 19), (6, 29), (8, 15), (10, 12), (11, 1), (11, 11))

# Días desde el domingo de Pascua: Ascensión, Corpus Christi y Sagrado Corazón (también trasladables).
_MOVABLE_EASTER_OFFSETS = (39, 60, 68)

# Jueves y Viernes Santo: se celebran el día exacto.
_FIXED_EASTER_OFFSETS = (-3, -2)


def _easter_sunday(year: int) -> date:
    """Domingo de Pascua del calendario gregoriano (algoritmo anónimo de Meeus/Jones/Butcher)."""

    a = year % 19
    b, c = divmod(year, 100)
    d, e = divmod(b, 4)
    f = (b + 8) // 25
    g = (b - f + 1) // 3
    h = (19 * a + b - d - g + 15) % 30
    i, k = divmod(c, 4)
    l = (32 + 2 * e + 2 * i - h - k) % 7
    m = (a + 11 * h + 22 * l) // 451
    month, day = divmod(h + l - 7 * m + 114, 31)
    return date(year, month, day + 1)


def _next_monday(day: date) -> date:
    return day + timedelta(days=(7 - day.weekday()) % 7)


@lru_cache(maxsize=64)
def colombian_holidays(year: int) -> frozenset[date]:
    easter = _easter_sunday(year)

    holidays = {date(year, month, day) for month, day in _FIXED_HOLIDAYS}
    holidays.update(_next_monday(date(year, month, day)) for month, day in _MOVABLE_HOLIDAYS)
    holidays.update(easter + timedelta(days=offset) for offset in _FIXED_EASTER_OFFSETS)
    holidays.update(_next_monday(easter + timedelta(days=offset)) for offset in _MOVABLE_EASTER_OFFSETS)

    return frozenset(holidays)


def is_business_day(day: date) -> bool:
    return day.weekday() < 5 and day not in colombian_holidays(day.year)


def nth_business_day_after(day: date, count: int) -> date:
    """El `count`-ésimo día hábil posterior a `day` (sin contar `day`)."""

    current = day
    remaining = count
    while remaining > 0:
        current += timedelta(days=1)
        if is_business_day(current):
            remaining -= 1
    return current


def today_bogota() -> date:
    return datetime.now(BOGOTA_TZ).date()


def bogota_month_start(moment: datetime) -> date:
    """Primer día del mes de Bogotá de un instante con zona horaria (equivale a OrderRepository.bogota_month)."""

    return moment.astimezone(BOGOTA_TZ).date().replace(day=1)

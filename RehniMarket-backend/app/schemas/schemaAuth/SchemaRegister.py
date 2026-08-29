from typing import Annotated
import re
from fastapi import Form
from pydantic import BaseModel, EmailStr, field_validator, model_validator

from app.utils.NitValidator import validate_nit_dv

class CreateUserRequest(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    tell: str

    @classmethod
    def as_form(
        cls,
        full_name: Annotated[str, Form(...)],
        email: Annotated[EmailStr, Form(...)],
        password: Annotated[str, Form(...)],
        tell: Annotated[str, Form(...)],
    ):
        return cls(
            full_name=full_name,
            email=email,
            password=password,
            tell=tell,
        )

    @field_validator("full_name")
    @classmethod
    def validate_full_name(cls, value: str):
        if len(value.strip()) < 3:
            raise ValueError(
                "El nombre completo debe tener al menos 3 caracteres."
            )

        if len(value) > 60:
            raise ValueError(
                "El nombre completo no debe exceder los 60 caracteres."
            )

        return value.strip()

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str):
        if len(value) < 8:
            raise ValueError(
                "La contraseña debe tener al menos 8 caracteres."
            )

        if not re.search(r"[A-Z]", value):
            raise ValueError(
                "La contraseña debe contener al menos una letra mayúscula."
            )

        if not re.search(r"[a-z]", value):
            raise ValueError(
                "La contraseña debe contener al menos una letra minúscula."
            )

        if not re.search(r"\d", value):
            raise ValueError(
                "La contraseña debe contener al menos un número."
            )

        return value

    @field_validator("tell")
    @classmethod
    def validate_tell(cls, value: str):
        if not value.isdigit():
            raise ValueError(
                "El número de teléfono solo puede contener números."
            )

        if len(value) != 10:
            raise ValueError(
                "El número de teléfono debe tener exactamente 10 dígitos."
            )

        return value


class CreateCompanyRequest(BaseModel):
    company_name: str
    company_address: str
    company_nit: str
    company_nit_dv: str

    @classmethod
    def as_form(
        cls,
        company_name: Annotated[str, Form(...)],
        company_address: Annotated[str, Form(...)],
        company_nit: Annotated[str, Form(...)],
        company_nit_dv: Annotated[str, Form(...)],
    ):
        return cls(
            company_name=company_name,
            company_address=company_address,
            company_nit=company_nit,
            company_nit_dv=company_nit_dv,
        )

    @field_validator("company_name")
    @classmethod
    def validate_company_name(cls, value: str):
        if len(value.strip()) < 3:
            raise ValueError(
                "El nombre de la empresa debe tener al menos 3 caracteres."
            )

        if len(value) > 50:
            raise ValueError(
                "El nombre de la empresa no debe exceder los 50 caracteres."
            )

        return value.strip()

    @field_validator("company_address")
    @classmethod
    def validate_company_address(cls, value: str):
        if len(value.strip()) < 5:
            raise ValueError(
                "La dirección debe tener al menos 5 caracteres."
            )

        return value.strip()

    @field_validator("company_nit")
    @classmethod
    def validate_company_nit(cls, value: str):
        if not value.isdigit():
            raise ValueError(
                "El NIT solo puede contener números."
            )

        if len(value) < 5:
            raise ValueError(
                "El NIT debe tener al menos 5 caracteres."
            )

        return value

    @field_validator("company_nit_dv")
    @classmethod
    def validate_company_nit_dv(cls, value: str):
        if not value.isdigit():
            raise ValueError(
                "El dígito de verificación solo puede contener números."
            )

        if len(value) != 1:
            raise ValueError(
                "El dígito de verificación debe tener exactamente un dígito."
            )

        return value

    @model_validator(mode="after")
    def validate_nit_check_digit(self):
        if not validate_nit_dv(self.company_nit, self.company_nit_dv):
            raise ValueError(
                "El dígito de verificación no coincide con el NIT ingresado."
            )

        return self
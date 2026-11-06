"""Conexión SMTP configurable (SMTP_HOST, SMTP_PORT, SMTP_SECURITY).

No abre conexiones reales: sustituye smtplib.SMTP / SMTP_SSL por dobles que
registran cómo se llamaron.
"""

import smtplib

from app.Config import config
from app.services.email import EmailService


class _FakeSMTP:
    instances: list["_FakeSMTP"] = []

    def __init__(self, host, port, timeout=None):
        self.host, self.port, self.timeout = host, port, timeout
        self.started_tls = False
        self.closed = False
        type(self).instances.append(self)

    def starttls(self):
        self.started_tls = True

    def close(self):
        self.closed = True


class _FakeSMTPSSL(_FakeSMTP):
    instances: list["_FakeSMTP"] = []


def _patch(monkeypatch, host, port, security):
    _FakeSMTP.instances.clear()
    _FakeSMTPSSL.instances.clear()
    monkeypatch.setattr(smtplib, "SMTP", _FakeSMTP)
    monkeypatch.setattr(smtplib, "SMTP_SSL", _FakeSMTPSSL)
    monkeypatch.setattr(config, "SMTP_HOST", host)
    monkeypatch.setattr(config, "SMTP_PORT", port)
    monkeypatch.setattr(config, "SMTP_SECURITY", security)


def test_default_is_gmail_587_starttls():
    # Sin variables SMTP_* en el entorno de pruebas: lo de siempre.
    assert config.SMTP_HOST == "smtp.gmail.com"
    assert config.SMTP_PORT == 587
    assert config.SMTP_SECURITY == "starttls"


def test_starttls_connects_plain_then_upgrades(monkeypatch):
    _patch(monkeypatch, "smtp-relay.brevo.com", 2525, "starttls")

    server = EmailService._open_smtp()

    assert isinstance(server, _FakeSMTP) and not isinstance(server, _FakeSMTPSSL)
    assert (server.host, server.port) == ("smtp-relay.brevo.com", 2525)
    assert server.started_tls is True
    assert server.timeout == config.SMTP_TIMEOUT


def test_ssl_uses_smtp_ssl_without_starttls(monkeypatch):
    _patch(monkeypatch, "smtp.gmail.com", 465, "ssl")

    server = EmailService._open_smtp()

    assert isinstance(server, _FakeSMTPSSL)
    assert (server.host, server.port) == ("smtp.gmail.com", 465)
    assert server.started_tls is False


def test_starttls_failure_closes_socket(monkeypatch):
    _patch(monkeypatch, "smtp.example.com", 587, "starttls")

    def boom(self):
        raise smtplib.SMTPNotSupportedError("STARTTLS no soportado")

    monkeypatch.setattr(_FakeSMTP, "starttls", boom)

    try:
        EmailService._open_smtp()
        raise AssertionError("debía propagar el error")
    except smtplib.SMTPNotSupportedError:
        pass
    assert _FakeSMTP.instances[-1].closed is True

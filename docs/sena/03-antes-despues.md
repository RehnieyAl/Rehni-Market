# 03 – Antes y después (paso 4 del taller, Guía N°08)

## Resumen

| N° | Regla | Rama | Commit | PR | Quality Gate del PR |
|---|---|---|---|---|---|
| 1 | `pythonbugs:S2259` | `fix/sonar-bugs` | [`18b3d61`](https://github.com/RehnieyAl/Rehni-Market/commit/18b3d61a9cf120dd060f5483ae813b9ac36fa3de) | [#27](https://github.com/RehnieyAl/Rehni-Market/pull/27) | **Passed** |
| 2 | `typescript:S9383` | `fix/sonar-bugs` | [`cb29acd`](https://github.com/RehnieyAl/Rehni-Market/commit/cb29acde989ba322cab42a3b2d8477a83d388b26) | [#27](https://github.com/RehnieyAl/Rehni-Market/pull/27) | **Passed** |
| 3 | `githubactions:S7637` | `fix/sonar-vulnerabilidad` | [`a03532c`](https://github.com/RehnieyAl/Rehni-Market/commit/a03532c61f679c94097d7ff7a3863d5e6b61912f) | [#28](https://github.com/RehnieyAl/Rehni-Market/pull/28) | **Passed** |
| 4 | `python:S6903` | `refactor/sonar-code-smells` | [`89f50ce`](https://github.com/RehnieyAl/Rehni-Market/commit/89f50ceac6f7f91284b032d374c4eb925f61cb3e) | [#29](https://github.com/RehnieyAl/Rehni-Market/pull/29) | **Passed** |
| 5 | `typescript:S6853` | `refactor/sonar-code-smells` | [`99925f2`](https://github.com/RehnieyAl/Rehni-Market/commit/99925f25412b2c5049427b14bd825a8fea76f9fa) | [#29](https://github.com/RehnieyAl/Rehni-Market/pull/29) | **Passed** |

Las tres ramas salen de `develop` (`88d3e31`) y tienen un commit por hallazgo. El código "antes" es el del tag `sonar-antes` (`f1b490b`, línea base del análisis).

**Validación local de cada rama antes del push:**

| Rama | Backend (`ruff check .` · `pytest`) | Frontend (`eslint` · `typecheck` · `vitest`) |
|---|---|---|
| `fix/sonar-bugs` | OK · 319 passed, 6 xfailed | 0 errores / 11 warnings (límite de CI) · OK · 184 passed |
| `fix/sonar-vulnerabilidad` | no aplica (solo cambia el workflow; YAML validado) | no aplica |
| `refactor/sonar-code-smells` | OK · 319 passed, 6 xfailed | 0 errores / 11 warnings · OK · 184 passed |

---

## N°1 · Bug · `pythonbugs:S2259` · acceso a un valor posiblemente `None`

- **Archivo del issue:** `RehniMarket-backend/app/services/authentication/CertificateUpdateService.py:38`
- **Archivo corregido:** `RehniMarket-backend/app/core/Exceptions.py`
- **Código antes:** [CertificateUpdateService.py#L32-L38](https://github.com/RehnieyAl/Rehni-Market/blob/sonar-antes/RehniMarket-backend/app/services/authentication/CertificateUpdateService.py#L32-L38) · [Exceptions.py#L1-L16](https://github.com/RehnieyAl/Rehni-Market/blob/sonar-antes/RehniMarket-backend/app/core/Exceptions.py#L1-L16)
- **Cambios en el PR:** [#27 · Files changed](https://github.com/RehnieyAl/Rehni-Market/pull/27/files)

> **¿Por qué se marca en un archivo y se corrige en otro?** Sonar reporta el síntoma donde se usa `company` (línea 38 de `CertificateUpdateService.py`), porque no sabe que `api_error()` nunca retorna.
> La causa está en la firma de `api_error()` en `Exceptions.py`. Al declararla `-> NoReturn`, el analizador entiende que después de la línea 37 `company` ya no puede ser `None`, y por eso `CertificateUpdateService.py` no necesita cambios.

**Antes**

```python
# CertificateUpdateService.py
company = user.company

if role != "company" or company is None:
    api_error(400, ErrorCodes.INVALID_CREDENTIALS, "Correo o contraseña incorrectos.")

if not company.CompanyStatus:   # ← S2259: para el analizador, company puede ser None
    ...

# Exceptions.py
from fastapi import HTTPException


def api_error(status_code: int, code: str, message: str, extra: dict | None = None):
    detail = {
        "code": code,
        "message": message,
    }
    ...
    raise HTTPException(status_code=status_code, detail=detail)
```

**Después**

```python
# Exceptions.py
from typing import NoReturn

from fastapi import HTTPException


def api_error(
    status_code: int, code: str, message: str, extra: dict | None = None
) -> NoReturn:
    """Lanza una HTTPException con el formato de error de la API. Nunca retorna."""
    detail = {
        "code": code,
        "message": message,
    }
    ...
    raise HTTPException(status_code=status_code, detail=detail)
```

**Principio aplicado:** contrato explícito (*Clean Code*: la firma dice lo que hace la función). `api_error()` siempre lanzaba una excepción, pero no lo declaraba, así que el analizador y cualquier lector suponían que la ejecución seguía con `company = None`. Con `-> NoReturn` se corrige la causa en la utilidad compartida y no con un `assert` en cada llamador (DRY). Así se beneficia también el resto de los usos de `api_error()`.
**Comportamiento:** igual. En ejecución ya se lanzaba la `HTTPException`.

---

## N°2 · Bug · `typescript:S9383` · promesa sin manejar

- **Archivo:** `RehniMarket-frontend/src/features/public/auth/context/AuthProvider.tsx:73`
- **Código antes:** [AuthProvider.tsx#L44-L78](https://github.com/RehnieyAl/Rehni-Market/blob/sonar-antes/RehniMarket-frontend/src/features/public/auth/context/AuthProvider.tsx#L44-L78)
- **Cambios en el PR:** [#27 · Files changed](https://github.com/RehnieyAl/Rehni-Market/pull/27/files)

**Antes**

```tsx
    const resolveSession = async () => { /* ... getProfile(), clearTokens() ... */ };

    resolveSession();   // ← S9383: sin await, catch ni then

    return () => {
      sessionRef.current += 1;
    };
  }, [accessToken]);
```

**Después**

```tsx
    const resolveSession = async () => { /* sin cambios */ };

    // Un fallo inesperado no debe dejar la sesión atascada en "loading".
    resolveSession().catch((error: unknown) => {
      console.error("Error resolviendo la sesión:", error);
      if (session === sessionRef.current) setStatus("unauthenticated");
    });

    return () => {
      sessionRef.current += 1;
    };
  }, [accessToken]);
```

**Principio aplicado:** manejo explícito de errores y *fail-safe defaults*. Ante un fallo inesperado, la sesión pasa al estado seguro (`"unauthenticated"`) en vez de quedar en `"loading"` con un rechazo sin manejar. La guarda `session === sessionRef.current` respeta el mismo control de carreras que ya usaba el efecto.
**Comportamiento:** el flujo normal no cambia. `getProfile()` ya tenía su propio `.catch(() => null)`, y el nuevo `catch` solo actúa ante un error que hoy no ocurre.

---

## N°3 · Vulnerabilidad · `githubactions:S7637` · acción referenciada por tag mutable

- **Archivo:** `.github/workflows/sonarqube.yml:24`
- **Código antes:** [sonarqube.yml#L23-L27](https://github.com/RehnieyAl/Rehni-Market/blob/sonar-antes/.github/workflows/sonarqube.yml#L23-L27)
- **Cambios en el PR:** [#28 · Files changed](https://github.com/RehnieyAl/Rehni-Market/pull/28/files)

**Antes**

```yaml
      - name: SonarCloud Scan
        uses: SonarSource/sonarqube-scan-action@v8.4.1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
```

**Después**

```yaml
      - name: SonarCloud Scan
        uses: SonarSource/sonarqube-scan-action@e805d875275f728fac1885b413934be6d7c63f65 # v8.4.1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
```

**Principio aplicado:** dependencias inmutables (seguridad de la cadena de suministro) y defensa en profundidad para los secretos del CI. Un tag se puede mover a otro commit; un SHA completo no. El comentario `# v8.4.1` mantiene la referencia legible. El SHA se comprobó con `gh api repos/SonarSource/sonarqube-scan-action/commits/v8.4.1` (tag ligero que apunta directo al commit).
**Comportamiento:** igual, es exactamente la misma versión de la acción.
**Efecto en el Quality Gate:** era el único issue en código nuevo y la causa de `new_security_rating = C`.

---

## N°4 · Code Smell · `python:S6903` · `datetime.utcnow()` obsoleto

- **Archivo:** `RehniMarket-backend/app/services/authentication/JWTService.py:16` y `:30`
- **Código antes:** [JWTService.py#L1-L37](https://github.com/RehnieyAl/Rehni-Market/blob/sonar-antes/RehniMarket-backend/app/services/authentication/JWTService.py#L1-L37)
- **Cambios en el PR:** [#29 · Files changed](https://github.com/RehnieyAl/Rehni-Market/pull/29/files)

**Antes**

```python
from datetime import datetime, timedelta
...
def create_access_token(user_id: str, role: str):
    payload = {
        ...
        "exp": datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    }
    ...

def create_refresh_token(user_id: str):
    payload = {
        ...
        "exp": datetime.utcnow() + timedelta(days=REFRESH_TOKEN_DAYS)
    }
```

**Después**

```python
from datetime import datetime, timedelta, UTC
...
def _expires_in(lifetime: timedelta) -> datetime:
    """Momento de expiración del token, como datetime con zona horaria UTC."""
    return datetime.now(UTC) + lifetime


def create_access_token(user_id: str, role: str):
    payload = {
        ...
        "exp": _expires_in(timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    }
    ...

def create_refresh_token(user_id: str):
    payload = {
        ...
        "exp": _expires_in(timedelta(days=REFRESH_TOKEN_DAYS))
    }
```

**Principio aplicado:** no usar APIs obsoletas (`utcnow()` está obsoleto desde Python 3.12 y devuelve un datetime *naive*) y DRY: la regla de expiración vive en un solo helper que comparten los dos tokens.
**Comportamiento:** igual. Comprobé que python-jose convierte un datetime naive en UTC y uno consciente de zona horaria a la misma marca de tiempo Unix en el claim `exp`. Como efecto secundario, las advertencias de deprecación de la suite de tests bajaron de 1653 a 614.

---

## N°5 · Code Smell · `typescript:S6853` · `label` sin control asociado

- **Archivo:** `RehniMarket-frontend/src/features/admin/components/dashboard/user/RechargeWalletModal.tsx:95` y `:123`
- **Código antes:** [RechargeWalletModal.tsx#L94-L134](https://github.com/RehnieyAl/Rehni-Market/blob/sonar-antes/RehniMarket-frontend/src/features/admin/components/dashboard/user/RechargeWalletModal.tsx#L94-L134)
- **Cambios en el PR:** [#29 · Files changed](https://github.com/RehnieyAl/Rehni-Market/pull/29/files)

**Antes**

```tsx
import { useState } from "react";
...
<label className="mb-1.5 block text-sm font-medium text-gray-700">
  Monto (RC)
</label>
<input
  type="text"
  inputMode="numeric"
  ...
/>
...
<label className="mb-1.5 block text-sm font-medium text-gray-700">
  Descripción (opcional)
</label>
<input
  type="text"
  value={description}
  ...
/>
```

**Después**

```tsx
import { useId, useState } from "react";
...
const amountId = useId();
const descriptionId = useId();
...
<label htmlFor={amountId} className="mb-1.5 block text-sm font-medium text-gray-700">
  Monto (RC)
</label>
<input
  id={amountId}
  type="text"
  inputMode="numeric"
  ...
/>
...
<label htmlFor={descriptionId} className="mb-1.5 block text-sm font-medium text-gray-700">
  Descripción (opcional)
</label>
<input
  id={descriptionId}
  type="text"
  value={description}
  ...
/>
```

**Principio aplicado:** accesibilidad (WCAG 1.3.1 *Info and Relationships* y 4.1.2 *Name, Role, Value*) y consistencia: se usa el mismo patrón de `useId()` del componente compartido `FormField`. Los hooks se declaran antes del `return` temprano (`if (!isOpen) return null`) para respetar las reglas de hooks de React.
**Comportamiento:** la lógica del formulario no cambia. Ahora el clic en la etiqueta enfoca el campo y los lectores de pantalla lo anuncian.

---

## Resultado en SonarCloud por PR

Consultado el 2026-11-09 con la API pública (`qualitygates/project_status` e `issues/search` con `pullRequest=<n>`).

| PR | Rama | Check `SonarCloud` (Actions) | Check `SonarCloud Code Analysis` | Quality Gate | Issues nuevos en el PR |
|---|---|---|---|---|---|
| [#27](https://github.com/RehnieyAl/Rehni-Market/pull/27) | `fix/sonar-bugs` | pass | pass | **Passed** (reliability A, security A, maintainability A, duplicación 0.0 %, hotspots 100 %) | 0 |
| [#28](https://github.com/RehnieyAl/Rehni-Market/pull/28) | `fix/sonar-vulnerabilidad` | pass | pass | **Passed** (mismas condiciones) | 0 |
| [#29](https://github.com/RehnieyAl/Rehni-Market/pull/29) | `refactor/sonar-code-smells` | pass | pass | **Passed** (mismas condiciones) | 0 |

**Lectura:** ninguna corrección introduce issues nuevos, que era el requisito para el código nuevo (ver `02-matriz-hallazgos.md`). El análisis de un PR solo reporta los issues **nuevos** de ese PR. Los issues de la matriz viven en la rama `main` y SonarCloud los cierra (estado *Fixed*) en el primer análisis de `main` que contenga las correcciones. Esa comprobación se hace en el paso 5 (`04-validacion-final.md`).

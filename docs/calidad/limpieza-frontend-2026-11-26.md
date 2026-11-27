# Refactorización y limpieza de RehniMarket Web — 26/11/2026

Rama `refactor/backend-cleanup`, sin commits. Alcance: `RehniMarket-frontend` (no se tocó backend, móvil
ni producción). Skills: Modern Web Guidance (Google Chrome, guías `viewport-aware-dropdowns`, `html`,
`navbar`, `tabs`, `color`, `natural-interactions`) y Unslop (heydamir, `~/.claude/skills/unslop`).

## Línea base y resultado

| Verificación | Antes | Después |
|---|---|---|
| ESLint (`lint:ci`, 0 avisos) | 0 errores | 0 errores |
| TypeScript (`typecheck`) | 0 errores | 0 errores |
| Vitest | 768 pruebas | 780 pruebas (12 nuevas de los desplegables) |
| Cobertura sentencias / ramas / funciones / líneas | 91,81 / 85,56 / 92,17 / 93,40 % | 92,01 / 85,57 / 92,42 / 93,63 % |
| Build (`tsc -b && vite build`) | Correcto | Correcto |
| knip: archivos / dependencias sin uso | 0 / 0 | 0 / 0 |
| knip: exportaciones / tipos sin consumidores externos | 4 / 31 | 4 / 24 |

## Archivos eliminados

| Archivo | Problema detectado | Acción | Evidencia |
|---|---|---|---|
| `public/favicon.svg` | Favicon de la plantilla de Vite (logotipo morado `#863bff`) | Eliminado | `index.html` usa `/favicon.png`; sin referencias en el repositorio (frontend, backend, Caddy, móvil, docs, workflows, manuales); build y pruebas en verde |
| `public/icons.svg` | Sprite de redes sociales de la plantilla de Vite (Bluesky y otros) | Eliminado | Sin referencias en el repositorio; ningún `<use href>` lo apunta; build y pruebas en verde |

Las dos menciones a `favicon.svg` en `RehniMarket-mobile/.agents/skills/design-taste-frontend` son texto
genérico de una plantilla de ese skill, no referencias a este archivo.

## Código eliminado

| Archivo | Problema detectado | Acción | Evidencia |
|---|---|---|---|
| `src/shared/validation/schemas.ts` | Tipos `RegisterUserValues` y `RegisterCompanyValues` sin uso | Eliminados | knip; `grep -w` en frontend, móvil, docs y `.github`: solo su definición |
| `src/features/public/auth/types/response.ts` | `MessageResponse` y `VerifyEmailResponse` sin uso | Eliminados | knip; el `MessageResponse` del móvil es una definición propia |
| `src/features/public/auth/types/request.ts` | `RefreshTokenRequest` sin uso | Eliminado | knip; solo su definición |
| `src/features/company/types/response.ts` | `MyProductsPaginationResponse` sin uso | Eliminado | knip; solo su definición |
| `src/features/company/types/catalogAttributes.ts` | `AttributeRole` sin uso | Eliminado | knip; solo su definición |
| 7 archivos, 8 usos (Home, ProductsDetail, ProductDetail ×2, ProductDetailSkeleton, ProductTrustCards, CertificateRejectedModal, MobileMenu) | Clase `theme-dark` del antiguo esquema de dos temas, sin regla CSS | Clase retirada | 0 coincidencias en el CSS compilado; el tema oscuro es global en `index.css` |
| `index.html` | `favicon.png` declarado como `image/svg+xml` | Corregido a `image/png` | Tipo MIME real del archivo |

## Código refactorizado (duplicaciones)

| Archivo | Problema detectado | Acción | Evidencia |
|---|---|---|---|
| `features/favorites/context/FavoritesProvider.tsx` | Carga repetida en `refreshFavorites` y en el efecto; solo guardaba IDs | Una sola función de carga; guarda la lista con los datos del producto; descarta respuestas de un usuario anterior | Pruebas de Home, BuyerDashboard y desplegables |
| `features/cart/context/CartProvider.tsx` | Carga repetida en `refreshCart` y en el efecto | Una sola función de carga con descarte de respuestas obsoletas | Pruebas de carrito, checkout y navbar |
| `features/user/components/dashboard/Favorites.tsx` | Pedía `/favorites` por su cuenta (estado duplicado con el provider) | Usa la lista de `FavoritesProvider` | Quitar en el desplegable se refleja en la página (Playwright) |
| `shared/components/navbar/ProfileDropdown.tsx` | Lógica propia de clic fuera, sin Escape ni `aria-expanded` | Usa `NavDropdown` + `useDismiss` | Pruebas de navbar y Playwright |
| Búsqueda del navbar y desplegables | Tres miniaturas de producto con el mismo marcador `ImageOff` | `shared/components/ProductThumbnail.tsx` | Usado en búsqueda, favoritos y carrito |

`BuyerDashboard.test.tsx` («error de carga con reintento») simulaba dos fallos porque página y provider
pedían la lista por separado; con la petición única se simula un fallo. El comportamiento comprobado
(error y reintento correcto) no cambia.

## Componentes nuevos o reutilizados

- `hooks/useDismiss.ts`: cierre con clic fuera y Escape (devuelve el foco), compartido por los tres desplegables.
- `shared/components/navbar/NavDropdown.tsx`: botón con `aria-expanded`/`aria-controls` y panel; patrón de
  divulgación sin `role="menu"` ni `aria-haspopup`, como indica la guía `viewport-aware-dropdowns`.
- `FavoritesDropdown.tsx` y `CartDropdown.tsx`: reutilizan `useFavorites`, `useCart`,
  `cartHasUnavailableItems`, `formatAttributePairs`, `formatPrice`, `Button` y `buttonClasses`. «Pagar» solo
  navega a `/checkout`; los importes son los del backend (`subtotal` de línea y de carrito).
- El navbar guarda un único `openMenu`: abrir uno cierra los demás, incluido el perfil.

## Dependencias

Ninguna eliminada. Las cuatro sin uso directo en el código se usan de forma indirecta:
`@testing-library/dom` (peer de `@testing-library/react`), `@types/react` y `@types/react-dom` (JSX),
`@types/node` (`tsconfig.node.json` y `tsconfig.test.json`), `@vitest/coverage-v8` (`test:coverage`).

## CSS

Todas las clases propias de `index.css` (`animate-*`, `disclosure`, `brand-link`, `fill-hover`) se usan.
No había reglas obsoletas que retirar; la única clase muerta era `theme-dark`, usada en componentes sin
definición en el CSS.

## Conservado por seguridad o por uso indirecto

| Archivo | Motivo |
|---|---|
| `scripts/gen_business_cta_bg.py`, `scripts/generate_banner_templates.py` | Generan `business-cta-bg.webp` y las plantillas de banner que la app usa |
| `src/assets/*` | Todos referenciados (componentes, pruebas o manuales SENA) |
| `public/favicon.png` | Favicon real (`index.html`) |
| Barril `shared/components/ui/index.ts` (`controlClasses`, `FormField`, tipos `ModalSize`, `ButtonVariant`, `ButtonSize`) | API pública del sistema de UI; los módulos los importan directamente de su archivo |
| 24 tipos exportados sin consumidores externos | Se usan dentro de su archivo (contratos de respuesta de la API); el `export` no es código muerto |
| `RETURN_TEXT_MIN`, `RETURN_SUBJECT_MIN` | Se usan dentro de `returns/utils/validation.ts` |

## Pruebas de navegador (Playwright temporal, backend QA aislado)

Comprador con 4 favoritos y 3 productos en el carrito creados por la API en la base desechable:
contadores reales; apertura, segundo clic, Escape con retorno del foco y clic fuera; abrir carrito cierra
favoritos y abrir perfil cierra el carrito; productos, variantes, cantidades y subtotal del backend
(11.207.500); «Pagar» lleva a `/checkout` sin ejecutar pagos; quitar un favorito actualiza el contador y la
página de favoritos; teclado (Tab al icono, Enter abre, Tab entra al panel); sin desbordamiento en 320,
360, 390, 430, 768, 1024 y 1440 px (en menos de 1024 px los accesos están en el menú lateral); paneles
dentro de la ventana en 1024 y 1440 px; sin errores de consola.

## Revisión posterior

- La comprobación de teclado de Playwright falló una vez al abrir el panel en los primeros milisegundos:
  mientras dice «Cargando favoritos…» no tiene elementos enfocables. Es un tiempo de la prueba, no un
  defecto; se puede valorar abrir el panel solo cuando ya hay datos.
- En 1024 px el buscador del navbar quedaba reducido a su icono; se ocultó el nombre del perfil hasta `xl`
  (su etiqueta accesible lo conserva). Revisar el navbar completo de 1024 a 1279 px cuando se integre
  Playwright Test.
- `accent-color` no tiene el respaldo que pide Modern Web Guidance para Safari anterior a 26.2.

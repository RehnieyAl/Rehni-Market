# Anexo de la fase 1: inventario de la interfaz por archivo

Extraído automáticamente del código (`RehniMarket-frontend/src` y `RehniMarket-mobile/src`, sin pruebas). Por archivo: íconos (lucide-react en web, Ionicons en móvil), textos visibles, atributos (label, placeholder, title, aria-label…), alertas (`showAlert` / `Alert.alert`) y otros textos literales (pestañas, estados, mensajes construidos en código). Sirve como checklist de cobertura para la fase 2; no es redacción para el manual.

## Web

### `RehniMarket-frontend/src/features/addresses/components/AddressForm.tsx`
- **Íconos lucide:** Save · X
- **Textos:** Cancelar · Dirección principal
- **Atributos:** label=Ciudad · label=Departamento · label=Dirección · label=Indicaciones adicionales (opcional) · label=Nombre completo · label=Nombre de referencia · label=Teléfono · placeholder=Casa, Oficina, Apartamento... · placeholder=Ej. Apartamento 302, portería azul...
- **Alertas:** error: Completa nombre de referencia, nombre completo, departamento, ciudad, dirección y teléfono. · success: Dirección guardada.
- **Otros textos:** Colombia · Completa nombre de referencia, nombre completo, departamento, ciudad, dirección y teléfono. · Dirección guardada. · Guardando… · Guardar dirección · No se pudo guardar la dirección.

### `RehniMarket-frontend/src/features/addresses/components/AddressSelectionModal.tsx`
- **Íconos lucide:** MapPin · Plus
- **Textos:** Cargando direcciones... · Continuar · Nueva dirección
- **Atributos:** description=Agrega una para continuar con tu compra. · title=Dirección de entrega · title=No tienes direcciones registradas
- **Alertas:** error: No se pudieron cargar tus direcciones. · error: Selecciona una dirección para continuar.
- **Otros textos:** Dirección · No se pudieron cargar tus direcciones. · Selecciona una dirección para continuar.

### `RehniMarket-frontend/src/features/admin/components/dashboard/CatalogManagement.tsx`
- **Textos:** Administra los catálogos del marketplace y sus atributos de producto y de variante. · Catálogo

### `RehniMarket-frontend/src/features/admin/components/dashboard/Home.tsx`
- **Íconos lucide:** Activity · Building2 · CheckCircle · Mail · Store · UserRound · UserX
- **Textos:** Actividad reciente · Empresas · Estado · Inicio · Resumen general de RehniMarket. · Rol · Un momento… · Usuario · Usuarios · Usuarios recientes · Ver todos → · Últimos movimientos administrativos. · Últimos usuarios registrados.
- **Atributos:** title=Activas · title=Activos · title=Administradores · title=Bloqueadas · title=Bloqueados · title=No hay actividad reciente · title=No hay usuarios registrados · title=Registradas · title=Registrados
- **Alertas:** error: No se pudieron cargar las estadísticas.
- **Otros textos:** Administrador · Bloqueado · Empresa · Fecha inválida · Hace unos segundos · No se pudieron cargar las estadísticas.

### `RehniMarket-frontend/src/features/admin/components/dashboard/advertisement/AdvertisementFormModal.tsx`
- **Íconos lucide:** Save · Search · Upload · X
- **Textos:** Cambiar imagen · Cancelar · Categoría · Descuento · Destino · Días máximos desde la creación · Empresa · Estado · Habilitar descuento · Imagen móvil · Muestra productos con descuento ≥ este porcentaje. · Muestra productos creados en los últimos N días. · Orden · Porcentaje de descuento · Producto · Quitar · Se calcula automáticamente · Selecciona una categoría · Si no se sube una imagen móvil, se usará la imagen desktop/tablet en pantallas pequeñas. · Stock máximo · Subir imagen · Subir imagen móvil · Tipo de anuncio
- **Atributos:** placeholder=/products · placeholder=20 · placeholder=30 · placeholder=40 · placeholder=Buscar empresa por nombre... · placeholder=Buscar producto por nombre...
- **Otros textos:** Al hacer clic en el banner se abre este destino. Si lo dejas vacío, el banner no será clicable. · Black Friday · Cyber Days · Editar anuncio · El destino se calcula solo según el tipo de anuncio - ya no se escribe a mano. · Guardando… · Guardar · Inactivo · Liquidación · Nuevo anuncio · Nuevos lanzamientos · Producto específico · Promoción

### `RehniMarket-frontend/src/features/admin/components/dashboard/advertisement/AdvertisementPreviewModal.tsx`
- **Textos:** Desktop / tablet · Móvil · Sin imagen móvil propia — usa la de desktop.
- **Atributos:** title=Vista previa del anuncio
- **Otros textos:** Inactivo

### `RehniMarket-frontend/src/features/admin/components/dashboard/advertisement/Advertisements.tsx`
- **Íconos lucide:** Download · Eye · Loader2 · Megaphone · Pencil · Plus · Power · Trash2
- **Textos:** Administra el Hero que se muestra al comienzo del Home. Descarga una plantilla como base para diseñar tu banner. · Anuncios · Esta acción no se puede deshacer. · Nuevo anuncio · Plantilla móvil · Plantilla web
- **Atributos:** aria-label=Editar anuncio · aria-label=Eliminar anuncio · aria-label=Ver anuncio · confirmLabel=Eliminar anuncio · description=Crea el primer anuncio para el Hero del Home. · title=Aún no hay anuncios · title=Editar anuncio · title=Eliminar anuncio · title=Ver anuncio
- **Otros textos:** Activar · Activar anuncio · Banner manual · Black Friday · Categoría · Cyber Days · Desactivar · Desactivar anuncio · Empresa · Inactivo · Liquidación · Nuevos lanzamientos · Producto específico · Promoción

### `RehniMarket-frontend/src/features/admin/components/dashboard/catalog/AttributesModal.tsx`
- **Íconos lucide:** Loader2 · Plus · Power · Trash2 · X
- **Textos:** Agregar · Atributo de producto · Atributos y variantes · Categoría: · Cerrar · Color · Eje de variante · Entrada · Inactivo · Lista de opciones · Nombre · Número · Promise · Rol · Texto · Unidad
- **Atributos:** placeholder=Ej: Color, Talla, Marca · placeholder=Ej: GB, cm · placeholder=Nuevo valor · title=Eliminar atributo · title=Esta categoría todavía no tiene atributos
- **Otros textos:** Activar · Desactivar · No se pudieron cargar los atributos. · No se pudo cambiar el estado. · No se pudo eliminar: hay productos o variantes que lo usan. · No se pudo eliminar: hay variantes que la usan.

### `RehniMarket-frontend/src/features/admin/components/dashboard/catalog/CatalogFormModal.tsx`
- **Íconos lucide:** Save · Upload · X
- **Textos:** Cambiar imagen · Cancelar · Descripción · Estado · Imagen · Menor número aparece primero. · Nombre · Orden visual · Quitar · Subir imagen
- **Atributos:** placeholder=Describe brevemente esta categoría · placeholder=Ej: Computadoras
- **Otros textos:** Editar categoría · Guardando… · Guardar · Inactiva · Nueva categoría

### `RehniMarket-frontend/src/features/admin/components/dashboard/catalog/Catalogs.tsx`
- **Íconos lucide:** ImageOff · Pencil · Plus · Power · SlidersHorizontal · Trash2
- **Textos:** Acciones · Categorías · Categorías del marketplace y sus atributos. · Esta acción no se puede deshacer. · Estado · Imagen · Nombre · Nueva categoría · Orden · Productos
- **Atributos:** confirmLabel=Eliminar catálogo · description=Crea la primera categoría para organizar el catálogo. · title=Atributos y variantes · title=Aún no hay categorías · title=Editar categoría · title=Eliminar categoría · title=Eliminar catálogo
- **Otros textos:** Activar categoría · Desactivar categoría · Inactiva

### `RehniMarket-frontend/src/features/admin/components/dashboard/company/CertificateModal.tsx`
- **Íconos lucide:** ExternalLink · X
- **Textos:** Abrir · Certificado empresarial
- **Atributos:** title=Cerrar

### `RehniMarket-frontend/src/features/admin/components/dashboard/company/CertificateReviewModal.tsx`
- **Íconos lucide:** Ban · FileWarning
- **Textos:** Cancelar · Confirmar · ¿Qué deseas hacer con este certificado?
- **Atributos:** hint=Este motivo será mostrado a la empresa. · label=Motivo · title=Revisar certificado
- **Otros textos:** Certificado inválido — Solicitar actualización · Escribe el motivo… · Explica por qué se rechaza a la empresa… · Explica qué problema tiene el certificado presentado… · La empresa queda rechazada y no podrá operar. No podrá subir otro certificado por su cuenta: solo un administrador podrá reactivarla. · Rechazar · Selecciona una acción.

### `RehniMarket-frontend/src/features/admin/components/dashboard/company/Companies.tsx`
- **Íconos lucide:** Eye · Lock · Search · Unlock
- **Textos:** Acción · Aprobadas · Atrás · Certificado · Certificado inválido · Dirección · Empresa · Empresas · Empresas registradas · Estado · Gestiona las empresas registradas en la plataforma. · NIT · Pendientes · Rechazadas · Registro · Siguiente · Todas
- **Atributos:** aria-label=Buscar empresas · aria-label=Filtrar por certificado · placeholder=Buscar por correo, teléfono, NIT o empresa… · title=No pudimos cargar las empresas · title=No se encontraron empresas con este filtro · title=Ver empresa
- **Alertas:** success: Empresa desbloqueada correctamente. · success: Empresa suspendida correctamente. No había pedidos pendientes de reembolso. · success: Empresa suspendida correctamente. Se procesaron ${result.affectedOrdersCount} pedido${ result.affectedOrdersCount !== 1 ? "s" : "" } y se reembolsaron ${formatPrice( result.totalRefunded, )} en RehniCoins.
- **Otros textos:** Aprobado · Bloqueada · Bloquear empresa · Desbloquear empresa · Empresa desbloqueada correctamente. · Empresa suspendida correctamente. No había pedidos pendientes de reembolso. · No registrada · Pendiente · Rechazado

### `RehniMarket-frontend/src/features/admin/components/dashboard/company/CompanyDetailModal.tsx`
- **Íconos lucide:** Ban · Building2 · CalendarDays · Check · Eye · FileText · IdCard · Mail · MapPin · Phone · Shield · UserRound
- **Textos:** Cargando empresa… · Cerrar · Certificado empresarial · Rechazar o solicitar cambios · Revisa el documento antes de tomar una decisión. · Revisión del certificado · Sin banner · Ver certificado
- **Atributos:** description=Información de la empresa y de su representante. · description=Intenta de nuevo en unos momentos. · label=Correo · label=Cuenta creada · label=Dirección · label=Estado · label=Estado de la cuenta · label=Estado del certificado · label=Fecha de registro · label=Motivo de suspensión · label=NIT · label=Nombre completo · label=Nombre de la empresa · label=Rol · label=Teléfono · title=Detalle de empresa · title=Información de la empresa · title=No pudimos cargar la información de la empresa · title=Representante
- **Otros textos:** Actualizando… · Administrador · Aprobado · Aprobar certificado · Bloqueado · Certificado disponible para visualizar. · Certificado inválido · Cuenta activa · Cuenta bloqueada · Empresa · La empresa no tiene certificado cargado. · Motivo del rechazo · Motivo — certificado inválido · No hay motivo registrado. · No registrada · No registrado · Pendiente · Propietario · Rechazado · Suspendida · Usuario

### `RehniMarket-frontend/src/features/admin/components/dashboard/company/CompanyStatusConfirmModal.tsx`
- **Íconos lucide:** Ban · RotateCcw
- **Textos:** La empresa volverá a estar disponible.
- **Atributos:** hint=Se guarda en el historial y se le informa a la empresa por correo. · label=Motivo de suspensión · placeholder=Ej: Incumplimiento reiterado de las políticas de la plataforma.
- **Otros textos:** Desbloquear · Desbloquear empresa · Indica el motivo de la suspensión. · Suspender empresa · ¿Desbloquear la empresa · ¿Suspender la empresa

### `RehniMarket-frontend/src/features/admin/components/dashboard/payout/AdminPayoutDetailModal.tsx`
- **Íconos lucide:** CheckCircle2
- **Textos:** Marcar como pagada
- **Alertas:** success: Liquidación de ${confirmTarget.companyName ?? "la empresa"} marcada como pagada.
- **Otros textos:** No se pudo marcar la liquidación como pagada.

### `RehniMarket-frontend/src/features/admin/components/dashboard/payout/AdminPayouts.tsx`
- **Íconos lucide:** Eye · Plus · Receipt
- **Textos:** Anterior · Genera y administra las liquidaciones mensuales de las empresas: comisión del 5% sobre ventas entregadas, giro del 95% neto a su cuenta bancaria. · Generar liquidación · Liquidaciones · Siguiente · Ver detalle
- **Otros textos:** Aún no hay liquidaciones · Empresa · Fallidas · Genera la primera liquidación de una empresa con el botón de arriba. · Ninguna liquidación coincide con este filtro. · Pagadas · Pendientes · Procesando · Sin resultados

### `RehniMarket-frontend/src/features/admin/components/dashboard/payout/GeneratePayoutModal.tsx`
- **Íconos lucide:** AlertTriangle · Building2 · Search · X
- **Textos:** Buscando... · Cambiar · Cancelar · Cargando periodos... · Empresa · Generar liquidación · Mes a liquidar · Selecciona un mes... · Sin resultados. · Solo se muestran meses con ventas entregadas que todavía no tienen liquidación. · Vista previa
- **Atributos:** placeholder=Buscar empresa por nombre...
- **Alertas:** error: Selecciona una empresa y un periodo con vista previa válida. · success: Liquidación generada para ${selectedCompany.nameCompany}.
- **Otros textos:** Diciembre · Febrero · Generando... · No se pudo calcular la vista previa. · No se pudo generar la liquidación. · Noviembre · Octubre · Selecciona una empresa y un periodo con vista previa válida. · Septiembre

### `RehniMarket-frontend/src/features/admin/components/dashboard/payout/PayoutMarkPaidConfirmModal.tsx`
- **Textos:** Se enviará un correo automático a la empresa confirmando el pago. · Transfiere a
- **Atributos:** confirmLabel=Confirmar pago · title=Marcar liquidación como pagada

### `RehniMarket-frontend/src/features/admin/components/dashboard/payout/PayoutPreviewCard.tsx`
- **Íconos lucide:** BadgeCheck
- **Textos:** Cuenta bancaria destino · Monto neto a transferir · Ventas brutas · Vista previa lista para generar

### `RehniMarket-frontend/src/features/admin/components/dashboard/report/ReportDetailModal.tsx`
- **Íconos lucide:** Ban · Building2 · CalendarDays · ExternalLink · Package · User
- **Textos:** Cancelar · Cargando reporte… · Cerrar · Empresa suspendida · Este reporte está resuelto y ya no puede modificarse. · Evidencias · Gestionar reporte · Marcar en revisión · Rechazar · Resolver · Respuesta administrativa · Suspender empresa · Ver empresa · Ver producto
- **Atributos:** label=Descripción · label=Empresa · label=Empresa propietaria · label=Motivo · label=Producto · label=Respuesta administrativa (opcional) · label=Usuario reportante · placeholder=Explica brevemente la decisión tomada. · title=Detalle del reporte · title=No se pudo cargar la información del reporte · title=Ver imagen completa
- **Alertas:** success: Reporte ${labels[status]} correctamente.
- **Otros textos:** Confirmar rechazo · Confirmar resolución · Empresa eliminada · Empresa propietaria del producto · Empresa reportada · Empresa suspendida correctamente. No había pedidos pendientes de reembolso. · Producto eliminado · Reporte de empresa · Reporte de producto

### `RehniMarket-frontend/src/features/admin/components/dashboard/report/Reports.tsx`
- **Íconos lucide:** Eye · Search
- **Textos:** Acción · Atrás · Empresa · Empresas · En revisión · Estado · Fecha · Motivo · Objetivo · Pendientes · Productos · Rechazados · Reportante · Reportes · Reportes de productos y empresas enviados por los usuarios. · Reportes registrados · Resueltos · Siguiente · Tipo · Todos
- **Atributos:** aria-label=Buscar reportes · aria-label=Filtrar por estado · aria-label=Filtrar por tipo · placeholder=Buscar por producto, empresa, motivo o usuario… · title=No pudimos cargar los reportes · title=No se encontraron reportes con este filtro · title=Ver reporte
- **Otros textos:** Pendiente · Producto · Rechazado · Resuelto

### `RehniMarket-frontend/src/features/admin/components/dashboard/shipping/ShippingCarrierFormModal.tsx`
- **Textos:** Activa · Cancelar · Inactiva
- **Atributos:** description=Catálogo global. Las empresas eligen entre las activas para sus envíos. · label=Estado · label=Nombre · label=URL de seguimiento · placeholder=Ej. Servientrega
- **Otros textos:** Crear transportadora · Editar transportadora · Guardar cambios · Mínimo 2 caracteres. · Nueva transportadora · Transportadora actualizada. · Transportadora creada. · URL inválida.

### `RehniMarket-frontend/src/features/admin/components/dashboard/shipping/ShippingCarriers.tsx`
- **Íconos lucide:** Pencil · Plus · Power · Truck
- **Textos:** Acciones · Catálogo global. Las empresas eligen una transportadora activa al despachar un pedido. · Estado · Nueva transportadora · Transportadora · Transportadoras · URL de seguimiento
- **Atributos:** description=Crea la primera para que las empresas puedan asignarla a sus envíos. · title=Aún no hay transportadoras · title=Editar transportadora · title=No se pudieron cargar las transportadoras
- **Otros textos:** Activar · Desactivar · Inactiva

### `RehniMarket-frontend/src/features/admin/components/dashboard/user/RechargeWalletModal.tsx`
- **Íconos lucide:** Coins · X
- **Textos:** Cancelar · Recargando la billetera de · Recargar · Recargar RehniCoin
- **Atributos:** placeholder=Ej. Recarga promocional
- **Otros textos:** No se pudo recargar el saldo.

### `RehniMarket-frontend/src/features/admin/components/dashboard/user/UserDetailModal.tsx`
- **Íconos lucide:** CalendarDays · Mail · Pencil · Phone · Save · Shield · XCircle
- **Textos:** Acciones · Al volver a ser usuario, recuperará la posibilidad de realizar compras. · Cambio de rol · Cancelar · Cargando usuario... · Editar información · El rol de una empresa no puede modificarse desde esta sección. · No se pudo cargar la información del usuario. · Rol protegido
- **Atributos:** title=Correo · title=Fecha de registro · title=Nombre completo · title=Rol · title=Teléfono
- **Otros textos:** Administrador · Bloqueado · Detalle de usuario · Empresa · Gestiona la información del usuario. · Guarda o cancela los cambios realizados. · Guardando… · Guardar cambios · Información del usuario registrado. · Modifica el correo y el rol del usuario. · No disponible · Propietario · Solo un Owner puede gestionar esta cuenta. · Usuario

### `RehniMarket-frontend/src/features/admin/components/dashboard/user/UserStatusConfirmModal.tsx`
- **Íconos lucide:** Lock · Unlock
- **Otros textos:** Bloquear usuario · Desbloquear usuario

### `RehniMarket-frontend/src/features/admin/components/dashboard/user/Users.tsx`
- **Íconos lucide:** Coins · Eye · Lock · Search · Unlock
- **Textos:** Acción · Anterior · Correo · Estado · Gestiona los usuarios registrados en la plataforma. · Registro · Rol · Siguiente · Teléfono · Usuario · Usuarios · Usuarios registrados
- **Atributos:** aria-label=Buscar usuarios · placeholder=Buscar usuario, correo o teléfono… · title=No pudimos cargar los usuarios · title=No se encontraron usuarios · title=Recargar RehniCoin · title=Ver usuario
- **Otros textos:** Administrador · Bloqueado · Bloquear usuario · Desbloquear usuario · Empresa · Propietario

### `RehniMarket-frontend/src/features/admin/components/dashboard/wallet/CorrectRechargeModal.tsx`
- **Íconos lucide:** Wallet2
- **Textos:** Ajuste que se aplicará · Cancelar · Corregir recarga · Fecha de la recarga · Recarga original · Usuario
- **Atributos:** hint=Queda registrado en el movimiento y se le informa al usuario. · label=Motivo de la corrección · label=Nueva cantidad correcta (RC) · placeholder=Ej. 50000 · placeholder=Ej. Se recargó de más por un error de digitación… · title=Corregir recarga
- **Otros textos:** Ingresa un número mayor que 0. · La cantidad corregida es igual a la original.

### `RehniMarket-frontend/src/features/admin/components/dashboard/wallet/RehniCoin.tsx`
- **Íconos lucide:** Coins · PencilLine
- **Textos:** Acción · Administrador responsable · Anterior · Corregida · Corregir recarga · Correo · Fecha · Monto · Recargar saldo · RehniCoin · Siguiente · Usuario · Últimas recargas
- **Atributos:** label=Cantidad (RC) · label=Correo del usuario · label=Descripción (opcional) · placeholder=Ej. Recarga administrativa · placeholder=usuario@email.com · title=Todavía no se han registrado recargas
- **Alertas:** success: Recarga corregida para ${result.userName}. Ajuste ${sign}${formatPrice( Math.abs(adjustment), )} RC · nuevo saldo ${formatPrice(result.balance)} RC. · success: Recarga exitosa a ${result.userName} (${result.userEmail}). Nuevo saldo: ${formatPrice(result.balance)} RC
- **Otros textos:** No se pudo corregir la recarga. · No se pudo recargar el saldo.

### `RehniMarket-frontend/src/features/cart/components/CartView.tsx`
- **Íconos lucide:** ArrowRight · ImageOff · Minus · Plus · ShoppingCart · Trash2
- **Textos:** Agotado · Eliminar producto · Este producto ya no tiene stock disponible. Elimínalo para continuar con el pago. · Explorar productos · IVA · Ir a pagar · Mi carrito · Promise · Resumen · Revisa tus productos antes de continuar al pago. · Sin stock suficiente · Total · Vaciar carrito
- **Atributos:** aria-label=Agregar una unidad · aria-label=Quitar una unidad · description=Agrega productos y vuelve aquí para finalizar tu compra. · title=Tu carrito está vacío
- **Otros textos:** El total definitivo se confirma en el checkout. · Elimina o ajusta los productos sin stock para continuar al pago. · No aplica · No se pudo actualizar la cantidad. · No se pudo eliminar el producto. · No se pudo vaciar el carrito.

### `RehniMarket-frontend/src/features/cart/components/CheckoutView.tsx`
- **Íconos lucide:** CheckCircle2 · MapPin · Pencil · ShoppingCart
- **Textos:** Cambiar · Checkout · Confirma tu dirección y finaliza el pago con RehniCoin. · Dirección de envío · Explorar productos · IVA · Pagaste con RehniCoin. Puedes seguir el estado de tu pedido en "Mis pedidos". · Productos · Recarga en tu cuenta · Resumen · Saldo RehniCoin · Subtotal · Total · Ver mis pedidos · Vuelve al carrito · ¡Tu compra fue confirmada!
- **Atributos:** description=Agrega productos para continuar con tu compra. · title=Tu carrito está vacío
- **Otros textos:** Agotado · Confirmando… · Confirmar compra · Debes registrar una dirección para continuar con la compra. · Dirección · Elegir dirección para continuar · Mis pedidos · No aplica · No se pudo completar la compra. Intenta de nuevo. · Sin stock suficiente · Un producto de tu carrito ya no está disponible.

### `RehniMarket-frontend/src/features/company/components/CertificateRejectedModal.tsx`
- **Íconos lucide:** Ban · FileUp · FileWarning · X
- **Textos:** Actualizar certificado · Entendido · Motivo
- **Atributos:** aria-label=Cerrar
- **Otros textos:** Certificado no válido · El administrador no registró un motivo. Escribe a soporte de RehniMarket si necesitas más detalle. · El certificado que presentaste no es válido. Debes subir uno nuevo para que tu empresa vuelva a revisión. · Empresa rechazada

### `RehniMarket-frontend/src/features/company/components/dashboard/Finance.tsx`
- **Textos:** Consulta tus ventas, comisiones y liquidaciones mensuales, y administra las cuentas bancarias donde recibes tus pagos. · Finanzas
- **Otros textos:** Cuentas bancarias · Liquidaciones · Resumen financiero

### `RehniMarket-frontend/src/features/company/components/dashboard/Home.tsx`
- **Íconos lucide:** CalendarDays · CheckCircle2 · EyeOff · ImageOff · Mail · MapPin · Package · PackageX
- **Textos:** Estado · Los últimos productos que agregaste a tu catálogo. · Precio · Producto · Productos recientes · Stock · Ver todos →
- **Atributos:** description=Crea tu primer producto para empezar a vender. · subtitle=Desactivados · subtitle=Sin stock disponible · subtitle=Total en tu catálogo · subtitle=Visibles para compradores · title=Activos · title=Agotados · title=Aún no tienes productos publicados · title=Ocultos · title=Productos publicados
- **Otros textos:** Banner de la empresa · Certificado no válido · Empresa pendiente de verificación · Empresa rechazada · Empresa verificada · Inactivo · Logo por defecto

### `RehniMarket-frontend/src/features/company/components/dashboard/MyCompany.tsx`
- **Íconos lucide:** Download · FileText · Pencil · Save · ShieldAlert · Upload · UserRound · X
- **Textos:** Actualizar certificado · Actualizar imágenes · Administra la información pública de tu empresa. · Banner empresa · Cambiar banner · Cambiar logo · Cancelar · Certificado empresarial · Datos de tu cuenta. Se editan en Configuración de cuenta. · Datos de tu negocio, visibles para los compradores. · Descargar plantilla · Editar · Estado de la empresa · Estado de la verificación de tu empresa en RehniMarket. · Este rechazo no se resuelve subiendo un nuevo certificado. Contacta con soporte de RehniMarket para que un administrador revise tu caso. · Guardar · Imagen de la empresa · Información de la empresa · Información del representante · Logo empresa · Mi tienda · Motivo del rechazo · Personaliza la imagen que verán tus clientes.
- **Atributos:** aria-label=Editar información de la empresa · label=Correo electrónico · label=Descripción · label=Dirección · label=Dígito de verificación · label=NIT · label=Nombre del representante · label=Razón social · label=Teléfono · placeholder=Cuéntale a tus clientes a qué se dedica tu empresa…
- **Otros textos:** Aprobado · Certificado no válido · El administrador no registró un motivo. Escribe a soporte de RehniMarket si necesitas más detalle. · Empresa rechazada · Pendiente de revisión · Suspendida

### `RehniMarket-frontend/src/features/company/components/dashboard/Orders.tsx`
- **Íconos lucide:** Eye · Search · ShoppingBag
- **Textos:** Anterior · Gestiona los pedidos recibidos: filtra por estado, busca por referencia o comprador y actualiza su estado desde el detalle. · Pedidos · Siguiente · Ver detalle
- **Atributos:** aria-label=Buscar pedidos · placeholder=Buscar por referencia, correo o nombre del comprador…
- **Otros textos:** Aún no has recibido pedidos · Cancelados · Completados · Cuando un comprador te haga un pedido, aparecerá aquí. · En proceso · Ningún pedido coincide con este filtro y esta búsqueda. · Pendientes · Sin resultados

### `RehniMarket-frontend/src/features/company/components/dashboard/Returns.tsx`
- **Íconos lucide:** Eye · RotateCcw · Search
- **Textos:** Anterior · Devoluciones · Siguiente · Ver detalle
- **Atributos:** aria-label=Buscar devoluciones · placeholder=Buscar por referencia, correo o nombre del comprador…
- **Otros textos:** Aprobadas · Cuando un comprador solicite una devolución de uno de tus pedidos, aparecerá aquí. · En revisión · Ninguna solicitud coincide con este filtro. · No tienes solicitudes de devolución · Rechazadas · Sin resultados

### `RehniMarket-frontend/src/features/company/components/dashboard/finance/BankAccountForm.tsx`
- **Íconos lucide:** X
- **Textos:** Banco · Cancelar · Documento · Número de cuenta · Tipo de cuenta · Titular de la cuenta
- **Atributos:** placeholder=Ej. Bancolombia · placeholder=NIT o cédula · placeholder=Nombre completo o razón social · placeholder=Número completo
- **Alertas:** error: Completa titular, documento, banco y número de cuenta.
- **Otros textos:** Completa titular, documento, banco y número de cuenta. · Cuenta bancaria actualizada. · Cuenta bancaria guardada. · Editar cuenta bancaria · Guardando… · Guardar cuenta · No se pudo guardar la cuenta bancaria. · Nueva cuenta bancaria

### `RehniMarket-frontend/src/features/company/components/dashboard/finance/BankAccountsList.tsx`
- **Íconos lucide:** Building2 · Pencil · Plus · Star · Trash2
- **Textos:** Editar · Eliminar · Esta acción no se puede deshacer. · Nueva cuenta · Predeterminada · Registra las cuentas donde puedes recibir el giro del 95% neto de tus liquidaciones mensuales. La cuenta predeterminada es la que se usa al generar cada liquidación.
- **Atributos:** confirmLabel=Eliminar cuenta · description=Registra al menos una cuenta para recibir el giro de tus liquidaciones mensuales. · title=Aún no tienes cuentas bancarias · title=Eliminar cuenta bancaria
- **Alertas:** success: Cuenta bancaria eliminada.
- **Otros textos:** Cuenta bancaria eliminada. · No se pudo eliminar la cuenta bancaria.

### `RehniMarket-frontend/src/features/company/components/dashboard/finance/FinanceSummary.tsx`
- **Íconos lucide:** Calendar · Coins · TrendingUp · Wallet
- **Atributos:** description=Intenta de nuevo en unos momentos. · subtitle=5% acumulado sobre ventas válidas · subtitle=Corte mensual estimado · subtitle=Histórico de todas tus liquidaciones · subtitle=Liquidaciones aún no pagadas · title=Comisión Rehni Market · title=No se pudo cargar el resumen financiero · title=Próxima liquidación · title=Saldo neto pendiente · title=Ventas acumuladas

### `RehniMarket-frontend/src/features/company/components/dashboard/finance/PayoutsList.tsx`
- **Íconos lucide:** Eye · Receipt
- **Textos:** Anterior · Siguiente · Ver detalle
- **Atributos:** description=Cuando Rehni Market genere tu primera liquidación mensual, aparecerá aquí. · title=Aún no tienes liquidaciones

### `RehniMarket-frontend/src/features/company/components/dashboard/order/OrderDetailModal.tsx`
- **Íconos lucide:** Mail · MapPin · Pencil · Phone · Store · Truck
- **Textos:** Cancelar · Cargando pedido… · Editar envío · Envío · Guardar información de envío · IVA · Productos · Selecciona una transportadora · Subtotal · Total
- **Atributos:** label=Número de guía · label=Transportadora · placeholder=Ej. 123456789
- **Alertas:** success: Información de envío guardada para el pedido ${updated.reference}. · success: Pedido ${updated.reference} actualizado a "${ORDER_STATUS_LABEL[updated.status]}".
- **Otros textos:** No aplica · No se pudo actualizar el estado del pedido. · No se pudo cargar el detalle del pedido. · No se pudo guardar la información de envío.

### `RehniMarket-frontend/src/features/company/components/dashboard/product/AttributeValueFields.tsx`
- **Textos:** Sin especificar
- **Atributos:** placeholder=Sin especificar
- **Otros textos:** Selecciona una categoría para ver sus atributos.

### `RehniMarket-frontend/src/features/company/components/dashboard/product/DiscountFields.tsx`
- **Textos:** El precio final lo calcula el backend a partir de esta configuración. · Tipo
- **Otros textos:** Monto de descuento · Porcentaje de descuento

### `RehniMarket-frontend/src/features/company/components/dashboard/product/GenerateVariantsModal.tsx`
- **Íconos lucide:** X
- **Textos:** Cancelar · Cargando ejes de variante... · Crear · Ejes a combinar · Generar combinaciones · La categoría de este producto no tiene ejes de variante con opciones configuradas. · No hay combinaciones posibles con los ejes seleccionados. · Precio base · Se crearán · Stock base
- **Alertas:** error: Ingresa un precio y un stock base válidos. · error: Selecciona al menos una combinación nueva. · success: ${created} variante(s) creada(s).
- **Otros textos:** Algunas combinaciones no se pudieron crear. Revisa la lista y reintenta. · Calculando... · Creando... · Crear seleccionadas · Ingresa un precio y un stock base válidos. · No se pudieron generar las combinaciones. · Selecciona al menos una combinación nueva. · Ver combinaciones

### `RehniMarket-frontend/src/features/company/components/dashboard/product/ProductEdit.tsx`
- **Íconos lucide:** X
- **Textos:** Aquí se edita solo la identidad del producto. El precio, el stock, el SKU, el descuento y las imágenes se administran en cada variante. · Cancelar · Cargando producto... · Categoría · Descripción · Editar producto · Especificaciones del producto · Información común a todas las variantes. Los atributos de cada categoría los administra el equipo de Rehni-Market. · Información del producto · Nombre · Si lo activas, el comprador verá el IVA en el detalle y se sumará al pagar.
- **Otros textos:** Completa nombre, categoría y descripción. · Guardando… · Guardar cambios · No se pudieron guardar los cambios. Revisa los datos e intenta de nuevo. · No se pudo cargar la información del producto.

### `RehniMarket-frontend/src/features/company/components/dashboard/product/ProductForm.tsx`
- **Íconos lucide:** X
- **Textos:** Cancelar · Categoría · Crear nuevo producto · Descripción · El producto es solo la identidad del artículo. El precio, el stock, el SKU, el descuento y las imágenes se definen en cada variante, en el siguiente paso. · Especificaciones del producto · Información del producto · Nombre del producto · Seleccione una categoría · Si lo activas, el comprador verá el IVA en el detalle y se sumará al pagar. Si no aplica, déjalo sin marcar.
- **Otros textos:** Completa nombre, categoría y descripción. · Creando... · Crear y agregar variantes · No se pudo crear el producto. Intenta de nuevo.

### `RehniMarket-frontend/src/features/company/components/dashboard/product/Products.tsx`
- **Íconos lucide:** Eye · ImageOff · Pencil · Plus · Search · Trash2
- **Textos:** Administra todos los productos de tu empresa. · Anterior · Lista de productos · Nuevo producto · Productos · Siguiente
- **Atributos:** aria-label=Buscar producto · confirmLabel=Eliminar · description=Ajusta la búsqueda o crea un producto nuevo. · message=¿Eliminar este producto? Dejará de estar visible en el catálogo público, pero podrás reactivarlo cambiando su estado a Activo. · placeholder=Buscar producto… · title=Activos · title=Agotados · title=Editar producto · title=Eliminar producto · title=No se encontraron productos · title=Ocultos · title=Productos publicados
- **Alertas:** error: No se pudo cambiar el estado del producto. · error: No se pudo eliminar el producto. · success: Producto eliminado correctamente.
- **Otros textos:** Activar producto · Desactivar producto · Eliminado · Inactivo · No se pudo cambiar el estado del producto. · No se pudo eliminar el producto. · Producto eliminado correctamente.

### `RehniMarket-frontend/src/features/company/components/dashboard/product/VariantModal.tsx`
- **Íconos lucide:** Loader2 · Star · Trash2 · Upload · X
- **Textos:** Cancelar · Cargando variante... · Descuento de la variante · Imágenes · La categoría de este producto no tiene ejes de variante configurados. · No has agregado imágenes. · Nombre · Precio · Principal · SKU · Sin descuento propio, el backend aplica el del producto si lo hay. · Stock
- **Atributos:** confirmLabel=Eliminar · label=Variante con descuento propio · message=¿Eliminar esta imagen? · placeholder=Opcional · title=Eliminar imagen
- **Alertas:** error: No se pudieron subir las imágenes. · error: No se pudo eliminar la imagen. · error: No se pudo marcar la imagen como principal.
- **Otros textos:** Agregar variante · Asigna un nombre o elige las opciones de la variante. · Crear variante · Editar variante · Guardando… · Guardar cambios · No se pudieron subir las imágenes. · No se pudo cargar la información de la variante. · No se pudo eliminar la imagen. · No se pudo guardar la variante. · No se pudo marcar la imagen como principal. · Nombre de la variante · Selecciona una opción para cada eje de variante.

### `RehniMarket-frontend/src/features/company/components/dashboard/product/VariantsPanel.tsx`
- **Íconos lucide:** Loader2 · Pencil · Plus · Trash2 · Wand2
- **Textos:** Agregar · Cada variante es la unidad que se vende: define su precio, stock, SKU, descuento e imágenes. · Cargando variantes… · Eliminada · Generar · Mostrar variantes eliminadas · Sin imagen · Variantes
- **Atributos:** confirmLabel=Eliminar · description=Agrega al menos una variante para poder publicarlo. · message=La variante se marca como eliminada (soft-delete). Podrás volver a crear la combinación más adelante. · title=Editar variante · title=Eliminar variante · title=Este producto todavía no tiene variantes
- **Otros textos:** No se pudo eliminar la variante.

### `RehniMarket-frontend/src/features/company/components/dashboard/returns/ReturnDetailModal.tsx`
- **Íconos lucide:** Check · Mail · RotateCcw · X
- **Textos:** Aprobar devolución · Cargando solicitud… · Cerrar · Indícale al comprador por qué no se aprueba la devolución. Este mensaje es obligatorio y se le mostrará. · Motivo del comprador · Motivo del rechazo · Producto · Rechazar devolución
- **Atributos:** confirmLabel=Rechazar devolución · label=Motivo del rechazo · placeholder=Ej. El producto presenta daños causados por el comprador. · title=Rechazar devolución
- **Otros textos:** Describe el motivo con un poco más de detalle. · Devolución · Devolución rechazada. · No se pudo cargar la solicitud de devolución. · No se pudo procesar la solicitud.

### `RehniMarket-frontend/src/features/orders/components/OrderDetailModal.tsx`
- **Íconos lucide:** Mail · MapPin · Phone · Store
- **Textos:** Cancelar pedido · Cargando pedido… · Descuentos · Envío · IVA · Productos · Solicitar devolución · Subtotal · Total
- **Atributos:** confirmLabel=Cancelar pedido · message=¿Cancelar este pedido? Esta acción no se puede deshacer. · title=Cancelar pedido
- **Alertas:** success: Pedido ${updated.reference} cancelado.
- **Otros textos:** No aplica · No se pudo cancelar el pedido. · No se pudo cargar el detalle del pedido.

### `RehniMarket-frontend/src/features/orders/components/OrderShippingInfo.tsx`
- **Íconos lucide:** ExternalLink · PackageSearch · Truck
- **Textos:** Consultar seguimiento · Número de guía · Transportadora
- **Atributos:** description=La empresa aún no ha registrado la transportadora ni el número de guía. · title=Información de envío pendiente

### `RehniMarket-frontend/src/features/orders/components/OrderTimeline.tsx`
- **Íconos lucide:** Check · X
- **Textos:** Este pedido fue cancelado.
- **Otros textos:** En proceso · Entregado · Enviado · Pendiente

### `RehniMarket-frontend/src/features/payouts/components/PayoutDetailModal.tsx`
- **Textos:** Cargando liquidación... · Conversión RehniCoin · Cuenta de destino · Equivalente en RehniCoin · Generada · Pagada · Promise · Tasa de conversión · Valor neto · Ventas brutas
- **Otros textos:** Detalle de liquidación · Liquidación · No se pudo cargar el detalle de la liquidación. · Pendiente

### `RehniMarket-frontend/src/features/public/auth/components/AccountSettings.tsx`
- **Íconos lucide:** Pencil · Save · ShieldCheck · Upload · X
- **Textos:** Administra tu información personal y la seguridad de tu cuenta. · Cambia tu contraseña verificando tu correo electrónico. · Cambiar foto · Cancelar · Configuración de cuenta · Cuenta · El correo con el que inicias sesión. · Perfil · Seguridad · Tu foto, tu nombre y tu teléfono de contacto.
- **Atributos:** aria-label=Editar correo · aria-label=Editar perfil · confirmLabel=Enviar código · label=Correo electrónico · label=Nombre · label=Teléfono · title=Cambiar contraseña
- **Alertas:** error: El nombre debe tener al menos 3 caracteres. · error: El teléfono debe tener exactamente 10 dígitos. · error: Ingresa un correo electrónico válido. · error: No se pudo actualizar el correo. Es posible que ya esté en uso. · error: No se pudo actualizar el perfil. Intenta de nuevo. · error: No se pudo actualizar la foto de perfil. Intenta de nuevo. · error: No se pudo enviar el código. Intenta de nuevo más tarde.
- **Otros textos:** El nombre debe tener al menos 3 caracteres. · El teléfono debe tener exactamente 10 dígitos. · Enviando código… · Foto de perfil · Guardando… · Guardar · Guardar foto · Ingresa un correo electrónico válido. · No se pudo actualizar el correo. Es posible que ya esté en uso. · No se pudo actualizar el perfil. Intenta de nuevo. · No se pudo actualizar la foto de perfil. Intenta de nuevo. · No se pudo enviar el código. Intenta de nuevo más tarde.

### `RehniMarket-frontend/src/features/public/auth/components/OtpInput.tsx`
- **Otros textos:** ArrowLeft · ArrowRight · Backspace · Código de verificación

### `RehniMarket-frontend/src/features/public/auth/components/TermsModal.tsx`
- **Atributos:** title=Términos y condiciones

### `RehniMarket-frontend/src/features/public/auth/components/terms/CompanyTerms.tsx`
- **Textos:** 1. Registro empresarial · 2. Publicación de productos · 3. Responsabilidad comercial · 4. Documentación empresarial · 5. Aceptación · Al registrar la empresa confirmas que aceptas estos términos y condiciones. · Bienvenido a · La empresa autoriza la validación de documentos necesarios para operar dentro de RehniMarket. · La empresa debe cumplir con las condiciones ofrecidas a los clientes y gestionar correctamente sus pedidos. · La empresa debe proporcionar información real, documentos válidos y datos necesarios para la validación. · La empresa es responsable de la información publicada, incluyendo nombre, descripción, precio, stock e imágenes. · RehniMarket Empresas

### `RehniMarket-frontend/src/features/public/auth/components/terms/UserTerms.tsx`
- **Textos:** 1. Uso de la plataforma · 2. Información de la cuenta · 3. Compras y pedidos · 4. Uso responsable · 5. Aceptación · Al registrarte confirmas que has leído y aceptado estos términos y condiciones. · Bienvenido a · El usuario debe proporcionar información real y mantener la seguridad de sus datos de acceso. · El usuario debe verificar la información del producto antes de confirmar una compra. · El usuario puede consultar productos, realizar compras, gestionar pedidos y utilizar las funcionalidades disponibles dentro de la plataforma. · Está prohibido utilizar la plataforma para actividades fraudulentas o que afecten a otros usuarios. · RehniMarket

### `RehniMarket-frontend/src/features/public/auth/pages/ForgotPassword.tsx`
- **Íconos lucide:** KeyRound · Mail
- **Textos:** Enviar código · Volver al inicio de sesión
- **Atributos:** label=Correo electrónico · placeholder=correo@ejemplo.com · subtitle=Ingresa el correo de tu cuenta y te enviaremos un código para restablecerla. · title=¿Olvidaste tu contraseña?
- **Alertas:** error: Ocurrió un error inesperado.
- **Otros textos:** No fue posible enviar el código de recuperación. · Ocurrió un error inesperado.

### `RehniMarket-frontend/src/features/public/auth/pages/Login.tsx`
- **Íconos lucide:** Eye · EyeOff · Lock · Mail
- **Textos:** Crear cuenta · Iniciar sesión · ¿Olvidaste tu contraseña?
- **Atributos:** label=Contraseña · label=Correo electrónico · placeholder=correo@ejemplo.com · placeholder=•••••••• · subtitle=Inicia sesión para continuar en RehniMarket. · title=Bienvenido de nuevo
- **Otros textos:** Mostrar contraseña · Ocultar contraseña

### `RehniMarket-frontend/src/features/public/auth/pages/RegisterCompany.tsx`
- **Íconos lucide:** Building2 · Eye · EyeOff · FileText · Lock · Mail · MapPin · Phone · Upload · User
- **Textos:** Certificado de Cámara de Comercio · Contraseña · Crear cuenta empresarial · Datos de la empresa · Iniciar sesión · Representante · Solo archivos PDF
- **Atributos:** hint=Mínimo 8 caracteres, con mayúscula, minúscula y número. · label=Confirmar contraseña · label=Contraseña · label=Correo electrónico · label=DV · label=Dirección · label=NIT · label=Nombre completo · label=Nombre de la empresa · label=Teléfono · placeholder=900123456 · placeholder=Dirección de la empresa · placeholder=Nombre del representante · placeholder=Número de contacto · placeholder=Razón social · placeholder=correo@ejemplo.com · placeholder=•••••••• · subtitle=Crea tu cuenta empresarial para vender productos en RehniMarket. · title=Registrar empresa
- **Alertas:** error: Debes adjuntar el certificado. · error: Ocurrió un error inesperado.
- **Otros textos:** Debes adjuntar el certificado. · Mostrar contraseña · Ocultar contraseña · Ocurrió un error inesperado. · Ocurrió un error. · Seleccionar archivo PDF

### `RehniMarket-frontend/src/features/public/auth/pages/RegisterUser.tsx`
- **Íconos lucide:** Eye · EyeOff · Lock · Mail · Phone · User
- **Textos:** Crear cuenta · Datos de acceso · Datos personales · Iniciar sesión
- **Atributos:** hint=Mínimo 8 caracteres, con mayúscula, minúscula y número. · label=Confirmar contraseña · label=Contraseña · label=Correo electrónico · label=Nombre completo · label=Teléfono · placeholder=Número de contacto · placeholder=Tu nombre completo · placeholder=correo@ejemplo.com · placeholder=•••••••• · subtitle=Únete a RehniMarket para comprar y guardar tus favoritos. · title=Crear una cuenta
- **Alertas:** error: Ocurrió un error inesperado.
- **Otros textos:** Mostrar contraseña · Ocultar contraseña · Ocurrió un error inesperado. · Ocurrió un error.

### `RehniMarket-frontend/src/features/public/auth/pages/ResetPassword.tsx`
- **Íconos lucide:** Eye · EyeOff · Lock · ShieldCheck
- **Textos:** Código de 6 dígitos · Guardar nueva contraseña · Volver al inicio de sesión
- **Atributos:** label=Confirmar contraseña · label=Nueva contraseña · placeholder=•••••••• · title=Nueva contraseña
- **Alertas:** error: Ingresa el código completo. · error: Las contraseñas no coinciden. · error: Ocurrió un error inesperado. · success: Contraseña actualizada correctamente.
- **Otros textos:** Contraseña actualizada correctamente. · Código de recuperación · Ingresa el código completo. · Las contraseñas no coinciden. · Mostrar contraseña · Ocultar contraseña · Ocurrió un error inesperado.

### `RehniMarket-frontend/src/features/public/auth/pages/UpdateCertificate.tsx`
- **Íconos lucide:** CheckCircle2 · FileUp · Lock · Mail · ShieldAlert
- **Textos:** Actualizar certificado · Certificado actualizado · Contraseña · Correo electrónico · El certificado que presentaste no es válido. Ingresa tus credenciales y carga uno nuevo para que tu empresa vuelva a revisión. · Ir al inicio de sesión · Máximo 5 MB · Solo PDF · Nuevo certificado · RehniMarket · Volver al inicio de sesión
- **Atributos:** placeholder=empresa@correo.com · placeholder=••••••••
- **Otros textos:** Actualizando… · Correo o contraseña incorrectos. · El certificado de esta empresa no puede actualizarse en este momento. · El certificado debe pesar como máximo 5 MB. · El certificado debe ser un archivo PDF de máximo 5 MB. · El certificado debe ser un archivo PDF. · No se pudo actualizar el certificado. Intenta de nuevo. · Seleccionar PDF · Tu empresa se encuentra suspendida.

### `RehniMarket-frontend/src/features/public/auth/pages/VerifyEmail.tsx`
- **Íconos lucide:** AlertCircle · Mail · RefreshCw · Timer
- **Textos:** Cancelar · El código expiró · Guardar · Iniciar sesión · Reenviar código · Solicita uno nuevo para continuar. · Verificar correo · ¿El correo es incorrecto? Cambiarlo · ¿No recibiste el código?
- **Atributos:** placeholder=Nuevo correo electrónico · title=Verifica tu correo
- **Alertas:** error: El código expiró. Solicita uno nuevo para continuar. · error: Ingresa el código completo. · error: Ingresa un correo electrónico. · error: No fue posible cambiar el correo. · error: No fue posible reenviar el código. · error: Ocurrió un error inesperado. · success: Correo actualizado correctamente. Se ha enviado un nuevo código de verificación. · success: Cuenta verificada correctamente.
- **Otros textos:** Correo actualizado correctamente. Se ha enviado un nuevo código de verificación. · Cuenta verificada correctamente. · Código de verificación · El código expiró. Solicita uno nuevo para continuar. · Ingresa el código completo. · Ingresa un correo electrónico. · No fue posible cambiar el correo. · No fue posible reenviar el código. · Ocurrió un error inesperado. · Ocurrió un error. · Se ha enviado un nuevo código a tu correo electrónico.

### `RehniMarket-frontend/src/features/public/categories/components/CategoriesBenefits.tsx`
- **Íconos lucide:** Coins · Headset · ShieldCheck · Truck
- **Otros textos:** Compra segura · Envíos rápidos · RehniCoin · Soporte 24/7

### `RehniMarket-frontend/src/features/public/categories/components/CategoriesFilterBar.tsx`
- **Íconos lucide:** Search
- **Textos:** Todas las categorías
- **Atributos:** aria-label=Buscar categoría · aria-label=Filtrar por categoría · aria-label=Ordenar categorías · placeholder=Buscar categoría…

### `RehniMarket-frontend/src/features/public/categories/components/CategoriesGrid.tsx`
- **Íconos lucide:** FolderSearch
- **Atributos:** description=Intenta de nuevo en unos momentos. · title=No se pudieron cargar las categorías
- **Otros textos:** Aún no hay categorías disponibles. · No hay categorías que coincidan con tu búsqueda.

### `RehniMarket-frontend/src/features/public/categories/components/CategoriesHero.tsx`
- **Textos:** Encuentra productos increíbles en todas nuestras categorías. · Explorar categorías

### `RehniMarket-frontend/src/features/public/categories/components/CategoryCard.tsx`
- **Íconos lucide:** ArrowRight · ImageOff

### `RehniMarket-frontend/src/features/public/company/components/CompanyProfile.tsx`
- **Íconos lucide:** BadgeCheck · CalendarDays · ChevronLeft · Clock · Flag · Info · Package · Star · Store · Tag
- **Textos:** Categorías de la tienda · Empresa verificada · En RehniMarket desde · Esta tienda todavía no agregó una descripción. · Información de la tienda · Más recientes primero · Nombre · Productos publicados · Reportar empresa · Verificación · Verificada · Volver a productos
- **Atributos:** aria-label=Secciones de la tienda · description=Las reseñas de los productos de esta tienda aparecerán aquí cuando sus clientes las publiquen. · description=Puede que ya no esté disponible o que el enlace sea incorrecto. · title=No encontramos esta empresa · title=Todavía no hay calificaciones
- **Otros textos:** Esta empresa todavía no tiene productos publicados. · Información

### `RehniMarket-frontend/src/features/public/company/components/CompanyRatingBadge.tsx`
- **Íconos lucide:** Star
- **Textos:** Sin calificaciones todavía

### `RehniMarket-frontend/src/features/public/home/components/BusinessCtaSection.tsx`
- **Íconos lucide:** ArrowRight · Eye · ShieldCheck · Store · TrendingUp
- **Textos:** Haz crecer · Registra tu empresa y lleva tus productos a más clientes. · Registrar mi empresa · RehniMarket · ¿Tienes una empresa?
- **Otros textos:** Herramientas de gestión · Más visibilidad · Ventas seguras

### `RehniMarket-frontend/src/features/public/home/components/CategoriesSection.tsx`
- **Textos:** No se pudieron cargar las categorías.
- **Atributos:** subtitle=Encuentra exactamente lo que necesitas · title=Explorar categorías

### `RehniMarket-frontend/src/features/public/home/components/Hero.tsx`
- **Íconos lucide:** ChevronLeft · ChevronRight
- **Atributos:** aria-label=Anuncio anterior · aria-label=Siguiente anuncio

### `RehniMarket-frontend/src/features/public/home/components/HomeCategoryCard.tsx`
- **Íconos lucide:** ImageOff

### `RehniMarket-frontend/src/features/public/home/components/HomeInfoCards.tsx`
- **Íconos lucide:** BadgeCheck · Headset · LayoutGrid · ShieldCheck
- **Otros textos:** Compra segura · Empresas verificadas · Estamos para ayudarte · Las mejores marcas · Soporte dedicado · Tu información protegida · Variedad y calidad · Vendedores confiables

### `RehniMarket-frontend/src/features/public/home/components/HomeProductSection.tsx`
- **Textos:** Promise

### `RehniMarket-frontend/src/features/public/home/components/HomeSectionHeader.tsx`
- **Íconos lucide:** ArrowRight
- **Textos:** Ver · Ver todas

### `RehniMarket-frontend/src/features/public/home/components/NewProductsSection.tsx`
- **Atributos:** subtitle=Descubre los últimos productos agregados a RehniMarket · title=Novedades
- **Otros textos:** No hay novedades disponibles en este momento.

### `RehniMarket-frontend/src/features/public/home/components/OffersSection.tsx`
- **Íconos lucide:** Percent
- **Atributos:** subtitle=Aprovecha los mejores precios en tecnología de las mejores marcas. · title=Ofertas especiales
- **Otros textos:** No hay ofertas disponibles en este momento.

### `RehniMarket-frontend/src/features/public/home/components/ProductCard.tsx`
- **Íconos lucide:** Heart · ImageOff · ShoppingCart · Star
- **Textos:** Agregar · Nuevo · Sin reseñas
- **Alertas:** success: "${product.name}" se agregó a tu carrito.
- **Otros textos:** Agregar a favoritos · No se pudo agregar el producto al carrito. · Quitar de favoritos

### `RehniMarket-frontend/src/features/public/products/components/CatalogFilters.tsx`
- **Íconos lucide:** Search · X
- **Textos:** Rango de precio · Solo con descuento · Solo disponibles · Todas las categorías
- **Atributos:** aria-label=Limpiar búsqueda · label=Categoría · label=Ordenar por · placeholder=Máximo · placeholder=Mínimo
- **Otros textos:** Mayor descuento · Mayor precio · Menor precio · Relevancia

### `RehniMarket-frontend/src/features/public/products/components/CollectionView.tsx`
- **Textos:** Promise

### `RehniMarket-frontend/src/features/public/products/components/ProductDetail.tsx`
- **Íconos lucide:** ChevronLeft · Flag · PackageX · ShoppingCart
- **Textos:** Cantidad · Comprar ahora · Desde · En stock · · Esa combinación no está disponible. · Las cuentas de empresa o administración no pueden realizar compras. · Reportar · Selecciona todas las opciones antes de continuar. · Selecciona una opción para ver el stock disponible. · Sin stock · Volver a productos
- **Atributos:** aria-label=Aumentar cantidad · aria-label=Disminuir cantidad · description=Puede que ya no esté disponible o que el enlace sea incorrecto. · title=No encontramos este producto · title=Reportar producto
- **Otros textos:** Agregando… · Agregar al carrito · Ocurrió un error al agregar el producto al carrito. · Ya tienes la cantidad máxima disponible en tu carrito.

### `RehniMarket-frontend/src/features/public/products/components/ProductFaq.tsx`
- **Íconos lucide:** ChevronDown
- **Textos:** Preguntas frecuentes
- **Otros textos:** Cuando la empresa despacha tu pedido, asigna una transportadora y un número de guía. Puedes consultarlos en el detalle del pedido, en Mis pedidos. · Los pagos en RehniMarket se hacen con RehniCoin, el saldo de tu billetera dentro de la plataforma. 1 RehniCoin equivale a 1 peso. Recargas tu saldo y pagas al finalizar la compra. · Puedes cancelar un pedido mientras no haya entrado en preparación. Al cancelarlo se te reintegra automáticamente el total a tu billetera RehniCoin. · ¿Cómo pago mi compra? · ¿Cómo sigo mi envío? · ¿Puedo devolver un producto? · ¿Qué pasa si cancelo un pedido?

### `RehniMarket-frontend/src/features/public/products/components/ProductGallery.tsx`
- **Íconos lucide:** ImageOff

### `RehniMarket-frontend/src/features/public/products/components/ProductGrid.tsx`
- **Íconos lucide:** PackageSearch
- **Atributos:** description=Intenta de nuevo en unos momentos. · title=No se pudieron cargar los productos

### `RehniMarket-frontend/src/features/public/products/components/ProductTabs.tsx`
- **Textos:** Este producto no tiene especificaciones registradas.
- **Otros textos:** Descripción · Especificaciones

### `RehniMarket-frontend/src/features/public/products/components/ProductTaxLine.tsx`
- **Textos:** IVA: · No aplica · Total con IVA:

### `RehniMarket-frontend/src/features/public/products/components/ProductTrustCards.tsx`
- **Íconos lucide:** BadgeCheck · RotateCcw · ShieldHalf · Truck
- **Otros textos:** Compra protegida · Coordinamos la entrega con transportadoras aliadas a todo el país. · Devolución fácil · Envío nacional · La empresa completó la verificación de su certificado en RehniMarket. · La empresa está registrada en RehniMarket. · Si tu pedido fue entregado, puedes solicitar la devolución de un producto desde Mis pedidos. · Vendedor registrado · Vendedor verificado

### `RehniMarket-frontend/src/features/public/products/components/ProductsList.tsx`
- **Íconos lucide:** Filter · RotateCcw
- **Textos:** Filtros · Limpiar
- **Atributos:** title=Filtros
- **Otros textos:** Buscando productos… · No se encontraron productos con estos filtros. · Productos

### `RehniMarket-frontend/src/features/public/products/components/PublicProductCollection.tsx`
- **Textos:** Promise

### `RehniMarket-frontend/src/features/public/products/components/RelatedProducts.tsx`
- **Íconos lucide:** ChevronLeft · ChevronRight
- **Textos:** Productos relacionados
- **Atributos:** aria-label=Anterior · aria-label=Siguiente

### `RehniMarket-frontend/src/features/public/products/components/SellerCard.tsx`
- **Íconos lucide:** BadgeCheck · ShieldCheck · Store
- **Textos:** Empresa verificada · Vendido por · Ver tienda
- **Atributos:** aria-label=Empresa verificada

### `RehniMarket-frontend/src/features/public/reviews/components/ProductReviewsSummary.tsx`
- **Íconos lucide:** Star
- **Textos:** Este producto todavía no tiene reseñas. · Opiniones de compradores

### `RehniMarket-frontend/src/features/public/reviews/components/ReviewForm.tsx`
- **Textos:** Escribe tu reseña
- **Atributos:** placeholder=Cuéntale a otros compradores qué te pareció (opcional)
- **Alertas:** error: Selecciona una calificación antes de enviar tu reseña. · success: ¡Gracias por tu reseña!
- **Otros textos:** Enviando… · Enviar reseña · No se pudo enviar tu reseña. · Selecciona una calificación antes de enviar tu reseña. · ¡Gracias por tu reseña!

### `RehniMarket-frontend/src/features/public/reviews/components/ReviewsList.tsx`
- **Textos:** Anterior · Siguiente
- **Atributos:** description=Sé el primero en compartir tu opinión después de comprarlo. · title=Este producto todavía no tiene reseñas

### `RehniMarket-frontend/src/features/public/reviews/components/ReviewsSection.tsx`
- **Íconos lucide:** ChevronRight
- **Textos:** Podrás reseñar este producto una vez que te sea entregado. · Ver todas las opiniones · Ya reseñaste este producto.
- **Atributos:** confirmLabel=Eliminar · message=¿Eliminar tu reseña? Esta acción no se puede deshacer. · title=Eliminar reseña
- **Alertas:** error: No se pudo eliminar tu reseña. · success: Tu reseña fue eliminada.
- **Otros textos:** Eliminando… · Eliminar mi reseña · No se pudo eliminar tu reseña. · Tu reseña fue eliminada.

### `RehniMarket-frontend/src/features/public/reviews/components/StarRating.tsx`
- **Íconos lucide:** Star

### `RehniMarket-frontend/src/features/reports/components/ReportModal.tsx`
- **Íconos lucide:** AlertTriangle · ImagePlus · X
- **Textos:** Añadir imágenes · Cancelar · Motivo
- **Atributos:** placeholder=Cuéntanos más detalles sobre el problema. · title=Quitar imagen
- **Otros textos:** Cada imagen debe pesar como máximo 5 MB. · Debes indicar un motivo · Ej: Incumplimiento de las políticas de la plataforma. · Ej: Producto falso o no corresponde a la descripción. · Enviando... · Enviar reporte · Reporte enviado. Un administrador revisará esta empresa. · Reporte enviado. Un administrador revisará este producto. · Solo se permiten imágenes JPEG, PNG o WEBP.

### `RehniMarket-frontend/src/features/returns/components/RequestReturnModal.tsx`
- **Textos:** Cancelar · Enviar solicitud · La empresa revisará tu solicitud. Si la aprueba, se te reintegrará el valor del producto en RehniCoin.
- **Atributos:** label=Motivo de la devolución · placeholder=Cuéntale a la empresa por qué quieres devolver este producto. · title=Solicitar devolución
- **Alertas:** success: Solicitud de devolución enviada. La empresa la revisará.
- **Otros textos:** No se pudo enviar la solicitud de devolución. · Solicitud de devolución enviada. La empresa la revisará. · Solo puedes solicitar la devolución de un pedido que ya fue entregado. · Ya existe una solicitud de devolución activa para este producto.

### `RehniMarket-frontend/src/features/returns/components/ReturnStatusCard.tsx`
- **Íconos lucide:** RotateCcw
- **Textos:** Devolución solicitada · Motivo del rechazo: · Motivo:

### `RehniMarket-frontend/src/features/user/components/dashboard/Addresses.tsx`
- **Íconos lucide:** MapPin · Plus · Star · Trash2 · X
- **Textos:** Administra tus direcciones de envío. · Agregar dirección · Direcciones · Esta acción no se puede deshacer. · Predeterminada
- **Atributos:** confirmLabel=Eliminar dirección · description=Agrega una dirección para agilizar tus próximas compras. · title=Aún no has registrado direcciones · title=Eliminar · title=Eliminar dirección · title=Marcar como predeterminada · title=No pudimos cargar tus direcciones
- **Alertas:** error: No se pudo eliminar la dirección. · error: No se pudo marcar la dirección como predeterminada. · success: Dirección eliminada.
- **Otros textos:** Cancelar · Dirección · Dirección eliminada. · No se pudo eliminar la dirección. · No se pudo marcar la dirección como predeterminada.

### `RehniMarket-frontend/src/features/user/components/dashboard/Favorites.tsx`
- **Íconos lucide:** Heart · ImageOff · Trash2
- **Textos:** Este producto ya no está disponible. · Explorar productos · Favoritos · Productos que guardaste para más tarde.
- **Atributos:** aria-label=Quitar de favoritos · description=Guarda los productos que te interesan y vuelve a ellos cuando quieras. · title=Aún no tienes favoritos · title=No pudimos cargar tus favoritos · title=Quitar de favoritos

### `RehniMarket-frontend/src/features/user/components/dashboard/Home.tsx`
- **Íconos lucide:** Coins · Heart · Package · ShoppingBag
- **Textos:** Bienvenido nuevamente a RehniMarket · Explorar productos · Recomendados para ti · Último pedido
- **Atributos:** description=Tu compra más reciente aparecerá aquí. · subtitle=Disponible · subtitle=En curso · subtitle=Productos guardados · title=Favoritos · title=Pedidos pendientes · title=Saldo RehniCoin · title=Todavía no hay productos para recomendarte · title=Todavía no tienes pedidos

### `RehniMarket-frontend/src/features/user/components/dashboard/Orders.tsx`
- **Íconos lucide:** Eye · ShoppingBag
- **Textos:** Consulta el estado y el historial de tus pedidos. · Explorar productos · Mis pedidos · Ver detalle
- **Atributos:** confirmLabel=Cancelar pedido · description=Cuando hagas tu primera compra, podrás seguir su estado desde aquí. · message=¿Cancelar este pedido? Esta acción no se puede deshacer. · title=Cancelar pedido · title=No pudimos cargar tus pedidos · title=Todavía no tienes pedidos
- **Alertas:** error: No se pudo cancelar el pedido.
- **Otros textos:** Cancelando… · No se pudo cancelar el pedido.

### `RehniMarket-frontend/src/features/user/components/dashboard/Wallet.tsx`
- **Íconos lucide:** Coins · Plus
- **Textos:** Consulta tu saldo y tus movimientos. 1 RehniCoin equivale a 1 COP. · Descripción · Fecha · Monto · Movimientos · Recargar RehniCoins · RehniCoins · Tipo
- **Atributos:** subtitle=RehniCoin · title=Saldo disponible · title=Todavía no tienes movimientos de RehniCoin

### `RehniMarket-frontend/src/features/wallet/components/RechargeRequestModal.tsx`
- **Íconos lucide:** MessageCircle
- **Textos:** Cancelar · Cantidad · Confirmar solicitud
- **Atributos:** description=1 RehniCoin equivale a 1 COP. Confirmamos el pago por WhatsApp. · label=Otra cantidad · placeholder=Ej. 30000 · title=Recargar RehniCoins
- **Alertas:** error: No se pudo abrir WhatsApp: falta configurar el número de contacto de RehniMarket. · success: Solicitud de recarga preparada. Continúa la conversación en WhatsApp.
- **Otros textos:** Ingresa la cantidad de RehniCoins que quieres solicitar. · Ingresa solo números, sin letras ni símbolos. · La cantidad debe ser mayor a cero. · No se pudo abrir WhatsApp: falta configurar el número de contacto de RehniMarket. · Solicitud de recarga preparada. Continúa la conversación en WhatsApp.

### `RehniMarket-frontend/src/pages/dashboard/Admin.tsx`
- **Atributos:** description=Administra la plataforma
- **Otros textos:** Administrador · Panel Administrador · Panel Propietario · Propietario

### `RehniMarket-frontend/src/pages/dashboard/Company.tsx`
- **Atributos:** description=Administra tu negocio · title=Panel Empresa
- **Otros textos:** Empresa

### `RehniMarket-frontend/src/pages/public/NewProducts.tsx`
- **Atributos:** subtitle=Lo último que se publicó en RehniMarket, de lo más reciente a lo más antiguo. · title=Novedades
- **Otros textos:** No hay novedades disponibles en este momento.

### `RehniMarket-frontend/src/pages/public/Offers.tsx`
- **Atributos:** subtitle=Productos con descuento vigente en alguna de sus variantes disponibles. · title=Ofertas
- **Otros textos:** No hay ofertas disponibles en este momento.

### `RehniMarket-frontend/src/pages/user/Dashboard.tsx`
- **Atributos:** description=Administra tu cuenta · title=Panel Comprador
- **Otros textos:** Usuario

### `RehniMarket-frontend/src/shared/components/ConfirmModal.tsx`
- **Íconos lucide:** AlertTriangle · CheckCircle2 · Info
- **Otros textos:** Cancelar · Confirmar

### `RehniMarket-frontend/src/shared/components/Footer.tsx`
- **Textos:** El marketplace de tecnología donde empresas verificadas venden a más clientes. · Síguenos
- **Otros textos:** Categorías · Centro de ayuda · Comisiones · Comprar · Facebook · Guía de vendedores · Instagram · LinkedIn · M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.2c-1.2 0-1.6.8-1.6 1.6V12h2.7l-.4 2.9h-2.3v7A10 10 0 0 0 22 12Z · M6.9 21H3.3V9h3.6v12ZM5.1 7.4A2.1 2.1 0 1 1 5.1 3.2a2.1 2.1 0 0 1 0 4.2ZM21 21h-3.6v-5.8c0-1.4 0-3.2-1.9-3.2s-2.2 1.5-2.2 3.1V21H9.7V9h3.4v1.6h.1a3.8 3.8 0 0 1 3.4-1.9c3.6 0 4.3 2.4 4.3 5.5V21Z · Novedades · Ofertas · Política de privacidad · Productos · Registra tu empresa · RehniMarket · Soporte · Términos y condiciones · YouTube

### `RehniMarket-frontend/src/shared/components/MobileAppNotice.tsx`
- **Íconos lucide:** Smartphone · X
- **Atributos:** aria-label=Cerrar aviso

### `RehniMarket-frontend/src/shared/components/Pagination.tsx`
- **Íconos lucide:** ChevronLeft · ChevronRight
- **Atributos:** aria-label=Paginación · aria-label=Página anterior · aria-label=Página siguiente

### `RehniMarket-frontend/src/shared/components/alert/AlertMessage.tsx`
- **Íconos lucide:** AlertCircle · AlertTriangle · CheckCircle2 · Info · X
- **Atributos:** aria-label=Cerrar aviso

### `RehniMarket-frontend/src/shared/components/dashboard/DashboardLayout.tsx`
- **Atributos:** aria-label=Menú de navegación

### `RehniMarket-frontend/src/shared/components/dashboard/Sidebar.tsx`
- **Íconos lucide:** ArrowLeft · LogOut · PanelLeft · PanelLeftClose · X
- **Textos:** Volver a la tienda
- **Atributos:** aria-label=Cerrar menú · text=Cerrar sesión
- **Otros textos:** Contraer menú · Expandir menú · RehniMarket

### `RehniMarket-frontend/src/shared/components/dashboard/Topbar.tsx`
- **Íconos lucide:** Menu · UserCircle
- **Atributos:** aria-label=Abrir menú de navegación
- **Otros textos:** Tu perfil

### `RehniMarket-frontend/src/shared/components/navbar/ProfileDropdown.tsx`
- **Íconos lucide:** ChevronDown · LogOut
- **Textos:** Cerrar sesión
- **Otros textos:** Administrador · Empresa · Propietario · Usuario

### `RehniMarket-frontend/src/shared/components/navbar/navbar.tsx`
- **Íconos lucide:** Heart · ImageOff · Menu · Search · ShoppingCart · X
- **Textos:** Buscando… · Iniciar sesión · Mi carrito · Mi cuenta · Mis favoritos · No se encontraron productos · Registrarse
- **Atributos:** aria-label=Buscar · aria-label=Mi carrito · aria-label=Mis favoritos · placeholder=Buscar productos, marcas o categorías…
- **Otros textos:** Abrir menú · Categorías · Cerrar menú · Novedades · Ofertas · Productos · RehniMarket

### `RehniMarket-frontend/src/shared/components/ui/ErrorState.tsx`
- **Íconos lucide:** AlertTriangle
- **Otros textos:** No pudimos cargar esta información · Ocurrió un problema al obtener los datos. Intenta de nuevo. · Reintentar

### `RehniMarket-frontend/src/shared/components/ui/Modal.tsx`
- **Íconos lucide:** X
- **Atributos:** aria-label=Cerrar

### `RehniMarket-frontend/src/shared/components/ui/Select.tsx`
- **Íconos lucide:** ChevronDown

### `RehniMarket-frontend/src/shared/components/ui/Spinner.tsx`
- **Íconos lucide:** Loader2
- **Otros textos:** Cargando

### `RehniMarket-frontend/src/shared/config/dashboardNavigation.tsx`
- **Íconos lucide:** BarChart3 · Building2 · Coins · Heart · House · MapPin · Megaphone · Package · Receipt · RotateCcw · Settings · Store · Truck · User · Users · Wallet
- **Otros textos:** Anuncios · Catálogo · Configuración de cuenta · Devoluciones · Direcciones · Empresas · Favoritos · Finanzas · Liquidaciones · Mi tienda · Mis pedidos · Pedidos · Productos · RehniCoin · RehniCoins · Reportes · Transportadoras · Usuarios

### `RehniMarket-frontend/src/api/apiErrorHandler.ts`
- **Alertas:** error: Ocurrió un error al procesar la solicitud. · error: Ocurrió un error inesperado.
- **Otros textos:** Ocurrió un error al procesar la solicitud. · Ocurrió un error inesperado. · Tu cuenta se encuentra bloqueada. · Tu empresa se encuentra suspendida.

### `RehniMarket-frontend/src/api/session.ts`
- **Otros textos:** Tu sesión ha expirado. Inicia sesión nuevamente.

### `RehniMarket-frontend/src/api/setupAuthInterceptor.ts`
- **Otros textos:** Authorization · Falló la renovación: · Tu cuenta se encuentra bloqueada.

### `RehniMarket-frontend/src/features/company/components/dashboard/product/discountForm.ts`
- **Otros textos:** El porcentaje de descuento no puede superar 100. · La fecha de fin debe ser posterior a la de inicio. · Para activar el descuento, ingresa un valor mayor a 0.

### `RehniMarket-frontend/src/features/orders/utils/orderStatus.ts`
- **Otros textos:** Cancelado · En preparación · Entregado · Enviado · Iniciar procesamiento · Marcar entregado · Marcar enviado · Pendiente

### `RehniMarket-frontend/src/features/payouts/utils/payoutStatus.ts`
- **Otros textos:** Ahorros · Corriente · Daviplata · Fallida · Pendiente · Procesando

### `RehniMarket-frontend/src/features/payouts/utils/period.ts`
- **Otros textos:** Diciembre · Febrero · Noviembre · Octubre · Septiembre

### `RehniMarket-frontend/src/features/public/auth/api/authService.ts`
- **Otros textos:** Content-Type

### `RehniMarket-frontend/src/features/public/auth/api/certificateService.ts`
- **Otros textos:** Content-Type

### `RehniMarket-frontend/src/features/public/categories/utils/categorySort.ts`
- **Otros textos:** Más populares · Más productos · Nombre A-Z · Nombre Z-A

### `RehniMarket-frontend/src/features/reports/api/reportService.ts`
- **Otros textos:** Content-Type

### `RehniMarket-frontend/src/features/returns/utils/returnStatus.ts`
- **Otros textos:** Aprobada · En revisión · Rechazada

### `RehniMarket-frontend/src/features/wallet/utils/rechargeWhatsapp.ts`
- **Otros textos:** Correo de mi cuenta: · Quedo atento para completar el proceso de pago. · Quiero solicitar una recarga de RehniCoins.

### `RehniMarket-frontend/src/features/wallet/utils/transactionType.ts`
- **Otros textos:** Recarga · Reembolso

### `RehniMarket-frontend/src/shared/components/alert/alertManager.ts`
- **Otros textos:** No hay un AlertProvider montado.

### `RehniMarket-frontend/src/shared/validation/rules.ts`
- **Otros textos:** El NIT debe tener al menos 5 caracteres. · El NIT solo puede contener números. · El dígito de verificación debe tener exactamente un dígito. · El dígito de verificación no coincide con el NIT ingresado. · El dígito de verificación solo puede contener números. · El motivo no debe exceder los 500 caracteres. · El nombre completo debe tener al menos 3 caracteres. · El nombre completo no debe exceder los 60 caracteres. · El nombre de la empresa debe tener al menos 3 caracteres. · El nombre de la empresa no debe exceder los 50 caracteres. · El número de guía debe tener al menos 3 caracteres. · El número de guía no debe exceder los 80 caracteres. · El número de teléfono debe tener exactamente 10 dígitos. · El número de teléfono solo puede contener números. · Ingresa un correo electrónico válido. · La contraseña debe contener al menos un número. · La contraseña debe contener al menos una letra mayúscula. · La contraseña debe contener al menos una letra minúscula. · La contraseña debe tener al menos 8 caracteres. · La dirección debe tener al menos 5 caracteres.

### `RehniMarket-frontend/src/shared/validation/schemas.ts`
- **Otros textos:** Las contraseñas no coinciden. · Selecciona una transportadora.

## Móvil

### `RehniMarket-mobile/src/app/(user)/(tabs)/_layout.tsx`
- **Íconos Ionicons:** cart · categories · favorites · index · profile
- **Otros textos:** Carrito · Categorías · Favoritos

### `RehniMarket-mobile/src/app/(user)/(tabs)/cart.tsx`
- **Atributos:** message=Para ver tu carrito, inicia sesión. · title=Tu carrito

### `RehniMarket-mobile/src/app/(user)/(tabs)/favorites.tsx`
- **Atributos:** message=Inicia sesión para guardar y ver tus productos favoritos. · title=Tus favoritos

### `RehniMarket-mobile/src/app/(user)/(tabs)/profile.tsx`
- **Atributos:** message=Inicia sesión para acceder a tu cuenta. · title=Tu cuenta

### `RehniMarket-mobile/src/app/(user)/account.tsx`
- **Atributos:** message=Inicia sesión para gestionar tu información. · title=Tu cuenta

### `RehniMarket-mobile/src/app/(user)/addresses.tsx`
- **Atributos:** message=Inicia sesión para gestionar tus direcciones de envío. · title=Tus direcciones

### `RehniMarket-mobile/src/app/(user)/checkout.tsx`
- **Atributos:** message=Inicia sesión para completar tu compra. · title=Finalizar compra

### `RehniMarket-mobile/src/app/(user)/orders/[id].tsx`
- **Atributos:** message=Inicia sesión para ver el detalle de tus pedidos. · title=Tus pedidos

### `RehniMarket-mobile/src/app/(user)/orders/index.tsx`
- **Atributos:** message=Inicia sesión para ver el historial de tus pedidos. · title=Tus pedidos

### `RehniMarket-mobile/src/app/(user)/wallet.tsx`
- **Atributos:** message=Inicia sesión para ver tu saldo y tus movimientos. · title=RehniCoins

### `RehniMarket-mobile/src/components/ErrorState.tsx`
- **Íconos Ionicons:** alert-circle-outline
- **Textos:** Reintentar
- **Otros textos:** No se pudo cargar el contenido.

### `RehniMarket-mobile/src/components/RequireLoginScreen.tsx`
- **Atributos:** label=Iniciar sesión

### `RehniMarket-mobile/src/components/product/ProductGrid.tsx`
- **Atributos:** message=No se pudieron cargar los productos.
- **Otros textos:** No hay productos para mostrar.

### `RehniMarket-mobile/src/components/product/QuantityStepper.tsx`
- **Atributos:** accessibilityLabel=Aumentar cantidad · accessibilityLabel=Disminuir cantidad

### `RehniMarket-mobile/src/components/ui/CheckoutSteps.tsx`
- **Íconos Ionicons:** checkmark
- **Otros textos:** Confirmación · Dirección · Resumen

### `RehniMarket-mobile/src/components/ui/MenuRow.tsx`
- **Íconos Ionicons:** chevron-forward

### `RehniMarket-mobile/src/components/ui/ScreenHeader.tsx`
- **Íconos Ionicons:** chevron-back
- **Atributos:** accessibilityLabel=Volver

### `RehniMarket-mobile/src/components/ui/Sheet.tsx`
- **Íconos Ionicons:** close
- **Atributos:** accessibilityLabel=Cerrar

### `RehniMarket-mobile/src/features/addresses/components/AddressForm.tsx`
- **Textos:** Marcar como dirección principal
- **Atributos:** label=Cancelar · label=Ciudad · label=Departamento · label=Dirección · label=Indicaciones adicionales (opcional) · label=Nombre completo · label=Nombre de referencia · label=Teléfono · placeholder=Casa, Oficina, Apartamento... · placeholder=Ej. Apartamento 302, portería azul...
- **Otros textos:** Colombia · Completa nombre de referencia, nombre completo, departamento, ciudad, dirección y teléfono. · Guardando... · Guardar cambios · Guardar dirección · No se pudo guardar la dirección.

### `RehniMarket-mobile/src/features/addresses/components/AddressSheet.tsx`
- **Íconos Ionicons:** add
- **Textos:** Agregar otra dirección
- **Otros textos:** Dirección · Dirección de entrega · Nueva dirección

### `RehniMarket-mobile/src/features/auth/components/CodeInput.tsx`
- **Otros textos:** Backspace

### `RehniMarket-mobile/src/features/cart/context/CartProvider.tsx`
- **Textos:** Promise

### `RehniMarket-mobile/src/features/favorites/components/FavoriteCard.tsx`
- **Íconos Ionicons:** heart · image-outline
- **Textos:** Este producto ya no está disponible.

### `RehniMarket-mobile/src/features/orders/components/OrderTimeline.tsx`
- **Íconos Ionicons:** checkmark · close
- **Textos:** Este pedido fue cancelado.
- **Otros textos:** En proceso · Entregado · Enviado · Pendiente

### `RehniMarket-mobile/src/features/wallet/components/RechargeSheet.tsx`
- **Textos:** 1 RehniCoin equivale a 1 COP. Te atenderemos por WhatsApp para confirmar el pago.
- **Atributos:** label=Otra cantidad · label=Solicitar por WhatsApp · placeholder=Ej. 30000 · title=Recargar RehniCoins
- **Alertas:** Alert: Contacto no disponible — No se pudo abrir WhatsApp: falta configurar el número de contacto de RehniMarket. · Alert: No se pudo abrir WhatsApp — Verifica que la app esté instalada.
- **Otros textos:** Contacto no disponible · Ingresa la cantidad de RehniCoins que quieres solicitar. · Ingresa solo números, sin letras ni símbolos. · La cantidad debe ser mayor a cero. · No se pudo abrir WhatsApp · No se pudo abrir WhatsApp: falta configurar el número de contacto de RehniMarket. · Verifica que la app esté instalada.

### `RehniMarket-mobile/src/screens/account/AccountScreen.tsx`
- **Textos:** Cambia tu contraseña verificando tu correo electrónico. · Configuración de cuenta · Información personal · Seguridad
- **Atributos:** label=Cancelar · label=Cerrar sesión · label=Correo electrónico · label=Editar · label=Nombre · label=Teléfono
- **Alertas:** Alert: Cambiar contraseña — Te enviaremos un código de verificación a ${accountEmail}. Cerraremos tu sesión para que crees la nueva contraseña; luego inicia sesión de nuevo. · Alert: No se pudo enviar el código
- **Otros textos:** Cambiar contraseña · Continuar · El nombre debe tener al menos 3 caracteres. · El teléfono debe tener exactamente 10 dígitos. · Enviando código... · Guardando... · Guardar · Ingresa un correo electrónico válido. · Intenta más tarde. · No se pudo actualizar tu información. · No se pudo enviar el código

### `RehniMarket-mobile/src/screens/addresses/AddressesScreen.tsx`
- **Íconos Ionicons:** location-outline
- **Textos:** Direcciones · Editar · Eliminar · Hacer predeterminada
- **Atributos:** label=Agregar dirección · label=Predeterminada · message=Aún no has registrado direcciones. Agrega una para agilizar tus próximas compras. · message=No pudimos cargar tus direcciones.
- **Alertas:** Alert: Eliminar dirección — ¿Eliminar "${address.label ?? "esta dirección"}"? · Alert: No se pudo actualizar · Alert: No se pudo eliminar
- **Otros textos:** Cancelar · Dirección · Editar dirección · Eliminar dirección · Intenta de nuevo. · No se pudo actualizar · No se pudo eliminar · Nueva dirección

### `RehniMarket-mobile/src/screens/auth/ForgotPasswordScreen.tsx`
- **Íconos Ionicons:** mail-outline
- **Textos:** Ingresa el correo asociado a tu cuenta y te enviaremos un código para restablecer tu contraseña. · Recuperar contraseña · Volver al inicio de sesión
- **Atributos:** label=Correo electrónico · placeholder=ejemplo@correo.com
- **Otros textos:** Enviando... · Enviar código · No fue posible enviar el código de recuperación.

### `RehniMarket-mobile/src/screens/auth/LoginScreen.tsx`
- **Textos:** Ingresa tus datos para continuar · Iniciar sesión · Regístrate · ¿No tienes cuenta? · ¿Olvidaste tu contraseña?
- **Atributos:** label=Contraseña · label=Correo electrónico · label=Ingresar · placeholder=ejemplo@correo.com · placeholder=••••••••
- **Otros textos:** No se pudo iniciar sesión.

### `RehniMarket-mobile/src/screens/auth/RegisterScreen.tsx`
- **Textos:** Acepto los Términos y Condiciones y la Política de Privacidad · Completa tus datos para registrarte · Crear cuenta · Inicia sesión · ¿Ya tienes cuenta?
- **Atributos:** label=Confirmar contraseña · label=Contraseña · label=Correo electrónico · label=Nombre completo · label=Registrarme · label=Teléfono · placeholder=Mínimo 8 caracteres · placeholder=Repite tu contraseña · placeholder=Tu nombre · placeholder=Tu número de teléfono · placeholder=ejemplo@correo.com
- **Otros textos:** Las contraseñas no coinciden. · No se pudo crear la cuenta.

### `RehniMarket-mobile/src/screens/auth/ResetPasswordScreen.tsx`
- **Íconos Ionicons:** shield-checkmark-outline
- **Textos:** Ingresa el código recibido y crea una nueva contraseña. · Restablecer contraseña · Volver al inicio de sesión
- **Atributos:** label=Confirmar contraseña · label=Nueva contraseña · placeholder=••••••••
- **Otros textos:** Actualizando... · Guardar nueva contraseña · Ingresa el código completo. · Las contraseñas no coinciden. · Ocurrió un error inesperado.

### `RehniMarket-mobile/src/screens/auth/VerifyEmailScreen.tsx`
- **Íconos Ionicons:** mail-outline
- **Textos:** Código expirado. · Hemos enviado un código de verificación a · Ir al inicio de sesión · Solicita un nuevo código para continuar. · Verificar correo · ¿El correo es incorrecto? Cambiar correo · ¿No recibiste el código? · ¿Ya verificaste tu cuenta?
- **Atributos:** label=Cancelar · placeholder=Nuevo correo electrónico
- **Otros textos:** Actualizando... · Correo actualizado. Se envió un nuevo código de verificación. · El código expiró. Solicita uno nuevo para continuar. · Enviando... · Guardar · Ingresa el código completo. · Ingresa un correo electrónico. · No fue posible cambiar el correo. · No fue posible reenviar el código. · Ocurrió un error. · Reenviar código · Se ha enviado un nuevo código a tu correo. · Usuario no encontrado. · Verificando...

### `RehniMarket-mobile/src/screens/cart/CartScreen.tsx`
- **Íconos Ionicons:** trash-outline
- **Textos:** Carrito
- **Atributos:** accessibilityLabel=Vaciar carrito · label=Explorar productos · message=Tu carrito está vacío. Agrega productos y vuelve aquí para finalizar tu compra.
- **Alertas:** Alert: No se pudo actualizar · Alert: No se pudo eliminar · Alert: No se pudo vaciar · Alert: Vaciar carrito — ¿Eliminar todos los productos del carrito?
- **Otros textos:** Cancelar · Intenta de nuevo. · No se pudo actualizar · No se pudo eliminar · No se pudo vaciar · ¿Eliminar todos los productos del carrito?

### `RehniMarket-mobile/src/screens/cart/components/CartItemRow.tsx`
- **Íconos Ionicons:** close · image-outline
- **Textos:** Este producto ya no tiene stock disponible.

### `RehniMarket-mobile/src/screens/cart/components/CartSummary.tsx`
- **Textos:** El total definitivo se confirma en el checkout. · IVA · Resumen · Total
- **Atributos:** label=Ir a pagar
- **Otros textos:** No aplica

### `RehniMarket-mobile/src/screens/catalog/CatalogScreen.tsx`
- **Íconos Ionicons:** options-outline
- **Atributos:** accessibilityLabel=Filtros
- **Otros textos:** No hay productos que coincidan con tu búsqueda. · Productos

### `RehniMarket-mobile/src/screens/catalog/CollectionScreen.tsx`
- **Íconos Ionicons:** chevron-back
- **Atributos:** accessibilityLabel=Volver
- **Otros textos:** Lo último publicado en RehniMarket. · No hay novedades disponibles en este momento. · No hay ofertas disponibles en este momento. · Novedades · Ofertas especiales · Productos con descuento vigente.

### `RehniMarket-mobile/src/screens/catalog/components/FiltersSheet.tsx`
- **Textos:** Categoría · Rango de precio · Solo con descuento · Solo disponibles · Todas
- **Atributos:** label=Aplicar · label=Limpiar filtros · placeholder=Máximo · placeholder=Mínimo · title=Filtros

### `RehniMarket-mobile/src/screens/catalog/components/SortChips.tsx`
- **Otros textos:** Mayor descuento · Mayor precio · Menor precio · Relevancia

### `RehniMarket-mobile/src/screens/categories/CategoriesScreen.tsx`
- **Textos:** Categorías
- **Atributos:** message=No se pudieron cargar las categorías. · message=Todavía no hay categorías.

### `RehniMarket-mobile/src/screens/checkout/CheckoutScreen.tsx`
- **Íconos Ionicons:** checkmark · location-outline
- **Textos:** Cambiar · Checkout · Confirma tu dirección y paga con RehniCoin. · Dirección de envío · IVA · Recibirás un correo con los detalles de tu compra. · Resumen · Saldo RehniCoin · Subtotal · Total · Total pagado · Tu saldo RehniCoin no alcanza para esta compra. · ¡Compra confirmada!
- **Atributos:** label=Explorar productos · label=Seguir comprando · label=Ver mis pedidos · message=Tu carrito está vacío. Agrega productos para continuar con tu compra.
- **Alertas:** Alert: No se pudo completar la compra · Alert: Producto no disponible
- **Otros textos:** Confirmando... · Confirmar compra · Dirección · Elegir dirección para continuar · Intenta de nuevo. · No aplica · No se pudo completar la compra · Producto no disponible · Tu pedido ha sido realizado con éxito. · Un producto de tu carrito ya no está disponible.

### `RehniMarket-mobile/src/screens/favorites/FavoritesScreen.tsx`
- **Textos:** Favoritos
- **Atributos:** label=Explorar productos · message=Aún no tienes favoritos. Guarda los productos que te interesan y vuelve a ellos cuando quieras.
- **Alertas:** Alert: No se pudo actualizar
- **Otros textos:** Intenta de nuevo. · No se pudo actualizar

### `RehniMarket-mobile/src/screens/home/HomeScreen.tsx`
- **Atributos:** title=Novedades · title=Ofertas especiales · title=Productos destacados

### `RehniMarket-mobile/src/screens/home/components/BannerCarousel.tsx`
- **Íconos Ionicons:** chevron-back · chevron-forward
- **Atributos:** message=No se pudieron cargar los banners.

### `RehniMarket-mobile/src/screens/home/components/CategorySection.tsx`
- **Atributos:** message=No se pudieron cargar las categorías. · title=Explorar categorías
- **Otros textos:** Ver todas

### `RehniMarket-mobile/src/screens/home/components/HomeHeader.tsx`
- **Íconos Ionicons:** cart-outline
- **Textos:** RehniMarket

### `RehniMarket-mobile/src/screens/home/components/HomeProductSection.tsx`
- **Textos:** Promise
- **Otros textos:** Ver todos

### `RehniMarket-mobile/src/screens/home/components/ProductCard.tsx`
- **Íconos Ionicons:** image-outline
- **Alertas:** Alert: No se pudo actualizar
- **Otros textos:** Agregar a favoritos · Intenta de nuevo. · No se pudo actualizar · Quitar de favoritos

### `RehniMarket-mobile/src/screens/home/components/SearchBar.tsx`
- **Íconos Ionicons:** search-outline
- **Textos:** Buscar productos...

### `RehniMarket-mobile/src/screens/orders/OrderDetailScreen.tsx`
- **Íconos Ionicons:** chevron-back
- **Textos:** Datos de entrega · Descuentos · Envío · IVA · Subtotal · Total
- **Atributos:** accessibilityLabel=Volver · message=No encontramos este pedido. · message=No se pudo cargar el pedido.
- **Alertas:** Alert: Cancelar pedido — ¿Cancelar este pedido? Esta acción no se puede deshacer. · Alert: No se pudo cancelar
- **Otros textos:** Cancelando... · Cancelar pedido · Intenta de nuevo. · No aplica · No se pudo cancelar · ¿Cancelar este pedido? Esta acción no se puede deshacer.

### `RehniMarket-mobile/src/screens/orders/OrdersScreen.tsx`
- **Textos:** Mis pedidos
- **Atributos:** label=Explorar productos · message=No pudimos cargar tus pedidos. · message=No tienes pedidos en este estado. · message=Todavía no tienes pedidos. Cuando compres, podrás seguir su estado desde aquí.
- **Otros textos:** Cancelados · Entregados · Enviados · Pendientes

### `RehniMarket-mobile/src/screens/product-detail/ProductDetailScreen.tsx`
- **Íconos Ionicons:** chevron-back · share-outline
- **Textos:** Descripción · Esa combinación no está disponible. · Volver
- **Atributos:** accessibilityLabel=Compartir · accessibilityLabel=Volver · message=No encontramos este producto. · message=No se pudo cargar el producto.
- **Alertas:** Alert: No se pudo actualizar · Alert: No se pudo agregar
- **Otros textos:** Agregado · Agregar a favoritos · Agregar al carrito · Intenta de nuevo. · No se pudo actualizar · No se pudo agregar · No se pudo agregar el producto al carrito. · Quitar de favoritos

### `RehniMarket-mobile/src/screens/product-detail/components/ProductGallery.tsx`
- **Íconos Ionicons:** image-outline
- **Textos:** Sin imagen

### `RehniMarket-mobile/src/screens/product-detail/components/ProductTaxLine.tsx`
- **Textos:** IVA: · No aplica · Total con IVA:

### `RehniMarket-mobile/src/screens/product-detail/components/SellerCard.tsx`
- **Íconos Ionicons:** checkmark-circle · shield-checkmark-outline · storefront-outline
- **Textos:** Empresa verificada · Vendido por

### `RehniMarket-mobile/src/screens/product-detail/components/StockStatus.tsx`
- **Otros textos:** Agotado · Elige las opciones para ver el stock · En stock

### `RehniMarket-mobile/src/screens/profile/ProfileScreen.tsx`
- **Íconos Ionicons:** chevron-forward · settings-outline
- **Textos:** Mi perfil
- **Atributos:** accessibilityLabel=Configuración de cuenta · label=Cerrar sesión · label=Configuración de cuenta · label=Favoritos · label=Mis direcciones · label=Mis pedidos · label=RehniCoin
- **Alertas:** Alert: Cerrar sesión — ¿Seguro que quieres cerrar sesión?
- **Otros textos:** Cancelar · ¿Seguro que quieres cerrar sesión?

### `RehniMarket-mobile/src/screens/search/SearchScreen.tsx`
- **Íconos Ionicons:** chevron-back · close-circle · search-outline
- **Atributos:** accessibilityLabel=Limpiar · accessibilityLabel=Volver · message=Escribe al menos 2 caracteres para buscar. · placeholder=Buscar productos...

### `RehniMarket-mobile/src/screens/wallet/WalletScreen.tsx`
- **Íconos Ionicons:** wallet-outline
- **Textos:** 1 RehniCoin equivale a 1 COP. · Movimientos · RehniCoins · Saldo disponible
- **Atributos:** label=Recargar RehniCoins · message=Todavía no tienes movimientos de RehniCoin.

### `RehniMarket-mobile/src/api/client.ts`
- **Otros textos:** Authorization · Tu cuenta se encuentra bloqueada. · Tu sesión ha expirado. Inicia sesión nuevamente.

### `RehniMarket-mobile/src/features/auth/constants.ts`
- **Otros textos:** Esta aplicación está disponible solo para cuentas de comprador.

### `RehniMarket-mobile/src/features/orders/orderStatus.ts`
- **Otros textos:** Cancelado · En preparación · Entregado · Enviado · Pendiente

### `RehniMarket-mobile/src/features/wallet/transactionType.ts`
- **Otros textos:** Movimiento · Recarga · Reembolso

### `RehniMarket-mobile/src/features/wallet/utils/rechargeWhatsapp.ts`
- **Otros textos:** Correo de mi cuenta: · Quedo atento para completar el proceso de pago. · Quiero solicitar una recarga de RehniCoins.

### `RehniMarket-mobile/src/hooks/useProductList.ts`
- **Textos:** Promise

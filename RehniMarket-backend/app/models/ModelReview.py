from sqlalchemy import ForeignKey, DateTime, Integer, Text, Boolean, CheckConstraint, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime, timezone
from app.database.Connection import Base


class Review(Base):
    """
    Reseña de un producto, escrita por un comprador (rol USER) que ya lo
    recibió (compra verificada - ver
    ReviewRepository.has_delivered_purchase: exige un OrderItem de este
    producto en un pedido PROPIO con status DELIVERED, no cualquier
    compra ni el carrito).

    La EMPRESA no tiene reseñas propias (ver ALCANCE > Calificaciones de
    empresa, regla 1): no existe ninguna tabla/columna de reseñas en
    Company. Su reputación se calcula agregando en caliente las reseñas
    activas de TODOS sus productos (ver
    publicService/Company.py > get_company_rating_service +
    ReviewRepository.get_company_rating) - un producto puede cambiar de
    catálogo/precio/etc. sin afectar esto, porque no se duplica nada.

    Un usuario solo puede reseñar un producto una vez (ver
    UniqueConstraint uq_review_user_product) - para cambiar de opinión
    edita su propia reseña (PATCH /reviews/{id}) en vez de crear una
    segunda.

    is_active es un soft-delete (ver ReviewService.delete_my_review_service):
    "eliminar" una reseña marca is_active=False en vez de borrar la fila,
    para no perder el historial y porque el promedio de la empresa/el
    listado público SOLO deben contar reseñas activas (ver ALCANCE >
    regla 4).
    """

    __tablename__ = "reviews"

    __table_args__ = (
        UniqueConstraint("user_id", "product_id", name="uq_review_user_product"),
        CheckConstraint("rating >= 1 AND rating <= 5", name="ck_review_rating_range"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )

    product_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("products.id"), nullable=False
    )

    rating: Mapped[int] = mapped_column(Integer, nullable=False)
    comment: Mapped[str | None] = mapped_column(Text, nullable=True)

    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    updated_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    user = relationship("Users", back_populates="reviews")
    product = relationship("Product", back_populates="reviews")

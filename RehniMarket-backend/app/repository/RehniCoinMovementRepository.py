from sqlalchemy.orm import Session

from app.models.ModelRehniCoinMovement import RehniCoinMovement


def create_movement(database: Session, movement: RehniCoinMovement) -> RehniCoinMovement:
    database.add(movement)
    database.flush()
    return movement

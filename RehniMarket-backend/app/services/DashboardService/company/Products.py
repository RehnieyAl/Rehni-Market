from sqlalchemy.orm import Session
from app.models.ModelUser import Users
from app.models.ModelProduct import Product, ProductImage, Product
from app.models.ModelCatalog import Catalog
from app.models.ModelSpecification import ProductSpecification
from fastapi import HTTPException
import json

from sqlalchemy.orm import Session
from fastapi import HTTPException

def create_product_service(user_id,nameProduct,catalogId,priceProduct,stockProduct,descripcionProduct,technicalSpecProduct,imagesProduct,nas,database: Session):
    try:
        user = (database.query(Users).filter(Users.id == user_id).first())

        if not user:
            raise HTTPException(status_code=404,detail="Usuario no encontrado")

        company = user.company

        if not company:
            raise HTTPException(status_code=404,detail="Empresa no encontrada")

        catalog = (database.query(Catalog).filter(Catalog.id == catalogId).first())

        if not catalog:
            raise HTTPException(status_code=404,detail="Catalogo no encontrado")

        new_product = Product(
            name=nameProduct,
            price=priceProduct,
            stock=stockProduct,
            descripcion=descripcionProduct,
            company_id=company.id,
            catalog_id=catalog.id
        )

        database.add(new_product)
        database.flush()

        if imagesProduct:

            for index, file in enumerate(imagesProduct):
                result = nas.upload_file(file,f"companies/{company.CompanyNIT}/products/")
                image = ProductImage(url=result["path"],is_main=(index == 0),product_id=new_product.id)
                database.add(image)

        if technicalSpecProduct:
            if isinstance(technicalSpecProduct, str):
                technicalSpecProduct = json.loads(technicalSpecProduct)

            for specification in technicalSpecProduct:
                product_spec = ProductSpecification(
                value=specification["value"],
                specification_template_id=specification["specificationTemplateId"],
                product_id=new_product.id)
                database.add(product_spec)

        database.commit()
        database.refresh(new_product)
        
        return {
            "message":"Producto creado correctamente",
            "product_id":str(new_product.id),
            "name":new_product.name,
            "catalog":catalog.name
        }

    except HTTPException:
        database.rollback()
        raise

    except Exception as e:
        database.rollback()
        raise HTTPException(status_code=500,detail=str(e))
    
def update_product_service():
    pass


def change_product_status_service(user_id,product_id,is_active,database: Session):

    try:
        search_user = database.query(Users).filter(Users.id == user_id).first()

        if not search_user or not search_user.company :
            raise HTTPException(status_code=404, detail="Empresa no encontrada")
        
        product = database.query(Product).filter(Product.id == product_id, Product.company_id == search_user.company.id).first()
        
        if not product:
            raise HTTPException(status_code=404, detail="Producto no encontrado")
        
        product.is_active = is_active

        database.commit()
        database.refresh(product)

        return {
            "message": "Estado del producto actualizado correctamente",
            "product_id": str(product.id),
            "is_active": product.is_active,
        }

    except HTTPException:
        database.rollback()
        raise
    
    except Exception as e:
        database.rollback()
        print("ERROR:", e)
        raise HTTPException(status_code=500,detail=str(e))


def delete_product_service(user_id,product_id,database: Session):
    try:
        search_user = (database.query(Users).filter(Users.id == user_id).first())

        if not search_user or not search_user.company:
            raise HTTPException(status_code=404,detail="Empresa no encontrada")
        
        product = (database.query(Product).filter(Product.id == product_id,Product.company_id == search_user.company.id).first())

        if not product:
            raise HTTPException(status_code=404,detail="Producto no encontrado")

        database.delete(product)
        database.commit()

        return {
            "message": "Producto eliminado correctamente",
            "product_id": str(product_id)
        }

    except HTTPException:
        database.rollback()
        raise

    except Exception as e:
        database.rollback()
        print("ERROR:", e)
        raise HTTPException(status_code=500,detail="Error del servidor")





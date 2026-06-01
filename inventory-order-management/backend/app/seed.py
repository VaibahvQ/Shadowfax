from decimal import Decimal

from sqlalchemy.orm import Session

from .models import Customer, Product


def seed_database(db: Session) -> None:
    if db.query(Product).first() or db.query(Customer).first():
        return

    products = [
        Product(name="Wireless Keyboard", sku="KEY-100", description="Compact Bluetooth keyboard", price=Decimal("49.99"), stock_quantity=25),
        Product(name="USB-C Dock", sku="DOC-240", description="Seven-port docking station", price=Decimal("89.50"), stock_quantity=12),
        Product(name="Noise Cancelling Headset", sku="AUD-310", description="Over-ear work headset", price=Decimal("129.00"), stock_quantity=8),
    ]
    customers = [
        Customer(name="Aarav Sharma", email="aarav@example.com", phone="+91 98765 43210"),
        Customer(name="Maya Singh", email="maya@example.com", phone="+91 91234 56789"),
    ]

    db.add_all(products + customers)
    db.commit()

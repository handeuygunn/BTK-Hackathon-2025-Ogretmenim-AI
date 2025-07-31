from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine

engine = create_engine("postgresql+psycopg2://postgres:0000@localhost:5432/TeacherAIDatabase")
Session = sessionmaker(bind=engine)
session = Session()

# Modelleri import et
from creatDatabase import Teacher, Class, Student

# 2 öğretmen ekle

teacher1 = Teacher(name="Ahmet", surname="Yılmaz", user_name="ahmetyilmaz", email="ahmet@example.com", password="1234", gender="M")
teacher2 = Teacher(name="Ayşe", surname="Kara", user_name="aysekara", email="ayse@example.com", password="5678", gender="F")
session.add_all([teacher1, teacher2])
session.commit()

# 2 sınıf ekle, her biri bir öğretmene bağlı

class1 = Class(name="1A", teacher_id=teacher1.teacher_id, teacher_name=teacher1.name, teacher_surname=teacher1.surname, teacher_email=teacher1.email)
class2 = Class(name="2B", teacher_id=teacher2.teacher_id, teacher_name=teacher2.name, teacher_surname=teacher2.surname, teacher_email=teacher2.email)
session.add_all([class1, class2])
session.commit()



# Karışık cinsiyetli isimler ve farklı soyisimler listeleri
isimler = [
    "Ali", "Zeynep", "Veli", "Elif", "Mehmet", "Ayşe", "Can", "Fatma", "Emir", "Derya",
    "Kerem", "Sude", "Deniz", "Buse", "Baran", "İlayda", "Burak", "Yasemin", "Efe", "Melis"
]
soyisimler = [
    "Demir", "Çelik", "Yılmaz", "Kara", "Şahin", "Aydın", "Koç", "Aslan", "Polat", "Güneş",
    "Kurt", "Arslan", "Öztürk", "Doğan", "Aksoy", "Erdoğan", "Kılıç", "Yıldız", "Taş", "Bulut"
]

students = []
for i in range(10):
    students.append(Student(
        name=isimler[i],
        surname=soyisimler[i],
        email=f"{isimler[i].lower()}_{soyisimler[i].lower()}@example.com",
        sinif=class1.name,
        password="pass1",
        class_id=class1.class_id
    ))
for i in range(10, 20):
    students.append(Student(
        name=isimler[i],
        surname=soyisimler[i],
        email=f"{isimler[i].lower()}_{soyisimler[i].lower()}@example.com",
        sinif=class2.name,
        password="pass2",
        class_id=class2.class_id
    ))
session.add_all(students)
session.commit()


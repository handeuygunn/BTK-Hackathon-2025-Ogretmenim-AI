from sqlalchemy import create_engine
from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base


DATABASE_URL = "postgresql+psycopg2://postgres:0000@localhost:5432/TeacherAIDatabase"

engine = create_engine(DATABASE_URL)

Base = declarative_base()

class Teacher(Base):
    __tablename__ = 'teachers'

    teacher_id = Column(Integer, primary_key=True)
    name = Column(String)
    surname = Column(String)
    user_name = Column(String, unique=True)
    email = Column(String)
    password = Column(String)
    gender = Column(String)
    # class_id ve class_name kaldırıldı, ilişki Class üzerinden kurulacak

    classes = relationship("Class", back_populates="teacher")


class Class(Base):
    __tablename__ = 'classes'

    class_id = Column(Integer, primary_key=True)
    name = Column(String)
    teacher_id = Column(Integer, ForeignKey('teachers.teacher_id'))
    teacher_name = Column(String)  # Teacher's name for convenience
    teacher_surname = Column(String)  # Teacher's surname for convenience
    teacher_email = Column(String)  # Teacher's email for convenience

    teacher = relationship("Teacher", back_populates="classes")
    students = relationship("Student", back_populates="class1")


class Student(Base):
    __tablename__ = 'students'

    id = Column(Integer, primary_key=True)
    name = Column(String)
    surname = Column(String)
    email = Column(String)
    sinif = Column(String)
    password = Column(String)
    class_id = Column(Integer, ForeignKey('classes.class_id'))

    class1 = relationship("Class", back_populates="students")
    analysis = relationship("StudentAnalysis", back_populates="student")

class StudentAnalysis(Base):
    __tablename__ = 'student_analysis'

    analiz_id = Column(Integer, primary_key=True)
    student_id = Column(Integer, ForeignKey('students.id'))
    analiz_data = Column(String)  # JSON or other format for analysis data

    student = relationship("Student", back_populates="analysis")

Base.metadata.create_all(engine)

from sqlalchemy.orm import sessionmaker

Session = sessionmaker(bind=engine)
session = Session()

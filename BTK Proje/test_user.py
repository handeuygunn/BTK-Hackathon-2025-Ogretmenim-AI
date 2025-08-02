#!/usr/bin/env python3
"""Test kullanıcısı oluşturma scripti"""

from sqlalchemy import create_engine, text

DATABASE_URL = "postgresql+psycopg2://postgres:0000@localhost:5432/TeacherAIDatabase"

def create_test_user():
    engine = create_engine(DATABASE_URL)
    
    try:
        with engine.connect() as connection:
            # Test kullanıcısı verilerini hazırla (plain text şifreler)
            test_users = [
                {
                    "name": "Ayşe",
                    "surname": "Öğretmen", 
                    "user_name": "ayse",
                    "email": "ayse@okulumuz.com",
                    "password": "123456",  # Plain text
                    "gender": "Kadın"
                },
                {
                    "name": "Mehmet",
                    "surname": "Öğretmen",
                    "user_name": "mehmet", 
                    "email": "mehmet@okulumuz.com",
                    "password": "123456",  # Plain text
                    "gender": "Erkek"
                },
                {
                    "name": "Fatma",
                    "surname": "Yılmaz",
                    "user_name": "fatma",
                    "email": "fatma@okulumuz.com", 
                    "password": "123456",  # Plain text
                    "gender": "Kadın"
                }
            ]
            
            # Her test kullanıcısını ekle
            for user in test_users:
                # Önce kullanıcının zaten var olup olmadığını kontrol et
                result = connection.execute(
                    text("SELECT teacher_id FROM teachers WHERE user_name = :user_name"),
                    {"user_name": user["user_name"]}
                )
                
                if result.fetchone() is None:
                    # Kullanıcı yoksa ekle
                    connection.execute(
                        text("""
                            INSERT INTO teachers (name, surname, user_name, email, password, gender)
                            VALUES (:name, :surname, :user_name, :email, :password, :gender)
                        """),
                        user
                    )
                    print(f"✅ Test kullanıcısı oluşturuldu: {user['user_name']}")
                else:
                    print(f"ℹ️  Kullanıcı zaten var: {user['user_name']}")
            
            # Değişiklikleri kaydet
            connection.commit()
            
            print("\n🎉 Test kullanıcıları hazır!")
            print("Giriş bilgileri:")
            print("Kullanıcı adı: ayse, mehmet, fatma")
            print("Şifre: 123456")
            
    except Exception as e:
        print(f"❌ Hata oluştu: {e}")

if __name__ == "__main__":
    create_test_user()

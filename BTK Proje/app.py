from fastapi import FastAPI, Request, Form, UploadFile, File, HTTPException, status
from fastapi.responses import HTMLResponse, RedirectResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel
from google import genai
from google.genai import types
import uvicorn
import base64
from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError
import datetime
from typing import Optional
import secrets
from starlette.middleware.sessions import SessionMiddleware
import psycopg2
import re
from passlib.context import CryptContext
import tempfile 
import pathlib
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

### TODO: .env dosyası eklenecek

### Pydantic modelleri

class StudentAnalysisMessage(BaseModel):
    """ Öğrenci analizi mesajı """
    message: str
    student_id: int
    student_name: str
    student_observations: Optional[list] = []
    
class ChatMessage(BaseModel):
    """ Anaokulu öğretmeni ile AI arasındaki sohbet mesajı """
    message: str
    category: str

class DailyPlanSaveRequest(BaseModel):
    """ Günlük plan kaydetme isteği """
    plan_date: str
    content: str
    
    
## veritabanı bağlantısı
DATABASE_URL = f"postgresql+psycopg2://{os.getenv('DB_USER')}:{os.getenv('DB_PASSWORD')}@{os.getenv('DB_HOST')}:{os.getenv('DB_PORT')}/{os.getenv('DB_NAME')}"

engine = create_engine(DATABASE_URL)

try:
    with engine.connect() as connection:
        print("Veritabanı bağlantısı başarılı!")
except Exception as e:
    print("Bağlantı hatası:", e)

def get_db_connection():
    """PostgreSQL veritabanı bağlantısı oluştur"""
    try:
        connection = psycopg2.connect(
            host=os.getenv('DB_HOST'),
            database=os.getenv('DB_NAME'),
            user=os.getenv('DB_USER'),
            password=os.getenv('DB_PASSWORD'),
            port=int(os.getenv('DB_PORT', 5432)),
            connect_timeout=60 
        )
        connection.autocommit = False
        return connection
    except psycopg2.Error as e:
        print(f"DEBUG: Veritabanı bağlantı hatası: {e}")
        raise HTTPException(status_code=500, detail="Veritabanı bağlantısı kurulamadı")

app = FastAPI(
    title=os.getenv('APP_TITLE', 'Öğretmenim AI'), 
    description=os.getenv('APP_DESCRIPTION', 'Yapay Zeka Destekli Anaokulu Öğretmeni Asistanı')
)

app.add_middleware(SessionMiddleware, secret_key=os.getenv('SESSION_SECRET_KEY', secrets.token_hex(32)))
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

### Şifre hashing context'i
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

### Session helper fonksiyonları
def get_current_user(request: Request):
    """Session'dan mevcut kullanıcı bilgilerini al"""
    user_data = request.session.get("user")
    if not user_data:
        return None
    return user_data

def require_auth(request: Request):
    """Authentication gerektiren sayfalar için decorator"""
    user = get_current_user(request)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_302_FOUND,
            headers={"Location": "/login"}
        )
    return user
### 

def verify_password(plain_password: str, db_password: str) -> bool:
    """Şifre doğrulama - hem eski (plain) hem yeni (hashed) şifreler için"""
    if db_password.startswith('$2b$'):
        return pwd_context.verify(plain_password, db_password)
    return plain_password == db_password

def hash_password(password: str) -> str:
    """Şifreyi hash'le"""
    return pwd_context.hash(password)

@app.get("/", response_class=RedirectResponse)
async def root():
    return RedirectResponse(url="/login", status_code=302)

@app.get("/login", response_class=HTMLResponse)
async def login_page(request: Request):
    return templates.TemplateResponse("login.html", {"request": request})

@app.get("/register", response_class=HTMLResponse)
async def register_page(request: Request):
    return templates.TemplateResponse("register.html", {"request": request})

@app.post("/register")
async def register_submit(
    request: Request, 
    name: str = Form(...), 
    surname: str = Form(...),
    email: str = Form(...),
    username: str = Form(...), 
    password: str = Form(...),
    confirm_password: str = Form(...),
    terms: str = Form(None)
):
    connection = None
    cursor = None
    
    try:
        if not terms:
            return templates.TemplateResponse("register.html", {
                "request": request,
                "error": "Kullanım koşullarını kabul etmelisiniz!",
                "name": name,
                "surname": surname,
                "email": email,
                "username": username
            })
        
        if password != confirm_password:
            return templates.TemplateResponse("register.html", {
                "request": request,
                "error": "Şifreler eşleşmiyor!",
                "name": name,
                "surname": surname,
                "email": email,
                "username": username
            })
        
        if len(password) < 6:
            return templates.TemplateResponse("register.html", {
                "request": request,
                "error": "Şifre en az 6 karakter olmalıdır!",
                "name": name,
                "surname": surname,
                "email": email,
                "username": username
            })
        
        connection = get_db_connection()
        cursor = connection.cursor()
        
        cursor.execute("SELECT user_name FROM teachers WHERE user_name = %s", (username,))
        if cursor.fetchone():
            return templates.TemplateResponse("register.html", {
                "request": request,
                "error": "Bu kullanıcı adı zaten kullanılıyor!",
                "name": name,
                "surname": surname,
                "email": email
            })
        
        cursor.execute("SELECT email FROM teachers WHERE email = %s", (email,))
        if cursor.fetchone():
            return templates.TemplateResponse("register.html", {
                "request": request,
                "error": "Bu e-posta adresi zaten kullanılıyor!",
                "name": name,
                "surname": surname,
                "username": username
            })
        
        hashed_password = hash_password(password)
        
        insert_query = """
        INSERT INTO teachers (name, surname, email, user_name, password)
        VALUES (%s, %s, %s, %s, %s)
        """
        
        cursor.execute(insert_query, (name, surname, email, username, hashed_password))
        connection.commit()
        
        return templates.TemplateResponse("register.html", {
            "request": request,
            "success": "Hesabınız başarıyla oluşturuldu! Şimdi giriş yapabilirsiniz."
        })
        
    except Exception as e:
        print(f"DEBUG: Kayıt hatası: {str(e)}")
        return templates.TemplateResponse("register.html", {
            "request": request,
            "error": "Kayıt sırasında bir hata oluştu. Lütfen tekrar deneyin.",
            "name": name,
            "surname": surname,
            "email": email,
            "username": username
        })
    finally:
        if cursor:
            try:
                cursor.close()
            except:
                pass
        if connection:
            try:
                connection.close()
            except:
                pass

@app.post("/login")
async def login_submit(request: Request, username: str = Form(...), password: str = Form(...)):
    try:
        with engine.connect() as connection:
            # kullanıcı kontrolü
            result = connection.execute(
                text("SELECT teacher_id, name, surname, user_name, email, password FROM teachers WHERE user_name = :username"),
                {"username": username}
            )
            user = result.fetchone()
            
            if user and verify_password(password, user.password):
                request.session["user"] = {
                    "teacher_id": user.teacher_id,
                    "email": user.email,
                    "full_name": f"{user.name} {user.surname}"
                }
                return RedirectResponse(url="/dashboard", status_code=302) # başarılı ise dashboarda git
            else:
                return templates.TemplateResponse("login.html", {
                    "request": request,
                    "error": "Kullanıcı adı veya şifre hatalı!"   ## error handling
                })
                
    except SQLAlchemyError as e:
        return templates.TemplateResponse("login.html", {
            "request": request,
            "error": "Veritabanı bağlantı hatası!"
        })
    except Exception as e:
        return templates.TemplateResponse("login.html", {
            "request": request,
            "error": "Bir hata oluştu!"
        })

@app.get("/dashboard", response_class=HTMLResponse)
async def dashboard(request: Request):
    user = require_auth(request)
    return templates.TemplateResponse("dashboard.html", {
        "request": request,
        "user": user
    })

@app.get("/boyama-sayfasi", response_class=HTMLResponse)
async def boyama_sayfasi(request: Request):
    user = require_auth(request)
    return templates.TemplateResponse("boyama_sayfasi.html", {
        "request": request,
        "user": user
    })

@app.get("/ogrenci-analizleri", response_class=HTMLResponse)
async def ogrenci_analizleri(request: Request):
    user = require_auth(request)
    return templates.TemplateResponse("ogrenci_analizleri.html", {
        "request": request,
        "user": user
    })

@app.get("/gunluk-plan", response_class=HTMLResponse)
async def gunluk_plan(request: Request):
    user = require_auth(request)
    return templates.TemplateResponse("gunluk_plan.html", {
        "request": request,
        "user": user
    })

@app.get("/logout")
async def logout(request: Request):
    request.session.clear()
    return RedirectResponse(url="/login", status_code=302)

### gemini API client objesi
client = genai.Client(api_key=os.getenv('GEMINI_API_KEY'))

# Gemini tool function - Gözlem formatlama (Tool call için)
def format_student_observation(raw_observation: str, observation_category: str) -> str:
    """Öğrenci gözlemini profesyonel formata çevirir.

    Args:
        raw_observation: Ham gözlem metni
        observation_category: Gözlem kategorisi

    Returns:
        Formatlanmış gözlem metni
    """
    try:
        category_labels = {
            "genel": "Genel Gelişim",
            "sosyal": "Sosyal Beceriler", 
            "akademik": "Akademik Gelişim",
            "yaraticilik": "Yaratıcılık ve Sanat",
            "davranis": "Davranış Gelişimi"
        }
        
        formatted_category = category_labels.get(observation_category.lower(), "Genel Gelişim") ## varsayılan kategori

        ## gemini ile öğrenci hakkında yapılan gözlem profesyonel gözleme çevrilir.
        prompt = f"""
        Sen bir anaokulu öğretmenisin. Aşağıdaki ham öğrenci gözlemini profesyonel bir eğitim gözlemine çevir.

        Ham Gözlem: "{raw_observation}"
        Kategori: {formatted_category}

        Aşağıdaki kurallara göre formatla:
        1. Gözlem profesyonel ve resmi dilde olmalı
        2. Objektif ve ölçülebilir ifadeler kullan
        3. Negatif ifadeler yerine yapıcı ifadeler kullan

        Sadece formatlanmış gözlemi döndür, başka açıklama yapma.
        """
        
        # BİLGİ: Temperature parametresi cevabın randomness düzeyini belirlemede kullanılır.
        # Ancak burada deterministik bir çıktı beklediğimiz için bu parametre değiştirilmemiştir.
        response = client.models.generate_content(
            model="gemini-2.5-flash", # model değişebilir. TODO: belki model limitine göre ayarlanabilir otomatik olarak (i.e. gemini-2.5-pro bitince gemini 2.5-flash'e geç gibi.)
            contents=[prompt]
        )
        
        formatted_text = response.text.strip()
        
        today = datetime.datetime.now().strftime("%d.%m.%Y")
        final_observation = f"[{today}] {formatted_category}: {formatted_text}"
        
        return final_observation
        
    except Exception as e:
        print(f"DEBUG: Gemini formatlama hatası: {e}")
        raise Exception(f"Gemini formatlama hatası: {str(e)}")

## öğrenci analizi API endpoint'i   
@app.post("/api/analiz")
async def student_analysis(request: Request, analysis_message: StudentAnalysisMessage):
    try:
        user = require_auth(request)
        teacher_id = user["teacher_id"]
        
        now = datetime.datetime.now()
        current_datetime_str = now.strftime("%d.%m.%Y %H:%M")
        
        observations_text = ""
        if analysis_message.student_observations and len(analysis_message.student_observations) > 0:
            observations_text = "\n\n📝 Bu öğrenci hakkındaki mevcut gözlemlerim:\n"
            for i, obs in enumerate(analysis_message.student_observations, 1):
                obs_date = obs.get('date', 'Tarih belirtilmemiş')
                obs_category = obs.get('category', 'Genel')
                obs_content = obs.get('content', '')
                observations_text += f"{i}. [{obs_date}] {obs_category}: {obs_content}\n"
        #    observations_text += "\nBu gözlemlerim ışığında aşağıdaki soruyu cevapla:\n"  ## bu kısma gerek yok.
        
        else: # eğer öğrenci hakkında bir gözlem yoksa analiz yapılmayacak.
            observations_text = "\n\n📝 Bu öğrenci hakkında henüz bir gözlemim bulunmuyor, o yüzden bir değerlendirme yapmayacağım:\n"
        
        base_prompt = f"""Sen bir anaokulu öğretmenisin ve öğrenci analizi konusunda uzmanlaşmışsın. 
        Şu anda {analysis_message.student_name} adlı öğrenci hakkında konuşuyorsun.
        Öğretmen: {user["full_name"]} (ID: {teacher_id})
        
        Bu öğrencinin gelişimi, davranışları, güçlü yönleri ve geliştirilmesi gereken alanları hakkında 
        eğitici ve yapıcı tavsiyelerde bulun. Cevaplarını anaokulu öğretmeni perspektifinden ver.
        
        Tarih ve Saat: {current_datetime_str}
        Öğrenci: {analysis_message.student_name}
        {observations_text}
        
        Gözlem: {analysis_message.message}
        
        **Önemli:** Eğer gözlemlerim varsa bunları dikkate alarak öğrenci hakkında kişiselleştirilmiş ve spesifik tavsiyelerde bulun. 
        Gözlemlerdeki gelişim trendlerini, güçlü yönlerini ve iyileştirme alanlarını analiz et.
        
        **Önemli** Eğer öğrenci hakkında gözlem yoksa değerlendirme yapma, bu öğrenci hakkında bilgiye sahip değilim diye cevap verebilirsin (hiçbir güçlü yön, geliştirilmesi gereken alan vs yazma).
        
        **Önemli** Eğer bazı kategorilerde gözlem belirtilmemişse sadece o kategoride bu öğrenci hakkında bu yönden bilgi sahibi değilim diye cevap ver.
        
        **Önemli** Veliye bilgi verdiğin için Değerli Veli diye başla.
        
        Cevabında şu format kullan:
        - **Kısa Değerlendirme:** (Gözlemler ışığında genel durum)
        - **Önerilerim:** (Spesifik öneriler)
        - **Dikkat Edilecek Noktalar:** (Varsa önemli hususlar)

        Sadece gözlemini yaz, kullanıcı ile alakalı konuşmalar yapma. (Tabiki sizin için bir analiz yazıyorum gibi şeyler kullanma)
        
        Türkçe cevap ver:"""

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[base_prompt]
        )
        
        return JSONResponse(content={
            "success": True,
            "response": response.text,
            "student_name": analysis_message.student_name,
            "teacher_id": teacher_id,
            "observations_count": len(analysis_message.student_observations) if analysis_message.student_observations else 0
        })
        
    except HTTPException:
        raise 
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": f"API hatası: {str(e)}"
            }
        )

## Günlük Plan API endpoint'i
@app.post("/api/gunluk-plan")
async def gunluk_plan_api(
    request: Request,
    message: str = Form(...),
    date: str = Form(...),
    pdf_file: Optional[UploadFile] = File(None)
):
    try:
        user = require_auth(request)
        teacher_id = user["teacher_id"]
        
        now = datetime.datetime.now()
        current_datetime_str = now.strftime("%d.%m.%Y %H:%M")
        
        base_prompt = f"""Sen bir anaokulu öğretmenisin ve günlük eğitim planları konusunda uzmanlaşmışsın. 
        
        Öğretmen: {user["full_name"]})
        Talep: {message}
        
        """        # PDF dosyası yüklendiyse içeriğini ekle
        if pdf_file and pdf_file.content_type == "application/pdf":
            try:
                pdf_content = await pdf_file.read()
                
                with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as temp_file:
                    temp_file.write(pdf_content)
                    temp_file_path = temp_file.name
                
                filepath = pathlib.Path(temp_file_path)
  
                prompt = base_prompt + f"""
                Yüklenen PDF dosyasını analiz ederek bu dosyaya uygun günlük plan oluştur.
                PDF içeriğine göre yaş grubuna uygun, eğitici ve eğlenceli günlük plan hazırla.
                
                Planı şu formatta hazırla:
                
                # {date} Günlük Eğitim Planı
                
                ## Genel Bilgiler
                - **Tema:** 
                
                ## Günlük Program
                
                ### 09:00 - 09:30 | Karşılama ve Sabah Etkinlikleri
                - Aktivite detayları...
                
                ### 09:30 - 10:15 | Ana Etkinlik 1
                - **Etkinlik:** 
                - **Amaç:** 
                - **Malzemeler:** 
                - **Süreç:** 
                
                (Diğer zaman dilimlerini ekle...)
                
                ## Öğrenme Hedefleri
                - Hedef 1
                - Hedef 2
                
                ## Değerlendirme Kriterleri
                - Kriter 1
                - Kriter 2
                
                ## Öneriler ve Notlar
                - Öneri 1
                - Öneri 2
                
                Sadece planı yaz, kullanıcı ile alakalı konuşmalar yapma.
                Türkçe ve detaylı bir plan hazırla.
                """
                                
                response = client.models.generate_content(
                    model="gemini-2.5-pro",
                    contents=[
                        types.Content(role="user", parts=[
                            types.Part.from_bytes(
                                data=filepath.read_bytes(),
                                mime_type='application/pdf',
                            )
                        ]),
                        types.Content(role="user", parts=[
                            types.Part(text=prompt)
                        ])
                    ]
                )
                try:
                    os.unlink(temp_file_path)
                except Exception as cleanup_error:
                    print(f"DEBUG: Temp dosya silme hatası: {cleanup_error}")
            except Exception as pdf_error:
                print(f"DEBUG: PDF işleme hatası: {pdf_error}")
                print(f"DEBUG: PDF hata türü: {type(pdf_error)}")
                print(f"DEBUG: PDF hata detayı: {str(pdf_error)}")
        else:
            full_prompt = base_prompt + f"""

            Günlük eğitim planı oluşturmak için yardım et. Aşağıdaki kriterlere göre detaylı bir plan hazırla:

            Planı şu formatta hazırla:
            
            # {date} Günlük Eğitim Planı
            
            ## Genel Bilgiler
            - **Tema:** (Ana konuyu belirle)
            
            ## Günlük Program
            
            ### 09:00 - 09:30 | Karşılama ve Sabah Etkinlikleri
            - Günaydın şarkısı
            - Günlük rutin kontrolleri
            - Serbest oyun zamanı
            
            ### 09:30 - 10:15 | Ana Etkinlik 1
            - **Etkinlik:** (Taleple ilgili ana etkinlik)
            - **Amaç:** 
            - **Malzemeler:** 
            - **Süreç:** (Adım adım açıkla)
            
            ### 10:15 - 10:30 | Ara
            - Atıştırmalık zamanı
            - Tuvalet molası
            
            ### 10:30 - 11:15 | Ana Etkinlik 2
            - **Etkinlik:** 
            - **Amaç:** 
            - **Malzemeler:** 
            - **Süreç:** 
            
            ### 11:15 - 12:00 | Hareket ve Oyun
            - Fiziksel aktiviteler
            - Grup oyunları
            
            ### 12:00 - 13:00 | Öğle Yemeği
            - Yemek öncesi hazırlık
            - Yemek zamanı
            - Temizlik
            
            ### 13:00 - 14:00 | Dinlenme/Uyku Saati
            - Sakin müzik
            - Hikaye dinleme
            - Kısa dinlenme
            
            ### 14:00 - 14:45 | Yaratıcı Etkinlik
            - **Etkinlik:** 
            - **Amaç:** 
            - **Malzemeler:** 
            - **Süreç:** 
            
            ### 14:45 - 15:30 | Kapanış Etkinlikleri
            - Günün değerlendirilmesi
            - Yarın için hazırlık
            - Veda şarkısı
            
            ## Öğrenme Hedefleri
            - (Taleple ilgili 3-4 adet öğrenme hedefi)
            
            ## Değerlendirme Kriterleri
            - (Hedeflere ulaşımı ölçecek kriterler)
            
            ## Öneriler ve Notlar
            - (Öğretmen için pratik öneriler)
            - (Güvenlik uyarıları)
            - (Alternatif aktiviteler)
            
            Detaylı, uygulanabilir ve eğitici bir plan hazırla. Yaş grubuna uygun etkinlikler seç.
            
            Sadece planı yaz, kullanıcı ile alakalı konuşmalar yapma. (Tabiki sizin için bir plan yazıyorum gibi şeyler kullanma)
            Türkçe cevap ver.
            """
            
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=[full_prompt]
            )
        return JSONResponse(content={
        "success": True,
        "response": response.text,
        "date": date,
        "has_pdf": pdf_file is not None,
        "teacher_id": teacher_id
        })
        
    except HTTPException:
        print(f"DEBUG: HTTPException yakalandı")
        raise
    except Exception as e:
        print(f"DEBUG: Genel API hatası: {e}")
        print(f"DEBUG: Hata türü: {type(e)}")
        print(f"DEBUG: Hata detayı: {str(e)}")
        import traceback
        print(f"DEBUG: Traceback:\n{traceback.format_exc()}")
        
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": f"API hatası: {str(e)}",
                "error_type": str(type(e)),
                "has_pdf": pdf_file is not None if 'pdf_file' in locals() else False
            }
        )
## Öğrenci listesi API endpoint'i
@app.get("/api/students")
async def get_students(request: Request):
    connection = None
    cursor = None
    try:
        user = require_auth(request)
        teacher_id = user["teacher_id"]
        
        connection = get_db_connection()
        cursor = connection.cursor()
        
        # Öğretmenin sınıfındaki öğrencileri getir.  TODO: öğretmenin birden fazla sınıfı olabilir? ama biz eklemeyeceğiz gibi duruyor şu anda.
        query = """
        SELECT 
            s.id,
            s.name,
            s.surname,
            s.email,
            s.sinif,
            c.name as class_name,
            c.class_id
        FROM students s
        JOIN classes c ON s.class_id = c.class_id
        WHERE c.teacher_id = %s
        ORDER BY s.name, s.surname
        """
        
        cursor.execute(query, (teacher_id,))
        student_records = cursor.fetchall()
        
        students = []
        for record in student_records:
            student = {
                "id": record[0],
                "name": record[1],
                "surname": record[2],
                "email": record[3],
                "sinif": record[4],
                "class_name": record[5],
                "class_id": record[6]
            }
            students.append(student)
        
        return JSONResponse(content={
            "success": True,
            "students": students,
            "teacher_id": teacher_id,
            "count": len(students)
        })
        
    except HTTPException:
        raise 
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": f"API hatası: {str(e)}"
            }
        )
    finally:
        if cursor:
            try:
                cursor.close()
            except:
                pass
        if connection:
            try:
                connection.close()
            except:
                pass

## Öğretmen ile AI arasındaki sohbet mesajı API endpoint'i
@app.post("/api/send_message")
async def send_message(request: Request, chat_message: ChatMessage):
    try:
        user = require_auth(request)
        teacher_id = user["teacher_id"]
        
        now = datetime.datetime.now()
        current_datetime_str = now.strftime("%d.%m.%Y %H:%M")
        prompt_datetime_prefix = f"Tarih ve Saat: {current_datetime_str}\nÖğretmen: {user['full_name']})\n"
        
        category_prompts = {
            "Etkinlik Planı": "Sen bir anaokulu öğretmenisin. Çocuklar için yaratıcı, eğitici ve eğlenceli etkinlikler tasarlama konusunda uzmanlaşmışsın. Yaş gruplarına uygun eğitim aktiviteleri öneriyorsun. Etkinlik planlarını düzgün formatla yaz. Başlıkları '# Başlık' veya '## Alt Başlık' şeklinde kullan. **Etkinlik Adı:**, **Yaş Grubu:**, **Süre:**, **Malzemeler:** gibi bölümleri kalın yaparak belirt. Adımları numaralı liste halinde sun. Eğitici hedefleri ve öğrenme çıktılarını belirt. Sadece hikayeyi yaz, kullanıcı ile alakalı konuşmalar yapma. (Tabiki sizin için bir hikaye yazıyorum gibi şeyler kullanma) Kullanıcının sorusuna Türkçe cevap ver: ",
            "Oyun Planı": "Sen bir anaokulu öğretmenisin. Çocuklar için eğlenceli, interaktif oyunlar ve oyun aktiviteleri tasarlama konusunda uzmanlaşmışsın. Yaş gruplarına uygun oyun aktiviteleri öneriyorsun. Oyun planlarını düzgün formatla yaz. Başlıkları '# Başlık' veya '## Alt Başlık' şeklinde kullan. **Oyun Adı:**, **Yaş Grubu:**, **Süre:**, **Malzemeler:** gibi bölümleri kalın yaparak belirt. Oyun kurallarını ve adımları numaralı liste halinde sun. Eğlenceli ve hareketli oyunlara odaklan. Sadece hikayeyi yaz, kullanıcı ile alakalı konuşmalar yapma. (Tabiki sizin için bir hikaye yazıyorum gibi şeyler kullanma) Kullanıcının sorusuna Türkçe cevap ver: ",
            "Boyama/Çalışma Sayfaları": "Sen bir anaokulu öğretmenisin. Çocuklar için yaratıcı boyama sayfaları ve çalışma kağıtları tasarlama konusunda uzmanlaşmışsın. Yaş gruplarına uygun etkinlikler öneriyorsun. Kullanıcının sorusuna Türkçe cevap ver: ",
            "Hikayeler": "Sen bir anaokulu öğretmenisin. Çocuklar için eğitici, yaratıcı ve eğlenceli hikayeler yazma konusunda uzmanlaşmışsın. Yaş gruplarına uygun hikayeler oluşturuyorsun. Hikayelerini düzgün başlıklar, paragraflar ve formatlarla yaz. Başlıkları '# Başlık' veya '## Alt Başlık' şeklinde kullan. Önemli kelimeleri **kalın** yapmayı unutma. Sadece hikayeyi yaz, kullanıcı ile alakalı konuşmalar yapma. (Tabiki sizin için bir hikaye yazıyorum gibi şeyler kullanma) Kullanıcının sorusuna Türkçe cevap ver: ",
        }

        base_prompt = category_prompts.get(chat_message.category, "Sen yardımcı bir AI asistanısın. Soruyu Türkçe cevaplayın: ")
        full_prompt = prompt_datetime_prefix + base_prompt + chat_message.message
        boyama_prompt = base_prompt + chat_message.message
        # boyama sayfasında image modeli kullanılacak. 
        # yaratıcılık istediğimiz için greedy decoding yerine sampling kullanıyoruz. temp = 0.8, top_k = 64, top_p = 0.90
        if chat_message.category == "Boyama/Çalışma Sayfaları":
            response = client.models.generate_content(
                model="gemini-2.0-flash-preview-image-generation", 
                contents=[boyama_prompt],
                config=types.GenerateContentConfig(
                    response_modalities=['TEXT', 'IMAGE'],
                    top_k= 64,
                    top_p= 0.90,
                    temperature= 0.8,                ),         
            )

            response_text = ""
            image_url = None
            
            for part in response.candidates[0].content.parts:
                if hasattr(part, 'text') and part.text:
                    response_text += part.text
                elif hasattr(part, 'inline_data') and part.inline_data:
                    try:
                        raw_data = part.inline_data.data
                        
                        if isinstance(raw_data, bytes):
                            image_base64 = base64.b64encode(raw_data).decode('utf-8')
                        else:
                            image_base64 = raw_data if isinstance(raw_data, str) else base64.b64encode(raw_data).decode('utf-8')

                        image_url = f"data:image/png;base64,{image_base64}"

                    except Exception as img_error:
                        print(f"DEBUG: Görsel kaydetme hatası: {img_error}")
                        image_url = None
                        
            return JSONResponse(content={
                "success": True,
                "response": response_text,
                "category": chat_message.category,
                "image_url": image_url, 
                "has_image": image_url is not None,
                "teacher_id": teacher_id
            })
      
        else:
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=[full_prompt],
                config=types.GenerateContentConfig(
                    top_k= 64,
                    top_p= 0.90,
                    temperature= 0.8,
                ),
            )
        return JSONResponse(content={
        "success": True,
        "response": response.text,
        "category": chat_message.category,
        "teacher_id": teacher_id
    })
        
    except HTTPException:
        raise 
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": f"API hatası: {str(e)}"
            }
        )

## Öğrencinin gözlemlerini getiren API endpoint'i
@app.get("/api/student-notes/{student_id}")
async def get_student_notes(request: Request, student_id: int):
    connection = None
    cursor = None
    
    try:
        user = require_auth(request)
        teacher_id = user["teacher_id"]
        
        connection = get_db_connection()
        cursor = connection.cursor()
        
        notes_query = """
        SELECT id, observation_text, observation_date, category
        FROM observations
        WHERE student_id = %s AND teacher_id = %s
        ORDER BY observation_date DESC
        """
        cursor.execute(notes_query, (student_id, teacher_id))
        notes_records = cursor.fetchall()
        
        notes = []
        for record in notes_records:
            note = {
                "id": record[0],  
                "content": record[1],  
                "category": record[3] or "genel", 
                "categoryLabel": record[3] or "Genel Gözlem",
                "date": record[2].isoformat() if record[2] else datetime.date.today().isoformat()
            }
            notes.append(note)
        
        return JSONResponse(content={
            "success": True,
            "notes": notes,
            "student_id": student_id
        })
        
    except HTTPException:
        raise
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": f"Not yükleme hatası: {str(e)}"
            }
        )
    finally:
        if cursor:
            try:
                cursor.close()
            except:
                pass
        if connection:
            try:
                connection.close()
            except:
                pass

## Öğrenci gözlem ekleme API endpoint'i
@app.post("/api/student-notes")
async def save_student_note(request: Request):
    connection = None
    cursor = None
    
    try:
        user = require_auth(request)
        teacher_id = user["teacher_id"]
        
        body = await request.json()
        student_id = body.get("student_id")
        note_content = body.get("content")
        note_category = body.get("category", "genel")
        
        if not student_id or not note_content:
            raise HTTPException(status_code=400, detail="Öğrenci ID'si ve not içeriği gerekli")
                
        try:
            formatted_observation = format_student_observation(note_content, note_category)
        except Exception as e:
            print(f"DEBUG: format_student_observation hatası: {e}")
            temp_text = note_content.strip()
            if not temp_text.endswith('.'):
                temp_text += '.'
            if temp_text:
                temp_text = temp_text[0].upper() + temp_text[1:]
            today = datetime.datetime.now().strftime("%d.%m.%Y")
            formatted_observation = f"[{today}] Genel Gelişim: Öğrenci {temp_text.lower()}"
        
        category_mapping = {
            "genel": "Genel",
            "sosyal": "Sosyal Beceriler", 
            "akademik": "Akademik",
            "yaraticilik": "Yaratıcılık",
            "davranis": "Davranış"
        }
        final_category = category_mapping.get(note_category.lower(), "Genel")
        
        connection = get_db_connection()
        cursor = connection.cursor()
        
        insert_query = """
        INSERT INTO observations (student_id, teacher_id, observation_text, category)
        VALUES (%s, %s, %s, %s)
        """
        
        cursor.execute(insert_query, (
            student_id, 
            teacher_id, 
            formatted_observation, 
            final_category
        ))
        
        connection.commit()
        
        return JSONResponse(content={
            "success": True,
            "original_content": note_content,
            "formatted_content": formatted_observation,
            "category": final_category,
            "student_id": student_id,
            "message": "Gözlem başarıyla formatlandı ve kaydedildi"
        })
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"DEBUG: Genel hata: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": f"Gözlem kaydetme hatası: {str(e)}"
            }
        )
    finally:
        if cursor:
            try:
                cursor.close()
            except:
                pass
        if connection:
            try:
                connection.close()
            except:
                pass

## Öğrenci gözlemi silme API endpoint'i
@app.delete("/api/student-notes/{note_id}")
async def delete_student_note(request: Request, note_id: int):
    connection = None
    cursor = None
    
    try:
        user = require_auth(request)
        teacher_id = user["teacher_id"]
        
        connection = get_db_connection()
        cursor = connection.cursor()
        
        check_query = """
        SELECT id, student_id FROM observations 
        WHERE id = %s AND teacher_id = %s
        """
        cursor.execute(check_query, (note_id, teacher_id))
        existing_note = cursor.fetchone()
        
        if not existing_note:
            return JSONResponse(
                status_code=404,
                content={
                    "success": False,
                    "error": "Gözlem bulunamadı veya silme yetkiniz yok."
                }
            )
        
        student_id = existing_note[1];
        
        delete_query = """
        DELETE FROM observations 
        WHERE id = %s AND teacher_id = %s
        """
        
        cursor.execute(delete_query, (note_id, teacher_id))
        deleted_rows = cursor.rowcount
        connection.commit()
        
        if deleted_rows > 0:
            print(f"DEBUG: Gözlem başarıyla silindi - note_id: {note_id}")
            return JSONResponse(content={
                "success": True,
                "message": "Gözlem başarıyla silindi!",
                "note_id": note_id,
                "student_id": student_id,
                "teacher_id": teacher_id
            })
        else:
            return JSONResponse(
                status_code=500,
                content={
                    "success": False,
                    "error": "Gözlem silinemedi."
                }
            )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"DEBUG: Gözlem silme hatası: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": f"Bağlantı hatası oluştu. Lütfen tekrar deneyin."
            }
        )
    finally:
        if cursor:
            try:
                cursor.close()
            except:
                pass
        if connection:
            try:
                connection.close()
            except:
                pass

@app.get("/api/student-progress/{student_id}")
async def get_student_progress(request: Request, student_id: int):
    connection = None
    cursor = None
    
    try:
        user = require_auth(request)
        teacher_id = user["teacher_id"]
        
        connection = get_db_connection()
        cursor = connection.cursor()
        
        student_query = """
        SELECT s.name, s.surname
        FROM students s
        JOIN classes c ON s.class_id = c.class_id
        WHERE s.id = %s AND c.teacher_id = %s
        """
        cursor.execute(student_query, (student_id, teacher_id))
        student_info = cursor.fetchone()
        
        if not student_info:
            raise HTTPException(status_code=404, detail="Öğrenci bulunamadı")
        
        student_name = f"{student_info[0]} {student_info[1]}"
        
        categories = ['Genel', 'Sosyal Beceriler', 'Akademik', 'Yaratıcılık', 'Davranış']
        category_observations = {}
        
        # her kategori için en son yapılan 7 gözlemi alıyoruz.  (sayı arttırılabilir)
        for category in categories:
            observations_query = """
            SELECT observation_text, observation_date
            FROM observations
            WHERE student_id = %s AND teacher_id = %s AND category = %s
            ORDER BY observation_date DESC
            LIMIT 7
            """
            cursor.execute(observations_query, (student_id, teacher_id, category))
            observations = cursor.fetchall()
            
            category_observations[category] = [
                {
                    "text": obs[0],
                    "date": obs[1].strftime("%d.%m.%Y") if obs[1] else ""
                }
                for obs in observations
            ]
        
        # Gemini ile gelişim analizi yap
        analysis_prompt = f"""
        Sen bir anaokulu öğretmenisin ve öğrenci gelişim değerlendirmesi konusunda uzmanlaşmışsın.

        Öğrenci: {student_name}
        Öğretmen: {user["full_name"]}

        Aşağıdaki kategorilerde bu öğrencinin son gözlemlerini analiz et ve her kategori için 0-100 puan arasında değerlendirme yap:
        """
        
        for category, observations in category_observations.items():
            if observations:
                analysis_prompt += f"\n## {category} Kategorisi:\n"
                for i, obs in enumerate(observations, 1):
                    analysis_prompt += f"{i}. [{obs['date']}] {obs['text']}\n"
            else:
                analysis_prompt += f"\n## {category} Kategorisi:\nBu kategoride henüz gözlem bulunmuyor.\n"
        
        analysis_prompt += """
                        Lütfen her kategori için aşağıdaki formatta değerlendirme yap:
                        **YARATICILIK: [0-100 puan]**
                        - Güçlü Yönler: [2-3 madde]
                        - Gelişim Alanları: [2-3 madde]
                        - Öneriler: [2-3 madde]

                        **SOSYAL BECERİLER: [0-100 puan]**
                        - Güçlü Yönler: [2-3 madde]
                        - Gelişim Alanları: [2-3 madde]
                        - Öneriler: [2-3 madde]

                        **GENEL GELİŞİM: [0-100 puan]**
                        - Güçlü Yönler: [2-3 madde]
                        - Gelişim Alanları: [2-3 madde]
                        - Öneriler: [2-3 madde]

                        **DAVRANIŞ: [0-100 puan]**
                        - Güçlü Yönler: [2-3 madde]
                        - Gelişim Alanları: [2-3 madde]
                        - Öneriler: [2-3 madde]

                        **AKADEMİK GELİŞİM: [0-100 puan]**
                        - Güçlü Yönler: [2-3 madde]
                        - Gelişim Alanları: [2-3 madde]
                        - Öneriler: [2-3 madde]

                        Puanlamada anaokulu yaş grubunu dikkate al. Gözlem yoksa bu öğrenci hakkında gözleminiz yok de ve puanı 75 olarak ver.
                        Pozitif ve yapıcı dil kullan. Türkçe cevap ver.
                        """
                        
        ### eğer gözlem yoksa öğrenciye default 75 puan veriyoruz ve gözlemimiz yok diyoruz.
        ## analiz ederken de deterministik davranmasını istiyoruz. Bu yüzden sampling yerine greedy decoding kullanıyoruz.
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[analysis_prompt]
        )
        
        analysis_text = response.text

        scores = {}
        score_patterns = {
            'yaraticilik': r'\*\*YARATICILIK:\s*\[?(\d+)',
            'sosyal': r'\*\*SOSYAL BECERİLER:\s*\[?(\d+)',
            'genel': r'\*\*GENEL GELİŞİM:\s*\[?(\d+)',
            'davranis': r'\*\*DAVRANIŞ:\s*\[?(\d+)',
            'akademik': r'\*\*AKADEMİK GELİŞİM:\s*\[?(\d+)'
        }
        
        for category, pattern in score_patterns.items():
            match = re.search(pattern, analysis_text, re.IGNORECASE)
            scores[category] = int(match.group(1)) if match else 75
            
        return JSONResponse(content={
        "success": True,
        "student_id": student_id,
        "student_name": student_name,
        "scores": scores,
        "analysis": analysis_text,
        "category_observations": category_observations,
        "teacher_id": teacher_id
    })
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"DEBUG: Gelişim analizi hatası: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": f"Gelişim analizi hatası: {str(e)}"
            }
        )
    finally:
        if cursor:
            try:
                cursor.close()
            except:
                pass
        if connection:
            try:
                connection.close()
            except:
                pass

## Günlük plan kaydetme API endpoint'i
@app.post("/api/save-daily-plan")
async def save_daily_plan(request: Request, plan_request: DailyPlanSaveRequest):
    connection = None
    cursor = None
    
    try:
        user = require_auth(request)
        teacher_id = user["teacher_id"]
        
        try:
            plan_date = datetime.datetime.strptime(plan_request.plan_date, "%Y-%m-%d").date()
        except ValueError:
            return JSONResponse(
                status_code=400,
                content={
                    "success": False,
                    "error": "Geçersiz tarih formatı. YYYY-MM-DD formatında olmalı."
                }
            )
        
        connection = get_db_connection()
        cursor = connection.cursor()
        
        check_query = """
        SELECT id FROM daily_plans 
        WHERE teacher_id = %s AND plan_date = %s
        """
        cursor.execute(check_query, (teacher_id, plan_date))
        existing_plan = cursor.fetchone()
        
        if existing_plan:  ## eski planı yeni planla güncelliyoruz.
            update_query = """
            UPDATE daily_plans 
            SET content = %s, created_at = NOW()
            WHERE teacher_id = %s AND plan_date = %s
            """
            cursor.execute(update_query, (plan_request.content, teacher_id, plan_date))
            action = "güncellendi"
        else:
            insert_query = """
            INSERT INTO daily_plans (teacher_id, plan_date, content)
            VALUES (%s, %s, %s)
            """
            cursor.execute(insert_query, (teacher_id, plan_date, plan_request.content))
            action = "kaydedildi"
        
        connection.commit()
        
        return JSONResponse(content={
            "success": True,
            "message": f"Günlük plan başarıyla {action}!",
            "plan_date": plan_request.plan_date,
            "teacher_id": teacher_id,
            "action": action
        })
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"DEBUG: Günlük plan kaydetme hatası: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": f"Günlük plan kaydetme hatası: {str(e)}"
            }
        )
    finally:
        if cursor:
            try:
                cursor.close()
            except:
                pass
        if connection:
            try:
                connection.close()
            except:
                pass

## Takvimde günlük planları getiren API endpoint'i
@app.get("/api/get-daily-plans")
async def get_daily_plans(request: Request):
    try:
        user = require_auth(request)
        teacher_id = user["teacher_id"]
        
        connection = get_db_connection()
        cursor = connection.cursor()
        
        plans_query = """
        SELECT id, plan_date, content, created_at
        FROM daily_plans
        WHERE teacher_id = %s
        ORDER BY plan_date DESC
        """
        cursor.execute(plans_query, (teacher_id,))
        plans_records = cursor.fetchall()
        
        plans = []
        for record in plans_records:
            plan = {
                "id": record[0],
                "plan_date": record[1].isoformat() if record[1] else "",
                "content": record[2],
                "created_at": record[3].isoformat() if record[3] else ""
            }
            plans.append(plan)
        
        cursor.close()
        connection.close()
        
        return JSONResponse(content={
            "success": True,
            "plans": plans,
            "teacher_id": teacher_id,
            "count": len(plans)
        })
        
    except HTTPException:
        raise
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": f"Günlük planları yükleme hatası: {str(e)}"
            }        )

## Günlük plan silme API endpoint'i
@app.delete("/api/delete-daily-plan/{plan_id}")
async def delete_daily_plan(request: Request, plan_id: int):
    try:
        user = require_auth(request)
        teacher_id = user["teacher_id"]
        
        connection = get_db_connection()
        cursor = connection.cursor()
        
        check_query = """
        SELECT id FROM daily_plans 
        WHERE id = %s AND teacher_id = %s
        """
        cursor.execute(check_query, (plan_id, teacher_id))
        existing_plan = cursor.fetchone()
        
        if not existing_plan:
            return JSONResponse(
                status_code=404,
                content={
                    "success": False,
                    "error": "Plan bulunamadı veya silme yetkiniz yok."
                }
            )
        
        delete_query = """
        DELETE FROM daily_plans 
        WHERE id = %s AND teacher_id = %s
        """
        cursor.execute(delete_query, (plan_id, teacher_id))
        connection.commit();
        
        cursor.close()
        connection.close();
        
        return JSONResponse(content={
            "success": True,
            "message": "Günlük plan başarıyla silindi!",
            "plan_id": plan_id,
            "teacher_id": teacher_id
        })
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"DEBUG: Günlük plan silme hatası: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": f"Günlük plan silme hatası: {str(e)}"
            }
        )

if __name__ == '__main__':
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)

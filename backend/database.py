"""
SQLite Database Setup for SHIXO - Government Teacher Transfer Management
"""
import sqlite3
import os
import json
import random
import hashlib
from datetime import datetime, timedelta

DB_PATH = os.path.join(os.path.dirname(__file__), "shixo.db")

MANDALS = [
    "Hyderabad East", "Hyderabad West", "Secunderabad", "Rangareddy North",
    "Rangareddy South", "Medchal", "Shamirpet", "Keesara", "Ghatkesar",
    "Uppal", "LB Nagar", "Rajendranagar", "Serilingampally", "Kukatpally",
    "Quthbullapur", "Patancheru", "Sangareddy", "Medak", "Siddipet",
    "Karimnagar"
]

DISTRICTS = [
    "Hyderabad", "Rangareddy", "Medchal-Malkajgiri", "Sangareddy",
    "Medak", "Siddipet", "Karimnagar"
]

MANDAL_DISTRICT_MAP = {
    "Hyderabad East": "Hyderabad",
    "Hyderabad West": "Hyderabad",
    "Secunderabad": "Hyderabad",
    "Rangareddy North": "Rangareddy",
    "Rangareddy South": "Rangareddy",
    "Medchal": "Medchal-Malkajgiri",
    "Shamirpet": "Medchal-Malkajgiri",
    "Keesara": "Medchal-Malkajgiri",
    "Ghatkesar": "Medchal-Malkajgiri",
    "Uppal": "Medchal-Malkajgiri",
    "LB Nagar": "Rangareddy",
    "Rajendranagar": "Rangareddy",
    "Serilingampally": "Rangareddy",
    "Kukatpally": "Medchal-Malkajgiri",
    "Quthbullapur": "Medchal-Malkajgiri",
    "Patancheru": "Sangareddy",
    "Sangareddy": "Sangareddy",
    "Medak": "Medak",
    "Siddipet": "Siddipet",
    "Karimnagar": "Karimnagar",
}

SUBJECTS = [
    "Mathematics", "Science", "English", "Hindi", "Telugu",
    "Social Science", "Physics", "Chemistry", "Biology",
    "Computer Science", "Physical Education"
]

FIRST_NAMES_M = [
    "Rajesh", "Amit", "Vikram", "Suresh", "Deepak", "Arun", "Sanjay",
    "Ramesh", "Mahesh", "Vinod", "Ashok", "Dinesh", "Naresh", "Pankaj",
    "Yogesh", "Mukesh", "Harish", "Sunil", "Vikas", "Ajay",
    "Ravi", "Mohan", "Krishna", "Srikanth", "Venkat", "Prasad"
]
FIRST_NAMES_F = [
    "Priya", "Sunita", "Anita", "Kavita", "Meena", "Pooja", "Nita",
    "Geeta", "Seema", "Rekha", "Usha", "Shanti", "Lakshmi", "Radha",
    "Savita", "Pushpa", "Kamla", "Devika", "Saroj", "Padma",
    "Swathi", "Divya", "Anusha", "Lavanya", "Sravani", "Bhavani"
]
LAST_NAMES = [
    "Sharma", "Verma", "Gupta", "Singh", "Kumar", "Reddy", "Rao",
    "Naidu", "Chary", "Prasad", "Murthy", "Varma", "Goud",
    "Yadav", "Mishra", "Tiwari", "Joshi", "Pandey", "Shukla",
    "Patel", "Iyer", "Nair", "Pillai", "Menon"
]

SCHOOL_TYPES = [
    "Govt. Primary School", "Govt. Upper Primary School",
    "Govt. High School", "Govt. Senior Secondary School",
    "Zilla Parishad High School", "Mandal Parishad Primary School"
]

REJECTION_REASONS = [
    "No vacancy available at requested school",
    "Current school has teacher shortage",
    "Low priority score - does not meet threshold",
    "Minimum service period not completed",
    "Subject requirement conflict at requested school",
    "Policy constraints - transfer freeze period active"
]


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


def init_db():
    conn = get_db()
    c = conn.cursor()

    c.executescript("""
    CREATE TABLE IF NOT EXISTS schools (
        school_id TEXT PRIMARY KEY,
        school_name TEXT NOT NULL,
        mandal TEXT NOT NULL,
        district TEXT NOT NULL,
        student_strength INTEGER DEFAULT 0,
        current_teacher_count INTEGER DEFAULT 0,
        required_teacher_count INTEGER DEFAULT 0,
        student_teacher_ratio REAL DEFAULT 0,
        subject_wise_vacancy TEXT DEFAULT '{}'
    );

    CREATE TABLE IF NOT EXISTS meos (
        meo_id TEXT PRIMARY KEY,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'meo',
        name TEXT NOT NULL,
        assigned_mandal TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS teachers (
        teacher_id TEXT PRIMARY KEY,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'teacher',
        name TEXT NOT NULL,
        gender TEXT,
        subject TEXT,
        current_school TEXT REFERENCES schools(school_id),
        mandal TEXT,
        years_of_service INTEGER DEFAULT 0,
        rural_service_years INTEGER DEFAULT 0,
        transfer_request INTEGER DEFAULT 0,
        medical_condition INTEGER DEFAULT 0,
        spouse_distance INTEGER DEFAULT 0,
        promotion_due INTEGER DEFAULT 0,
        current_status TEXT DEFAULT 'Active',
        assigned_meo TEXT REFERENCES meos(meo_id),
        requested_school TEXT,
        transfer_status TEXT DEFAULT 'None',
        notification_status TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS transfer_requests (
        request_id TEXT PRIMARY KEY,
        teacher_id TEXT REFERENCES teachers(teacher_id),
        current_school TEXT,
        requested_school TEXT,
        mandal TEXT,
        request_date TEXT,
        transfer_reason TEXT,
        priority_score REAL DEFAULT 0,
        status TEXT DEFAULT 'Pending',
        assigned_meo TEXT,
        approval_date TEXT,
        rejection_reason TEXT,
        generated_pdf_path TEXT
    );

    CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        teacher_id TEXT REFERENCES teachers(teacher_id),
        message TEXT NOT NULL,
        type TEXT DEFAULT 'info',
        read INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now'))
    );
    """)

    conn.commit()
    conn.close()


def seed_db():
    conn = get_db()
    c = conn.cursor()

    existing = c.execute("SELECT COUNT(*) FROM schools").fetchone()[0]
    if existing > 0:
        conn.close()
        return

    random.seed(42)

    # Seed schools - ~25 per mandal
    school_id_counter = 1
    all_schools = []
    for mandal in MANDALS:
        district = MANDAL_DISTRICT_MAP[mandal]
        n_schools = random.randint(20, 30)
        for _ in range(n_schools):
            sid = f"SCH{school_id_counter:04d}"
            stype = random.choice(SCHOOL_TYPES)
            sname = f"{stype} {mandal.split()[0]}-{school_id_counter}"
            strength = random.randint(100, 1500)
            required = max(4, strength // 30)
            current = max(2, required + random.randint(-5, 6))
            ratio = round(strength / max(current, 1), 2)
            vacancies = {}
            for subj in random.sample(SUBJECTS, random.randint(2, 5)):
                vacancies[subj] = random.randint(0, 3)

            all_schools.append((
                sid, sname, mandal, district, strength,
                current, required, ratio, json.dumps(vacancies)
            ))
            school_id_counter += 1

    c.executemany(
        "INSERT INTO schools VALUES (?,?,?,?,?,?,?,?,?)",
        all_schools
    )

    # Seed MEOs - 1 per mandal
    meos = []
    for i, mandal in enumerate(MANDALS, 1):
        mid = f"MEO{i:03d}"
        gender = random.choice(["M", "F"])
        if gender == "M":
            fname = random.choice(FIRST_NAMES_M)
        else:
            fname = random.choice(FIRST_NAMES_F)
        lname = random.choice(LAST_NAMES)
        meos.append((
            mid, hash_password(f"meo{i:03d}"), "meo",
            f"{fname} {lname}", mandal
        ))
    c.executemany("INSERT INTO meos VALUES (?,?,?,?,?)", meos)

    # Build MEO lookup by mandal
    meo_by_mandal = {m[4]: m[0] for m in meos}

    # Seed teachers - ~500 total spread across mandals
    teacher_id_counter = 1
    school_ids_by_mandal = {}
    for s in all_schools:
        m = s[2]
        if m not in school_ids_by_mandal:
            school_ids_by_mandal[m] = []
        school_ids_by_mandal[m].append((s[0], s[1]))

    all_teachers = []
    for mandal in MANDALS:
        n_teachers = random.randint(20, 30)
        schools_in_mandal = school_ids_by_mandal[mandal]
        meo_id = meo_by_mandal[mandal]

        for _ in range(n_teachers):
            tid = f"TCH{teacher_id_counter:05d}"
            gender = random.choice(["Male", "Female"])
            if gender == "Male":
                fname = random.choice(FIRST_NAMES_M)
            else:
                fname = random.choice(FIRST_NAMES_F)
            lname = random.choice(LAST_NAMES)
            subject = random.choice(SUBJECTS)
            school = random.choice(schools_in_mandal)
            yos = random.randint(1, 30)
            rural = random.randint(0, min(yos, 12))
            tr = random.choice([0, 1])
            med = random.choice([0, 0, 0, 0, 1])
            spouse = random.randint(0, 400)
            promo = random.choice([0, 0, 1])
            status = random.choice(["Active", "Active", "Active", "On Leave"])

            all_teachers.append((
                tid, hash_password(f"tch{teacher_id_counter:05d}"),
                "teacher", f"{fname} {lname}", gender, subject,
                school[0], mandal, yos, rural, tr, med, spouse,
                promo, status, meo_id, None, "None", ""
            ))
            teacher_id_counter += 1

    c.executemany(
        "INSERT INTO teachers VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
        all_teachers
    )

    conn.commit()
    conn.close()
    print(f"Seeded {len(all_schools)} schools, {len(meos)} MEOs, {len(all_teachers)} teachers")

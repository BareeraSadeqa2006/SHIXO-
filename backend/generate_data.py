"""
Generate synthetic dataset for Government Teacher Management System
~10,000 teacher records and ~500 school records
"""
import pandas as pd
import numpy as np
import random
import os

np.random.seed(42)
random.seed(42)

N_TEACHERS = 10000
N_SCHOOLS = 500

SUBJECTS = ["Mathematics", "Science", "English", "Hindi", "Social Science",
            "Physics", "Chemistry", "Biology", "History", "Geography",
            "Computer Science", "Physical Education", "Art", "Sanskrit"]

DISTRICTS = ["North Delhi", "South Delhi", "East Delhi", "West Delhi",
             "Central Delhi", "New Delhi", "Noida", "Gurgaon", "Faridabad",
             "Ghaziabad", "Agra", "Lucknow", "Kanpur", "Varanasi", "Jaipur",
             "Jodhpur", "Udaipur", "Kota", "Ajmer", "Bikaner"]

FIRST_NAMES = ["Rajesh", "Priya", "Amit", "Sunita", "Vikram", "Anita", "Suresh",
               "Kavita", "Deepak", "Meena", "Arun", "Pooja", "Sanjay", "Nita",
               "Ramesh", "Geeta", "Mahesh", "Seema", "Vinod", "Rekha", "Ashok",
               "Usha", "Dinesh", "Shanti", "Naresh", "Lakshmi", "Pankaj", "Radha",
               "Yogesh", "Savita", "Mukesh", "Pushpa", "Harish", "Kamla", "Sunil",
               "Devika", "Vikas", "Anita", "Ajay", "Saroj"]

LAST_NAMES = ["Sharma", "Verma", "Gupta", "Singh", "Kumar", "Patel", "Yadav",
              "Mishra", "Tiwari", "Joshi", "Pandey", "Dubey", "Shukla", "Chaudhary",
              "Chauhan", "Rao", "Nair", "Menon", "Pillai", "Iyer", "Reddy",
              "Naidu", "Bhat", "Kaur", "Malhotra", "Aggarwal", "Bansal", "Garg",
              "Mittal", "Jain"]


def generate_schools():
    schools = []
    for i in range(1, N_SCHOOLS + 1):
        district = random.choice(DISTRICTS)
        school_name = f"Govt. {random.choice(['Senior Secondary', 'High', 'Middle', 'Primary'])} School {district.split()[0]}-{i}"
        student_strength = np.random.randint(100, 2000)
        required = max(5, student_strength // 30)
        current = max(2, required + np.random.randint(-5, 8))
        ratio = round(student_strength / max(current, 1), 2)

        # subject-wise vacancy as JSON-like string
        vacancies = {}
        for subj in random.sample(SUBJECTS, random.randint(2, 6)):
            vacancies[subj] = max(0, np.random.randint(0, 4))

        schools.append({
            "School_ID": f"SCH{i:04d}",
            "School_Name": school_name,
            "District": district,
            "Student_Strength": student_strength,
            "Current_Teacher_Count": current,
            "Required_Teacher_Count": required,
            "Student_Teacher_Ratio": ratio,
            "Subject_Wise_Vacancy": str(vacancies)
        })
    return pd.DataFrame(schools)


def generate_teachers(schools_df):
    teachers = []
    school_ids = schools_df["School_ID"].tolist()
    school_names = schools_df.set_index("School_ID")["School_Name"].to_dict()

    for i in range(1, N_TEACHERS + 1):
        age = np.random.randint(24, 62)
        years_service = np.random.randint(1, min(35, age - 22))
        years_in_school = np.random.randint(1, min(years_service + 1, 20))
        rural_years = np.random.randint(0, min(years_service + 1, 15))
        transfer_request = np.random.choice([0, 1], p=[0.65, 0.35])
        medical = np.random.choice([0, 1], p=[0.88, 0.12])
        spouse_dist = np.random.randint(0, 500)
        promotion_due = np.random.choice([0, 1], p=[0.70, 0.30])
        school_id = random.choice(school_ids)

        # Compute transfer recommendation
        score = 0
        if transfer_request == 1: score += 30
        if years_in_school >= 5: score += 20
        if rural_years >= 3: score += 15
        if medical == 1: score += 25
        if spouse_dist > 200: score += 20
        if promotion_due == 1: score += 10
        if years_service >= 10: score += 10

        transfer_recommended = 1 if score >= 45 else 0

        first = random.choice(FIRST_NAMES)
        last = random.choice(LAST_NAMES)

        teachers.append({
            "Teacher_ID": f"TCH{i:05d}",
            "Teacher_Name": f"{first} {last}",
            "Age": age,
            "Subject": random.choice(SUBJECTS),
            "Years_of_Service": years_service,
            "Years_in_Current_School": years_in_school,
            "Rural_Service_Years": rural_years,
            "Transfer_Request": transfer_request,
            "Medical_Ground": medical,
            "Spouse_Location_Distance": spouse_dist,
            "Promotion_Due": promotion_due,
            "Current_School_ID": school_id,
            "Current_School_Name": school_names[school_id],
            "Transfer_Recommended": transfer_recommended
        })
    return pd.DataFrame(teachers)


if __name__ == "__main__":
    print("Generating school data...")
    schools_df = generate_schools()

    print("Generating teacher data...")
    teachers_df = generate_teachers(schools_df)

    os.makedirs("data", exist_ok=True)
    schools_df.to_csv("data/schools.csv", index=False)
    teachers_df.to_csv("data/teachers.csv", index=False)

    print(f"Generated {len(teachers_df)} teachers and {len(schools_df)} schools")
    print(f"Transfer recommended: {teachers_df['Transfer_Recommended'].sum()} ({teachers_df['Transfer_Recommended'].mean()*100:.1f}%)")
    print("Data saved to data/teachers.csv and data/schools.csv")

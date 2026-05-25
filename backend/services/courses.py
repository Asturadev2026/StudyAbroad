import pymysql
import json

# ---------------------------------------------------
# MYSQL CONNECTION
# ---------------------------------------------------
conn = pymysql.connect(
    host="interchange.proxy.rlwy.net",
    user="root",
    password="rCybXbMlvdlepaibUwOwVcTuxThLxgui",
    database="railway",
    port=19214,
    cursorclass=pymysql.cursors.DictCursor
)

cursor = conn.cursor()

print("✅ Connected to Railway MySQL")

# ---------------------------------------------------
# STUDY LEVEL MAPPING
# ---------------------------------------------------
study_level_map = {
    2: "Diploma",
    22: "Bachelors",
    24: "Masters",
    25: "PhD",
    26: "Certificate"
}

# ---------------------------------------------------
# FETCH PROGRAMS + UNIVERSITY + COUNTRY
# ---------------------------------------------------
query = """
SELECT
    up.id,
    up.title,
    up.slug,
    up.study_levels,
    up.study_streams,
    up.intakes,
    up.total_duration,
    up.avarage_salary,
    up.avarage_salary_currency,
    up.image,

    u.name AS university_name,
    u.logo AS university_logo,
    u.address,

    c.name AS country_name

FROM university_programs up

LEFT JOIN universities u
    ON up.university_id = u.id

LEFT JOIN countries c
    ON u.country_id = c.id

WHERE
    up.title IS NOT NULL
    AND up.slug IS NOT NULL
    AND up.title != ''
    AND up.slug != ''
"""

cursor.execute(query)

rows = cursor.fetchall()

print(f"✅ Found {len(rows)} programs")

courses = []

# ---------------------------------------------------
# STREAM DETECTION
# ---------------------------------------------------
def detect_stream(title, raw_stream):

    text = (
        str(title) + " " + str(raw_stream)
    ).lower()

    if any(x in text for x in [
        "computer",
        "software",
        "data",
        "cyber",
        "artificial intelligence",
        "engineering",
        "technology",
        "it"
    ]):
        return "Engineering / IT"

    elif any(x in text for x in [
        "business",
        "finance",
        "marketing",
        "management",
        "mba",
        "commerce"
    ]):
        return "Business / MBA"

    elif any(x in text for x in [
        "art",
        "humanities",
        "music",
        "design",
        "culture"
    ]):
        return "Arts / Humanities"

    elif any(x in text for x in [
        "agriculture",
        "horticulture",
        "food"
    ]):
        return "Agriculture"

    elif any(x in text for x in [
        "medicine",
        "medical",
        "health",
        "nursing"
    ]):
        return "Medical"

    return "General"

# ---------------------------------------------------
# PROCESS COURSES
# ---------------------------------------------------
for row in rows:

    # ---------------------------------------------------
    # PROGRAM NAME
    # ---------------------------------------------------
    program_name = row.get("title") or "N/A"

    # ---------------------------------------------------
    # UNIVERSITY NAME
    # ---------------------------------------------------
    university_name = (
        row.get("university_name")
        or "N/A"
    )

    # ---------------------------------------------------
    # LOCATION
    # ---------------------------------------------------
    address = row.get("address") or ""

    country = row.get("country_name") or ""

    if address and country:
        location = f"{address}, {country}"

    elif country:
        location = country

    else:
        location = "N/A"

    # ---------------------------------------------------
    # STUDY LEVEL
    # ---------------------------------------------------
    try:
        study_level = study_level_map.get(
            int(row.get("study_levels")),
            str(row.get("study_levels"))
        )

    except:
        study_level = "N/A"

    # ---------------------------------------------------
    # STUDY STREAM
    # ---------------------------------------------------
    study_stream = detect_stream(
        row.get("title"),
        row.get("study_streams")
    )

    # ---------------------------------------------------
    # INTAKES
    # ---------------------------------------------------
    intake_value = "N/A"

    try:
        raw_intakes = row.get("intakes")

        if raw_intakes:

            parsed_intakes = json.loads(
                raw_intakes
            )

            names = []

            for intake in parsed_intakes:

                if intake.get("name"):
                    names.append(
                        intake.get("name")
                    )

            if names:
                intake_value = ", ".join(names)

    except:
        intake_value = "N/A"

    # ---------------------------------------------------
    # DURATION
    # ---------------------------------------------------
    duration = (
        row.get("total_duration")
        or "N/A"
    )

    # ---------------------------------------------------
    # FEES
    # ---------------------------------------------------
    fees = "N/A"

    try:
        avg_salary = row.get("avarage_salary")

        if avg_salary:

            currency = (
                row.get("avarage_salary_currency")
                or ""
            )

            fees = f"{currency} {avg_salary}"

    except:
        fees = "N/A"

    # ---------------------------------------------------
    # PROGRAM LINK
    # ---------------------------------------------------
    slug = row.get("slug") or ""

    link = (
        "https://global.stunel.com/programDetails/"
        + slug
        + "/?level="
        + str(study_level)
    )

    # ---------------------------------------------------
    # UNIVERSITY LOGO
    # ---------------------------------------------------
    logo = ""

    if row.get("university_logo"):

        logo = (
            "https://admin.stunel.com/public/uploads/university/"
            + str(row.get("university_logo"))
        )

    # ---------------------------------------------------
    # PROGRAM IMAGE
    # ---------------------------------------------------
    program_image = ""

    if row.get("image"):

        program_image = (
            "https://admin.stunel.com/public/uploads/program/"
            + str(row.get("image"))
        )

    # ---------------------------------------------------
    # FINAL OBJECT
    # ---------------------------------------------------
    course = {
        "program_name": program_name,
        "university_name": university_name,
        "location": location,
        "study_level": study_level,
        "study_stream": study_stream,
        "intakes": intake_value,
        "duration": duration,
        "fees": fees,
        "program_link": link,
        "university_logo": logo,
        "program_image": program_image
    }

    # ---------------------------------------------------
    # DISPLAY LIVE DATA
    # ---------------------------------------------------
    print("\n-----------------------------------")
    print("🎓 Program:", program_name)
    print("🏫 University:", university_name)
    print("📍 Location:", location)
    print("🎓 Study Level:", study_level)
    print("📚 Stream:", study_stream)
    print("🗓️ Intakes:", intake_value)
    print("⏳ Duration:", duration)
    print("💰 Fees:", fees)
    print("🔗 Link:", link)
    print("-----------------------------------")

    courses.append(course)

# ---------------------------------------------------
# SAVE JSON
# ---------------------------------------------------
with open("courses.json", "w", encoding="utf-8") as f:

    json.dump(
        courses,
        f,
        indent=2,
        ensure_ascii=False
    )

print("\n🎉 courses.json created successfully")

# ---------------------------------------------------
# CLOSE CONNECTION
# ---------------------------------------------------
cursor.close()
conn.close()
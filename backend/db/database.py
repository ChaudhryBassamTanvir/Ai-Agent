import sqlite3

conn = sqlite3.connect("data.db", check_same_thread=False)
cursor = conn.cursor()

cursor.execute("""
CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    description TEXT
)
""")

def create_task(desc):
    cursor.execute("INSERT INTO tasks (description) VALUES (?)", (desc,))
    conn.commit()
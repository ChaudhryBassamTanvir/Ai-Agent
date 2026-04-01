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

TASKS = []

def create_task(description: str):
    task = {
        "id": len(TASKS) + 1,
        "description": description
    }
    TASKS.append(task)
    print("New Task:", task)
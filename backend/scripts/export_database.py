# export the schema the sqlite database storywriter.db to dbschema.db
# then append inserts for all records in the llm_provider_presets table
import os
import sqlite3

def include_static_data(cursor, tablename):
    cursor.execute(f"SELECT * FROM {tablename}")
    rows = cursor.fetchall()
    
    with open('dbschema.sql', 'a') as f:
        for row in rows:
            f.write(f"INSERT INTO {tablename} VALUES {row};\n")

def export_database():  
    conn = sqlite3.connect('storywriter.db')
    cursor = conn.cursor()

    with open('dbschema.sql', 'w') as f:
        for line in conn.iterdump():
            if line.startswith('CREATE TABLE') or line.startswith('CREATE INDEX') or line.startswith('PRAGMA'):
                f.write(f'{line}\n')

    include_static_data(cursor, "llm_provider_presets")

    # Close the connection
    conn.close()
if __name__ == "__main__":
    export_database()
    print("Database schema and user roles exported successfully.")
# This script exports the schema of the SQLite database storywriter.db to dbschema.db
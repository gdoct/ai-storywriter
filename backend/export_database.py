# export the schema the sqlite database storywriter.db to dbschema.db
# then append inserts for all records in the user_roles table
import sqlite3


def export_database():  
    # Connect to the SQLite database
    conn = sqlite3.connect('storywriter.db')
    cursor = conn.cursor()

    # Export the schema to dbschema.db
    # Export only the schema (no data) to dbschema.sql
    with open('dbschema.sql', 'w') as f:
        for line in conn.iterdump():
            if line.startswith('CREATE TABLE') or line.startswith('CREATE INDEX') or line.startswith('PRAGMA'):
                f.write(f'{line}\n')

    # Append inserts for all records in the user_roles table
    cursor.execute("SELECT * FROM user_roles")
    rows = cursor.fetchall()
    
    with open('dbschema.sql', 'a') as f:
        for row in rows:
            f.write(f"INSERT INTO user_roles VALUES {row};\n")

    # Close the connection
    conn.close()
if __name__ == "__main__":
    export_database()
    print("Database schema and user roles exported successfully.")
# This script exports the schema of the SQLite database storywriter.db to dbschema.db
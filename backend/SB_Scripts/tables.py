import sqlite3

# Path to your SQLite database
db_path = "/Users/shivbalodi/Desktop/owui_comms/open-webui-0.5.3/backend/data/webui.db"

# Connect to the database
connection = sqlite3.connect(db_path)
cursor = connection.cursor()

# Query to list all tables
cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
tables = cursor.fetchall()

print("Database Tables and Columns:\n")
# Iterate through each table and get its columns
for table in tables:
    table_name = table[0]
    print(f"Table: {table_name}")
    
    # Query to get the columns of the current table
    cursor.execute(f"PRAGMA table_info('{table_name}');")
    columns = cursor.fetchall()
    
    print("Columns:")
    for column in columns:
        # PRAGMA table_info returns:
        # (cid, name, type, notnull, dflt_value, pk)
        print(f"  - {column[1]} ({column[2]})")
    print()

# Close the connection
connection.close()

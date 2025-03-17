from sqlalchemy import create_engine, Column, String, Text, JSON, BigInteger, MetaData, Table

# Define your database URL
DATABASE_URL = "sqlite://///Users/shivbalodi/Desktop/v5.20/open-webui-main/backend/data/webui.db"

# Set up the database engine
engine = create_engine(DATABASE_URL)
metadata = MetaData()

# Define the use_case table schema to match our implementation
use_case_table = Table(
    "usecase",  # Changed from use_cases to use_case to match model
    metadata,
    Column("command", String, primary_key=True),  # Changed from id to command as primary key
    Column("user_id", String),  # Removed nullable=False as it's not in model
    Column("title", Text),  # Changed from name to title
    Column("content", Text),  # Changed from template to content
    Column("timestamp", BigInteger),  # Changed from created_at/updated_at to single timestamp
    Column("access_control", JSON, nullable=True),
)

def recreate_table():
    with engine.connect() as connection:
        # Drop the existing table if it exists
        if engine.dialect.has_table(connection, "use_case"):  # Changed table name here too
            use_case_table.drop(engine)
            print("Existing table `use_case` dropped successfully!")
        
        # Create the new table
        metadata.create_all(engine)
        print("New table `use_case` created successfully!")

if __name__ == "__main__":
    recreate_table()
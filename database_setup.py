import sqlite3
import pandas as pd
import os

def setup_database():
    csv_filename = 'International_Education_Costs.csv'
    db_filename = 'education.db'
    
    if not os.path.exists(csv_filename):
        print(f"Error: Could not find {csv_filename} in this folder. Please double check!")
        return

    print("Reading and cleaning your data...")
    df = pd.read_csv(csv_filename)
    
    # Cleaning data exactly like your Jupyter notebook logic
    cost_cols = ['Tuition_USD', 'Living_Cost_Index', 'Rent_USD', 'Visa_Fee_USD', 'Insurance_USD']
    df = df.dropna(subset=cost_cols)
    df = df[(df[cost_cols] != 0).all(axis=1)]
    
    print(f"Connecting to database and writing {len(df)} rows...")
    # This automatically creates 'education.db' if it doesn't exist
    connection = sqlite3.connect(db_filename)
    
    # Store the cleaned data into a SQL database table named 'costs'
    df.to_sql('costs', connection, if_exists='replace', index=False)
    
    connection.commit()
    connection.close()
    print("Database successfully built and synchronized!")

if __name__ == '__main__':
    setup_database()
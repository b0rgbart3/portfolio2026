import lancedb
import pandas as pd

pd.set_option('display.max_rows', None)
pd.set_option('display.max_columns', None)
pd.set_option('display.width', None)

db = lancedb.connect("lancedb")
table = db.open_table("documents")

print("Row count:", len(table))

df = table.to_pandas()
print(df)
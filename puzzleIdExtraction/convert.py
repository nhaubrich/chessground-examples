import pandas as pd
import sys

df = pd.read_csv(sys.argv[1],usecols=["PuzzleId","Rating"])
#group into 50-rating buckets.

#shuffle
df=df.sample(frac=1)

df["Rating50"] = (df.Rating/50).round().astype(int)*50
limit = 400
ndf = df.groupby(["Rating50"]).agg({'PuzzleId': lambda x: list(x)[:limit]})
ndf.to_json("test.json")
#ndf.to_json("test.json",indent=4)

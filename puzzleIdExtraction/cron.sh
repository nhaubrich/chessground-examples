rm lichess_db_puzzle.* test.json
wget https://database.lichess.org/lichess_db_puzzle.csv.zst
unzstd lichess_db_puzzle.csv.zst
python convert.py lichess_db_puzzle.csv
scp test.json website:/home/u459606996/public_html/puzzles/assets/puzzleIds.json

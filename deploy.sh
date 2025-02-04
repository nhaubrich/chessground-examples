npm run build
THEDIR="puzzles"
sed -i -e "s/..\/..\/assets/\/$THEDIR\/assets/" dist/chessground-examples.js
rsync -r * website:~/public_html/$THEDIR

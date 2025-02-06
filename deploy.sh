npm run build
VERSION=1.2
THEDIR="puzzles"
sed -i -e "s/..\/..\/assets/\/$THEDIR\/assets/" dist/chessground-examples.js
mv dist/chessground-examples.js dist/chessground-examples.$VERSION.js
sed -i -e "s/chessground-examples.js/chessground-examples.$VERSION.js/" index.html
rsync -r * website:~/public_html/$THEDIR

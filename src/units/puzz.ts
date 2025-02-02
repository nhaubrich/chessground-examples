import { Chess } from 'chess.js';
import { Chessground }  from 'chessground';
import { Unit } from './unit';
import { toColor, toDests,  playOtherSide } from '../util'
//import {  toDests,  playOtherSide, san_to_uci} from '../util'
//import { toColor, toDests,  playOtherSide, san_to_uci} from '../util'
//import { uciToMove } from 'chessground/util';

/* Host puzzles gotten from lichess, ideally with given puzzleElo.
 * Lichess gives move list. Need to iterate through (no animation, immovable)
 * */
export const puzzle: Unit = {
  name: 'Puzzle',
  run(el) {
    //const fen = '1nbqk2r/pppp1ppp/5n2/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4';
    //const chess = new Chess(fen);
    const chess = new Chess();
    //first fetch puzzle and play moves
    
    async function fetchData() {
      const response = await fetch('https://lichess.org/api/puzzle/next');
      const data = await response.json();
      /*console.log(data);*/
      console.log(data.puzzle);
      console.log(data.puzzle.initialPly);
      var moveList = data.game.pgn.split(" ")
      console.log(moveList);
      for (var i=0; i<data.puzzle.initialPly;i++) {
        console.log(moveList[i]);
        chess.move(moveList[i]);
        //console.log(san_to_uci(chess,moveList[i]));

        //cg.move(moveList[i]);
      }
      return chess;
    };
    async function displayPuzzle() {
        const chess = await fetchData();
        const fen = chess.fen()
        console.log(chess.fen());
        
        const cg = Chessground(el, {
          fen: fen,
          turnColor: toColor(chess),
          orientation: toColor(chess),
          movable: {
            color: toColor(chess),
            free: false,
            dests: toDests(chess)
          }
        });
        cg.set({
          movable: { events: { after: playOtherSide(cg, chess) } }
        });
        return cg;
    }

    displayPuzzle();

    //dummy return. Can I remove this?
    const cg = Chessground(el, {
      movable: {
        color: 'white',
        free: false,
        dests: toDests(chess)
      }
    });
    cg.set({
      movable: { events: { after: playOtherSide(cg, chess) } }
    });
    return cg;

  }
};



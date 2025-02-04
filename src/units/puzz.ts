import { Chess } from 'chess.js';
import { Chessground }  from 'chessground';
import { Unit } from './unit';
import {  toColor, toOppositeColor, toDests, san_to_uci} from '../util'
//import {  toDests,  playOtherSide, san_to_uci} from '../util'
//import { toColor, toDests,  playOtherSide, san_to_uci} from '../util'
import { uciToMove } from 'chessground/util';

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
      //console.log(data.puzzle.initialPly);
      var moveList = data.game.pgn.split(" ")
      
      for (var i=0; i < data.puzzle.initialPly; i++) {
        //console.log(moveList[i]);
        chess.move(moveList[i]);
      };
      return [chess,data];
    };
    async function displayPuzzle() {
        const [chess,data] = await fetchData();
        const fen = chess.fen()
        console.log(chess.fen());
        //const startingMoves = chess.history().length+1; //increment for initial played move
        //console.log(startingMoves);
        var moveIdx = 0;
        const cg = Chessground(el, {
          fen: fen,
          turnColor: toColor(chess),
          orientation: toOppositeColor(chess),
          movable: {
            color: toColor(chess),
            free: false,
            dests: toDests(chess)
          }
        });
        console.log(data);
        //console.log(chess.moves());//i.e. legal moves
        //console.log(chess.history());//all the ply
        
        //make initial move
        var moveList = data.game.pgn.split(" ");
        const firstMoveSan = moveList[data.puzzle.initialPly];
        console.log("first move");
        console.log(firstMoveSan);
        const firstMoveUci = san_to_uci(chess,firstMoveSan);
        chess.move(firstMoveSan);
        cg.move(firstMoveUci[0],firstMoveUci[1]);
        cg.set({
          fen: chess.fen(),
          turnColor: toColor(chess),
          movable: {
            color: toColor(chess),
            dests: toDests(chess)
          }
        });
        

        //checkPuzzle(cg, chess,data, startingMoves);//idk
        cg.set({
          movable: { events: { after: checkPuzzle(cg, chess,data, moveIdx) } }
        });
        //cg.set({
        //  movable: { events: { after: checkPuzzle(cg, chess,data, startingMoves) } }
        //});
        //cg.set({
        //  movable: { events: { after: checkPuzzle(cg, chess,data, startingMoves) } }
        //});
        //if (false){
        //    checkPuzzle(cg,chess,data,startingMoves);
        //}
        return cg;
    }
    function checkPuzzle(cg,chess,data,moveIdx){
        return (orig, dest) => {
        console.log("checkPuzzle");
        console.log(orig,dest);
        
        console.log(chess.fen())
        let output = chess.move({from: orig, to: dest, promotion: 'q'});//unable to select promotion ???
        console.log(output);
        console.log(chess.fen())
        //const plyCount = chess.history().length;
        console.log(moveIdx,data.puzzle.solution);
        if ( moveIdx < data.puzzle.solution.length ){
            console.log("checking move")
            //lichess solution moves are in uci
            const correctMove = data.puzzle.solution[moveIdx];
            const lastPlayedMove = orig+dest;
            console.log("target",correctMove,"guess",lastPlayedMove);
            if ( lastPlayedMove == correctMove ){
                console.log("correct") 

                //if last move of solution, win! 
                //else, play next
                const nextMove = uciToMove(data.puzzle.solution[moveIdx+1]);
                if(!(nextMove == null) ){
                    console.log(moveIdx+1,data.puzzle.solution[moveIdx+1],data.puzzle.solution);
                    console.log(nextMove);
                    chess.move({from: nextMove[0], to: nextMove[1], promotion: nextMove[2]});
                    cg.move(nextMove[0],nextMove[1]);
                    console.log(chess.fen());
                    console.log(toColor(chess));
                    cg.set({
                      turnColor: toColor(chess),
                      movable: {
                        color: toColor(chess),
                        dests: toDests(chess)
                      }
                    });
                }else{
                    console.log("finished!")
                    cg.set({
                      selectable: {
                        enabled: false,
                      },
                      draggable: {
                        enabled: false,
                      },
                    });

                }
                moveIdx=moveIdx+2;

                
            }else {
                console.log("wrong move")
                //undo move on chess and cg?
                chess.undo();
                //cg.move(dest,orig);//
                
                //cg = Chessground(el, {
                //  fen: chess.fen(),
                //  turnColor: toColor(chess),
                //  orientation: toColor(chess),
                //  movable: {
                //    color: toColor(chess),
                //    free: false,
                //    dests: toDests(chess)
                //  }
                //});
                
                cg.set({
                  fen: chess.fen(),
                  turnColor: toColor(chess),
                  movable: {
                    color: toColor(chess),
                    dests: toDests(chess)
                  }
                });
            }
        }
        //check if last move is correct. first move after setup should be first soln move. compare last move to soln[move number - init move count]
        };
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
    return cg;

  }
};



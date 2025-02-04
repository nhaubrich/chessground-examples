import { Chess } from 'chess.js';
import { Chessground }  from 'chessground';
import { Unit } from './unit';
import {  toColor, toOppositeColor, toDests, san_to_uci} from '../util'
//import {  toDests,  playOtherSide, san_to_uci} from '../util'
//import { toColor, toDests,  playOtherSide, san_to_uci} from '../util'
import { uciToMove } from 'chessground/util';

/* Host puzzles gotten from lichess. increment elo on correct solution
 * Can't fetch puzzle by rating directly. Make database of puzzle IDs and ratings, categorize into bins, and select relevant IDs
 * */
export const puzzle: Unit = {
  name: 'Puzzle',
  run(el) {
    var chess = new Chess();
    //first fetch puzzle and play moves
    
    async function getPuzzleIdByRating(rating) {
      const tableResponse = await fetch("../../assets/puzzleIds.json");
      console.log(tableResponse); 
      const puzzleIdTable = await tableResponse.json();
      console.log(puzzleIdTable);

      const ratingBin = Math.max( Math.min( Math.round(rating/50)*50, 3000),400);
      const puzzleIds = puzzleIdTable["PuzzleId"][ratingBin];
      //const puzzleIds = puzzleIdTable[String(ratingBin)];
      
      const randomIdx = Math.floor(Math.random() * puzzleIds.length);
      return puzzleIds[randomIdx]
    }

    async function fetchData() {
      chess = new Chess();
      console.log(chess.fen())

      var response = await fetch('https://lichess.org/api/puzzle/next');
      if(true){ 
          const puzzleId = await getPuzzleIdByRating(600);
          console.log(puzzleId)
          response = await fetch('https://lichess.org/api/puzzle/'+puzzleId);
          console.log(response);
      }
      const data = await response.json();
      console.log(data.puzzle);
      var moveList = data.game.pgn.split(" ")
      
      for (var i=0; i < data.puzzle.initialPly; i++) {
        chess.move(moveList[i]);
      };
      return [chess,data];
    };
    async function displayPuzzle() {
        const [chess,data] = await fetchData();
        const fen = chess.fen()
        console.log(chess.fen());
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
        
        cg.set({
          movable: { events: { after: checkPuzzle(cg, chess,data, moveIdx) } }
        });
        return cg;
    }
    function checkPuzzle(cg,chess,data,moveIdx){
        return (orig, dest) => {
        console.log("checkPuzzle");
        console.log(orig,dest);
        
        console.log(chess.fen())
        let output = chess.move({from: orig, to: dest, promotion: 'q'});//unable to select promotion ??? consider https://github.com/hi-ogawa/chessground-promotion
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
                    displayPuzzle();
                }
                moveIdx=moveIdx+2;
            }else {
                console.log("wrong move")
                //undo move on chess and cg?
                chess.undo();
                
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



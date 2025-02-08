import { Chess } from 'chess.js';
import { Chessground }  from 'chessground';
import { Unit } from './unit';
import {  toColor, toOppositeColor, toDests, san_to_uci} from '../util'
//import {  toDests,  playOtherSide, san_to_uci} from '../util'
//import { toColor, toDests,  playOtherSide, san_to_uci} from '../util'
//import { uciToMove } from 'chessground/util';// doesn't handle promotion :(

/* Host puzzles gotten from lichess. increment elo on correct solution
 * todo:
 *  - refactor code to avoid recursion (potential memory leak?)
 * */
export const puzzle: Unit = {
  name: 'Puzzle',
  run(el) {
    var chess = new Chess();
    const cg = Chessground(el,{});

    async function getPuzzleIdByRating(rating) {
      const tableResponse = await fetch("../../assets/puzzleIds.json");
      //const tableResponse = await fetch("/puzzles/assets/puzzleIds.json");//For deployment!
      const puzzleIdTable = await tableResponse.json();

      const ratingBin = Math.max( Math.min( Math.round(rating/50)*50, 3000),400);
      const puzzleIds = puzzleIdTable["PuzzleId"][ratingBin];
      //const puzzleIds = puzzleIdTable[String(ratingBin)];
      
      const randomIdx = Math.floor(Math.random() * puzzleIds.length);
      return puzzleIds[randomIdx]
    }

    async function fetchPuzzleData(rating) {
      chess.reset()
       
      //TODO clean up this double fetch
      var response = await fetch('https://lichess.org/api/puzzle/next');
      const puzzleId = await getPuzzleIdByRating(rating);
      response = await fetch('https://lichess.org/api/puzzle/'+puzzleId);
      
      const data = await response.json();
      var moveList = data.game.pgn.split(" ")
      
      for (var i=0; i < data.puzzle.initialPly; i++) {
        chess.move(moveList[i]);
      };
      return [chess,data];
    };

    async function displayPuzzle(rating) {
        const element = document.getElementById("currentRating");
        if (element){
            element.textContent = "Current Rating: "+String(rating);
        }
        
        const [chess,data] = await fetchPuzzleData(rating);
        const fen = chess.fen();
        var moveIdx = 0;
        
        cg.set({
          fen: fen,
          turnColor: toColor(chess),
          orientation: toOppositeColor(chess),
          movable: {
          color: toColor(chess),
          free: false,
          dests: toDests(chess)
          },
        selectable: {
            enabled: true,
          },
          draggable: {
            enabled: true,
          },
          highlight: { lastMove: false},
        });
        //make initial move
        var moveList = data.game.pgn.split(" ");
        const firstMoveSan = moveList[data.puzzle.initialPly];
        const firstMoveUci = san_to_uci(chess,firstMoveSan);
        chess.move(firstMoveSan);

        await new Promise(r => setTimeout(r, 1500));
        cg.move(firstMoveUci[0],firstMoveUci[1]);
        cg.set({
          fen: chess.fen(),
          turnColor: toColor(chess),
          movable: {
            color: toColor(chess),
            dests: toDests(chess)
          },
        });
        
        var flawless = true; 
        cg.set({
          movable: { events: { after: checkPuzzle(cg, chess,data, moveIdx, rating,flawless) } }
        });

    }
    function checkPuzzle(cg,chess,data,moveIdx,rating,flawless){
        return (orig, dest) => {
        
        if ( moveIdx < data.puzzle.solution.length ){
            //lichess solution moves are in uci
            const correctMove = data.puzzle.solution[moveIdx];//Ignore promotion annotation
            const lastPlayedMove = orig+dest;
            if ( lastPlayedMove == correctMove.slice(0,4) ){
                //if there was a promotion, do it right
                if(correctMove.length < 5){
                    chess.move({from: orig, to: dest});

                }else{
                    chess.move({from: orig, to: dest, promotion: correctMove[4]});//unable to select promotion ??? consider https://github.com/hi-ogawa/chessground-promotion
                    cg.set({fen: chess.fen()});
                }

                const nextMoveUci = data.puzzle.solution[moveIdx+1];
                if(!(nextMoveUci == null) ){
                    if(nextMoveUci.length < 5){
                        chess.move({from: nextMoveUci.slice(0,2), to: nextMoveUci.slice(2,4)}); 
                        cg.move(nextMoveUci.slice(0,2),nextMoveUci.slice(2,4));

                    }else{
                        chess.move({from: nextMoveUci.slice(0,2), to: nextMoveUci.slice(2,4), promotion: nextMoveUci[4]}); //promotion ignored by chessground's uciToMove.  promotion: nextMove[2]
                        cg.set({fen: chess.fen()});
                    }
                    cg.set({
                      turnColor: toColor(chess),
                      movable: {
                        color: toColor(chess),
                        dests: toDests(chess)
                      }
                    });
                    
                    //refresh cg if fen mismatches (from en passant)

                    if(chess.fen().split(" ")[0] !== cg.getFen()){
                        cg.set({fen: chess.fen()});
                    }


                }else{//finish and reset!
                    cg.set({
                      selectable: {
                        enabled: false,
                      },
                      draggable: {
                        enabled: false,
                      },
                      lastMove: [],
                    });
                    if (flawless){
                        displayPuzzle(rating+30);
                    }else{
                        displayPuzzle(rating-30);
                    }
                }
                moveIdx=moveIdx+2;
            }else {
                flawless=false;
                //reset board 
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
    var startingRating=1500;
    displayPuzzle(startingRating);

    return cg;

  }
};



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
      //const tableResponse = await fetch("/puzzles/assets/puzzleIds.json");//For deployment!
      const puzzleIdTable = await tableResponse.json();

      const ratingBin = Math.max( Math.min( Math.round(rating/50)*50, 3000),400);
      const puzzleIds = puzzleIdTable["PuzzleId"][ratingBin];
      //const puzzleIds = puzzleIdTable[String(ratingBin)];
      
      const randomIdx = Math.floor(Math.random() * puzzleIds.length);
      return puzzleIds[randomIdx]
    }

    async function fetchPuzzleData(rating) {
      chess = new Chess();

      var response = await fetch('https://lichess.org/api/puzzle/next');
      if(true){ 
          const puzzleId = await getPuzzleIdByRating(rating);
          response = await fetch('https://lichess.org/api/puzzle/'+puzzleId);
      }
      const data = await response.json();
      var moveList = data.game.pgn.split(" ")
      
      for (var i=0; i < data.puzzle.initialPly; i++) {
        chess.move(moveList[i]);
      };
      return [chess,data];
    };
    async function displayPuzzle(rating) {
        console.log("puzzle rating",rating);
        
        const element = document.getElementById("currentRating");
        if (element){
            element.textContent = "Current Rating: "+String(rating);
        }
        
        const [chess,data] = await fetchPuzzleData(rating);
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
        var flawless = true; 
        cg.set({
          movable: { events: { after: checkPuzzle(cg, chess,data, moveIdx, rating,flawless) } }
        });
        return cg;
    }
    function checkPuzzle(cg,chess,data,moveIdx,rating,flawless){
        return (orig, dest) => {
        console.log("flawless",flawless );
        
        chess.move({from: orig, to: dest, promotion: 'q'});//unable to select promotion ??? consider https://github.com/hi-ogawa/chessground-promotion
        
        //console.log(moveIdx,data.puzzle.solution);
        if ( moveIdx < data.puzzle.solution.length ){
            //lichess solution moves are in uci
            const correctMove = data.puzzle.solution[moveIdx];
            const lastPlayedMove = orig+dest;
            //console.log("target",correctMove,"guess",lastPlayedMove);
            if ( lastPlayedMove == correctMove ){

                //if last move of solution, win! 
                //else, play next
                const nextMove = uciToMove(data.puzzle.solution[moveIdx+1]);
                if(!(nextMove == null) ){
                    chess.move({from: nextMove[0], to: nextMove[1], promotion: nextMove[2]});
                    cg.move(nextMove[0],nextMove[1]);
                    cg.set({
                      turnColor: toColor(chess),
                      movable: {
                        color: toColor(chess),
                        dests: toDests(chess)
                      }
                    });
                }else{
                    cg.set({
                      selectable: {
                        enabled: false,
                      },
                      draggable: {
                        enabled: false,
                      },
                    });
                    if (flawless){
                        displayPuzzle(rating+30);
                    }else{
                        displayPuzzle(rating-30);
                    }
                }
                moveIdx=moveIdx+2;
            }else {
                console.log("wrong move")
                flawless=false;
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
    var startingRating=1300;
    displayPuzzle(startingRating);

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



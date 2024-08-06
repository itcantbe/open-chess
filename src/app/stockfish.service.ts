import { Injectable, OnInit } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Chess } from 'chess.js'

@Injectable({
  providedIn: 'root'
})
export class StockfishService implements OnInit{

  stockfish : Worker;
  evaluator : Worker;

  private recommendation$ = new BehaviorSubject<any>(null);
  public _recommendation$ = this.recommendation$.asObservable();

  private evaluation$ = new BehaviorSubject<any>(null);
  public _evaluation$ = this.evaluation$.asObservable();
  
  private finalDepth ='';
  
  private currentGame : Chess;

  private history$ = new BehaviorSubject<any>(null);
  public _history$ = this.history$.asObservable();

  private historyIndex$ = new BehaviorSubject<number>(null);
  public _historyIndex$ = this.historyIndex$.asObservable();

  private computerMove = '';

  constructor() {
    if (typeof Worker === "function") {
      this.stockfish = new Worker('../../assets/stockfish.js'); 
      this.evaluator = new Worker('../../assets/stockfish.js'); 
    }
   }
  
  ngOnInit(): void {
    this.initalizeEngine();
    this.initalizeEval();
    this.useNeuralNetwork(true);
  }
  private initalizeEngine(){
    this.postCommand("uci");
    this.postCommand("ucinewgame");
    this.postCommand("isready");
    /* this.postCommand("setoption name UCI_ShowWDL value true") */
    this.postCommand(`setoption name Threads value ${window.navigator.hardwareConcurrency - 2}`)
    this.postCommand(`setoption name Hash value 800`)
    /* this.postCommand("setoption name Clear Hash") */
  }
  private initalizeEval(){
    this.postCommand("uci",true);
  }
  private useNeuralNetwork(onlyEval = false){
    if(onlyEval){
      this.postCommand("setoption name Use NNUE value true",true);
    }
    this.postCommand("setoption name Use NNUE value true");
    this.postCommand("setoption name EvalFile value nn-5af11540bbfe.nnue");
  }
  
  private postCommand(command,isEval = false){
    if(isEval){
      this.evaluator.postMessage(command);
    }
    else{
      this.stockfish.postMessage(command);
    }
  }
  public newGame(){
    this.postCommand("ucinewgame");
    this.postCommand("ucinewgame",true);
    this.currentGame = new Chess();
    this.history$.next(null)
    this.recommendation$.next(null)
    this.evaluation$.next(null)
  }
  public setEloValueEngine(value){
    this.postCommand(`setoption name UCI_Elo value ${value}`)
    this.postCommand('setoption name UCI_LimitStrength')
  }
  public getReccomendation(DEPTH,FEN_POSITION,move?,computerMode?,color?) {
    if(!this.stockfish){
      return
    }
    if(move===''){
      this.currentGame = new Chess();
    }
    if(move){
      if(computerMode){
        if(color === 0){
          if(this.computerMove){
            this.currentGame.move(this.computerMove)
            this.history$.next(this.currentGame?.history());  
          }
          this.currentGame.move(move)
        }
        else{
          this.currentGame.move(this.computerMove)
          this.history$.next(this.currentGame?.history());
          this.currentGame.move(move)
        }
      }
      else{
        this.currentGame.move(move)
      }
    } 
    this.history$.next(this.currentGame?.history());
    if(this.currentGame.isCheckmate() || this.currentGame.isDraw() || this.currentGame.isThreefoldRepetition()){
      return
    }
    this.postCommand(`position fen ${FEN_POSITION}`);
    this.postCommand(`go depth ${DEPTH}`);
    this.postCommand("isready");
    this.stockfish.onmessage = (e) => {
      if(e.data.startsWith(`info depth`)){
        this.finalDepth = e.data
      }
      if(e.data.startsWith('bestmove')){
        if(computerMode){
          let ind = e.data.indexOf(' ')
          this.computerMove = e.data.slice(ind+1,ind+5)
        }
        this.recommendation$.next(e.data)        
        this.getEvaluation(FEN_POSITION);
      }
    };
  }
  public getEvaluation(fen){
    if(!this.evaluator){
      return
    }
    let chess = new Chess(fen)
    let rec = this.recommendation$.getValue()?.match(/(bestmove) ([a-h][1-8])([a-h][1-8])([qrbn]?)/)
    
    let newPostion = chess.fen()
    if(chess.moves().includes(rec[3])){
      if(rec){
        chess.move({
          from:rec[2],
          to:rec[3],
          promotion:rec[4]
        },{ strict: true })
        newPostion = chess.fen()
      }
    }
    let checkmate = this.finalDepth.match(/(mate) ([0-9][0-9]?)/)
    if(checkmate !== null){
        this.evaluation$.next(`Mate in ${checkmate[2]}`)
        return
    }
    if(newPostion){
      this.postCommand(`position fen ${newPostion}`,true);
    }
    this.postCommand('eval',true);
    this.evaluator.onmessage = (e) => {
      if(e.data.startsWith('Final')){
        this.evaluation$.next(e.data)
      }
    };
  }
  public setHistoryIndex(index){
    this.historyIndex$.next(index)
  }
  public stopStockfish(){
    this.postCommand('stop')
    this.postCommand('stop',true)
  }
}

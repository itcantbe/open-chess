import { Injectable, OnInit } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Chess, validateFen } from 'chess.js'

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

  private historyIndex$ = new BehaviorSubject<any>(null);
  public _historyIndex$ = this.historyIndex$.asObservable();

  private loadedPGN$ = new BehaviorSubject<string>(null);
  public _loadedPGN$ = this.loadedPGN$.asObservable();

  public loadedPGNHeader;

  private loadedFEN$ = new BehaviorSubject<string>(null);
  public _loadedFEN$ = this.loadedFEN$.asObservable();

  private loadedPuzzle$ = new BehaviorSubject<string>(null);
  public _loadedPuzzle$ = this.loadedPuzzle$.asObservable();

  private userData$ = new BehaviorSubject<string>(null);
  public _userData$ = this.userData$.asObservable();

  private userRating = 0;
  private userDeviationRating = 0;
  private problemRating = 0;
  private problemDeviationRating = 0;
  private previousVariance = 0
  private previousRatingFactor = 0;
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
    this.loadedPGN$.next(null)
    this.historyIndex$.next(null)
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
      if(this.loadedFEN$.getValue()!==null){
        this.currentGame.load(this.loadedFEN$.getValue())
      }
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
    let chess = new Chess()
    chess.load(fen)
    let rec = this.recommendation$.getValue()?.match(/(bestmove) ([a-h][1-8])([a-h][1-8])([qrbn]?)/)
    
    let newPostion = ''
    let possibleMoves= chess.moves()
    if(possibleMoves.includes(rec[3])){
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
  public setPGNgame(game){
    this.newGame()
    this.currentGame.loadPgn(game)
    this.loadedPGNHeader = this.currentGame.header()
    this.history$.next(this.currentGame.history())
    this.loadedPGN$.next(game)
  }
  public quitEngine(){
    this.postCommand('quit')
    this.postCommand('quit', true)
  }
  public setFENstring(value){
    if(validateFen(value)){
      this.loadedFEN$.next(value)
    }
  }
  public setPuzleObject(value){
    this.currentGame.load(value.FEN)
    this.problemRating = value.Rating
    this.problemDeviationRating = value.RatingDeviation
    this.loadedPuzzle$.next(value)
  }
  public setUserDataObject(value){
    this.userRating = Number(value.playerPuzzleRating) || 0;
    this.userData$.next(value)
    document.cookie = JSON.stringify(value)
  }

  //Glicko Rating System
  private calculateRatingDeviationFunction(){
    return (1/Math.sqrt(1 + (3*(this.userDeviationRating**2 + this.problemDeviationRating**2)/(Math.PI**2))))
  }
  private calculateProbabityOfSolution(){
    return 1/(1+Math.exp((this.problemRating - this.userRating)*-(this.calculateRatingDeviationFunction())))
  }
  private calculateVariance(){
    let newVariance = 1/(this.calculateRatingDeviationFunction()**2)*this.calculateProbabityOfSolution()*(1-this.calculateProbabityOfSolution())
    let currentVariance = newVariance + this.previousVariance
    this.previousVariance = currentVariance
    return currentVariance
  }
  public updateSolverRating(val:number,problemCount){
    if(this.userRating === 0){
      this.userRating = 800
      this.userDeviationRating = 0
    }else{
      if(problemCount>10){
        this.userDeviationRating = 20
      }
      else{
        this.userDeviationRating +=2*problemCount
      }
    }
    let variance = this.calculateVariance()
    let deviationShrinkage = 0.5

    let varianceConstant = variance/variance+(deviationShrinkage**2)
    
    let newRatingFactor = (val-this.calculateProbabityOfSolution())*(this.problemRating*this.calculateRatingDeviationFunction())
    if(!(val === 1 && this.previousRatingFactor>0)){
      this.previousRatingFactor = 0
    }
    if(!(val === 0 && this.previousRatingFactor<0)){
      this.previousRatingFactor = 0
    }
    let currentFactor = newRatingFactor+this.previousRatingFactor
    this.previousRatingFactor = currentFactor

    return this.userRating + varianceConstant*currentFactor
  }
}

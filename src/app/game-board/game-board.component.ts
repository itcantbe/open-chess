import { CommonModule } from '@angular/common';
import { AfterViewChecked, AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { NgxChessBoardModule, NgxChessBoardView, PieceIconInput } from "ngx-chess-board";
import { ModalComponent } from '../modal/modal.component';
import { StockfishService } from '../stockfish.service';
import { BehaviorSubject, distinctUntilChanged, tap } from 'rxjs';
import { animate, style, transition, trigger } from '@angular/animations';


@Component({
  selector: 'app-game-board',
  standalone: true,
  imports: [ CommonModule, NgxChessBoardModule,ModalComponent],
  templateUrl: './game-board.component.html',
  styleUrl: './game-board.component.scss',
  animations : [
    trigger('onOff', [
      transition(':enter', [style({
        transform: 'rotateX(180deg)'
      }),
      animate(1000)
    ])
    ])
  ]
})
export class GameBoardComponent implements OnInit, AfterViewInit{

  @ViewChild('board', {static: false}) board!: NgxChessBoardView;
  @ViewChild('board', {static: false}) boardRef! : any;
  @ViewChild('container', {static: false}) container! : HTMLDivElement;

  public selectedMode = 0;

  public showResultModal = false;
  public isWhite = false;
  public isWin = false;

  public showNewGameModal = false;

  public DEPTH = 20; // number of halfmoves the engine looks ahead
  public FEN_POSITION = // chess position in FEN format
    "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
  
  public evalValue = '';
  public evalString = '';
  public recomendation = [];
  private currentTurn: number;

  private fenStringArray = [];
  private movePointer = 0;

  private disableWhite$ = new BehaviorSubject<boolean>(false);
  public _disableWhite$ = this.disableWhite$.asObservable();

  private disableBlack$ = new BehaviorSubject<boolean>(false);
  public _disableBlack$ = this.disableBlack$.asObservable();

  private userColor: number = null;
  public isReversed: boolean = false;

  public isPGNgame = false;
  public PGNgameHeader = {};

  public isPuzzles = false;
  private puzzleMoves = [];
  private currentPuzzleMoveCount = 0;
  private puzzleId = 0;
  public puzzleRating = 0;

  public userData = {};

  public amimationValue = 'rotateX(0deg)';
  public reverseAmimationValue = 'rotateX(180deg)'
  public showResultPuzzle = false;

  public correct = false;
  constructor(
    private stockFishService:StockfishService
  ){

  }
  public setting = {}

  private chessPieceIcons : PieceIconInput = {
    whiteKingUrl: "../../assets/icons/Chess_klt45.svg",
    whiteQueenUrl: "../../assets/icons/Chess_qlt45.svg",
    whiteKnightUrl: "../../assets/icons/Chess_nlt45.svg",
    whiteRookUrl: "../../assets/icons/Chess_rlt45.svg",
    whitePawnUrl: "../../assets/icons/Chess_plt45.svg",
    whiteBishopUrl: "../../assets/icons/Chess_blt45.svg",
    
    blackKingUrl: "../../assets/icons/Chess_kdt45.svg",
    blackQueenUrl: "../../assets/icons/Chess_qdt45.svg",
    blackKnightUrl: "../../assets/icons/Chess_ndt45.svg",
    blackRookUrl: "../../assets/icons/Chess_rdt45.svg",
    blackPawnUrl: "../../assets/icons/Chess_pdt45.svg",
    blackBishopUrl: "../../assets/icons/Chess_bdt45.svg"
  }

  ngOnInit(): void {
    this.setting = {
      size: '',
      lightTileColor:'#EDFBC1',
      darkTileColor:'#6B8F71',
      showCoords:false,
      /* sourcePointColor:'', */
      destinationPointColor:'#00241B',
      showLastMove:false,
      showLegalMoves:true,
      dragDisabled:false,
      drawDisabled:false,
      /* lightDisabled:this.disableWhite,
      darkDisabled:this.disableBlack, */
      pieceIcons:this.chessPieceIcons,
      freeMode:false,
      showActivePiece:true,
      showPossibleCaptures:true,
    }
    this.stockFishService._recommendation$.pipe(
      distinctUntilChanged(),
      tap((value)=>{
        if(value){
          this.board.clearArrows();
          let ind = value.indexOf(' ')
          this.recomendation = [value.slice(ind+1,ind+3),value.slice(ind+3,ind+5)]
          if(this.userColor === null){
            this.board.drawArrowFromCoords(this.recomendation[0],this.recomendation[1],this.boardRef.boardRef.nativeElement.getBoundingClientRect().left,this.boardRef.boardRef.nativeElement.getBoundingClientRect().top)
          }
          else{
            this.board.move(this.recomendation[0]+this.recomendation[1]);
          }
        }
      })
     ).subscribe();
     this.stockFishService._evaluation$.pipe(
      distinctUntilChanged(),
      tap((value)=>{
        this.evalValue = value?.match(/[\+ | \-][0-9].[0-9][0-9]/)
        if(this.evalValue === null || this.evalValue === undefined){
          if(value?.startsWith('Mate')){
            this.evalValue = value;
          }
          else{
            this.evalValue = '+0.00'
          }
        }
        else{
          this.evalValue = this.evalValue[0];
        }
      })
     ).subscribe();
     this.stockFishService._historyIndex$.pipe(
      distinctUntilChanged(),
      tap((value)=>{
        if(this.fenStringArray.length>0){
          this.movePointer = this.fenStringArray.length - value;
          this.disableWhite$.next(true);
          this.disableBlack$.next(true);
          this.nextMove();
        }
      })
     ).subscribe()

     this.stockFishService._loadedPGN$.pipe(
      distinctUntilChanged(),
      tap((value)=>{
        if(value){
          this.PGNgameHeader =this.stockFishService.loadedPGNHeader
          this.board.reset();
          this.fenStringArray = []
          this.isPGNgame = true;
          this.board.setPGN(value);
          /* this.movePointer = this.fenStringArray.length
          this.nextMove(); */
        }
      })
     ).subscribe();

     this.stockFishService._loadedFEN$.pipe(
      distinctUntilChanged(),
      tap((value)=>{
        if(value){
          this.board.reset();
          this.board.setFEN(value);
          this.board.move('a7b8q')
          this.stockFishService.getReccomendation(this.DEPTH,value,'')
        }
      })
     ).subscribe();

     this.stockFishService._loadedPuzzle$.pipe(
      distinctUntilChanged(),
      tap((value)=>{
        if(value){
          this.board.reset();
          this.board.clearArrows();
          this.fenStringArray = []
          this.isPuzzles = true;
          this.board.setFEN(value['FEN']);
          let moveArr = value['Moves'].split(" ")
          this.fenStringArray.unshift(value['FEN'])
          this.puzzleMoves = moveArr;
          this.puzzleId = value['ID'];
          this.currentPuzzleMoveCount = 0;
          this.puzzleRating = value['Rating']
          setTimeout(() => {
            this.handlePuzzleMoves()
          }, 1000);
        }
      })
     ).subscribe();

     this.stockFishService._userData$.pipe(
      distinctUntilChanged(),
      tap((value)=>{
        this.userData = value;
      })
     ).subscribe();
  }
  ngAfterViewInit(): void {
   setTimeout(() => {
     this.setting['size'] = this.calculateScreenSize();
     this.stockFishService.getReccomendation(this.DEPTH,this.FEN_POSITION,'');
     this.fenStringArray.unshift(this.FEN_POSITION)
   }, 0);
  }

  private calculateScreenSize(){
    return (this.container['nativeElement'].offsetHeight > this.container['nativeElement'].offsetWidth) ? this.container['nativeElement'].offsetWidth * 0.8 : this.container['nativeElement'].offsetHeight * 0.8
  }

  public reset() {
    this.board.reset();
    this.showResultModal = false;
    this.isWhite = false;
    this.isWin = false;
    this.DEPTH = 18; // number of halfmoves the engine looks ahead
    this.FEN_POSITION = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
    this.evalValue = '+0.00';
    this.evalString = '';
    this.recomendation = [];
    this.currentTurn = 0;
    this.fenStringArray = []
    this.movePointer = 0
    this.stockFishService.newGame();
    this.showNewGameModal =false;
    this.showResultModal = false;
    this.isPGNgame = false;
    this.board.clearArrows();
    this.stockFishService.stopStockfish();
  }
  public logEvent(event){
    if(!this.isPuzzles){
      if(event.checkmate && !this.isPGNgame){
        this.showResultModal = true;
        if(event.color === 'white') {
          this.isWhite =true
        }
        else{
          this.isWhite = false;
        }
        this.isWin = true
      }
      else if(event.stalemate && !this.isPGNgame){
        this.showResultModal = true;
        this.isWin = false;
      }
      this.FEN_POSITION = event.fen
      if(event.color === 'white') {
        this.currentTurn = 1;
      }
      else{
        this.currentTurn = 0;
      }
      this.board.clearArrows();
      this.fenStringArray.unshift(this.FEN_POSITION)
      if(!this.isPGNgame && !this.isPuzzles){
        if(this.selectedMode === 0){
          this.stockFishService.getReccomendation(this.DEPTH,this.FEN_POSITION, event.move);  
        }
        else{
          if(this.userColor !== this.currentTurn){
            this.stockFishService.getReccomendation(this.DEPTH,this.FEN_POSITION, event.move,true,this.userColor);  
          }
        }
      }
    }
    else{
      this.fenStringArray.unshift(event.fen)
      if(this.currentPuzzleMoveCount%2==1){
        this.handlePuzzleMoves(event.move)
      }
    }
  }
  public changeMode(mode){
    this.selectedMode = mode;
    if(mode === 1){
      this.showNewGameModal = true
    }
    else{
      this.reset()
      this.isReversed = false
    }
  }
  public evalPointerPosition(){
    if(this.evalValue?.startsWith('Mate')){
      if(this.isReversed){
        if(this.currentTurn === 0){
          return '-49%'
        }
        else{
          return '49%'
        }
      }
      else{
        if(this.currentTurn === 0){
          return '49%'
        }
        else{
          return '-49%'
        }
      }
    }
    if(this.isReversed){
      return -(Number(this.evalValue))+'%'
    }
    return this.evalValue + '%'
  }
  public previousMove(){
    this.movePointer++
    if(this.movePointer!==0){
      this.disableWhite$.next(true)
      this.disableBlack$.next(true)
    }
    if(this.movePointer<this.fenStringArray.length){
      this.board.setFEN(this.fenStringArray[this.movePointer])
      this.board.clearArrows()
    }
    else{
      this.movePointer = this.movePointer-1
    }
  }
  public nextMove(){
    this.movePointer--
    if(this.movePointer>=0){
      this.board.setFEN(this.fenStringArray[this.movePointer])
      this.board.clearArrows();
    }
    else{
      this.movePointer = this.movePointer+1
    }
    if(this.movePointer === 0){
      this.disableWhite$.next(false)
      this.disableBlack$.next(false)
    }
  }
  startNewCompGame(val:Array<number>){
    this.reset();
    this.stockFishService.newGame();
    let [color,difficulty] = val;
    if(color === 0){
      this.userColor = 0;
      this.disableBlack$.next(true);
    }
    else if(color === 1){
      this.userColor = 1;
      this.isReversed = true;
      this.board.reverse();
      this.disableWhite$.next(true);
      this.stockFishService.getReccomendation(this.DEPTH,this.FEN_POSITION, '',true);  
    }
    else{
      this.startNewCompGame([Math.round(Math.random()),difficulty]);
      return;
    }
    if(difficulty === 0){
      this.stockFishService.setEloValueEngine(800)
    }
    else if(difficulty === 1){
      this.stockFishService.setEloValueEngine(1600)
    }
    else{
      this.stockFishService.setEloValueEngine(2400)
    }
  }
  switchToSingle(){
    this.showNewGameModal = false;
    this.selectedMode = 0;
  }
  private handlePuzzleMoves(move?){
    if(this.currentPuzzleMoveCount === this.puzzleMoves.length){
      console.log('Nice')
      this.currentPuzzleMoveCount = 0;
      if(!this.userData['playerPuzzleIncorrect']?.includes(this.puzzleId) && !this.userData['playerPuzzleIncorrect'].includes(this.puzzleId)){
        this.userData['playerPuzzleCorrect'].push(this.puzzleId)
        this.userData['playerPuzzleRating'] = this.stockFishService.updateSolverRating(1,this.userData['playerPuzzleCorrect'].length+this.userData['playerPuzzleIncorrect'].length).toFixed(0)
        this.correct = true
      }
      else{
        this.correct = false
        this.userData['playerPuzzleRating'] = this.stockFishService.updateSolverRating(0,this.userData['playerPuzzleCorrect'].length+this.userData['playerPuzzleIncorrect'].length).toFixed(0)
      }
      this.triggerAnimation()
      setTimeout(() => {
        this.stockFishService.setUserDataObject(this.userData)
      }, 1000);
      return
    }
    else{
      if(this.currentPuzzleMoveCount%2 === 0){
        this.board.move(this.puzzleMoves[this.currentPuzzleMoveCount])
        this.currentPuzzleMoveCount++;
      }
      else{
        if(this.puzzleMoves[this.currentPuzzleMoveCount] === move){
          this.currentPuzzleMoveCount++;
          setTimeout(() => {
            this.handlePuzzleMoves()
          }, 1000);
        }
        else{
          if(!this.userData['playerPuzzleIncorrect'].includes(this.puzzleId)){
            this.userData['playerPuzzleIncorrect'].push(this.puzzleId)
          }
          console.log("Incorrect Move")
          this.userData['playerPuzzleRating'] = this.stockFishService.updateSolverRating(1,this.userData['playerPuzzleCorrect'].length+this.userData['playerPuzzleIncorrect'].length).toFixed(0)
          setTimeout(() => {
            this.board.undo();
          }, 1000);
        }
      }
    }
  }
  triggerAnimation(){
    this.showResultPuzzle = true
    setTimeout(() => {
      this.showResultPuzzle = false
    }, 2000);
  }
}

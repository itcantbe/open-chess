import { CommonModule } from '@angular/common';
import { AfterViewChecked, AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { NgxChessBoardModule, NgxChessBoardView, PieceIconInput } from "ngx-chess-board";
import { ModalComponent } from '../modal/modal.component';
import { StockfishService } from '../stockfish.service';
import { distinctUntilChanged, tap } from 'rxjs';


@Component({
  selector: 'app-game-board',
  standalone: true,
  imports: [ CommonModule, NgxChessBoardModule,ModalComponent],
  templateUrl: './game-board.component.html',
  styleUrl: './game-board.component.scss'
})
export class GameBoardComponent implements OnInit, AfterViewInit{

  @ViewChild('board', {static: false}) board!: NgxChessBoardView;
  @ViewChild('board', {static: false}) boardRef! : any;
  @ViewChild('container', {static: false}) container! : HTMLDivElement;

  public selectedMode = 0;

  public showModal = false;
  public isWhite = false;
  public isWin = false;

  public DEPTH = 18; // number of halfmoves the engine looks ahead
  public FEN_POSITION = // chess position in FEN format
    "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
  
  public evalValue = '';
  public evalString = '';
  public recomendation = '';
  private currentTurn: number;
  constructor(
    private stockFishService:StockfishService
  ){

  }
  setting = {}

  chessPieceIcons : PieceIconInput = {
    whiteKingUrl: "../../assets/icons/Chess_klt45.svg.png",
    whiteQueenUrl: "../../assets/icons/Chess_qlt45.svg.png",
    whiteKnightUrl: "../../assets/icons/Chess_nlt45.svg.png",
    whiteRookUrl: "../../assets/icons/Chess_rlt45.svg.png",
    whitePawnUrl: "../../assets/icons/Chess_plt45.svg.png",
    whiteBishopUrl: "../../assets/icons/Chess_blt45.svg.png",
    
    blackKingUrl: "../../assets/icons/Chess_kdt45.svg.png",
    blackQueenUrl: "../../assets/icons/Chess_qdt45.svg.png",
    blackKnightUrl: "../../assets/icons/Chess_ndt45.svg.png",
    blackRookUrl: "../../assets/icons/Chess_rdt45.svg.png",
    blackPawnUrl: "../../assets/icons/Chess_pdt45.svg.png",
    blackBishopUrl: "../../assets/icons/Chess_bdt45.svg.png"
  }

  ngOnInit(): void {
    this.setting = {
      size: '',
      lightTileColor:'#EDFBC1',
      darkTileColor:'#6B8F71',
      showCoords:false,
      /* sourcePointColor:'', */
      destinationPointColor:'#00241B',
      showLastMove:true,
      showLegalMoves:true,
      dragDisabled:false,
      drawDisabled:false,
      lightDisabled:false,
      darkDisabled:false,
      pieceIcons:this.chessPieceIcons,
      freeMode:false,
      showActivePiece:true,
      showPossibleCaptures:true,
    }
    this.stockFishService._recommendation$.pipe(
      distinctUntilChanged(),
      tap((value)=>{
        if(value){
          this.recomendation = value.match(/(bestmove) ([a-g][1-8])([a-g][1-8])?/);
          this.board.drawArrowFromCoords(this.recomendation[2],this.recomendation[3],this.boardRef.boardRef.nativeElement.getBoundingClientRect().left,this.boardRef.boardRef.nativeElement.getBoundingClientRect().top)
          console.log(this.recomendation)
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
  }
  ngAfterViewInit(): void {
   setTimeout(() => {
     this.setting['size'] = this.calculateScreenSize();
     this.stockFishService.getReccomendation(this.DEPTH,this.FEN_POSITION);
   }, 0);
  }

  private calculateScreenSize(){
    return (this.container['nativeElement'].offsetHeight > this.container['nativeElement'].offsetWidth) ? this.container['nativeElement'].offsetWidth * 0.8 : this.container['nativeElement'].offsetHeight * 0.8
  }

  public reset() {
    this.board.reset();
    this.showModal = false;
    this.isWhite = false;
    this.isWin = false;
    this.DEPTH = 18; // number of halfmoves the engine looks ahead
    this.FEN_POSITION = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
    this.evalValue = '+0.00';
    this.evalString = '';
    this.recomendation = '';
    this.currentTurn = 0;
    this.stockFishService.newGame();
    this.stockFishService.getReccomendation(this.DEPTH,this.FEN_POSITION)
  }
  public logEvent(event){
    if(event.checkmate){
      this.showModal = true;
      if(event.color === 'white') {
        this.isWhite =true
      }
      else{
        this.isWhite = false;
      }
      this.isWin = true
    }
    else if(event.stalemate){
      this.showModal = true;
      this.isWin = false;
    }
    this.FEN_POSITION = event.fen
    if(event.color === 'white') {
      this.currentTurn = 1;
    }
    else{
      this.currentTurn = 0;
    }
    this.stockFishService.getReccomendation(this.DEPTH,this.FEN_POSITION, event.move);
  }
  public changeMode(mode){
    this.selectedMode = mode;
  }
  public evalPointerPosition(){
    if(this.evalValue?.startsWith('Mate')){
      if(this.currentTurn === 0){
        return '49%'
      }
      else{
        return '-49%'
      }
    }
    return this.evalValue + '%'
  }
}

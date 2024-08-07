import { AfterViewInit, Component, Input, Output, EventEmitter, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal.component.html',
  styleUrl: './modal.component.scss'
})
export class ModalComponent implements AfterViewInit{
  
  @Input() showResultModal = false;
  @Input() isWhite : boolean = null;
  @Input() isWin : boolean = null;
  
  @Output() gameOver : EventEmitter<boolean>= new EventEmitter();
  @Output() switchToSingle : EventEmitter<boolean>= new EventEmitter();
  
  @Input() showNewGameModal = false;
  @Output() newGame : EventEmitter<Array<number>>= new EventEmitter();

  @Input() showGameListModal = false;
  @Input() gameList = []
  @Output() gameScreenClosed : EventEmitter<boolean> = new EventEmitter();
  @Output() gameSelected : EventEmitter<number> = new EventEmitter();
  public selectedColor : number = null
  public selectedDifficulty : number = null

  public resultString =''

  public processedGameList = [];
  @ViewChild('container', {static:false}) container!: HTMLDivElement;

  
  ngAfterViewInit(): void {
    
    setTimeout(() => {
      this.processedGameList = this.gameList;
      let color :string = null
      let result = ''

      if(this.isWhite){
        color = 'White'
      }
      else if (!this.isWhite){
        color = 'Black'
      }
      if(this.isWin){
        result = 'Won!'
      }
      else if(!this.isWin){
        result = 'Draw!'
      }
      if(color === null){
        this.resultString = result
      }
      else{
        this.resultString = color + ' ' + result
      }
    }, 0);
  }
  
  public gameEnd(){
    this.showResultModal = false;
    this.gameOver.emit(true)
  }
  public cancelNewGame(){
    this.showNewGameModal = false;
    this.switchToSingle.emit(true)
  }
  public startNewGame(){
    this.showNewGameModal = false;
    this.newGame.emit([this.selectedColor,this.selectedDifficulty])
  }
  public closeGameScreen(){
    this.showGameListModal = false;

    this.gameScreenClosed.emit(true)
  }
  public selectedGame(value){
    this.showGameListModal = false;
    this.gameSelected.emit(this.gameList.indexOf(value))
  }
  public filterData(input,column){
    let filtrVal = input.target.value
    console.log(filtrVal)
    if(filtrVal === ''){
      this.processedGameList = this.gameList
    }
    else{
      this.processedGameList = this.processedGameList.filter((value)=>{
        if(value[column].toLowerCase().match(filtrVal)){
          return value
        }
      })
    }
  }
}

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
  public selectedColor : number = null
  public selectedDifficulty : number = null

  @Output() newGame : EventEmitter<Array<number>>= new EventEmitter();

  public resultString =''
  
  @ViewChild('container', {static:false}) container!: HTMLDivElement;
  
  ngAfterViewInit(): void {

    setTimeout(() => {
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
}

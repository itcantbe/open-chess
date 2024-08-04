import { AfterViewInit, Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal.component.html',
  styleUrl: './modal.component.scss'
})
export class ModalComponent implements AfterViewInit{
  
  @Input() showModal = false;
  @Input() isWhite : boolean = null;
  @Input() isWin : boolean = null;

  @Output() gameOver : EventEmitter<boolean>= new EventEmitter();

  public resultString =''

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
    this.showModal = false;
    this.gameOver.emit(true)
  }
}

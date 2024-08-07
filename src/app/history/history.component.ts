interface historyEntry {
    white : '',
    black : ''
}

import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { StockfishService } from '../stockfish.service';
import { distinctUntilChanged, tap } from 'rxjs';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './history.component.html',
  styleUrl: './history.component.scss'
})
export class HistoryComponent implements OnInit{

  constructor(private stockFishService:StockfishService){}

  
  public history : Array<historyEntry> = [];
  
  public fullHistory = []
  @Input() public showHistory = false;

  @Output() showHistoryEvent:EventEmitter<boolean> = new EventEmitter()

  ngOnInit(): void {
    this.stockFishService._history$.pipe(
      distinctUntilChanged(),
      tap((value)=>{
        if(value?.length>1 && this.history.length === 0){
          for(let i = 0; i<value.length;i++){
            if(i%2 === 0){
              this.history.push({white:value[i],black:''})
            }
            else{
              this.history[this.history.length-1].black = value[i]
            }
          }
        }
        else{
          if(value?.length > 0){
            if(value?.length % 2 === 1){
              this.history.push({white:value.pop(),black:''})
            }
            else{
              this.history[this.history.length-1].black = value.pop()
            }
            this.fullHistory = value
          }
          else{
            this.history =[]
          }
        }
        
      })
    ).subscribe() 
    
  }
  toggleHistory(){
    this.showHistory = !this.showHistory
    this.showHistoryEvent.emit(false)
  }
  public goToMove(index){
    this.stockFishService.setHistoryIndex(index)
  }
}

interface historyEntry {
    white : '',
    black : ''
}

import { Component, OnInit } from '@angular/core';
import { StockfishService } from '../stockfish.service';
import { distinctUntilChanged, tap } from 'rxjs';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [],
  templateUrl: './history.component.html',
  styleUrl: './history.component.scss'
})
export class HistoryComponent implements OnInit{

  constructor(private stockFishService:StockfishService){}

  
  public history : Array<historyEntry> = [];

  ngOnInit(): void {
    this.stockFishService._history$.pipe(
      distinctUntilChanged(),
      tap((value)=>{
        if(value?.length > 0){
          if(value?.length % 2 === 1){
            this.history.push({white:value.pop(),black:''})
          }
          else{
            this.history[this.history.length-1].black = value.pop()
          }
        }
        else{
          this.history =[]
        }
        console.log(this.history)
      })
    ).subscribe()  
  }

}

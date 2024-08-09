import { AfterViewInit, Component, ViewChild } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './sidebar/sidebar.component';
import { GameBoardComponent } from './game-board/game-board.component';
import { CommonModule } from '@angular/common';
import { HistoryComponent } from './history/history.component';
import { DisplayComponent } from './display/display.component';
import { HttpService } from './http-service.service';
import { tap } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, GameBoardComponent, CommonModule,HistoryComponent,DisplayComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements AfterViewInit{
  title = 'open-chess';
  public showDisplayBoard = false

  @ViewChild('displayComp',{static:false}) displayComp:DisplayComponent;

  constructor(){

  }
  ngAfterViewInit(): void {
  }
  public selectedMenuItem(event){
    if(event === 0){
      this.showDisplayBoard = true;
      this.displayComp.puzzleMode = false;
      this.displayComp.importMode = true;
    }
    if(event === 1){
      this.showDisplayBoard = true;
      this.displayComp.puzzleMode = true;
      this.displayComp.importMode = false;
      this.displayComp.getAllPuzzleData()
    }
  }
  displayBoardClosed(){
    this.showDisplayBoard = false;
  }
  
}

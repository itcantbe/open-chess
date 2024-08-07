import { AfterViewInit, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './sidebar/sidebar.component';
import { GameBoardComponent } from './game-board/game-board.component';
import { CommonModule } from '@angular/common';
import { HistoryComponent } from './history/history.component';
import { DisplayComponent } from './display/display.component';

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

  ngAfterViewInit(): void {
  }
  public selectedMenuItem(event){
    if(event === 0){
      this.showDisplayBoard = true;
    }
  }
  displayBoardClosed(){
    this.showDisplayBoard = false;
  }
}

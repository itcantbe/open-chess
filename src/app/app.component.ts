import { AfterViewInit, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './sidebar/sidebar.component';
import { GameBoardComponent } from './game-board/game-board.component';
import { CommonModule } from '@angular/common';
import { HistoryComponent } from './history/history.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, GameBoardComponent, CommonModule,HistoryComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements AfterViewInit{
  title = 'open-chess';
  /* showHistorySection = false; */
  ngAfterViewInit(): void {
    /* setTimeout(() => {
      this.showHistorySection = true 
    }, 0); */
  }
}

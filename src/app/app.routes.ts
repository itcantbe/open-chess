import { Routes } from '@angular/router';
import { GameBoardComponent } from './game-board/game-board.component';

export const routes: Routes = [
    {path:'', redirectTo:'game-board',pathMatch:'full'},
    {path:'game-board', component:GameBoardComponent}
];

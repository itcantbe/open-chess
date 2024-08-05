import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
  @Input() public toggleSidebarMenu = false;
  public menuItem =[
    'Import Game  '
    , 'Puzzles  '
    , 'Analyze Game  '
    , 'Board Configuration  '
    , 'Engine Configuration ' 
    , 'Select Engine  '
    , 'Engine VS Engine  '
    , 'Import Li Chess Game'  
    , 'Chess Books'
  ]
}

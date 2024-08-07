import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
  @Input() public toggleSidebarMenu = false;
  @Output() selectedIndex = new EventEmitter()
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
  openOption(index){
    this.selectedIndex.emit(index)
    this.toggleSidebarMenu = !this.toggleSidebarMenu;
  }
}

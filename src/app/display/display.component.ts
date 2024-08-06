import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { IndexedDbService } from '../indexed-db.service';

@Component({
  selector: 'app-display',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './display.component.html',
  styleUrl: './display.component.scss'
})
export class DisplayComponent {
  

  public showDisplayBoard: boolean = true;
  public pgnRaw;
  public processData = '';
  public gameArray :Array<string> =[];
  public processedData = [];
  public fileName = '';

  constructor(private indexdbService:IndexedDbService){
  }

  public closeDisplayBoard(){
    this.showDisplayBoard = false;
  }
  public async fileUploadEvent(event){
    //event.target.files[0]
    this.fileName = event.target.files[0].name
    let reader = new FileReader();
    reader.readAsArrayBuffer(event.target.files[0])
    reader.onload = (event) => {
      this.pgnRaw = event.target.result;
      const view = new Uint8Array(this.pgnRaw);
      let chunkSize = 293
      for (let offset = 0; offset < view.length; offset += chunkSize) {
        // Create a subarray for the current chunk
        const chunk = view.slice(offset, offset + chunkSize);
        
        // Process the chunk
        this.processChunk(chunk);
      }
      this.gameArray.unshift(this.processData)
      this.processData = ''
      this.processPngGames()
    }
  }
  public async processChunk(chunk){
    let decoder = new TextDecoder
    this.processData += decoder.decode(chunk)
    let sampleArr = this.processData.split(/(?=\r\n\r\n\[)/g)
    if(sampleArr.length>1){
      while(sampleArr.length>1){
        this.gameArray.unshift(sampleArr.shift())
      }
      this.processData = sampleArr[0]
    }
  }

  public async processPngGames(){
    for(let i of this.gameArray){
      let data = i.slice(i.indexOf('[')).split('\r\n')
      let processedDataEntry = {}
      let moves = data.slice(data.indexOf(""))
      let attributes = data.slice(0,data.indexOf(""))
      for(let i of attributes){
        let final = i.slice(1).split('\"')
        processedDataEntry[final[0].trim()] = final[1]
      }
      processedDataEntry['Moves'] = moves.join('').trim()
      processedDataEntry['Id'] = this.gameArray.indexOf(i)
      this.processedData.push(processedDataEntry)
    }
    this.indexdbService.setGameInDB(this.processedData)
    /* this.indexdbService.addGamesToIndexDB(this.processedData[0]) */
    /* this.processedData.forEach((value)=>{
    }) */
  }

  public loadSelectedGame(Id){
    
  }
}

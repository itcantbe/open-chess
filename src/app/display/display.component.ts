import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, output } from '@angular/core';
import { IndexedDbService } from '../indexed-db.service';
import { StockfishService } from '../stockfish.service';
import { BehaviorSubject, distinct, distinctUntilChanged, tap } from 'rxjs';
import { ModalComponent } from '../modal/modal.component';

@Component({
  selector: 'app-display',
  standalone: true,
  imports: [CommonModule,ModalComponent],
  templateUrl: './display.component.html',
  styleUrl: './display.component.scss'
})
export class DisplayComponent {
  

  @Input() public showDisplayBoard: boolean = false;

  @Output() public displayBoardClosed = new EventEmitter()
  public pgnRaw;
  public processData = '';
  public gameArray :Array<string> =[];
  public newAddGameArray :Array<string> =[];
  public processedData = [];
  public fileName = '';
  public previousGameOnly = false;
  public showGameListModal = false;

  constructor(private indexdbService:IndexedDbService,private stockfishService:StockfishService){
  }

  public closeDisplayBoard(){
    this.showDisplayBoard = false;
    this.displayBoardClosed.emit()
  }
  public async fileUploadEvent(event){
    //event.target.files[0]
    console.log('here')
    this.newAddGameArray = []
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
      this.newAddGameArray.unshift(this.processData)
      this.newAddGameArray.forEach((value)=>{
        this.gameArray.push(value)
      })
      this.processData = ''
      this.previousGameOnly = false
      this.processPngGames()
    }
  }
  public async processChunk(chunk){
    let decoder = new TextDecoder
    this.processData += decoder.decode(chunk)
    let sampleArr = this.processData.split(/(?=\r\n\r\n\[)/g)
    if(sampleArr.length>1){
      while(sampleArr.length>1){
        this.newAddGameArray.unshift(sampleArr.shift())
      }
      this.processData = sampleArr[0]
    }
  }

  public async processPngGames(){
    for(let i of this.newAddGameArray){
      let data = i.slice(i.indexOf('[')).split('\r\n')
      let processedDataEntry = {}
      let moves = data.slice(data.indexOf(""))
      let attributes = data.slice(0,data.indexOf(""))
      for(let i of attributes){
        let final = i.slice(1).split('\"')
        processedDataEntry[final[0].trim()] = final[1]
      }
      processedDataEntry['Moves'] = moves.join(' ').trim()
      //change to dynamic headers
      processedDataEntry['Id'] = this.lzwEncode(processedDataEntry['Event']+processedDataEntry['Date']+processedDataEntry['Round']+'white'+processedDataEntry['White']+'black'+processedDataEntry['Black'] +processedDataEntry['Result']+processedDataEntry['ECO']+processedDataEntry['Moves'].length)
      this.processedData.push(processedDataEntry)
    }
    this.indexdbService.setGameInDB(this.processedData)
    /* this.indexdbService.addGamesToIndexDB(this.processedData[0]) */
    /* this.processedData.forEach((value)=>{
    }) */
  }

  public loadSelectedGame(index){
    console.log(index)
    let PGNstring = this.gameArray.at(index)
    this.stockfishService.setPGNgame(PGNstring.slice(PGNstring.indexOf('[')))
  }
  private lzwEncode(input) {
    const dictionary = {};
    let code = 256;
  
    for (let i = 0; i < 256; i++) {
      dictionary[String.fromCharCode(i)] = i;
    }
  
    let w = "";
    const result = [];
  
    for (let i = 0; i < input.length; i++) {
      const c = input[i];
      const wc = w + c;
      if (dictionary.hasOwnProperty(wc)) {
        w = wc;
      } else {
        result.push(dictionary[w]);
        dictionary[wc] = code;
        code++;
        w = c;
      }
    }
  
    if (w !== "") {
      result.push(dictionary[w]);
    }
  
    return result.join('.');
  }
  
  private lzwDecode(encodedSTR) {
    let encoded = encodedSTR.split('.')
    const dictionary = {};
    for (let i = 0; i < 256; i++) {
      dictionary[i] = String.fromCharCode(i);
    }
  
    let code = 256;
    let old = encoded[0];
    let result = dictionary[old];
    let entry = "";
  
    for (let i = 1; i < encoded.length; i++) {
      let c = encoded[i];
      if (dictionary.hasOwnProperty(c)) {
        entry = dictionary[c];
      } else {
        entry = dictionary[old] + dictionary[old][0];
      }
  
      result += entry;
      dictionary[code] = dictionary[old] + entry[0];
      code++;
      old = c;
    }
  
    return result;
  }

  public getALLPreviousGames(){
    if(this.fileName === ''){
      this.previousGameOnly = true
    }
    this.indexdbService.getDataFromDB();
    this.indexdbService._oldGameData$.pipe(
      distinctUntilChanged(),
      tap((value)=>{
        if(value){
          this.processedData = value;
          this.convertDataToPGN();
          console.log(value[0])
        }
      })
    ).subscribe();
  }

  private convertDataToPGN(){
    for(let i of this.processedData){
      let game = '';
      if(i['Event'] !== null || i['Event'] === undefined){
        game+=`[Event \"${i['Event']}\"]\r\n`
      }
      if(i['Site'] !== null || i['Site'] === undefined){
        game+=`[Site \"${i['Site']}\"]\r\n`
      }
      if(i['Date'] !== null || i['Date'] === undefined){
        game+=`[Date \"${i['Date']}\"]\r\n`
      }
      if(i['Round'] !== null || i['Round'] === undefined){
        game+=`[Round \"${i['Round']}\"]\r\n`
      }
      if(i['White'] !== null || i['White'] === undefined){
        game+=`[White \"${i['White']}\"]\r\n`
      }
      if(i['Black'] !== null || i['Black'] === undefined){
        game+=`[Black \"${i['Black']}\"]\r\n`
      }
      if(i['Result'] !== null || i['Result'] === undefined){
        game+=`[Result \"${i['Result']}\"]\r\n`
      }
      if(i['WhiteElo'] !== null || i['WhiteElo'] === undefined){
        game+=`[WhiteElo \"${i['WhiteElo']}\"]\r\n`
      }
      if(i['BlackElo'] !== null || i['BlackElo'] === undefined){
        game+=`[BlackElo \"${i['BlackElo']}\"]\r\n`
      }
      if(i['ECO'] !== null || i['ECO'] === undefined){
        game+=`[ECO \"${i['ECO']}\"]\r\n`
      }
      game+=`\n`
      game+=i['Moves']
      this.gameArray.push(game)
    }
  }
  public openFullListPopup(){
    this.showGameListModal = true;
  }
  public closedPopup(evt){
    this.showGameListModal = false;
  }
  public loadFENstring(value){
    this.stockfishService.setFENstring(value.target.value)
    
  }
}

import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class IndexedDbService {
  private readonly DB_NAME = 'open-chess-game-pgndata';
  private readonly DB_VERSION = 1; // Use a long long for this value (don't use a float)
  private readonly objectStore = 'pgnGames'
  public db = null;

  private moves = []

  public compReq = false
  constructor() {
   }
  public async setGameInDB(moves){
    this.moves = moves
    this.openIndexDB()
  }
  private openIndexDB(){
    console.log("Starting");
    let req = window.indexedDB.open(this.DB_NAME, this.DB_VERSION);
    req.onsuccess = (evt)=> {
      this.db = req.result;
    };
    req.onerror = (evt) => {
      console.error("openDb: Error", evt.target);
    };
    req.onupgradeneeded = (event) => {
      const db = event.target['result'];
      
      db.onerror = (event) => {
          console.log("Error loading database.",event)
      };
      // Create an objectStore for this database
      const objectStore = db.createObjectStore(this.objectStore, {
        keyPath: "Id",
      });
    
      // define what data items the objectStore will contain
    
      objectStore.createIndex("Event", "Event", { unique: false });
      objectStore.createIndex("Site", "Site", { unique: false });
      objectStore.createIndex("Date", "Date", { unique: false });
      objectStore.createIndex("Round", "Round", { unique: false });
      objectStore.createIndex("White", "White", { unique: false });
      objectStore.createIndex("Black", "Black", { unique: false });
      objectStore.createIndex("Result", "Result", { unique: false });
      objectStore.createIndex("WhiteElo", "WhiteElo", { unique: false });
      objectStore.createIndex("BlackElo", "BlackElo", { unique: false });
      objectStore.createIndex("ECO", "ECO", { unique: false });
      objectStore.createIndex("Moves", "Moves", { unique: false });

      this.addGamesToIndexDB(event.target['transaction'])
      /* db.deleteObjectStore("store1"); */
    };
  } 
  public addGamesToIndexDB(trxn){
    
    let _objectStore = trxn.objectStore(this.objectStore,"readwrite")
    for(let i of this.moves){
      let addToObjectStore = _objectStore.add(i)
      addToObjectStore.onsuccess = function (evt) {
        this.compReq = true
        console.log("Insertion in DB successful");
        return 
      };
      addToObjectStore.onerror = function() {
        console.error("addPublication error", this.error);
        return
      };
    }
  }

  //Code to get old data
  /* public clearObjectStore(){
    var store = this.getObjectStore(this.objectStore, 'readwrite');
    var req = store.clear();
    req.onsuccess = function(evt) {
      console.log('Sucess: ',evt)

    };
    req.onerror = function (evt) {
      console.error("clearObjectStore:", evt.target.errorCode);
      console.log('Error: ',event)   
    };
  }
  public async getGamesFromIndexDB(obj){
    if(this.db === null){
      this.openIndexDB();
    }
    let objectStore = this.getObjectStore(this.objectStore,"readwrite")
    let getFromObjectStore = objectStore.get(obj)

    getFromObjectStore.onsuccess = function (evt) {
      console.log("Fetching from DB successful");
      return 
    };
    getFromObjectStore.onerror = function() {
      console.error("get error", this.error);
      return
    };
  } */
}

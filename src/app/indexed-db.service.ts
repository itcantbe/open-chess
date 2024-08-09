import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class IndexedDbService {
  private DB_NAME = 'open-chess-game-pgndata';
  private DB_VERSION = 1; // Use a long long for this value (don't use a float)
  private objectStore = 'pgnGames'

  private readonly PUZZLE_DB_NAME = 'open-chess-game-puzzleData';
  private readonly PUZZLE_DB_VERSION = 1; // Use a long long for this value (don't use a float)
  private readonly puzzleobjectStore = 'puzzles'
  public db = null;

  private previousCall;
  private insertData = false;
  private getData = false;

  private moves = []

  private oldGameData$ = new BehaviorSubject<any>(null);
  public _oldGameData$ = this.oldGameData$.asObservable();

  private requestComplete$ = new BehaviorSubject<boolean>(null);
  public _requestComplete$ = this.requestComplete$.asObservable();

  private noGamesLoaded: boolean = false;
  constructor() {
  }
  public async setPuzzlesinDB(moves){
    this.moves = moves
    this.insertData = true
    this.getData = false
    this.requestComplete$.next(null)
    this.openPuzzleIndexDB()
  }
  public async getPuzzlesFromDB(){
    this.getData = true
    this.insertData = false
    this.openPuzzleIndexDB()
  }
  public async setGameInDB(moves){
    this.moves = moves
    this.insertData = true
    this.getData = false
    this.openIndexDB()
  }
  public async getDataFromDB(){
    this.getData = true
    this.insertData = false
    this.openIndexDB()
  }
  private openIndexDB(){
    console.log("Starting");
    let req = window.indexedDB.open(this.DB_NAME, this.DB_VERSION);
    req.onsuccess = (evt)=> {
      console.log("DB Loaded")
      this.db = req.result;
      if(this.getData && !this.noGamesLoaded){
        this.getALLDataInDB();
      }
      if(this.insertData){
        this.putGamesToIndexDB()
      }
    };
    req.onerror = (evt) => {
      console.error("openDb: Error", evt.target);
    };
    req.onupgradeneeded = (event) => {
      const db = event.target['result'];
      
      db.onerror = (event) => {
        console.log("Error loading database.",event)
      };
      if(!this.getData){
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
      }
      else{
        this.noGamesLoaded = true
        window.indexedDB.deleteDatabase(this.DB_NAME);
        console.log('No Data')
      }
    };
  } 
  public addGamesToIndexDB(trxn){
    this.insertData = false
    let _objectStore = trxn.objectStore(this.objectStore,"readwrite")
    for(let i of this.moves){
      this.previousCall = _objectStore.add(i)
    }
    this.previousCall.onsuccess = () => {
      this.moves = []
      this.insertData = false;
      console.log("Insertion in DB successful");
    };
    this.previousCall.onerror = (evt) => {
      console.error("addPublication error", evt);
    };
  }
  public putGamesToIndexDB(){
    let _objectStore = this.db.transaction(this.objectStore,"readwrite").objectStore(this.objectStore,"readwrite")
    for(let i of this.moves){
      this.previousCall = _objectStore.put(i)
    }
    this.previousCall.onsuccess = () => {
      this.moves = []
      this.insertData = false;
      console.log("Insertion in DB successful");
    };
    this.previousCall.onerror = (evt) => {
      console.error("addPublication error", evt);
    };
  }
  //Code to get old data
  private getALLDataInDB(){
    let request = this.db.transaction(this.objectStore).objectStore(this.objectStore).getAll();
    request.onsuccess = ()=> {
      const games = request.result;

      console.log('Got all the games');
      this.oldGameData$.next(games)
      this.db.close()
    }
  }

  /* Puzzle Section */
  private openPuzzleIndexDB(){
    console.log("Starting Puzzle DB");
    let req = window.indexedDB.open(this.PUZZLE_DB_NAME, this.PUZZLE_DB_VERSION);
    req.onsuccess = (evt)=> {
      console.log("DB Loaded")
      this.db = req.result;
      if(this.getData && !this.noGamesLoaded){
        this.getALLPuzzleDataInDB();
      }
      if(this.insertData){
        this.putPuzzleToIndexDB();
      }
    };
    req.onerror = (evt) => {
      console.error("openDb: Error", evt.target);
    };
    req.onupgradeneeded = (event) => {
      console.log('here')
      const db = event.target['result'];
      
      db.onerror = (event) => {
        console.log("Error loading database.",event)
      };
      if(!this.getData){
        // Create an objectStore for this database
        const objectStore = db.createObjectStore(this.puzzleobjectStore, {
          keyPath: "ID"
        });
        
        // define what data items the objectStore will contain  ,autoIncrement: true
        objectStore.createIndex("FEN", "FEN", { unique: false });
        objectStore.createIndex("Moves", "Moves", { unique: false });
        objectStore.createIndex("Rating", "Rating", { unique: false });
        objectStore.createIndex("RatingDeviation", "RatingDeviation", { unique: false });
  
        this.addPuzzleToIndexDB()
        /* db.deleteObjectStore("store1"); */
      }
      else{
        this.noGamesLoaded = false;
        db.close();
        let req = window.indexedDB.deleteDatabase(this.PUZZLE_DB_NAME)

        req.onsuccess =()=>{
          this.requestComplete$.next(false)
        }
        console.log('No Data')
        return
      }
    };
  } 
  private addPuzzleToIndexDB(){
    if(this.db){
      let _objectStore = this.db?.transaction(this.puzzleobjectStore,"readwrite").objectStore(this.puzzleobjectStore,"readwrite")
      for(let i of this.moves){
        this.previousCall = _objectStore.add(i)
      }
      this.previousCall.onsuccess = () => {
        this.moves = []
        this.insertData = false;
        this.requestComplete$.next(true)
        console.log("Insertion in DB successful");
      };
      this.previousCall.onerror = (evt) => {
        console.error("addPublication error", evt);
      };
    }
    
  }
  private getALLPuzzleDataInDB(){
    let request = this.db.transaction(this.puzzleobjectStore).objectStore(this.puzzleobjectStore).getAll();
    request.onsuccess = ()=> {
      const puzzles = request.result;

      console.log('Got all the puzzles');
      this.oldGameData$.next(puzzles)
      this.db.close()
    }
  }
  private putPuzzleToIndexDB(){
    let _objectStore = this.db.transaction(this.puzzleobjectStore,"readwrite").objectStore(this.puzzleobjectStore,"readwrite")
    for(let i of this.moves){
      this.previousCall = _objectStore.put(i)
    }
    this.previousCall.onsuccess = () => {
      this.moves = []
      this.insertData = false;
      this.requestComplete$.next(true)
      console.log("Insertion in DB successful");
    };
    this.previousCall.onerror = (evt) => {
      console.error("addPublication error", evt);
    };
  }

}

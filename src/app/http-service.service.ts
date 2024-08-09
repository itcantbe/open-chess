import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class HttpService {
  private lichessPuzzleDB = '../assets/PUZZLES_93+_RATINGS_DEVIATION.csv';
  /* private lichessPuzzleDB = '../assets/sample.csv'; */
  constructor(private httpService: HttpClient) { }

  public getAllPuzzles(){
    return this.httpService.get(this.lichessPuzzleDB,{responseType:'arraybuffer'})
  }
}

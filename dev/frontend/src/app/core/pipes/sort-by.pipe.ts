/*
 *ngFor="let c of oneDimArray | sortBy:'asc'"
 *ngFor="let c of arrayOfObjects | sortBy:'asc':'propertyName'"

 credit: https://medium.com/@Mdmoin07/sort-pipe-in-angular-6-7-f22475cc4054
*/
import { Pipe, PipeTransform } from '@angular/core';
import { orderBy } from 'lodash';

@Pipe({ name: 'sortBy' })
export class SortByPipe implements PipeTransform {

  transform(value: any[], order = '', column: string = ''): any[] {
    if (!value || order === '' || !order) { return value; } // no array
    if (value.length <= 1) { return value; } // array with only one item
    if (!column || column === '') { 
      if(order==='asc'){return value.sort()}
      else{return value.sort().reverse();}
    } // sort 1d array
    if(column.indexOf('.') > -1){
      let p = column.split('.')
      return orderBy(value, (e) => e[p[0]][p[1]], [order]);
    }
    return orderBy(value, [column], [order]);
  }
}
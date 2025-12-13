import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filterBy'
})
export class FilterByPipe implements PipeTransform {

  transform(items, key: string, value: any) {
    return items.filter(item => item['key'] == value);
  }

}
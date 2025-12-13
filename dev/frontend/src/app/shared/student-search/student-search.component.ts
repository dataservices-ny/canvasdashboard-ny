import { Component, OnInit, Input } from '@angular/core';
import { StudentSearchService } from 'src/app/core/services/student-search.service';
import { Student } from 'src/app/core/models/user';
import { Observable } from 'rxjs';
import { debounceTime, distinctUntilChanged, map } from 'rxjs/operators';
import { Router } from '@angular/router';

@Component({
  selector: 'app-student-search',
  templateUrl: './student-search.component.html',
  styleUrls: ['./student-search.component.scss']
})
export class StudentSearchComponent implements OnInit {
  
  public student: Student;
  @Input() size: string = 'form-control-sm'

  constructor(
    public studentSearchService: StudentSearchService,
    private router: Router
  ) { }

  ngOnInit(): void {}

  search = (text$: Observable<string>) =>
    text$.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      map(term => term.length < 2 ? []
        : Object.values(this.studentSearchService.students).filter(s => s.name.toLowerCase().indexOf(term.toLowerCase()) > -1).slice(0, 10))
    )

    formatter(student: Student): string {
      return student.name
    }

    student_selected($event, input): void {
      $event.preventDefault();
      const student_id = $event.item.id;
      input.value = '';
      this.router.navigate(['/dashboard/student', student_id]);
    }

}

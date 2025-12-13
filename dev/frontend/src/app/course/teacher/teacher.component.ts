import { Component, OnDestroy, OnInit } from '@angular/core';
import { DataService } from 'src/app/core/services/data.service';
import { ActivatedRoute, Router } from '@angular/router';
import { take, skipWhile, tap } from 'rxjs/operators';
import { Course } from 'src/app/core/models/course';
import { Observable, Subscription } from 'rxjs';
import { SectionService } from 'src/app/core/services/section.service';

@Component({
  selector: 'app-teacher',
  templateUrl: './teacher.component.html',
  styleUrls: ['./teacher.component.scss']
})
export class TeacherComponent implements OnInit, OnDestroy {

  subscriptions: Subscription;
  course$: Observable<Course>;
  current_section: string;

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    public dataService: DataService,
    public sectionService: SectionService
  ) { }

  ngOnInit(): void {
    this.subscriptions = new Subscription();
    this.subscriptions.add(this.route.params.subscribe(p => {
      const course_id = p['course_id'];
      this.course$ = this.dataService.getCourse(course_id, null, true);
      this.course$
        .pipe(
          skipWhile(c => typeof(c) == 'undefined' || c == null), 
          take(1)
        )
        .subscribe(course => {
          const sorted_sections = Object.values(course.sections).sort((a, b) => {
            if(a.section_name > b.section_name) return 1;
            if(a.section_name < b.section_name) return -1;
            return 0
          });
          this.sectionService.set(sorted_sections[0].section_id);
        });
    }));

    this.subscriptions.add(this.sectionService.current_section.subscribe(s => this.current_section = s));

  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

}

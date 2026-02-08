import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { Subscription } from 'rxjs';
import { skipWhile, take } from 'rxjs/operators';
import { DataService } from 'src/app/core/services/data.service';
import { CourseService } from '../../course.service';
import { Outcomes } from 'src/app/core/models/outcomes';
import { Assignments } from 'src/app/core/models/assignments';
import { Submissions } from 'src/app/core/models/submissions';

@Component({
  selector: 'app-grade-estimator',
  templateUrl: './grade-estimator.component.html',
  styleUrls: ['./grade-estimator.component.scss']
})
export class GradeEstimatorComponent implements OnInit, OnDestroy {

  @Output() closePanel = new EventEmitter<void>();

  subscriptions: Subscription;
  course_id: string;
  student_id: string;
  outcomes: Outcomes = {};
  selectedGrades: { [outcomeId: string]: string } = {};
  lateIncompleteCount: number;
  semesterAssignmentCount: number;
  tardyCount: number;

  constructor(
    private dataService: DataService,
    private courseService: CourseService
  ) { }

  ngOnInit(): void {
    this.subscriptions = new Subscription();

    this.subscriptions.add(this.courseService.course_student_ids$.subscribe(course_student_ids => {
      if (!course_student_ids) {
        return;
      }

      this.student_id = course_student_ids.student_id;
      this.course_id = course_student_ids.course_id;
      const studentKey = this.student_id != null ? String(this.student_id) : null;

      this.dataService.getSubmissions(this.student_id, this.course_id);
      this.dataService.getAssignments(this.course_id, this.student_id);

      this.dataService.getCourse(this.course_id, this.student_id, false)
        .pipe(
          skipWhile(course => {
            if (typeof course == 'undefined' || course == null) return true;
            if (!('outcomes' in course)) return true;
            if (!studentKey || !(studentKey in course.outcomes)) return true;
            if (!course.assignments) return true;
            if (!course.submissions || !(studentKey in course.submissions)) return true;
          }),
          take(1)
        )
        .subscribe(course => {
          this.outcomes = course.outcomes[studentKey] || {};
          this.lateIncompleteCount = this.countLateIncomplete(course.assignments, course.submissions);
          this.semesterAssignmentCount = this.countSemesterAssignments(course.assignments, course.submissions);
        });
    }));
  }

  close(): void {
    this.closePanel.emit();
  }

  gradeClass(value: string): string {
    switch (value) {
      case 'A':
        return 'grade-estimator-select-a';
      case 'P':
        return 'grade-estimator-select-p';
      case 'D':
        return 'grade-estimator-select-d';
      case 'NY':
        return 'grade-estimator-select-ny';
      case 'NA':
        return 'grade-estimator-select-na';
      default:
        return '';
    }
  }

  private countLateIncomplete(assignments: Assignments, submissions: Submissions): number {
    const studentKey = this.student_id != null ? String(this.student_id) : null;
    if (!assignments || !submissions || !studentKey || !(studentKey in submissions)) {
      return 0;
    }

    const semesterRange = this.getSemesterRangeForSubmissions(submissions[studentKey]);
    let count = 0;

    Object.values(submissions[studentKey]).forEach(submission => {
      const assignment = assignments[submission._id];
      if (!assignment || !assignment.users.includes(this.student_id)) {
        return;
      }

      const dueAt = new Date(submission.dueAt);
      if (Number.isNaN(dueAt.getTime())) {
        return;
      }

      if (dueAt >= semesterRange.start && dueAt <= semesterRange.end) {
        if (submission.late || submission.missing || submission.complete === false) {
          count += 1;
        }
      }
    });

    return count;
  }

  private countSemesterAssignments(assignments: Assignments, submissions: Submissions): number {
    const studentKey = this.student_id != null ? String(this.student_id) : null;
    console.log('Counting semester assignments for student_id:', studentKey);
    console.log('Assignments:', assignments);
    console.log('Submissions:', submissions);
    console.log('Submission student keys:', Object.keys(submissions || {}));
    console.log('Student submissions:', submissions[studentKey]);

    if (!assignments || !submissions || !studentKey || !(studentKey in submissions)) {
      return 0;
    }

    const semesterRange = this.getSemesterRangeForSubmissions(submissions[studentKey]);
    let count = 0;

    Object.values(submissions[studentKey]).forEach(submission => {
      const assignment = assignments[submission._id];
      if (!assignment || !assignment.users.includes(this.student_id)) {
        return;
      }

      const dueAt = new Date(submission.dueAt);
      if (Number.isNaN(dueAt.getTime())) {
        return;
      }

      if (dueAt >= semesterRange.start && dueAt <= semesterRange.end) {
        count += 1;
      }
    });

    return count;
  }

  lateIncompletePercent(): number {
    if (!this.semesterAssignmentCount) {
      return 0;
    }
    return Math.round((this.lateIncompleteCount / this.semesterAssignmentCount) * 100);
  }

  lateIncompleteMessage(): string {
    const percent = this.lateIncompletePercent();
    if (percent >= 20) {
      return 'This lowers your grade one step.';
    }
    if (percent >= 10) {
      return "This won't affect your grade, but it is a little concerning.";
    }
    return 'Good job getting your assignments done on time.';
  }

  tardyMessage(): string {
    if (this.tardyCount == null || Number.isNaN(this.tardyCount)) {
      return '';
    }
    if (this.tardyCount == 0) {
      return 'Great job being on time for class.';
    }
    if (this.tardyCount <= 3) {
      return 'Good job being on time for class.';
    }
    if (this.tardyCount <= 5) {
      return 'You need to work on getting to class on time.';
    }
    return 'You have too many tardies, this lowers your grade a step.';
  }

  estimatedLetterGrade(): string {
    const counts = this.gradeCounts();
    const ny = counts.NY;
    const d = counts.D;
    const p = counts.P;
    const a = counts.A;
    const total = ny + d + p + a;
    if (total === 0) {
      return '';
    }

    const eff = (1.35 * a + p) / total;
    const fracA = a / total;
    const fracNY = ny / total;

    let grade = '';
    if (ny > 0) {
      if (fracNY >= 0.75) grade = 'F';
      else if (fracNY >= 0.5) grade = 'D';
      else grade = 'C-';
    } else if (d === 0) {
      if (fracA >= 2 / 3) grade = 'A';
      else if (fracA >= 0.5) grade = 'A-';
      else grade = 'B+';
    } else {
      if (fracA >= 2 / 3) grade = 'B+';
      else if (eff >= 0.7) grade = 'B';
      else if (eff >= 0.45) grade = 'B-';
      else if (eff >= 0.2) grade = 'C+';
      else grade = 'C';
    }

    let penaltySteps = 0;
    if (this.lateIncompletePercent() >= 20) {
      penaltySteps += 1;
    }
    if (this.tardyCount != null && this.tardyCount >= 6) {
      penaltySteps += 1;
    }

    return this.applyGradePenalty(grade, penaltySteps);
  }

  private applyGradePenalty(grade: string, steps: number): string {
    if (!grade || steps <= 0) {
      return grade;
    }

    const scale = ['A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D', 'D-', 'F'];
    const startIndex = scale.indexOf(grade);
    if (startIndex === -1) {
      return grade;
    }

    const nextIndex = Math.min(startIndex + steps, scale.length - 1);
    return scale[nextIndex];
  }

  private gradeCounts(): { [key: string]: number } {
    const counts = { NY: 0, D: 0, P: 0, A: 0 };
    Object.values(this.selectedGrades).forEach(value => {
      if (value in counts) {
        counts[value] += 1;
      }
    });
    return counts;
  }

  setTardyCount(value: string): void {
    const parsed = value === '' || value == null ? null : Number(value);
    this.tardyCount = Number.isFinite(parsed) ? parsed : null;
  }

  private getSemesterRangeForSubmissions(studentSubmissions: any): { start: Date; end: Date } {
    const referenceDate = this.getLatestDueAt(studentSubmissions) || new Date();
    const year = referenceDate.getFullYear();
    const month = referenceDate.getMonth();

    if (month >= 8) {
      return {
        start: new Date(year, 8, 1, 0, 0, 0, 0),
        end: new Date(year, 11, 31, 23, 59, 59, 999)
      };
    }

    return {
      start: new Date(year, 0, 1, 0, 0, 0, 0),
      end: new Date(year, 5, 30, 23, 59, 59, 999)
    };
  }

  private getLatestDueAt(studentSubmissions: any): Date | null {
    if (!studentSubmissions) {
      return null;
    }

    let latest: Date = null;
    Object.values(studentSubmissions).forEach((submission: any) => {
      const dueAt = new Date(submission.dueAt);
      if (Number.isNaN(dueAt.getTime())) {
        return;
      }
      if (!latest || dueAt > latest) {
        latest = dueAt;
      }
    });

    return latest;
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}

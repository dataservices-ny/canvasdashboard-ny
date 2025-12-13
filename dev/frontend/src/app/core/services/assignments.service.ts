import { Injectable } from '@angular/core';
import { Assignment } from '../models/assignments';
import { Submission } from '../models/submissions';

@Injectable({
  providedIn: 'root'
})
export class AssignmentsService {

  constructor() { }
  
  collapse(assignment: Assignment): void {
    assignment.isCollapsed = !assignment.isCollapsed; 
    if(assignment.isCollapsed){
      assignment.descriptionIsCollapsed = true;
    }
  }

  letter_number(assignment: Assignment, submission: Submission): string {
    if( assignment.gradingType == 'pass_fail' || submission.grade == null ){
      return null;
    } 
    else if(assignment.gradingType == 'percent' || assignment.gradingType == 'letter_grade' || assignment.gradingType == 'gpa_scale') {
      return submission.grade.toString();
    }
    else if(assignment.gradingType == 'points') {
      if(submission.grade.toString().indexOf('/') < 0){
        return submission.grade.toString() + '/' + assignment.pointsPossible;
      }
      else{
        return submission.grade.toString();
      }
      
    }
    else{
      return null;
    }
  }

  complete_incomplete(submission: Submission): boolean {
    if( submission.grade == 'complete' || 
        submission.grade == 'incomplete') return true
    else return false
  }

  no_grade(submission: Submission): boolean {
    if( submission.grade == null ) return true
    else return false
  }

  comments_exist(submission: Submission): boolean {
    if('comments' in submission){
      if(submission.comments.length > 0) return true
    }
    return false
  }
  
}
import { InMemoryDbService, STATUS, RequestInfo, ResponseOptions, getStatusText  } from 'angular-in-memory-web-api';
import { Injectable } from '@angular/core';

import { sample_teacher, sample_student, sample_parent } from '../sample_data/sample_user'
import { sample_outcomes } from '../sample_data/sample_outcomes'
import { sample_assignments } from '../sample_data/sample_assignments';
import { sample_course } from '../sample_data/sample_course';
import { sample_terms } from '../sample_data/sample_terms';
import { sample_students } from '../sample_data/sample_students';
import { sample_get_student } from '../sample_data/sample_student';
import { sample_submissions } from '../sample_data/sample_submissions';
import { sample_activities } from '../sample_data/sample_activities';

@Injectable({
  providedIn: 'root',
})
export class InMemoryDataService implements InMemoryDbService {
  
  // Intercepts the default get request for the in memory data service
  // Based on code from https://github.com/angular/in-memory-web-api/blob/master/src/app/hero-in-mem-data-override.service.ts
  get(reqInfo: RequestInfo) {
    console.log("intercepting http.get ", reqInfo.collectionName)
    let sample_user = sample_teacher;
    if(reqInfo.collectionName == 'user'){
      return reqInfo.utils.createResponse$(() => {
        return this.formatResponse(sample_user, reqInfo)
      });
    }
    if(reqInfo.collectionName == 'terms'){
      return reqInfo.utils.createResponse$(() => {
        return this.formatResponse(sample_terms, reqInfo)
      });
    }
    if(reqInfo.collectionName == 'get_students'){
      return reqInfo.utils.createResponse$(() => {
        return this.formatResponse(sample_students, reqInfo)
      });
    }
    if(reqInfo.collectionName == 'student'){
      return reqInfo.utils.createResponse$(() => {
        return this.formatResponse(sample_get_student, reqInfo)
      });
    }
    if(reqInfo.collectionName == 'outcomes'){
      return reqInfo.utils.createResponse$(() => {
        return this.formatResponse(sample_outcomes, reqInfo)
      });
    }
    if(reqInfo.collectionName == 'assignments'){
      return reqInfo.utils.createResponse$(() => {
        return this.formatResponse(sample_assignments, reqInfo)
      });
    }
    if(reqInfo.collectionName == 'submissions'){
      return reqInfo.utils.createResponse$(() => {
        return this.formatResponse(sample_submissions, reqInfo)
      });
    }
    if(reqInfo.collectionName == 'activities'){
      return reqInfo.utils.createResponse$(() => {
        return this.formatResponse(sample_activities, reqInfo)
      });
    }
    if(reqInfo.collectionName == 'course'){
      return reqInfo.utils.createResponse$(() => {
        return this.formatResponse(sample_course, reqInfo)
      });
    }
  }

  formatResponse(body: any, reqInfo: RequestInfo){
    return {
      body: body,
      status: STATUS.OK,
      statusText: 'OK',
      url: reqInfo.url,
      headers: reqInfo.headers
    }
  }

  createDb() {
    return {}
  }
}

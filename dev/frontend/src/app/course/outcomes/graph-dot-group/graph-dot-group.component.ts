import { Component, OnInit, Input, NgZone } from '@angular/core';
import { Dot } from 'src/app/core/models/dot';
import { Assessment } from 'src/app/core/models/outcomes';
import { RubricService } from 'src/app/core/services/rubric.service';
import { AssignmentModalService } from 'src/app/shared/assignment-modal/assignment-modal.service';

@Component({
  selector: 'app-graph-dot-group',
  templateUrl: './graph-dot-group.component.html',
  styleUrls: ['./graph-dot-group.component.scss']
})
export class GraphDotGroupComponent implements OnInit {

  @Input() position_x: number;
  @Input() assessments: Assessment[];
  @Input() student_id: string;
  @Input() course_id: string;
  dots: Dot[] = []
  group_extents: { [K: string]: number } = { top: 0, right: 0, bottom: 0, left: 0 } 
  first_dot_size: number = 24;

  constructor(
    private zone: NgZone,
    public rubricService: RubricService,
    public assignmentModalService: AssignmentModalService
  ) { }

  ngOnInit(): void {
    let mq = matchMedia('(max-width: 500px)')
    this.mq_handler(mq)
    matchMedia('(max-width: 500px)').addListener((mq => this.mq_handler(mq)));
    
  }

  mq_handler(mql): void{
    if (mql.matches) {
        this.zone.run(() => {
            this.first_dot_size = 20;
            this.dots = [];
            this.draw_dots();
        });
    }
    else {
      this.zone.run(() => {
        this.first_dot_size = 24;
        this.dots = [];
        this.draw_dots();
      });
    }
  }

  draw_dots(){
    const dot_separation: number = this.first_dot_size/12;
    this.assessments.forEach((assessment, i) => {
      if(assessment.points != null){
        let dot = {
          size: this.dot_size(this.first_dot_size, assessment.index),
          opacity: this.dot_opacity(assessment.index),
          tooltip: {
            points: assessment.points,
            name: assessment.name,
            date: assessment.dueAt
          },
          angle: null,
          center_x: 0,
          center_y: 0,
          left: -this.first_dot_size/2,
          top: -this.first_dot_size/2,
          offset_radius: 0,
          assessment: assessment
        }
        if(i == 0){
          this.first_dot_size = dot.size;
        }
        else{
          dot.offset_radius = this.first_dot_size/2 + dot.size/2 + dot_separation;
          if(i == 1){
            dot.angle = -Math.PI
          }
          else{
            let a = this.dots[i-1].offset_radius;
            let b = dot.offset_radius;
            let c = dot.size/2 + this.dots[i-1].size/2 + dot_separation;
            let angle_c = Math.acos((a**2 + b**2 - c**2) / (2*a*b))
            dot.angle = this.dots[i-1].angle + angle_c;
          }
          dot.center_x = dot.offset_radius * Math.cos(dot.angle)
          dot.center_y = -dot.offset_radius * Math.sin(dot.angle)
        }
        dot.left = dot.center_x - dot.size/2;
        dot.top = dot.center_y - dot.size/2;
        this.new_extents(dot)
        this.dots.push(dot)
      }
    })
    this.center_group()
  }

  dot_size(first_dot_size, n): number {
    return (first_dot_size * 4) / (n + 4)
  }

  dot_opacity(n): number {
    return 4 / (n + 4)
  }

  new_extents(dot): void {
    if( this.group_extents.top > dot.top ) this.group_extents.top = dot.top;
    if( this.group_extents.right < dot.left + dot.size ) this.group_extents.right = dot.left + dot.size;
    if( this.group_extents.bottom <  dot.top + dot.size ) this.group_extents.bottom = dot.top + dot.size;
    if( this.group_extents.left > dot.left ) this.group_extents.left = dot.left;
  }

  center_group(): void {
    const offset_x = ( this.group_extents.left + this.group_extents.right ) / 2;
    const offset_y = ( this.group_extents.top + this.group_extents.bottom ) / 2;
    const half_group_width = 0;//( this.group_extents.right - this.group_extents.left ) / 2 ;
    const half_group_height = 0;//( this.group_extents.bottom - this.group_extents.top ) / 2;
    this.dots.forEach(dot => {
      dot.left = dot.left - offset_x - half_group_width;
      dot.top = dot.top - offset_y - half_group_height;
    })
    this.group_extents = {
      top: this.group_extents.top - offset_y - half_group_height,
      right: this.group_extents.right - offset_x - half_group_width,
      bottom: this.group_extents.bottom - offset_y - half_group_height,
      left: this.group_extents.left - offset_x - half_group_width,
    }
  }
}

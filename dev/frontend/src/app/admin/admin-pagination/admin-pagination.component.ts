import { Component, Input, OnInit } from '@angular/core';
import { AdminService } from '../admin.service';

@Component({
  selector: 'app-admin-pagination',
  templateUrl: './admin-pagination.component.html',
  styleUrls: ['./admin-pagination.component.scss']
})
export class AdminPaginationComponent implements OnInit {

  @Input() page: number;
  @Input() pages: number[];
  
  constructor(
    public adminService: AdminService
  ) { }

  ngOnInit(): void {
  }

}

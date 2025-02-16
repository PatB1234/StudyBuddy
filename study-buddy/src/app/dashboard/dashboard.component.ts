import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AppComponent } from '../app.component';
import { take } from 'rxjs/operators';

@Component({
	selector: 'app-dashboard',
	standalone: true,
	imports: [],
	templateUrl: './dashboard.component.html',
	styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
	constructor(private http: HttpClient) { }
	
	URL: any = AppComponent.URL;
	name: any = "name_var_here";

	ngOnInit(): void {
		this.getStudent();
	}

	getStudent() {
		this.http.get(this.URL + "/get_student_credentials")
			.pipe(take(1))
			.subscribe((res: any) => {
				this.name = res['name'];
			});
	}
}

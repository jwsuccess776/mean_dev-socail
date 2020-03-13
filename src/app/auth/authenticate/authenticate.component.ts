import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from "@angular/router";
import { HttpClient } from '@angular/common/http';
import { AuthService } from "../auth.service";

@Component({
    selector: 'app-authenticate',
    templateUrl: './authenticate.component.html',
    styleUrls: ['./authenticate.component.scss']
})
export class AuthenticateComponent implements OnInit {

    constructor(private route: ActivatedRoute, private router: Router, private httpClient: HttpClient, private service: AuthService) {
        var email = this.route.snapshot.paramMap.get("email");
        var username = this.route.snapshot.paramMap.get("username");
        var token = this.route.snapshot.paramMap.get("token");
        // var avatar = this.route.snapshot.paramMap.get("avatar");

        service.authenticate(username, email, token).toPromise()
            .then(done => {
                setTimeout(() => {
                    location.href = location.origin
                }, 1000)
            })
            .catch(err => {
                console.log(err)
            })
    }

    ngOnInit() {
        // var email = this.route.snapshot.paramMap.get("animal");
    }

}

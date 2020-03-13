import { Injectable } from '@angular/core';
import { CanActivate, Router } from "@angular/router";
import { TokenStorage } from '../auth/token.storage';
import { AdminService } from '../services/admin.service'

@Injectable()
export class OnlyAdminUsersGuard implements CanActivate {
  constructor(
    private tokenStorage: TokenStorage,
    private router: Router,
    private api: AdminService
  ) { }

  async canActivate() {
    const user = await this.api.getUserRole()
    console.log('>> ADMIN:', user)
    if (user) return true;

    // not logged in so redirect to login page with the return url
    this.router.navigate(['/auth/login']);
    return false;
  }
}

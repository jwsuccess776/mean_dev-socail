import { AdminService } from './services/admin.service';
import { Component, OnInit, OnDestroy, Output, EventEmitter, ViewChild, HostListener } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs/Subscription';
import { MatIconRegistry } from "@angular/material/icon";
import { DomSanitizer } from "@angular/platform-browser";
import { AuthService } from './auth/auth.service';
import { TokenStorage } from './auth/token.storage';
import { ChatService } from './services/chat.service'
import { EmailService } from './services/email.service'
import { StripeScriptTag } from "stripe-angular"
import * as schema from './schema/equipment.json';
import { Socket } from './services/socket.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  @Output() sidenavClose = new EventEmitter();
  @Output() public sidenavToggle = new EventEmitter();
  @ViewChild('sidenav', { static: true }) public el: any;

  // @HostListener('swiperight', ['$event']) public swipePrev(event: any) {
  //   this.el.show();
  // }
  private userSubscription: Subscription;
  public user: any
  private publishableKey: string = "pk_test_JVsCk7CCywfp47Jy13fkOksL"
  constructor(
    private authService: AuthService,
    private router: Router,
    private domSanitizer: DomSanitizer,
    private matIconRegistry: MatIconRegistry,
    private tokenStorage: TokenStorage,
    public chatService: ChatService,
    public StripeScriptTag: StripeScriptTag,
    public emailService: EmailService,
    public adminService: AdminService,
    private socket: Socket
  ) {
    this.StripeScriptTag.setPublishableKey(this.publishableKey)
  }

  public async ngOnInit() {
    try {
      // const adBlock = await this.emailService.checkForAdBlock()
      const me = await this.authService.getMe()
      if (!me) {
        this.tokenStorage.signOut()
        this.router.navigate(['/auth/login'])
      } else {
        this.user = await this.tokenStorage.getUser().toPromise()
        this.userSubscription = this.authService.$userSource.subscribe((user) => {
          this.user = user;
        });
        this.router.events.subscribe((evt) => {
          if (!(evt instanceof NavigationEnd)) {
            return;
          }
          window.scrollTo(0, 0)
        });
        setTimeout(async () => {
          if (!this.user.isAdmin) {
            try {
              this.socket.listenToMaintenanceMode().subscribe(request => {
                if (request.data.isEnabled) {
                  this.router.navigate([`maintenance`])
                }
              })
            } catch (e) {
              console.log(e)
            }
          }
        }, 2000)
      }
      // this.checkForAdBlock()
    } catch (e) {
      // this.checkForAdBlock()
    }
  }

  // public checkForAdBlock() {
  //   setInterval(async () => {
  //     try {
  //       const adBlock = await this.emailService.checkForAdBlock()
  //     } catch (e) {
  //       this.router.navigate(['disable-ad-block'])
  //     }
  //   }, 10000)
  // }

  public onToggleSidenav = () => {
    this.sidenavToggle.emit();
  }

  public onSidenavClose = () => {
    this.sidenavClose.emit();
  }

  logout(): void {
    this.authService.logout().subscribe(data => {
      this.router.navigate(['/auth/login'])
    })
  }

  navigate(link): void {
    this.router.navigate([link]);
  }

  ngOnDestroy() {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }
}

import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { TokenStorage } from '../auth/token.storage';
import { DialogService } from './../services/dialog.service';
import { DialogData } from './../shared/dialog-data';
import { SharedService } from './../services/shared.service';
import { FriendService } from '../services/friend.service';
import { NewsService } from './../services/news.service';
import { FriendChatService } from './../services/friendchat.service';
import { Socket } from './../services/socket.service';
import { version } from '../../../package.json';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {

  @Output() public sidenavToggle = new EventEmitter();
  @Output() sidenavClose = new EventEmitter();

  public user: any
  public userSubscription
  public version: string = version;
  constructor(
    private authService: AuthService,
    private router: Router,
    private _socket: Socket,
    private tokenStorage: TokenStorage,
    private dialogService: DialogService,
    private sharedService: SharedService,
    public friendsService: FriendService,
    public newsService: NewsService,
    public friendChatService: FriendChatService,
  ) {

  }

  async ngOnInit() {
    let user = await this.tokenStorage.getUser().toPromise()
    console.log('>> USER:', user)
    if (!user) {
      let user = await this.authService.me().toPromise()
      if (!user) {
        this.router.navigate(['/auth/login'])
      } else {
        this.user = user
      }
    } else {
      this.user = JSON.parse(user.toString())
    }
  }

  logout(): void {
    this.authService.logout().subscribe(data => {
      location.href = location.origin
    })
  }

  navigate(link): void {
    this.router.navigate([link]);
  }

  public onToggleSidenav = () => {
    this.sidenavToggle.emit();
  }

  public onSidenavClose = () => {
    this.sidenavClose.emit();
  }

  async openDialog() {
    this.onSidenavClose()
    const dialogData: DialogData = {
      title: 'Logout',
      message: 'Are you sure you want to logout?',
      showOKBtn: true,
      showCancelBtn: true
    };
    const dialogRef = this.dialogService.openDialog(
      dialogData, { disableClose: true });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.logout()
      }
    });
  }

  public setIsScrollToTiers(val: boolean) {
    this.sharedService.setIsScrollToTiers(val)
  }



  public skip: number = 10
  public limit: number = 10
  public onScroll(e) {
    console.log('>> CATCH SCROLL EVENT')
    const { scrollHeight, scrollTop, clientHeight } = e.srcElement
    if (scrollHeight - clientHeight <= scrollTop) {
      this.friendsService.loadMoreFriends(this.skip, this.limit)
      this.skip += this.limit
    }
  }

  public getUnseenNewsCount() {
    return this.newsService.unseenNewsCount > 0 ? this.newsService.unseenNewsCount : null
  }

  public getFriendList() {
    this.friendChatService.markReadMessageCount()
    return this.friendsService.getFriendList()
  }

  getVersion() {
    var envName = environment.production ? "" : ' [' + environment.name + ']'
    return 'v' + version + envName
  }
}

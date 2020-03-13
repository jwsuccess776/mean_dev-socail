import { Component, OnInit, HostListener } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ChatService } from '../services/chat.service'
import { AuthService } from "../auth/auth.service";
import { TokenStorage } from '../auth/token.storage'
import { FriendService } from '../services/friend.service'
import { FriendChatService } from '../services/friendchat.service'
import { Socket } from '../services/socket.service'
import { SwPush } from '@angular/service-worker'
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  @HostListener('window:scroll', ['$event'])
  public showChat: Boolean = true
  readonly VAPID_PUBLIC_KEY = "BCAHVGlRZxDTLfMNDB4H6J9VrDwovTMaJe1d9PPD648Hc0_eP8og9hLHp8dCKdnjhOz3h3sS6MoUXd8rrX60Nvw"
  public skip: number = 10
  public limit: number = 10

  public skipFriends: number = 10
  public limitFriends: number = 10

  public messageCount: any = 0;
  public notificationCounts: any;

  constructor(
    public http: HttpClient,
    private authService: AuthService,
    public chatService: ChatService,
    private tokenStorage: TokenStorage,
    private swPush: SwPush,
    private _router: Router,
    private _socket: Socket,
    private friendsService: FriendService,
    private friendChatService: FriendChatService
  ) {
    setTimeout(() => {
      this._socket.listenToFriendMessage().subscribe(request => {
        this.messageCount = (this.messageCount ? this.messageCount : 0) + 1
        this.getTotalUnreadNotificationsCount()
      })
    }, 2000)
  }

  public getTotalUnreadNotificationsCount() {
    const unreadMessages = this.messageCount
    const unacceptedFriendInvites = this.friendsService.recievedRequests.length
    const totalUnreadNotifications = unreadMessages + unacceptedFriendInvites;
    this.notificationCounts = totalUnreadNotifications > 0 ? totalUnreadNotifications : 0
  }

  onScroll(e) {
    const { scrollHeight, scrollTop, clientHeight } = e.srcElement
    if (scrollHeight - clientHeight <= scrollTop) {
      this.chatService.loadMoreChannels(this.skip, this.limit)
      this.skip += this.limit
    }
  }

  onScrollFriends(e) {
    // console.log('FRIENDS SCROLL')
    const { scrollHeight, scrollTop, clientHeight } = e.srcElement
    if (scrollHeight - clientHeight <= scrollTop) {
      console.log('LOADING FRIENDS')
      this.friendsService.loadMoreFriends(this.skipFriends, this.limitFriends)
      this.skipFriends += this.limitFriends
    }
  }

  async ngOnInit() {
    try {
      const me = await this.authService.getMe()
      if (!me) {
        this._router.navigate(['/auth/login'])
      } else {
        const user = await this.tokenStorage.getUser().toPromise()
        const firstName = JSON.parse(user.toString()).firstName

        const sub = await this.swPush.requestSubscription({ serverPublicKey: this.VAPID_PUBLIC_KEY })
        this.authService.updateUser(sub, firstName)
          .subscribe(data => {
            console.log(data)
          })

        await this.friendsService.getFriendList()
        const unreadMessages = await this.friendChatService.getUnreadMessageCount()
        unreadMessages.map(m => {
          this.messageCount = this.messageCount + m.count;
        })
        this.getTotalUnreadNotificationsCount()
      }
    } catch (e) {
    }
  }
}

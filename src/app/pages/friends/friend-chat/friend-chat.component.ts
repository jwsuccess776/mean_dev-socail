import { Component, OnInit, Input, ViewChild, ElementRef } from '@angular/core';
import { FriendChatService } from '../../../services/friendchat.service';
import { TokenStorage } from '../../../auth/token.storage';
import { Socket } from '../../../services/socket.service';

@Component({
  selector: 'app-friend-chat',
  templateUrl: './friend-chat.component.html',
  styleUrls: ['./friend-chat.component.scss']
})
export class FriendChatComponent implements OnInit {
  @ViewChild('chatDisplay') chatDisplay: ElementRef;

  isMinimized: boolean;
  @Input() friend: any;
  public message: string
  public username

  constructor(
    private _socket: Socket,
    public friendChatService: FriendChatService,
    public tokenStorage: TokenStorage
  ) { }

  async ngOnInit() {
    try {
      if (this.friend.onConnect && this.friend.onDisconnect) {
        this.friend.onConnect().subscribe(friend => {
          this.friend.user.isOnline = true
        })
        this.friend.onDisconnect().subscribe(friend => {
          this.friend.user.isOnline = false
        })
      }
      const user = await this.tokenStorage.getUser().toPromise()
      this.username = JSON.parse(user.toString()).firstName
      if (this.username && this.friend.channel) {
        this.friend.channel.on('messageAdded', (m) => {
          const el = this.chatDisplay.nativeElement
          setTimeout(() => {
            el.scrollTop = el.scrollHeight
          })
        })
      }
    } catch (e) {
      console.log(e)
    }
  }

  async sendMessage() {
    if (this.message.length) {
      this.friend.channel.sendMessage(this.message, {});
      this.message = null
      const user = await this.tokenStorage.getUser().toPromise();
      await this.friendChatService.setUnreadMessageCount(1, this.friend.recipient, JSON.parse(user.toString())._id);
      this._socket.socket.emit('friend-message-sent', { recipient: this.friend.recipient, requester: JSON.parse(user.toString()) })
    }
  }

  closeChat() {
    this.friendChatService.activeTabs = this.friendChatService.activeTabs
      .filter(friend => !!(friend.user._id != this.friend.user._id))
  }
}

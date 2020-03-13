import { Component, OnInit, ElementRef, ViewChild, Output, EventEmitter } from '@angular/core'
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { ChatService } from "../../services/chat.service"
import { OwnerExitComponent } from '../channel/owner-exit/owner-exit.component'
import { ChannelSettingsComponent } from '../channel/channel-settings/channel-settings.component'
import { StreamComponent } from '../channel/stream/stream.component'
import { TokenStorage } from '../../auth/token.storage'
import { DonateDialogComponent } from './donate-dialog/donate-dialog.component';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss']
})
export class ChatComponent implements OnInit {

  @ViewChild('chatDisplay', { static: true }) chatDisplay: ElementRef
  @Output() sidenavClose = new EventEmitter()

  public password: string
  public username: string
  public isOwner: boolean

  constructor(
    private router: Router,
    public chatService: ChatService,
    public dialogChannelSettings: MatDialog,
    private tokenStorage: TokenStorage,
    public dialogDonate: MatDialog,
  ) { }

  async ngOnInit() {
    const $user = await this.tokenStorage.getUser().toPromise()
    const user = JSON.parse($user.toString())
    console.log('printing user : ', user)
    this.username = user.firstName
    this.isOwner = !!(this.username == this.chatService.currentChannel.createdBy)
    setTimeout(() => {
      const el = this.chatDisplay.nativeElement;
      el.scrollTop = el.scrollHeight;
    }, 1000)
    this.chatDisplay.nativeElement.addEventListener('scroll', (event) => {
      if (this.chatDisplay.nativeElement.scrollTop <= 50) {
        this.chatService.getPreviousMessages()
      }
    })
    this.chatService.currentChannel.on('messageAdded', (m) => {
      console.log('Message Added : ', m)
      const el = this.chatDisplay.nativeElement;
      setTimeout(() => {
        el.scrollTop = el.scrollHeight;
      });
    })
  }

  startOrJoinStream() {
    if (this.isOwner && !this.chatService.videoStreamId) {
      this.dialogChannelSettings.open(StreamComponent, {
        width: '850px'
      })
    } else if (!this.isOwner && !this.chatService.videoStreamId) {
      this.chatService.connectToVideoRoom(this.chatService.currentChannel.sid)
    }
  }

  async showChannelSettingsDialog() {
    this.dialogChannelSettings.open(ChannelSettingsComponent, {
      width: '850px'
    })
  }

  async leaveChannel() {
    const { sid, friendlyName } = this.chatService.currentChannel
    if (this.chatService.currentChannel.createdBy == this.username) {
      this.dialogChannelSettings.open(OwnerExitComponent, {
        width: '400px',
        data: {
          sid,
          loginChannel: friendlyName,
          logoutChannel: this.chatService.currentChannel.friendlyName
        }
      });
    } else {
      this.chatService.leaveChannel(this.username, true)
      this.router.navigate(['/'])
    }
  }

  public onSidenavClose = () => {
    this.sidenavClose.emit();
  }

  showDonateDialog() {
    this.onSidenavClose()
    const { sid, createdBy, friendlyName } = this.chatService.currentChannel
    this.dialogDonate.open(DonateDialogComponent, {
      width: '400px',
      data: {
        sid,
        user: createdBy,
        title: friendlyName
      }
    });
  }
}

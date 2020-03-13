import { LoadingDialogComponent } from './../../../controls/loading-dialog/loading-dialog.component';
import { Component, OnInit, Input } from '@angular/core';
import { ChatService } from '../../../services/chat.service';
import { FriendService } from '../../../services/friend.service';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ExitChannelComponent } from '../exit-channel/exit-channel.component';
import { OwnerExitComponent } from '../owner-exit/owner-exit.component';
import { BlockWarningComponent } from '../block-warning/block-warning.component';
import { TokenStorage } from '../../../auth/token.storage';
import { Socket } from '../../../services/socket.service'
import { get } from 'lodash';
import { DialogData } from '../../../shared/dialog-data';

@Component({
  selector: 'app-channel-item',
  templateUrl: './channel-item.component.html',
  styleUrls: ['./channel-item.component.scss']
})

export class ChannelItemComponent implements OnInit {
  // get Data from ChannelList
  @Input() channel: any;
  public isCurrentChannel: boolean;
  public isUserOnline: boolean;
  public dialogRef: MatDialogRef<LoadingDialogComponent>
  constructor(
    private chatService: ChatService,
    public dialog: MatDialog,
    private tokenStorage: TokenStorage,
    private friendService: FriendService,
    private _socket: Socket
  ) {
  }

  async ngOnInit() {
    if (this.chatService.currentChannel)
      this.isCurrentChannel = !!(this.channel.sid == this.chatService.currentChannel.sid)

    try {
      const id = this.channel.attributes.userId || false;
      if (id) {
        const user = await this.friendService.getUserById({ id });
        this.isUserOnline = get(user, 'isOnline', false);
      } else {
        this.isUserOnline = false;
      }
    } catch (e) {
      console.log(e)
    }
  }

  async joinChannel(sid: string, friendlyName) {
    try {
      this.openDialog();
      const $user = await this.tokenStorage.getUser().toPromise();
      const user = JSON.parse($user.toString());
      await this.chatService.connectToVideoRoom(sid);
      const channelAPI = await this.chatService.getChannelAPI({ id: sid });
      const { channel } = channelAPI;
      const isUserBlocked = await this.chatService.isUserBlocked({ username: user.firstName, channelId: channel._id });
      if (isUserBlocked) {
        this.dialog.open(BlockWarningComponent, {
          width: '400px'
        });
      } else {
        if (this.chatService.currentChannel) {
          if (this.chatService.currentChannel.sid !== sid) {
            if (this.chatService.currentChannel.createdBy === user.firstName) {
              this.dialog.open(OwnerExitComponent, {
                width: '400px',
                data: {
                  sid,
                  loginChannel: friendlyName,
                  logoutChannel: this.chatService.currentChannel.friendlyName
                }
              });
            } else {
              this.dialog.open(ExitChannelComponent, {
                width: '400px',
                data: {
                  sid,
                  loginChannel: friendlyName,
                  logoutChannel: this.chatService.currentChannel.friendlyName
                }
              });
            }
          }
        } else {
          this.chatService.enterChannel(sid, user.firstName);
        }
        this.closeDialog();
        setTimeout(() => {
          this.chatService.getChannels()
        }, 5000)
      }
    } catch (e) {
      console.log('e ----->>> ', e);
      this.closeDialog();
    }
  }

  openDialog() {
    this.dialogRef = this.dialog.open(LoadingDialogComponent, {
      width: '300px',
      data: {
        message: 'Joining channel...',
      }
    });
  }

  closeDialog() {
    this.dialogRef.close();
  }
}

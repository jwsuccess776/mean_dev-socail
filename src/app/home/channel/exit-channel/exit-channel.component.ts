import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { ChatService } from "../../../services/chat.service";
import { TokenStorage } from '../../../auth/token.storage'

interface channel {
  sid: string
  logoutChannel: string
  loginChannel: string
}

@Component({
  selector: 'app-exit-channel',
  templateUrl: './exit-channel.component.html',
  styleUrls: ['./exit-channel.component.scss']
})
export class ExitChannelComponent implements OnInit {

  constructor(
    private dialogRef: MatDialogRef<ExitChannelComponent>,
    public chatService: ChatService,
    @Inject(MAT_DIALOG_DATA) public data: channel,
    private tokenStorage: TokenStorage
  ) { }

  ngOnInit() {
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  async exitChannel() {
    const { sid } = this.data
    const $user = await this.tokenStorage.getUser().toPromise()
    const user = JSON.parse($user.toString())
    this.chatService.enterChannel(sid, user.firstName)
  }

}

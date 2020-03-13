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
  selector: 'app-owner-exit',
  templateUrl: './owner-exit.component.html',
  styleUrls: ['./owner-exit.component.scss']
})
export class OwnerExitComponent implements OnInit {

  constructor(
    private dialogRef: MatDialogRef<OwnerExitComponent>,
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
    const $user = await this.tokenStorage.getUser().toPromise()
    const identity = JSON.parse($user.toString()).firstName
    this.chatService.leaveChannel(identity)
  }

}

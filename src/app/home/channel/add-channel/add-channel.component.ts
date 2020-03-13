import { Component, OnInit, Inject, Injectable, Output, EventEmitter } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { ChatService } from "../../../services/chat.service";
import { TokenStorage } from '../../../auth/token.storage';
import { FormBuilder, FormGroup, Validators } from '@angular/forms'
import { Router } from '@angular/router';
// import { ContentComponent } from '../../content/content.component';

export interface ChannelItem {
  title: string;
  description: string;
  isPrivate: boolean
}

// providers: [ContentComponent],
@Component({
  selector: 'app-add-channel',
  templateUrl: './add-channel.component.html',
  styleUrls: ['./add-channel.component.scss']
})
export class AddChannelComponent implements OnInit {

  public error: any = {}
  public addChannelForm: FormGroup
  @Output() sidenavClose = new EventEmitter();

  constructor(
    private router: Router,
    private dialogRef: MatDialogRef<AddChannelComponent>,
    public chatService: ChatService,
    @Inject(MAT_DIALOG_DATA) public data: ChannelItem,
    private tokenStorage: TokenStorage,
    private fb: FormBuilder
  ) { }

  public onSidenavClose = () => {
    this.sidenavClose.emit();
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  async addChannel() {
    this.onSidenavClose()
    if (this.addChannelForm.valid) {
      const $user = await this.tokenStorage.getUser().toPromise()
      const user = JSON.parse($user.toString())
      await this.chatService.createChannel(
        this.addChannelForm.value.title,
        user.username ? user.username : user.firstName,
        {
          description: this.addChannelForm.value.description,
          userImage: user.avatar,
          isPrivate: this.addChannelForm.value.isPrivate,
          password: this.addChannelForm.value.isPrivate ? Math.floor(100000 + Math.random() * 900000) : null,
          userId: user._id
        }
      )
        .then(async () => {
          this.router.navigate(['/channel', this.chatService.channelSid]);
          await this.onNoClick()
        })
        .catch(err => {
          console.log(err)
          this.error = err
        })
    } else {
      this.error = {
        message: "Please fill in all required fields."
      }
    }
  }

  ngOnInit() {
    this.addChannelForm = this.fb.group({
      title: [null, Validators.required],
      description: [null, Validators.required],
      isPrivate: [null]
    })
  }

}

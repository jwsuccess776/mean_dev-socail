import { Component, OnInit } from '@angular/core'
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar'
import { FriendService } from '../../services/friend.service'
import { Socket } from '../../services/socket.service'
import { FriendChatService } from '../../services/friendchat.service';
import { CreateGroupComponent } from './create-group/create-group.component';

@Component({
  selector: 'app-friends',
  templateUrl: './friends.component.html',
  styleUrls: ['./friends.component.scss']
})
export class FriendsComponent implements OnInit {
  public searchTitle: string
  public searchResults = []
  public friendList = []
  constructor(
    public dialog: MatDialog,
    public friendService: FriendService,
    private _socket: Socket,
    private _snackBar: MatSnackBar,
    private _friendsChatService: FriendChatService
  ) {
    setTimeout(async () => {
      this.friendList = await this.friendService.getFriendList()

      this._socket.listenToFriendRequests().subscribe(request => {
        this.friendService.friendRequestNotification(request)
      })

      this._socket.listenToAcceptedFriendRequests().subscribe(request => {
        this.friendService.friendAddedNotification(request)
      })
    }, 2000)
  }

  

  async searchUsers() {
    try {
      if (!this.searchTitle)
        this.searchResults = []
      else if (this.searchTitle.length >= 4) {
        this.searchResults = []
        const searchResult = await this.friendService.searchUsers(this.searchTitle)
        if (searchResult.length)
          this.searchResults = searchResult
        else
          this._snackBar.open("No users were found for your search criteria.", null, { duration: 2 })
      } else {
        this._snackBar.open("Please input at least 4 characters.", null, { duration: 2 })
      }
    } catch (e) {
      console.log(e)
    }
  }

  async groupChat() {
    const dialogRef = this.dialog.open(CreateGroupComponent, {
      width: "400px",
      data: {
        title: "",
        description: ""
      }
    })
  }

  ngOnInit() {

  }
}

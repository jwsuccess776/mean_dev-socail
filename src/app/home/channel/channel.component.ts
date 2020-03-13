import { Component, OnInit } from "@angular/core";
import { Router, ActivatedRoute } from "@angular/router";
import { MatDialog } from "@angular/material/dialog";
import { AddChannelComponent } from "./add-channel/add-channel.component";
import { ChatService } from "../../services/chat.service";
import { FriendChatService } from "../../services/friendchat.service";
import "rxjs/add/observable/fromEvent";
import "rxjs/Rx";
import { TokenStorage } from "../../auth/token.storage";

@Component({
  selector: "app-channel",
  templateUrl: "./channel.component.html",
  styleUrls: ["./channel.component.scss"]
})
export class ChannelComponent implements OnInit {
  private conSub: any;
  public channelId: string;
  public searchTitle: string;
  public showingFriends: boolean = false
  public showingChannels: boolean = true
  constructor(
    private router: Router,
    public dialog: MatDialog,
    public chatService: ChatService,
    private tokenStorage: TokenStorage,
    private _friendChat: FriendChatService,
    private route: ActivatedRoute
  ) {
  }

  searchChannels() {
    console.log(this.searchTitle)
  }

  async ngOnInit() {
    const $user = await this.tokenStorage.getUser().toPromise();
    const { firstName } = JSON.parse($user.toString());
    const token = await this.chatService.generateToken(firstName);
    if (!this.chatService.isConnected) {
      this.chatService.connect(token).then(async connection => {
        try {
          this._friendChat.connect();
          this._friendChat.getFriendChannels();
          this.route.paramMap.subscribe(
            params => (this.channelId = params.get("channelId"))
          );
          console.log("channelId", this.channelId);
          if (this.channelId)
            await this.chatService.enterChannel(this.channelId, firstName);
          this.chatService.chatClient.on("channelAdded", () => {
            this.chatService.getChannels();
          });
          this.chatService.chatClient.on("channelRemoved", () => {
            this.chatService.getChannels();
          });
        } catch (e) {
          console.log(e);
        }
      });
    }
  }

  showAddChannelDialog(): void {
    const dialogRef = this.dialog.open(AddChannelComponent, {
      width: "400px",
      data: {
        title: "",
        description: ""
      }
    })
  }
}

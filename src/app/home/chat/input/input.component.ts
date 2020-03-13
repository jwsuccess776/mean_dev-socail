import { Component, OnInit, AfterViewChecked } from "@angular/core";
import { ChatService } from "../../../services/chat.service";
import { TokenStorage } from "../../../auth/token.storage";
import Giphy from 'giphy-api';
declare const microlink;

@Component({
  selector: "app-input",
  templateUrl: "./input.component.html",
  styleUrls: ["./input.component.scss"]
})
export class InputComponent implements OnInit {
  public chatMessage: string = '';
  showEmojiPicker = false;

  showGiphySearch = false;
  giphySearchTerm = '';
  giphyResults = [];

  showAttachment = false
  fileToUpload: File = null;

  constructor(
    public chatService: ChatService,
    private tokenStorage: TokenStorage
  ) { }

  ngOnInit() { }

  toggleEmojiPicker() {
    this.showGiphySearch = false;
    this.showAttachment = false;
    this.showEmojiPicker = !this.showEmojiPicker;
  }

  toggleGiphySearch() {
    this.showEmojiPicker = false;
    this.showAttachment = false;
    this.showGiphySearch = !this.showGiphySearch;
  }

  toggleAttachment() {
    this.showGiphySearch = false;
    this.showEmojiPicker = false;
    this.showAttachment = !this.showAttachment;
  }

  addEmoji(event) {
    const { chatMessage } = this;
    const text = `${chatMessage}${event.emoji.native}`;
    this.chatMessage = text;
  }

  ngAfterViewChecked() {
    microlink('.link-preview');
  }

  searchGiphy() {
    const giphy = Giphy();
    const searchTerm = this.giphySearchTerm;
    giphy.search(searchTerm)
      .then(res => {
        this.giphyResults = res.data;
      })
      .catch(console.error);
  }

  async handleFileInput(files: FileList) {
    this.fileToUpload = files.item(0);
  }

  async sendGif(title, url) {
    const $user = await this.tokenStorage.getUser().toPromise();
    const user = JSON.parse($user.toString());
    await this.chatService.sendMessage(" ", {
      avatar: user.avatar,
      email: user.email,
      text: title,
      media: url
    }).catch(console.error);
    this.showGiphySearch = false;
  }

  async sendMessage() {

    var attributes;

    if (this.chatMessage && /\S/.test(this.chatMessage)) {
      const $user = await this.tokenStorage.getUser().toPromise();
      const user = JSON.parse($user.toString());

      if (this.fileToUpload) {
        const data = await this.chatService.postFile(this.fileToUpload)
        attributes = {
          avatar: user.avatar,
          email: user.email,
          text: data.name,
          file: data.location,
          type: data.type
        }
      } else {
        attributes = {
          avatar: user.avatar,
          email: user.email,
        }
      }

      await this.chatService.sendMessage(this.chatMessage, attributes);
      this.chatMessage = null;
      this.showEmojiPicker = false;
      this.showGiphySearch = false;
      this.showAttachment = false;
      this.fileToUpload = null;
    }
  }
}

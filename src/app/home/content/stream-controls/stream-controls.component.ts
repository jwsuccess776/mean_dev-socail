import { Component, OnInit, ViewChild, ElementRef, Renderer2 } from '@angular/core'
import { MatDialog } from '@angular/material/dialog';
import { ChatService } from '../../../services/chat.service'
import { VideoService } from '../../../services/video.service'
import { TokenStorage } from '../../../auth/token.storage'
import { PaymentService } from '../../../services/payment.service'
import { HttpEvent, HttpEventType } from '@angular/common/http'
import { DomSanitizer } from '@angular/platform-browser'
import { LocalVideoTrack, LocalAudioTrack } from 'twilio-video'

@Component({
  selector: 'app-stream-controls',
  templateUrl: './stream-controls.component.html',
  styleUrls: ['./stream-controls.component.scss']
})
export class StreamControlsComponent implements OnInit {

  public file: File
  public progress: number = 0
  public videoURL
  public videoDuration: number
  public videoUploaded: boolean = false
  public username: string
  public isOwner: boolean = false

  private videoTrack: LocalVideoTrack
  private audioTrack: LocalAudioTrack
  private localTracks: any
  public isInitializing: boolean = true
  public channelSID: string
  public isPayedUser: boolean
  public isLoading: boolean = true

  constructor(
    public chatService: ChatService,
    public tokenStorage: TokenStorage,
    public videoService: VideoService,
    public sanitizer: DomSanitizer,
    private renderer: Renderer2,
    private paymentService: PaymentService,
    public dialogChannelSettings: MatDialog
  ) { }

  async startLiveStream() {
    if (this.isOwner && !this.chatService.videoStreamId) {
      this.localTracks = await this.chatService.getUserScreen()
      await this.chatService.shareToTwillio()
    } else {
      alert('You must host a channel before starting a live stream.')
    }
  }

  async ngOnInit() {
    try {
      const user = await this.tokenStorage.getUser().toPromise()
      const { email, firstName } = JSON.parse(user.toString())
      const customer: any = await this.paymentService.stripeGetCustomerByEmail(email)
      const { data } = customer.subscriptions
      this.isPayedUser = data.length == 1 ? true : false
      this.username = firstName
      this.isOwner = !!(this.username == this.chatService.currentChannel.createdBy)
      if (user && customer)
        this.isLoading = false
    } catch (e) {
      console.log(e)
    }
  }

  toggleMute() {
    
  }

  uploadStream() {
    
  }

  downloadStream() {
    
  }
}

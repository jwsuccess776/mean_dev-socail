import { Component, OnInit, HostListener, ViewChild, ElementRef, Renderer2, Input } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { VideoService } from '../../services/video.service';
import { HttpEvent, HttpEventType } from '@angular/common/http';
import { ChatService } from '../../services/chat.service';
import { TokenStorage } from '../../auth/token.storage';
import { DomSanitizer } from '@angular/platform-browser';
import { Router } from '@angular/router';

@Component({
  selector: 'app-videos',
  templateUrl: './videos.component.html',
  styleUrls: ['./videos.component.scss']
})
export class VideosComponent implements OnInit {
  @Input() videos: any = [];
  @ViewChild('videoPreview') videoPreviewElement: ElementRef;
  @ViewChild('fileInput') fileInput: ElementRef;
  @HostListener('window:scroll', ['$event'])
  public searchTitle: string;
  public limit: number = 5;
  public skip: number = 0;
  // public videos: any = [];
  public file: File
  public progress: number = 0;
  public videoURL: any;
  public videoDuration: number;
  public videoUploaded: boolean = false;
  public username: string;
  public isOwner: boolean = false;
  public channelSID: string;

  constructor(
    public router: Router,
    public chatService: ChatService,
    public tokenStorage: TokenStorage,
    public videoService: VideoService,
    public sanitizer: DomSanitizer,
    private renderer: Renderer2,
    public dialog: MatDialog,
  ) { }

  async ngOnInit() {
    try {
      this.videos = await this.videoService.getVideosData({ limit: this.limit, skip: this.skip });
    } catch (e) {
      console.log(e)
    }
  }

  onScroll(e) {
    const { scrollHeight, scrollTop, clientHeight } = e.srcElement;
    if (scrollHeight - clientHeight <= scrollTop) {
      this.loadMore();
    }
  }

  async loadMore() {
      this.skip = this.videos.length;
      const videos = await this.videoService.getVideosData({ limit: this.limit, skip: this.skip });
      videos.map(async(video) => {
        await this.videos.push(video);
      });
  }

  public selectVideo() {
    this.fileInput.nativeElement.click()
  }

  public async uploadVideo($event) {
    if ($event.target.files.length > 0) {
      this.file = $event.target.files[0];
      this.videoURL = this.sanitizer.bypassSecurityTrustResourceUrl(URL.createObjectURL(this.file));
      this.renderer.listen(this.videoPreviewElement.nativeElement, 'loadedmetadata', () => {
        this.videoDuration = this.videoPreviewElement.nativeElement.duration;
      });
      const fileName = this.file.name;
      const fileType = this.file.type;
      try {
        const user = await this.tokenStorage.getUser().toPromise();
        const { _id } = JSON.parse(user.toString())
        const url = await this.videoService.getUploadURL({ fileName, fileType, Key: _id });
        this.videoService.uploadVideo(this.file, url.url)
          .subscribe(async (event: HttpEvent<any>) => {
            switch (event.type) {
              case HttpEventType.UploadProgress:
                this.progress = Math.round(event.loaded / event.total * 100);
                break;
              case HttpEventType.Response:
                try {
                  const video = await this.videoService.uploadVideoByUrl({ url: event.url, duration: this.videoDuration, title: this.file.name })
                  this.ngOnInit()
                  this.videoUploaded = true
                  setTimeout(() => {
                    this.progress = 0,
                      this.videoUploaded = false
                  }, 1500)
                } catch (e) {
                  console.log(e)
                }
            }
          })
      } catch (e) {
        console.log(e)
      }
    }
  }

  navigateToCreatorSpace() {
    this.router.navigate(['/creator-space'])
  }

  showMoreOptions() {

  }

  showOptionsDialog() {
    
  }
}

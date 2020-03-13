import { Component, OnInit, Input } from '@angular/core';
import { Router } from '@angular/router'
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-video-item',
  templateUrl: './video-item.component.html',
  styleUrls: ['./video-item.component.scss']
})
export class VideoItemComponent implements OnInit {
  @Input() video: any;
  public isCurrentVideo: boolean
  public views: number
  public likes: number
  public sort_option: string
  public showOptionsDialog: boolean

  constructor(
    public dialog: MatDialog,
    private router: Router
  ) {
  }

  ngOnInit() {
    this.views = this.video.views.map(view => view.viewCounter).reduce((a, b) => a + b, 0);
    this.likes = Math.round((this.video.likes.filter(like => like.status).length / this.video.likes.length) * 100);
  }

  playVideo(videoId: string) {
    this.router.navigate([`/video/${videoId}`])
  }

  showMoreOptions() {
    this.showOptionsDialog = !this.showOptionsDialog
  }
}

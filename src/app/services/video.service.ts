import { Injectable } from '@angular/core'
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http'
import { Observable, throwError } from 'rxjs'
import { catchError } from 'rxjs/operators'
import { TokenStorage } from '../auth/token.storage'

const TWILIO_TOKEN_KEY = "TwilioToken"

@Injectable({
  providedIn: "root"
})
export class VideoService {

  public isLoadingVideos: Boolean = false
  public isShowingVideo: boolean = false

  constructor(
    public http: HttpClient,
    public tokenStorage: TokenStorage
  ) { }

  public getUploadURL({ fileName, fileType, Key }): Promise<any> {
    return this.http.post(`/api/s3/upload-url`, { fileName, fileType, Key, bucketName: 'videos' }).toPromise()
  }

  public uploadVideoByUrl({ url, title, duration }): Promise<any> {
    return this.http.post('/api/video', { url, title, duration }).toPromise()
  }

  public uploadVideo(image: File, url: string): Observable<any> {
    const headers: HttpHeaders = new HttpHeaders({
      'x-amz-acl': 'public-read',
      'Content-Type': image.type
    })
    return this.http.put(url, image, { headers, reportProgress: true, observe: 'events' }).pipe(
      catchError(this.errorMgmt)
    )
  }

  getVideosData({ limit, skip, me = '0' }): Promise<any> {
    return this.http.get(`/api/video?skip=${skip}&limit=${limit}&me=${me}`).toPromise()
  }

  getVideoData({ id }): Promise<any> {
    return this.http.get(`/api/video/${id}`).toPromise()
  }

  getVideoStream({ id }): Promise<any> {
    return this.http.get(`/api/video/${id}/signedURL`).toPromise()
  }

  likeVideo({ status, id }): Promise<any> {
    return this.http.post(`/api/video/${id}/like`, { status }).toPromise()
  }

  comment({ body, id }): Promise<any> {
    return this.http.post(`/api/video/${id}/comment`, { body }).toPromise()
  }

  errorMgmt(error: HttpErrorResponse) {
    console.log('>> ERROR', error)
    let errorMessage = '';
    if (error.error instanceof ErrorEvent) {
      errorMessage = error.error.message;
    } else {
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
    }
    console.log(errorMessage);
    return throwError(throwError)
  }
}
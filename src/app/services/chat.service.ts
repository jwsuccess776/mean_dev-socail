import { EventEmitter, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import * as Twilio from 'twilio-chat';
import Client from "twilio-chat";
import { Util } from "../util/util";
import { Channel } from "twilio-chat/lib/channel";
import { Router } from "@angular/router";
import { Message } from "twilio-chat/lib/message";
import { identity } from 'rxjs';
import { TokenStorage } from '../auth/token.storage';
import * as Video from 'twilio-video';
import * as Audio from 'twilio-video';
import { LocalVideoTrack, LocalAudioTrack } from 'twilio-video'
import { MatSnackBar } from '@angular/material/snack-bar';
import { RecordingService } from './videoRecord.service'
import { Socket } from './socket.service'

const TWILIO_TOKEN_KEY = "TwilioToken"
const TWILIO_VIDEO_TOKEN_KEY = "TwilioVideoToken"

declare var MediaRecorder: any;
(Array as any).prototype.swap = function (x, y) {
  var b = this[x];
  this[x] = this[y];
  this[y] = b;
  return this;
}
@Injectable({
  providedIn: "root"
})
export class ChatService {
  public loadingTexts: Boolean = false
  public isShowingChat: Boolean = true
  public isShowingTexts: Boolean = false
  public isPasswordProtected: Boolean = false
  public lastMessageSendDate: Date = new Date()

  public isGettingChannels: Boolean = false
  public channels: any[] = []
  public channelObj: any

  public chatClient: Client;
  public currentChannel: Channel | any;
  public chatConnectedEmitter: EventEmitter<any> = new EventEmitter<any>()
  public chatDisconnectedEmitter: EventEmitter<any> = new EventEmitter<any>()

  public $tokenSource = new Subject<any>();
  public messages = []
  public channelSid

  public videoRoom
  public sharedScreen
  public sharedAudio
  public hostLocalVideoTrack
  public videoStreamId: string
  public isHost: Boolean = false
  public isStreamInitialized: boolean = false;
  public isScreenSharing: boolean = false;
  public isMuted: boolean = false;
  public videoTrack: LocalVideoTrack;
  public audioTrack: LocalAudioTrack;
  public error: string
  public isLoading = false
  public isStreamingMsgBackgroundOn: boolean = false

  constructor(
    private router: Router,
    public http: HttpClient,
    public tokenStorage: TokenStorage,
    private _snackBar: MatSnackBar,
    private _record: RecordingService,
    private socket: Socket
  ) { }

  async createChannelAPI({ channelSID, title, description, isPrivate, username }): Promise<any> {
    const user = await this.tokenStorage.getUser().toPromise()
    const userId = JSON.parse(user.toString())._id
    return this.http.post('/api/channel/', { channelSID, title, description, isPrivate, user: userId })
      .toPromise()
  }

  getChannelAPI({ id }): Promise<any> {
    return this.http.get(`/api/channel/${id}`)
      .toPromise()
  }

  getChannelUsers(userNames: Array<string>): Promise<any> {
    return this.http.post('/api/auth/user/findByUserNames', { userNames })
      .toPromise()
  }

  getChannelBlockList({ id }): Promise<any> {
    return this.http.get(`/api/channel/${id}/blocks`)
      .toPromise()
  }

  async blockUser({ userId, channelId }): Promise<any> {
    return this.http.post(`/api/channel/blocks`, { user: userId, channel: channelId })
      .toPromise()
  }

  unblockUser({ blockId }): Promise<any> {
    return this.http.delete(`/api/channel/blocks/${blockId}`)
      .toPromise()
  }

  async isUserBlocked({ username, channelId }): Promise<any> {
    const user = await this.tokenStorage.getUser().toPromise()
    const userId = JSON.parse(user.toString())._id
    return this.http.get(`/api/channel/blocks/${userId}/${channelId}`)
      .toPromise()
  }

  sendNotifications(body, title, userNames): Promise<any> {
    return this.http.post('/api/notifications/push', { body, title, userNames })
      .toPromise()
      .then(res => res)
      .catch(err => err)
  }

  toggleChat() {
    this.isShowingChat = !this.isShowingChat
  }

  generateToken(identity): Promise<any> {
    return this.http
      .post('/api/twilio/chat-token', { identity, deviceId: "Browser" })
      .toPromise()
      .then((data: any) => {
        this.setTwilioToken(data.token);
        this.saveTwilioToken(data.token);
        return data;
      })
  }

  deleteMessage(message: Message): Promise<void> {
    return message.remove().then(console.log).catch(console.error)
  }

  postFile(fileToUpload: File): Promise<any> {
    const endpoint = '/api/media/uploadFile';
    const formData: FormData = new FormData();
    formData.append('file', fileToUpload, fileToUpload.name);
    return this.http
      .post(endpoint, formData)
      .toPromise()
      .then((res) => {
        return res
      });
  }


  public isConnected = false
  connect(token): Promise<any> {
    return Twilio.Client.create(token.token).then((client: Client) => {
      this.chatClient = client;
      this.chatConnectedEmitter.emit(true);
      this.getChannels()
      console.log('>> CONNECTED')
      this.isConnected = true
      return client;
    }).catch((err: any) => {
      this.chatDisconnectedEmitter.emit(true);
      if (err.message.indexOf('token is expired')) {
        localStorage.removeItem('twackToken');
        this.router.navigate(['/']);
      }
    });
  }

  public allChannels: Array<any> = []

  loadMoreChannels(skip: number, limit: number) {
    if (skip >= this.allChannels.length) return
    this.channels = [...this.channels, ...this.allChannels.slice(skip, skip + limit)]
  }

  getChannels(spinner = false): Promise<any> {
    if (spinner)
      this.isGettingChannels = true;

    return this.getPublicChannels().then((channels: any) => {
      this.channelObj = channels;
      this.allChannels = this.channelObj.items
        .filter(channel => !channel.friendlyName.startsWith("__hide__"))
        .sort((a, b) => b.membersCount - a.membersCount)

      this.channels = this.channelObj.items
        .filter(channel => !channel.friendlyName.startsWith("__hide__"))
        .sort((a, b) => b.membersCount - a.membersCount)
        .slice(0, 5)

      if (spinner)
        this.isGettingChannels = false;

      return channels.items
    });
  }

  getPublicChannels() {
    return this.chatClient.getPublicChannelDescriptors();
  }

  getChannel(sid: string): Promise<Channel> {
    return this.chatClient.getChannelBySid(sid);
  }

  isHostingChannel(identity: string) {
    return this.channels.some((channel: Channel) => !!(channel.createdBy == identity))
  }

  getHostedChannel(identity: string) {
    const channels: Channel[] = this.channels.filter((channel: Channel) => !!(channel.createdBy == identity) ? true : false)
    return channels.length ? channels[0].sid : null
  }

  async getUserChannel(email: string, username: string) {
    const channelSID: any = await this.http.get(`/api/twilio/userChannel/${email}`).toPromise()
    if (channelSID.sid) {
      this.enterChannel(channelSID.sid, username)
    }
  }

  async createChannel(friendlyName: string, identity: string, attributes: any = {}, isPrivate: boolean = false) {
    if (this.isHostingChannel(identity)) {
      return Promise.reject({
        status: 401, message: "You're already hosting a channel."
      })
    } else {
      console.log('>> ON CREATING CHANNEL', this.chatClient)

      return await this.chatClient
        .createChannel({
          friendlyName,
          isPrivate,
          attributes, // Custom properties
          uniqueName: Util.guid()
        })
        .then(async (channel: Channel) => {
          const { sid } = channel
          const $user = await this.tokenStorage.getUser().toPromise()
          const user = JSON.parse($user.toString())
          const username = user.username ? user.username : user.firstName
          this.isHost = username == channel.createdBy
          this.channelSid = sid
          await this.createChannelAPI({ channelSID: sid, username, isPrivate, title: friendlyName, description: attributes.description })
          return await this.enterChannel(sid, identity)
            .then(async res => {
              await this.getChannels(true)
              return channel
            })
        })
    }
  }

  async leaveChannel(identity, reloadChannels = false) {
    if (this.currentChannel) {
      this.isShowingTexts = false
      return this.currentChannel.leave().then(async (channel: Channel) => {
        const username = channel.createdBy
        if (username === identity) {
          console.log('>> CONDITION TRUE')
          channel.delete()
            .then((value) => {
              this.currentChannel = null
              this.getChannels(false)
              channel.removeAllListeners('messageAdded');
              channel.removeAllListeners('messageRemoved');
              return true
            })
            .catch(err => {
              console.log(err)
            })
        } else {
          const $user = await this.tokenStorage.getUser().toPromise()
          const user = JSON.parse($user.toString())
          this.http.get(`/api/twilio/enterChannel/${null}/${user.email}`).toPromise()
          this.currentChannel = null
          if (reloadChannels)
            this.getChannels(false)
          channel.removeAllListeners('messageAdded');
          channel.removeAllListeners('messageRemoved');
          return true
        }
      });
    } else {
      return Promise.resolve();
    }
  }

  async sendMessage(chatMessage, attributes = {}): Promise<any> {
    const dateNow = new Date()
    const diff = Math.round(Math.abs((dateNow.getTime() - this.lastMessageSendDate.getTime()) / 1000))
    if (diff <= 2) {
      this._snackBar.open("Please be courteous to other users and try to not spam", null, { duration: 1000 })
      return Promise.resolve()
    } else {
      const $user = await this.tokenStorage.getUser().toPromise()
      const user = JSON.parse($user.toString())
      const usernames = []
      this.currentChannel.members.forEach(member => { usernames.push(member.state.identity) })
      const body = `${user.username}: ${chatMessage}`
      const title = `New message at ${this.currentChannel.state.friendlyName}`
      const sendNotificationTo = usernames.filter($username => $username == user.username ? false : true)
      //TODO: fix this to also check if attributes CONTAINS avatar. 
      //This will cover the case where if attributes is passed in parameters and avatar isn't provided.
      if (this.isEmpty(attributes)) {
        attributes = {
          avatar: user.avatar
        }
      }
      this.lastMessageSendDate = new Date()
      return Promise.all([
        this.currentChannel.sendMessage(chatMessage, attributes),
        this.sendNotifications(body, title, sendNotificationTo)
      ])
    }

  }

  isEmpty(obj) {
    for (var key in obj) {
      if (obj.hasOwnProperty(key))
        return false;
    }
    return true;
  }

  public messagePage
  getMessages(channel) {
    this.loadingTexts = true
    channel.getMessages()
      .then(m => {
        console.log('Message Received : ', m)
        this.loadingTexts = false
        this.messagePage = m
        this.messages = m.items
      })
  }

  async getPreviousMessages() {
    if (this.messagePage.hasPrevPage) {
      const page = await this.messagePage.prevPage()
      const items = page.items.reverse()
      items.forEach(item => this.messages.unshift(item))
      this.messagePage = page
    } else {
      console.log('>> No previous page')
    }
  }

  listenToMessages(channel) {
    channel.on('messageAdded', (m) => {
      this.messages.push(m)
    });
    channel.on('messageRemoved', (m) => {
      console.log("messageRemoved", m)
      const index = this.messages.findIndex(msg => msg.sid === m.sid)
      console.log('index is : ', index)
      this.messages.splice(index, 1)
    });
  }

  submitPassword(password) {
    if ((<any>this.currentChannel.attributes).password == password) {
      this.isPasswordProtected = false
    }
  }

  enterChannel(sid: string, identity: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.leaveChannel(identity, true)
        .then((state) => {
          this.getChannel(sid).then(channel => {
            this.currentChannel = channel;
            this.messages = [];
            this.currentChannel.join()
              .then(async r => {
                this.currentChannel = channel
                this.getMessages(channel)
                this.listenToMessages(channel)
                this.getChannels(false)

                this.isShowingTexts = true
                if ((<any>channel.attributes).isPrivate && (channel.createdBy != identity))
                  this.isPasswordProtected = true
                else
                  this.isPasswordProtected = false

                channel.emit('message-added')
                const $user = await this.tokenStorage.getUser().toPromise()
                const user = JSON.parse($user.toString())
                this.http.get(`/api/twilio/enterChannel/${channel.sid}/${user.email}`).toPromise()
                this.isHost = identity == channel.createdBy
                this.channelSid = sid
                let channelIndex
                this.channels.forEach((channel, i) => {
                  if (channel.sid == sid)
                    channelIndex = i
                })
                this.channels = (this.channels as any).swap(channelIndex, 0)
                return resolve();
              })
              .catch(async e => {
                if (e.message.indexOf('already exists') > 0) {
                  this.getMessages(channel)
                  this.listenToMessages(channel)
                  this.getChannels(false)

                  this.isShowingTexts = true
                  if ((<any>channel.attributes).isPrivate && (channel.createdBy != identity))
                    this.isPasswordProtected = true
                  else
                    this.isPasswordProtected = false

                  channel.emit('message-added')
                  const $user = await this.tokenStorage.getUser().toPromise()
                  const user = JSON.parse($user.toString())
                  this.http.get(`/api/twilio/enterChannel/${channel.sid}/${user.email}`).toPromise()
                  this.isHost = identity == channel.createdBy
                  this.channelSid = sid
                  let channelIndex
                  this.channels.forEach((channel, i) => {
                    if (channel.sid == sid)
                      channelIndex = i
                  })
                  this.channels = (this.channels as any).swap(channelIndex, 0)

                  if (channel.createdBy != identity && !(<any>channel.attributes).isPrivate) {
                    const videoRoom = await this.connectToVideoRoom(sid)
                    if (videoRoom.error) {
                      this._snackBar.open(videoRoom.error, null, { duration: 3000 })
                    }
                    return resolve(videoRoom)
                  }
                  return resolve();
                }
              });
          });
        });
    })

  }

  async generateVideoToken(roomId): Promise<any> {
    const $user = await this.tokenStorage.getUser().toPromise()
    const identity = JSON.parse($user.toString()).firstName
    return this.http
      .post('/api/twilio/video-token', { identity, deviceId: roomId })
      .toPromise()
      .then((data: any) => {
        this.setTwilioVideoToken(data.token);
        this.saveTwilioVideoToken(data.token);
        return data;
      })
  }

  public roomParticipants: any = {}

  async participantConnected(participant) {
    console.log('Participant "%s" connected', participant.identity);
    this.addParticipantAPI(participant.identity)
    this.sendMessage(`${participant.identity} joined the live stream.`)
  }

  participantDisconnected(participant) {
    console.log('Participant "%s" disconnected', participant.identity)
    this.sendMessage(`${participant.identity} left the live stream.`)
    this.endparticipant(participant.identity)
  }

  public isHostDisconnected: Boolean = false
  hostDisconnected(participant) {
    if (participant.identity == this.currentChannel.state.createdBy) {
      this.isHostDisconnected = true
    }
  }

  public async initUploadStream(stream, channel) {
    let mediaStream: MediaStream = new MediaStream([this.videoTrack])

    let options = { mimeType: "video/webm" };
    // if (!MediaRecorder.isTypeSupported(options.mimeType)) {
    //   console.log(options.mimeType + " is not Supported");
    //   options = { mimeType: "video/webm;codecs=vp8" };
    //   if (!MediaRecorder.isTypeSupported(options.mimeType)) {
    //     console.log(options.mimeType + " is not Supported");
    //     options = { mimeType: "video/webm" };
    //     if (!MediaRecorder.isTypeSupported(options.mimeType)) {
    //       console.log(options.mimeType + " is not Supported");
    //       options = { mimeType: "" };
    //     }
    //   }
    // }

    let mediaRecorder: MediaRecorder = new MediaRecorder(mediaStream, options)

    mediaRecorder.ondataavailable = async (event) => {
      if (event.data.size > 0) {
        const buffer = event.data
        this.socket.emitStreamData({ buffer })
      } else {
        console.log('No data Available')
      }
    }

    mediaRecorder.start(1000)

    mediaRecorder.onstart = async () => {
      const user = await this.tokenStorage.getUser().toPromise()
      const data = {
        stream, channel,
        user: JSON.parse(user.toString())._id
      }
      this.socket.emitStreamStarted(data)
    }

    setTimeout(() => {
      mediaRecorder.stop()
      console.log('10s stopping media recorder')
    }, 10000)
  }

  async connectToVideoRoom(roomId, title = null, screenTrack = null): Promise<any> {
    this.channelSid = roomId
    try {
      const VideoToken = await this.generateVideoToken(roomId)
      return new Promise((resolve, reject) => {
        if (screenTrack) {
          Video.connect(VideoToken.token, { name: roomId, tracks: screenTrack })
            .then(async room => {
              room.participants.forEach(participant => this.participantConnected(participant))
              room.on('participantConnected', participant => this.participantConnected(participant))
              room.on('participantDisconnected', participant => this.participantDisconnected(participant))
              room.once('disconnected', error => room.participants.forEach(participant => this.participantDisconnected(participant)))
              this.videoRoom = room
              console.log('>> ROOM:', room)
              const stream = await this.createStreamAPI(title)
              const channel = await this.getChannelAPI({ id: this.currentChannel.sid })
              setInterval(() => this.endStreamAPI(), 10000)
              this.sendMessage('Started Live Streaming.')
              console.log(channel)
              this.initUploadStream(stream._id, channel.channel._id)
              this.hostLocalVideoTrack = screenTrack[0]
              resolve({ room })
            })
            .catch(err => {
              console.log(err)
              reject(err)
            })
        } else {
          Video.connect(VideoToken.token, { name: roomId, tracks: [] })
            .then(async room => {
              try {
                this.videoRoom = room
                const roomHost = room.participants.values().next().value
                if (!roomHost) {
                  this.videoRoom.disconnect()
                  resolve({ error: "Channel doesn't have an active live streaming." })
                } else {
                  setTimeout(async () => {
                    const videoTrack = roomHost.videoTracks.values().next().value
                    const audioTrack = roomHost.audioTracks.values().next().value
                    if (!videoTrack) {
                      this.videoRoom.disconnect()
                      resolve({ error: "Channel doesn't have an active live streaming." })
                    } else {
                      this.isHostDisconnected = false
                      this.sharedScreen = videoTrack
                      this.sharedAudio = audioTrack
                      const stream = await this.getLiveStreamAPI()
                      this.videoStreamId = stream._id
                      resolve({ room, videoTrack, audioTrack })
                    }
                  }, 2000)
                }
              } catch (e) {
                resolve({ error: "Channel doesn't have an active live streaming." })
              }
            })
            .catch(err => {
              resolve({ error: "Channel doesn't have an active live streaming." })
            })
        }
      })
    } catch (e) {
      console.log('>> CONNECTION ERR:', e)
    }
  }

  async shareScreen(screenTrack) {
    return new Promise(async (resolve, reject) => {
      try {
        const share = await this.videoRoom.localParticipant.publishTrack(screenTrack);
        resolve(share)
      } catch (e) {
        console.log(e)
        reject(e)
      }
    })
  }

  createStreamAPI(title): Promise<any> {
    return this.http
      .post('/api/liveStreaming', { channelSid: this.channelSid, title })
      .toPromise()
      .then((res: any) => {
        this.videoStreamId = res._id
        return res
      })
  }

  async getLiveStreamAPI() {
    const channel = await this.getChannelAPI({ id: this.channelSid })
    return this.http
      .get(`/api/channel/${channel._id}/liveStream/recent`)
      .toPromise()
      .then((res: any) => {
        return res
      })
  }

  addParticipantAPI(username): Promise<any> {
    const startDate = new Date()

    return this.http.post(`/api/liveStreaming/${this.videoStreamId}/participant`, { startDate, username })
      .toPromise()
      .then(res => {
        return res
      })
  }

  async rateStreamAPI(rate): Promise<any> {
    const $user = await this.tokenStorage.getUser().toPromise()
    const { firstName } = JSON.parse($user.toString())

    return this.http.patch(`/api/liveStreaming/${this.videoStreamId}/participant/rate`, { rate, username: firstName })
      .toPromise()
      .then(res => {
        return res
      })
  }

  endparticipant(username): Promise<any> {
    return this.http.patch(`/api/liveStreaming/${this.videoStreamId}/participant/end`, { username })
      .toPromise()
      .then(res => {
        return res
      })
  }

  endStreamAPI(): Promise<any> {
    return this.http.patch(`/api/liveStreaming/${this.videoStreamId}/end`, {})
      .toPromise()
  }

  setTwilioToken(token): void {
    this.$tokenSource.next(token);
    (<any>window).twilioToken = token;
  }

  saveTwilioToken(token: string) {
    if (!token) return;
    window.localStorage.removeItem(TWILIO_TOKEN_KEY);
    window.localStorage.setItem(TWILIO_TOKEN_KEY, token);
  }

  setTwilioVideoToken(token): void {
    this.$tokenSource.next(token);
    (<any>window).twilioToken = token;
  }

  saveTwilioVideoToken(token: string) {
    if (!token) return;
    window.localStorage.removeItem(TWILIO_VIDEO_TOKEN_KEY);
    window.localStorage.setItem(TWILIO_VIDEO_TOKEN_KEY, token);
  }

  getTwilioToken(): string {
    return localStorage.getItem(TWILIO_TOKEN_KEY);
  }

  setStreamingEvents() {
    this.isStreamInitialized = true
    this.videoTrack.once("stopped", () => {
      this.isScreenSharing = false
    });
    this.videoTrack.once("started", async () => {
      this.isScreenSharing = true
      await this.shareToTwillio()
    });
  }

  setAudioEvents() {
    this.audioTrack.once("stopped", () => {
      this.isMuted = false
    });
    this.audioTrack.once("started", async () => {
      this.isMuted = true
      //TODO: send audio to twilio
      // await this.shareToTwillio()
    });
  }

  async shareToTwillio() {
    const screenTrack = [this.videoTrack, this.audioTrack]
    await this.connectToVideoRoom(this.channelSid, this.currentChannel.friendlyName, screenTrack)
  }

  getUserScreen(): Promise<LocalVideoTrack> {
    return new Promise(async (resolve, reject) => {
      const audioStream = await (navigator.mediaDevices as any).getUserMedia({
        video: false,
        audio: { echoCancellation: true, noiseSuppression: true, deviceId: "default" }
      })
      const videoStream = await (navigator.mediaDevices as any).getDisplayMedia({ video: true, audio: false })

      const videoTracks = videoStream.getTracks()
      const audioTracks = audioStream.getTracks()
      const videoList = videoTracks.filter(track => track.kind == 'video' ? true : false)
      const audioList = audioTracks.filter(track => track.kind == 'audio' ? true : false)
      this.videoTrack = videoList[0]
      this.audioTrack = audioList[0]
      let screenTrack = null
      let audioTrack = null
      if (videoList.length > 0) { screenTrack = new Video.LocalVideoTrack(videoList[0]) }
      if (audioList.length > 0) { audioTrack = new Audio.LocalAudioTrack(audioList[0]) }
      resolve({ screenTrack, audioTrack })
    })
  }
}

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Util } from "../util/util";
import { Message } from "twilio-chat/lib/message";
import { Channel } from "twilio-chat/lib/channel";
import Client from "twilio-chat";
import { TokenStorage } from '../auth/token.storage';
import { ChatService } from './chat.service'

const TWILIO_TOKEN_KEY = "TwilioToken"

@Injectable({
  providedIn: "root"
})
export class FriendChatService {

  public channels: any[] = []
  public friendsChannels: any = []
  public chatClient: Client;
  public messages: Message[] = []
  public activeTabs: any[] = []

  constructor(
    public http: HttpClient,
    public tokenStorage: TokenStorage,
    public chatService: ChatService
  ) { }

  connect() {
    this.chatClient = this.chatService.chatClient
  }

  public setUnreadMessageCount(count, recipient, requester): Promise<any> {
    return this.http.post('/api/notifications/unread-message-count', { count, recipient, requester })
      .toPromise()
      .then(res => res)
      .catch(err => err)
  }

  public getUnreadMessageCount(): Promise<any> {
    return this.http.get('/api/notifications/unread-message-count')
      .toPromise()
      .then(res => res)
      .catch(err => err)
  }

  public markReadMessageCount(): Promise<any> {
    return this.http.get('/api/notifications/mark-read-message-count')
      .toPromise()
      .then(res => res)
      .catch(err => err)
  }

  async getFriendChannels(): Promise<any> {
    this.chatClient.getPublicChannelDescriptors().then((channels: any) => {
      return channels.items.filter(channel => channel.friendlyName.startsWith('__hide__'))
    });
  }

  async getChannelByUniqueName(uniqueName): Promise<any> {
    return this.chatClient.getChannelByUniqueName(uniqueName)
  }

  createFriendsChannel(recipient: string, requester: string) {
    return new Promise((resolve, reject) => {
      try {
        this.getChannelByUniqueName(`private-${recipient}-${requester}`)
          .then(async channel => {
            console.log('>> CHANNEL FOUND')
            await this.updateFriendModel(channel.sid, recipient)
            await this.joinChannel(channel.sid, recipient)
            resolve()
          })
          .catch(async e => {
            console.log('>> CHANNEL NOT FOUND')
            const channel = await this.chatClient.createChannel({
              friendlyName: `__hide__${recipient}__${requester}__`,
              uniqueName: `private-${recipient}-${requester}`,
              attributes: { recipientJoined: false }
            })
            console.log('>> CHANNEL CREATED')
            await this.updateFriendModel(channel.sid, recipient)
            await this.joinChannel(channel.sid, recipient)
            resolve()
          })
      } catch (e) {
        console.log('>> createFriendsChannel error', e)
        reject(e)
      }
    })
  }

  async updateFriendModel(channelSID: string, recipient: string) {
    try {
      const update = await this.http.patch(`/api/friends/update-sid`, { recipient, channelSID }).toPromise()
      return update
    } catch (e) {
      return e
    }
  }

  joinChannel(channelSID: string, recipient: string, user: any = {}) {
    return new Promise(async (resolve, reject) => {
      this.chatClient.getChannelBySid(channelSID)
        .then(channel => {
          channel.join()
            .then(async r => {
              this.friendsChannels.push({ channel, recipient, ...user, messages: [] })
              await this.getMessages(this.friendsChannels[this.friendsChannels.length - 1])
              await this.listenToMessages(this.friendsChannels[this.friendsChannels.length - 1])
              resolve(this.friendsChannels[this.friendsChannels.length - 1])
            })
            .catch(async e => {
              if (e.message.indexOf('already exists') > 0) {
                this.friendsChannels.push({ channel, recipient, ...user, messages: [] })
                await this.getMessages(this.friendsChannels[this.friendsChannels.length - 1])
                await this.listenToMessages(this.friendsChannels[this.friendsChannels.length - 1])
                resolve(this.friendsChannels[this.friendsChannels.length - 1])
              }
            })
        })
    })
  }

  async getMessages(channelObj) {
    const { channel } = channelObj
    channelObj.isLoadingMessages = true
    return channel.getMessages()
      .then(m => {
        channelObj.isLoadingMessages = false
        channelObj.messages = m.items
        return channelObj
      })
  }

  listenToMessages(channelObj) {
    const { channel } = channelObj
    channel.on('messageAdded', (m) => {
      channelObj.messages.push(m)
      this.activateChatTab(channelObj)
    });
  }

  activateChatTab($friend) {
    if (!this.activeTabs.filter(friend => !!(friend.recipient == $friend.recipient)).length) {
      this.activeTabs.push($friend)
    }
  }
}

import { Injectable } from '@angular/core'
import { TokenStorage } from '../auth/token.storage'
import * as io from 'socket.io-client'
import { Observable } from 'rxjs'

@Injectable({
  providedIn: 'root'
})
export class Socket {
  private url: string = 'http://localhost:4040'
  public socket
  public socketId

  constructor(
    private tokenStorage: TokenStorage
  ) {
    this.socket = io(this.url)
    this.tokenStorage.getUser()
      .toPromise()
      .then(user => {
        const { _id } = JSON.parse(user.toString())
        this.socket.emit('connection-data', { _id })
        this.socketId = this.socket.id
      })
  }

  emitStreamData({ buffer }) {
    this.socket.emit('stream-data-available', { buffer })
  }

  emitStreamStarted({ user, channel, stream }) {
    this.socket.emit('stream-data-started', { stream, channel, user })
  }

  addConnectionEvent(friend) {
    friend.onConnect = (): Observable<any> => {
      return new Observable(observer => {
        this.socket.on(`user-connected-${friend.user._id}`, data => {
          observer.next(data)
        })
        return () => {
          this.socket.disconnect()
        }
      })
    }
    friend.onDisconnect = (): Observable<any> => {
      return new Observable(observer => {
        this.socket.on(`user-disconnected-${friend.user._id}`, data => {
          observer.next(data)
        })
        return () => {
          this.socket.disconnect()
        }
      })
    }
    return friend
  }

  listenToFriendRequests(): Observable<any> {
    return new Observable(observer => {
      this.socket.on(`friend-request-recieved-${this.socketId}`, data => {
        console.log('>> RECIEVED FRIEND REQUEST')
        observer.next(data)
      })
      return () => {
        this.socket.disconnect()
      }
    })
  }

  listenToAcceptedFriendRequests(): Observable<any> {
    return new Observable(observer => {
      this.socket.on(`friend-request-accepted-${this.socketId}`, data => {
        console.log('>> ACCEPTED FRIEND REQUEST')
        observer.next(data)
      })
      return () => {
        this.socket.disconnect()
      }
    })
  }

  listenToMaintenanceMode(): Observable<any> {
    return new Observable(observer => {
      this.socket.on(`maintenance-mode`, data => {
        console.log('>> RECEIVED MAINTENANCE MODE')
        observer.next(data)
      })
      return () => {
        this.socket.disconnect()
      }
    })
  }

  emitMaintenanceMode({ isEnabled, message }) {
    this.socket.emit(`maintenance-mode`, { isEnabled, message })
  }

  listenToFriendMessage(): Observable<any> {
    return new Observable(observer => {
      this.socket.on(`friend-message-recieved-${this.socketId}`, data => {
        console.log('>> RECIEVED FRIEND MESSAGE')
        observer.next(data)
      })
      return () => {
        this.socket.disconnect()
      }
    })
  }

}

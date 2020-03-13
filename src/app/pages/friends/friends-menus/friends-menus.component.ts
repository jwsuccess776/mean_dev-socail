import { Component, Input } from '@angular/core';
import { FriendService } from './../../../services/friend.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  template: `
    <button class="app-frienditem-td-button" title="Friend options" mat-icon-button
      (click)="$event.stopPropagation();" [matMenuTriggerFor]="friends_more_menu">
      <mat-icon>more_vert</mat-icon>
    </button>
    <mat-menu #friends_more_menu="matMenu">
      <a (click)='sendFriendRequest()' mat-list-item class="dd-usr-item">
        <mat-icon class="dd-usr-item-more">person_add</mat-icon>
        <span class="nav-caption"> Add </span>
      </a>
      <a (click)='blockUser()' mat-list-item class="dd-usr-item dd-usr-item-more">
        <mat-icon class="dd-usr-item-more">block</mat-icon>
        <span class="nav-caption"> Block </span>
      </a>
    </mat-menu>
  `,
  styleUrls: ['./friends-menus.component.scss'],
  selector: 'friends-menu-one'
})
export class FriendsMenuOne {
  @Input() friend: any
  constructor(
    private friendService: FriendService,
    private _snackBar: MatSnackBar
  ) { }

  async sendFriendRequest() {
    try {
      const request = await this.friendService.sendFriendRequest({ recipient: this.friend._id })
      this._snackBar.open(`Friend request sent to ${this.friend.firstName}`, null, { duration: 5000 })
      console.log(request)
    } catch (e) {
      console.log(e)
    }
  }

  async blockUser() {
    try {
      const request = await this.friendService.blockUser({ recipient: this.friend._id })
      this._snackBar.open(`You've blocked ${this.friend.firstName}`, null, { duration: 5000 })
    } catch (e) {
      console.log(e)
    }
  }

}

@Component({
  template: `
    <button class="app-frienditem-td-button" title="Friend options" mat-icon-button
      (click)="$event.stopPropagation();" [matMenuTriggerFor]="friends_more_menu">
      <mat-icon>more_vert</mat-icon>
    </button>
    <mat-menu #friends_more_menu="matMenu">
      <a (click)='cancelFriendRequest()' mat-list-item class="dd-usr-item">
        <mat-icon class="dd-usr-item-more">person_add_disabled</mat-icon>
        <span class="nav-caption"> Cancel Request </span>
      </a>
      <a (click)='blockUser()' mat-list-item class="dd-usr-item dd-usr-item-more">
        <mat-icon class="dd-usr-item-more">block</mat-icon>
        <span class="nav-caption"> Block </span>
      </a>
    </mat-menu>
  `,
  styleUrls: ['./friends-menus.component.scss'],
  selector: 'friends-menu-two'
})
export class FriendsMenuTwo {
  @Input() friend: any
  constructor(
    private friendService: FriendService,
    private _snackBar: MatSnackBar
  ) { }

  async cancelFriendRequest() {
    try {
      const request = await this.friendService.cancelFriendRequest({ recipient: this.friend._id })
      this._snackBar.open(`Friend request to ${this.friend.firstName} has been cancelled.`, null, { duration: 5000 })
    } catch (e) {
      console.log(e)
    }
  }

  async blockUser() {
    try {
      const request = await this.friendService.blockUser({ recipient: this.friend._id })
      this._snackBar.open(`You've blocked ${this.friend.firstName}`, null, { duration: 5000 })
    } catch (e) {
      console.log(e)
    }
  }

}

@Component({
  template: `
    <button class="app-frienditem-td-button" title="Friend options" mat-icon-button
      (click)="$event.stopPropagation();" [matMenuTriggerFor]="friends_more_menu">
      <mat-icon>more_vert</mat-icon>
    </button>
    <mat-menu #friends_more_menu="matMenu">
      <a (click)='acceptFriendRequest()' mat-list-item class="dd-usr-item">
        <mat-icon class="dd-usr-item-more">how_to_reg</mat-icon>
        <span class="nav-caption"> Accept </span>
      </a>
      <a (click)='declineFriendRequest()' mat-list-item class="dd-usr-item dd-usr-item-more">
        <mat-icon class="dd-usr-item-more">person_add_disabled</mat-icon>
        <span class="nav-caption"> Decline </span>
      </a>
    </mat-menu>
  `,
  styleUrls: ['./friends-menus.component.scss'],
  selector: 'friends-menu-three'
})
export class FriendsMenuThree {
  @Input() friend: any
  constructor(
    private friendService: FriendService,
    private _snackBar: MatSnackBar
  ) { }

  async acceptFriendRequest() {
    try {
      const request = await this.friendService.acceptFriendRequest({ requester: this.friend._id })
      this._snackBar.open(`You and ${this.friend.firstName} are now friends.`, null, { duration: 5000 })
    } catch (e) {
      console.log(e)
      this._snackBar.open(`Something went wrong, please try again shortly.`, null, { duration: 5000 })
    }
  }

  async declineFriendRequest() {
    try {
      const request = await this.friendService.declineFriendRequest({ requester: this.friend._id })
      this._snackBar.open(`You've declined a friend request from ${this.friend.firstName}.`, null, { duration: 5000 })
      this.friendService.getFriendList()
    } catch (e) {
      console.log(e)
      this._snackBar.open(`Something went wrong, please try again shortly.`, null, { duration: 5000 })
    }
  }

}

@Component({
  template: `
    <button class="app-frienditem-td-button" title="Friend options" mat-icon-button
      (click)="$event.stopPropagation();" [matMenuTriggerFor]="friends_more_menu">
      <mat-icon>more_vert</mat-icon>
    </button>
    <mat-menu #friends_more_menu="matMenu">
      <a (click)='removeFriend()' mat-list-item class="dd-usr-item">
        <mat-icon class="dd-usr-item-more">remove</mat-icon>
        <span class="nav-caption">Remove</span>
      </a>
      <a (click)='blockUser()' mat-list-item class="dd-usr-item dd-usr-item-more">
        <mat-icon class="dd-usr-item-more">block</mat-icon>
        <span class="nav-caption">Block</span>
      </a>
    </mat-menu>
  `,
  styleUrls: ['./friends-menus.component.scss'],
  selector: 'friends-menu-four'
})
export class FriendsMenuFour {
  @Input() friend: any
  constructor(
    private friendService: FriendService,
    private _snackBar: MatSnackBar
  ) { }

  async removeFriend() {
    try {
      const request = await this.friendService.cancelFriendRequest({ recipient: this.friend._id })
      this._snackBar.open(`You've removed ${this.friend.firstName} from your friend list.`, null, { duration: 5000 })
    } catch (e) {
      console.log(e)
    }
  }

  async blockUser() {
    try {
      const request = await this.friendService.blockUser({ recipient: this.friend._id })
      this._snackBar.open(`You've blocked ${this.friend.firstName}`, null, { duration: 5000 })
    } catch (e) {
      console.log(e)
    }
  }

}

@Component({
  template: `
    <button class="app-frienditem-td-button" title="Friend options" mat-icon-button
      (click)="$event.stopPropagation();" [matMenuTriggerFor]="friends_more_menu">
      <mat-icon>more_vert</mat-icon>
    </button>
    <mat-menu #friends_more_menu="matMenu">
      <a (click)='unBlockUser()' mat-list-item class="dd-usr-item dd-usr-item-more">
        <mat-icon class="dd-usr-item-more">check_circle_outline</mat-icon>
        <span class="nav-caption">Unblock</span>
      </a>
    </mat-menu>
  `,
  styleUrls: ['./friends-menus.component.scss'],
  selector: 'friends-menu-five'
})
export class FriendsMenuFive {
  @Input() friend: any
  constructor(
    private friendService: FriendService,
    private _snackBar: MatSnackBar
  ) { }

  async unBlockUser() {
    try {
      const request = await this.friendService.unBlockUser({ recipient: this.friend._id })
      this._snackBar.open(`You've unblocked ${this.friend.firstName}`, null, { duration: 5000 })
    } catch (e) {
      console.log(e)
    }
  }

}

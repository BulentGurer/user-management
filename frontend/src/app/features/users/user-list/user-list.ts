import { ChangeDetectionStrategy, Component } from '@angular/core';

/** The user list. Its table is added in the next step. */
@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.html',
  styleUrl: './user-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserList {}

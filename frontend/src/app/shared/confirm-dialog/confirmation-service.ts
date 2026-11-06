import { inject, Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { map, Observable } from 'rxjs';
import { ConfirmDialog, ConfirmDialogData } from './confirm-dialog';

/**
 * Asks the user to confirm an action. Components depend on this question,
 * not on how it is shown (MatDialog), which also keeps their tests simple.
 */
@Injectable({ providedIn: 'root' })
export class ConfirmationService {
  private readonly dialog = inject(MatDialog);

  /** Emits true only if the user confirms; Cancel, Escape and a backdrop click mean no. */
  confirm(data: ConfirmDialogData): Observable<boolean> {
    return this.dialog
      .open<ConfirmDialog, ConfirmDialogData, boolean>(ConfirmDialog, {
        data,
        // Announced as an alert: the user must answer before going on.
        role: 'alertdialog',
      })
      .afterClosed()
      .pipe(map((confirmed) => confirmed === true));
  }
}

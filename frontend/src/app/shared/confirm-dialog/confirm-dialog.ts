import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmLabel: string;
  /** Shows the confirm button in the error colour, for actions that cannot be undone. */
  destructive?: boolean;
}

/**
 * A yes/no question in a modal dialog. It closes with true only through the
 * confirm button. Cancel comes first and gets the initial focus, so pressing
 * Enter right away never confirms by accident. Opened through
 * ConfirmationService, not directly.
 */
@Component({
  selector: 'app-confirm-dialog',
  imports: [MatButtonModule, MatDialogModule],
  templateUrl: './confirm-dialog.html',
  styleUrl: './confirm-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmDialog {
  protected readonly data = inject<ConfirmDialogData>(MAT_DIALOG_DATA);
}

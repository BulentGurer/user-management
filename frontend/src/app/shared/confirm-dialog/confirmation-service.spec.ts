import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { ConfirmDialogData } from './confirm-dialog';
import { ConfirmationService } from './confirmation-service';

const QUESTION: ConfirmDialogData = {
  title: 'Delete user?',
  message: 'Mehmet Demir will be deleted permanently.',
  confirmLabel: 'Delete',
  destructive: true,
};

describe('ConfirmationService', () => {
  let service: ConfirmationService;

  beforeEach(() => {
    service = TestBed.inject(ConfirmationService);
  });

  afterEach(() => {
    document.querySelectorAll('.cdk-overlay-container').forEach((container) => container.remove());
  });

  /** Opens the dialog and renders it; returns the answer the dialog will give. */
  function ask(data = QUESTION): Promise<boolean> {
    const answer = firstValueFrom(service.confirm(data));
    TestBed.tick();
    return answer;
  }

  function dialog(): HTMLElement {
    return document.querySelector<HTMLElement>('mat-dialog-container')!;
  }

  function button(label: string): HTMLButtonElement {
    return Array.from(dialog().querySelectorAll('button')).find(
      (candidate) => candidate.textContent?.trim() === label,
    )!;
  }

  it('shows the question as an alert dialog', async () => {
    void ask();

    expect(dialog().getAttribute('role')).toBe('alertdialog');
    expect(dialog().textContent).toContain('Delete user?');
    expect(dialog().textContent).toContain('Mehmet Demir will be deleted permanently.');
    expect(button('Delete').classList).toContain('destructive');
  });

  it('answers yes when the user confirms', async () => {
    const answer = ask();

    button('Delete').click();

    await expect(answer).resolves.toBe(true);
  });

  it('answers no when the user cancels', async () => {
    const answer = ask();

    button('Cancel').click();

    await expect(answer).resolves.toBe(false);
  });

  it('answers no when the dialog is dismissed with Escape', async () => {
    const answer = ask();

    // The CDK overlay still reads the legacy keyCode.
    dialog().dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', keyCode: 27, bubbles: true }),
    );

    await expect(answer).resolves.toBe(false);
  });

  it('uses the normal button style for actions that can be undone', async () => {
    void ask({ ...QUESTION, destructive: false });

    expect(button('Delete').classList).not.toContain('destructive');
  });
});

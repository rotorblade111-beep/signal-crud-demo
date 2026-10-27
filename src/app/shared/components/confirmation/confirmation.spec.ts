import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConfirmationComponent, ConfirmationButton } from './confirmation';

describe('ConfirmationComponent', () => {
  let fixture: ComponentFixture<ConfirmationComponent>;

  const makeButtons = (onConfirm: () => void, onCancel: () => void): ConfirmationButton[] => [
    { name: 'Cancel', type: 'secondary', action: onCancel },
    { name: 'Delete', type: 'primary',   action: onConfirm }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfirmationComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmationComponent);
    fixture.componentRef.setInput(
      'message',
      "Are you sure you want to delete this post? This action can't be undone."
    );
    fixture.componentRef.setInput('buttons', makeButtons(() => {}, () => {}));
    fixture.detectChanges();
  });

  it('displays the supplied message and button labels', () => {
    expect(fixture.nativeElement.textContent).toContain(
      "Are you sure you want to delete this post? This action can't be undone."
    );
    expect(fixture.nativeElement.querySelector('[role="alertdialog"]')).not.toBeNull();
    expect(
      Array.from(fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>).map(
        btn => btn.textContent?.trim() ?? ''
      )
    ).toEqual(['Cancel', 'Delete']);
  });

  it('calls the action function of the clicked button', () => {
    const onConfirm = vi.fn();
    const onCancel  = vi.fn();
    fixture.componentRef.setInput('buttons', makeButtons(onConfirm, onCancel));
    fixture.detectChanges();

    const buttons = fixture.nativeElement.querySelectorAll('button');
    buttons[0].click(); // Cancel
    buttons[1].click(); // Delete

    expect(onCancel).toHaveBeenCalledOnce();
    expect(onConfirm).toHaveBeenCalledOnce();
  });
});

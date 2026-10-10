import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConfirmationComponent } from './confirmation';

describe('ConfirmationComponent', () => {
  let fixture: ComponentFixture<ConfirmationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfirmationComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmationComponent);
    fixture.componentRef.setInput(
      'message',
      "Are you sure you want to delete this post? This action can't be undone."
    );
    fixture.detectChanges();
  });

  it('displays the supplied message and Yes/No controls', () => {
    expect(fixture.nativeElement.textContent).toContain(
      "Are you sure you want to delete this post? This action can't be undone."
    );
    expect(fixture.nativeElement.querySelector('[role="alertdialog"]')).not.toBeNull();
    expect(Array.from(fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>).map(
      button => button.textContent?.trim() ?? ''
    )).toEqual(['Yes', 'No']);
  });

  it('emits separate confirmation and cancellation events', () => {
    const confirmed = vi.fn();
    const cancelled = vi.fn();
    fixture.componentInstance.confirmed.subscribe(confirmed);
    fixture.componentInstance.cancelled.subscribe(cancelled);

    const buttons = fixture.nativeElement.querySelectorAll('button');
    buttons[0].click();
    buttons[1].click();

    expect(confirmed).toHaveBeenCalledOnce();
    expect(cancelled).toHaveBeenCalledOnce();
  });
});

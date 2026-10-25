import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TooltipComponent } from './tooltip';

@Component({
  standalone: true,
  imports: [TooltipComponent],
  template: `
    <app-tooltip [text]="text" [position]="position" [disabled]="disabled">
      <button type="button">Trigger Button</button>
    </app-tooltip>
  `
})
class TestHostComponent {
  text = 'Helpful tooltip information';
  position: 'top' | 'bottom' | 'left' | 'right' = 'top';
  disabled = false;
}

describe('TooltipComponent', () => {
  let fixture: ComponentFixture<TooltipComponent>;
  let component: TooltipComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TooltipComponent, TestHostComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(TooltipComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('text', 'Pagination info tooltip');
    fixture.detectChanges();
  });

  it('creates the tooltip component and remains hidden by default', () => {
    expect(component).toBeTruthy();
    expect(component.isOpen()).toBe(false);
    expect(fixture.nativeElement.querySelector('[role="tooltip"]')).toBeNull();
    expect(fixture.nativeElement.getAttribute('aria-describedby')).toBeNull();
  });

  it('shows tooltip on mouseenter and hides on mouseleave', () => {
    fixture.nativeElement.dispatchEvent(new MouseEvent('mouseenter'));
    fixture.detectChanges();

    expect(component.isOpen()).toBe(true);
    const tooltipEl = fixture.nativeElement.querySelector('[role="tooltip"]');
    expect(tooltipEl).not.toBeNull();
    expect(tooltipEl?.textContent).toContain('Pagination info tooltip');
    expect(fixture.nativeElement.getAttribute('aria-describedby')).toBe(component.tooltipId);

    fixture.nativeElement.dispatchEvent(new MouseEvent('mouseleave'));
    fixture.detectChanges();

    expect(component.isOpen()).toBe(false);
    expect(fixture.nativeElement.querySelector('[role="tooltip"]')).toBeNull();
  });

  it('shows tooltip on focusin and hides on focusout', () => {
    fixture.nativeElement.dispatchEvent(new FocusEvent('focusin'));
    fixture.detectChanges();

    expect(component.isOpen()).toBe(true);
    expect(fixture.nativeElement.querySelector('[role="tooltip"]')).not.toBeNull();

    fixture.nativeElement.dispatchEvent(new FocusEvent('focusout'));
    fixture.detectChanges();

    expect(component.isOpen()).toBe(false);
    expect(fixture.nativeElement.querySelector('[role="tooltip"]')).toBeNull();
  });

  it('hides tooltip when Escape key is pressed', () => {
    fixture.nativeElement.dispatchEvent(new MouseEvent('mouseenter'));
    fixture.detectChanges();
    expect(component.isOpen()).toBe(true);

    const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
    fixture.nativeElement.dispatchEvent(escapeEvent);
    fixture.detectChanges();

    expect(component.isOpen()).toBe(false);
    expect(fixture.nativeElement.querySelector('[role="tooltip"]')).toBeNull();
  });

  it('does not display tooltip when disabled is true', () => {
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();

    fixture.nativeElement.dispatchEvent(new MouseEvent('mouseenter'));
    fixture.detectChanges();

    expect(component.isOpen()).toBe(false);
    expect(fixture.nativeElement.querySelector('[role="tooltip"]')).toBeNull();

    fixture.nativeElement.dispatchEvent(new FocusEvent('focusin'));
    fixture.detectChanges();

    expect(component.isOpen()).toBe(false);
    expect(fixture.nativeElement.querySelector('[role="tooltip"]')).toBeNull();
  });

  it('does not display tooltip when text is empty or blank', () => {
    fixture.componentRef.setInput('text', '   ');
    fixture.detectChanges();

    fixture.nativeElement.dispatchEvent(new MouseEvent('mouseenter'));
    fixture.detectChanges();

    expect(component.isOpen()).toBe(false);
    expect(fixture.nativeElement.querySelector('[role="tooltip"]')).toBeNull();
  });

  it('updates positioning classes for top, bottom, left, and right', () => {
    fixture.componentRef.setInput('position', 'top');
    fixture.detectChanges();
    expect(component.positionClasses()).toContain('bottom-full');

    fixture.componentRef.setInput('position', 'bottom');
    fixture.detectChanges();
    expect(component.positionClasses()).toContain('top-full');

    fixture.componentRef.setInput('position', 'left');
    fixture.detectChanges();
    expect(component.positionClasses()).toContain('right-full');

    fixture.componentRef.setInput('position', 'right');
    fixture.detectChanges();
    expect(component.positionClasses()).toContain('left-full');
  });

  it('supports programmatic show, hide, and toggle methods', () => {
    component.show();
    fixture.detectChanges();
    expect(component.isOpen()).toBe(true);

    component.toggle();
    fixture.detectChanges();
    expect(component.isOpen()).toBe(false);

    component.toggle();
    fixture.detectChanges();
    expect(component.isOpen()).toBe(true);

    component.hide();
    fixture.detectChanges();
    expect(component.isOpen()).toBe(false);
  });

  it('respects controlled visible input override', () => {
    fixture.componentRef.setInput('visible', true);
    fixture.detectChanges();
    expect(component.isOpen()).toBe(true);

    fixture.componentRef.setInput('visible', false);
    fixture.detectChanges();
    expect(component.isOpen()).toBe(false);
  });

  it('emits opened and closed events when visibility changes', async () => {
    const openedSpy = vi.fn();
    const closedSpy = vi.fn();

    component.opened.subscribe(openedSpy);
    component.closed.subscribe(closedSpy);

    component.show();
    await fixture.whenStable();
    expect(openedSpy).toHaveBeenCalledOnce();

    component.hide();
    await fixture.whenStable();
    expect(closedSpy).toHaveBeenCalledOnce();
  });

  it('projects content and displays tooltip inside host component', () => {
    const hostFixture = TestBed.createComponent(TestHostComponent);
    hostFixture.detectChanges();

    const button = hostFixture.nativeElement.querySelector('button');
    expect(button).not.toBeNull();
    expect(button?.textContent).toBe('Trigger Button');

    const tooltipEl = hostFixture.nativeElement.querySelector('app-tooltip');
    tooltipEl.dispatchEvent(new MouseEvent('mouseenter'));
    hostFixture.detectChanges();

    const tooltipPopup = hostFixture.nativeElement.querySelector('[role="tooltip"]');
    expect(tooltipPopup).not.toBeNull();
    expect(tooltipPopup?.textContent).toContain('Helpful tooltip information');
  });
});


import {
  Component,
  computed,
  effect,
  input,
  OnDestroy,
  output,
  signal
} from '@angular/core';

export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

@Component({
  selector: 'app-tooltip',
  standalone: true,
  templateUrl: './tooltip.html',
  host: {
    'class': 'relative inline-flex focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-lg',
    '[attr.aria-describedby]': 'isOpen() ? tooltipId : null',
    '[attr.tabindex]': 'tabIndex()',
    '(mouseenter)': 'onMouseEnter()',
    '(mouseleave)': 'onMouseLeave()',
    '(focusin)': 'onFocusIn()',
    '(focusout)': 'onFocusOut()',
    '(keydown.escape)': 'onKeyDownEscape($event)'
  }
})
export class TooltipComponent implements OnDestroy {
  private static idSequence = 0;
  readonly tooltipId = `app-tooltip-${++TooltipComponent.idSequence}`;

  text = input<string>('');
  position = input<TooltipPosition>('top');
  disabled = input<boolean>(false);
  visible = input<boolean | undefined>(undefined);
  customClass = input<string>('');
  showDelay = input<number>(0);
  hideDelay = input<number>(0);
  tabindex = input<number | null | undefined>(undefined);

  opened = output<void>();
  closed = output<void>();

  private isHovered = signal(false);
  private isFocused = signal(false);
  private showTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private hideTimeoutId: ReturnType<typeof setTimeout> | null = null;

  readonly isOpen = computed(() => {
    if (this.disabled() || !this.text()?.trim()) {
      return false;
    }
    const controlled = this.visible();
    if (controlled !== undefined) {
      return controlled;
    }
    return this.isHovered() || this.isFocused();
  });

  readonly tabIndex = computed(() => {
    const explicit = this.tabindex();
    if (explicit !== undefined) {
      return explicit;
    }
    return !this.disabled() ? 0 : null;
  });

  readonly positionClasses = computed(() => {
    switch (this.position()) {
      case 'bottom':
        return 'top-full left-1/2 -translate-x-1/2 mt-2';
      case 'left':
        return 'right-full top-1/2 -translate-y-1/2 mr-2';
      case 'right':
        return 'left-full top-1/2 -translate-y-1/2 ml-2';
      case 'top':
      default:
        return 'bottom-full left-1/2 -translate-x-1/2 mb-2';
    }
  });

  readonly arrowClasses = computed(() => {
    const base = 'absolute h-0 w-0 pointer-events-none';
    switch (this.position()) {
      case 'bottom':
        return `${base} bottom-full left-1/2 -translate-x-1/2 border-x-4 border-x-transparent border-b-4 border-b-slate-900 border-t-0`;
      case 'left':
        return `${base} left-full top-1/2 -translate-y-1/2 border-y-4 border-y-transparent border-l-4 border-l-slate-900 border-r-0`;
      case 'right':
        return `${base} right-full top-1/2 -translate-y-1/2 border-y-4 border-y-transparent border-r-4 border-r-slate-900 border-l-0`;
      case 'top':
      default:
        return `${base} top-full left-1/2 -translate-x-1/2 border-x-4 border-x-transparent border-t-4 border-t-slate-900 border-b-0`;
    }
  });

  readonly tooltipClasses = computed(() => {
    const base =
      'absolute z-50 w-max max-w-xs rounded-md bg-slate-900 px-2.5 py-1.5 text-center text-xs font-medium text-white shadow-lg pointer-events-none transition-all duration-150 border border-slate-800';
    const custom = this.customClass().trim();
    return custom ? `${base} ${this.positionClasses()} ${custom}` : `${base} ${this.positionClasses()}`;
  });

  constructor() {
    let wasOpen = false;
    effect(() => {
      const open = this.isOpen();
      if (open !== wasOpen) {
        if (open) {
          this.opened.emit();
        } else {
          this.closed.emit();
        }
        wasOpen = open;
      }
    });
  }

  show(): void {
    this.clearTimeouts();
    if (this.disabled() || !this.text()?.trim()) {
      return;
    }
    const delay = this.showDelay();
    if (delay > 0) {
      this.showTimeoutId = setTimeout(() => {
        this.isHovered.set(true);
      }, delay);
    } else {
      this.isHovered.set(true);
    }
  }

  hide(): void {
    this.clearTimeouts();
    const delay = this.hideDelay();
    if (delay > 0) {
      this.hideTimeoutId = setTimeout(() => {
        this.isHovered.set(false);
        this.isFocused.set(false);
      }, delay);
    } else {
      this.isHovered.set(false);
      this.isFocused.set(false);
    }
  }

  toggle(): void {
    if (this.isOpen()) {
      this.hide();
    } else {
      this.show();
    }
  }

  onMouseEnter(): void {
    this.show();
  }

  onMouseLeave(): void {
    this.hide();
  }

  onFocusIn(): void {
    this.clearTimeouts();
    if (!this.disabled() && this.text()?.trim()) {
      this.isFocused.set(true);
    }
  }

  onFocusOut(): void {
    this.clearTimeouts();
    this.isFocused.set(false);
  }

  onKeyDownEscape(event: Event): void {
    if (this.isOpen()) {
      event.stopPropagation();
      this.hide();
    }
  }

  ngOnDestroy(): void {
    this.clearTimeouts();
  }

  private clearTimeouts(): void {
    if (this.showTimeoutId !== null) {
      clearTimeout(this.showTimeoutId);
      this.showTimeoutId = null;
    }
    if (this.hideTimeoutId !== null) {
      clearTimeout(this.hideTimeoutId);
      this.hideTimeoutId = null;
    }
  }
}

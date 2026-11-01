import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PostPaginationComponent } from './post-pagination';

describe('PostPaginationComponent', () => {
  let fixture: ComponentFixture<PostPaginationComponent>;
  let component: PostPaginationComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PostPaginationComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(PostPaginationComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('currentPage', 1);
    fixture.componentRef.setInput('totalPages', 3);
    fixture.detectChanges();
  });

  it('renders the current page and page buttons with the existing accessible labels', () => {
    const buttons = Array.from(
      fixture.nativeElement.querySelectorAll('button')
    ) as HTMLButtonElement[];

    expect(buttons.map(button => button.textContent?.trim())).toEqual([
      'Previous',
      '1',
      '2',
      '3',
      'Next'
    ]);
    expect(buttons[0].disabled).toBe(true);
    expect(buttons[1].getAttribute('aria-current')).toBe('page');
    expect(buttons[1].getAttribute('aria-label')).toBe('Page 1');
    expect(buttons[4].disabled).toBe(false);
  });

  it('emits only valid page changes from page and navigation buttons', () => {
    const pageChange = vi.fn();
    component.pageChange.subscribe(pageChange);

    component.goToPage(0);
    component.goToPage(4);
    expect(pageChange).not.toHaveBeenCalled();

    component.goToPage(2);
    expect(pageChange).toHaveBeenCalledOnce();
    expect(pageChange).toHaveBeenCalledWith(2);
  });

  it('updates disabled navigation buttons and tooltip text on the last page', () => {
    fixture.componentRef.setInput('currentPage', 3);
    fixture.detectChanges();

    const buttons = Array.from(
      fixture.nativeElement.querySelectorAll('button')
    ) as HTMLButtonElement[];
    expect(buttons[0].disabled).toBe(false);
    expect(buttons[4].disabled).toBe(true);
    expect(component.previousTooltipText()).toBe('');
    expect(component.nextTooltipText()).toBe(
      'No next pages to paginate to due to the page number being invalid'
    );

    const nextTooltip = fixture.nativeElement.querySelectorAll('app-tooltip')[1] as HTMLElement;
    nextTooltip.dispatchEvent(new MouseEvent('mouseenter'));
    fixture.detectChanges();
    expect(nextTooltip.querySelector('[role="tooltip"]')?.textContent).toContain(
      'No next pages to paginate to due to the page number being invalid'
    );
  });
});

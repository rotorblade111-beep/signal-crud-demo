import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PostFilters, PostFiltersComponent } from './post-filters';

describe('PostFiltersComponent', () => {
  let fixture: ComponentFixture<PostFiltersComponent>;
  let component: PostFiltersComponent;
  const filters: PostFilters = {
    title: '',
    body: '',
    createdFrom: '',
    createdTo: ''
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PostFiltersComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(PostFiltersComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('filters', filters);
    fixture.detectChanges();
  });

  it('emits title and body search changes without dropping date filters', () => {
    const filtersChange = vi.fn();
    component.filtersChange.subscribe(filtersChange);
    component.updateTextFilter('title', 'angular');
    component.updateTextFilter('body', 'signals');

    expect(filtersChange).toHaveBeenNthCalledWith(1, { ...filters, title: 'angular' });
    expect(filtersChange).toHaveBeenNthCalledWith(2, { ...filters, body: 'signals' });
  });

  it('provides one date picker for either endpoint of an inclusive date range', () => {
    const from = fixture.nativeElement.querySelector(
      'input[aria-label="Created from date"]'
    ) as HTMLInputElement;
    const to = fixture.nativeElement.querySelector(
      'input[aria-label="Created to date"]'
    ) as HTMLInputElement;

    expect(from.type).toBe('date');
    expect(to.type).toBe('date');
    expect(fixture.nativeElement.textContent).toContain(
      'Choose one date to match that day, or both dates for a range.'
    );
  });

  it('keeps date ranges valid when the selected endpoint crosses the other', () => {
    const filtersChange = vi.fn();
    component.filtersChange.subscribe(filtersChange);
    fixture.componentRef.setInput('filters', {
      ...filters,
      createdFrom: '2026-10-10',
      createdTo: '2026-10-20'
    });

    component.updateDateFilter('createdFrom', '2026-10-25');

    expect(filtersChange).toHaveBeenCalledWith({
      ...filters,
      createdFrom: '2026-10-25',
      createdTo: '2026-10-25'
    });
  });

  it('clears both ends of the date filter without changing text filters', () => {
    const filtersChange = vi.fn();
    component.filtersChange.subscribe(filtersChange);
    fixture.componentRef.setInput('filters', {
      ...filters,
      title: 'angular',
      createdFrom: '2026-10-10',
      createdTo: '2026-10-20'
    });

    component.clearDateFilter();

    expect(filtersChange).toHaveBeenCalledWith({
      ...filters,
      title: 'angular',
      createdFrom: '',
      createdTo: ''
    });
  });
});

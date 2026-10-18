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

  it('provides two date pickers and explains how to select a single date or range', () => {
    const end = fixture.nativeElement.querySelector(
      'input[aria-label="Created end date"]'
    ) as HTMLInputElement;
    const start = fixture.nativeElement.querySelector(
      'input[aria-label="Created start date"]'
    ) as HTMLInputElement;

    expect(end.type).toBe('date');
    expect(start.type).toBe('date');
    expect(fixture.nativeElement.textContent).toContain(
      'Choose the same date twice to find posts from one day, or set an end and start date for a range.'
    );
  });

  it('reports a range error instead of silently changing an invalid date', () => {
    const filtersChange = vi.fn();
    component.filtersChange.subscribe(filtersChange);
    fixture.componentRef.setInput('filters', {
      ...filters,
      createdFrom: '2026-10-20',
      createdTo: '2026-10-10'
    });

    fixture.detectChanges();
    const start = fixture.nativeElement.querySelector(
      'input[aria-label="Created start date"]'
    ) as HTMLInputElement;
    const end = fixture.nativeElement.querySelector(
      'input[aria-label="Created end date"]'
    ) as HTMLInputElement;

    expect(component.dateRangeError()).toBe(
      'Start date must be the same as or earlier than the end date.'
    );
    expect(fixture.nativeElement.textContent).toContain(component.dateRangeError());
    expect(start.getAttribute('aria-invalid')).toBe('true');
    expect(end.getAttribute('aria-invalid')).toBe('true');

    component.updateDateFilter('createdFrom', '2026-10-25');

    expect(filtersChange).toHaveBeenCalledWith({
      ...filters,
      createdFrom: '2026-10-25',
      createdTo: '2026-10-10'
    });
  });

  it('allows equal start and end dates for a single-day search', () => {
    fixture.componentRef.setInput('filters', {
      ...filters,
      createdFrom: '2026-10-18',
      createdTo: '2026-10-18'
    });
    fixture.detectChanges();

    expect(component.dateRangeError()).toBeNull();
    expect(fixture.nativeElement.textContent).not.toContain('Start date must be');
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

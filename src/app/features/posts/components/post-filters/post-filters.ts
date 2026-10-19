import { Component, computed, input, output } from '@angular/core';

export interface PostFilters {
  title: string;
  body: string;
  createdFrom: string;
  createdTo: string;
}

@Component({
  selector: 'app-post-filters',
  standalone: true,
  templateUrl: './post-filters.html'
})
export class PostFiltersComponent {
  filters = input.required<PostFilters>();
  filtersChange = output<PostFilters>();
  search = output<void>();
  dateRangeError = computed(() => {
    const { createdFrom, createdTo } = this.filters();
    return createdFrom && createdTo && createdFrom > createdTo
      ? 'Start date must be the same as or earlier than the end date.'
      : null;
  });

  updateTextFilter(field: 'title' | 'body', value: string): void {
    this.filtersChange.emit({ ...this.filters(), [field]: value });
  }

  updateDateFilter(field: 'createdFrom' | 'createdTo', value: string): void {
    this.filtersChange.emit({ ...this.filters(), [field]: value });
  }

  clearDateFilter(): void {
    this.filtersChange.emit({ ...this.filters(), createdFrom: '', createdTo: '' });
  }

  searchPosts(): void {
    if (!this.dateRangeError()) {
      this.search.emit();
    }
  }
}

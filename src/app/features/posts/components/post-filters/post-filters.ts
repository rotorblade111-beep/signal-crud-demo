import { Component, input, output } from '@angular/core';

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

  updateTextFilter(field: 'title' | 'body', value: string): void {
    this.filtersChange.emit({ ...this.filters(), [field]: value });
  }

  updateDateFilter(field: 'createdFrom' | 'createdTo', value: string): void {
    const filters = { ...this.filters(), [field]: value };
    if (filters.createdFrom && filters.createdTo && filters.createdFrom > filters.createdTo) {
      if (field === 'createdFrom') {
        filters.createdTo = value;
      } else {
        filters.createdFrom = value;
      }
    }
    this.filtersChange.emit(filters);
  }

  clearDateFilter(): void {
    this.filtersChange.emit({ ...this.filters(), createdFrom: '', createdTo: '' });
  }
}

import { Component, computed, input, output } from '@angular/core';
import { TooltipComponent } from '../../../../shared/components/tooltip/tooltip';

@Component({
  selector: 'app-post-pagination',
  standalone: true,
  imports: [TooltipComponent],
  templateUrl: './post-pagination.html'
})
export class PostPaginationComponent {
  currentPage = input.required<number>();
  totalPages = input.required<number>();
  pageChange = output<number>();

  pageNumbers = computed(() =>
    Array.from({ length: this.totalPages() }, (_, index) => index + 1)
  );
  isPreviousDisabled = computed(() => this.currentPage() <= 1);
  isNextDisabled = computed(() => this.currentPage() >= this.totalPages());
  previousTooltipText = computed(() =>
    this.isPreviousDisabled()
      ? 'No previous pages to paginate to due to the page number being invalid'
      : ''
  );
  nextTooltipText = computed(() =>
    this.isNextDisabled()
      ? 'No next pages to paginate to due to the page number being invalid'
      : ''
  );

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.pageChange.emit(page);
    }
  }
}

import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-site-header',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './site-header.html'
})
export class SiteHeaderComponent {
  readonly auth = inject(AuthService);
  private router = inject(Router);

  logOut(): void {
    this.auth.logOut();
    void this.router.navigateByUrl('/login');
  }
}

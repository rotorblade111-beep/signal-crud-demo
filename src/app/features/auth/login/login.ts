import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink],
  templateUrl: './login.html'
})
export class LoginComponent {
  private auth = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  username = '';
  password = '';
  resetEmail = '';
  newPassword = '';
  isResettingPassword = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  logIn(): void {
    this.errorMessage.set(null);
    this.successMessage.set(null);
    if (!this.auth.logIn(this.username, this.password)) {
      this.errorMessage.set('The username or password is incorrect.');
      return;
    }

    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    const destination = returnUrl?.startsWith('/') && !returnUrl.startsWith('//')
      ? returnUrl
      : '/home';
    void this.router.navigateByUrl(destination);
  }

  resetPassword(): void {
    this.errorMessage.set(null);
    this.successMessage.set(null);
    if (!this.auth.resetPassword(this.resetEmail, this.newPassword)) {
      this.errorMessage.set('No account was found for that email address.');
      return;
    }

    this.isResettingPassword.set(false);
    this.successMessage.set('Password reset. You can now log in with your new password.');
    this.newPassword = '';
  }
}

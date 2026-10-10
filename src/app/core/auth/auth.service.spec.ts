import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let auth: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    auth = TestBed.inject(AuthService);
  });

  it('registers unique email accounts and authenticates case-insensitively', () => {
    expect(auth.signUp({
      email: 'User@Example.com',
      password: 'secret',
      dateOfBirth: '2000-02-29'
    })).toEqual({ success: true });
    expect(auth.currentUser()?.email).toBe('user@example.com');
    expect(auth.signUp({
      email: 'user@example.com',
      password: 'different',
      dateOfBirth: '2001-01-01'
    })).toEqual({ success: false, reason: 'exists' });

    auth.logOut();
    expect(auth.logIn('USER@example.com', 'secret')).toBe(true);
    expect(auth.logIn('user@example.com', 'wrong')).toBe(false);
  });

  it('resets registered passwords and clears the active session on logout', () => {
    auth.signUp({ email: 'user@example.com', password: 'old', dateOfBirth: '2000-01-01' });

    expect(auth.resetPassword('missing@example.com', 'new')).toBe(false);
    expect(auth.resetPassword('USER@example.com', 'new')).toBe(true);
    auth.logOut();
    expect(auth.logIn('user@example.com', 'new')).toBe(true);
    auth.logOut();
    expect(auth.currentUser()).toBeNull();
  });
});

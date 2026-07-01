export interface AuthUser {
  id: string;
  phoneNumber: string;
}

export interface AuthSession {
  id: string;
}

export interface AuthResult {
  user: AuthUser;
  session: AuthSession;
}

export interface SendOtpResponse {
  message: string;
}

export interface AuthError {
  message: string;
}

export interface AuthClientResult<T> {
  data: T | null;
  error: AuthError | null;
}

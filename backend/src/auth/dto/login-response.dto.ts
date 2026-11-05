/** Follows the OAuth 2.0 token response naming, in camelCase. */
export class LoginResponseDto {
  accessToken: string;
  tokenType: 'Bearer';
  /** Lifetime of the access token in seconds. */
  expiresIn: number;

  constructor(accessToken: string, expiresIn: number) {
    this.accessToken = accessToken;
    this.tokenType = 'Bearer';
    this.expiresIn = expiresIn;
  }
}

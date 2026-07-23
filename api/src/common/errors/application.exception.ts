export class ApplicationException extends Error {
  public statusCode: number;
  constructor(message: string = 'An unexpected error occurred.', statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'ApplicationException';
  }
}

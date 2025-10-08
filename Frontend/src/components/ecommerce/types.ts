export interface User {
  role: string | number | readonly string[] | undefined;
  _id: string;
  name: string;
  email: string;
  department?: string;
  designation?: string;
}
// Extends Express's `Express.User` (used by Passport for `req.user`) with the
// real shape of the row we store it as. Keeping this identical to `UserRow`
// in models.ts means services can hand `req.user` straight to passport's
// serialize/deserialize functions with no extra mapping step.
declare global {
  namespace Express {
    interface User {
      id: string;
      google_id: string;
      name: string;
      email: string;
      picture: string | null;
      created_at: Date;
    }
  }
}

export {};

import { pool } from "../db";
import { UserRow } from "../models";
import { isAdminEmail } from "../env";

export async function upsertUserFromGoogle(params: {
  googleId: string;
  name: string;
  email: string;
  picture: string | null;
}): Promise<UserRow> {
  const { googleId, name, email, picture } = params;
  const result = await pool.query<UserRow>(
    `insert into users (google_id, name, email, picture)
     values ($1, $2, $3, $4)
     on conflict (email) do update
       set name = excluded.name,
           picture = excluded.picture,
           google_id = excluded.google_id
     returning *`,
    [googleId, name, email.toLowerCase(), picture]
  );
  return result.rows[0];
}

export async function findUserById(id: string): Promise<UserRow | null> {
  const result = await pool.query<UserRow>("select * from users where id = $1", [id]);
  return result.rows[0] ?? null;
}

export async function countUsers(): Promise<number> {
  const result = await pool.query<{ count: number }>("select count(*)::int as count from users");
  return result.rows[0]?.count ?? 0;
}

export function toPublicUser(user: UserRow) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    picture: user.picture,
    isAdmin: isAdminEmail(user.email),
  };
}

export interface UserWithVoteStatusRow extends UserRow {
  has_voted: boolean;
}

export async function allUsers(): Promise<UserWithVoteStatusRow[]> {
  const result = await pool.query<UserWithVoteStatusRow>(
    `select u.*, case when v.id is not null then true else false end as has_voted
     from users u
     left join votes v on u.id = v.user_id
     order by u.created_at desc`
  );
  return result.rows;
}

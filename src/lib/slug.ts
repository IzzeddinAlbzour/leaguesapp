import { customAlphabet } from 'nanoid';

// URL-safe, unambiguous alphabet (no 0/O/1/I/l), lowercase — reads fine
// typed by hand and never collides across Arabic team/league names.
const nanoid = customAlphabet('23456789abcdefghjkmnpqrstuvwxyz', 8);

export function generateSlug(): string {
  return nanoid();
}

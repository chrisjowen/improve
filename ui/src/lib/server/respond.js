import { json } from "@sveltejs/kit";

/** Turn a thrown path-containment or validation error into a 400, not a 500. */
export function guard(work) {
  try {
    const value = work();
    return json(value ?? {});
  } catch (error) {
    return json({ error: error?.message ?? String(error) }, { status: 400 });
  }
}

export async function guardAsync(work) {
  try {
    const value = await work();
    if (value && value.ok === false) {
      return json(value, { status: value.status ?? 400 });
    }
    return json(value ?? {});
  } catch (error) {
    return json({ error: error?.message ?? String(error) }, { status: 400 });
  }
}

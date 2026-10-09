// Shape and initial value for the basket actions.
//
// These live outside cart.ts because a 'use server' module may only export async
// functions: exporting a plain object from one makes every route that pulls the module
// into its chunk fail to load, with "A 'use server' file can only export async
// functions, found object."
export interface CartActionState {
  status: 'idle' | 'error' | 'success';
  message?: string;
}

export const initialCartState: CartActionState = { status: 'idle' };

// src/handlers/reset.ts
import type { ActionHandler } from "./core";
import { resetMethod } from "../usecases/resetMethod";

export const resetAction: ActionHandler = async (params, ctx) => {
  return await resetMethod(params, ctx);
};

export default resetAction;
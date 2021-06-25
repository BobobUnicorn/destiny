import type { ReactiveArray, ReactiveValue } from "../../mod.js";
import type { TSpecialCaseObject } from "../reactiveObject/specialCaseObjects.js";
import type { TReactiveObject } from "../reactiveObject/TReactiveObject.js";
import type { TReactive } from "./TReactive.js";

export type TReactiveValueType<T> = (
  T extends TReactive<unknown> ? T :
  T extends TSpecialCaseObject ? ReactiveValue<T> :
  T extends Promise<infer V> ? ReactiveValue<V | undefined> :
  T extends ReadonlyArray<infer V> ? ReactiveArray<V> :
  T extends Readonly<Record<string, unknown>> ? TReactiveObject<T> :
  T extends boolean ? ReactiveValue<boolean> :
  ReactiveValue<T>
);

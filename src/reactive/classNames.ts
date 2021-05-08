import { computed } from "./computed.js";
import { ReactivePrimitive } from "./ReactivePrimitive.js";

export function classNames (
  input: Record<string, boolean | Readonly<ReactivePrimitive<boolean>>>,
): Readonly<ReactivePrimitive<string>> {
  return computed(() =>
    Object
    .entries(input)
    .filter(([, value]) => 
      value instanceof ReactivePrimitive
      ? value.value
      : value
    )
    .map(([key]) => key)
    .join(" "),
  );
}

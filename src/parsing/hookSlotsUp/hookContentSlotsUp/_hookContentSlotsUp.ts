import { ReadonlyReactivePrimitive, ReadonlyReactiveArray } from "../../../mod.js";
import { valueToFragment } from "./toFragment/valueToFragment.js";
import { Slot } from "../../Slot.js";
import { SlotArray } from "../../SlotArray.js";

/**
 * Goes through all the elements in a template that are flagged with the `destiny:content` attribute and figures out how the DOM needs to be updated if any of the given props are reactive.
 * @param templ A template element that has been processed by `resolveSlots()`.
 * @param props Any items that were slotted into the HTML template
 */
export function hookContentSlotsUp (
  templ: DocumentFragment,
  props: Array<unknown>,
): void {
  const contentSlots = Object.values(
    templ.querySelectorAll("[destiny\\:content]")
  ) as unknown as Array<HTMLElement & ChildNode>;

  for (const contentSlot of contentSlots) {
    const index = contentSlot.getAttribute("destiny:content");
    const item = props[Number(index)];
    if (item instanceof ReadonlyReactivePrimitive) {
      const slot = new Slot(contentSlot);
      item.bind(value => {
        slot.update(valueToFragment(value));
      }, {
        dependents: [slot],
      });
    } else if (item instanceof ReadonlyReactiveArray) {
      new SlotArray(contentSlot, item);
    } else {
      new Slot(contentSlot, valueToFragment(item));
    }
  }
}

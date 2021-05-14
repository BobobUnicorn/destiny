import { computeFunction } from "./computed.js";

const setValue = new class {
  #inner = new WeakMap<
    ReadonlyReactivePrimitive<any>
  >();

  get<T>(
    key: ReadonlyReactivePrimitive<T>
  ) {
    return this.#inner.get(key) as (
      value: T,
      ...noUpdate: Array<(newValue: T) => void>
    ) => void;
  }

  set<T>(
    key: ReadonlyReactivePrimitive<T>,
    value: (
      value: T,
      ...noUpdate: Array<(newValue: T) => void>
    ) => void,
  ) {
    this.#inner.set(key, value);
  }
};

export class ReadonlyReactivePrimitive<T> {
  /** The current value of the `ReactivePrimitive`. */
  #value: T;

  /** All the callbacks added to the `ReactivePrimitive`, which are to be called when the `value` updates. */
  #callbacks: Set<(value: T) => void> = new Set;

  constructor (
    initialValue: T,
  ) {
    this.#value = initialValue;
    setValue.set(this, (...args) => this.#set(...args));
  }
  
  /**
   * Can be used to functionally update the value.
   * @param value New value to be set
   * @param noUpdate One or more callback methods you don't want to be called on this update. This can be useful for example when responding to DOM events: you wouldn't want to update the DOM with the new value on the same element that caused the udpate in the first place.
   */
  #set (
    value: T,
    ...noUpdate: ReadonlyArray<(newValue: T) => void>
  ): this {
    if (!Object.is(value, this.#value)) {
      this.#value = value;
      [...this.#callbacks.values()]
      .filter(cb => !noUpdate.includes(cb))
      .forEach(cb => cb(value));
    }
    return this;
  }

  /**
   * Same as `this.value`. The current value of the `ReactivePrimitive`.
   */
  valueOf (): T {
    return this.value;
  }

  /**
   * When the object is attempted to be cast to a primitive, the current value of `this.value` is used as a hint. Obviously, if you're trying to cast a `ReactivePrimitive<string>` into a `number`, it'll just cast `this.value` from a `string` to a `number`.
   */
  [Symbol.toPrimitive] (): T {
    return this.value;
  }

  /**
   * When the object is attempted to be serialized using JSON.serialize(), the current value of `this.value` is returned.
   */
  toJSON (): T {
    return this.value;
  }

  get [Symbol.toStringTag] (): string {
    return `ReactivePrimitive<${typeof this.#value}>`;
  }

  /**
   * Instances of this class can be iterated over asynchronously; it will iterate over updates to the `value`. You can use this feature using `for-await-of`.
   */
  async *[Symbol.asyncIterator] (): AsyncIterable<T> {
    while (true) {
      yield await this.#nextUpdate();
    }
  }

  /**
   * Returns a Promise which will resolve the next time the `value` is updated.
   */
  #nextUpdate (): Promise<T> {
    return new Promise<T>(resolve => {
      const cb = (v: T) => {
        resolve(v);
        this.#callbacks.delete(cb);
      };
      this.#callbacks.add(cb);
    });
  }

  /**
   * Adds a callback to be called whenever the `value` of the `ReacativePrimitive` is updated.
   * @param callback the function to be called on updates
   */
  bind (
    callback: (newValue: T) => void,
    noFirstCall = false,
  ): this {
    this.#callbacks.add(callback);
    if (!noFirstCall) callback(this.value);
    return this;
  }

  /** The current value of the ReadonlyReactivePrimitive. */
  get value (): T {
    if (computeFunction) {
      this.#callbacks.add(computeFunction);
    }

    return this.#value;
  }

  /**
   * Creates a new `ReactivePrimitive` which is dependent on the `ReactivePrimitive` it's called on, and is updated as the original one is updated. The value of the original is tranformed by a callback function whose return value determines the value of the resulting `ReactivePrimitive`.
   * @param callback A function which will be called whenever the original `ReactivePrimitive` is updated, and whose return value is assigned to the output `ReactivePrimitive`
   */
  pipe <K> (
    callback: (value: T) => K,
  ): ReadonlyReactivePrimitive<K> {
    const reactor = new ReadonlyReactivePrimitive(callback(this.#value));
    this.bind(v => setValue.get(reactor)(callback(v)));
    return reactor;
  }

  truthy<T> (
    valueWhenTruthy: T,
    valueWhenFalsy?: undefined,
  ): ReadonlyReactivePrimitive<T | undefined>
  truthy<T, K> (
    valueWhenTruthy: T,
    valueWhenFalsy: K,
  ): ReadonlyReactivePrimitive<T | K>
  truthy<T, K> (
    valueWhenTruthy: T,
    valueWhenFalsy: K,
  ): ReadonlyReactivePrimitive<T | K> {
    return this.pipe(v => v ? valueWhenTruthy : valueWhenFalsy);
  }

  falsy<T> (
    valueWhenFalsy: T,
    valueWhenTruthy?: undefined,
  ): ReadonlyReactivePrimitive<T | undefined>
  falsy<T, K> (
    valueWhenFalsy: T,
    valueWhenTruthy: K,
  ): ReadonlyReactivePrimitive<T | K>
  falsy<T, K> (
    valueWhenFalsy: T,
    valueWhenTruthy: K,
  ): ReadonlyReactivePrimitive<T | K> {
    return this.pipe(v => v ? valueWhenTruthy : valueWhenFalsy);
  }
}

export class ReactivePrimitive<T> extends ReadonlyReactivePrimitive<T> {
  /**
   * Forces an update event to be dispatched.
   */
  update (): this {
    this.set(this.value);

    return this;
  }
    
  /**
   * Can be used to functionally update the value.
   * @param value New value to be set
   * @param noUpdate One or more callback methods you don't want to be called on this update. This can be useful for example when responding to DOM events: you wouldn't want to update the DOM with the new value on the same element that caused the udpate in the first place.
   */
  set (
    value: T,
    ...noUpdate: Array<(newValue: T) => void>
  ): this {
    setValue.get(this)(value, ...noUpdate);

    return this;
  }
  
  /** The current value of the ReactivePrimitive. */
  get value (): T {
    return super.value; 
  }

  /** The current `value` of the `ReactivePrimitive` */
  set value (
    value: T,
  ) {
    this.set(value);
  }

  /** Cache for readonly getter */
  #readonly: ReadonlyReactivePrimitive<T> | undefined;

  /** Readonly version of the instance that can't be mutated from the outside, but will be updated as the original instance updates. */
  get readonly (): ReadonlyReactivePrimitive<T> {
    return this.#readonly ?? (this.#readonly = this.pipe(v => v));
  }
}

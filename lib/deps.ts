export { default as punycode } from "https://deno.land/x/punycode@v2.1.1/punycode.js";
export * from "https://raw.githubusercontent.com/robertmassaioli/ts-is-present/master/src/index.ts";

/**
 * Get the keys of the properties to which U can be assigned.
 */
type AssignableKeys<T, U> = {
  [K in keyof T]: U extends T[K] ? K : never;
}[keyof T];

/**
 * Get the interface containing only properties to which undefined can be assigned.
 */
type UndefinableProperties<T> = {
  [K in AssignableKeys<T, undefined>]: T[K];
};

/**
 * Get all of the keys except those to which U can be assigned.
 */
type IncompatibleKeys<T, U> = {
  [K in keyof T]: U extends T[K] ? never : K;
}[keyof T];

/**
 * Get the interface containing no properties to which undefined can be assigned.
 */
type OmitUndefinableProperties<T> = {
  [K in IncompatibleKeys<T, undefined>]: T[K];
};

/**
 * Get the interface where all properties are optional.
 */
type Optional<T> = { [K in keyof T]?: T[K] };

/**
 * Get the interface where properties that can be assigned undefined are
 * also optional.
 */
export type UndefinedOptional<T> = OmitUndefinableProperties<T> &
  Optional<UndefinableProperties<T>>;

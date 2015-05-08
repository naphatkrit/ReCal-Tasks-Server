import assert = require("assert");

module Invariants
{
    export type Invariant = () => boolean;
    let debug = Number(process.env.RECAL_DEBUG || "0") !== 0;
    export function evaluate(invariant: Invariant): boolean
    {
        if (debug)
        {
            return invariant();
        }
        else
        {
            return true;
        }
    }
    export function check(invariant: Invariant)
    {
        if (debug)
        {
            assert(invariant());
        }
    }
    export function checkArray(invariants: Invariant[])
    {
        let combined = invariants.reduce(chain, Predefined.alwaysTrue);
        check(combined);
    }
    export function chain(invariant1: Invariant, invariant2: Invariant)
    {
        return () => { return invariant1() && invariant2(); }
    }

    export module Predefined
    {
        export let alwaysTrue: Invariant = () => { return true; }
        export let alwaysFalse: Invariant = () => { return false; }
        export function isDefinedAndNotNull(item: any): Invariant
        {
            return () => { return item !== null && item !== undefined; }
        }
        export function isDefined(item): Invariant
        {
            return () =>
            {
                return item !== undefined;
            }
        }
        export function isNotEmpty(item: string): Invariant
        {
            return () =>
            {
                return item.length > 0;
            }
        }
    }
}
export = Invariants;

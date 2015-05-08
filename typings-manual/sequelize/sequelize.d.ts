// Type definitions for Sequelize 2.0.0 dev13
// Project: http://sequelizejs.com
// Definitions by: samuelneff <https://github.com/samuelneff>, Peter Harris <https://github.com/codeanimal>
// Definitions: https://github.com/borisyankov/DefinitelyTyped

// Based on original work by: samuelneff <https://github.com/samuelneff/sequelize-auto-ts/blob/master/lib/sequelize.d.ts>

export module sequelize
{

    export interface Model<TInstance, TPojo>
    {

        /**
         * Find a row that matches the query, or build and save the row if none is found The successfull result of the
         * promise will be (instance, created) - Make sure to use .spread().
         *
         * @param where     A hash of search attributes. Note that this method differs from finders, in that the syntax is
         *                  { attr1: 42 } and NOT { where: { attr1: 42}}. This is subject to change in 2.0
         * @param defaults  Default values to use if creating a new instance
         * @param options   Options passed to the find and create calls.
         */
        findOrCreate(options: { where: any, defaults?: any, options?: FindOrCreateOptions }): PromiseT<TInstance>;
    }
    export interface PromiseT<TInstance>
    {

    }
    export interface FindOrCreateOptions
    {

    }
}

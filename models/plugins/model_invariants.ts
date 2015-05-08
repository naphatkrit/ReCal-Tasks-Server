import mongoose = require('mongoose');
import Q = require('q');

import Invariants = require('../../lib/invariants');

type InvariantsGenerator = (doc: mongoose.Document) => Q.Promise<Invariants.Invariant>;

export = function modelInvariantsPluginGenerator(invariantsGenerator: InvariantsGenerator)
{
    return function(schema: mongoose.Schema, options)
    {
        schema.pre('save', function(next)
        {
            invariantsGenerator(this).done(
                (invariants) =>
                {
                    if (Invariants.evaluate(invariants))
                    {
                        next();
                    }
                    else
                    {
                        next(new Error('Failed model invariants'));
                    }

                }, (err) =>
                {
                    next(err);
                })
        })
    }
}

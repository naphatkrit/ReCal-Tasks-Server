import mongoose = require('mongoose');

// TODO doesn't work with find, findOneAndUpdate, etc. See http://mongoosejs.com/docs/middleware.html
export = function updatedStatusPlugin(schema: mongoose.Schema, options)
{
    schema.add({
        _lastModified: Date,
        _created: Date
    })
    schema.virtual('lastModified').get(function(): Date
    {
        if (this._lastModified === undefined)
        {
            return null;
        }
        return this._lastModified;
    })
    schema.virtual('lastModified').set(function(newValue: Date)
    {
        if (newValue === undefined || newValue === null)
        {
            return;
        }
        this._lastModified = newValue;
    })
    schema.virtual('created').get(function(): Date
    {
        if (this._created === undefined)
        {
            return null;
        }
        return this._created;
    })
    schema.virtual('created').set(function(newValue: Date)
    {
        if (newValue === undefined || newValue === null)
        {
            return;
        }
        this._created = newValue;
    })
    schema.pre('save', function(next)
    {
        let date = new Date()
        this.lastModified = date;
        if (!this.created)
        {
            this.created = date;
        }
        next();
    })
    if (options && options.index)
    {
        schema.path('lastModified').index(options.index);
        schema.path('created').index(options.index);
    }
}

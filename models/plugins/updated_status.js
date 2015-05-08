module.exports = function updatedStatusPlugin(schema, options) {
    schema.add({
        _lastModified: Date,
        _created: Date
    });
    schema.virtual('lastModified').get(function () {
        if (this._lastModified === undefined) {
            return null;
        }
        return this._lastModified;
    });
    schema.virtual('lastModified').set(function (newValue) {
        if (newValue === undefined || newValue === null) {
            return;
        }
        this._lastModified = newValue;
    });
    schema.virtual('created').get(function () {
        if (this._created === undefined) {
            return null;
        }
        return this._created;
    });
    schema.virtual('created').set(function (newValue) {
        if (newValue === undefined || newValue === null) {
            return;
        }
        this._created = newValue;
    });
    schema.pre('save', function (next) {
        var date = new Date();
        this.lastModified = date;
        if (!this.created) {
            this.created = date;
        }
        next();
    });
    if (options && options.index) {
        schema.path('lastModified').index(options.index);
        schema.path('created').index(options.index);
    }
};

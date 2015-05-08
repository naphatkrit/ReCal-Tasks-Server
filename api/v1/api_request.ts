import assert = require('assert');

export interface ApiRequest
{
    serializedObject: string,
}

export function validateApiRequest(object: any): boolean
{
    try
    {
        assert(object !== null && object !== undefined);
        assert(typeof object.serializedObject === 'string');
        return true;
    }
    catch (e)
    {
        return false;
    }
}

export function castApiRequest(object: any): ApiRequest
{
    if (validateApiRequest(object))
    {
        return object;
    }
    else
    {
        return null;
    }
}

export function tryGetObject(request: ApiRequest): any
{
    try
    {
        return JSON.parse(request.serializedObject);
    }
    catch (e)
    {
        return null;
    }
}

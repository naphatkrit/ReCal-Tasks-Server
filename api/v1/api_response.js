function createResponse(objects) {
    return {
        meta: {
            total_count: objects.length
        },
        objects: objects
    };
}
exports.createResponse = createResponse;

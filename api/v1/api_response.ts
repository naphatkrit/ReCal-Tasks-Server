export interface ApiResponse<T> {
    meta: {
        total_count: number
    }
    objects: T[]
}

export function createResponse<T>(objects: T[]): ApiResponse<T> {
    return {
        meta: {
            total_count: objects.length
        },
        objects: objects
    }
}

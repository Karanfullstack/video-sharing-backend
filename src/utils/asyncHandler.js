const asyncHandler = (callback) => async (req, res, next) => {
    return Promise.resolve(callback(req, res, next)).catch((err) =>
        console.log(err)
    );
};

export { asyncHandler };

const asyncWithTimeout = async <T>(promise: Promise<T>, milliseconds = 10000): Promise<T> => {
    //Promise that rejects after X milliseconds
    const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(`timed out after ${milliseconds} milliseconds`), milliseconds),
    );

    return await Promise.race([promise, timeoutPromise])
        .then((result) => result as T)
        .catch((e) => {
            throw Error(e);
        });
}

export {
    asyncWithTimeout
}
CampusExplorer.sendQuery = (query) => {
    return new Promise((fulfill, reject) => {
        let xhr = new XMLHttpRequest();
        xhr.open('POST', '/query');
        xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
        xhr.onload = () => {
            if (this.readyState === XMLHttpRequest.DONE && this.status === 200) {
                fulfill(xhr.response);
            } else {
                reject({
                    status: this.status,
                    statusText: xhr.statusText
                });
            }
        };
        xhr.onerror = () => {
            reject({
                status: this.status,
                statusText: xhr.statusText
            });
        };
        xhr.send(JSON.stringify(query));
    });
};

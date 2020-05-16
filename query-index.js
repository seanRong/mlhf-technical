let submit = document.getElementById("submit-button");

submit.addEventListener("click", processQuery);

function getQueryFromInput() {
    let query = CampusExplorer.buildQuery();
    return query;
}

function processQuery() {
    let inputQuery = getQueryFromInput();
    let res = CampusExplorer.sendQuery(inputQuery);
    res.then((result) => {
        CampusExplorer.renderResult(JSON.parse(result));
    }).catch((error) => {
        CampusExplorer.renderResult(error);
    })
}

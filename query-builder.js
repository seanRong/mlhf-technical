var dataset;

CampusExplorer.buildQuery = () => {
    dataset = document.querySelector(".nav-item.tab.active").dataset.type;
    let query = {};
    query["WHERE"] = {};
    query["OPTIONS"] = {};
    getConditionsLogic(query);
    getTransformations(query);
    getOrder(query);
    getColumns(query);

    return query;
};

function getConditionsLogic(query) {
    query.WHERE = {};
    let chosenLogicOperator = document.querySelector(".tab-panel.active")
        .querySelector(".form-group.conditions").querySelector(".control-group.condition-type")
        .querySelector(":checked").value;
    switch (chosenLogicOperator) {
        case "all":
            query.WHERE.AND = [];
            processAll(query);
            break;
        case "any":
            query.WHERE.OR = [];
            processAny(query);
            break;
        case "none":
            query.WHERE.NOT = {};
            query.WHERE.NOT.OR = [];
            processNone(query);
            break;
    }
}

function obtainDetails(condition) {
    let not = condition.querySelector(".control.not").selected;
    let field = condition.querySelector(".control.fields").querySelector("[selected=selected]").value;
    let operator = condition.querySelector(".control.operators")
        .querySelector("[selected=selected]").value;
    let term = condition.querySelector(".control.term").querySelector("input").value;
    if (!Number.isNaN(parseFloat(term)) && !(operator === "IS") && isNumericField(field)) {
        term = parseFloat(term);
    }
    return {not, field, operator, term};
}

function isNumericField(field) {
    let whitelist = ["avg", "fail", "pass", "audit", "year", "seats", "lat", "lon"];
    return whitelist.includes(field);
}

function processAll(query) {
    let conditions = document.querySelector(".tab-panel.active")
        .querySelector(".form-group.conditions").querySelectorAll(".control-group.condition");
    for (let condition of conditions) {
        let {not, field, operator, term} = obtainDetails(condition);
        if (not) {
            query.WHERE.AND.push({NOT: {[operator] : {[this.dataset + "_" + field] : term}}})
        } else {
            query.WHERE.AND.push({[operator] : {[this.dataset + "_" + field] : term}})
        }
        if (conditions.length === 1) {
            // AND is unnecessary for a singular condition
            delete query.WHERE.AND;
            if (not) {
                query.WHERE =
                    {NOT: {[operator] : {[this.dataset + "_" + field] : term}}}
            } else {
                query.WHERE =
                    {[operator] : {[this.dataset + "_" + field] : term}}
            }
        }
    }
    if (conditions.length === 0) {
        // WHERE is unnecessary for no conditions
        query.WHERE = {};
    }
}

function processAny(query) {
    let conditions = document.querySelector(".tab-panel.active")
        .querySelector(".form-group.conditions").querySelectorAll(".control-group.condition");
    for (let condition of conditions) {
        let {not, field, operator, term} = obtainDetails(condition);
        if (not) {
            query.WHERE.OR.push({NOT: {[operator] : {[this.dataset + "_" + field] : term}}})
        } else {
            query.WHERE.OR.push({[operator] : {[this.dataset + "_" + field] : term}})
        }
        if (conditions.length === 1) {
            // OR is unnecessary for a singular condition
            delete query.WHERE.OR;
            if (not) {
                query.WHERE =
                    {NOT: {[operator] : {[this.dataset + "_" + field] : term}}}
            } else {
                query.WHERE =
                    {[operator] : {[this.dataset + "_" + field] : term}}
            }
        }
    }
    if (conditions.length === 0) {
        // WHERE is unnecessary for no conditions
        query.WHERE = {};
    }
}

function processNone(query) {
    let conditions = document.querySelector(".tab-panel.active")
        .querySelector(".form-group.conditions").querySelectorAll(".control-group.condition");
    for (let condition of conditions) {
        let {not, field, operator, term} = obtainDetails(condition);
        if (not) {
            query.WHERE.NOT.OR.push({NOT: {[operator] : {[this.dataset + "_" + field] : term}}})
        } else {
            query.WHERE.NOT.OR.push({[operator] : {[this.dataset + "_" + field] : term}})
        }
        if (conditions.length === 1) {
            // OR is unnecessary for a singular condition
            delete query.WHERE.NOT.OR;
            if (not) {
                query.WHERE =
                    {[operator] : {[this.dataset + "_" + field] : term}}
            } else {
                query.WHERE =
                {NOT: {[operator] : {[this.dataset + "_" + field] : term}}}
            }
        }
    }
    if (conditions.length === 0) {
        // WHERE is unnecessary for no conditions
        query.WHERE = {};
    }
}

function getColumns(query) {
    query.OPTIONS.COLUMNS = [];
    let columns = document.querySelector(".tab-panel.active")
        .querySelector(".form-group.columns").querySelectorAll(".control.field");
    for (let column of columns) {
        let columnSelector = column.querySelector("[type=checkbox]");
        if (columnSelector.checked) {
            let columnName = columnSelector.value;
            if (columnSelector.id === "") {
                // for custom columns that are user-defined in TRANSFORMATIONS
                query.OPTIONS.COLUMNS.push(columnName);
            } else {
                query.OPTIONS.COLUMNS.push(dataset + "_" + columnName);
            }
        }
    }
}

function getOrder(query) {
    query.OPTIONS.ORDER = {};
    query.OPTIONS.ORDER.dir = "UP";   // default ordering
    if (document.getElementById(dataset + '-order').checked){
        query.OPTIONS.ORDER.dir = "DOWN";
    }
    query.OPTIONS.ORDER.keys = [];
    let orderings = document.querySelector(".tab-panel.active")
        .querySelector(".form-group.order").querySelectorAll("[selected=selected]");
    for (let ordering of orderings) {
        if (ordering.className === "transformation") {
            query.OPTIONS.ORDER.keys.push(ordering.value);
        } else {
            query.OPTIONS.ORDER.keys.push(dataset + "_" + ordering.value)
        }
        if (orderings.length === 1 && !(document.getElementById(dataset + '-order').checked)) {
            // a single ordering, and without reverse order, requires a slightly different query JSON structure
            // to obtain correct response from server
            delete query.OPTIONS.ORDER;
            let newOrder;
            if (ordering.className === "transformation") {
                newOrder = ordering.value;
            } else {
                newOrder = dataset + "_" + ordering.value;
            }
            query.OPTIONS.ORDER = newOrder;
        }
    }
    if (orderings.length === 0) {
        // no orderings means no order is necessary
        delete query.OPTIONS.ORDER;
        // however, if reverse is present, we must still respect that
        if (document.getElementById(dataset + '-order').checked) {
            query.OPTIONS.ORDER = {};
            query.OPTIONS.ORDER.dir = "DOWN";
            query.OPTIONS.ORDER.keys = [];
        }
    }
}

function getTransformations(query) {
    query["TRANSFORMATIONS"] = {};
    getGroups(query);
    getApply(query);
    if (query.TRANSFORMATIONS.GROUP.length === 0 && query.TRANSFORMATIONS.APPLY.length === 0) {
        // no GROUP, or no APPLY, means that TRANSFORMATIONS is invalid and should not be applied
        delete query.TRANSFORMATIONS;
    }
}

function getGroups(query) {
    query["TRANSFORMATIONS"].GROUP = [];
    let groupings = document.querySelector(".tab-panel.active")
        .querySelector(".form-group.groups").querySelectorAll("[checked=checked]");
    for (let grouping of groupings) {
        // fancy little trick since the column name always comes last.
        let columnName = grouping.id.split("-").reverse()[0];
        query.TRANSFORMATIONS.GROUP.push(dataset + "_" + columnName);
    }
}

function getApply(query) {
    query["TRANSFORMATIONS"].APPLY = [];
    let applications = document.querySelector(".tab-panel.active")
        .querySelector(".form-group.transformations")
        .querySelectorAll(".control-group.transformation");
    if (applications.length === 0) {
        // then there is nothing that shall go under APPLY
        return;
    }
    for (let application of applications) {
        let term = application.querySelector(".control.term").querySelector("input").value;
        let operator = application.querySelector(".control.operators")
            .querySelector("[selected=selected]").value;
        let field = application.querySelector(".control.fields")
            .querySelector("[selected=selected]").value;
        field = this.dataset + "_" + field;
        query.TRANSFORMATIONS.APPLY.push({[term] : {[operator] : field}});
    }
}

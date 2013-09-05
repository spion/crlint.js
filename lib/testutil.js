exports.test = function test(obj, filter) {
    if (filter.min || filter.max)
        return (!filter.min || obj < filter.min)                
            && (!filter.max || obj > filter.max);
    var filters = {$value: false, $subitems:{}};
    for (var key in filter) {
        var res = test(obj[key], filter[key])
        if (res === true || res.$value) {
            filters.$value = true;
        }
        filters.$subitems[key] = res;
    }
    return filters;
}

exports.report = function report(test) {
    if (test.$subitems)
        return report(test.$subitems);
    else if (test === true || test === false)
        return test;
    else {
        var res = {};
        for (var key in test) {
            res[key] = report(test[key]);
        }
        return res;
    }        
}

// test({a: 1, b: {c: 3}}, {a: {min: 3}, b: { c: { max: 6}}});

// report(test({a: 1, b: {c: 3}}, {a: {min: 3}, b: { c: { max: 6}}}));

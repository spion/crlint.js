#!/usr/bin/env node

var cr = require('complexity-report');
var glob = require('multi-glob').glob;
var util = require('util');
var fs = require('fs');
var _ = require('lodash');
var tutil = require('./lib/testutil');

var available = 
{ sloc: { 
    physical: 'Number of physical lines of code', 
    logical: 'Number of logical lines of code' },
  cyclomatic: 'Cyclomatic complexity',
  halstead: {
     length: 'Total number of operations and operands',
     vocabulary: 'Number of distinct operations and operands',
     difficulty: 'Difficulty measure',
     volume: 'Volume measure',
     effort: 'Effort measure',
     bugs: 'Estimated number of bugs',
     time: 'Estimated time to write' },
  params: 'Number of parameters',
  maintainability: 'Microsoft maintainability index (0 < m < 100)'
};


var defaultFn = {
    sloc: {logical: {max: 50}, physical: {max: 300}}, 
    cyclomatic: {max: 20}, 
    halstead: {
        bugs: {max: 0.5}, 
        time: {max: 1500} 
    },
    params: {max: 5}
};

var defaultModule = {
    sloc: {logical: {max: 400}},
    cyclomatic: {max: 100},
    maintainability: {min: 50}
};
 
var morehelp = "\nUse --fn.option.min, --fn.option.max\n"
    + " or --module.option.min, --module.option.max\n"
    + " for restrictions.\n\n"
    + "Alternatively, use --config <file.json> and define\n"
    + " \"fn\" and \"module\" restriction objects there\n\n"
    + "Available restrictions:\n"
    + util.inspect(available);

var argv = require('optimist')
    .demand(1)
    .usage("Usage: $0 [options] <files...>\n"+morehelp)
    .argv;

if (argv.config) {
    argv = JSON.parse(fs.readFileSync(argv.config));
}

argv = _.merge({
    newmi: true, 
    logicalor:true,
    switchcase: true,
    trycatch: false,
    forin: false,
    fn: defaultFn,
    module: defaultModule
}, argv);


glob(argv._, function(err, files) {    
    var report = files.map(function(f) {
        try {
            var rep = cr.run(fs.readFileSync(f).toString(), argv);
            var lintfns = rep.functions.map(function(f) {
                return {fn: f, test: tutil.test(f.complexity, argv.fn)}
            }).filter(function(f) {
                return f.test.$value;
            }).map(function(f) {
                return {fn: f.fn, report: tutil.report(f.test)};
            });
            rep.aggregate.complexity.maintainability = rep.maintainability;

            var lint = tutil.test(rep.aggregate.complexity, argv.module);

            return {file: f, lintfns: lintfns, lint: lint, 
                complexity: rep.aggregate.complexity };
        } catch (e) {
            return {file: f, error: e};
        }
    });
    output(report);
});

function restrict(constraints, report, results) {
    if (report && (constraints.min || constraints.max))
        return {$expect: constraints, $actual: results}
    else {
        var res = {}, display = false;
        for (var key in report) {
            var c = restrict(constraints[key], report[key], results[key]);
            if (c) { 
                res[key] = c;
                display = true;
            }
        }
        if (display) 
            return res;
    }
}

function format(errors, thiskey) {
    thiskey = thiskey || '   ';
    if (errors.$expect && errors.$actual) {
        var val = "allowed ";
        if (errors.$expect.min)
            val += 'minimum is ' + errors.$expect.min;
        if (errors.$expect.max)
            val += 'maximum is ' + errors.$expect.max;
        val += ', actual is ' + errors.$actual;
        return thiskey + val;
    }
    else {
        var vals = [];
        for (var key in errors) {
            vals.push(format(errors[key], thiskey + key + ' '));
        }
        return vals.join('\n');
    }
    
}

function output(report) {
    report.forEach(function(file) {
        if (file.lint && file.lint.$value) {
            console.log('Module:', file.file)
            var errors = restrict(argv.module, tutil.report(file.lint), 
                                 file.complexity);
            console.log(format(errors) + '\n');
        }
        file.lintfns && file.lintfns.forEach(function(f) {
            console.log('Function', f.fn.name, 'in', file.file + ":" + f.fn.line);
            var errors = restrict(argv.fn, f.report, f.fn.complexity);
            console.log(format(errors) + '\n');
        });
    });
}
 

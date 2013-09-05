# crlint.js

JS linter based on complexity report results

# Usage

    crlint [options] <files...>

Use --fn.option.min, --fn.option.max
 or --module.option.min, --module.option.max
 for restrictions.

Alternatively, use `--config <file.json>` and define
 "fn" and "module" restriction objects there

Available restrictions:

```
{ sloc: 
   { physical: 'Number of physical lines of code',
     logical: 'Number of logical lines of code' },
  cyclomatic: 'Cyclomatic complexity',
  halstead: 
   { length: 'Total number of operations and operands',
     vocabulary: 'Number of distinct operations and operands',
     difficulty: 'Difficulty measure',
     volume: 'Volume measure',
     effort: 'Effort measure',
     bugs: 'Estimated number of bugs',
     time: 'Estimated time to write' },
  params: 'Number of (function) parameters',
  maintainability: 'Microsoft maintainability index (0 < m < 100)' }
```

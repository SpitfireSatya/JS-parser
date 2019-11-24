(function() {
  'use strict';

  var Promise = require('bluebird');
  var fs = Promise.promisifyAll(require('fs'), { suffix: 'PromiseFn' });
  var _ = require('lodash');
  var fileOps = require('./lib/fileOps');
  var taskRunner = require('./lib/taskRunner');
  var funkyLogger;
  var validateSystemIntegrity;

  fs.statPromiseFn('./lib/funkyLogger.js')
    .then(function(stats) {
      funkyLogger = require('./lib/funkyLogger');
      console.log(funkyLogger('cyan', 'Initializing app...'));
      console.log(funkyLogger('yellow', 'Powered by funkyLogger v1.0.0'));
      console.log('\n' + funkyLogger('cyan', 'Running system integrity tests...') + '\n');
      return fs.statPromiseFn('./lib/validateSystemIntegrity.js');
    })
    .then(function(err, stats) {
      console.log(funkyLogger('green', 'JS file found: validateSystemIntegrity.js'));
      validateSystemIntegrity = require('./lib/validateSystemIntegrity.js');
      return validateSystemIntegrity();
    })
    .then(function() {
      console.log('\n' + funkyLogger('cyan', 'All Validations complete. System looks Good...') + '\n');
      console.log(funkyLogger('cyan', 'Running Recursive File Search to fetch all files...'));
      return fileOps.recursiveFileSearch();
    })
    .then(function(fileList) {
      console.log(funkyLogger('green', 'Recursive File Search Completed.'));
      console.log('\n' + funkyLogger('cyan', 'Running Task Runner on files found...') + '\n');
      if (fileList) {
        return taskRunner(fileList)
          .then(function() {
            console.log('\n' + funkyLogger('cyan', 'All tasks executed successfully!') + '\n');
          })['catch'](function(err) {
            console.log(err);
          });
      } else {
        console.log('No Files Found.');
      }
    })['catch'](function(err) {
      console.log('error', err);
    });

})();
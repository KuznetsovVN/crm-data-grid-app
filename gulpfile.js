var fs = require('fs');
var gulp = require('gulp');

gulp.task('default', function() {
  console.log('Hello Everyone !!!');
});

gulp.task('build-crm-module', function(done) {
  clearBuildPluginFolder();
  var itemsToReplace = copyNecessaryFiles();
  replaceLinksInMainPage(itemsToReplace);

  done();
});

const TARGET_DIR = 'build-crm-module';
const TARGET_NAME = 'crm-datagrid';

function clearBuildPluginFolder() {
  var dir = './' + TARGET_DIR;
  if (fs.existsSync(dir)){
    fs.rmSync(dir, { recursive: true, force: true });
  }
  fs.mkdirSync(dir, { recursive: true });
}

function copyNecessaryFiles() {
  var itemsToReplace = [];

  fs.copyFileSync('build/crm-iframe-init.js', TARGET_DIR + '/crm-iframe-init.js');

  fs.copyFileSync('build/index.html', TARGET_DIR + '/' + TARGET_NAME + '.html');

  fs.readdir('build/static/js', (err, files) => {
    files.forEach(file => {
      if(file.startsWith('main') && file.endsWith('.js')) {
        fs.copyFileSync('build/static/js/' + file, TARGET_DIR + '/' + TARGET_NAME + '.js');
        itemsToReplace.push(['/static/js/' + file, TARGET_NAME + '.js']);
      }
    });
  });

  fs.readdir('build/static/css', (err, files) => {
    files.forEach(file => {
      if(file.startsWith('main') && file.endsWith('.css')) {
        fs.copyFileSync('build/static/css/' + file, TARGET_DIR + '/' + TARGET_NAME + '.css');
        itemsToReplace.push(['/static/css/' + file, TARGET_NAME + '.css']);
      }
    });
  });

  return itemsToReplace;
}

function replaceLinksInMainPage(itemsToReplace) {
  fs.readFile(TARGET_DIR + '/' + TARGET_NAME + '.html', 'utf8', function (err,data) {
    if (err) {
      return console.log(err);
    }

    var result = data;
    itemsToReplace.forEach(item => {
      result = result.replace(item[0], item[1]);
    });

    var externalLinks = '<script crossorigin src="https://unpkg.com/react@17/umd/react.production.min.js"></script>' +
                        '<script crossorigin src="https://unpkg.com/react-dom@17/umd/react-dom.production.min.js"></script>' +
                        '<script crossorigin src="https://unpkg.com/@fluentui/react@8/dist/fluentui-react.js"></script>' +
                        '<script crossorigin src="https://unpkg.com/@fluentui/react-hooks@8/dist/react-hooks.js"></script>';

    result = result.replace('</head>', externalLinks + '</head>');

    fs.writeFile(TARGET_DIR + '/' + TARGET_NAME + '.html', result, 'utf8', function (err) {
      if (err) return console.log(err);
    });
  });
}

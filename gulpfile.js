var fs = require('fs');
var gulp = require('gulp');

gulp.task('default', function() {
  console.log('Hello Everyone !!!');
});

gulp.task('build-crm-module', function() {
  clearBuildPluginFolder();
  var itemsToReplace = copyNecessaryFiles();
  replaceLinksInMainPage(itemsToReplace);
});

const TARGET_DIR = 'build-crm-module';

function clearBuildPluginFolder() {
  var dir = './' + TARGET_DIR;
  if (fs.existsSync(dir)){
    fs.rmSync(dir, { recursive: true, force: true });
  }
  fs.mkdirSync(dir, { recursive: true });
}

function copyNecessaryFiles() {
  var itemsToReplace = [];

  fs.copyFileSync('build/index.html', TARGET_DIR + '/index.html');

  fs.readdir('build/static/js', (err, files) => {
    files.forEach(file => {
      if(file.startsWith('main') && file.endsWith('.js')) {
        fs.copyFileSync('build/static/js/' + file, TARGET_DIR + '/main.js');
        itemsToReplace.push(['/static/js/' + file,'main.js']);
      }
    })
  });

  fs.readdir('build/static/css', (err, files) => {
    files.forEach(file => {
      if(file.startsWith('main') && file.endsWith('.css')) {
        fs.copyFileSync('build/static/css/' + file, TARGET_DIR + '/main.css');
        itemsToReplace.push(['/static/css/' + file, 'main.css']);
      }
    })
  });

  return itemsToReplace;
}

function replaceLinksInMainPage(itemsToReplace) {
  fs.readFile(TARGET_DIR + '/index.html', 'utf8', function (err,data) {
    if (err) {
      return console.log(err);
    }

    var result = data;
    itemsToReplace.forEach(item => {
      result = result.replace(item[0], item[1]);
    });

    var externalLinks = '<script src="https://unpkg.com/@fluentui/react@8/dist/fluentui-react.js"></script>' +
                        '<script src="https://unpkg.com/@fluentui/react-hooks@8/dist/react-hooks.js"></script>';

    result = result.replace('</head>', externalLinks + '</head>');

    fs.writeFile(TARGET_DIR + '/index.html', result, 'utf8', function (err) {
      if (err) return console.log(err);
    });
  });
}

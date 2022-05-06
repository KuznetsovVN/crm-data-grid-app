const path = require("path");
var fs = require('fs');
var beautify = require('js-beautify').js;
var gulp = require('gulp');

gulp.task('default', function() {
  console.log('Hello Everyone !!!');
});

gulp.task('build-crm-module', function(done) {
  buildCrmModule();
  done();
});

gulp.task('build-crm-module-dev', function(done) {
  buildCrmModule();

  const jsFile = path.resolve(__dirname, './' + TARGET_DIR + '/' + TARGET_NAME + '.js');
  var data = fs.readFileSync(jsFile, {encoding:'utf8', flag:'r'});
  var new_data = beautify(data, { indent_size: 2, space_in_empty_paren: true });
  fs.writeFileSync(jsFile, new_data, { encoding: "utf8" });

  done();
});

const TARGET_DIR = 'build-crm-module';
const TARGET_NAME = 'crm-datagrid';

function buildCrmModule() {
  clearBuildPluginFolder();
  var itemsToReplace = copyNecessaryFiles();
  replaceLinksInMainPage(itemsToReplace);
}

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

  const jsFiles = fs.readdirSync('build/static/js');
  jsFiles.forEach(file => {
    if(file.startsWith('main') && file.endsWith('.js')) {
      fs.copyFileSync('build/static/js/' + file, TARGET_DIR + '/' + TARGET_NAME + '.js');
      itemsToReplace.push(['/static/js/' + file, TARGET_NAME + '.js']);
    }
  });

  const cssFiles = fs.readdirSync('build/static/css');
  cssFiles.forEach(file => {
    if(file.startsWith('main') && file.endsWith('.css')) {
      fs.copyFileSync('build/static/css/' + file, TARGET_DIR + '/' + TARGET_NAME + '.css');
      itemsToReplace.push(['/static/css/' + file, TARGET_NAME + '.css']);
    }
  });

  return itemsToReplace;
}

function replaceLinksInMainPage(itemsToReplace) {
  var result = fs.readFileSync(TARGET_DIR + '/' + TARGET_NAME + '.html', {encoding:'utf8', flag:'r'});
  itemsToReplace.forEach(item => {
    result = result.replace(item[0], item[1]);
  });

  var externalLinks = '<script crossorigin src="https://unpkg.com/react@17/umd/react.production.min.js"></script>' +
                      '<script crossorigin src="https://unpkg.com/react-dom@17/umd/react-dom.production.min.js"></script>' +
                      '<script crossorigin src="https://unpkg.com/@fluentui/react@8/dist/fluentui-react.js"></script>' +
                      '<script crossorigin src="https://unpkg.com/@fluentui/react-hooks@8/dist/react-hooks.js"></script>';

  result = result.replace('</head>', externalLinks + '</head>');
  fs.writeFileSync(TARGET_DIR + '/' + TARGET_NAME + '.html', result, { encoding: "utf8" });
}

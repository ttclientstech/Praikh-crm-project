const { basename, extname } = require('path');
const { globSync } = require('glob');
const mongoose = require('mongoose');

// Clear existing models to avoid overwrite errors during hot reload
Object.keys(mongoose.models).forEach(modelName => {
  if (mongoose.models[modelName]) {
    delete mongoose.models[modelName];
  }
});

const appModelsFiles = globSync('./src/models/appModels/**/*.js');

const pattern = './src/models/**/*.js';

const modelsFiles = globSync(pattern).map((filePath) => {
  const fileNameWithExtension = basename(filePath);
  const fileNameWithoutExtension = fileNameWithExtension.replace(
    extname(fileNameWithExtension),
    ''
  );
  return fileNameWithoutExtension;
});

const constrollersList = [];
const appModelsList = [];
const entityList = [];
const routesList = [];

for (const filePath of appModelsFiles) {
  const fileNameWithExtension = basename(filePath);
  const fileNameWithoutExtension = fileNameWithExtension.replace(
    extname(fileNameWithExtension),
    ''
  );
  const firstChar = fileNameWithoutExtension.charAt(0);
  const modelName = fileNameWithoutExtension.replace(firstChar, firstChar.toUpperCase());
  const fileNameLowerCaseFirstChar = fileNameWithoutExtension.replace(
    firstChar,
    firstChar.toLowerCase()
  );
  const entity = fileNameWithoutExtension.toLowerCase();

  controllerName = fileNameLowerCaseFirstChar + 'Controller';
  constrollersList.push(controllerName);
  appModelsList.push(modelName);
  entityList.push(entity);

  const route = {
    entity: entity,
    modelName: modelName,
    controllerName: controllerName,
  };
  routesList.push(route);
}

// Manual mapping for Prospect -> Customer
routesList.push({
  entity: 'prospect',
  modelName: 'Customer',
  controllerName: 'customerController',
});

module.exports = { constrollersList, appModelsList, modelsFiles, entityList, routesList };

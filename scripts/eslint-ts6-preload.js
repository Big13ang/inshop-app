/* eslint-disable */
const Module = require("module");
const origLoad = Module._load;

Module._load = function (request, parent, isMain) {
  if (request === "typescript") {
    return origLoad.call(this, "@typescript/typescript6", parent, isMain);
  }
  return origLoad.call(this, request, parent, isMain);
};

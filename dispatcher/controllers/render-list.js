// jscs:disable requireCamelCaseOrUpperCaseIdentifiers
'use strict';

const moduleName = require('../../module-name');
const di = require('core/di');
const moment = require('moment');

/* jshint maxstatements: 50, maxcomplexity: 30 */
module.exports = function (req, res) {
  const scope = di.context(moduleName);
  let template = req.query.template;
  let renderTemplate = function (data) {
    res.render(template, Object.assign({
      baseUrl: req.app.locals.baseUrl,
      moment
    }, data), (err, result)=> {
      if (err) {
        scope.sysLog.error(err);
        return res.status(500).send('Template render error');
      }
      return result ? res.send(result) : res.sendStatus(404);
    });
  };
  try {
    if (req.body.ids instanceof Array) {
      let layer = scope.geoMeta.getLayer(req.params.layer, req.params.namespace);
      if (!layer) {
        return res.sendStatus(404);
      }
      let query = layer.getData()[req.params.query || 0];
      let promises = [];
      for (let id of req.body.ids) {
        if (id) {
          promises.push(scope.geoData.getLayerItem(query, id));
        }
      }
      Promise.all(promises).then(items => {
        if (items) {
          //renderTemplate({items, req});
            res.json(items.length);
        } else {
          res.status(404).send('Objects not found');
        }
      }).catch(err => {
        scope.sysLog.error(err);
        res.status(500).send('Error retrieving objects');
      });
    } else {
      renderTemplate({req});
    }
  } catch (err) {
    scope.sysLog.error(err);
    res.sendStatus(500);
  }
};

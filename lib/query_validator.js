var QueryValidator, async, qv, sample_string, test_obj;

function QueryValidator() {}

QueryValidator.prototype.validate = function(schema, callback) {
  var options,
    _this = this;
  
  // When is already an object
  if(typeof schema == 'object') {
    options = schema;
    return this.validate_root_options_obj(options, function(is_valid, err_msg) {
      if (is_valid) {
        return callback(is_valid, 'line 16: ' + options);
      } else {
        return callback(is_valid, 'line 18: ' + err_msg);
      }
    });
    
  // When still in some strange format but not object
  } else {
    
    // when is a Stringified JSON format
    try {
      options = JSON.parse(schema);
      return this.validate_root_options_obj(options, function(is_valid, err_msg) {
        if (is_valid) {
          return callback(is_valid, 'line 16: ' + options);
        } else {
          return callback(is_valid, 'line 18: ' + err_msg);
        }
      });
    } catch (e) {
      
      // when is in fucked Stringified JSON format        
      try {
        schema = 'options = ' + schema;
        eval(schema);

        return this.validate_root_options_obj(options, function(is_valid, err_msg) {
          if (is_valid) {
            return callback(is_valid, options);
          } else {
            return callback(is_valid, err_msg);
          }
        });

      } catch (f) {
        return callback(false, 'line 33: ' + f);
      }
    }      
  }
};

QueryValidator.prototype.validate_root_options_obj = function(options, callback) {
  if (!options.origin_url) {
    return callback(false, 'origin_url is missing');
  }
  if (!options.columns) {
    return callback(false, 'columns array is missing');
  }
  return this.validate_columns_array(options.columns, callback);
};

QueryValidator.prototype.validate_options_obj = function(options, callback) {
  if (!options.columns) {
    return callback(false, 'columns array is missing');
  }
  return this.validate_columns_array(options.columns, callback);
};

QueryValidator.prototype.validate_columns_array = function(columns_array, callback) {
  var error_msg,
    _this = this;
  if (!(columns_array instanceof Array)) {
    return callback(false, 'columns_array is not Array');
  }
  if (columns_array.length === 0) {
    return callback(false, 'columns_array is empty');
  }
  error_msg = false;
  return async.every(columns_array, function(column_obj, next) {
    return _this.validate_column_obj(column_obj, function(result, error) {
      if (error && !error_msg) {
        error_msg = error;
      } else if (error && error_msg) {
        error_msg += ',' + error;
      }
      return next(result);
    });
  }, function(result) {
    return callback(result, error_msg);
  });
};

QueryValidator.prototype.validate_column_obj = function(column_obj, callback) {
  var err_msg;
  if (!column_obj.col_name) {
    return callback(false, 'a column has no col_name');
  }
  if (!(column_obj.dom_query || column_obj.xpath) ) {
    return callback(false, 'column[' + column_obj.col_name + '] has no dom_query');
  }
  if (column_obj.options && column_obj.required_attribute && (column_obj.required_attribute === 'href' || column_obj.required_attribute === 'src') ) {
    return this.validate_options_obj(column_obj.options, callback);
  } else if (column_obj.options && column_obj.options.origin_url) {
    return this.validate_options_obj(column_obj.options, callback);
  } else if (!column_obj.options) {
    return callback(true);
  } else {
    err_msg = 'column[' + column_obj.col_name + '] is invalid. ' + 'Make sure you declared either fuzzy_url : "...PATTERN.."  in the nested options object or ' + ' required_attribute : "href" ';
    return callback(false, err_msg);
  }
};

module.exports = QueryValidator;

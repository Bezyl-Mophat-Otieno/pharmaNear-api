function paginate(req, res, next) {
    req.pagination = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
      offset: parseInt(req.query.offset) || 0,
    };
    next();
  }
  
  module.exports = paginate;
  
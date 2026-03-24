const AuditLog = require('../models/AuditLog');

exports.logAction = (module) => {
  return async (req, res, next) => {
    const originalSend = res.send;
    
    res.send = function(data) {
      res.send = originalSend;
      
      if (res.statusCode >= 200 && res.statusCode < 300 && req.user) {
        const action = `${req.method} ${req.originalUrl}`;
        
        AuditLog.create({
          user: req.user._id,
          action,
          module,
          targetId: req.params.id || null,
          details: {
            method: req.method,
            url: req.originalUrl,
            body: req.body,
            params: req.params
          },
          ipAddress: req.ip,
          userAgent: req.get('user-agent')
        }).catch(err => console.error('Audit log error:', err));
      }
      
      return res.send(data);
    };
    
    next();
  };
};

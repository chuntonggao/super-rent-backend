const _db = require('../db').getDb();
const log = require('../util/log');
const dataHandler = require('../util/dataHandler');

exports.getAllVehicles = (req, res, next) => {
    _db.query(
        `
            SELECT * FROM vehicle LIMIT 1000;
        `,
        (err, data) => {
            if (err) {
                log.error(err);
                next(err);
            }
            else {
                const totalCount = data.length;
                if (req.query._start && req.query._end)
                    data = dataHandler.paginate(data, req);
                res
                    .status(200)
                    .set({
                        'X-Total-Count': totalCount,

                        'Access-Control-Expose-Headers': [
                            'X-Total-Count'
                        ]
                    })
                    .json(data);
            }
        }
    );
};

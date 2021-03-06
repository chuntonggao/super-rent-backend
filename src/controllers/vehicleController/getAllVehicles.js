const _db = require('../../db').getDb();
const log = require('../../util/log');
const SuperRentError = require('../../util/SuperRentError');
const moment = require('moment');

const getAllVehicles = async (req, res, next) => {
    // prepare query
    let query =
        'SELECT * FROM vehicles as V INNER JOIN vehicleTypes USING (vehicleTypeName)';

    // prepare query: filtering based on city, vehicle type, to / from dates
    const city = req.query.city ? req.query.city : null;
    const status = req.query.status ? req.query.status : null;
    const vehicleTypeName = req.query.vehicleTypeName
        ? req.query.vehicleTypeName
        : null;
    const fromDate = req.query.fromDate ? req.query.fromDate : null;
    const toDate = req.query.toDate ? req.query.toDate : null;
    if (fromDate !== null && toDate !== null) {
        if (moment(fromDate).isAfter(toDate))
            throw new SuperRentError({
                message: 'From date cannot be after until date',
                statusCode: 500
            });
    }
    query += ` 
        WHERE V.city <> "just a placeholder"
               ${city !== null ? ` AND V.city = "${city}"` : ''}
               ${
                   status !== null && status !== 'all'
                       ? ` AND V.status = "${status}"`
                       : ''
               }
               ${
                   vehicleTypeName !== null
                       ? ` AND V.vehicleTypeName = "${vehicleTypeName}"`
                       : ''
               }
               ${
                   fromDate !== null && toDate !== null
                       ? ` AND V.status <> "maintenance"
                                                            AND V.vehicleLicence NOT IN 
                                                                                 (SELECT R.vehicleLicence from rents as R 
                                                                                 WHERE "${fromDate}" < R.toDate 
                                                                                       AND "${toDate}" > R.fromDate)`
                       : ''
               }
    `;

    log.info(query);

    // prepare query: sorting
    if (req.query._sort && req.query._order) {
        const sort = req.query._sort === 'id' ? 'vehicleLicence' : req.query._sort;
        const order = req.query._order;
        query += ` ORDER BY ${sort} ${order}`;
    }

    // // prepare query: pagination
    // if (req.query._start && req.query._end) {
    //     const start = req.query._start;
    //     const end = req.query._end;
    //     const numRows = end - start;
    //     query += ` LIMIT ${start}, ${numRows}`;
    // }

    // send query
    let results = await _db.query(query);

    // prepare response
    results = JSON.parse(JSON.stringify(results));
    let vehicles = results[0];
    const numVehicles = vehicles.length;
    // const totalCount = vehicles.length;

    // pagination
    if (req.query._start && req.query._end) {
        const start = req.query._start;
        const end = req.query._end;
        vehicles = vehicles.slice(start, end);
    }

    vehicles = vehicles.map(vehicle => {
        vehicle.id = vehicle.vehicleLicence;
        return vehicle;
    });

    // results = await _db.query('SELECT COUNT(*) FROM vehicles');
    // results = JSON.parse(JSON.stringify(results));
    // const numVehicles = results[0][0]['COUNT(*)'];

    // send response
    res.status(200)
        .set({
            'X-Total-Count': numVehicles,
            'Access-Control-Expose-Headers': ['X-Total-Count']
        })
        .json(vehicles);
};

module.exports = getAllVehicles;

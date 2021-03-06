const _db = require('../../db').getDb();

const getRent = async (req, res, next) => {
    // prepare & send query
    const rentId = req.params.id;
    let results = await _db.query(`SELECT * FROM rents where rentId = '${rentId}';`);

    // prepare response
    results = JSON.parse(JSON.stringify(results));
    const rent = results[0][0];
    rent.id = rent.rentId;

    results = await _db.query(
        `SELECT rentId from returns WHERE rentId = "${rentId}"`
    );
    results = JSON.parse(JSON.stringify(results));
    rent.isReturned = results[0].length !== 0;

    // send response
    res.status(200)
        .set({
            'X-Total-Count': 1,
            'Access-Control-Expose-Headers': ['X-Total-Count']
        })
        .json(rent);
};

module.exports = getRent;

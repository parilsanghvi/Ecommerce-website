const {
    json
} = require("express/lib/response");

class Apifeatures {
    constructor(query, querystr) {
        this.query = query
        this.querystr = querystr
    }
    search() {
        const keyword = this.querystr.keyword ? {
            name: {
                $regex: this.querystr.keyword,
                $options: "i",
            }
        } : {}
        this.query = this.query.find({
            ...keyword
        })
        return this;
    }
    filter() {
        const queryCopy = { ...this.querystr };
        // remove some fields for category
        const removeFields = ["keyword", "page", "limit"];

        removeFields.forEach((key) => delete queryCopy[key]);

        // Case insensitive filter for category
        if (queryCopy.category) {
            queryCopy.category = {
                $regex: queryCopy.category,
                $options: "i",
            };
        }

        // Filter For Price and Rating
        let queryStr = JSON.stringify(queryCopy);
        queryStr = queryStr.replace(/\b(gt|gte|lt|lte)\b/g, (key) => `$${key}`);

        let queryObj = JSON.parse(queryStr);

        // Convert numeric strings to numbers for filtering
        for (let key in queryObj) {
            if (typeof queryObj[key] === 'object') {
                for (let op in queryObj[key]) {
                    if (!isNaN(queryObj[key][op])) {
                        queryObj[key][op] = Number(queryObj[key][op]);
                    }
                }
            }
        }

        this.query = this.query.find(queryObj);

        return this;
    }
    pagiNation(resultPerPage) {
        const currentPage = Number(this.querystr.page) || 1
        const skip = resultPerPage * (currentPage - 1)
        this.query = this.query.limit(resultPerPage).skip(skip)
        return this;
    }
}
module.exports = Apifeatures
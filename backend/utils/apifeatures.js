// Helper function to escape regex characters
function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

// Known categories for optimized exact matching
// This list should be kept in sync with the frontend (frontend/src/component/Product/Products.jsx)
const KNOWN_CATEGORIES = [
    "Laptop",
    "Footwear",
    "Bottom",
    "Tops",
    "Attire",
    "Camera",
    "SmartPhones",
];

class Apifeatures {
    constructor(query, querystr) {
        this.query = query
        this.querystr = querystr
    }
    search() {
        const keyword = this.querystr.keyword ? {
            $text: {
                $search: this.querystr.keyword,
                $caseSensitive: false,
                $diacriticSensitive: false
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

        // Filter For Price and Rating
        let queryStr = JSON.stringify(queryCopy);
        queryStr = queryStr.replace(/\b(gt|gte|lt|lte)\b/g, (key) => `$${key}`);

        let queryObj = JSON.parse(queryStr);

        // Convert numeric strings to numbers for filtering
        for (const [key, value] of Object.entries(queryObj)) {
            if (value && typeof value === 'object') {
                for (const [op, val] of Object.entries(value)) {
                    if (!isNaN(val)) {
                        queryObj[key][op] = Number(val);
                    }
                }
            }
        }

        // Case insensitive filter for category
        if (queryObj.category && typeof queryObj.category === 'string') {
            const matchedCategory = KNOWN_CATEGORIES.find(c => c.toLowerCase() === queryObj.category.toLowerCase());

            if (matchedCategory) {
                // Optimization: Use exact match if category is known
                queryObj.category = matchedCategory;
            } else {
                // Fallback: Use regex for unknown categories
                queryObj.category = {
                    $regex: escapeRegex(queryObj.category),
                    $options: "i",
                };
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
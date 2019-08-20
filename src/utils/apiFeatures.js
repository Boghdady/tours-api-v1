class ApiFeatures {
  constructor(mongooseQuery, queryString) {
    this.mongooseQuery = mongooseQuery;
    this.queryString = queryString;
  }

  // A) Advanced Filtering using gte,gt,lte,lt
  filter() {
    // create new object that takes all fields in query string
    const queryObj = { ...this.queryString };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    // delete excluded fields from queryObj if exists
    excludedFields.forEach(el => delete queryObj[el]);

    console.log(queryObj);
    // ======> A) Advanced Filtering using gte,gt,lte,lt
    // Convert object to string
    let queryStr = JSON.stringify(queryObj);
    // replace any (gte,gt,lte,lt) with ($gte,$gt,$lte,$lt)
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);
    console.log(JSON.parse(queryStr));

    // method 1) Filtering using query object (find return query)
    this.mongooseQuery = this.mongooseQuery.find(JSON.parse(queryStr));

    // to return the object, to can do chaining
    return this;
  }

  // B) Sorting (ask + ,desc -)
  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.mongooseQuery = this.mongooseQuery.sort(sortBy);
    } else {
      // default sort
      this.mongooseQuery = this.mongooseQuery.sort('-createdAt');
    }
    // to return the object, to can do chaining
    return this;
  }

  /* C) Fields limiting : allow clients to choose which field
             they wants to get back in the response.
  */
  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.mongooseQuery = this.mongooseQuery.select(fields);
    } else {
      this.mongooseQuery = this.mongooseQuery.select('-__v');
    }
    // to return the object, to can do chaining
    return this;
  }

  /* Pagination
    page=2&limit=10 ==> 1-10 = page 1 , 11-20 = page 2 , 21-30 page 30
  */
  paginate() {
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 100;
    const skip = (page - 1) * limit;

    this.mongooseQuery = this.mongooseQuery.skip(skip).limit(limit);
    // to return the object, to can do chaining
    return this;
  }
}

module.exports = ApiFeatures;
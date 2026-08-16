/* eslint-disable @typescript-eslint/no-explicit-any */
export const infinitePaginate = async (
  model: any,
  query: any,
  skip: number,
  limit: number,
  populate: any[] = [],
  sortCriteria: any = { createdAt: -1 }
) => {
  const baseQuery = {};

  let dbQuery = model.find(query);

  // populate
  populate.forEach((pop) => {
    dbQuery = dbQuery.populate(pop);
  });

  const [data, total, filteredTotal] = await Promise.all([
    dbQuery.skip(skip).limit(limit).sort(sortCriteria),
    model.countDocuments(baseQuery),
    model.countDocuments(query),
  ]);

  return {
    data,
    meta: {
      total,
      filteredTotal,
      skip,
      limit,
      totalPages: Math.ceil(filteredTotal / limit),
      hasMore: skip + data.length < filteredTotal,
    },
  };
};
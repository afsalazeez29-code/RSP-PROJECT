const { listUserActivities } = require('../utils/activity');

const getActivity = async (req, res, next) => {
  try {
    const activities = await listUserActivities(req.user._id, { limit: req.query.limit || 20 });
    return res.json({ success: true, activities });
  } catch (error) {
    return next(error);
  }
};

module.exports = { getActivity };

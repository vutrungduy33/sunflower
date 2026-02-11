const STORAGE_KEY = 'sunflower_mvp_track_events';

function readEvents() {
  try {
    return wx.getStorageSync(STORAGE_KEY) || [];
  } catch (error) {
    return [];
  }
}

function writeEvents(events) {
  wx.setStorageSync(STORAGE_KEY, events);
}

function track(event, payload = {}) {
  const record = {
    event,
    payload,
    eventTime: new Date().toISOString(),
  };
  const events = readEvents();
  const nextEvents = [record, ...events].slice(0, 100);
  writeEvents(nextEvents);
  console.log('[mvp-track]', record);
}

module.exports = {
  track,
};

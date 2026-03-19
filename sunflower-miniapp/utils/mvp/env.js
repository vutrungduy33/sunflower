function getMiniProgramEnvVersion() {
  try {
    if (typeof wx.getAccountInfoSync !== 'function') {
      return '';
    }
    const accountInfo = wx.getAccountInfoSync();
    return `${(accountInfo && accountInfo.miniProgram && accountInfo.miniProgram.envVersion) || ''}`.trim();
  } catch (error) {
    return '';
  }
}

function isDevelopOrTrialEnv() {
  const envVersion = getMiniProgramEnvVersion();
  return envVersion === 'develop' || envVersion === 'trial';
}

module.exports = {
  getMiniProgramEnvVersion,
  isDevelopOrTrialEnv,
};

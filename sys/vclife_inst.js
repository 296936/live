(() => {
  'use strict';

  const runtime = window.VCLifeShow;
  if (!runtime) {
    window.VCardBootstrap?.setState('Failed', new Error('VCLifeShow is unavailable'));
    return;
  }
  // The template scenario supplies all defaults; instances replace only their rules.
  runtime.start();
})();

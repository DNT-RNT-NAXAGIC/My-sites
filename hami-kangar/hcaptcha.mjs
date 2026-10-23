export const HCAPTCHA_SITEKEY = 'de10fe80-bd3c-4fc6-8850-19642db8974c';

let apiPromise;

export function captchaOptions(token) {
  if (typeof token !== 'string' || token.trim() === '') {
    throw new Error('Complete the CAPTCHA before continuing.');
  }
  return { captchaToken: token };
}

export function createHcaptchaController(provider, element, sitekey = HCAPTCHA_SITEKEY) {
  let token = '';
  let widgetId;
  widgetId = provider.render(element, {
    sitekey,
    callback: value => { token = value || ''; },
    'expired-callback': () => { token = ''; },
    'error-callback': () => { token = ''; },
  });

  return {
    getToken: () => token,
    reset() {
      token = '';
      if (widgetId !== undefined && widgetId !== null) provider.reset(widgetId);
    },
  };
}

function loadHcaptchaApi() {
  if (window.hcaptcha) return Promise.resolve(window.hcaptcha);
  if (apiPromise) return apiPromise;

  apiPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://js.hcaptcha.com/1/api.js?render=explicit';
    script.async = true;
    script.defer = true;
    script.onload = () => window.hcaptcha
      ? resolve(window.hcaptcha)
      : reject(new Error('hCaptcha API did not initialize.'));
    script.onerror = () => reject(new Error('Could not load hCaptcha.'));
    document.head.append(script);
  }).catch(error => {
    apiPromise = undefined;
    throw error;
  });

  return apiPromise;
}

export async function mountHcaptcha(element) {
  const provider = await loadHcaptchaApi();
  return createHcaptchaController(provider, element);
}
